import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { ObjetivoEntity } from 'src/domain/entities/Objetivo/objetivo.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { ObjetivoRepository } from 'src/infrastructure/persistence/typeorm/repositories/objetivo.repository';
import { Repository } from 'typeorm';
import { CrearObjetivoDto, ObjetivoResponseDto } from '../dtos/objetivo.dto';

@Injectable()
export class CrearObjetivoUseCase {
  constructor(
    private readonly objetivoRepository: ObjetivoRepository,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
  ) {}

  async execute(payload: CrearObjetivoDto): Promise<ObjetivoResponseDto> {
    const socio = await this.socioRepository.findOne({
      where: { idPersona: payload.socioId },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(payload.socioId));
    }

    const objetivo = await this.objetivoRepository.save({
      socio,
      tipoMetrica: payload.tipoMetrica,
      valorInicial: payload.valorInicial,
      valorActual: payload.valorInicial,
      valorObjetivo: payload.valorObjetivo,
      estado: 'ACTIVO',
      fechaInicio: new Date(),
      fechaObjetivo: payload.fechaObjetivo ?? null,
    });

    return this.toResponse(objetivo);
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
