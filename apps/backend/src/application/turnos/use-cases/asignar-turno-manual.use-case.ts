import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { AsignarTurnoManualDto } from 'src/application/turnos/dtos/asignar-turno-manual.dto';
import { TurnoOperacionResponseDto } from 'src/application/turnos/dtos/turno-operacion-response.dto';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  formatArgentinaDate,
  normalizeTimeToHHmm,
  parseArgentinaDateInput,
} from 'src/common/utils/argentina-datetime.util';
import {
  NutricionistaOrmEntity,
  SocioOrmEntity,
  TurnoOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { ValidacionesCreacionTurno } from '../helpers/validaciones-creacion-turno.helper';

@Injectable()
export class AsignarTurnoManualUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaOrmRepository: Repository<NutricionistaOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly notificacionesService: NotificacionesService,
    private readonly tenantContext: TenantContextService,
    private readonly validaciones: ValidacionesCreacionTurno,
  ) {}

  async execute(
    nutricionistaId: number,
    payload: AsignarTurnoManualDto,
  ): Promise<TurnoOperacionResponseDto> {
    const nutricionista =
      await this.nutricionistaRepository.findById(nutricionistaId);

    if (!nutricionista) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    if (nutricionista.fechaBaja) {
      throw new BadRequestError(
        'No se puede asignar turnos a un profesional suspendido.',
      );
    }

    const socio = await this.socioRepository.findOne({
      where: { idPersona: payload.socioId },
      relations: { fichaSalud: true },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(payload.socioId));
    }

    // Validación: verificar que el paciente tenga ficha de salud cargada.
    // El chequeo de "completada" se delega al modulo de fichaSalud
    // (no es responsabilidad de este use-case).
    if (!socio.fichaSalud) {
      throw new BadRequestError(
        'El paciente debe completar su ficha de salud antes de reservar un turno.',
      );
    }

    const fechaTurno = parseArgentinaDateInput(payload.fechaTurno);
    const horaTurno = normalizeTimeToHHmm(payload.horaTurno);

    await this.validaciones.validarFechaNoPasadoSimple(fechaTurno);
    await this.validaciones.validarAgendaDisponible(
      nutricionistaId,
      fechaTurno,
      horaTurno,
    );
    await this.validaciones.validarNoConflictoSlot(
      nutricionistaId,
      fechaTurno,
      horaTurno,
    );

    const nutricionistaOrm = await this.nutricionistaOrmRepository.findOne({
      where: { idPersona: nutricionistaId },
    });

    if (!nutricionistaOrm) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    const turno = new TurnoOrmEntity();
    turno.fechaTurno = fechaTurno;
    turno.horaTurno = horaTurno;
    turno.estadoTurno = EstadoTurno.CONFIRMADO;
    turno.socio = socio;
    turno.nutricionista = nutricionistaOrm;

    const turnoCreado = await this.turnoRepository.save(turno);

    if (socio.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: socio.idPersona,
        tipo: TipoNotificacion.TURNO_RESERVADO,
        titulo: 'Nuevo turno asignado',
        mensaje: `Te asignaron un turno para el ${formatArgentinaDate(turnoCreado.fechaTurno)} a las ${normalizeTimeToHHmm(turnoCreado.horaTurno)}.`,
        metadata: { turnoId: turnoCreado.idTurno },
      });
    }

    this.logger.log(
      `Turno manual asignado. Turno=${turnoCreado.idTurno}, profesional=${nutricionistaId}, socio=${payload.socioId}.`,
    );

    return this.toResponseDto(turnoCreado);
  }

  private toResponseDto(turno: TurnoOrmEntity): TurnoOperacionResponseDto {
    const response = new TurnoOperacionResponseDto();
    response.idTurno = turno.idTurno;
    response.fechaTurno = formatArgentinaDate(turno.fechaTurno);
    response.horaTurno = normalizeTimeToHHmm(turno.horaTurno);
    response.estadoTurno = turno.estadoTurno;
    response.socioId = turno.socio.idPersona ?? 0;
    response.nutricionistaId = turno.nutricionista.idPersona ?? 0;
    return response;
  }
}
