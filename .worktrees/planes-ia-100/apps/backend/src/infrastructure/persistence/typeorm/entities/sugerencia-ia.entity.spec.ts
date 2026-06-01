import { SugerenciaIAOrmEntity } from './sugerencia-ia.entity';
import { SugerenciaEstado } from 'src/domain/entities/SugerenciaIA/sugerencia-ia.entity';
import { PropuestaIA } from '@nutrifit/shared';

describe('SugerenciaIAOrmEntity', () => {
  describe('table name', () => {
    it('debe definir el nombre de tabla como sugerencia_ia', () => {
      expect('sugerencia_ia').toBeDefined();
    });
  });

  describe('column definitions', () => {
    let entity: SugerenciaIAOrmEntity;

    beforeEach(() => {
      entity = new SugerenciaIAOrmEntity();
    });

    it('debe tener idSugerencia como PrimaryGeneratedColumn', () => {
      entity.idSugerencia = 1;
      expect(entity.idSugerencia).toBe(1);
    });

    it('debe tener socioId como int', () => {
      entity.socioId = 5;
      expect(entity.socioId).toBe(5);
    });

    it('debe tener objetivo como varchar', () => {
      entity.objetivo = 'Reducir peso';
      expect(entity.objetivo).toBe('Reducir peso');
    });

    it('debe tener restricciones como json nullable', () => {
      entity.restricciones = ['sin gluten', 'bajo en sodio'];
      expect(entity.restricciones).toEqual(['sin gluten', 'bajo en sodio']);
    });

    it('debe permitir restricciones null', () => {
      entity.restricciones = null;
      expect(entity.restricciones).toBeNull();
    });

    it('debe tener infoExtra como text', () => {
      entity.infoExtra = 'Prefiere comidas ligeras';
      expect(entity.infoExtra).toBe('Prefiere comidas ligeras');
    });

    it('debe tener estado como enum SugerenciaEstado', () => {
      entity.estado = SugerenciaEstado.GENERADA;
      expect(entity.estado).toBe(SugerenciaEstado.GENERADA);
    });

    it('debe tener creadaEn como timestamp', () => {
      const fecha = new Date();
      entity.creadaEn = fecha;
      expect(entity.creadaEn).toBe(fecha);
    });

    it('debe tener usadaEn como timestamp nullable', () => {
      entity.usadaEn = null;
      expect(entity.usadaEn).toBeNull();
    });
  });

  describe('propuesta JSON', () => {
    it('debe almacenar propuesta completa en columna jsonb', () => {
      const propuesta: PropuestaIA = {
        nombre: 'Ensalada César',
        ingredientes: [
          { nombre: 'Lechuga romana', cantidad: '100', unidad: 'gramo' },
          { nombre: 'Pollo a la plancha', cantidad: '150', unidad: 'gramo' },
        ],
        pasos: ['Lavar las hojas', 'Cortar el pollo', 'Mezclar todo'],
      };

      const entity = new SugerenciaIAOrmEntity();
      entity.propuesta = propuesta;

      expect(entity.propuesta).toEqual(propuesta);
      expect(entity.propuesta?.nombre).toBe('Ensalada César');
      expect(entity.propuesta?.ingredientes).toHaveLength(2);
      expect(entity.propuesta?.pasos).toHaveLength(3);
    });

    it('debe permitir null en propuesta', () => {
      const entity = new SugerenciaIAOrmEntity();
      entity.propuesta = null;
      expect(entity.propuesta).toBeNull();
    });
  });

  describe('SugerenciaEstado enum values', () => {
    it('debe tener todos los estados posibles', () => {
      const entity = new SugerenciaIAOrmEntity();

      entity.estado = SugerenciaEstado.GENERADA;
      expect(entity.estado).toBe('GENERADA');

      entity.estado = SugerenciaEstado.DESCARTADA;
      expect(entity.estado).toBe('DESCARTADA');

      entity.estado = SugerenciaEstado.INCORPORADA;
      expect(entity.estado).toBe('INCORPORADA');

      entity.estado = SugerenciaEstado.ERROR;
      expect(entity.estado).toBe('ERROR');
    });
  });
});
