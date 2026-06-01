import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import {
  AlimentoResumen,
  EntradaMapearIngredientes,
  MapeoIngredienteConflicto,
  MapeoIngredienteExacto,
  ResultadoMapearIngredientes,
} from '../dto/mapeo-ingredientes.dto';
import { normalizarNombreAlimento } from 'src/infrastructure/alimentos/alimentos-argentina-catalogo.util';

/**
 * Umbral de similitud mínimo para considerar fuzzy match.
 * Solo se aplica cuando existe exactamente un candidato.
 */
const UMBRAL_SIMILITUD_FUZZY = 0.85;

/**
 * Caso de uso para mapear ingredientes generados por IA al catálogo de alimentos.
 *
 * Principios de diseño:
 * - Matching conservador y determinístico
 * - Preferir match exacto/normalizado primero
 * - Fuzzy fallback solo si es unambiguous y se puede justificar
 * - Conflictos explícitos surfaceados para revisión profesional
 * - Sin persistencia - solo mapeo y señalización de conflictos
 *
 * Task 3: Resolver mapeo de ingredientes IA al catálogo
 */
@Injectable()
export class MapearIngredientesIAUseCase {
  constructor(
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
  ) {}

  /**
   * Ejecuta el mapeo de ingredientes IA al catálogo.
   *
   * @param entrada - Ingredientes en texto libre generados por IA
   * @returns Resultado agregado con mapeos individuales y conflictos surfaceados
   */
  async execute(
    entrada: EntradaMapearIngredientes,
  ): Promise<ResultadoMapearIngredientes> {
    const { ingredientes } = entrada;

    // Cargar todos los alimentos del catálogo
    const catalogo = await this.alimentoRepo.find();

    // Crear mapa de búsqueda normalizado: nombreNormalizado -> alimento
    const mapaCatalogo = this.construirMapaCatalogo(catalogo);

    // Procesar cada ingrediente
    const mapeos = this.procesarIngredientes(
      ingredientes,
      mapaCatalogo,
      catalogo,
    );

    // Separar conflictos
    const conflictos = mapeos.filter(
      (m): m is MapeoIngredienteConflicto => m.tipo === 'conflicto',
    );

    return {
      mapeos,
      tieneConflictos: conflictos.length > 0,
      conflictos,
      exitosos: mapeos.filter((m) => m.tipo === 'exacto').length,
      totalConflictos: conflictos.length,
    };
  }

  /**
   * Construye un mapa de búsqueda eficiente a partir del catálogo.
   * Clave: nombre normalizado (sin acentos, minúsculas, sin caracteres especiales)
   */
  private construirMapaCatalogo(
    catalogo: AlimentoOrmEntity[],
  ): Map<string, AlimentoOrmEntity[]> {
    const mapa = new Map<string, AlimentoOrmEntity[]>();

    for (const alimento of catalogo) {
      const normalizado = normalizarNombreAlimento(alimento.nombre);
      const existente = mapa.get(normalizado) ?? [];
      existente.push(alimento);
      mapa.set(normalizado, existente);
    }

    return mapa;
  }

  /**
   * Procesa la lista de ingredientes y retorna resultados individuales.
   */
  private procesarIngredientes(
    ingredientes: string[],
    mapaCatalogo: Map<string, AlimentoOrmEntity[]>,
    catalogo: AlimentoOrmEntity[],
  ): Array<MapeoIngredienteExacto | MapeoIngredienteConflicto> {
    const resultados: Array<
      MapeoIngredienteExacto | MapeoIngredienteConflicto
    > = [];

    for (const ingrediente of ingredientes) {
      // Ignorar strings vacíos o solo espacios
      if (!this.esIngredienteValido(ingrediente)) {
        continue;
      }

      const resultado = this.mapearIngrediente(
        ingrediente.trim(),
        mapaCatalogo,
        catalogo,
      );
      resultados.push(resultado);
    }

    return resultados;
  }

  /**
   * Valida que un ingrediente string sea no vacío.
   */
  private esIngredienteValido(ingrediente: string): boolean {
    if (typeof ingrediente !== 'string') {
      return false;
    }
    const trimmed = ingrediente.trim();
    return trimmed.length > 0;
  }

  /**
   * Mapea un ingrediente individual al catálogo.
   *
   * Estrategia:
   * 1. Normalizar el nombre del ingrediente
   * 2. Buscar coincidencia exacta en el mapa
   * 3. Si hay exactamente un candidato -> EXACTO
   * 4. Si hay múltiples candidatos -> AMBIGUO (conflicto)
   * 5. Si no hay candidatos -> Intentar fuzzy solo si hay un solo candidato con alta similitud
   *    (solo para uso clínico conservador, siempre surfacear conflicto)
   */
  private mapearIngrediente(
    ingredienteOriginal: string,
    mapaCatalogo: Map<string, AlimentoOrmEntity[]>,
    catalogo: AlimentoOrmEntity[],
  ): MapeoIngredienteExacto | MapeoIngredienteConflicto {
    const normalizado = normalizarNombreAlimento(ingredienteOriginal);

    // Paso 1: Buscar coincidencia exacta
    const candidatos = mapaCatalogo.get(normalizado);

    if (candidatos && candidatos.length === 1) {
      // UNICO CANDIDATO EXACTO -> ÉXITO
      return {
        tipo: 'exacto',
        ingredienteOriginal,
        alimento: {
          idAlimento: candidatos[0].idAlimento,
          nombre: candidatos[0].nombre,
        },
      };
    }

    if (candidatos && candidatos.length > 1) {
      // MÚLTIPLES CANDIDATOS EXACTOS -> AMBIGUO
      return this.crearConflictoAmbiguo(
        ingredienteOriginal,
        candidatos,
        normalizado,
      );
    }

    // NO HAY COINCIDENCIA EXACTA
    // Fuzzy fallback: solo si hay exactamente un candidato con alta similitud
    const candidatoFuzzy = this.buscarCandidatoFuzzy(normalizado, catalogo);

    if (candidatoFuzzy) {
      // UNICO CANDIDATO FUZZY con alta similitud -> ÉXITO con justificación
      return {
        tipo: 'exacto',
        ingredienteOriginal,
        alimento: {
          idAlimento: candidatoFuzzy.idAlimento,
          nombre: candidatoFuzzy.nombre,
        },
      };
    }

    // NO SE ENCONTRÓ NADA -> NO_ENCONTRADO
    return this.crearConflictoNoEncontrado(ingredienteOriginal, normalizado);
  }

  /**
   * Busca un candidato usando fuzzy matching.
   * Solo retorna resultado si hay exactamente UN candidato con similitud >= umbral.
   *
   * JUSTIFICACIÓN CLÍNICA:
   * El fuzzy se justifica solo cuando existe un único alimento en el catálogo
   * cuya similitud con el ingrediente IA es muy alta (>= 0.85).
   * Esto protege contra matching incorrecto en contextos clínicos.
   *
   * MANEJO DE EMPATES:
   * Si múltiples candidatos tienen exactamente la misma similitud máxima,
   * se retorna null (conflicto) para evitar selección no determinística.
   */
  private buscarCandidatoFuzzy(
    normalizado: string,
    catalogo: AlimentoOrmEntity[],
  ): AlimentoOrmEntity | null {
    let mejorCandidato: AlimentoOrmEntity | null = null;
    let mejorSimilitud = 0;

    for (const alimento of catalogo) {
      const nombreAlimentoNorm = normalizarNombreAlimento(alimento.nombre);
      const similitud = this.calcularSimilitud(normalizado, nombreAlimentoNorm);

      if (similitud > mejorSimilitud) {
        mejorCandidato = alimento;
        mejorSimilitud = similitud;
      }
    }

    // Si ningún candidato supera el umbral, no hay match fuzzy
    if (mejorSimilitud < UMBRAL_SIMILITUD_FUZZY) {
      return null;
    }

    // Verificar que no haya empate: contar cuántos tienen la misma similitud máxima
    const countMejorSimilitud = catalogo.filter((alimento) => {
      const nombreAlimentoNorm = normalizarNombreAlimento(alimento.nombre);
      return (
        this.calcularSimilitud(normalizado, nombreAlimentoNorm) ===
        mejorSimilitud
      );
    }).length;

    // Si hay empate en la mejor similitud, no es determinístico -> conflicto
    if (countMejorSimilitud > 1) {
      return null;
    }

    return mejorCandidato;
  }

  /**
   * Calcula similitud entre dos strings normalizados.
   * Usa algoritmo de Levenshtein normalizado.
   */
  private calcularSimilitud(s1: string, s2: string): number {
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    const distancia = this.distanciaLevenshtein(s1, s2);
    const maxLongitud = Math.max(s1.length, s2.length);
    return 1 - distancia / maxLongitud;
  }

  /**
   * Distancia de Levenshtein entre dos strings.
   */
  private distanciaLevenshtein(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
      Array<number>(n + 1).fill(0),
    );

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Crea un conflicto de tipo NO_ENCONTRADO.
   */
  private crearConflictoNoEncontrado(
    ingredienteOriginal: string,
    normalizado: string,
  ): MapeoIngredienteConflicto {
    return {
      tipo: 'conflicto',
      ingredienteOriginal,
      razon: 'NO_ENCONTRADO',
      mensaje: `No se encontró ningún alimento en el catálogo para "${ingredienteOriginal}" (búsqueda: "${normalizado}"). El profesional debe seleccionar manualmente o agregar el alimento al catálogo.`,
    };
  }

  /**
   * Crea un conflicto de tipo AMBIGUO.
   */
  private crearConflictoAmbiguo(
    ingredienteOriginal: string,
    candidatos: AlimentoOrmEntity[],
    normalizado: string,
  ): MapeoIngredienteConflicto {
    // Bound: limitar a 5 candidatos en mensaje para evitar mensajes excesivamente largos
    const MAX_CANDIDATOS_MENSAJE = 5;
    const candidatosResumen: AlimentoResumen[] = candidatos.map((c) => ({
      idAlimento: c.idAlimento,
      nombre: c.nombre,
    }));

    const candidatosParaMensaje = candidatos.slice(0, MAX_CANDIDATOS_MENSAJE);
    const excedentes = candidatos.length - MAX_CANDIDATOS_MENSAJE;
    const mensajeCandidatos =
      excedentes > 0
        ? `${candidatosParaMensaje.map((c) => c.nombre).join(', ')} y ${excedentes} más`
        : candidatosParaMensaje.map((c) => c.nombre).join(', ');

    return {
      tipo: 'conflicto',
      ingredienteOriginal,
      razon: 'AMBIGUO',
      candidatos: candidatosResumen,
      mensaje: `Se encontraron ${candidatos.length} alimentos que coinciden exactamente con "${ingredienteOriginal}" (búsqueda: "${normalizado}"): ${mensajeCandidatos}. El profesional debe seleccionar cuál usar.`,
    };
  }
}
