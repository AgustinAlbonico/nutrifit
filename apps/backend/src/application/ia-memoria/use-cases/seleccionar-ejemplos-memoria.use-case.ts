import { Injectable } from '@nestjs/common';
import {
  NutricionistaIAMemoriaEntity,
  TipoEjemploIA,
} from 'src/domain/entities/NutricionistaIAPreferencias/nutricionista-ia-memoria.entity';

/**
 * Puerto abstracto simplificado que el use-case necesita para hacer scoring.
 * Coincide con la firma pública de `NutricionistaIAMemoriaRepository`,
 * pero tipado localmente para evitar acoplamiento.
 */
export interface RepoMemoriaParaSeleccion {
  obtenerParaSeleccion(
    nutricionistaId: number,
    limite?: number,
  ): Promise<NutricionistaIAMemoriaEntity[]>;
}

export interface ContextoSeleccion {
  objetivoTexto: string;
  restricciones: string[];
}

export interface SolicitudSeleccionarEjemplos {
  nutricionistaId: number;
  contexto: ContextoSeleccion;
  cantidadMaxima?: number;
  repo: RepoMemoriaParaSeleccion;
}

export interface EjemploMemoria {
  id: number;
  tipoEjemplo: TipoEjemploIA;
  comentario: string;
  score: number;
}

/**
 * SeleccionarEjemplosMemoriaUseCase
 * =================================
 *
 * Lógica PURA (sin DI del repo): recibe el repo por parámetro para
 * facilitar el testing.
 *
 * Algoritmo de scoring:
 *   score(tipo, comentario, objetivo, restricciones)
 *     = (tipo === POSITIVO ? 2 : 1)
 *     + 0.5 * count_keywords(comentario.toLowerCase(), objetivo.toLowerCase())
 *     + 0.3 * count_keywords(comentario.toLowerCase(),
 *                              restricciones.join(' ').toLowerCase())
 *
 * Selección:
 *   1) Ordenar por score DESC. Empate → POSITIVOS primero.
 *   2) Si 0 entradas → [].
 *   3) Si 1-2 entradas → devolver todas.
 *   4) Si 3+ → devolver top N (default 3).
 */
@Injectable()
export class SeleccionarEjemplosMemoriaUseCase {
  // Reutilizable como helper estático para tests puros
  static readonly POSITIVO_BASE = 2;
  static readonly NEGATIVO_BASE = 1;
  static readonly KEYWORD_OBJETIVO_PESO = 0.5;
  static readonly KEYWORD_RESTRICCION_PESO = 0.3;

  async ejecutar(
    solicitud: SolicitudSeleccionarEjemplos,
  ): Promise<EjemploMemoria[]> {
    const cantidadMaxima = solicitud.cantidadMaxima ?? 3;
    const { nutricionistaId, contexto, repo } = solicitud;

    const memoria = await repo.obtenerParaSeleccion(nutricionistaId, 100);

    if (memoria.length === 0) {
      return [];
    }

    const objetivoTexto = contexto.objetivoTexto?.toLowerCase() ?? '';
    const restriccionesTexto =
      contexto.restricciones?.join(' ').toLowerCase() ?? '';

    const scored: EjemploMemoria[] = memoria.map((entry) => {
      const comentarioLower = entry.comentario.toLowerCase();

      const tipoScore =
        entry.tipoEjemplo === 'POSITIVO'
          ? SeleccionarEjemplosMemoriaUseCase.POSITIVO_BASE
          : SeleccionarEjemplosMemoriaUseCase.NEGATIVO_BASE;

      const keywordsObjetivo = this.contarKeywords(
        comentarioLower,
        objetivoTexto,
      );
      const keywordsRestriccion = this.contarKeywords(
        comentarioLower,
        restriccionesTexto,
      );

      const score =
        tipoScore +
        keywordsObjetivo *
          SeleccionarEjemplosMemoriaUseCase.KEYWORD_OBJETIVO_PESO +
        keywordsRestriccion *
          SeleccionarEjemplosMemoriaUseCase.KEYWORD_RESTRICCION_PESO;

      return {
        id: entry.idNutricionistaIaMemoria,
        tipoEjemplo: entry.tipoEjemplo,
        comentario: entry.comentario,
        score,
      };
    });

    // Ordenar por score DESC; empates → POSITIVOS primero
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.tipoEjemplo === b.tipoEjemplo) return 0;
      return a.tipoEjemplo === 'POSITIVO' ? -1 : 1;
    });

    // Selección: si memoria.length <= 2 → devolver todas
    if (memoria.length <= 2) {
      return scored;
    }

    return scored.slice(0, cantidadMaxima);
  }

  /**
   * Cuenta cuántas palabras de `referencia` aparecen en `comentario`.
   * Palabras con menos de 3 caracteres se ignoran (ruido).
   */
  private contarKeywords(comentario: string, referencia: string): number {
    if (!referencia || !comentario) return 0;
    const palabrasReferencia = new Set(
      referencia
        .split(/\s+/)
        .map((w) => w.replace(/[^\p{L}\p{N}]+/gu, ''))
        .filter((w) => w.length >= 3),
    );
    if (palabrasReferencia.size === 0) return 0;

    let count = 0;
    for (const palabra of palabrasReferencia) {
      if (comentario.includes(palabra)) {
        count++;
      }
    }
    return count;
  }
}
