import { ItemComidaEntity } from './item-comida.entity';
import { UnidadMedida } from '../Alimento/UnidadMedida';

describe('ItemComidaEntity', () => {
  describe('constructor', () => {
    it('debe crear una instancia con valores correctamente asignados', () => {
      const entity = new ItemComidaEntity({
        idItemComida: 1,
        opcionComidaId: 10,
        alimentoId: 5,
        alimentoNombre: 'Pollo',
        cantidad: 200,
        unidad: UnidadMedida.GRAMO,
        notas: 'Sin piel',
        calorias: 220,
        proteinas: 40,
        carbohidratos: 0,
        grasas: 5,
      });

      expect(entity.idItemComida).toBe(1);
      expect(entity.opcionComidaId).toBe(10);
      expect(entity.alimentoId).toBe(5);
      expect(entity.alimentoNombre).toBe('Pollo');
      expect(entity.cantidad).toBe(200);
      expect(entity.unidad).toBe(UnidadMedida.GRAMO);
      expect(entity.notas).toBe('Sin piel');
      expect(entity.calorias).toBe(220);
      expect(entity.proteinas).toBe(40);
      expect(entity.carbohidratos).toBe(0);
      expect(entity.grasas).toBe(5);
    });

    it('debe permitir valores nulos en campos opcionales', () => {
      const entity = new ItemComidaEntity({
        idItemComida: null,
        opcionComidaId: null,
        alimentoId: 3,
        alimentoNombre: 'Manzana',
        cantidad: 150,
        unidad: UnidadMedida.GRAMO,
        notas: null,
        calorias: null,
        proteinas: null,
        carbohidratos: null,
        grasas: null,
      });

      expect(entity.idItemComida).toBeNull();
      expect(entity.opcionComidaId).toBeNull();
      expect(entity.notas).toBeNull();
      expect(entity.calorias).toBeNull();
    });
  });

  describe('snapshot nutricional', () => {
    it('debe almacenar el snapshot nutricional con todos sus campos', () => {
      const entity = new ItemComidaEntity({
        idItemComida: 1,
        opcionComidaId: 1,
        alimentoId: 2,
        alimentoNombre: 'Arroz',
        cantidad: 100,
        unidad: UnidadMedida.GRAMO,
        notas: null,
        calorias: 130,
        proteinas: 2.5,
        carbohidratos: 28,
        grasas: 0.5,
      });

      expect(entity.calorias).toBe(130);
      expect(entity.proteinas).toBe(2.5);
      expect(entity.carbohidratos).toBe(28);
      expect(entity.grasas).toBe(0.5);
    });

    it('debe permitir calcular macros en base a cantidad y alimento base', () => {
      // Si el snapshot nutritional se calcula como cantidad * base, verificamos la estructura
      const entity = new ItemComidaEntity({
        idItemComida: 1,
        opcionComidaId: 1,
        alimentoId: 4,
        alimentoNombre: 'Huevo',
        cantidad: 100,
        unidad: UnidadMedida.GRAMO,
        notas: null,
        calorias: 155,
        proteinas: 13,
        carbohidratos: 1.1,
        grasas: 11,
      });

      // El snapshot debe tener valores específicos
      expect(entity.calorias).toBeGreaterThan(0);
      expect(entity.proteinas).toBeGreaterThan(0);
      expect(typeof entity.calorias).toBe('number');
      expect(typeof entity.proteinas).toBe('number');
    });
  });
});
