import { PromptIdeasComidaBuilder } from './prompt-ideas-comida.builder';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

describe('PromptIdeasComidaBuilder.build', () => {
  let sut: PromptIdeasComidaBuilder;

  beforeEach(() => {
    sut = new PromptIdeasComidaBuilder();
  });

  it('incluye TODAS las restricciones de la ficha en system prompt', () => {
    const args = {
      ficha: {
        alergias: ['Maní'],
        restriccionesAlimentarias: 'vegano',
        patologias: ['Diabetes tipo 2'],
        medicacionActual: 'warfarina',
        suplementosActuales: 'Vitamina D',
      },
      slot: { dia: DiaSemana.LUNES, tipoComida: TipoComida.DESAYUNO },
      cantidad: 10,
    };

    const prompt = sut.build(args);
    const texto = `${prompt.system}\n${prompt.user}`.toLowerCase();

    expect(texto).toContain('maní');
    expect(texto).toContain('vegano');
    expect(texto).toContain('diabetes');
    expect(texto).toContain('warfarina');
    expect(texto).toContain('vitamina d');
  });

  it('especifica el slot exacto (lunes, desayuno)', () => {
    const args = {
      ficha: {} as never,
      slot: { dia: DiaSemana.LUNES, tipoComida: TipoComida.DESAYUNO },
      cantidad: 5,
    };

    const prompt = sut.build(args);
    const texto = `${prompt.system}\n${prompt.user}`;

    expect(texto.toLowerCase()).toContain('lunes');
    expect(texto.toLowerCase()).toContain('desayuno');
    expect(texto.toLowerCase()).toContain('5 alternativa');
  });

  it('incluye el catalogo disponible y exige usar nombres exactos', () => {
    const prompt = sut.build({
      ficha: {} as never,
      slot: { dia: DiaSemana.MIERCOLES, tipoComida: TipoComida.DESAYUNO },
      cantidad: 3,
      alimentosDisponibles: ['Avena', 'Banana', 'Huevo'],
    });
    const texto = `${prompt.system}\n${prompt.user}`;

    expect(texto).toContain('Catálogo de alimentos disponible');
    expect(texto).toContain('Avena');
    expect(texto).toContain('Banana');
    expect(texto).toContain('Huevo');
    expect(texto.toLowerCase()).toContain('nombres exactos');
  });

  it('pide nombres descriptivos y prohibe nombres genericos numerados', () => {
    const prompt = sut.build({
      ficha: {} as never,
      slot: { dia: DiaSemana.LUNES, tipoComida: TipoComida.DESAYUNO },
      cantidad: 3,
      alimentosDisponibles: ['Avena', 'Banana', 'Huevo'],
    });
    const texto = `${prompt.system}\n${prompt.user}`.toLowerCase();

    expect(texto).toContain('nombre de cada alternativa debe describir');
    expect(texto).toContain('desayuno 1');
    expect(texto).toContain('alternativa 2');
  });
});
