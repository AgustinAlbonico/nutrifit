import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GimnasiosController } from 'src/presentation/http/controllers/gimnasios.controller';
import { CrearGimnasioUseCase } from 'src/application/gimnasios/use-cases/crear-gimnasio.use-case';
import { CrearAdminGimnasioUseCase } from 'src/application/gimnasios/use-cases/crear-admin-gimnasio.use-case';
import { ListarAdminsGimnasioUseCase } from 'src/application/gimnasios/use-cases/listar-admins-gimnasio.use-case';
import { ListarGimnasiosUseCase } from 'src/application/gimnasios/use-cases/listar-gimnasios.use-case';
import { ObtenerGimnasioUseCase } from 'src/application/gimnasios/use-cases/obtener-gimnasio.use-case';
import { ActualizarGimnasioUseCase } from 'src/application/gimnasios/use-cases/actualizar-gimnasio.use-case';
import { EliminarGimnasioUseCase } from 'src/application/gimnasios/use-cases/eliminar-gimnasio.use-case';
import { ImpersonarUsuarioUseCase } from 'src/application/gimnasios/use-cases/impersonar-usuario.use-case';
import { GimnasioRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/gimnasio.repository.impl';
import { GIMNASIO_REPOSITORY } from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { GimnasioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/gimnasio.entity';
import { RecepcionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { AuthModule } from 'src/application/auth/auth.module';
import { RepositoriesModule } from 'src/infrastructure/persistence/typeorm/repositories/repositories.module';
import { EmailModule } from 'src/application/email/email.module';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { PasswordEncrypterModule } from 'src/infrastructure/services/bcrypt/bcrypt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GimnasioOrmEntity,
      RecepcionistaOrmEntity,
      GrupoPermisoOrmEntity,
    ]),
    AuthModule,
    RepositoriesModule,
    EmailModule,
    AppLoggerModule,
    PasswordEncrypterModule,
  ],
  providers: [
    // Use Cases
    CrearGimnasioUseCase,
    CrearAdminGimnasioUseCase,
    ListarAdminsGimnasioUseCase,
    ListarGimnasiosUseCase,
    ObtenerGimnasioUseCase,
    ActualizarGimnasioUseCase,
    EliminarGimnasioUseCase,
    ImpersonarUsuarioUseCase,
    // Repository
    {
      provide: GIMNASIO_REPOSITORY,
      useClass: GimnasioRepositoryImplementation,
    },
    // Guards
    JwtAuthGuard,
    RolesGuard,
  ],
  controllers: [GimnasiosController],
  exports: [GIMNASIO_REPOSITORY],
})
export class GimnasiosModule {}
