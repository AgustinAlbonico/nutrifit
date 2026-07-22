import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { SuscripcionGimnasioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/suscripcion-gimnasio.entity';
import { PagoSimuladoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/pago-simulado.entity';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { EstadoGimnasio } from 'src/domain/entities/Gimnasio/gimnasio.entity';
import {
  GIMNASIO_REPOSITORY,
  GimnasioRepository,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';

export interface ProcesarPagoInput {
  uuid: string;
  accion: 'aprobar' | 'rechazar';
}

export interface ProcesarPagoOutput {
  success: boolean;
  estadoSuscripcion: string;
  mensaje: string;
}

@Injectable()
export class ProcesarPagoSimuladoUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(SuscripcionGimnasioOrmEntity)
    private readonly suscripcionRepo: Repository<SuscripcionGimnasioOrmEntity>,
    @InjectRepository(PagoSimuladoOrmEntity)
    private readonly pagoRepo: Repository<PagoSimuladoOrmEntity>,
    @Inject(GIMNASIO_REPOSITORY)
    private readonly gimnasioRepository: GimnasioRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(input: ProcesarPagoInput): Promise<ProcesarPagoOutput> {
    const suscripcion = await this.suscripcionRepo.findOne({
      where: { uuid: input.uuid },
    });
    if (!suscripcion) throw new NotFoundException('Suscripción no encontrada');
    if (suscripcion.estado !== 'pendiente') {
      throw new BadRequestException(
        `La suscripción ya fue procesada (estado: ${suscripcion.estado})`,
      );
    }

    await this.pagoRepo.save(
      this.pagoRepo.create({
        suscripcionGimnasioId: suscripcion.id,
        monto: suscripcion.monto,
        estado: input.accion === 'aprobar' ? 'aprobado' : 'rechazado',
        motivo:
          input.accion === 'rechazar'
            ? 'Pago rechazado por el usuario en simulación'
            : null,
      }),
    );

    if (input.accion === 'aprobar') {
      const ahora = new Date();
      const proximoPago = new Date(ahora);
      proximoPago.setMonth(proximoPago.getMonth() + 1);
      suscripcion.estado = 'activa';
      suscripcion.fechaInicio = ahora;
      suscripcion.fechaProximoPago = proximoPago;
      await this.suscripcionRepo.save(suscripcion);
      await this.gimnasioRepository.update(suscripcion.gimnasioId, {
        estado: EstadoGimnasio.ACTIVO,
      });
      this.logger.log(
        `Suscripción ${suscripcion.id} activada (gimnasio ${suscripcion.gimnasioId})`,
      );
      return {
        success: true,
        estadoSuscripcion: 'activa',
        mensaje: '¡Pago aprobado! La suscripción está activa.',
      };
    } else {
      suscripcion.estado = 'cancelada';
      await this.suscripcionRepo.save(suscripcion);
      await this.gimnasioRepository.update(suscripcion.gimnasioId, {
        estado: EstadoGimnasio.SUSPENDIDO,
      });
      this.logger.log(
        `Suscripción ${suscripcion.id} cancelada por rechazo (gimnasio ${suscripcion.gimnasioId})`,
      );
      return {
        success: false,
        estadoSuscripcion: 'cancelada',
        mensaje: 'Pago rechazado. La suscripción no fue activada.',
      };
    }
  }
}
