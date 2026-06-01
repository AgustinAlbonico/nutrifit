import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
  AdminAuditoriaController,
  NotificacionesController,
  AdminEstadisticasController,
  AdminReportesController,
  ConfiguracionController,
} from './controllers';
import { ProgresoModule } from 'src/application/progreso/progreso.module';
import { ApplicationModule } from 'src/application/application.module';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { MinioModule } from 'src/infrastructure/services/minio/minio.module';
import { AuditoriaModule } from 'src/infrastructure/services/auditoria/auditoria.module';
import { AdjuntoClinicoModule } from 'src/infrastructure/services/adjunto-clinico/adjunto-clinico.module';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { NutricionistaOwnershipGuard } from 'src/infrastructure/auth/guards/nutricionista-ownership.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { SocioResourceAccessGuard } from 'src/infrastructure/auth/guards/socio-resource-access.guard';
import { TurnoNutricionistaAccessGuard } from 'src/infrastructure/auth/guards/turno-nutricionista-access.guard';
import { AlimentosSyncService } from 'src/infrastructure/alimentos/alimentos-sync.service';
import { CrearAlimentoUseCase } from 'src/application/alimentos/use-cases/crear-alimento.use-case';
import { ActualizarAlimentoUseCase } from 'src/application/alimentos/use-cases/actualizar-alimento.use-case';
import { EliminarAlimentoUseCase } from 'src/application/alimentos/use-cases/eliminar-alimento.use-case';
import { BuscarSociosConFichaUseCase } from 'src/application/socios/buscar-socios-con-ficha.use-case';
import { FotoProgresoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/foto-progreso.entity';
import { ObjetivoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/objetivo.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { GrupoAlimenticioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { AdjuntoClinicoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/adjunto-clinico.entity';
import { AuditoriaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { NotificacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/notificacion.entity';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { GimnasioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/gimnasio.entity';
import { GimnasioRepository } from 'src/infrastructure/persistence/typeorm/repositories/gimnasio.repository';

@Module({
  imports: [
    ApplicationModule,
    AppLoggerModule,
    MinioModule,
    AuditoriaModule,
    AdjuntoClinicoModule,
    ProgresoModule,
    TypeOrmModule.forFeature([
      TurnoOrmEntity,
      PlanAlimentacionOrmEntity,
      FotoProgresoOrmEntity,
      ObjetivoOrmEntity,
      AlimentoOrmEntity,
      GrupoAlimenticioOrmEntity,
      SocioOrmEntity,
      AdjuntoClinicoOrmEntity,
      AuditoriaOrmEntity,
      NotificacionOrmEntity,
      GimnasioOrmEntity,
    ]),
  ],
  providers: [
    JwtAuthGuard,
    ActionsGuard,
    RolesGuard,
    NutricionistaOwnershipGuard,
    SocioResourceAccessGuard,
    TurnoNutricionistaAccessGuard,
    AlimentosSyncService,
    CrearAlimentoUseCase,
    ActualizarAlimentoUseCase,
    EliminarAlimentoUseCase,
    BuscarSociosConFichaUseCase,
    NotificacionesService,
    GimnasioRepository,
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
    AdminAuditoriaController,
    NotificacionesController,
    AdminEstadisticasController,
    AdminReportesController,
    ConfiguracionController,
  ],
})
export class ControllersModule {}
