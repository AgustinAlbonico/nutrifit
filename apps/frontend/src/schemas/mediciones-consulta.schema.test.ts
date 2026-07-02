import { describe, expect, it } from 'vitest';

import {
  medicionesConsultaSchema,
  convertirMedicionesConsultaPayload,
} from './mediciones-consulta.schema';

describe('medicionesConsultaSchema', () => {
  it('rechaza tension incompleta', () => {
    const resultado = medicionesConsultaSchema.safeParse({
      peso: '80',
      altura: '180',
      tensionSistolica: '140',
      tensionDiastolica: '',
    });

    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.message).toBe(
      'Para registrar la tensión arterial debes informar el valor sistólico y el diastólico.',
    );
  });

  it('rechaza diastolica mayor o igual que sistolica', () => {
    const resultado = medicionesConsultaSchema.safeParse({
      peso: '80',
      altura: '180',
      tensionSistolica: '120',
      tensionDiastolica: '120',
    });

    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.message).toBe(
      'La tensión diastólica debe ser menor que la sistólica.',
    );
  });

  it('convierte strings vacios a undefined y numeros validos a number', () => {
    const valores = medicionesConsultaSchema.parse({
      peso: '80.5',
      altura: '180',
      perimetroCintura: '',
      porcentajeGrasa: '25',
      notasMedicion: 'Control mensual',
    });

    expect(convertirMedicionesConsultaPayload(valores)).toEqual({
      peso: 80.5,
      altura: 180,
      perimetroCintura: undefined,
      perimetroCadera: undefined,
      perimetroBrazo: undefined,
      perimetroMuslo: undefined,
      perimetroPecho: undefined,
      pliegueTriceps: undefined,
      pliegueAbdominal: undefined,
      pliegueMuslo: undefined,
      porcentajeGrasa: 25,
      frecuenciaCardiaca: undefined,
      tensionSistolica: undefined,
      tensionDiastolica: undefined,
      notasMedicion: 'Control mensual',
    });
  });
});
