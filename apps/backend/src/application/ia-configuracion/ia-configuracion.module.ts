import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IaConfiguracionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ia-configuracion.entity';
import { SecurityModule } from 'src/infrastructure/security/security.module';

import { IaConfiguracionService } from './ia-configuracion.service';
import { IA_CONFIGURACION_SERVICE } from './ia-configuracion.tokens';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([IaConfiguracionOrmEntity]),
    SecurityModule,
  ],
  providers: [
    IaConfiguracionService,
    { provide: IA_CONFIGURACION_SERVICE, useExisting: IaConfiguracionService },
  ],
  exports: [IaConfiguracionService, IA_CONFIGURACION_SERVICE],
})
export class IaConfiguracionModule {}
