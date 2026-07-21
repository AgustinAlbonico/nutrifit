/**
 * RotadorProteinasService
 * =======================
 *
 * Asigna deterministicamente una proteína principal a cada combinación
 * {dia, tipoComida} usando un pool rotativo filtrado por las restricciones
 * del socio.
 *
 * Por qué existe: la IA, al generar cada comida en llamadas independientes
 * (28 llamadas IA separadas para un plan estándar), no tiene contexto de
 * qué se generó antes y tiende a anclarse en ejemplos literales del prompt
 * (ej: "Pollo grillado con quinoa" aparecía 13 veces como alternativa #1).
 *
 * Este servicio impone rotación desde afuera: el use-case le pregunta qué
 * proteína usar para cada comida y se la pasa al prompt como regla dura.
 *
 * Estrategia:
 *  - Pools separados por TipoComida (desayuno usa proteínas livianas,
 *    almuerzo/cena usan densas, colación usa snacks proteicos).
 *  - Filtrado case-insensitive por restricciones, alergias y alimentos
 *    evitados del request.
 *  - Round-robin independiente por tipoComida con wrap-around.
 */

import { Injectable } from '@nestjs/common';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
import type { FichaClinicaParaPrompt } from 'src/application/ai/builders/prompt-plan-semanal.builder';

/**
 * Pools base por tipo de comida. Proteínas principales que tipicamente
 * aparecen como fuente proteica del plato.
 *
 * Notas:
 *  - DESAYUNO/MERIENDA: proteínas livianas (huevo, lácteos, semillas).
 *  - ALMUERZO/CENA: proteínas densas (carnes, pescado, legumbres, tofu).
 *  - COLACION: snacks proteicos (frutos secos, frutas, yogur).
 */
const POOL_PROTEINAS_POR_TIPO: Record<TipoComida, readonly string[]> = {
  [TipoComida.DESAYUNO]: [
    'huevo',
    'yogur',
    'queso',
    'avena',
    'chía',
    'frutas secas',
  ],
  [TipoComida.MERIENDA]: ['huevo', 'yogur', 'queso', 'frutas secas', 'avena'],
  [TipoComida.ALMUERZO]: [
    'pollo',
    'pescado',
    'carne magra',
    'cerdo',
    'tofu',
    'legumbres',
    'huevo',
    'atún',
  ],
  [TipoComida.CENA]: [
    'pescado',
    'carne magra',
    'cerdo',
    'tofu',
    'legumbres',
    'huevo',
    'atún',
    'pollo',
  ],
  [TipoComida.COLACION]: ['frutos secos', 'yogur', 'frutas', 'queso'],
};

export interface TareaGeneracionComida {
  dia: DiaSemana;
  tipoComida: TipoComida;
}

@Injectable()
export class RotadorProteinasService {
  /**
   * Asigna una proteína principal a cada tarea usando round-robin
   * independiente por tipoComida sobre el pool filtrado.
   *
   * @returns Mapa con clave `${dia}:${tipoComida}` → proteína.
   *          Si una tarea no tiene proteínas disponibles en su pool
   *          (caso extremo de filtrado total), no se agrega entrada:
   *          el use-case interpreta ausencia como "sin restricción de proteína".
   */
  asignar(
    tareas: TareaGeneracionComida[],
    ficha: FichaClinicaParaPrompt,
    alimentosEvitados: string[] = [],
  ): Map<string, string> {
    const resultado = new Map<string, string>();

    // Agrupar tareas por tipoComida preservando el orden natural de los días.
    const tareasPorTipo = new Map<TipoComida, TareaGeneracionComida[]>();
    for (const tarea of tareas) {
      const lista = tareasPorTipo.get(tarea.tipoComida) ?? [];
      lista.push(tarea);
      tareasPorTipo.set(tarea.tipoComida, lista);
    }

    for (const [tipoComida, tareasDelTipo] of tareasPorTipo) {
      const pool = this.obtenerPoolFiltrado(
        tipoComida,
        ficha,
        alimentosEvitados,
      );
      if (pool.length === 0) continue;

      tareasDelTipo.forEach((tarea, idx) => {
        const proteina = pool[idx % pool.length];
        resultado.set(
          this.construirClave(tarea.dia, tarea.tipoComida),
          proteina,
        );
      });
    }

    return resultado;
  }

  construirClave(dia: DiaSemana, tipoComida: TipoComida): string {
    return `${dia}:${tipoComida}`;
  }

  /**
   * Devuelve el pool para el tipo de comida, filtrado por:
   *  - restricciones alimentarias (texto libre, ej: "vegano, sin gluten")
   *  - alergias explícitas (ej: ['huevo', 'pescado'])
   *  - alimentos evitados del request
   *
   * Si el filtrado elimina todo el pool (caso extremo), se devuelve el pool
   * base original: es preferible tener rotación imperfecta a no tener
   * restricción de proteína (lo que revierte al bug original de anclaje).
   */
  private obtenerPoolFiltrado(
    tipoComida: TipoComida,
    ficha: FichaClinicaParaPrompt,
    alimentosEvitados: string[],
  ): readonly string[] {
    const poolBase = POOL_PROTEINAS_POR_TIPO[tipoComida];
    const restriccionesLower = (
      ficha.restriccionesAlimentarias ?? ''
    ).toLowerCase();
    const alergiasLower = ficha.alergias.map((a) => a.toLowerCase());
    const evitadosLower = alimentosEvitados.map((a) => a.toLowerCase());

    const excluidos = new Set<string>();

    // 1) Restricciones vegetariano/vegano (texto libre).
    const esVegano = /vegano/i.test(restriccionesLower);
    const esVegetariano = esVegano || /vegetariano/i.test(restriccionesLower);

    if (esVegetariano) {
      for (const p of ['pollo', 'pescado', 'carne magra', 'cerdo', 'atún']) {
        excluidos.add(p);
      }
    }
    if (esVegano) {
      for (const p of ['huevo', 'yogur', 'queso']) {
        excluidos.add(p);
      }
    }

    // 2) Alergias explícitas → mapping a proteínas afectadas.
    if (alergiasLower.some((a) => a.includes('huevo'))) {
      excluidos.add('huevo');
    }
    if (
      alergiasLower.some((a) => a.includes('pescado') || a.includes('mariscos'))
    ) {
      excluidos.add('pescado');
      excluidos.add('atún');
    }
    if (
      alergiasLower.some(
        (a) =>
          a.includes('lacteos') || a.includes('lácteos') || a.includes('leche'),
      )
    ) {
      excluidos.add('yogur');
      excluidos.add('queso');
    }
    if (alergiasLower.some((a) => a.includes('frutos secos'))) {
      excluidos.add('frutos secos');
    }
    if (alergiasLower.some((a) => a.includes('soja') || a.includes('soya'))) {
      excluidos.add('tofu');
    }

    // 3) Alimentos evitados del request → match por substring.
    for (const evitado of evitadosLower) {
      for (const proteina of poolBase) {
        if (evitado.includes(proteina.toLowerCase())) {
          excluidos.add(proteina);
        }
      }
    }

    const poolFiltrado = poolBase.filter((p) => !excluidos.has(p));
    return poolFiltrado.length > 0 ? poolFiltrado : poolBase;
  }
}
