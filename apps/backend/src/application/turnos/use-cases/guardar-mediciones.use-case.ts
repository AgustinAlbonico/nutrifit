import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { GuardarMedicionesDto } from '../dtos/guardar-mediciones.dto';

export interface GuardarMedicionesResponse {
  success: boolean;
  imc: number;
  idMedicion: number;
}

@Injectable()
export class GuardarMedicionesUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(MedicionOrmEntity)
    private readonly medicionRepository: Repository<MedicionOrmEntity>,
  ) {}

  async execute(
    turnoId: number,
    dto: GuardarMedicionesDto,
  ): Promise<GuardarMedicionesResponse> {
    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
      relations: ['socio', 'socio.fichaSalud'],
    });

    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }

    // Obtener altura: usar la del DTO si viene, si no buscar la última registrada
    let altura = dto.altura;
    if (!altura) {
      // Buscar la última medición del socio para obtener la altura
      const ultimaMedicion = await this.medicionRepository
        .createQueryBuilder('medicion')
        .innerJoin('medicion.turno', 'turno')
        .innerJoin('turno.socio', 'socio')
        .where('socio.idPersona = :socioId', { socioId: turno.socio.idPersona })
        .orderBy('medicion.createdAt', 'DESC')
        .getOne();
      if (ultimaMedicion) {
        altura = ultimaMedicion.altura;
      } else if (turno.socio?.fichaSalud) {
        // Si no hay mediciones previas, intentar obtener de ficha de salud
        altura = turno.socio.fichaSalud.altura;
      } else {
        throw new BadRequestError(
          'No se encontró altura registrada. Por favor, ingrese la altura.',
        );
      }
    }

    // Calcular IMC: peso (kg) / (altura (cm) / 100)^2
    const alturaEnMetros = altura / 100;
    const imc = parseFloat(
      (dto.peso / (alturaEnMetros * alturaEnMetros)).toFixed(2),
    );

    // Calcular masa magra si hay porcentaje de grasa
    let masaMagra: number | null = null;
    if (dto.porcentajeGrasa !== undefined) {
      masaMagra = parseFloat(
        (dto.peso * (1 - dto.porcentajeGrasa / 100)).toFixed(2),
      );
    }

    const medicion = this.medicionRepository.create({
      peso: dto.peso,
      altura,
      imc,
      perimetroCintura: dto.perimetroCintura ?? null,
      perimetroCadera: dto.perimetroCadera ?? null,
      perimetroBrazo: dto.perimetroBrazo ?? null,
      perimetroMuslo: dto.perimetroMuslo ?? null,
      perimetroPecho: dto.perimetroPecho ?? null,
      pliegueTriceps: dto.pliegueTriceps ?? null,
      pliegueAbdominal: dto.pliegueAbdominal ?? null,
      pliegueMuslo: dto.pliegueMuslo ?? null,
      porcentajeGrasa: dto.porcentajeGrasa ?? null,
      masaMagra,
      frecuenciaCardiaca: dto.frecuenciaCardiaca ?? null,
      tensionSistolica: dto.tensionSistolica ?? null,
      tensionDiastolica: dto.tensionDiastolica ?? null,
      notasMedicion: dto.notasMedicion ?? null,
      turno,
    });

    const savedMedicion = await this.medicionRepository.save(medicion);

    return {
      success: true,
      imc,
      idMedicion: savedMedicion.idMedicion,
    };
  }
}
