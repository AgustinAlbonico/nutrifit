import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { PasswordEncrypterModule } from 'src/infrastructure/services/bcrypt/bcrypt.module';
import { MinioModule } from 'src/infrastructure/services/minio/minio.module';
import { TurnosModule } from 'src/application/turnos/turnos.module';
import { AuditoriaModule } from 'src/infrastructure/services/auditoria/auditoria.module';
import { TenantContextModule } from 'src/infrastructure/auth/tenant-context.module';
import { EmailModule } from 'src/application/email/email.module';
import {
  CertificacionOrmEntity,
  DiplomaOrmEntity,
  GrupoPermisoOrmEntity,
  NutricionistaOrmEntity,
  TurnoOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { DIPLOMA_REPOSITORY } from 'src/domain/entities/Diploma/diploma.repository';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { USUARIO_REPOSITORY } from 'src/domain/entities/Usuario/usuario.repository';
import { DiplomaRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/diploma.repository';
import { NutricionistaRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/nutricionista.repository';
import { UsuarioRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/usuario.repository';
import {
  CreateNutricionistaUseCase,
  DeleteNutricionistaUseCase,
  EliminarDiplomaUseCase,
  GetPerfilProfesionalPublicoUseCase,
  GetNutricionistaUseCase,
  GetMiPerfilNutricionistaUseCase,
  ListarDiplomasUseCase,
  ListNutricionistasUseCase,
  ListProfesionalesPublicosUseCase,
  ReactivarNutricionistaUseCase,
  SubirDiplomaUseCase,
  UpdateNutricionistaUseCase,
} from './use-cases';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CertificacionOrmEntity,
      DiplomaOrmEntity,
      UsuarioOrmEntity,
      NutricionistaOrmEntity,
      GrupoPermisoOrmEntity,
      TurnoOrmEntity,
    ]),
    AppLoggerModule,
    PasswordEncrypterModule,
    MinioModule,
    TurnosModule,
    AuditoriaModule,
    TenantContextModule,
    EmailModule,
  ],
  providers: [
    CreateNutricionistaUseCase,
    UpdateNutricionistaUseCase,
    DeleteNutricionistaUseCase,
    EliminarDiplomaUseCase,
    GetPerfilProfesionalPublicoUseCase,
    GetNutricionistaUseCase,
    GetMiPerfilNutricionistaUseCase,
    ListarDiplomasUseCase,
    ListNutricionistasUseCase,
    ListProfesionalesPublicosUseCase,
    ReactivarNutricionistaUseCase,
    SubirDiplomaUseCase,
    {
      provide: USUARIO_REPOSITORY,
      useClass: UsuarioRepositoryImplementation,
    },
    {
      provide: NUTRICIONISTA_REPOSITORY,
      useClass: NutricionistaRepositoryImplementation,
    },
    {
      provide: DIPLOMA_REPOSITORY,
      useClass: DiplomaRepositoryImplementation,
    },
  ],
  exports: [
    CreateNutricionistaUseCase,
    UpdateNutricionistaUseCase,
    DeleteNutricionistaUseCase,
    GetPerfilProfesionalPublicoUseCase,
    GetNutricionistaUseCase,
    GetMiPerfilNutricionistaUseCase,
    ListNutricionistasUseCase,
    ListProfesionalesPublicosUseCase,
    ReactivarNutricionistaUseCase,
    SubirDiplomaUseCase,
    EliminarDiplomaUseCase,
    ListarDiplomasUseCase,
  ],
})
export class ProfesionalesModule {}
