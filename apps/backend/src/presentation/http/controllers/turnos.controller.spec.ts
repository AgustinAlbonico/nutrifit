import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { TurnosController } from './turnos.controller';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { NutricionistaOwnershipGuard } from 'src/infrastructure/auth/guards/nutricionista-ownership.guard';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { ActualizarMedicionDto } from 'src/application/turnos/dtos';

/**
 * Spec de RB16 para los endpoints de ficha de salud en TurnosController.
 *
 * Valida declarativamente que cada endpoint de ficha-salud rechaza a
 * un usuario con rol RECEPCIONISTA (no debe ver datos clínicos).
 *
 * Estrategia: instanciamos el `RolesGuard` real con un `Reflector`
 * real, leemos los metadatos `@Rol` aplicados a cada handler del
 * controller, y luego ejecutamos el guard con un contexto simulado
 * que tiene `user.rol = RECEPCIONISTA`. El guard debe retornar `false`
 * (lo que resultaría en 403 ForbiddenException en el flujo real).
 *
 * Endpoints cubiertos:
 *  - GET /turnos/socio/ficha-salud              → @Rol(SOCIO)
 *  - GET /turnos/socio/ficha-salud/historial    → @Rol(SOCIO)
 *  - GET /turnos/socio/ficha-salud/version/:n   → @Rol(SOCIO)
 *  - GET /turnos/profesional/:n/pacientes/:s/ficha-salud      → @Rol(NUTRICIONISTA)
 *  - GET /turnos/profesional/:n/pacientes/:s/ficha-salud/historial → @Rol(NUTRICIONISTA)
 *  - GET /turnos/profesional/:n/pacientes/:s/ficha-salud/version/:n → @Rol(NUTRICIONISTA)
 */
describe('TurnosController — RB16 (RECEPCIONISTA no ve ficha-salud)', () => {
  let reflector: Reflector;
  let rolesGuard: RolesGuard;

  // Stub mínimo del controller para extraer los metadatos de los handlers.
  // No instanciamos el controller completo (sería muy costoso) — solo
  // necesitamos los handlers reales. Definimos un objeto con los mismos
  // nombres de métodos y la misma firma que TurnosController.
  const controllerHandlers: Record<string, Function> = {
    getFichaSaludSocio: TurnosController.prototype.getFichaSaludSocio,
    upsertFichaSaludSocio: TurnosController.prototype.upsertFichaSaludSocio,
    listarHistorialFichaSaludSocio:
      TurnosController.prototype.listarHistorialFichaSaludSocio,
    obtenerVersionFichaSaludSocio:
      TurnosController.prototype.obtenerVersionFichaSaludSocio,
    getFichaSaludPaciente: TurnosController.prototype.getFichaSaludPaciente,
    listarHistorialFichaSaludPaciente:
      TurnosController.prototype.listarHistorialFichaSaludPaciente,
    obtenerVersionFichaSaludPaciente:
      TurnosController.prototype.obtenerVersionFichaSaludPaciente,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Reflector, RolesGuard],
    }).compile();

    reflector = module.get<Reflector>(Reflector);
    rolesGuard = module.get<RolesGuard>(RolesGuard);
  });

  /**
   * Helper: simula un ExecutionContext con un usuario autenticado del
   * rol indicado. Devuelve true/false según la decisión del guard.
   */
  const ejecutarGuardComo = (handler: Function, rol: Rol): boolean => {
    const httpHost = {
      getRequest: () => ({
        user: {
          id: 1,
          email: 'x@x.com',
          rol,
          gimnasioId: 1,
          personaId: 1,
          jti: 'j',
        },
      }),
      getResponse: () => ({}),
      getNext: () => ({}),
    };

    const mockContext = {
      getHandler: () => handler,
      getClass: () => TurnosController,
      switchToHttp: () => httpHost,
      getArgs: () => [],
      getArgByIndex: () => ({}),
      getType: () => 'http',
    } as unknown as ExecutionContext;

    return rolesGuard.canActivate(mockContext);
  };

  describe('Endpoints de ficha-salud para SOCIO', () => {
    const endpointsSocio = [
      ['getFichaSaludSocio', 'GET /turnos/socio/ficha-salud'],
      [
        'listarHistorialFichaSaludSocio',
        'GET /turnos/socio/ficha-salud/historial',
      ],
      [
        'obtenerVersionFichaSaludSocio',
        'GET /turnos/socio/ficha-salud/version/:n',
      ],
      ['upsertFichaSaludSocio', 'PUT /turnos/socio/ficha-salud'],
    ] as const;

    it.each(endpointsSocio)(
      '%s: RECEPCIONISTA → 403 (RolesGuard retorna false)',
      (handlerName) => {
        const handler = controllerHandlers[handlerName];
        expect(handler).toBeDefined();
        const allowed = ejecutarGuardComo(handler, Rol.RECEPCIONISTA);
        expect(allowed).toBe(false);
      },
    );

    it.each(endpointsSocio)(
      '%s: SOCIO → permitido (RolesGuard retorna true)',
      (handlerName) => {
        const handler = controllerHandlers[handlerName];
        const allowed = ejecutarGuardComo(handler, Rol.SOCIO);
        expect(allowed).toBe(true);
      },
    );
  });

  describe('Endpoints de ficha-salud para NUTRICIONISTA', () => {
    const endpointsNutri = [
      [
        'getFichaSaludPaciente',
        'GET /turnos/profesional/:n/pacientes/:s/ficha-salud',
      ],
      [
        'listarHistorialFichaSaludPaciente',
        'GET /turnos/profesional/:n/pacientes/:s/ficha-salud/historial',
      ],
      [
        'obtenerVersionFichaSaludPaciente',
        'GET /turnos/profesional/:n/pacientes/:s/ficha-salud/version/:n',
      ],
    ] as const;

    it.each(endpointsNutri)(
      '%s: RECEPCIONISTA → 403 (RolesGuard retorna false)',
      (handlerName) => {
        const handler = controllerHandlers[handlerName];
        const allowed = ejecutarGuardComo(handler, Rol.RECEPCIONISTA);
        expect(allowed).toBe(false);
      },
    );

    it.each(endpointsNutri)(
      '%s: NUTRICIONISTA → permitido (RolesGuard retorna true)',
      (handlerName) => {
        const handler = controllerHandlers[handlerName];
        const allowed = ejecutarGuardComo(handler, Rol.NUTRICIONISTA);
        expect(allowed).toBe(true);
      },
    );
  });

  describe('Documentación de invariantes RB16', () => {
    it('ningún endpoint de ficha-salud acepta RECEPCIONISTA en su @Rol', () => {
      // Verificación agregada: ningún handler de ficha-salud tiene
      // RECEPCIONISTA en su lista de roles permitidos.
      const fichaSaludHandlers = Object.entries(controllerHandlers).filter(
        ([name]) => name.toLowerCase().includes('fichasalud'),
      );

      expect(fichaSaludHandlers.length).toBeGreaterThan(0);

      for (const [name, handler] of fichaSaludHandlers) {
        // Si en el futuro alguien agrega RECEPCIONISTA a un @Rol
        // de ficha-salud, este test fallaría. Es un guardrail
        // declarativo para RB16.
        const allowed = ejecutarGuardComo(handler, Rol.RECEPCIONISTA);
        if (allowed) {
          throw new Error(`Endpoint ${name} acepta RECEPCIONISTA — viola RB16`);
        }
      }
    });
  });
});

// Sentinel: el archivo compila incluso si hay imports no usados
// (e.g. JwtAuthGuard, NutricionistaOwnershipGuard). Mantenerlos
// documenta explícitamente que estos guards también están involucrados
// en la cadena de autorización de los endpoints de ficha-salud.
void JwtAuthGuard;
void NutricionistaOwnershipGuard;

describe('TurnosController — mediciones editables', () => {
  it('expone PUT /turnos/:id/mediciones/:medicionId', () => {
    const handler = TurnosController.prototype.actualizarMedicion;

    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      ':id/mediciones/:medicionId',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.PUT,
    );
  });

  it('delega PUT /turnos/:id/mediciones/:medicionId al caso de uso de actualización', async () => {
    const payload: ActualizarMedicionDto = { peso: 72, altura: 180 };
    const actualizarMedicionUseCase = {
      execute: jest.fn().mockResolvedValue({
        success: true,
        imc: 22.22,
        idMedicion: 5,
      }),
    };
    const controller = Object.assign(
      Object.create(TurnosController.prototype),
      {
        actualizarMedicionUseCase,
        logger: { log: jest.fn() },
      },
    ) as Pick<TurnosController, 'actualizarMedicion'>;

    const resultado = await controller.actualizarMedicion(1, 5, payload);

    expect(actualizarMedicionUseCase.execute).toHaveBeenCalledWith(
      1,
      5,
      payload,
    );
    expect(resultado).toEqual({ success: true, imc: 22.22, idMedicion: 5 });
  });
});
