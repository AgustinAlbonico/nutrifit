import { SugerenciaIAEntity, SugerenciaEstado } from './sugerencia-ia.entity';
import { PropuestaIA } from '@nutrifit/shared';

describe('SugerenciaIAEntity', () => {
  describe('constructor', () => {
    it('debe crear una instancia con valores correctamente asignados', () => {
      const propuesta: PropuestaIA = {
        nombre: 'Ensalada César',
        ingredientes: [
          { nombre: 'Lechuga romana', cantidad: '100', unidad: 'gramo' },
          { nombre: 'Pollo a la plancha', cantidad: '150', unidad: 'gramo' },
        ],
        pasos: ['Lavar las hojas', 'Cortar el pollo', 'Mezclar todo'],
      };

      const entity = new SugerenciaIAEntity({
        idSugerencia: 1,
        socioId: 5,
        objetivo: 'Reducir peso',
        restricciones: ['sin gluten', 'bajo en sodio'],
        infoExtra: 'Prefiere comidas ligeras',
        propuesta,
        estado: SugerenciaEstado.GENERADA,
        creadaEn: new Date('2026-05-03'),
        usadaEn: null,
      });

      expect(entity.idSugerencia).toBe(1);
      expect(entity.socioId).toBe(5);
      expect(entity.objetivo).toBe('Reducir peso');
      expect(entity.restricciones).toEqual(['sin gluten', 'bajo en sodio']);
      expect(entity.infoExtra).toBe('Prefiere comidas ligeras');
      expect(entity.propuesta).toEqual(propuesta);
      expect(entity.estado).toBe(SugerenciaEstado.GENERADA);
      expect(entity.creadaEn).toEqual(new Date('2026-05-03'));
      expect(entity.usadaEn).toBeNull();
    });

    it('debe permitir restricciones nulas', () => {
      const entity = new SugerenciaIAEntity({
        idSugerencia: null,
        socioId: 3,
        objetivo: 'Mantener peso',
        restricciones: null,
        infoExtra: 'Sin preferencias especiales',
        propuesta: null,
        estado: SugerenciaEstado.GENERADA,
        creadaEn: new Date(),
        usadaEn: null,
      });

      expect(entity.restricciones).toBeNull();
      expect(entity.propuesta).toBeNull();
    });
  });

  describe('SugerenciaEstado enum', () => {
    it('debe tener los estados correctos', () => {
      expect(SugerenciaEstado.GENERADA).toBe('GENERADA');
      expect(SugerenciaEstado.DESCARTADA).toBe('DESCARTADA');
      expect(SugerenciaEstado.INCORPORADA).toBe('INCORPORADA');
      expect(SugerenciaEstado.ERROR).toBe('ERROR');
    });

    it('debe permitir cambiar el estado', () => {
      const entity = new SugerenciaIAEntity({
        idSugerencia: 1,
        socioId: 5,
        objetivo: 'Test',
        restricciones: null,
        infoExtra: 'Test',
        propuesta: null,
        estado: SugerenciaEstado.GENERADA,
        creadaEn: new Date(),
        usadaEn: null,
      });

      entity.estado = SugerenciaEstado.DESCARTADA;
      expect(entity.estado).toBe(SugerenciaEstado.DESCARTADA);

      entity.estado = SugerenciaEstado.INCORPORADA;
      expect(entity.estado).toBe(SugerenciaEstado.INCORPORADA);
    });
  });

  describe('propuesta JSON', () => {
    it('debe almacenar propuesta completa con ingredientes y pasos', () => {
      const propuesta: PropuestaIA = {
        nombre: 'Smoothie proteico',
        ingredientes: [
          { nombre: 'Plátano', cantidad: '1', unidad: 'unidad' },
          { nombre: 'Proteína en polvo', cantidad: '30', unidad: 'gramo' },
          { nombre: 'Leche descremada', cantidad: '200', unidad: 'ml' },
        ],
        pasos: [
          'Colocar todos los ingredientes en la licuadora',
          'Licuar por 2 minutos',
          'Servir inmediatamente',
        ],
      };

      const entity = new SugerenciaIAEntity({
        idSugerencia: 2,
        socioId: 10,
        objetivo: 'Aumentar masa muscular',
        restricciones: null,
        infoExtra: 'Post entrenamiento',
        propuesta,
        estado: SugerenciaEstado.GENERADA,
        creadaEn: new Date(),
        usadaEn: null,
      });

      expect(entity.propuesta).toBeDefined();
      expect(entity.propuesta?.nombre).toBe('Smoothie proteico');
      expect(entity.propuesta?.ingredientes).toHaveLength(3);
      expect(entity.propuesta?.pasos).toHaveLength(3);
    });

    it('debe permitir null en propuesta', () => {
      const entity = new SugerenciaIAEntity({
        idSugerencia: 1,
        socioId: 1,
        objetivo: 'Test',
        restricciones: null,
        infoExtra: 'Test',
        propuesta: null,
        estado: SugerenciaEstado.ERROR,
        creadaEn: new Date(),
        usadaEn: null,
      });

      expect(entity.propuesta).toBeNull();
      expect(entity.estado).toBe(SugerenciaEstado.ERROR);
    });
  });

  describe('timestamps', () => {
    it('debe registrar fecha de creación', () => {
      const ahora = new Date();
      const entity = new SugerenciaIAEntity({
        idSugerencia: 1,
        socioId: 1,
        objetivo: 'Test',
        restricciones: null,
        infoExtra: 'Test',
        propuesta: null,
        estado: SugerenciaEstado.GENERADA,
        creadaEn: ahora,
        usadaEn: null,
      });

      expect(entity.creadaEn).toBe(ahora);
    });

    it('debe permitir registrar fecha de uso', () => {
      const entity = new SugerenciaIAEntity({
        idSugerencia: 1,
        socioId: 1,
        objetivo: 'Test',
        restricciones: null,
        infoExtra: 'Test',
        propuesta: null,
        estado: SugerenciaEstado.GENERADA,
        creadaEn: new Date(),
        usadaEn: null,
      });

      const fechaUso = new Date('2026-05-10');
      entity.usadaEn = fechaUso;

      expect(entity.usadaEn).toBe(fechaUso);
    });
  });
});
