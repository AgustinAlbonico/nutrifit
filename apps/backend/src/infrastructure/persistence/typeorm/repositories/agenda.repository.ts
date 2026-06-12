import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AgendaEntity } from 'src/domain/entities/Agenda/agenda.entity';
import { IAgendaRepository } from 'src/domain/entities/Agenda/agenda.repository';
import { Repository } from 'typeorm';
import { AgendaOrmEntity } from '../entities/agenda.entity';
import { NutricionistaOrmEntity } from '../entities/persona.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class AgendaRepositoryImplementation implements IAgendaRepository {
  constructor(
    @InjectRepository(AgendaOrmEntity)
    private readonly agendaRepository: Repository<AgendaOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepository: Repository<NutricionistaOrmEntity>,
    private readonly tenantContext?: TenantContextService,
  ) {}

  async findByNutricionistaId(
    nutricionistaId: number,
  ): Promise<AgendaEntity[]> {
    const gimnasioIdActual = this.tenantContext?.isInitialized
      ? this.tenantContext.gimnasioId
      : undefined;

    const relaciones = await this.agendaRepository.find({
      where: {
        nutricionista: {
          idPersona: nutricionistaId,
          ...(gimnasioIdActual !== undefined && {
            gimnasioId: gimnasioIdActual,
          }),
        },
      },
      order: {
        dia: 'ASC',
        horaInicio: 'ASC',
      },
    });

    return relaciones.map((agenda) => this.toDomainEntity(agenda));
  }

  async replaceByNutricionistaId(
    nutricionistaId: number,
    agendas: AgendaEntity[],
  ): Promise<AgendaEntity[]> {
    const gimnasioIdActual = this.tenantContext?.isInitialized
      ? this.tenantContext.gimnasioId
      : undefined;

    // Validate ownership against the authoritative nutricionista owner record,
    // not existing agenda rows. This prevents cross-tenant writes even when
    // the foreign nutricionista has zero agenda rows.
    if (gimnasioIdActual !== undefined) {
      const ownerNutri = await this.nutricionistaRepository.findOne({
        where: { idPersona: nutricionistaId },
        select: ['idPersona', 'gimnasioId'],
      });

      if (!ownerNutri) {
        throw new BadRequestError('Nutricionista no encontrado');
      }

      if (ownerNutri.gimnasioId !== gimnasioIdActual) {
        throw new BadRequestError(
          'No tienes permiso para modificar la agenda de este nutricionista',
        );
      }
    }

    await this.agendaRepository
      .createQueryBuilder()
      .delete()
      .from(AgendaOrmEntity)
      .where('id_nutricionista = :nutricionistaId', { nutricionistaId })
      .execute();

    const toCreate = agendas.map((agenda) =>
      this.toOrmEntity(nutricionistaId, agenda),
    );

    const saved = await this.agendaRepository.save(toCreate);

    return saved.map((agenda) => this.toDomainEntity(agenda));
  }

  private toDomainEntity(ormEntity: AgendaOrmEntity): AgendaEntity {
    return new AgendaEntity(
      ormEntity.idAgenda,
      ormEntity.dia,
      ormEntity.horaInicio,
      ormEntity.horaFin,
      ormEntity.duracionTurno,
    );
  }

  private toOrmEntity(
    nutricionistaId: number,
    agenda: AgendaEntity,
  ): AgendaOrmEntity {
    const nutricionista = new NutricionistaOrmEntity();
    nutricionista.idPersona = nutricionistaId;

    const agendaOrmEntity = new AgendaOrmEntity();
    agendaOrmEntity.dia = agenda.dia;
    agendaOrmEntity.horaInicio = agenda.horaInicio;
    agendaOrmEntity.horaFin = agenda.horaFin;
    agendaOrmEntity.duracionTurno = agenda.duracionTurno;
    agendaOrmEntity.nutricionista = nutricionista;

    return agendaOrmEntity;
  }
}
