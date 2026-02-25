import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AgendaEntity } from 'src/domain/entities/Agenda/agenda.entity';
import { IAgendaRepository } from 'src/domain/entities/Agenda/agenda.repository';
import { Repository } from 'typeorm';
import { AgendaOrmEntity } from '../entities/agenda.entity';
import { NutricionistaOrmEntity } from '../entities/persona.entity';

@Injectable()
export class AgendaRepositoryImplementation implements IAgendaRepository {
  constructor(
    @InjectRepository(AgendaOrmEntity)
    private readonly agendaRepository: Repository<AgendaOrmEntity>,
  ) {}

  async findByNutricionistaId(
    nutricionistaId: number,
  ): Promise<AgendaEntity[]> {
    const agendas = await this.agendaRepository.find({
      where: {
        nutricionista: {
          idPersona: nutricionistaId,
        },
      },
      order: {
        dia: 'ASC',
        horaInicio: 'ASC',
      },
    });

    return agendas.map((agenda) => this.toDomainEntity(agenda));
  }

  async replaceByNutricionistaId(
    nutricionistaId: number,
    agendas: AgendaEntity[],
  ): Promise<AgendaEntity[]> {
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
