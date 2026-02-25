import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { AccionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/accion.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoRepository: Repository<GrupoPermisoOrmEntity>,
    @InjectRepository(AccionOrmEntity)
    private readonly accionRepository: Repository<AccionOrmEntity>,
  ) {}

  async seedPermisos(): Promise<void> {
    this.logger.log('Iniciando seed de permisos...');

    // Verificar si ya existen datos
    const gruposExistentes = await this.grupoRepository.count();
    if (gruposExistentes > 0) {
      this.logger.log('Los datos de permisos ya existen. Saltando seed.');
      return;
    }

    // Crear grupo PROFESIONAL
    const grupoProfesional = this.grupoRepository.create({
      clave: 'PROFESIONAL',
      nombre: 'Profesional',
      descripcion: 'Grupo de permisos para nutricionistas',
      acciones: [],
      hijos: [],
    });
    await this.grupoRepository.save(grupoProfesional);
    this.logger.log('Grupo PROFESIONAL creado');

    // Crear grupo ADMIN
    const grupoAdmin = this.grupoRepository.create({
      clave: 'ADMIN',
      nombre: 'Administrador',
      descripcion: 'Grupo de permisos para administradores',
      acciones: [],
      hijos: [],
    });
    await this.grupoRepository.save(grupoAdmin);
    this.logger.log('Grupo ADMIN creado');

    // Crear acciones básicas para profesionales
    const acciones = [
      {
        clave: 'turnos.ver',
        nombre: 'Ver turnos',
        descripcion: 'Permite ver la lista de turnos',
      },
      {
        clave: 'turnos.crear',
        nombre: 'Crear turnos',
        descripcion: 'Permite crear nuevos turnos',
      },
      {
        clave: 'turnos.editar',
        nombre: 'Editar turnos',
        descripcion: 'Permite editar turnos existentes',
      },
      {
        clave: 'turnos.eliminar',
        nombre: 'Eliminar turnos',
        descripcion: 'Permite eliminar turnos',
      },
      {
        clave: 'socios.ver',
        nombre: 'Ver socios',
        descripcion: 'Permite ver la lista de socios',
      },
      {
        clave: 'socios.registrar',
        nombre: 'Registrar socio',
        descripcion: 'Permite registrar nuevos socios',
      },
      {
        clave: 'socios.editar',
        nombre: 'Editar socio',
        descripcion: 'Permite editar datos de socios',
      },
      {
        clave: 'socios.eliminar',
        nombre: 'Eliminar socio',
        descripcion: 'Permite dar de baja socios',
      },
      {
        clave: 'socios.reactivar',
        nombre: 'Reactivar socio',
        descripcion: 'Permite reactivar socios dados de baja',
      },
      {
        clave: 'agenda.ver',
        nombre: 'Ver agenda',
        descripcion: 'Permite ver la agenda',
      },
    ];

    const accionesCreadas: AccionOrmEntity[] = [];
    for (const accion of acciones) {
      const accionEntity = this.accionRepository.create(accion);
      const saved = await this.accionRepository.save(accionEntity);
      accionesCreadas.push(saved);
      this.logger.log(`Acción ${accion.clave} creada`);
    }

    // Asignar acciones al grupo PROFESIONAL
    grupoProfesional.acciones = accionesCreadas;
    await this.grupoRepository.save(grupoProfesional);
    this.logger.log('Acciones asignadas al grupo PROFESIONAL');

    // Crear acciones para ADMIN
    const accionesAdmin = [
      {
        clave: 'profesionales.ver',
        nombre: 'Ver profesionales',
        descripcion: 'Permite ver la lista de profesionales',
      },
      {
        clave: 'profesionales.crear',
        nombre: 'Crear profesionales',
        descripcion: 'Permite crear nuevos profesionales',
      },
      {
        clave: 'profesionales.editar',
        nombre: 'Editar profesionales',
        descripcion: 'Permite editar profesionales existentes',
      },
      {
        clave: 'profesionales.eliminar',
        nombre: 'Eliminar profesionales',
        descripcion: 'Permite eliminar profesionales',
      },
      {
        clave: 'socios.ver',
        nombre: 'Ver socios',
        descripcion: 'Permite ver la lista de socios',
      },
      {
        clave: 'socios.registrar',
        nombre: 'Registrar socio',
        descripcion: 'Permite registrar nuevos socios',
      },
      {
        clave: 'socios.editar',
        nombre: 'Editar socio',
        descripcion: 'Permite editar datos de socios',
      },
      {
        clave: 'socios.eliminar',
        nombre: 'Eliminar socio',
        descripcion: 'Permite dar de baja socios',
      },
      {
        clave: 'socios.reactivar',
        nombre: 'Reactivar socio',
        descripcion: 'Permite reactivar socios dados de baja',
      },
      {
        clave: 'usuarios.ver',
        nombre: 'Ver usuarios',
        descripcion: 'Permite ver la lista de usuarios',
      },
      {
        clave: 'permisos.gestionar',
        nombre: 'Gestionar permisos',
        descripcion: 'Permite gestionar permisos y grupos',
      },
    ];

    const accionesAdminCreadas: AccionOrmEntity[] = [];
    for (const accion of accionesAdmin) {
      const accionEntity = this.accionRepository.create(accion);
      const saved = await this.accionRepository.save(accionEntity);
      accionesAdminCreadas.push(saved);
      this.logger.log(`Acción admin ${accion.clave} creada`);
    }

    // Asignar acciones al grupo ADMIN
    grupoAdmin.acciones = accionesAdminCreadas;
    await this.grupoRepository.save(grupoAdmin);
    this.logger.log('Acciones asignadas al grupo ADMIN');

    this.logger.log('Seed de permisos completado exitosamente');
  }
}
