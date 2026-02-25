import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { PasswordEncrypterModule } from 'src/infrastructure/services/bcrypt/bcrypt.module';
import { MinioModule } from 'src/infrastructure/services/minio/minio.module';
import {
  GrupoPermisoOrmEntity,
  NutricionistaOrmEntity,
  TurnoOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { USUARIO_REPOSITORY } from 'src/domain/entities/Usuario/usuario.repository';
import { NutricionistaRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/nutricionista.repository';
import { UsuarioRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/usuario.repository';
import {
  CreateNutricionistaUseCase,
  DeleteNutricionistaUseCase,
  GetPerfilProfesionalPublicoUseCase,
  GetNutricionistaUseCase,
  ListNutricionistasUseCase,
  ListProfesionalesPublicosUseCase,
  ReactivarNutricionistaUseCase,
  UpdateNutricionistaUseCase,
} from './use-cases';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsuarioOrmEntity,
      NutricionistaOrmEntity,
      GrupoPermisoOrmEntity,
      TurnoOrmEntity,
    ]),
    AppLoggerModule,
    PasswordEncrypterModule,
    MinioModule,
  ],
  providers: [
    CreateNutricionistaUseCase,
    UpdateNutricionistaUseCase,
    DeleteNutricionistaUseCase,
    GetPerfilProfesionalPublicoUseCase,
    GetNutricionistaUseCase,
    ListNutricionistasUseCase,
    ListProfesionalesPublicosUseCase,
    ReactivarNutricionistaUseCase,
    {
      provide: USUARIO_REPOSITORY,
      useClass: UsuarioRepositoryImplementation,
    },
    {
      provide: NUTRICIONISTA_REPOSITORY,
      useClass: NutricionistaRepositoryImplementation,
    },
  ],
  exports: [
    CreateNutricionistaUseCase,
    UpdateNutricionistaUseCase,
    DeleteNutricionistaUseCase,
    GetPerfilProfesionalPublicoUseCase,
    GetNutricionistaUseCase,
    ListNutricionistasUseCase,
    ListProfesionalesPublicosUseCase,
    ReactivarNutricionistaUseCase,
  ],
})
export class ProfesionalesModule {}
