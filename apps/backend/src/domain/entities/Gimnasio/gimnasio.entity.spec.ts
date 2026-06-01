import { GimnasioEntity } from './gimnasio.entity';

describe('GimnasioEntity', () => {
  describe('constructor', () => {
    it('debe crear una entidad con todos los campos requeridos', () => {
      const fechaAlta = new Date('2025-01-01');
      const entity = new GimnasioEntity({
        id: 1,
        nombre: 'Gym Central',
        direccion: 'Calle Principal 123',
        telefono: '1234567890',
        email: 'central@gym.com',
        fechaAlta,
        fechaBaja: null,
      });

      expect(entity.id).toBe(1);
      expect(entity.nombre).toBe('Gym Central');
      expect(entity.direccion).toBe('Calle Principal 123');
      expect(entity.telefono).toBe('1234567890');
      expect(entity.email).toBe('central@gym.com');
      expect(entity.fechaAlta).toBe(fechaAlta);
      expect(entity.fechaBaja).toBeNull();
    });

    it('debe crear una entidad sin email ni telefono (opcionales)', () => {
      const entity = new GimnasioEntity({
        id: 2,
        nombre: 'Gym Norte',
        direccion: 'Av. Secundario 456',
        telefono: null,
        email: null,
        fechaAlta: new Date(),
        fechaBaja: null,
      });

      expect(entity.id).toBe(2);
      expect(entity.nombre).toBe('Gym Norte');
      expect(entity.telefono).toBeNull();
      expect(entity.email).toBeNull();
    });

    it('debe crear una entidad marcada como eliminado (fechaBaja presente)', () => {
      const fechaBaja = new Date('2025-06-01');
      const entity = new GimnasioEntity({
        id: 3,
        nombre: 'Gym Eliminado',
        direccion: 'Calle Eliminada 789',
        telefono: null,
        email: null,
        fechaAlta: new Date('2024-01-01'),
        fechaBaja,
      });

      expect(entity.fechaBaja).toBe(fechaBaja);
      expect(entity.activo).toBe(false);
    });

    it('debe retornar activo=true cuando fechaBaja es null', () => {
      const entity = new GimnasioEntity({
        id: 1,
        nombre: 'Gym Activo',
        direccion: 'Direccion',
        telefono: null,
        email: null,
        fechaAlta: new Date(),
        fechaBaja: null,
      });

      expect(entity.activo).toBe(true);
    });

    it('debe retornar activo=false cuando fechaBaja no es null', () => {
      const entity = new GimnasioEntity({
        id: 1,
        nombre: 'Gym Inactivo',
        direccion: 'Direccion',
        telefono: null,
        email: null,
        fechaAlta: new Date(),
        fechaBaja: new Date(),
      });

      expect(entity.activo).toBe(false);
    });
  });
});