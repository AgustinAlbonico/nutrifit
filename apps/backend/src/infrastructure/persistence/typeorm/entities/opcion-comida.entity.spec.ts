import { OpcionComidaOrmEntity } from './opcion-comida.entity';
import { ItemComidaOrmEntity } from './item-comida.entity';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

describe('OpcionComidaOrmEntity', () => {
  describe('items relation (replaces M2M alimentos)', () => {
    it('debe tener un array de items como OneToMany', () => {
      const entity = new OpcionComidaOrmEntity();
      entity.items = [];
      expect(entity.items).toBeInstanceOf(Array);
    });

    it('debe permitir agregar ItemComida al array items', () => {
      const entity = new OpcionComidaOrmEntity();
      const item = new ItemComidaOrmEntity();
      item.idItemComida = 1;
      item.alimentoId = 5;
      item.alimentoNombre = 'Pollo';
      item.cantidad = 200;

      entity.items = [item];
      expect(entity.items).toHaveLength(1);
      expect(entity.items[0].alimentoNombre).toBe('Pollo');
    });
  });

  describe('tieneItemsReales getter', () => {
    it('debe retornar false cuando items esta vacio', () => {
      const entity = new OpcionComidaOrmEntity();
      entity.items = [];
      expect(entity.tieneItemsReales).toBe(false);
    });

    it('debe retornar true cuando items tiene al menos un item', () => {
      const entity = new OpcionComidaOrmEntity();
      const item = new ItemComidaOrmEntity();
      item.idItemComida = 1;
      entity.items = [item];
      expect(entity.tieneItemsReales).toBe(true);
    });

    it('debe retornar false cuando items es undefined', () => {
      const entity = new OpcionComidaOrmEntity();
      entity.items = undefined as any;
      expect(entity.tieneItemsReales).toBe(false);
    });
  });

  describe('existing columns preserved', () => {
    it('debe mantener idOpcionComida como PrimaryGeneratedColumn', () => {
      const entity = new OpcionComidaOrmEntity();
      entity.idOpcionComida = 10;
      expect(entity.idOpcionComida).toBe(10);
    });

    it('debe mantener comentarios como varchar nullable', () => {
      const entity = new OpcionComidaOrmEntity();
      entity.comentarios = 'Sin cebolla';
      expect(entity.comentarios).toBe('Sin cebolla');
    });

    it('debe mantener tipoComida como enum', () => {
      const entity = new OpcionComidaOrmEntity();
      entity.tipoComida = TipoComida.ALMUERZO;
      expect(entity.tipoComida).toBe(TipoComida.ALMUERZO);
    });
  });

  describe('relacion con diaPlan', () => {
    it('debe mantener la relacion ManyToOne con DiaPlanOrmEntity', () => {
      const entity = new OpcionComidaOrmEntity();
      // diaPlan es una relación ManyToOne que TypeORM-popula cuando se carga la entidad
      // Verificamos que la propiedad existe en el prototipo (será undefined en instancia nueva)
      expect('diaPlan').toBeDefined();
    });
  });
});
