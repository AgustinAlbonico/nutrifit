import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlimentoOrmEntity } from '../persistence/typeorm/entities/alimento.entity';
import { TurnoOrmEntity } from '../persistence/typeorm/entities/turno.entity';
import { AlimentosSyncService } from '../alimentos/alimentos-sync.service';
import { AlimentosSyncScheduler } from './alimentos-sync.scheduler';
import { AusenciaTurnoScheduler } from './ausencia-turno.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([TurnoOrmEntity, AlimentoOrmEntity])],
  providers: [
    AusenciaTurnoScheduler,
    AlimentosSyncService,
    AlimentosSyncScheduler,
  ],
})
export class SchedulersModule {}
