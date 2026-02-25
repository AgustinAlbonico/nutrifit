import { Module } from '@nestjs/common';
import {
  AgendaController,
  AlimentosController,
  AuthController,
  PermisosController,
  PlanAlimentacionController,
  ProfesionalController,
  ProgresoController,
  SocioController,
  TurnosController,
  AiController,
} from './controllers';
import { ProgresoModule } from 'src/application/progreso/progreso.module';
import { ApplicationModule } from 'src/application/application.module';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { MinioModule } from 'src/infrastructure/services/minio/minio.module';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { NutricionistaOwnershipGuard } from 'src/infrastructure/auth/guards/nutricionista-ownership.guard';
import { PlanSocioAccessGuard } from 'src/infrastructure/auth/guards/plan-socio-access.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { AlimentosSyncService } from 'src/infrastructure/alimentos/alimentos-sync.service';
import { CrearAlimentoUseCase } from 'src/application/alimentos/use-cases/crear-alimento.use-case';
import { ActualizarAlimentoUseCase } from 'src/application/alimentos/use-cases/actualizar-alimento.use-case';
import { EliminarAlimentoUseCase } from 'src/application/alimentos/use-cases/eliminar-alimento.use-case';
import { BuscarSociosConFichaUseCase } from 'src/application/socios/buscar-socios-con-ficha.use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { GrupoAlimenticioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';

@Module({
  imports: [
    ApplicationModule,
    AppLoggerModule,
    MinioModule,
    ProgresoModule,
    TypeOrmModule.forFeature([
      TurnoOrmEntity,
      PlanAlimentacionOrmEntity,
      AlimentoOrmEntity,
      SocioOrmEntity,
      GrupoAlimenticioOrmEntity,
    ]),
  ],
  providers: [
    JwtAuthGuard,
    ActionsGuard,
    RolesGuard,
    NutricionistaOwnershipGuard,
    PlanSocioAccessGuard,
    AlimentosSyncService,
    CrearAlimentoUseCase,
    ActualizarAlimentoUseCase,
    EliminarAlimentoUseCase,
    BuscarSociosConFichaUseCase,
  ],
  controllers: [
    AgendaController,
    AlimentosController,
    AuthController,
    SocioController,
    ProfesionalController,
    PermisosController,
    PlanAlimentacionController,
    TurnosController,
    ProgresoController,
    AiController,
  ],
})
export class ControllersModule {}
