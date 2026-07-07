import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { SociosModule } from './socios/socios.module';
import { PermisosModule } from './permisos/permisos.module';
import { ProfesionalesModule } from './profesionales/profesionales.module';
import { RecepcionistasModule } from './recepcionistas/recepcionistas.module';
import { AgendaModule } from './agenda/agenda.module';
import { TurnosModule } from './turnos/turnos.module';
import { PlanesAlimentacionModule } from './planes-alimentacion/planes-alimentacion.module';
import { AiModule } from './ai/ai.module';
import { ReportesModule } from './reportes/reportes.module';
import { IaMemoriaModule } from './ia-memoria/ia-memoria.module';
import { IaConfiguracionModule } from './ia-configuracion/ia-configuracion.module';

@Module({
  imports: [
    AuthModule,
    SociosModule,
    ScheduleModule.forRoot(),
    PermisosModule,
    ProfesionalesModule,
    RecepcionistasModule,
    AgendaModule,
    TurnosModule,
    PlanesAlimentacionModule,
    AiModule,
    ReportesModule,
    IaMemoriaModule,
    IaConfiguracionModule,
  ],
  exports: [
    AuthModule,
    SociosModule,
    PermisosModule,
    ProfesionalesModule,
    RecepcionistasModule,
    AgendaModule,
    TurnosModule,
    PlanesAlimentacionModule,
    AiModule,
    ReportesModule,
    IaMemoriaModule,
    IaConfiguracionModule,
  ],
})
export class ApplicationModule {}
