import { Module } from '@nestjs/common';
import { EnvironmentConfigModule } from './config/environment-config/environment-config.module';
import { TypeOrmConfigModule } from './config/typeorm/typeorm.module';
import { SchedulersModule } from './schedulers/schedulers.module';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    EnvironmentConfigModule,
    TypeOrmConfigModule,
    SchedulersModule,
    SecurityModule,
  ],
  //exports: [EnvironmentConfigModule, TypeOrmConfigModule],
})
export class InfrastructureModule {}
