import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PaginatedData } from '@nutrifit/shared';
import {
  calcularMeta,
  paginarQuery,
} from 'src/common/helpers/paginacion.helper';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  ListMisTurnosQueryDto,
  MiTurnoResponseDto,
} from 'src/application/turnos/dtos';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  formatArgentinaDate,
  normalizeTimeToHHmm,
} from 'src/common/utils/argentina-datetime.util';
import {
  SocioOrmEntity,
  TurnoOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Injectable()
export class ListMisTurnosUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    userId: number,
    query: ListMisTurnosQueryDto,
  ): Promise<PaginatedData<MiTurnoResponseDto>> {
    const socio = await this.resolveSocioByUserId(userId);

    if (query.especialidad?.trim()) {
      const normalized = query.especialidad.trim().toLowerCase();
      if (!'nutricionista'.includes(normalized)) {
        return {
          data: [],
          pagination: calcularMeta(0, query.page ?? 1, query.limit ?? 10),
        };
      }
    }

    const queryBuilder = this.turnoRepository
      .createQueryBuilder('turno')
      .innerJoinAndSelect('turno.nutricionista', 'nutricionista')
      .andWhere('turno.id_socio = :socioId', {
        socioId: socio.idPersona,
      })
      .andWhere('nutricionista.gimnasioId = :gimnasioId', {
        gimnasioId: this.tenantContext.gimnasioId,
      })
      .orderBy('turno.fechaTurno', 'DESC')
      .addOrderBy('turno.horaTurno', 'DESC');

    if (query.estado?.trim()) {
      const normalizedEstado = query.estado.trim().toUpperCase() as EstadoTurno;
      if (Object.values(EstadoTurno).includes(normalizedEstado)) {
        queryBuilder.andWhere('turno.estadoTurno = :estado', {
          estado: normalizedEstado,
        });
      }
    }

    if (query.desde?.trim()) {
      queryBuilder.andWhere('turno.fechaTurno >= :desde', {
        desde: query.desde,
      });
    }

    if (query.hasta?.trim()) {
      queryBuilder.andWhere('turno.fechaTurno <= :hasta', {
        hasta: query.hasta,
      });
    }

    if (query.profesional?.trim()) {
      const term = `%${query.profesional.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(nutricionista.nombre) LIKE :term OR LOWER(nutricionista.apellido) LIKE :term)',
        { term },
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [total, turnos] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getMany(),
    ]);

    this.logger.log(
      `Mis turnos recuperados para socio ${socio.idPersona}: ${turnos.length} de ${total} total.`,
    );

    const data = turnos.map((turno) => {
      const response = new MiTurnoResponseDto();
      response.idTurno = turno.idTurno;
      response.fechaTurno = formatArgentinaDate(turno.fechaTurno);
      response.horaTurno = normalizeTimeToHHmm(turno.horaTurno);
      response.estadoTurno = turno.estadoTurno;
      response.profesionalId = turno.nutricionista.idPersona ?? 0;
      response.profesionalNombreCompleto =
        `${turno.nutricionista.nombre} ${turno.nutricionista.apellido}`.trim();
      response.especialidad = 'Nutricionista';
      return response;
    });

    return {
      data,
      pagination: calcularMeta(total, page, limit),
    };
  }

  private async resolveSocioByUserId(userId: number): Promise<SocioOrmEntity> {
    const user = await this.usuarioRepository.findOne({
      where: { idUsuario: userId },
      relations: {
        persona: true,
      },
    });

    const personaId = user?.persona?.idPersona;

    if (!personaId) {
      throw new ForbiddenError(
        'El usuario autenticado no tiene un socio asociado.',
      );
    }

    const socio = await this.socioRepository.findOne({
      where: { idPersona: personaId },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(personaId));
    }

    return socio;
  }
}
