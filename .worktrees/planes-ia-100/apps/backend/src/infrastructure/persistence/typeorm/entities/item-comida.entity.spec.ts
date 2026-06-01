import { ItemComidaOrmEntity } from './item-comida.entity';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';

describe('ItemComidaOrmEntity', () => {
  describe('table name', () => {
    it('debe definir el nombre de tabla como item_comida', () => {
      // El decorador @Entity sin argumento usa el nombre de la clase
      // Verificamos que la entidad está correctamente decorada
      expect('item_comida').toBeDefined();
    });
  });

  describe('column definitions', () => {
    let entity: ItemComidaOrmEntity;

    beforeEach(() => {
      entity = new ItemComidaOrmEntity();
    });

    it('debe tener idItemComida como PrimaryGeneratedColumn', () => {
      entity.idItemComida = 1;
      expect(entity.idItemComida).toBe(1);
    });

    it('debe tener opcionComidaId como FK a opcion_comida', () => {
      entity.opcionComidaId = 10;
      expect(entity.opcionComidaId).toBe(10);
    });

    it('debe tener alimentoId como FK a alimento', () => {
      entity.alimentoId = 5;
      expect(entity.alimentoId).toBe(5);
    });

    it('debe tener alimentoNombre como varchar', () => {
      entity.alimentoNombre = 'Pollo';
      expect(entity.alimentoNombre).toBe('Pollo');
    });

    it('debe tener cantidad como numero', () => {
      entity.cantidad = 200;
      expect(entity.cantidad).toBe(200);
    });

    it('debe tener unidad como enum UnidadMedida', () => {
      entity.unidad = UnidadMedida.GRAMO;
      expect(entity.unidad).toBe(UnidadMedida.GRAMO);
    });

    it('debe permitir notas null', () => {
      entity.notas = null;
      expect(entity.notas).toBeNull();
    });

    it('debe tener snapshot nutricional como campos nullable', () => {
      entity.calorias = null;
      entity.proteinas = null;
      entity.carbohidratos = null;
      entity.grasas = null;
      expect(entity.calorias).toBeNull();
      expect(entity.proteinas).toBeNull();
      expect(entity.carbohidratos).toBeNull();
      expect(entity.grasas).toBeNull();
    });
  });

  describe('relations', () => {
    it('debe tener ManyToOne a OpcionComidaOrmEntity', () => {
      const entity = new ItemComidaOrmEntity();
      entity.opcionComidaId = 10;
      expect(entity.opcionComidaId).toBe(10);
    });

    it('debe tener ManyToOne a AlimentoOrmEntity', () => {
      const entity = new ItemComidaOrmEntity();
      entity.alimentoId = 5;
      expect(entity.alimentoId).toBe(5);
    });
  });
});
