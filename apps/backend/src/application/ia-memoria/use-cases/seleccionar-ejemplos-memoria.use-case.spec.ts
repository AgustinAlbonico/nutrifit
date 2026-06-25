import { SeleccionarEjemplosMemoriaUseCase } from './seleccionar-ejemplos-memoria.use-case';
import { NutricionistaIAMemoriaEntity } from 'src/domain/entities/NutricionistaIAPreferencias/nutricionista-ia-memoria.entity';

describe('SeleccionarEjemplosMemoriaUseCase', () => {
  let useCase: SeleccionarEjemplosMemoriaUseCase;

  const makeEntry = (
    id: number,
    tipoEjemplo: 'POSITIVO' | 'NEGATIVO',
    comentario: string,
  ): NutricionistaIAMemoriaEntity =>
    ({
      idNutricionistaIaMemoria: id,
      idNutricionista: 1,
      tipoEjemplo,
      comentario,
      idPlanAlimentacionVersion: null,
      archivada: false,
      createdAt: new Date(),
    }) as NutricionistaIAMemoriaEntity;

  beforeEach(() => {
    useCase = new SeleccionarEjemplosMemoriaUseCase();
  });

  it('devuelve [] si no hay memoria', async () => {
    const repo = { obtenerParaSeleccion: jest.fn().mockResolvedValue([]) };

    const result = await useCase.ejecutar({
      nutricionistaId: 1,
      contexto: { objetivoTexto: 'perder peso', restricciones: [] },
      repo,
    });

    expect(result).toEqual([]);
  });

  it('devuelve todas las entradas si hay 1-2', async () => {
    const repo = {
      obtenerParaSeleccion: jest
        .fn()
        .mockResolvedValue([
          makeEntry(1, 'POSITIVO', 'Bien'),
          makeEntry(2, 'NEGATIVO', 'Mal'),
        ]),
    };

    const result = await useCase.ejecutar({
      nutricionistaId: 1,
      contexto: { objetivoTexto: '', restricciones: [] },
      repo,
    });

    expect(result).toHaveLength(2);
  });

  it('con 3+ entradas devuelve top N (default 3) ordenado por score DESC', async () => {
    const repo = {
      obtenerParaSeleccion: jest
        .fn()
        .mockResolvedValue([
          makeEntry(1, 'POSITIVO', 'Plan bajo en sodio para hipertension'),
          makeEntry(2, 'POSITIVO', 'Buen plan vegano'),
          makeEntry(3, 'NEGATIVO', 'Exceso de carbohidratos'),
          makeEntry(4, 'NEGATIVO', 'Sin suficiente proteina'),
        ]),
    };

    const result = await useCase.ejecutar({
      nutricionistaId: 1,
      contexto: {
        objetivoTexto: 'hipertension y proteina',
        restricciones: ['vegano'],
      },
      cantidadMaxima: 3,
      repo,
    });

    expect(result).toHaveLength(3);
    // Positivos deben estar primero por tipoBase=2 vs 1
    expect(result[0].tipoEjemplo).toBe('POSITIVO');
    expect(result[1].tipoEjemplo).toBe('POSITIVO');
  });

  it('POSITIVO base=2, NEGATIVO base=1 — positivos ganan con mismo keyword score', async () => {
    const repo = {
      obtenerParaSeleccion: jest
        .fn()
        .mockResolvedValue([
          makeEntry(1, 'NEGATIVO', 'comentario con keyword relevante'),
          makeEntry(2, 'POSITIVO', 'comentario con keyword relevante'),
        ]),
    };

    const result = await useCase.ejecutar({
      nutricionistaId: 1,
      contexto: { objetivoTexto: 'keyword', restricciones: [] },
      cantidadMaxima: 3,
      repo,
    });

    expect(result[0].tipoEjemplo).toBe('POSITIVO');
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('keywords del objetivo pesan 0.5, restricciones 0.3', async () => {
    const repo = {
      obtenerParaSeleccion: jest.fn().mockResolvedValue([
        // Solo restricciones (0.3 × 1 = 0.3) → score = 1 + 0.3 = 1.3
        makeEntry(1, 'NEGATIVO', 'celiaco'),
        // Solo objetivo (0.5 × 1 = 0.5) → score = 1 + 0.5 = 1.5
        makeEntry(2, 'NEGATIVO', 'perder'),
        // Ambos (0.5 + 0.3 = 0.8) → score = 2 + 0.8 = 2.8
        makeEntry(3, 'POSITIVO', 'perder celiaco'),
      ]),
    };

    const result = await useCase.ejecutar({
      nutricionistaId: 1,
      contexto: { objetivoTexto: 'perder peso', restricciones: ['celiaco'] },
      cantidadMaxima: 3,
      repo,
    });

    // El que tiene ambas keywords + POSITIVO gana
    expect(result[0].tipoEjemplo).toBe('POSITIVO');
    expect(result[0].score).toBeCloseTo(2.8, 2);
    // El de objetivo solo viene segundo
    expect(result[1].score).toBeCloseTo(1.5, 2);
    // El de restricciones solo viene tercero
    expect(result[2].score).toBeCloseTo(1.3, 2);
  });

  it('ignora palabras de menos de 3 caracteres', async () => {
    const repo = {
      obtenerParaSeleccion: jest.fn().mockResolvedValue([
        makeEntry(1, 'POSITIVO', 'de y la'), // todas < 3 chars
      ]),
    };

    const result = await useCase.ejecutar({
      nutricionistaId: 1,
      contexto: { objetivoTexto: 'de la con', restricciones: [] },
      repo,
    });

    expect(result[0].score).toBe(2); // solo base, sin keywords
  });
});
