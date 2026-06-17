import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrarSocioUseCase } from './registrarSocio.use-case';
import { ListarSociosUseCase } from './listarSocios.use-case';
import { ActualizarSocioUseCase } from './actualizarSocio.use-case';
import { DesactivarSocioUseCase } from './desactivarSocio.use-case';
import { ReactivarSocioUseCase } from './reactivarSocio.use-case';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { PasswordEncrypterModule } from 'src/infrastructure/services/bcrypt/bcrypt.module';
import { MinioModule } from 'src/infrastructure/services/minio/minio.module';
import { TenantContextModule } from 'src/infrastructure/auth/tenant-context.module';
import { EmailModule } from 'src/application/email/email.module';
import { AuditoriaModule } from 'src/infrastructure/services/auditoria/auditoria.module';
import {
  SocioOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
import { NotificacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/notificacion.entity';
import { USUARIO_REPOSITORY } from 'src/domain/entities/Usuario/usuario.repository';
import { SOCIO_REPOSITORY } from 'src/domain/entities/Persona/Socio/socio.repository';
import {
  SocioRepositoryImplementation,
  UsuarioRepositoryImplementation,
} from 'src/infrastructure/persistence/typeorm/repositories';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsuarioOrmEntity,
      SocioOrmEntity,
      GrupoPermisoOrmEntity,
      TurnoOrmEntity,
      PlanAlimentacionOrmEntity,
      NotificacionOrmEntity,
    ]),
    AppLoggerModule,
    PasswordEncrypterModule,
    MinioModule,
    TenantContextModule,
    EmailModule,
    AuditoriaModule,
  ],
  providers: [
    RegistrarSocioUseCase,
    ListarSociosUseCase,
    ActualizarSocioUseCase,
    DesactivarSocioUseCase,
    ReactivarSocioUseCase,
    NotificacionesService,
    { provide: USUARIO_REPOSITORY, useClass: UsuarioRepositoryImplementation },
    { provide: SOCIO_REPOSITORY, useClass: SocioRepositoryImplementation },
  ],
  exports: [
    RegistrarSocioUseCase,
    ListarSociosUseCase,
    ActualizarSocioUseCase,
    DesactivarSocioUseCase,
    ReactivarSocioUseCase,
  ],
})
export class SociosModule {}
