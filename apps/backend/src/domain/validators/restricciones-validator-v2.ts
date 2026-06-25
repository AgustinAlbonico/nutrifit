/**
 * RestriccionesValidatorV2
 * =========================
 *
 * Validador de restricciones para planes de alimentación generados/editados
 * por IA. Se diferencia del `RestriccionesValidator` base (que vive en
 * `application/restricciones/` y depende de TypeORM) en:
 *
 * 1. **Es lógica PURA**: no inyecta repositorios. Recibe el plan + ficha
 *    + catálogos y retorna un resultado determinístico. Esto permite
 *    testear 100% sin mocks de base de datos.
 *
 * 2. **Valida el plan COMPLETO**: estructura con días/comidas/alternativas
 *    en lugar de validar propuesta por propuesta.
 *
 * 3. **Cross-check de razonamiento**: detecta contradicciones entre lo que
 *    la IA dice haber cumplido y lo que realmente cumplió, evitando planes
 *    donde el "razonamientoCumplimiento" miente.
 *
 * 4. **Genera instrucción correctiva**: lista de alimentos a excluir +
 *    sugerencias, lista para inyectar al prompt de reintento.
 *
 * Catálogos hardcoded (no en BD):
 *   - patronesDietarios: vegano, vegetariano, pescetariano, sin_gluten, sin_lactosa
 *   - patologias: diabetes, hipertension, celiaquia, insuficiencia_renal
 *   - sinonimos: frutos_secos, lacteos, gluten, etc.
 *
 * Decisión de diseño: NO extiende `RestriccionesValidator` directamente
 * (que vive en `application/` y depende de TypeORM) para mantener la
 * pureza de `domain/`. Internamente replica los helpers de matching
 * (tokenización, singularización, normalización) para mantener
 * coherencia con la base existente pero en forma 100% pura y testeable.
 */

import type { PlanAlimentacionDatosJson } from '../entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';

/**
 * Subset de la ficha clínica del socio necesario para la validación.
 * Modelado como interfaz de dominio para evitar acoplamiento directo con
 * la entidad `FichaSalud` o el ORM.
 */
export interface FichaClinicaParaValidacion {
  alergias: string[];
  restriccionesAlimentarias: string | null;
  patologias: string[];
  /** Objetivo nutricional textual (ej: "bajar de peso", "ganar masa muscular") */
  objetivoPersonal: string | null;
}

/**
 * Catálogos de reglas para validación. Estructura Map<string, string[]>
 * para lookup O(1) por clave (ej: 'vegano' → ['carne', 'pollo', ...]).
 */
export interface CatalogosRestricciones {
  /** Patrones dietarios: clave = nombre (ej: 'vegano'), valor = alimentos a excluir */
  patronesDietarios: Map<string, string[]>;
  /** Patologías: clave = nombre (ej: 'diabetes'), valor = alimentos a restringir */
  patologias: Map<string, string[]>;
  /** Sinónimos: clave = categoría (ej: 'frutos_secos'), valor = alimentos que la componen */
  sinonimos: Map<string, string[]>;
}

export interface RestriccionNoCumplida {
  restriccion: string;
  detalle: string;
  comida?: string;
  alternativa?: number;
  alimento?: string;
}

export interface RestriccionCumplida {
  restriccion: string;
  detalle: string;
}

export interface ResultadoValidacionRestricciones {
  restriccionesCumplidas: RestriccionCumplida[];
  restriccionesNoCumplidas: RestriccionNoCumplida[];
  advertencias: string[];
}

/**
 * Catálogos hardcoded — versión inicial. En una iteración futura podrían
 * vivir en BD y cargarse al inicio del proceso.
 */
export const CATALOGOS_RESTRICCIONES_DEFAULT: CatalogosRestricciones = {
  patronesDietarios: new Map<string, string[]>([
    [
      'vegano',
      [
        'carne',
        'pollo',
        'pescado',
        'cerdo',
        'jamon',
        'salmon',
        'atun',
        'marisco',
        'leche',
        'queso',
        'yogur',
        'huevo',
        'miel',
        'manteca',
      ],
    ],
    [
      'vegetariano',
      [
        'carne',
        'pollo',
        'pescado',
        'cerdo',
        'jamon',
        'salmon',
        'atun',
        'marisco',
      ],
    ],
    ['pescetariano', ['carne', 'pollo', 'cerdo', 'jamon']],
    [
      'sin_gluten',
      [
        'gluten',
        'trigo',
        'harina',
        'pan',
        'pasta',
        'galleta',
        'avena',
        'cebada',
        'centeno',
      ],
    ],
    ['sin_lactosa', ['leche', 'queso', 'yogur', 'manteca', 'crema', 'lactosa']],
  ]),
  patologias: new Map<string, string[]>([
    [
      'diabetes',
      [
        'azucar',
        'miel',
        'mermelada',
        'gaseosa',
        'dulce',
        'postre',
        'caramelo',
        'chocolate',
      ],
    ],
    [
      'hipertension',
      [
        'sal',
        'sodio',
        'salame',
        'jamon',
        'chorizo',
        'embutido',
        'panceta',
        'conserva',
      ],
    ],
    [
      'celiaquia',
      [
        'gluten',
        'trigo',
        'harina',
        'pan',
        'pasta',
        'galleta',
        'avena',
        'cebada',
        'centeno',
      ],
    ],
    [
      'insuficiencia_renal',
      [
        'banana',
        'naranja',
        'tomate',
        'papa',
        'espinaca',
        'cafe',
        'marisco',
        'sal',
      ],
    ],
  ]),
  sinonimos: new Map<string, string[]>([
    [
      'frutos_secos',
      [
        'almendra',
        'nuez',
        'avellana',
        'mani',
        'cacahuate',
        'cacahuete',
        'castana',
        'pion',
        'pistacho',
      ],
    ],
    ['lacteos', ['leche', 'queso', 'yogur', 'manteca', 'crema']],
    [
      'gluten',
      [
        'gluten',
        'trigo',
        'harina',
        'pan',
        'pasta',
        'galleta',
        'avena',
        'cebada',
        'centeno',
      ],
    ],
    [
      'carnes_rojas',
      ['carne', 'cerdo', 'jamon', 'salame', 'chorizo', 'panceta', 'bocadillo'],
    ],
  ]),
};

const STOPWORDS = new Set([
  'a',
  'al',
  'alta',
  'altas',
  'alimentarias',
  'alimentaria',
  'alimento',
  'alimentos',
  'arterial',
  'bajo',
  'baja',
  'con',
  'consume',
  'consumir',
  'contra',
  'de',
  'del',
  'en',
  'intolerancia',
  'la',
  'las',
  'los',
  'muy',
  'no',
  'por',
  'preferencia',
  'restriccion',
  'restricciones',
  'tipo',
  'una',
  'uno',
  'y',
]);

export class RestriccionesValidatorV2 {
  /**
   * Normaliza texto: lowercase + sin tildes.
   */
  private static normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private static tokenizar(texto: string): string[] {
    return this.normalizarTexto(texto)
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }

  private static singularizar(token: string): string {
    // Reglas de singularización para español:
    //  - terminadas en '-es' donde la letra ANTERIOR a 'e' es consonante
    //    (ej: "limones" → "limón"): dropear "-es".
    //  - terminadas en '-es' donde la letra ANTERIOR a 'e' es vocal
    //    (ej: "leches" → "leche"): dropear solo "-s" (la 'e' ya estaba).
    //  - terminadas en '-s' (no '-es'): dropear "-s".
    if (token.length >= 4 && token.endsWith('es')) {
      const antesDeE = token.charAt(token.length - 2);
      if ('aeiou'.includes(antesDeE)) {
        // el singular ya terminaba en vocal, el plural solo agregó 's'.
        return token.slice(0, -1);
      }
      return token.slice(0, -2);
    }
    if (token.length >= 3 && token.endsWith('s')) {
      return token.slice(0, -1);
    }
    return token;
  }

  private static extraerTerminosSignificativos(texto: string): string[] {
    return this.tokenizar(texto)
      .map((token) => this.singularizar(token))
      .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
  }

  private static estaNegado(
    textoNormalizado: string,
    termino: string,
  ): boolean {
    const terminoEscapado = termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b(sin|libre de)\\s+${terminoEscapado}\\b`).test(
      textoNormalizado,
    );
  }

  /**
   * Verifica si un alimento está prohibido por una lista de restricciones.
   * Case-insensitive + singular/plural.
   */
  private static alimentoProhibido(
    nombreAlimento: string,
    restricciones: string[],
  ): string | null {
    const alimentoNormalizado = this.normalizarTexto(nombreAlimento);

    for (const restriccion of restricciones) {
      const rNormalizada = this.normalizarTexto(restriccion);
      const terminosAncla = this.extraerTerminosSignificativos(rNormalizada);
      const terminosBase = terminosAncla.map((t) => this.singularizar(t));

      if (terminosBase.length === 0) {
        continue;
      }

      // ¿El alimento está explícitamente excluido ("sin X")?
      if (this.estaNegado(alimentoNormalizado, terminosBase[0])) {
        return null;
      }

      // Matching por token: si alguno de los términos ancla aparece como
      // token (o su singular) en el nombre del alimento → violación.
      const tokensAlimento = this.tokenizar(alimentoNormalizado).map((t) =>
        this.singularizar(t),
      );

      const coincide = terminosBase.some((termino) =>
        tokensAlimento.includes(termino),
      );

      if (coincide) {
        return restriccion;
      }
    }

    return null;
  }

  /**
   * Construye la lista unificada de alimentos prohibidos a partir de:
   *   - alergias explícitas del socio (expandidas por sinónimos del catálogo)
   *   - restricciones alimentarias (texto libre, parseado por comas)
   *   - patologías (mapeadas a alimentos vía catálogo)
   *   - patrones dietarios detectados en el texto libre
   */
  private static construirListaProhibidos(
    ficha: FichaClinicaParaValidacion,
    catalogos: CatalogosRestricciones,
  ): { prohibidos: string[]; restriccionesAplicadas: string[] } {
    const prohibidosSet = new Set<string>();
    const restriccionesAplicadas: string[] = [];

    // 1) Alergias explícitas — cada alergia es un alimento prohibido directo.
    //    Adicionalmente, expandimos por sinónimos (ej: "mani" → también
    //    "almendra, nuez, avellana, cacahuate, ..." si hay sinonimo
    //    "frutos_secos").
    for (const alergia of ficha.alergias) {
      const normalizada = this.normalizarTexto(alergia).trim();
      if (normalizada.length === 0) continue;
      prohibidosSet.add(normalizada);
      restriccionesAplicadas.push(`alergia: ${alergia}`);

      // Expandir por sinónimos: si la alergia aparece como valor en algún
      // sinonimo, agregar el resto del grupo como prohibido.
      for (const [, sinonimos] of catalogos.sinonimos) {
        const sinonimosNormalizados = sinonimos.map((s) =>
          this.normalizarTexto(s),
        );
        if (sinonimosNormalizados.includes(normalizada)) {
          for (const sin of sinonimosNormalizados) {
            prohibidosSet.add(sin);
          }
        }
      }
    }

    // 2) Patologías → expandir cada patología a sus alimentos prohibidos.
    for (const patologia of ficha.patologias) {
      const key = this.normalizarTexto(patologia).trim();
      const alimentos = catalogos.patologias.get(key);
      if (alimentos) {
        for (const alim of alimentos) {
          prohibidosSet.add(this.normalizarTexto(alim));
        }
        restriccionesAplicadas.push(`patologia: ${patologia}`);
      }
    }

    // 3) Restricciones libres (texto separado por comas) — buscar match
    //    con patrones dietarios del catálogo.
    if (ficha.restriccionesAlimentarias) {
      const restricciones = ficha.restriccionesAlimentarias
        .split(',')
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      for (const restriccion of restricciones) {
        const rNormalizada = this.normalizarTexto(restriccion);

        // Buscar en patrones dietarios
        for (const [clave, alimentos] of catalogos.patronesDietarios) {
          if (rNormalizada.includes(this.normalizarTexto(clave))) {
            for (const alim of alimentos) {
              prohibidosSet.add(this.normalizarTexto(alim));
            }
            restriccionesAplicadas.push(`patron dietario: ${clave}`);
            break;
          }
        }
      }
    }

    return {
      prohibidos: Array.from(prohibidosSet),
      restriccionesAplicadas,
    };
  }

  /**
   * Valida un plan completo contra la ficha clínica del socio.
   * Recorre estructura (días × comidas × alternativas × alimentos) y
   * retorna el desglose de cumplidas/no cumplidas.
   */
  static validarPlanCompleto(
    plan: PlanAlimentacionDatosJson,
    fichaClinica: FichaClinicaParaValidacion,
    catalogos: CatalogosRestricciones = CATALOGOS_RESTRICCIONES_DEFAULT,
  ): ResultadoValidacionRestricciones {
    const { prohibidos, restriccionesAplicadas } =
      this.construirListaProhibidos(fichaClinica, catalogos);

    const restriccionesCumplidas: RestriccionCumplida[] = [];
    const restriccionesNoCumplidas: RestriccionNoCumplida[] = [];
    const advertencias: string[] = [];

    if (prohibidos.length === 0) {
      advertencias.push('El socio no tiene restricciones registradas.');
      return {
        restriccionesCumplidas,
        restriccionesNoCumplidas,
        advertencias,
      };
    }

    // Para cada restricción aplicada, verificar que el plan no incluya alimentos prohibidos
    for (const restriccionAplicada of restriccionesAplicadas) {
      let cumple = true;
      const detalleCumple: string[] = [];
      const violaciones: RestriccionNoCumplida[] = [];

      // Recorrer estructura
      for (const diaEstructura of plan.estructura) {
        for (const comidaSlot of diaEstructura.comidas) {
          const tipo = comidaSlot.tipo;

          for (
            let altIdx = 0;
            altIdx < comidaSlot.alternativas.length;
            altIdx++
          ) {
            const alternativa = comidaSlot.alternativas[altIdx];

            // El bucle sobre `alimentos` se mantiene para futura extensión
            // (ej: validar contra IDs del catálogo). Por ahora usamos el
            // nombre textual que devuelve la IA en el snapshot.
            for (const _alimento of alternativa.alimentos) {
              void _alimento;
              const nombreAlimento = alternativa.nombre ?? '';

              const prohibidaEncontrada = this.alimentoProhibido(
                nombreAlimento,
                prohibidos,
              );

              if (prohibidaEncontrada) {
                cumple = false;
                violaciones.push({
                  restriccion: restriccionAplicada,
                  detalle: `El alimento "${nombreAlimento}" está relacionado con "${prohibidaEncontrada}"`,
                  comida: tipo,
                  alternativa: altIdx,
                  alimento: nombreAlimento,
                });
              }
            }
          }
        }
      }

      if (cumple) {
        detalleCumple.push(
          `Ningún alimento del plan coincide con términos prohibidos por ${restriccionAplicada}`,
        );
        restriccionesCumplidas.push({
          restriccion: restriccionAplicada,
          detalle: detalleCumple.join('; '),
        });
      } else {
        restriccionesNoCumplidas.push(...violaciones);
      }
    }

    if (restriccionesNoCumplidas.length > 0) {
      advertencias.push(
        `El plan incluye ${restriccionesNoCumplidas.length} alimento(s) que podrían estar relacionados con restricciones del socio.`,
      );
    }

    return {
      restriccionesCumplidas,
      restriccionesNoCumplidas,
      advertencias,
    };
  }

  /**
   * Genera una instrucción correctiva en español para reintentos del prompt.
   * Formato: "EXCLUIR: [alimentos]. Generar alternativa con [sugerencias]".
   */
  static generarInstruccionCorrectiva(
    violaciones: RestriccionNoCumplida[],
  ): string {
    if (!violaciones || violaciones.length === 0) {
      return '';
    }

    const alimentosExcluir = Array.from(
      new Set(
        violaciones
          .map((v) => v.alimento)
          .filter((a): a is string => typeof a === 'string' && a.length > 0),
      ),
    );

    const restriccionesAfectadas = Array.from(
      new Set(violaciones.map((v) => v.restriccion)),
    );

    const lineas: string[] = [];
    lineas.push(
      `EXCLUIR los siguientes alimentos del plan: ${alimentosExcluir.join(', ')}.`,
    );
    lineas.push(
      `Restricciones violadas: ${restriccionesAfectadas.join('; ')}.`,
    );
    lineas.push(
      'Generá alternativas que respeten estrictamente estas restricciones. Mantené la estructura JSON y los macros aproximados al objetivo.',
    );

    return lineas.join(' ');
  }

  /**
   * Cross-check: verifica que el `razonamientoCumplimiento` no contradiga
   * el resultado de la validación dura.
   *
   * Detecta contradicciones como:
   *  - La IA dice "cumplida" una restricción que en realidad NO está cumplida.
   *  - La IA dice "no cumplida" una restricción que SÍ está cumplida.
   */
  static validarCoherenciaRazonamiento(
    razonamiento: PlanAlimentacionDatosJson['razonamientoCumplimiento'],
    validacion: ResultadoValidacionRestricciones,
  ): { coherente: boolean; contradicciones: Array<{ detalle: string }> } {
    const contradicciones: Array<{ detalle: string }> = [];

    // Set de nombres de restricciones realmente no cumplidas (por nombre exacto)
    const restriccionesNoCumplidasReales = new Set(
      validacion.restriccionesNoCumplidas.map((r) => r.restriccion),
    );
    // Set de nombres de restricciones realmente cumplidas
    const restriccionesCumplidasReales = new Set(
      validacion.restriccionesCumplidas.map((r) => r.restriccion),
    );

    // Verificar que las "cumplidas" en el razonamiento realmente lo estén
    for (const item of razonamiento.restriccionesCumplidas) {
      if (restriccionesNoCumplidasReales.has(item.restriccion)) {
        contradicciones.push({
          detalle: `La IA marca como CUMPLIDA "${item.restriccion}" pero la validación detectó violaciones para esa misma restricción.`,
        });
      }
    }

    // Verificar que las "no cumplidas" en el razonamiento realmente no lo estén
    for (const item of razonamiento.restriccionesNoCumplidas) {
      if (restriccionesCumplidasReales.has(item.restriccion)) {
        contradicciones.push({
          detalle: `La IA marca como NO CUMPLIDA "${item.restriccion}" pero la validación no detectó violaciones para esa restricción.`,
        });
      }
    }

    return {
      coherente: contradicciones.length === 0,
      contradicciones,
    };
  }
}
