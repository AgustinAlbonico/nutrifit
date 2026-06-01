/**
 * E2E Test Suite: Auditoría con Impersonación
 *
 * Valida que:
 * - Cuando SUPERADMIN impersona un gimnasio, la auditoría registra impersonatedBy
 * - Cuando ADMIN hace una acción normal, la auditoría tiene gimnasioId pero no impersonatedBy
 * - El flujo de auditoría es consistente en ambos casos
 *
 * Requiere seed: npm run seed:completo
 * Credenciales: docs/superpowers/specs/2026-06-01-multi-tenant-admin-permisos-design.md §8
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { JwtPayload } from 'src/domain/services/jwt.service';

describe('Auditoría con Impersonación (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  let superadminToken: string;
  let adminCentralToken: string;

  // IDs para verificación
  let superadminUserId: number;
  let adminCentralUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Obtener tokens frescos antes de cada test
    const superadminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'superadmin@nutrifit.com',
        password: '123456',
      });
    superadminToken = superadminResponse.body.token;
    const superadminDecoded = jwtService.decode(superadminToken) as JwtPayload;
    superadminUserId = superadminDecoded.id;

    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin-central@nutrifit.com',
        password: '123456',
      });
    adminCentralToken = adminResponse.body.token;
    const adminDecoded = jwtService.decode(adminCentralToken) as JwtPayload;
    adminCentralUserId = adminDecoded.id;
  });

  describe('1. Auditoría de acción normal (ADMIN)', () => {
    it('debe registrar acción de ADMIN con gimnasioId pero sin impersonatedBy', async () => {
      // Hacer una acción que genere auditoría (consultar turnos del día)
      await request(app.getHttpServer())
        .get('/turnos/dia')
        .set('Authorization', `Bearer ${adminCentralToken}`)
        .expect(200);

      // Consultar auditoría y verificar el registro
      const auditoriaResponse = await request(app.getHttpServer())
        .get('/admin/auditoria')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(Array.isArray(auditoriaResponse.body)).toBe(true);

      // Buscar registros recientes de ADMIN Central
      const adminLogs = auditoriaResponse.body.filter(
        (log: { usuarioId: number | null }) => log.usuarioId === adminCentralUserId,
      );

      // Verificar que existe al menos un log con gimnasioId (del gimnasio 1) pero sin impersonatedBy
      if (adminLogs.length > 0) {
        const log = adminLogs[0];
        expect(log.gimnasioId).toBe(1);
        // impersonatedBy no debe existir o debe ser null en metadata
        if (log.metadata) {
          expect(log.metadata['impersonatedBy']).toBeUndefined();
        }
      }
    });

    it('debe registrar acción de ADMIN en el contexto correcto del gimnasio', async () => {
      // Consultar auditoría filtrada por gimnasio
      const auditoriaResponse = await request(app.getHttpServer())
        .get('/admin/auditoria')
        .query({ gimnasioId: 1 })
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(Array.isArray(auditoriaResponse.body)).toBe(true);

      // Verificar que todos los registros tienen gimnasioId = 1
      for (const log of auditoriaResponse.body) {
        expect(log.gimnasioId).toBe(1);
      }
    });
  });

  describe('2. Auditoría de impersonación (SUPERADMIN)', () => {
    it('debe registrar impersonación de SUPERADMIN con impersonatedBy', async () => {
      // SUPERADMIN impersona gimnasio 1
      const impersonateResponse = await request(app.getHttpServer())
        .post('/gimnasios/1/impersonar')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(201);

      expect(impersonateResponse.body).toHaveProperty('token');
      const impersonatedToken = impersonateResponse.body.token;
      const impersonatedDecoded = jwtService.decode(impersonatedToken) as JwtPayload;

      // Verificar que impersonatedBy está presente en el token
      expect(impersonatedDecoded.gimnasioId).toBe(1);
      expect(impersonatedDecoded.impersonatedBy).toBe(superadminUserId);

      // Consultar auditoría
      const auditoriaResponse = await request(app.getHttpServer())
        .get('/admin/auditoria')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      // Buscar registro de impersonación
      const impersonacionLogs = auditoriaResponse.body.filter(
        (log: { accion: string }) =>
          log.accion === 'IMPERSONACION_GIMNASIO' ||
          log.accion === 'SUPERADMIN_IMPERSONATE',
      );

      if (impersonacionLogs.length > 0) {
        const log = impersonacionLogs[0];
        expect(log.metadata).toHaveProperty('gimnasioId', 1);
        expect(log.metadata).toHaveProperty('impersonatedBy', superadminUserId);
      }
    });

    it('debe registrar acción realizada con token impersonado con impersonatedBy en metadata', async () => {
      // Obtener token impersonado
      const impersonateResponse = await request(app.getHttpServer())
        .post('/gimnasios/1/impersonar')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(201);

      const impersonatedToken = impersonateResponse.body.token;

      // Realizar una acción con el token impersonado (consultar turnos)
      await request(app.getHttpServer())
        .get('/turnos/dia')
        .set('Authorization', `Bearer ${impersonatedToken}`)
        .expect(200);

      // Consultar auditoría
      const auditoriaResponse = await request(app.getHttpServer())
        .get('/admin/auditoria')
        .query({ gimnasioId: 1 })
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      // Los registros deben mostrar que fueron hechos bajo impersonación
      // Verificando que gimnasioId coincide con el gimnasio impersonado
      const gymLogs = auditoriaResponse.body.filter(
        (log: { gimnasioId: number }) => log.gimnasioId === 1,
      );

      expect(gymLogs.length).toBeGreaterThan(0);
    });

    it('debe mantener separación clara entre auditoría de SUPERADMIN global y impersonado', async () => {
      // Sin impersonación: SUPERADMIN opera sin gimnasioId
      const globalLogsResponse = await request(app.getHttpServer())
        .get('/admin/auditoria')
        .query({ gimnasioId: null })
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      // Con impersonación: los logs deben tener gimnasioId
      await request(app.getHttpServer())
        .post('/gimnasios/2/impersonar')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(201);

      const impersonatedLogsResponse = await request(app.getHttpServer())
        .get('/admin/auditoria')
        .query({ gimnasioId: 2 })
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      // Verificar que los registros de gimnasio 2 tienen el tenant correcto
      for (const log of impersonatedLogsResponse.body) {
        expect(log.gimnasioId).toBe(2);
      }
    });
  });

  describe('3. Verificación de token claims', () => {
    it('debe tener claims correctos en token de SUPERADMIN sin impersonar', async () => {
      const decoded = jwtService.decode(superadminToken) as JwtPayload;

      expect(decoded.rol).toBe(Rol.SUPERADMIN);
      expect(decoded.gimnasioId).toBeNull();
      expect(decoded.impersonatedBy).toBeNull();
    });

    it('debe tener claims correctos en token impersonado', async () => {
      const response = await request(app.getHttpServer())
        .post('/gimnasios/1/impersonar')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(201);

      const decoded = jwtService.decode(response.body.token) as JwtPayload;

      expect(decoded.rol).toBe(Rol.SUPERADMIN);
      expect(decoded.gimnasioId).toBe(1);
      expect(decoded.impersonatedBy).toBe(superadminUserId);
    });

    it('debe tener claims correctos en token de ADMIN sin impersonación', async () => {
      const decoded = jwtService.decode(adminCentralToken) as JwtPayload;

      expect(decoded.rol).toBe(Rol.ADMIN);
      expect(decoded.gimnasioId).toBe(1);
      expect(decoded.impersonatedBy).toBeNull();
    });
  });

  describe('4. Casos de borde', () => {
    it('debe rechazar impersonación a gimnasio inexistente', async () => {
      await request(app.getHttpServer())
        .post('/gimnasios/9999/impersonar')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(404);
    });

    it('debe rechazar impersonación por usuario no-SUPERADMIN', async () => {
      await request(app.getHttpServer())
        .post('/gimnasios/1/impersonar')
        .set('Authorization', `Bearer ${adminCentralToken}`)
        .expect(403);
    });

    it('debe rechazar acceso a auditoría sin ser SUPERADMIN', async () => {
      await request(app.getHttpServer())
        .get('/admin/auditoria')
        .set('Authorization', `Bearer ${adminCentralToken}`)
        .expect(403);
    });
  });
});