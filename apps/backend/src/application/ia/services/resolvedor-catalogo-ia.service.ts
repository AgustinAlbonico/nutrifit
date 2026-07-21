import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { GrupoAlimenticioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity';
import {
  normalizarTexto,
  obtenerClavesBusquedaAlimento,
  coincidenciaFuzzy,
} from './util-matching-ia';
import type { AlimentoNuevoDto } from 'src/application/ai/dto/alimento-nuevo.dto';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
import { BuscadorMacrosOpenFoodFacts } from 'src/infrastructure/alimentos/buscador-macros-openfoodfacts.service';

export interface AlimentoCatalogo {
  idAlimento: number;
  nombre: string;
}

export interface CategoriaCatalogo {
  idGrupoAlimenticio: number;
  descripcion: string;
}

export interface ResolucionResultado {
  mapa: Map<string, number>;
  creados: Array<{ nombre: string; idAlimento: number; categoria: string }>;
}

const UMBRAL_FUZZY = 0.85;
const UMBRAL_CATEGORIA = 0.7;

@Injectable()
export class ResolvedorCatalogoIA {
  constructor(
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
    @InjectRepository(GrupoAlimenticioOrmEntity)
    private readonly grupoRepo: Repository<GrupoAlimenticioOrmEntity>,
    private readonly buscadorMacros: BuscadorMacrosOpenFoodFacts,
  ) {}

  async resolver(
    nombresUsados: string[],
    alimentosNuevos: AlimentoNuevoDto[],
    catalogoExistente: AlimentoCatalogo[],
    categoriasExistentes: CategoriaCatalogo[],
  ): Promise<ResolucionResultado> {
    const mapa = new Map<string, number>();
    const creados: Array<{
      nombre: string;
      idAlimento: number;
      categoria: string;
    }> = [];

    const catalogoPorNombre = new Map<string, AlimentoCatalogo>();
    for (const alimento of catalogoExistente) {
      const clave = normalizarTexto(alimento.nombre);
      catalogoPorNombre.set(clave, alimento);
    }

    const catalogoPorNombreFuzzy: Array<{
      nombre: string;
      item: AlimentoCatalogo;
    }> = catalogoExistente.map((a) => ({ nombre: a.nombre, item: a }));

    const categoriasPorDescripcion = new Map<string, CategoriaCatalogo>();
    for (const cat of categoriasExistentes) {
      categoriasPorDescripcion.set(normalizarTexto(cat.descripcion), cat);
    }

    for (const nombreOriginal of nombresUsados) {
      const nombreNormalizado = normalizarTexto(nombreOriginal);

      // Nivel 1: EXACTO normalizado
      let match = this.buscarExacto(nombreNormalizado, catalogoPorNombre);
      if (match !== null) {
        mapa.set(nombreOriginal, match);
        continue;
      }

      // Nivel 2: FUZZY ≥ 0.85
      match = this.buscarFuzzy(
        nombreOriginal,
        nombreNormalizado,
        catalogoPorNombreFuzzy,
      );
      if (match !== null) {
        mapa.set(nombreOriginal, match);
        continue;
      }

      // Nivel 3: crear nuevo
      const declaracion = alimentosNuevos.find(
        (a) => normalizarTexto(a.nombre) === nombreNormalizado,
      );

      if (!declaracion) {
        let declaracionFallback: AlimentoNuevoDto = {
          nombre: nombreOriginal,
          categoriaNombre: '',
          cantidadBase: 100,
          unidadBase: 'g',
          calorias: null,
          proteinas: null,
          carbohidratos: null,
          grasas: null,
        };

        // Fallback a Open Food Facts: si la IA no declaró el alimento con
        // sus macros, intentamos estimarlos desde una API externa para no
        // guardar nulls en la DB. Si OFF no responde o no tiene el
        // alimento, se mantienen los nulls como último recurso.
        const macrosEstimadas =
          await this.buscadorMacros.buscarMacrosPorNombre(nombreOriginal);
        if (macrosEstimadas) {
          declaracionFallback = {
            ...declaracionFallback,
            calorias: macrosEstimadas.calorias,
            proteinas: macrosEstimadas.proteinas,
            carbohidratos: macrosEstimadas.carbohidratos,
            grasas: macrosEstimadas.grasas,
            cantidadBase: macrosEstimadas.cantidad,
            unidadBase: macrosEstimadas.unidadMedida,
          };
        }

        const idCategoriaFallback = this.resolverCategoria(
          '',
          categoriasExistentes,
          categoriasPorDescripcion,
        );
        const nuevo = await this.crearAlimento(
          declaracionFallback,
          idCategoriaFallback,
        );
        catalogoPorNombre.set(nombreNormalizado, {
          idAlimento: nuevo.idAlimento,
          nombre: nuevo.nombre,
        });
        catalogoPorNombreFuzzy.push({ nombre: nuevo.nombre, item: nuevo });
        mapa.set(nombreOriginal, nuevo.idAlimento);
        creados.push({
          nombre: nombreOriginal,
          idAlimento: nuevo.idAlimento,
          categoria: '(auto-creado sin declaración)',
        });
        continue;
      }

      const idCategoria = this.resolverCategoria(
        declaracion.categoriaNombre,
        categoriasExistentes,
        categoriasPorDescripcion,
      );
      const nuevo = await this.crearAlimento(declaracion, idCategoria);
      catalogoPorNombre.set(nombreNormalizado, {
        idAlimento: nuevo.idAlimento,
        nombre: nuevo.nombre,
      });
      catalogoPorNombreFuzzy.push({ nombre: nuevo.nombre, item: nuevo });
      mapa.set(nombreOriginal, nuevo.idAlimento);
      creados.push({
        nombre: declaracion.nombre,
        idAlimento: nuevo.idAlimento,
        categoria: declaracion.categoriaNombre,
      });
    }

    return { mapa, creados };
  }

  private buscarExacto(
    nombreNormalizado: string,
    catalogoPorNombre: Map<string, AlimentoCatalogo>,
  ): number | null {
    // Intentar clave exacta normalizada
    if (catalogoPorNombre.has(nombreNormalizado)) {
      return catalogoPorNombre.get(nombreNormalizado)!.idAlimento;
    }

    // Intentar con singularización
    const claves = obtenerClavesBusquedaAlimento(nombreNormalizado);
    for (const clave of claves) {
      if (catalogoPorNombre.has(clave)) {
        return catalogoPorNombre.get(clave)!.idAlimento;
      }
    }

    return null;
  }

  private buscarFuzzy(
    nombreOriginal: string,
    nombreNormalizado: string,
    catalogoFuzzy: Array<{ nombre: string; item: AlimentoCatalogo }>,
  ): number | null {
    let mejorScore = UMBRAL_FUZZY;
    let mejorId: number | null = null;

    for (const { nombre, item } of catalogoFuzzy) {
      const score = coincidenciaFuzzy(nombreOriginal, nombre);
      if (score >= UMBRAL_FUZZY && score > mejorScore) {
        mejorScore = score;
        mejorId = item.idAlimento;
      }
    }

    // Desempate alfabético
    if (mejorId !== null) {
      const empate = catalogoFuzzy.filter(
        (f) =>
          coincidenciaFuzzy(nombreOriginal, f.nombre) === mejorScore &&
          coincidenciaFuzzy(nombreOriginal, f.nombre) >= UMBRAL_FUZZY,
      );
      if (empate.length > 1) {
        empate.sort((a, b) => a.nombre.localeCompare(b.nombre));
        mejorId = empate[0].item.idAlimento;
      }
    }

    return mejorId;
  }

  private resolverCategoria(
    categoriaNombre: string,
    categoriasExistentes: CategoriaCatalogo[],
    categoriasPorDescripcion: Map<string, CategoriaCatalogo>,
  ): number {
    const normalizada = normalizarTexto(categoriaNombre);
    if (categoriasPorDescripcion.has(normalizada)) {
      return categoriasPorDescripcion.get(normalizada)!.idGrupoAlimenticio;
    }

    // Fuzzy contra las existentes
    let mejorScore = UMBRAL_CATEGORIA;
    let mejorId: number | null = null;

    for (const cat of categoriasExistentes) {
      const score = coincidenciaFuzzy(categoriaNombre, cat.descripcion);
      if (score >= UMBRAL_CATEGORIA && score > mejorScore) {
        mejorScore = score;
        mejorId = cat.idGrupoAlimenticio;
      }
    }

    if (mejorId !== null) {
      return mejorId;
    }

    // fallback: asignar la primera categoría (más genérica)
    return categoriasExistentes[0]?.idGrupoAlimenticio ?? 1;
  }

  private async crearAlimento(
    declaracion: AlimentoNuevoDto,
    idCategoria: number,
  ): Promise<AlimentoOrmEntity> {
    const nombreCapitalizado =
      declaracion.nombre.charAt(0).toUpperCase() + declaracion.nombre.slice(1);

    const existente = await this.buscarPorNombreNormalizado(nombreCapitalizado);
    if (existente) {
      return existente;
    }

    const entity = new AlimentoOrmEntity();
    entity.nombre = nombreCapitalizado;
    entity.cantidad = declaracion.cantidadBase ?? 100;
    entity.unidadMedida = this.mapearUnidad(declaracion.unidadBase ?? 'g');
    entity.calorias = declaracion.calorias ?? null;
    entity.proteinas = declaracion.proteinas ?? null;
    entity.carbohidratos = declaracion.carbohidratos ?? null;
    entity.grasas = declaracion.grasas ?? null;
    entity.grupoAlimenticio = [
      { idGrupoAlimenticio: idCategoria } as GrupoAlimenticioOrmEntity,
    ];

    try {
      return await this.alimentoRepo.save(entity);
    } catch (error) {
      if (!this.esErrorNombreDuplicado(error)) {
        throw error;
      }

      const alimentoExistente =
        await this.buscarPorNombreNormalizado(nombreCapitalizado);
      if (alimentoExistente) {
        return alimentoExistente;
      }

      throw error;
    }
  }

  private async buscarPorNombreNormalizado(
    nombre: string,
  ): Promise<AlimentoOrmEntity | null> {
    const claves = obtenerClavesBusquedaAlimento(nombre);
    if (claves.length === 0) {
      return null;
    }

    return this.alimentoRepo
      .createQueryBuilder('alimento')
      .where('LOWER(alimento.nombre) IN (:...claves)', { claves })
      .getOne();
  }

  private esErrorNombreDuplicado(error: unknown): boolean {
    const candidato = error as {
      code?: string;
      errno?: number;
      driverError?: { code?: string; errno?: number; message?: string };
    };
    const codigo = candidato.code ?? candidato.driverError?.code;
    const errno = candidato.errno ?? candidato.driverError?.errno;
    const mensaje =
      error instanceof Error ? error.message : candidato.driverError?.message;

    return (
      codigo === 'ER_DUP_ENTRY' ||
      errno === 1062 ||
      (mensaje?.includes('uq_alimento_nombre') ?? false)
    );
  }

  private mapearUnidad(unidad: string): UnidadMedida {
    const mapa: Record<string, UnidadMedida> = {
      g: UnidadMedida.GRAMO,
      gramo: UnidadMedida.GRAMO,
      gramos: UnidadMedida.GRAMO,
      ml: UnidadMedida.MILILITRO,
      mililitro: UnidadMedida.MILILITRO,
      mililitros: UnidadMedida.MILILITRO,
      l: UnidadMedida.LITRO,
      litro: UnidadMedida.LITRO,
      litros: UnidadMedida.LITRO,
      kg: UnidadMedida.KILOGRAMO,
      kilogramo: UnidadMedida.KILOGRAMO,
      kilogramos: UnidadMedida.KILOGRAMO,
      mg: UnidadMedida.MILIGRAMO,
      miligramo: UnidadMedida.MILIGRAMO,
      miligramos: UnidadMedida.MILIGRAMO,
      taza: UnidadMedida.TAZA,
      tazas: UnidadMedida.TAZA,
      cucharada: UnidadMedida.CUCHARADA,
      cucharadas: UnidadMedida.CUCHARADA,
      cucharadita: UnidadMedida.CUCHARADITA,
      cucharaditas: UnidadMedida.CUCHARADITA,
      unidad: UnidadMedida.UNIDAD,
      unidades: UnidadMedida.UNIDAD,
    };

    return mapa[unidad.toLowerCase()] ?? UnidadMedida.GRAMO;
  }
}
