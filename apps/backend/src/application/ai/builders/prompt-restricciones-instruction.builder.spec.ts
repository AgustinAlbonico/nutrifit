import { PromptRestriccionesInstructionBuilder } from './prompt-restricciones-instruction.builder';
import type { RestriccionNoCumplida } from '../../../domain/validators/restricciones-validator-v2';

describe('PromptRestriccionesInstructionBuilder', () => {
  describe('generar', () => {
    it('sin violaciones → string vacío', () => {
      const instruccion = PromptRestriccionesInstructionBuilder.generar([]);
      expect(instruccion).toBe('');
    });

    it('1 violación → instrucción con EXCLUIR y detalle', () => {
      const violaciones: RestriccionNoCumplida[] = [
        {
          restriccion: 'alergia: Maní',
          detalle: 'El alimento "Mix de maní" contiene maní',
          alimento: 'Mix de maní',
        },
      ];

      const instruccion =
        PromptRestriccionesInstructionBuilder.generar(violaciones);

      expect(instruccion).toContain('EXCLUIR');
      expect(instruccion).toContain('Mix de maní');
      expect(instruccion).toContain('alergia: Maní');
    });

    it('3 violaciones de distinta restricción → lista todas y deduplica alimentos', () => {
      const violaciones: RestriccionNoCumplida[] = [
        {
          restriccion: 'alergia: Pollo',
          detalle: 'd1',
          alimento: 'Pollo',
        },
        {
          restriccion: 'patron dietario: vegano',
          detalle: 'd2',
          alimento: 'Pollo',
        },
        {
          restriccion: 'alergia: Pollo',
          detalle: 'd3',
          alimento: 'Suprema de pollo',
        },
      ];

      const instruccion =
        PromptRestriccionesInstructionBuilder.generar(violaciones);

      // Alimentos deduplicados
      expect(instruccion).toContain('Pollo');
      expect(instruccion).toContain('Suprema de pollo');

      // Restricciones listadas (ambas)
      expect(instruccion).toContain('alergia: Pollo');
      expect(instruccion).toContain('patron dietario: vegano');

      // Aparece EXCLUIR y el mensaje de regenerar
      expect(instruccion).toContain('EXCLUIR');
      expect(instruccion).toContain('Generá alternativas');
    });

    it('violaciones sin campo "alimento" → maneja gracefully', () => {
      const violaciones: RestriccionNoCumplida[] = [
        {
          restriccion: 'patron dietario: vegano',
          detalle: 'algún alimento de origen animal',
        },
      ];

      const instruccion =
        PromptRestriccionesInstructionBuilder.generar(violaciones);

      expect(instruccion).toContain('EXCLUIR');
      expect(instruccion).toContain('patron dietario: vegano');
    });
  });
});
