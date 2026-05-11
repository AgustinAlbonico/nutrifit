import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { GrupoPermisoOrmEntity } from './infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { AccionOrmEntity } from './infrastructure/persistence/typeorm/entities/accion.entity';
import { AppDataSource } from './infrastructure/config/typeorm/typeorm.config';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env' });

// Re-exportar catálogos de acciones para uso en tests
export {
  accionesProfesional,
  accionesAdmin,
} from './catalogos/acciones.constants';
import {
  accionesProfesional,
  accionesAdmin,
} from './catalogos/acciones.constants';

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

    console.log('📝 Creando acciones de PROFESIONAL...');
    const accionesProfesionalCreadas: AccionOrmEntity[] = [];
    for (const accion of accionesProfesional) {
      const existeAccion = await accionRepository.findOne({
        where: { clave: accion.clave },
      });
      if (!existeAccion) {
        const accionEntity = accionRepository.create(accion);
        const saved = await accionRepository.save(accionEntity);
        accionesProfesionalCreadas.push(saved);
      } else {
        accionesProfesionalCreadas.push(existeAccion);
      }
    }

    console.log('📝 Asignando acciones al grupo PROFESIONAL...');
    grupoProfesional.acciones = accionesProfesionalCreadas;
    await grupoRepository.save(grupoProfesional);

    console.log('📝 Creando acciones de ADMIN...');
    const accionesAdminCreadas: AccionOrmEntity[] = [];
    for (const accion of accionesAdmin) {
      const existeAccion = await accionRepository.findOne({
        where: { clave: accion.clave },
      });
      if (!existeAccion) {
        const accionEntity = accionRepository.create(accion);
        const saved = await accionRepository.save(accionEntity);
        accionesAdminCreadas.push(saved);
      } else {
        accionesAdminCreadas.push(existeAccion);
      }
    }

    console.log('📝 Asignando acciones al grupo ADMIN...');
    grupoAdmin.acciones = accionesAdminCreadas;
    await grupoRepository.save(grupoAdmin);

    console.log('✅ Seed de permisos completado exitosamente');
    console.log('');
    console.log('📊 Resumen:');
    console.log(`   - Grupos creados: 2 (PROFESIONAL, ADMIN)`);
    console.log(
      `   - Acciones PROFESIONAL: ${accionesProfesionalCreadas.length}`,
    );
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
