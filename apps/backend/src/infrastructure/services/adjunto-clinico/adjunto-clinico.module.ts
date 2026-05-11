import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdjuntoClinicoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/adjunto-clinico.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { AdjuntoClinicoService } from './adjunto-clinico.service';
import { OBJECT_STORAGE_SERVICE } from 'src/domain/services/object-storage.service';
import { MinioService } from '../minio/minio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdjuntoClinicoOrmEntity, TurnoOrmEntity]),
  ],
  providers: [
    AdjuntoClinicoService,
    {
      provide: OBJECT_STORAGE_SERVICE,
      useClass: MinioService,
    },
  ],
  exports: [AdjuntoClinicoService],
})
export class AdjuntoClinicoModule {}
