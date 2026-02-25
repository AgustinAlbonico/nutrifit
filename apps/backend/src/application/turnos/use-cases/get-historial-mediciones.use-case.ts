import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';

export interface MedicionHistorial {
  idMedicion: number;
  fecha: Date;
  peso: number;
  altura: number;
  imc: number;
  perimetroCintura: number | null;
  perimetroCadera: number | null;
  perimetroBrazo: number | null;
  perimetroMuslo: number | null;
  perimetroPecho: number | null;
  pliegueTriceps: number | null;
  pliegueAbdominal: number | null;
  pliegueMuslo: number | null;
  porcentajeGrasa: number | null;
  masaMagra: number | null;
  frecuenciaCardiaca: number | null;
  tensionSistolica: number | null;
  tensionDiastolica: number | null;
  notasMedicion: string | null;
  profesional: {
    id: number | null;
    nombre: string;
    apellido: string;
  } | null;
}

export interface HistorialMedicionesResponse {
  socioId: number;
  nombreSocio: string;
  apellidoSocio: string;
  altura: number;
  mediciones: MedicionHistorial[];
}

@Injectable()
export class GetHistorialMedicionesUseCase {
  constructor(
    @InjectRepository(MedicionOrmEntity)
    private readonly medicionRepository: Repository<MedicionOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
  ) {}

  async execute(socioId: number): Promise<HistorialMedicionesResponse> {
    // Verificar que el socio existe
    const socio = await this.socioRepository.findOne({
      where: { idPersona: socioId },
      relations: ['fichaSalud'],
    });

    if (!socio) {
      throw new NotFoundError('Socio no encontrado');
    }

    // Obtener todas las mediciones del socio ordenadas por fecha descendente
    const mediciones = await this.medicionRepository
      .createQueryBuilder('medicion')
      .innerJoinAndSelect('medicion.turno', 'turno')
      .innerJoinAndSelect('turno.nutricionista', 'nutricionista')
      .innerJoin('turno.socio', 'socio')
      .where('socio.idPersona = :socioId', { socioId })
      .orderBy('medicion.createdAt', 'DESC')
      .getMany();

    // Obtener la última altura registrada
    let ultimaAltura = socio.fichaSalud?.altura ?? 0;
    if (mediciones.length > 0) {
      // Buscar la primera medición que tenga altura
      const medicionConAltura = mediciones.find((m) => m.altura > 0);
      if (medicionConAltura) {
        ultimaAltura = medicionConAltura.altura;
      }
    }

    const medicionesFormateadas: MedicionHistorial[] = mediciones.map((m) => ({
      idMedicion: m.idMedicion,
      fecha: m.createdAt,
      peso: Number(m.peso),
      altura: m.altura,
      imc: Number(m.imc),
      perimetroCintura: m.perimetroCintura ? Number(m.perimetroCintura) : null,
      perimetroCadera: m.perimetroCadera ? Number(m.perimetroCadera) : null,
      perimetroBrazo: m.perimetroBrazo ? Number(m.perimetroBrazo) : null,
      perimetroMuslo: m.perimetroMuslo ? Number(m.perimetroMuslo) : null,
      perimetroPecho: m.perimetroPecho ? Number(m.perimetroPecho) : null,
      pliegueTriceps: m.pliegueTriceps ? Number(m.pliegueTriceps) : null,
      pliegueAbdominal: m.pliegueAbdominal ? Number(m.pliegueAbdominal) : null,
      pliegueMuslo: m.pliegueMuslo ? Number(m.pliegueMuslo) : null,
      porcentajeGrasa: m.porcentajeGrasa ? Number(m.porcentajeGrasa) : null,
      masaMagra: m.masaMagra ? Number(m.masaMagra) : null,
      frecuenciaCardiaca: m.frecuenciaCardiaca,
      tensionSistolica: m.tensionSistolica,
      tensionDiastolica: m.tensionDiastolica,
      notasMedicion: m.notasMedicion,
      profesional: m.turno.nutricionista
        ? {
            id: m.turno.nutricionista.idPersona,
            nombre: m.turno.nutricionista.nombre,
            apellido: m.turno.nutricionista.apellido,
          }
        : null,
    }));

    return {
      socioId,
      nombreSocio: socio.nombre,
      apellidoSocio: socio.apellido,
      altura: ultimaAltura,
      mediciones: medicionesFormateadas,
    };
  }
}
