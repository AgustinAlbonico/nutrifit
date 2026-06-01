import { Injectable } from '@nestjs/common';
import {
  ContextoPaciente,
  DiaPlanSemanal,
  PlanSemanalIA,
  RecomendacionComida,
  TipoComida,
} from '@nutrifit/shared';
import {
  CALORIAS_MINIMAS_DIARIAS,
  CALORIAS_MAXIMAS_DIARIAS,
  MARGEN_KCAL_SUMA_COMIDAS,
  COMIDAS_POR_DIA,
  TIPOS_COMIDA_REQUERIDOS,
} from './constants';

export interface ResultadoValidacionPlan {
  valido: boolean;
  errores: string[];
}

/**
 * Validador estricto para planes semanales generados por IA.
 * NO acepta placeholders, clonación ni completamiento automático.
 * Si falta algo, el plan se rechaza.
 */
@Injectable()
export class ValidadorPlanSemanalUseCase {
  /**
   * Valida un plan semanal de forma estricta.
   * NO intenta completar, clonar o reemplazar partes inválidas.
   *
   * @param plan - Plan generado por IA
   * @param contexto - Contexto del paciente para validar alérgenos
   * @param diasEsperados - Cantidad de días solicitados
   * @returns Resultado con errores detallados si es inválido
   * @throws BadRequestError si el plan no cumple los requisitos estrictos
   */
  validar(
    plan: PlanSemanalIA,
    contexto: ContextoPaciente,
    diasEsperados: number,
  ): ResultadoValidacionPlan {
    const errores: string[] = [];

    // Validar días
    if (!plan.dias || !Array.isArray(plan.dias)) {
      errores.push('El plan no contiene días válidos.');
      return { valido: false, errores };
    }

    if (plan.dias.length !== diasEsperados) {
      errores.push(
        `El plan no incluye exactamente ${diasEsperados} días. Incluye ${plan.dias.length} días.`,
      );
    }

    // Validar cada día
    for (const dia of plan.dias) {
      this.validarDia(dia, contexto, errores, plan.caloriasTotalesDiarias);
    }

    // Validar rango calórico
    if (
      plan.caloriasTotalesDiarias < CALORIAS_MINIMAS_DIARIAS ||
      plan.caloriasTotalesDiarias > CALORIAS_MAXIMAS_DIARIAS
    ) {
      errores.push(
        `Las calorías totales diarias (${plan.caloriasTotalesDiarias}) están fuera del rango válido (${CALORIAS_MINIMAS_DIARIAS}-${CALORIAS_MAXIMAS_DIARIAS}).`,
      );
    }

    const valido = errores.length === 0;
    return { valido, errores };
  }

  /**
   * Valida que un día tenga todas las comidas requeridas y no contenga alérgenos.
   */
  private validarDia(
    dia: DiaPlanSemanal,
    contexto: ContextoPaciente,
    errores: string[],
    caloriasTotalesDiarias: number,
  ): void {
    if (!dia.comidas || !Array.isArray(dia.comidas)) {
      errores.push(`Día ${dia.dia}: no tiene comidas válidas.`);
      return;
    }

    // Verificar exactamente 5 comidas por día
    if (dia.comidas.length !== COMIDAS_POR_DIA) {
      errores.push(
        `El día ${dia.dia} debe tener exactamente ${COMIDAS_POR_DIA} comidas. Tiene ${dia.comidas.length}.`,
      );
    }

    // Recolectar tipos de comida presentes y sumar calorías
    const tiposPresentes = new Set<string>();
    let sumaCaloriasDia = 0;
    for (const comida of dia.comidas) {
      const tipo = this.normalizarTipoComida(comida.tipoComida);
      if (tipo) {
        tiposPresentes.add(tipo);
      }

      if (typeof comida.caloriasEstimadas === 'number') {
        sumaCaloriasDia += comida.caloriasEstimadas;
      }

      // Validar alérgenos en ingredientes
      this.validarAlergenos(comida.ingredientes, contexto, dia.dia, errores);

      // Validar que la comida tenga datos mínimos
      this.validarComida(comida, dia.dia, errores);
    }

    // Verificar que todas las comidas requeridas estén presentes
    for (const tipoRequerido of TIPOS_COMIDA_REQUERIDOS) {
      if (!tiposPresentes.has(tipoRequerido)) {
        errores.push(
          `El día ${dia.dia} no incluye la comida obligatoria ${tipoRequerido}.`,
        );
      }
    }

    // Validar suma de calorías del día vs caloriasTotalesDiarias con margen
    if (
      Math.abs(sumaCaloriasDia - caloriasTotalesDiarias) >
      MARGEN_KCAL_SUMA_COMIDAS
    ) {
      errores.push(
        `La suma de calorías de las comidas del día ${dia.dia} (${sumaCaloriasDia}) excede el margen de ${MARGEN_KCAL_SUMA_COMIDAS} kcal respecto a caloriasTotalesDiarias (${caloriasTotalesDiarias}).`,
      );
    }
  }

  /**
   * Valida que los ingredientes no contengan alérgenos del paciente.
   */
  private validarAlergenos(
    ingredientes: string[],
    contexto: ContextoPaciente,
    numeroDia: number,
    errores: string[],
  ): void {
    if (!ingredientes || !Array.isArray(ingredientes)) return;

    for (const alergia of contexto.alergias) {
      const alergiaLower = alergia.toLowerCase().trim();
      if (!alergiaLower) continue;

      for (const ingrediente of ingredientes) {
        if (!ingrediente) continue;
        const ingredienteLower = ingrediente.toLowerCase().trim();
        if (ingredienteLower.includes(alergiaLower)) {
          errores.push(
            `El plan contiene el alérgeno "${alergia}" (en "${ingrediente}") en el día ${numeroDia}. Por seguridad, no se puede sugerir este plan.`,
          );
          return; // Un error por alergia es suficiente
        }
      }
    }
  }

  /**
   * Valida que una comida individual tenga datos mínimos significativos.
   */
  private validarComida(
    comida: RecomendacionComida,
    numeroDia: number,
    errores: string[],
  ): void {
    if (!comida.nombre || comida.nombre.trim().length === 0) {
      errores.push(`Día ${numeroDia}: una comida no tiene nombre.`);
    }

    if (!comida.descripcion || comida.descripcion.trim().length === 0) {
      errores.push(
        `Día ${numeroDia} (${comida.nombre || '?'}): no tiene descripción.`,
      );
    }

    if (
      !comida.ingredientes ||
      !Array.isArray(comida.ingredientes) ||
      comida.ingredientes.length === 0
    ) {
      errores.push(
        `Día ${numeroDia} (${comida.nombre || '?'}): no tiene ingredientes.`,
      );
    }

    if (
      typeof comida.caloriasEstimadas !== 'number' ||
      comida.caloriasEstimadas < 0
    ) {
      errores.push(
        `Día ${numeroDia} (${comida.nombre || '?'}): calorías estimadas no puede ser negativa.`,
      );
    }

    if (typeof comida.proteinas !== 'number' || comida.proteinas < 0) {
      errores.push(
        `Día ${numeroDia} (${comida.nombre || '?'}): proteinas debe ser un número no negativo.`,
      );
    }

    if (typeof comida.carbohidratos !== 'number' || comida.carbohidratos < 0) {
      errores.push(
        `Día ${numeroDia} (${comida.nombre || '?'}): carbohidratos debe ser un número no negativo.`,
      );
    }

    if (typeof comida.grasas !== 'number' || comida.grasas < 0) {
      errores.push(
        `Día ${numeroDia} (${comida.nombre || '?'}): grasas debe ser un número no negativo.`,
      );
    }
  }

  /**
   * Normaliza el tipo de comida a TipoComida o null si no es válido.
   */
  private normalizarTipoComida(tipoComida: string): TipoComida | null {
    if (!tipoComida) return null;

    const normalizado = tipoComida
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

    if (normalizado === 'DESAYUNO') return 'DESAYUNO';
    if (normalizado === 'ALMUERZO') return 'ALMUERZO';
    if (normalizado === 'MERIENDA') return 'MERIENDA';
    if (normalizado === 'CENA') return 'CENA';
    if (normalizado === 'COLACION') return 'COLACION';

    return null;
  }
}
