// apps/backend/src/seed-multi-tenant.spec.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

describe('Seed Multi-Tenant', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      synchronize: false,
      logging: false,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Gimnasios', () => {
    it('debe crear 3 gimnasios', async () => {
      const resultado: unknown = await dataSource.query(
        'SELECT COUNT(*) as total FROM gimnasio WHERE nombre LIKE ?',
        ['Gym %'],
      );

      const fila = (resultado as any[])[0];
      expect(Number(fila.total)).toBe(3);
    });
  });

  describe('SUPERADMIN', () => {
    it('debe crear SUPERADMIN sin gimnasioId en persona', async () => {
      const resultado: unknown = await dataSource.query(
        `SELECT u.email, u.rol, p.gimnasio_id
         FROM usuario u
         INNER JOIN persona p ON u.id_persona = p.id_persona
         WHERE u.email = 'superadmin@nutrifit.com'`,
      );

      const fila = (resultado as any[])[0];
      expect(fila).toBeDefined();
      expect(fila.rol).toBe('SUPERADMIN');
      expect(fila.gimnasio_id).toBeNull();
    });
  });

  describe('ADMIN por gimnasio', () => {
    it('debe crear ADMIN de Gym Central con gimnasioId correcto', async () => {
      const resultado: unknown = await dataSource.query(
        `SELECT u.email, u.rol, p.gimnasio_id, g.nombre as gimnasio_nombre
         FROM usuario u
         INNER JOIN persona p ON u.id_persona = p.id_persona
         INNER JOIN gimnasio g ON p.gimnasio_id = g.id_gimnasio
         WHERE u.email = 'admin-central@nutrifit.com'`,
      );

      const fila = (resultado as any[])[0];
      expect(fila).toBeDefined();
      expect(fila.rol).toBe('ADMIN');
      expect(fila.gimnasio_nombre).toBe('Gym Central');
    });

    it('debe crear ADMIN de Gym Norte con gimnasioId correcto', async () => {
      const resultado: unknown = await dataSource.query(
        `SELECT u.email, u.rol, p.gimnasio_id, g.nombre as gimnasio_nombre
         FROM usuario u
         INNER JOIN persona p ON u.id_persona = p.id_persona
         INNER JOIN gimnasio g ON p.gimnasio_id = g.id_gimnasio
         WHERE u.email = 'admin-norte@nutrifit.com'`,
      );

      const fila = (resultado as any[])[0];
      expect(fila).toBeDefined();
      expect(fila.rol).toBe('ADMIN');
      expect(fila.gimnasio_nombre).toBe('Gym Norte');
    });

    it('debe crear ADMIN de Gym Sur con gimnasioId correcto', async () => {
      const resultado: unknown = await dataSource.query(
        `SELECT u.email, u.rol, p.gimnasio_id, g.nombre as gimnasio_nombre
         FROM usuario u
         INNER JOIN persona p ON u.id_persona = p.id_persona
         INNER JOIN gimnasio g ON p.gimnasio_id = g.id_gimnasio
         WHERE u.email = 'admin-sur@nutrifit.com'`,
      );

      const fila = (resultado as any[])[0];
      expect(fila).toBeDefined();
      expect(fila.rol).toBe('ADMIN');
      expect(fila.gimnasio_nombre).toBe('Gym Sur');
    });
  });

  describe('NUTRICIONISTA por gimnasio', () => {
    it('debe crear 3 NUTRICIONISTAs (uno por gimnasio)', async () => {
      const resultado: unknown = await dataSource.query(
        `SELECT COUNT(*) as total
         FROM usuario u
         WHERE u.rol = 'NUTRICIONISTA'
         AND u.email LIKE 'nutri-%@nutrifit.com'`,
      );

      const fila = (resultado as any[])[0];
      expect(Number(fila.total)).toBe(3);
    });

    it('cada NUTRICIONISTA debe tener gimnasioId correcto', async () => {
      const resultado: unknown = await dataSource.query(
        `SELECT u.email, g.nombre as gimnasio_nombre
         FROM usuario u
         INNER JOIN persona p ON u.id_persona = p.id_persona
         INNER JOIN gimnasio g ON p.gimnasio_id = g.id_gimnasio
         WHERE u.rol = 'NUTRICIONISTA'
         AND u.email LIKE 'nutri-%@nutrifit.com'
         ORDER BY u.email`,
      );

      const filas = resultado as any[];
      expect(filas.length).toBe(3);
      expect(filas[0].gimnasio_nombre).toBe('Gym Central');
      expect(filas[1].gimnasio_nombre).toBe('Gym Norte');
      expect(filas[2].gimnasio_nombre).toBe('Gym Sur');
    });
  });

  describe('SOCIO por gimnasio', () => {
    it('debe crear 9 SOCIOs (3 por gimnasio)', async () => {
      const resultado: unknown = await dataSource.query(
        `SELECT COUNT(*) as total
         FROM usuario u
         WHERE u.rol = 'SOCIO'
         AND u.email LIKE 'socio%@nutrifit.com'`,
      );

      const fila = (resultado as any[])[0];
      expect(Number(fila.total)).toBe(9);
    });

    it('cada gimnasio debe tener exactamente 3 socios', async () => {
      const resultado: unknown = await dataSource.query(
        `SELECT g.nombre as gimnasio_nombre, COUNT(*) as total
         FROM usuario u
         INNER JOIN persona p ON u.id_persona = p.id_persona
         INNER JOIN gimnasio g ON p.gimnasio_id = g.id_gimnasio
         WHERE u.rol = 'SOCIO'
         AND u.email LIKE 'socio%@nutrifit.com'
         GROUP BY g.nombre
         ORDER BY g.nombre`,
      );

      const filas = resultado as any[];
      expect(filas.length).toBe(3);
      expect(Number(filas[0].total)).toBe(3);
      expect(Number(filas[1].total)).toBe(3);
      expect(Number(filas[2].total)).toBe(3);
    });
  });

  describe('Aislamiento de datos', () => {
    it('ADMIN de Gym Central solo debe ver socios de su gimnasio', async () => {
      const gimnasio: unknown = await dataSource.query(
        'SELECT id_gimnasio FROM gimnasio WHERE nombre = ?',
        ['Gym Central'],
      );

      const idGimnasioCentral = (gimnasio as any[])[0].id_gimnasio;

      const sociosCentral: unknown = await dataSource.query(
        `SELECT COUNT(*) as total
         FROM persona p
         INNER JOIN usuario u ON p.id_persona = u.id_persona
         WHERE p.gimnasio_id = ? AND u.rol = 'SOCIO'`,
        [idGimnasioCentral],
      );

      const totalCentral = Number((sociosCentral as any[])[0].total);
      expect(totalCentral).toBe(3);

      const otrosGimnasios: unknown = await dataSource.query(
        `SELECT COUNT(*) as total
         FROM persona p
         INNER JOIN usuario u ON p.id_persona = u.id_persona
         WHERE p.gimnasio_id != ? AND u.rol = 'SOCIO'`,
        [idGimnasioCentral],
      );

      const totalOtros = Number((otrosGimnasios as any[])[0].total);
      expect(totalOtros).toBe(6);
    });
  });
});
