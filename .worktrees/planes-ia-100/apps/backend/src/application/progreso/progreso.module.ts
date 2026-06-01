import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgresoController } from 'src/presentation/http/controllers/progreso.controller';
import { SubirFotoProgresoUseCase } from 'src/application/fotos/use-cases/subir-foto-progreso.use-case';
import { ObtenerGaleriaFotosUseCase } from 'src/application/fotos/use-cases/obtener-galeria-fotos.use-case';
import { EliminarFotoProgresoUseCase } from 'src/application/fotos/use-cases/eliminar-foto-progreso.use-case';
import { CrearObjetivoUseCase } from 'src/application/objetivos/use-cases/crear-objetivo.use-case';
import { ActualizarObjetivoUseCase } from 'src/application/objetivos/use-cases/actualizar-objetivo.use-case';
import { MarcarObjetivoCompletadoUseCase } from 'src/application/objetivos/use-cases/marcar-objetivo-completado.use-case';
import { ObtenerObjetivosActivosUseCase } from 'src/application/objetivos/use-cases/obtener-objetivos-activos.use-case';
import { FotoProgresoRepository } from 'src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository';
import { ObjetivoRepository } from 'src/infrastructure/persistence/typeorm/repositories/objetivo.repository';
import { FotoProgresoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/foto-progreso.entity';
import { ObjetivoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/objetivo.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { MinioModule } from 'src/infrastructure/services/minio/minio.module';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { AuthModule } from 'src/application/auth/auth.module';
import { PermisosModule } from 'src/application/permisos/permisos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FotoProgresoOrmEntity,
      ObjetivoOrmEntity,
      SocioOrmEntity,
    ]),
    MinioModule,
    AppLoggerModule,
    AuthModule,
    PermisosModule,
  ],
  controllers: [ProgresoController],
  providers: [
    FotoProgresoRepository,
    ObjetivoRepository,
    SubirFotoProgresoUseCase,
    ObtenerGaleriaFotosUseCase,
    EliminarFotoProgresoUseCase,
    CrearObjetivoUseCase,
    ActualizarObjetivoUseCase,
    MarcarObjetivoCompletadoUseCase,
    ObtenerObjetivosActivosUseCase,
  ],
  exports: [
    SubirFotoProgresoUseCase,
    ObtenerGaleriaFotosUseCase,
    EliminarFotoProgresoUseCase,
    CrearObjetivoUseCase,
    ActualizarObjetivoUseCase,
    MarcarObjetivoCompletadoUseCase,
    ObtenerObjetivosActivosUseCase,
  ],
})
export class ProgresoModule {}
