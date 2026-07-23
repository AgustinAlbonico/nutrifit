import { calcularObjetivoMacros } from './objetivo-macros.helper';

describe('calcularObjetivoMacros', () => {
  it('devuelve 2000 kcal con distribucion 25/50/25% cuando recibe una ficha vacia', () => {
    const fichaVacia = {
      alergias: [],
      restriccionesAlimentarias: null,
      patologias: [],
      objetivoPersonal: null,
    };

    const objetivo = calcularObjetivoMacros(fichaVacia);

    expect(objetivo.caloriasDiarias).toBe(2000);
    expect(objetivo.proteinasDiarias).toBe(125);
    expect(objetivo.carbohidratosDiarios).toBe(250);
    expect(objetivo.grasasDiarias).toBe(56);
  });

  it('ignora la ficha clinica que recibe (issue pendiente: TMB + TDEE reales)', () => {
    const fichaCompleta = {
      alergias: [],
      restriccionesAlimentarias: 'vegetariano',
      patologias: ['diabetes tipo 2'],
      objetivoPersonal: 'bajar 5kg',
    };

    const objetivoConFichaVacia = calcularObjetivoMacros({
      alergias: [],
      restriccionesAlimentarias: null,
      patologias: [],
      objetivoPersonal: null,
    });
    const objetivoConFichaCompleta = calcularObjetivoMacros(fichaCompleta);

    expect(objetivoConFichaCompleta).toEqual(objetivoConFichaVacia);
  });

  it('los macros suman coherentemente el total calorico declarado', () => {
    const objetivo = calcularObjetivoMacros({
      alergias: [],
      restriccionesAlimentarias: null,
      patologias: [],
      objetivoPersonal: null,
    });

    const kcalReales =
      objetivo.proteinasDiarias * 4 +
      objetivo.carbohidratosDiarios * 4 +
      objetivo.grasasDiarias * 9;

    const desvio = Math.abs(kcalReales - objetivo.caloriasDiarias);
    expect(desvio).toBeLessThan(objetivo.caloriasDiarias * 0.05);
  });
});
