import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuscripcionesApplicationModule } from 'src/application/suscripciones/suscripciones.module';
import { SuscripcionController } from './controllers/suscripcion.controller';
import { GimnasioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/gimnasio.entity';
import { RepositoriesModule } from 'src/infrastructure/persistence/typeorm/repositories/repositories.module';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { PasswordEncrypterModule } from 'src/infrastructure/services/bcrypt/bcrypt.module';
import { GimnasioRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/gimnasio.repository.impl';
import { GIMNASIO_REPOSITORY } from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { UsuarioGrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario-grupo-permiso.entity';
import { RecepcionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';

@Module({
  imports: [
    SuscripcionesApplicationModule,
    TypeOrmModule.forFeature([
      GimnasioOrmEntity,
      GrupoPermisoOrmEntity,
      UsuarioGrupoPermisoOrmEntity,
      RecepcionistaOrmEntity,
    ]),
    RepositoriesModule,
    AppLoggerModule,
    PasswordEncrypterModule,
  ],
  providers: [
    {
      provide: GIMNASIO_REPOSITORY,
      useClass: GimnasioRepositoryImplementation,
    },
  ],
  controllers: [SuscripcionController],
})
export class SuscripcionesModule {}
