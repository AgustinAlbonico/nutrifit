import {
  accionesProfesional,
  accionesAdmin,
} from './catalogos/acciones.constants';

// Catálogo completo de acciones usadas en @Actions() decorators
// Estas deben coincidir con los decorators en los controladores
const ACCIONES_REQUERIDAS = [
  // Turnos
  'turnos.ver',
  // Profesionales
  'profesionales.crear',
  'profesionales.listar',
  'profesionales.ver',
  'profesionales.actualizar',
  'profesionales.eliminar',
  // Socios
  'socios.ver',
  'socios.registrar',
  'socios.editar',
  'socios.eliminar',
  'socios.reactivar',
  // Progreso
  'progreso.editar',
  // Auth permissions
  'auth.permissions.read',
  'auth.permissions.write',
  'auth.permissions.assign',
  // Misc
  'agenda.ver',
  'usuarios.ver',
  'permisos.gestionar',
] as const;

describe('Seed Action Catalog', () => {
  describe('accionesProfesional', () => {
    it('debe contener todas las acciones requeridas para PROFESIONAL', () => {
      const claves = accionesProfesional.map((a) => a.clave);

      // Verificar acciones críticas de profesionales
      expect(claves).toContain('turnos.ver');
      expect(claves).toContain('socios.ver');
      expect(claves).toContain('socios.registrar');
      expect(claves).toContain('socios.editar');
      expect(claves).toContain('socios.eliminar');
      expect(claves).toContain('socios.reactivar');
      expect(claves).toContain('profesionales.listar');
      expect(claves).toContain('profesionales.actualizar');
      expect(claves).toContain('progreso.editar');
    });

    it('debe usar profesionales.actualizar (no profesionales.editar)', () => {
      const claves = accionesProfesional.map((a) => a.clave);

      expect(claves).toContain('profesionales.actualizar');
      expect(claves).not.toContain('profesionales.editar');
    });

    it('debe tener descripciones no vacías para todas las acciones', () => {
      for (const accion of accionesProfesional) {
        expect(accion.descripcion.length).toBeGreaterThan(0);
        expect(accion.nombre.length).toBeGreaterThan(0);
      }
    });
  });

  describe('accionesAdmin', () => {
    it('debe contener auth.permissions.read/write/assign', () => {
      const claves = accionesAdmin.map((a) => a.clave);

      expect(claves).toContain('auth.permissions.read');
      expect(claves).toContain('auth.permissions.write');
      expect(claves).toContain('auth.permissions.assign');
    });

    it('debe usar profesionales.actualizar (no profesionales.editar)', () => {
      const claves = accionesAdmin.map((a) => a.clave);

      expect(claves).toContain('profesionales.actualizar');
      expect(claves).not.toContain('profesionales.editar');
    });

    it('debe tener descripciones no vacías para todas las acciones', () => {
      for (const accion of accionesAdmin) {
        expect(accion.descripcion.length).toBeGreaterThan(0);
        expect(accion.nombre.length).toBeGreaterThan(0);
      }
    });
  });

  describe('cobertura del catálogo completo', () => {
    it('debe incluir todas las acciones requeridas por los @Actions() decorators', () => {
      const todasLasClaves = [
        ...accionesProfesional.map((a) => a.clave),
        ...accionesAdmin.map((a) => a.clave),
      ];

      for (const clave of ACCIONES_REQUERIDAS) {
        expect(todasLasClaves).toContain(clave);
      }
    });
  });
});
