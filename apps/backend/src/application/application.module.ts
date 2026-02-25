import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { SociosModule } from './socios/socios.module';
import { PermisosModule } from './permisos/permisos.module';
import { ProfesionalesModule } from './profesionales/profesionales.module';
import { AgendaModule } from './agenda/agenda.module';
import { TurnosModule } from './turnos/turnos.module';
import { PlanesAlimentacionModule } from './planes-alimentacion/planes-alimentacion.module';

import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    AuthModule,
    SociosModule,
    ScheduleModule.forRoot(),
    PermisosModule,
    ProfesionalesModule,
    AgendaModule,
    TurnosModule,
    PlanesAlimentacionModule,
    AiModule,
  ],
  exports: [
    AuthModule,
    SociosModule,
    PermisosModule,
    ProfesionalesModule,
    AgendaModule,
    TurnosModule,
    PlanesAlimentacionModule,
    AiModule,
  ],
})
export class ApplicationModule {}
