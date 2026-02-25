import { Injectable } from '@nestjs/common';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { ObjetivoEntity } from 'src/domain/entities/Objetivo/objetivo.entity';
import { ObjetivoRepository } from 'src/infrastructure/persistence/typeorm/repositories/objetivo.repository';
import {
  ActualizarObjetivoDto,
  ObjetivoResponseDto,
} from '../dtos/objetivo.dto';

@Injectable()
export class ActualizarObjetivoUseCase {
  constructor(private readonly objetivoRepository: ObjetivoRepository) {}

  async execute(
    objetivoId: number,
    payload: ActualizarObjetivoDto,
  ): Promise<ObjetivoResponseDto> {
    const objetivo = await this.objetivoRepository.findById(objetivoId);

    if (!objetivo) {
      throw new NotFoundError('Objetivo', String(objetivoId));
    }

    const valorActual = Number(payload.valorActual);
    const valorObjetivo = Number(objetivo.valorObjetivo);

    const objetivoActualizado = await this.objetivoRepository.save({
      ...objetivo,
      valorActual,
      estado: valorActual === valorObjetivo ? 'COMPLETADO' : objetivo.estado,
      updatedAt: new Date(),
    });

    return this.toResponse(objetivoActualizado);
  }

  private toResponse(objetivo: {
    idObjetivo: number;
    socio: { idPersona: number | null };
    tipoMetrica: ObjetivoResponseDto['tipoMetrica'];
    valorInicial: number;
    valorActual: number;
    valorObjetivo: number;
    estado: ObjetivoResponseDto['estado'];
    fechaInicio: Date;
    fechaObjetivo: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): ObjetivoResponseDto {
    const socioId = objetivo.socio.idPersona ?? 0;

    const entity = new ObjetivoEntity(
      objetivo.idObjetivo,
      socioId,
      objetivo.tipoMetrica,
      Number(objetivo.valorInicial),
      Number(objetivo.valorObjetivo),
      Number(objetivo.valorActual),
      objetivo.estado,
      objetivo.fechaInicio,
      objetivo.fechaObjetivo,
      objetivo.createdAt,
      objetivo.updatedAt,
    );

    return {
      idObjetivo: objetivo.idObjetivo,
      socioId,
      tipoMetrica: objetivo.tipoMetrica,
      valorInicial: Number(objetivo.valorInicial),
      valorActual: Number(objetivo.valorActual),
      valorObjetivo: Number(objetivo.valorObjetivo),
      estado: objetivo.estado,
      fechaInicio: objetivo.fechaInicio,
      fechaObjetivo: objetivo.fechaObjetivo,
      createdAt: objetivo.createdAt,
      updatedAt: objetivo.updatedAt,
      progreso: entity.calcularProgreso(),
    };
  }
}
