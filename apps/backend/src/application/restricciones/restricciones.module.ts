import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import { RestriccionesValidator } from './restricciones-validator.service';

@Module({
  imports: [TypeOrmModule.forFeature([FichaSaludOrmEntity])],
  providers: [RestriccionesValidator],
  exports: [RestriccionesValidator],
})
export class RestriccionesModule {}
