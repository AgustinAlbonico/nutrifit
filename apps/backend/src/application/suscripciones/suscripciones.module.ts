import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GimnasioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/gimnasio.entity';
import { IniciarRegistroSuscripcionUseCase } from './use-cases/iniciar-registro-suscripcion.use-case';
import { ProcesarPagoSimuladoUseCase } from './use-cases/procesar-pago-simulado.use-case';
import { VerEstadoSuscripcionUseCase } from './use-cases/ver-estado-suscripcion.use-case';
import { SuscripcionGimnasioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/suscripcion-gimnasio.entity';
import { PagoSimuladoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/pago-simulado.entity';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { UsuarioGrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario-grupo-permiso.entity';
import { RecepcionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { RepositoriesModule } from 'src/infrastructure/persistence/typeorm/repositories/repositories.module';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { PasswordEncrypterModule } from 'src/infrastructure/services/bcrypt/bcrypt.module';
import { GIMNASIO_REPOSITORY } from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { GimnasioRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/gimnasio.repository.impl';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GimnasioOrmEntity,
      SuscripcionGimnasioOrmEntity,
      PagoSimuladoOrmEntity,
      GrupoPermisoOrmEntity,
      UsuarioGrupoPermisoOrmEntity,
      RecepcionistaOrmEntity,
    ]),
    RepositoriesModule,
    AppLoggerModule,
    PasswordEncrypterModule,
  ],
  providers: [
    IniciarRegistroSuscripcionUseCase,
    ProcesarPagoSimuladoUseCase,
    VerEstadoSuscripcionUseCase,
    {
      provide: GIMNASIO_REPOSITORY,
      useClass: GimnasioRepositoryImplementation,
    },
  ],
  exports: [
    IniciarRegistroSuscripcionUseCase,
    ProcesarPagoSimuladoUseCase,
    VerEstadoSuscripcionUseCase,
  ],
})
export class SuscripcionesApplicationModule {}
