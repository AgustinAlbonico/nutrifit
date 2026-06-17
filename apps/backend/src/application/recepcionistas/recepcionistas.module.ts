import { Module } from '@nestjs/common';
import {
  CreateRecepcionistaUseCase,
  UpdateRecepcionistaUseCase,
  DeleteRecepcionistaUseCase,
  ReactivarRecepcionistaUseCase,
  ListRecepcionistasUseCase,
  GetRecepcionistaUseCase,
} from './use-cases';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { PasswordEncrypterModule } from 'src/infrastructure/services/bcrypt/bcrypt.module';
import { MinioModule } from 'src/infrastructure/services/minio/minio.module';
import { EmailModule } from 'src/application/email/email.module';
import {
  GrupoPermisoOrmEntity,
  RecepcionistaOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { RECEPCIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Recepcionista/recepcionista.repository';
import { USUARIO_REPOSITORY } from 'src/domain/entities/Usuario/usuario.repository';
import { RecepcionistaRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/recepcionista.repository.impl';
import { UsuarioRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/usuario.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsuarioOrmEntity,
      RecepcionistaOrmEntity,
      GrupoPermisoOrmEntity,
    ]),
    AppLoggerModule,
    PasswordEncrypterModule,
    MinioModule,
    EmailModule,
  ],
  providers: [
    CreateRecepcionistaUseCase,
    UpdateRecepcionistaUseCase,
    DeleteRecepcionistaUseCase,
    ReactivarRecepcionistaUseCase,
    ListRecepcionistasUseCase,
    GetRecepcionistaUseCase,
    {
      provide: USUARIO_REPOSITORY,
      useClass: UsuarioRepositoryImplementation,
    },
    {
      provide: RECEPCIONISTA_REPOSITORY,
      useClass: RecepcionistaRepositoryImplementation,
    },
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
