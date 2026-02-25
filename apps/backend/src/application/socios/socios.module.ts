import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrarSocioUseCase } from './registrarSocio.use-case';
import { ListarSociosUseCase } from './listarSocios.use-case';
import { ActualizarSocioUseCase } from './actualizarSocio.use-case';
import { EliminarSocioUseCase } from './eliminarSocio.use-case';
import { ReactivarSocioUseCase } from './reactivarSocio.use-case';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { PasswordEncrypterModule } from 'src/infrastructure/services/bcrypt/bcrypt.module';
import { MinioModule } from 'src/infrastructure/services/minio/minio.module';
import {
  SocioOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { USUARIO_REPOSITORY } from 'src/domain/entities/Usuario/usuario.repository';
import { SOCIO_REPOSITORY } from 'src/domain/entities/Persona/Socio/socio.repository';
import {
  SocioRepositoryImplementation,
  UsuarioRepositoryImplementation,
} from 'src/infrastructure/persistence/typeorm/repositories';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsuarioOrmEntity,
      SocioOrmEntity,
      GrupoPermisoOrmEntity,
    ]),
    AppLoggerModule,
    PasswordEncrypterModule,
    MinioModule,
  ],
  providers: [
    RegistrarSocioUseCase,
    ListarSociosUseCase,
    ActualizarSocioUseCase,
    EliminarSocioUseCase,
    ReactivarSocioUseCase,
    { provide: USUARIO_REPOSITORY, useClass: UsuarioRepositoryImplementation },
    { provide: SOCIO_REPOSITORY, useClass: SocioRepositoryImplementation },
  ],
  exports: [
    RegistrarSocioUseCase,
    ListarSociosUseCase,
    ActualizarSocioUseCase,
    EliminarSocioUseCase,
    ReactivarSocioUseCase,
  ],
})
export class SociosModule {}
