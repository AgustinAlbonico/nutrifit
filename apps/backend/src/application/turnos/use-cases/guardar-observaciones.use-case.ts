import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { ObservacionClinicaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/observacion-clinica.entity';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { GuardarObservacionesDto } from '../dtos/guardar-observaciones.dto';

export type GuardarObservacionesInput = GuardarObservacionesDto;

@Injectable()
export class GuardarObservacionesUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(ObservacionClinicaOrmEntity)
    private readonly observacionRepository: Repository<ObservacionClinicaOrmEntity>,
  ) {}

  async execute(
    turnoId: number,
    dto: GuardarObservacionesDto,
  ): Promise<{ success: boolean }> {
    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
      relations: ['observacionClinica'],
    });

    if (!turno) {
      throw new BadRequestError('Turno no encontrado');
    }

    if (turno.consultaFinalizadaAt !== null) {
      throw new BadRequestError(
        'No se pueden agregar observaciones a una consulta ya finalizada',
      );
    }

    if (turno.estadoTurno !== EstadoTurno.EN_CURSO) {
      throw new BadRequestError(
        `Solo se pueden guardar observaciones durante una consulta en curso. Estado actual: ${turno.estadoTurno}`,
      );
    }

    // Si ya existe observación, actualizar
    if (turno.observacionClinica) {
      turno.observacionClinica.comentario = dto.comentario;
      turno.observacionClinica.sugerencias = dto.sugerencias ?? null;
      turno.observacionClinica.habitosSocio = dto.habitosSocio ?? null;
      turno.observacionClinica.objetivosSocio = dto.objetivosSocio ?? null;
      turno.observacionClinica.esPublica = dto.esPublica ?? false;

      await this.observacionRepository.save(turno.observacionClinica);
    } else {
      // Crear nueva observación (necesitamos peso, altura, imc de las mediciones más recientes)
      const medicionReciente = await this.turnoRepository
        .createQueryBuilder('turno')
        .innerJoinAndSelect('turno.mediciones', 'medicion')
        .where('turno.idTurno = :turnoId', { turnoId })
        .orderBy('medicion.createdAt', 'DESC')
        .getOne();

      if (
        !medicionReciente?.mediciones ||
        medicionReciente.mediciones.length === 0
      ) {
        throw new BadRequestError(
          'No se puede crear observación sin mediciones previas',
        );
      }

      const ultimaMedicion = medicionReciente.mediciones[0];

      const observacion = this.observacionRepository.create({
        comentario: dto.comentario,
        peso: ultimaMedicion.peso,
        altura: ultimaMedicion.altura,
        imc: ultimaMedicion.imc,
        sugerencias: dto.sugerencias ?? null,
        habitosSocio: dto.habitosSocio ?? null,
        objetivosSocio: dto.objetivosSocio ?? null,
        esPublica: dto.esPublica ?? false,
        turno: turno as any,
      });

      await this.observacionRepository.save(observacion);
    }

    return { success: true };
  }
}
