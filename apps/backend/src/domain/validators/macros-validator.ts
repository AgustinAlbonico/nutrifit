/**
 * MacrosValidator
 * ===============
 *
 * Validador de macronutrientes (calorías, proteínas, carbohidratos, grasas)
 * para un plan de alimentación. Compara los macros reales del plan contra
 * un objetivo nutricional y asigna una banda por macro individual + una
 * banda global:
 *
 *   - VERDE:    desvío ±5%
 *   - AMARILLO: desvío ±10% (entre 5% y 10%)
 *   - ROJO:     desvío > ±10%
 *
 * Lógica PURA: no inyecta repositorios, no depende de NestJS. Recibe
 * el plan + objetivo y retorna un resultado determinístico. Esto permite
 * cobertura 100% sin mocks.
 *
 * Decisiones de diseño:
 *   - Para calcular macros por día se promedian los macros de las
 *     alternativas de cada comida (no se asume que el socio come todas
 *     las alternativas, sino que rota entre ellas).
 *   - `puedeAceptar` es true SOLO si TODOS los días están en VERDE.
 *     Si hay al menos un día AMARILLO o ROJO, devuelve false.
 *   - El `UMBRAL_VERDE=5` y `UMBRAL_AMARILLO=10` están como propiedades
 *     estáticas para permitir tests que ajusten los umbrales.
 */

import { DiaSemana } from '../entities/DiaPlan/DiaSemana';
import { TipoComida } from '../entities/OpcionComida/TipoComida';
import type {
  PlanAlimentacionDatosJson,
  ResumenMacrosDia,
} from '../entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';

export type BandaMacro = 'VERDE' | 'AMARILLO' | 'ROJO';

export interface ObjetivoNutricional {
  caloriasDiarias: number;
  proteinasDiarias: number;
  carbohidratosDiarios: number;
  grasasDiarias: number;
}

export interface DetalleMacro {
  real: number;
  objetivo: number;
  desvio: number;
  banda: BandaMacro;
}

export interface ResumenMacrosDiaCompleto extends ResumenMacrosDia {
  desvioPorcentaje: number;
  banda: BandaMacro;
  detallePorMacro: {
    calorias: DetalleMacro;
    proteinas: DetalleMacro;
    carbohidratos: DetalleMacro;
    grasas: DetalleMacro;
  };
}

export interface ResultadoValidacionMacros {
  cumpleEstructura: boolean;
  diasFaltantes: DiaSemana[];
  comidasFaltantes: Array<{ dia: DiaSemana; faltantes: TipoComida[] }>;
  advertencias: string[];
  macrosPorDia: Partial<Record<DiaSemana, ResumenMacrosDiaCompleto>>;
  bandaGlobal: BandaMacro;
  puedeAceptar: boolean;
}

const TODOS_LOS_DIAS: DiaSemana[] = [
  DiaSemana.LUNES,
  DiaSemana.MARTES,
  DiaSemana.MIERCOLES,
  DiaSemana.JUEVES,
  DiaSemana.VIERNES,
  DiaSemana.SABADO,
  DiaSemana.DOMINGO,
];

export class MacrosValidator {
  static UMBRAL_VERDE = 5;
  static UMBRAL_AMARILLO = 10;

  /**
   * Calcula la banda de un macro en función del desvío porcentual.
   * El desvío es siempre positivo (se compara Math.abs).
   */
  static calcularBanda(desvioPorcentaje: number): BandaMacro {
    const absDesvio = Math.abs(desvioPorcentaje);

    if (absDesvio <= MacrosValidator.UMBRAL_VERDE) {
      return 'VERDE';
    }
    if (absDesvio <= MacrosValidator.UMBRAL_AMARILLO) {
      return 'AMARILLO';
    }
    return 'ROJO';
  }

  /**
   * Valida un plan completo contra un objetivo nutricional.
   *
   * @param plan - Plan generado por la IA
   * @param objetivo - Macros diarios objetivo del socio
   * @param diasAGenerar - Cantidad de días esperados (default 7)
   * @param comidasPorDia - Cantidad de comidas por día esperadas (default 4)
   * @param fechaInicio - Fecha de inicio (no se usa en la lógica actual pero
   *                     se mantiene en la firma para futura extensión)
   */
  static validar(
    plan: PlanAlimentacionDatosJson,
    objetivo: ObjetivoNutricional,
    diasAGenerar = 7,
    comidasPorDia = 4,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fechaInicio?: Date,
  ): ResultadoValidacionMacros {
    const advertencias: string[] = [];
    const diasFaltantes: DiaSemana[] = [];
    const comidasFaltantes: Array<{ dia: DiaSemana; faltantes: TipoComida[] }> =
      [];

    // 1) Verificar estructura: días
    const diasPresentes = new Set<DiaSemana>();
    for (const diaEstructura of plan.estructura) {
      diasPresentes.add(diaEstructura.dia);
    }

    // Validación flexible: si hay al menos 1 día, asumimos que la IA generó
    // un plan; los días "esperados" se validan contra los primeros N días
    // de la semana.
    const diasEsperadosSet = new Set(TODOS_LOS_DIAS.slice(0, diasAGenerar));
    for (const dia of diasEsperadosSet) {
      if (!diasPresentes.has(dia)) {
        diasFaltantes.push(dia);
      }
    }

    // 2) Verificar estructura: comidas por día
    const tiposRequeridosSet = new Set<TipoComida>(
      Object.values(TipoComida).slice(0, comidasPorDia),
    );

    for (const diaEstructura of plan.estructura) {
      const tiposPresentes = new Set<TipoComida>();
      for (const comidaSlot of diaEstructura.comidas) {
        tiposPresentes.add(comidaSlot.tipo);
      }

      const faltantes: TipoComida[] = [];
      for (const tipoReq of tiposRequeridosSet) {
        if (!tiposPresentes.has(tipoReq)) {
          faltantes.push(tipoReq);
        }
      }

      if (faltantes.length > 0) {
        comidasFaltantes.push({ dia: diaEstructura.dia, faltantes });
      }
    }

    const cumpleEstructura =
      diasFaltantes.length === 0 && comidasFaltantes.length === 0;

    if (diasFaltantes.length > 0) {
      advertencias.push(
        `Días faltantes en el plan: ${diasFaltantes.join(', ')}`,
      );
    }

    if (comidasFaltantes.length > 0) {
      advertencias.push(
        `${comidasFaltantes.length} día(s) tienen comidas faltantes.`,
      );
    }

    // 3) Calcular macros por día (promediando alternativas)
    const macrosPorDia: Partial<Record<DiaSemana, ResumenMacrosDiaCompleto>> =
      {};

    for (const diaEstructura of plan.estructura) {
      const dia = diaEstructura.dia;
      let sumaCalorias = 0;
      let sumaProteinas = 0;
      let sumaCarbohidratos = 0;
      let sumaGrasas = 0;
      let comidasConAlternativas = 0;

      for (const comidaSlot of diaEstructura.comidas) {
        if (comidaSlot.alternativas.length === 0) {
          advertencias.push(
            `Día ${dia} comida ${comidaSlot.tipo} sin alternativas.`,
          );
          continue;
        }

        const totalAlternativasComida = comidaSlot.alternativas.length;
        const sumaComida = comidaSlot.alternativas.reduce(
          (acc, alternativa) => ({
            calorias: acc.calorias + alternativa.calorias,
            proteinas: acc.proteinas + alternativa.proteinas,
            carbohidratos: acc.carbohidratos + alternativa.carbohidratos,
            grasas: acc.grasas + alternativa.grasas,
          }),
          { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
        );

        sumaCalorias += sumaComida.calorias / totalAlternativasComida;
        sumaProteinas += sumaComida.proteinas / totalAlternativasComida;
        sumaCarbohidratos += sumaComida.carbohidratos / totalAlternativasComida;
        sumaGrasas += sumaComida.grasas / totalAlternativasComida;
        comidasConAlternativas++;
      }

      // Si no hay comidas con alternativas, saltar (día inválido)
      if (comidasConAlternativas === 0) {
        advertencias.push(`Día ${dia} sin alternativas de comida.`);
        continue;
      }

      // Calcular detalle por macro
      const detalleCalorias: DetalleMacro = {
        real: Math.round(sumaCalorias),
        objetivo: objetivo.caloriasDiarias,
        desvio: 0,
        banda: 'VERDE',
      };
      detalleCalorias.desvio =
        objetivo.caloriasDiarias > 0
          ? ((sumaCalorias - objetivo.caloriasDiarias) /
              objetivo.caloriasDiarias) *
            100
          : 0;
      detalleCalorias.banda = MacrosValidator.calcularBanda(
        detalleCalorias.desvio,
      );

      const detalleProteinas: DetalleMacro = {
        real: Math.round(sumaProteinas),
        objetivo: objetivo.proteinasDiarias,
        desvio: 0,
        banda: 'VERDE',
      };
      detalleProteinas.desvio =
        objetivo.proteinasDiarias > 0
          ? ((sumaProteinas - objetivo.proteinasDiarias) /
              objetivo.proteinasDiarias) *
            100
          : 0;
      detalleProteinas.banda = MacrosValidator.calcularBanda(
        detalleProteinas.desvio,
      );

      const detalleCarbohidratos: DetalleMacro = {
        real: Math.round(sumaCarbohidratos),
        objetivo: objetivo.carbohidratosDiarios,
        desvio: 0,
        banda: 'VERDE',
      };
      detalleCarbohidratos.desvio =
        objetivo.carbohidratosDiarios > 0
          ? ((sumaCarbohidratos - objetivo.carbohidratosDiarios) /
              objetivo.carbohidratosDiarios) *
            100
          : 0;
      detalleCarbohidratos.banda = MacrosValidator.calcularBanda(
        detalleCarbohidratos.desvio,
      );

      const detalleGrasas: DetalleMacro = {
        real: Math.round(sumaGrasas),
        objetivo: objetivo.grasasDiarias,
        desvio: 0,
        banda: 'VERDE',
      };
      detalleGrasas.desvio =
        objetivo.grasasDiarias > 0
          ? ((sumaGrasas - objetivo.grasasDiarias) / objetivo.grasasDiarias) *
            100
          : 0;
      detalleGrasas.banda = MacrosValidator.calcularBanda(detalleGrasas.desvio);

      // Banda del día = la peor banda entre los 4 macros
      const bandasDelDia: BandaMacro[] = [
        detalleCalorias.banda,
        detalleProteinas.banda,
        detalleCarbohidratos.banda,
        detalleGrasas.banda,
      ];
      const bandaDelDia = MacrosValidator.peorBanda(bandasDelDia);

      // Desvío global del día (promedio ponderado simple)
      const desvioPromedio =
        (Math.abs(detalleCalorias.desvio) +
          Math.abs(detalleProteinas.desvio) +
          Math.abs(detalleCarbohidratos.desvio) +
          Math.abs(detalleGrasas.desvio)) /
        4;

      macrosPorDia[dia] = {
        calorias: detalleCalorias.real,
        proteinas: detalleProteinas.real,
        carbohidratos: detalleCarbohidratos.real,
        grasas: detalleGrasas.real,
        desvioPorcentaje: Number(desvioPromedio.toFixed(2)),
        banda: bandaDelDia,
        detallePorMacro: {
          calorias: detalleCalorias,
          proteinas: detalleProteinas,
          carbohidratos: detalleCarbohidratos,
          grasas: detalleGrasas,
        },
      };
    }

    // 4) Banda global = la peor banda entre todos los días
    const bandasDias: BandaMacro[] = Object.values(macrosPorDia).map(
      (m) => m.banda,
    );
    const bandaGlobal = MacrosValidator.peorBanda(bandasDias);

    // 5) puedeAceptar = true SOLO si todos los días VERDE
    const puedeAceptar = bandaGlobal === 'VERDE';

    return {
      cumpleEstructura,
      diasFaltantes,
      comidasFaltantes,
      advertencias,
      macrosPorDia,
      bandaGlobal,
      puedeAceptar,
    };
  }

  /**
   * Devuelve la peor banda entre una lista. ROJO > AMARILLO > VERDE.
   */
  private static peorBanda(bandas: BandaMacro[]): BandaMacro {
    if (bandas.some((b) => b === 'ROJO')) return 'ROJO';
    if (bandas.some((b) => b === 'AMARILLO')) return 'AMARILLO';
    return 'VERDE';
  }
}
