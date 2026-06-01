import { Injectable } from '@nestjs/common';
import { ObjetivoEntity } from 'src/domain/entities/Objetivo/objetivo.entity';
import { ObjetivoRepository } from 'src/infrastructure/persistence/typeorm/repositories/objetivo.repository';
import {
  ListaObjetivosResponseDto,
  ObjetivoResponseDto,
} from '../dtos/objetivo.dto';

@Injectable()
export class ObtenerObjetivosActivosUseCase {
  constructor(private readonly objetivoRepository: ObjetivoRepository) {}

  async execute(socioId: number): Promise<ListaObjetivosResponseDto> {
    const [activos, completados] = await Promise.all([
      this.objetivoRepository.findActivosBySocioId(socioId),
      this.objetivoRepository.findCompletadosBySocioId(socioId),
    ]);

    return {
      activos: activos.map((objetivo) => this.toResponse(objetivo)),
      completados: completados.map((objetivo) => this.toResponse(objetivo)),
    };
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
