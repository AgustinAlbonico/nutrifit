import { Module } from '@nestjs/common';
import {
  CreateRecepcionistaUseCase,
  UpdateRecepcionistaUseCase,
  DeleteRecepcionistaUseCase,
  ReactivarRecepcionistaUseCase,
  ListRecepcionistasUseCase,
  GetRecepcionistaUseCase,
} from './use-cases';
import { RepositoriesModule } from 'src/infrastructure/persistence/typeorm/repositories/repositories.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';

@Module({
  imports: [
    RepositoriesModule,
    TypeOrmModule.forFeature([GrupoPermisoOrmEntity]),
  ],
  providers: [
    CreateRecepcionistaUseCase,
    UpdateRecepcionistaUseCase,
    DeleteRecepcionistaUseCase,
    ReactivarRecepcionistaUseCase,
    ListRecepcionistasUseCase,
    GetRecepcionistaUseCase,
  ],
  exports: [
    CreateRecepcionistaUseCase,
    UpdateRecepcionistaUseCase,
    DeleteRecepcionistaUseCase,
    ReactivarRecepcionistaUseCase,
    ListRecepcionistasUseCase,
    GetRecepcionistaUseCase,
  ],
})
export class RecepcionistasModule {}
