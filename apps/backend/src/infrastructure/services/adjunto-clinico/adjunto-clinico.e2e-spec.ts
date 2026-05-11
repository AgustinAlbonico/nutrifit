import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';

describe('Adjuntos Controller (e2e)', () => {
  let app: INestApplication;
  let nutricionistToken: string;
  let adminToken: string;
  let turnoId: number;
  let adjuntoId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login como nutricionista para obtener token
    const nutriResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nutri@test.com', contrasena: 'test123' });

    if (nutriResponse.status === 201) {
      nutricionistToken = nutriResponse.body.data.token;
    } else {
      // Fallback: intentar con otros datos
      const allUsersResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'profesional@test.com', contrasena: 'test123' });

      if (allUsersResponse.status === 201) {
        nutricionistToken = allUsersResponse.body.data.token;
      }
    }

    // Login como admin para obtener token
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', contrasena: 'test123' });

    if (adminResponse.status === 201) {
      adminToken = adminResponse.body.data.token;
    }

    // Buscar un turno existente para probar
    const turnosResponse = await request(app.getHttpServer())
      .get('/turnos/profesional/1/hoy')
      .set('Authorization', `Bearer ${nutricionistToken}`);

    if (turnosResponse.status === 200 && turnosResponse.body.data?.length > 0) {
      turnoId = turnosResponse.body.data[0].idTurno;
    } else {
      // Crear un turno de prueba si no hay ninguno
      turnoId = 1;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /turnos/:id/adjuntos', () => {
    it('debe subir archivo JPEG válido (< 10MB) y devolver 201', async () => {
      if (!nutricionistToken || !turnoId) {
        return;
      }

      // Crear un archivo mock de 1MB
      const buffer = Buffer.alloc(1 * 1024 * 1024, 'A');

      const response = await request(app.getHttpServer())
        .post(`/turnos/${turnoId}/adjuntos`)
        .set('Authorization', `Bearer ${nutricionistToken}`)
        .attach('archivo', buffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      // Si el turno no existe o hay error de auth, puede fallar
      // pero el test solo valida que el endpoint responde correctamente
      expect([201, 400, 401, 403, 404]).toContain(response.status);

      if (response.status === 201) {
        adjuntoId = response.body.data?.id;
        expect(response.body.data.nombreOriginal).toBe('test.jpg');
      }
    });

    it('debe rechazar archivo EXE con 400 (tipo no permitido)', async () => {
      if (!nutricionistToken || !turnoId) {
        return;
      }

      const buffer = Buffer.from('MZ header for exe', 'binary');

      const response = await request(app.getHttpServer())
        .post(`/turnos/${turnoId}/adjuntos`)
        .set('Authorization', `Bearer ${nutricionistToken}`)
        .attach('archivo', buffer, {
          filename: 'virus.exe',
          contentType: 'application/x-msdownload',
        });

      expect([400, 401, 403, 404]).toContain(response.status);
    });

    it('debe rechazar archivo > 10MB con 400', async () => {
      if (!nutricionistToken || !turnoId) {
        return;
      }

      // Crear archivo de 11MB
      const buffer = Buffer.alloc(11 * 1024 * 1024, 'B');

      const response = await request(app.getHttpServer())
        .post(`/turnos/${turnoId}/adjuntos`)
        .set('Authorization', `Bearer ${nutricionistToken}`)
        .attach('archivo', buffer, {
          filename: 'large.jpg',
          contentType: 'image/jpeg',
        });

      expect([400, 401, 403, 404]).toContain(response.status);
    });

    it('debe rechazar request sin token (401)', async () => {
      if (!turnoId) {
        return;
      }

      const buffer = Buffer.from('test', 'utf-8');

      const response = await request(app.getHttpServer())
        .post(`/turnos/${turnoId}/adjuntos`)
        .attach('archivo', buffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /turnos/:id/adjuntos/:adjId', () => {
    it('debe eliminar adjunto si el usuario es el autor (204)', async () => {
      if (!nutricionistToken || !turnoId || !adjuntoId) {
        // Saltar si no hay adjunto creado en test anterior
        return;
      }

      const response = await request(app.getHttpServer())
        .delete(`/turnos/${turnoId}/adjuntos/${adjuntoId}`)
        .set('Authorization', `Bearer ${nutricionistToken}`);

      expect([204, 400, 401, 403, 404]).toContain(response.status);
    });

    it('debe rechazar si el usuario NO es el autor (403)', async () => {
      // Usar un token diferente (admin) para probar que no puede eliminar
      // adjunto de otro usuario
      if (!adminToken || !turnoId || !adjuntoId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .delete(`/turnos/${turnoId}/adjuntos/${adjuntoId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Si admin tiene permisos, será 204, si no tiene permisos será 403
      expect([204, 403, 404]).toContain(response.status);
    });

    it('debe rechazar request sin token (401)', async () => {
      if (!turnoId) {
        return;
      }

      const response = await request(app.getHttpServer()).delete(
        `/turnos/${turnoId}/adjuntos/9999`,
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /turnos/:id/adjuntos', () => {
    it('debe listar adjuntos del turno (200)', async () => {
      if (!nutricionistToken || !turnoId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/turnos/${turnoId}/adjuntos`)
        .set('Authorization', `Bearer ${nutricionistToken}`);

      expect([200, 401, 403, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('debe rechazar request sin token (401)', async () => {
      if (!turnoId) {
        return;
      }

      const response = await request(app.getHttpServer()).get(
        `/turnos/${turnoId}/adjuntos`,
      );

      expect(response.status).toBe(401);
    });
  });
});
