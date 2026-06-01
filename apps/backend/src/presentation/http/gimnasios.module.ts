import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GimnasiosController } from 'src/presentation/http/controllers/gimnasios.controller';
import { CrearGimnasioUseCase } from 'src/application/gimnasios/use-cases/crear-gimnasio.use-case';
import { ListarGimnasiosUseCase } from 'src/application/gimnasios/use-cases/listar-gimnasios.use-case';
import { ObtenerGimnasioUseCase } from 'src/application/gimnasios/use-cases/obtener-gimnasio.use-case';
import { ActualizarGimnasioUseCase } from 'src/application/gimnasios/use-cases/actualizar-gimnasio.use-case';
import { EliminarGimnasioUseCase } from 'src/application/gimnasios/use-cases/eliminar-gimnasio.use-case';
import { ImpersonarUsuarioUseCase } from 'src/application/gimnasios/use-cases/impersonar-usuario.use-case';
import { GimnasioRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/gimnasio.repository.impl';
import { GIMNASIO_REPOSITORY } from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { GimnasioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/gimnasio.entity';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { IJwtService, JWT_SERVICE } from 'src/domain/services/jwt.service';

@Module({
  imports: [TypeOrmModule.forFeature([GimnasioOrmEntity])],
  providers: [
    GimnasiosController,
    // Use Cases
    CrearGimnasioUseCase,
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
    // External dependencies for ImpersonarUsuarioUseCase
    { provide: UsuarioRepository, useValue: {} },
    { provide: JWT_SERVICE, useValue: {} },
  ],
  controllers: [GimnasiosController],
  exports: [GIMNASIO_REPOSITORY],
})
export class GimnasiosModule {}
