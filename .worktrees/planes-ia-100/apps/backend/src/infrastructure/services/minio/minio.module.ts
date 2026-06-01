import { Module } from '@nestjs/common';
import { MinioService, MINIO_SERVICE_PROVIDER } from './minio.service';
import { EnvironmentConfigModule } from 'src/infrastructure/config/environment-config/environment-config.module';

@Module({
  imports: [EnvironmentConfigModule],
  providers: [MINIO_SERVICE_PROVIDER],
  exports: [MINIO_SERVICE_PROVIDER],
})
export class MinioModule {}
