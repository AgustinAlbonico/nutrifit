import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { SuscripcionGimnasioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/suscripcion-gimnasio.entity';

export interface EstadoSuscripcionOutput {
  id: number;
  gimnasioId: number;
  estado: string;
  monto: number;
  fechaInicio: Date | null;
  fechaProximoPago: Date | null;
  uuid: string;
}

@Injectable()
export class VerEstadoSuscripcionUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(SuscripcionGimnasioOrmEntity)
    private readonly suscripcionRepo: Repository<SuscripcionGimnasioOrmEntity>,
  ) {}

  async execute(gimnasioId: number): Promise<EstadoSuscripcionOutput> {
    const suscripcion = await this.suscripcionRepo.findOne({
      where: { gimnasioId },
      order: { creadoEn: 'DESC' },
    });
    if (!suscripcion) {
      throw new NotFoundException(
        `No se encontró suscripción para el gimnasio ${gimnasioId}`,
      );
    }
    return {
      id: suscripcion.id,
      gimnasioId: suscripcion.gimnasioId,
      estado: suscripcion.estado,
      monto: Number(suscripcion.monto),
      fechaInicio: suscripcion.fechaInicio,
      fechaProximoPago: suscripcion.fechaProximoPago,
      uuid: suscripcion.uuid,
    };
  }

  async executePorUuid(uuid: string): Promise<EstadoSuscripcionOutput> {
    const suscripcion = await this.suscripcionRepo.findOne({ where: { uuid } });
    if (!suscripcion) throw new NotFoundException('Suscripción no encontrada');
    return {
      id: suscripcion.id,
      gimnasioId: suscripcion.gimnasioId,
      estado: suscripcion.estado,
      monto: Number(suscripcion.monto),
      fechaInicio: suscripcion.fechaInicio,
      fechaProximoPago: suscripcion.fechaProximoPago,
      uuid: suscripcion.uuid,
    };
  }
}
