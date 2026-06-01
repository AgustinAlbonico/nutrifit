import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/accion.entity';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { UsuarioGrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario-grupo-permiso.entity';
import { PermisosService } from './permisos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsuarioGrupoPermisoOrmEntity,
      UsuarioOrmEntity,
      AccionOrmEntity,
      GrupoPermisoOrmEntity,
    ]),
  ],
  providers: [PermisosService],
  exports: [PermisosService],
})
export class PermisosModule {}
