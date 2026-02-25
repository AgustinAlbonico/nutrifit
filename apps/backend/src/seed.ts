import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { GrupoPermisoOrmEntity } from './infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { AccionOrmEntity } from './infrastructure/persistence/typeorm/entities/accion.entity';
import { AppDataSource } from './infrastructure/config/typeorm/typeorm.config';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env' });

async function runSeed() {
  console.log('Iniciando seed de permisos...');

  const options: any = AppDataSource({
    getDatabaseHost: () => process.env.DATABASE_HOST,
    getDatabasePort: () => Number(process.env.DATABASE_PORT),
    getDatabaseUser: () => process.env.DATABASE_USER,
    getDatabasePassword: () => process.env.DATABASE_PASSWORD,
    getDatabaseName: () => process.env.DATABASE_NAME,
  } as any);

  const dataSource = new DataSource(options);

  try {
    await dataSource.initialize();

    // Verificar si ya existen datos
    const grupoRepository = dataSource.getRepository(GrupoPermisoOrmEntity);
    const accionRepository = dataSource.getRepository(AccionOrmEntity);

    const gruposExistentes = await grupoRepository.count();
    if (gruposExistentes > 0) {
      console.log('✅ Los datos de permisos ya existen. Saltando seed.');
      await dataSource.destroy();
      return;
    }

    console.log('📝 Creando grupo PROFESIONAL...');
    const grupoProfesional = grupoRepository.create({
      clave: 'PROFESIONAL',
      nombre: 'Profesional',
      descripcion: 'Grupo de permisos para nutricionistas',
      acciones: [],
      hijos: [],
    });
    await grupoRepository.save(grupoProfesional);

    console.log('📝 Creando grupo ADMIN...');
    const grupoAdmin = grupoRepository.create({
      clave: 'ADMIN',
      nombre: 'Administrador',
      descripcion: 'Grupo de permisos para administradores',
      acciones: [],
      hijos: [],
    });
    await grupoRepository.save(grupoAdmin);

    console.log('📝 Creando acciones básicas...');
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
        clave: 'agenda.ver',
        nombre: 'Ver agenda',
        descripcion: 'Permite ver la agenda',
      },
    ];

    const accionesCreadas: AccionOrmEntity[] = [];
    for (const accion of acciones) {
      const accionEntity = accionRepository.create(accion);
      const saved = await accionRepository.save(accionEntity);
      accionesCreadas.push(saved);
    }

    console.log('📝 Asignando acciones al grupo PROFESIONAL...');
    grupoProfesional.acciones = accionesCreadas;
    await grupoRepository.save(grupoProfesional);

    console.log('📝 Creando acciones de ADMIN...');
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
      const accionEntity = accionRepository.create(accion);
      const saved = await accionRepository.save(accionEntity);
      accionesAdminCreadas.push(saved);
    }

    console.log('📝 Asignando acciones al grupo ADMIN...');
    grupoAdmin.acciones = accionesAdminCreadas;
    await grupoRepository.save(grupoAdmin);

    console.log('✅ Seed de permisos completado exitosamente');
    console.log('');
    console.log('📊 Resumen:');
    console.log(`   - Grupos creados: 2 (PROFESIONAL, ADMIN)`);
    console.log(`   - Acciones PROFESIONAL: ${accionesCreadas.length}`);
    console.log(`   - Acciones ADMIN: ${accionesAdminCreadas.length}`);
  } catch (error) {
    console.error('❌ Error al ejecutar el seed:', error);
    if (dataSource) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

runSeed();
