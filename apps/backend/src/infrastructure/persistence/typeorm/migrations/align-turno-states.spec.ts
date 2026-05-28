import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';

/**
 * Integration test for AlignTurnoStates migration.
 * Validates that the enum has been pruned to 6 PRD states.
 */
describe('AlignTurnoStates Migration Enum Alignment', () => {
  describe('EstadoTurno enum tiene los 6 valores PRD', () => {
    it('debe tener REALIZADO como estado final de consulta', () => {
      expect(EstadoTurno.REALIZADO).toBe('REALIZADO');
    });

    it('debe tener todos los valores esperados del enum', () => {
      const expectedValues = [
        'PROGRAMADO',
        'PRESENTE',
        'EN_CURSO',
        'REALIZADO',
        'CANCELADO',
        'AUSENTE',
      ];

      const actualValues = Object.values(EstadoTurno);
      expect(actualValues).toEqual(expectedValues);
    });
  });

  describe('EstadoTurno enum NO tiene valores eliminados', () => {
    const enumComoRegistro = EstadoTurno as Record<string, EstadoTurno | undefined>;

    it('no debe tener CONFIRMADO (eliminado)', () => {
      expect(enumComoRegistro.CONFIRMADO).toBeUndefined();
    });

    it('no debe tener REPROGRAMADO (eliminado)', () => {
      expect(enumComoRegistro.REPROGRAMADO).toBeUndefined();
    });

    it('no debe tener BLOQUEADO (eliminado)', () => {
      expect(enumComoRegistro.BLOQUEADO).toBeUndefined();
    });

    it('no debe tener ASISTIO (renombrado a REALIZADO)', () => {
      expect(enumComoRegistro.ASISTIO).toBeUndefined();
    });
  });
});
