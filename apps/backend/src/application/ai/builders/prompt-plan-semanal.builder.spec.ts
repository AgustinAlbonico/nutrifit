import {
  PromptPlanSemanalBuilder,
  type ContextoPromptPlanSemanal,
} from './prompt-plan-semanal.builder';

const builder = new PromptPlanSemanalBuilder();

const fechaBase = new Date('2026-06-30T00:00:00Z');

const contextoMinimo: ContextoPromptPlanSemanal = {
  fichaClinica: {
    alergias: [],
    restriccionesAlimentarias: null,
    patologias: [],
    objetivoPersonal: null,
  },
  nutricionista: {
    preferenciasIa: null,
  },
  notasGeneracion: null,
  ejemplosMemoria: [],
  diasAGenerar: 7,
  comidasPorDia: 4,
  alternativasPorComida: 3,
  fechaInicio: fechaBase,
};

describe('PromptPlanSemanalBuilder', () => {
  describe('construir', () => {
    it('mínimo — contexto vacío genera prompts válidos', () => {
      const resultado = builder.construir(contextoMinimo);

      expect(resultado.systemPrompt).toContain(
        'Eres un nutricionista profesional',
      );
      expect(resultado.systemPrompt).toContain('EXACTAMENTE 7 días');
      expect(resultado.systemPrompt).toContain('EXACTAMENTE 4 comidas');
      expect(resultado.systemPrompt).toContain('EXACTAMENTE 3 alternativas');
      expect(resultado.systemPrompt).toContain('estructura');
      expect(resultado.systemPrompt).toContain('macrosPorDia');
      expect(resultado.systemPrompt).toContain('razonamientoCumplimiento');

      expect(resultado.userPrompt).toContain('CONTEXTO DEL SOCIO');
      expect(resultado.userPrompt).toContain('2026-06-30');
    });

    it('incluye preferencias IA del nutricionista en el system prompt', () => {
      const contexto = {
        ...contextoMinimo,
        nutricionista: {
          preferenciasIa:
            'Preferí opciones con bajo índice glucémico. Evitá procesados.',
        },
      };

      const resultado = builder.construir(contexto);

      expect(resultado.systemPrompt).toContain(
        'Preferí opciones con bajo índice glucémico',
      );
      expect(resultado.systemPrompt).toContain('Preferencias persistentes');
    });

    it('incluye notas de generación en el system prompt', () => {
      const contexto = {
        ...contextoMinimo,
        notasGeneracion:
          'Este socio es runner, necesita alta carga de carbohidratos.',
      };

      const resultado = builder.construir(contexto);

      expect(resultado.systemPrompt).toContain('alta carga de carbohidratos');
      expect(resultado.systemPrompt).toContain('Notas para esta generación');
    });

    it('concatena preferencias IA + notas de generación en orden', () => {
      const contexto = {
        ...contextoMinimo,
        nutricionista: {
          preferenciasIa: 'Opción A: vegano friendly',
        },
        notasGeneracion: 'Opción B: incluir legumbres',
      };

      const resultado = builder.construir(contexto);

      // Ambas deben estar
      expect(resultado.systemPrompt).toContain('vegano friendly');
      expect(resultado.systemPrompt).toContain('incluir legumbres');

      // Las preferencias persistentes van primero
      const idxA = resultado.systemPrompt.indexOf('vegano friendly');
      const idxB = resultado.systemPrompt.indexOf('incluir legumbres');
      expect(idxA).toBeLessThan(idxB);
    });

    it('incluye ejemplos de memoria POSITIVO y NEGATIVO', () => {
      const contexto = {
        ...contextoMinimo,
        ejemplosMemoria: [
          {
            tipoEjemplo: 'POSITIVO' as const,
            comentario: 'Plan con hidratación adecuada al final del día',
          },
          {
            tipoEjemplo: 'NEGATIVO' as const,
            comentario: 'No repetir la misma cena 3 veces en la semana',
          },
        ],
      };

      const resultado = builder.construir(contexto);

      expect(resultado.systemPrompt).toContain('EJEMPLOS DE FEEDBACK');
      expect(resultado.systemPrompt).toContain('hidratación adecuada');
      expect(resultado.systemPrompt).toContain('No repetir la misma cena');
      expect(resultado.systemPrompt).toContain('[✓]');
      expect(resultado.systemPrompt).toContain('[✗]');
    });

    it('omite sección de notas si no hay preferencias ni notas', () => {
      const resultado = builder.construir(contextoMinimo);

      expect(resultado.systemPrompt).not.toContain(
        'INSTRUCCIONES DEL NUTRICIONISTA',
      );
      expect(resultado.systemPrompt).not.toContain('Preferencias persistentes');
    });

    it('omite sección de ejemplos si la memoria está vacía', () => {
      const resultado = builder.construir(contextoMinimo);

      expect(resultado.systemPrompt).not.toContain('EJEMPLOS DE FEEDBACK');
    });

    it('respeta diasAGenerar custom (3 días)', () => {
      const contexto = {
        ...contextoMinimo,
        diasAGenerar: 3,
      };

      const resultado = builder.construir(contexto);

      expect(resultado.systemPrompt).toContain('EXACTAMENTE 3 días');
      // El esquema debe listar exactamente LUNES, MARTES, MIERCOLES
      expect(resultado.systemPrompt).toContain('LUNES');
      expect(resultado.systemPrompt).toContain('MARTES');
      expect(resultado.systemPrompt).toContain('MIERCOLES');
      expect(resultado.systemPrompt).not.toContain('JUEVES');
      expect(resultado.systemPrompt).not.toContain('SABADO');
    });

    it('user prompt incluye datos del socio: alergias, restricciones, patologías', () => {
      const contexto = {
        ...contextoMinimo,
        fichaClinica: {
          alergias: ['Maní', 'Frutos secos'],
          restriccionesAlimentarias: 'vegano',
          patologias: ['diabetes tipo 2'],
          objetivoPersonal: 'Bajar 5kg en 3 meses',
        },
      };

      const resultado = builder.construir(contexto);

      expect(resultado.userPrompt).toContain('Bajar 5kg');
      expect(resultado.userPrompt).toContain('Maní, Frutos secos');
      expect(resultado.userPrompt).toContain('vegano');
      expect(resultado.userPrompt).toContain('diabetes tipo 2');
    });
  });
});
