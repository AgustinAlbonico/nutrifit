import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreparacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/preparacion.entity';
import { PreparacionItemOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/preparacion-item.entity';
import { coincidenciaFuzzy } from './util-matching-ia';

export interface AlternativaParaPreparacion {
  nombre: string;
  alimentos: Array<{
    alimentoId: number;
    cantidad: number;
    unidad: string;
  }>;
}

export interface ResultadoCreacionPreparacion {
  preparacionId: number;
  reutilizada: boolean;
}

const UMBRAL_DEDUP = 0.85;

@Injectable()
export class CreadorPreparacionesIA {
  constructor(
    @InjectRepository(PreparacionOrmEntity)
    private readonly preparacionRepo: Repository<PreparacionOrmEntity>,
  ) {}

  async obtenerOCrear(
    alternativas: AlternativaParaPreparacion[],
    gimnasioId: number,
    nutricionistaId: number,
  ): Promise<Map<string, ResultadoCreacionPreparacion>> {
    const resultados = new Map<string, ResultadoCreacionPreparacion>();

    // Cargar preparaciones existentes del gimnasio para dedup
    const existentes = await this.preparacionRepo.find({
      where: { gimnasioId },
      relations: { items: true },
    });

    const prepPorNombreNorm = new Map<string, PreparacionOrmEntity>();
    for (const prep of existentes) {
      prepPorNombreNorm.set(this.normalizarNombre(prep.nombre), prep);
    }

    for (const alternativa of alternativas) {
      if (alternativa.alimentos.length < 2) continue;
      if (!alternativa.nombre || alternativa.nombre.trim().length === 0)
        continue;

      const result = await this.procesarAlternativa(
        alternativa,
        gimnasioId,
        nutricionistaId,
        prepPorNombreNorm,
      );
      resultados.set(alternativa.nombre, result);
    }

    return resultados;
  }

  private async procesarAlternativa(
    alternativa: AlternativaParaPreparacion,
    gimnasioId: number,
    nutricionistaId: number,
    prepPorNombreNorm: Map<string, PreparacionOrmEntity>,
  ): Promise<ResultadoCreacionPreparacion> {
    const nombreNormalizado = this.normalizarNombre(alternativa.nombre);

    // Buscar por nombre exacto o fuzzy
    let match: PreparacionOrmEntity | null = null;
    let mejorScore = 0;

    for (const [clave, prep] of prepPorNombreNorm) {
      const score = coincidenciaFuzzy(nombreNormalizado, clave);
      if (score >= UMBRAL_DEDUP && score > mejorScore) {
        mejorScore = score;
        match = prep;
      }
    }

    if (match) {
      return { preparacionId: match.idPreparacion, reutilizada: true };
    }

    // Crear nueva preparación
    const nueva = this.preparacionRepo.create({
      nombre: alternativa.nombre,
      gimnasioId,
      creadoPorId: nutricionistaId,
    });

    const guardada = await this.preparacionRepo.save(nueva);

    // Crear los items
    const items: PreparacionItemOrmEntity[] = alternativa.alimentos.map((a) => {
      const item = new PreparacionItemOrmEntity();
      item.preparacionId = guardada.idPreparacion;
      item.alimentoId = a.alimentoId;
      item.cantidadDefault = a.cantidad ?? 100;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      item.unidadDefault = a.unidad as any;
      return item;
    });

    await this.preparacionRepo.manager.save(PreparacionItemOrmEntity, items);

    return { preparacionId: guardada.idPreparacion, reutilizada: false };
  }

  private normalizarNombre(nombre: string): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
  }
}
