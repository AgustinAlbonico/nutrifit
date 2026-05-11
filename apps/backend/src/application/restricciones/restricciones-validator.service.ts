import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';

const STOPWORDS_RESTRICCIONES = new Set([
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

const CATALOGO_EQUIVALENCIAS_RESTRICCIONES: Array<{
  patrones: string[];
  terminos: string[];
}> = [
  {
    patrones: ['lactosa'],
    terminos: ['lactosa', 'leche', 'queso', 'yogur', 'crema', 'manteca'],
  },
  {
    patrones: ['gluten', 'celiac'],
    terminos: ['gluten', 'trigo', 'harina', 'pan', 'pasta', 'galleta'],
  },
  {
    patrones: ['mani'],
    terminos: ['mani', 'cacahuate'],
  },
  {
    patrones: ['marisco'],
    terminos: [
      'marisco',
      'mariscos',
      'camaron',
      'langostino',
      'mejillon',
      'calamar',
      'pulpo',
    ],
  },
  {
    patrones: ['vegetarian'],
    terminos: [
      'carne',
      'pollo',
      'pescado',
      'cerdo',
      'jamon',
      'salmon',
      'atun',
      'marisco',
    ],
  },
  {
    patrones: ['vegana', 'vegano'],
    terminos: [
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
    ],
  },
  {
    patrones: ['cerdo'],
    terminos: ['cerdo', 'jamon', 'panceta', 'bacon', 'bondiola', 'chorizo'],
  },
  {
    patrones: ['graso', 'hipercolesterol'],
    terminos: [
      'graso',
      'frito',
      'frita',
      'fritura',
      'panceta',
      'bacon',
      'salame',
      'chorizo',
      'manteca',
      'crema',
      'mayonesa',
    ],
  },
  {
    patrones: ['diabetes'],
    terminos: ['azucar', 'miel', 'mermelada', 'gaseosa', 'dulce', 'postre'],
  },
  {
    patrones: ['hipertension'],
    terminos: ['sal', 'sodio', 'salame', 'jamon', 'chorizo', 'embutido'],
  },
  {
    patrones: ['gastritis'],
    terminos: ['picante', 'cafe', 'citrico', 'frito', 'frita', 'fritura'],
  },
];

interface ReglaRestriccionDetectada {
  texto: string;
  tipo: IncidenciaRestriccion['tipoRestriccion'];
  terminosAncla: string[];
  terminos: string[];
}

interface PropuestaValidable {
  nombre: string;
  ingredientes: Array<{
    nombre: string;
  }>;
}

export interface IncidenciaRestriccion {
  dia: string;
  comida: string;
  item: string;
  tipoRestriccion: 'ALERGIA' | 'RESTRICCION' | 'PATOLOGIA';
  alimento: string;
  descripcion: string;
}

export function formatearIncidenciasRestriccion(
  incidencias: IncidenciaRestriccion[],
): string {
  const detalles = incidencias
    .slice(0, 5)
    .map(
      (incidencia) =>
        `${incidencia.dia}/${incidencia.comida}: ${incidencia.alimento} (${incidencia.tipoRestriccion.toLowerCase()})`,
    )
    .join('; ');

  const restantes = incidencias.length - 5;
  const sufijo =
    restantes > 0 ? `; y ${restantes} incidencia(s) adicional(es)` : '';

  return `El plan incluye alimentos incompatibles con las restricciones del socio: ${detalles}${sufijo}.`;
}

@Injectable()
export class RestriccionesValidator {
  constructor(
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaSaludRepo: Repository<FichaSaludOrmEntity>,
  ) {}

  /**
   * Normaliza un texto para comparación: lowercase y sin tildes.
   */
  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private tokenizar(texto: string): string[] {
    return this.normalizarTexto(texto)
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }

  private singularizar(token: string): string {
    if (token.endsWith('es') && token.length > 4) {
      return token.slice(0, -2);
    }
    if (token.endsWith('s') && token.length > 3) {
      return token.slice(0, -1);
    }
    return token;
  }

  private extraerTerminosSignificativos(texto: string): string[] {
    return this.tokenizar(texto)
      .map((token) => this.singularizar(token))
      .filter(
        (token) => token.length >= 3 && !STOPWORDS_RESTRICCIONES.has(token),
      );
  }

  private estaNegado(textoNormalizado: string, termino: string): boolean {
    const terminoEscapado = termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b(sin|libre de)\\s+${terminoEscapado}\\b`).test(
      textoNormalizado,
    );
  }

  private coincideTermino(texto: string, termino: string): boolean {
    const textoNormalizado = this.normalizarTexto(texto);
    const terminoNormalizado = this.normalizarTexto(termino);

    if (this.estaNegado(textoNormalizado, terminoNormalizado)) {
      return false;
    }

    if (terminoNormalizado.includes(' ')) {
      const terminoEscapado = terminoNormalizado.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );
      return new RegExp(`(^|\\s)${terminoEscapado}(\\s|$)`).test(
        textoNormalizado,
      );
    }

    const terminoBase = this.singularizar(terminoNormalizado);
    return this.tokenizar(textoNormalizado)
      .map((token) => this.singularizar(token))
      .some((token) => token === terminoBase);
  }

  private construirReglasRestriccion(
    restricciones: Array<{
      texto: string;
      tipo: IncidenciaRestriccion['tipoRestriccion'];
    }>,
  ): ReglaRestriccionDetectada[] {
    return restricciones
      .map(({ texto, tipo }) => {
        const textoNormalizado = this.normalizarTexto(texto);
        const terminosAncla = this.extraerTerminosSignificativos(texto);
        const terminos = new Set(terminosAncla);

        for (const regla of CATALOGO_EQUIVALENCIAS_RESTRICCIONES) {
          if (
            regla.patrones.some((patron) => textoNormalizado.includes(patron))
          ) {
            regla.terminos.forEach((termino) => terminos.add(termino));
          }
        }

        return {
          texto,
          tipo,
          terminosAncla,
          terminos: Array.from(terminos),
        };
      })
      .filter((regla) => regla.terminos.length > 0);
  }

  /**
   * Valida si un texto contiene alguna de las palabras restringidas.
   */
  private contieneRestriccion(
    texto: string,
    restricciones: string[],
  ): string | null {
    for (const restriccion of restricciones) {
      if (this.coincideTermino(texto, restriccion)) {
        return restriccion;
      }
    }
    return null;
  }

  /**
   * Valida una propuesta contra una lista de restricciones.
   * Retorna true si la propuesta es VÁLIDA (no viola ninguna restricción).
   * Retorna false si la propuesta viola alguna restricción.
   */
  validarPropuesta(
    propuesta: PropuestaValidable,
    restricciones: string[],
  ): boolean {
    if (!restricciones || restricciones.length === 0) {
      return true;
    }

    for (const ingrediente of propuesta.ingredientes) {
      const alimento = ingrediente.nombre;
      if (this.contieneRestriccion(alimento, restricciones)) {
        return false;
      }
    }

    // También verificar el nombre de la propuesta
    if (this.contieneRestriccion(propuesta.nombre, restricciones)) {
      return false;
    }

    return true;
  }

  /**
   * Obtiene las restricciones de un socio desde su ficha de salud.
   */
  async obtenerRestriccionesSocio(socioId: number): Promise<{
    alergias: string[];
    restricciones: string[];
    patologias: string[];
  }> {
    const ficha = await this.fichaSaludRepo.findOne({
      where: { socio: { idPersona: socioId } },
      relations: { alergias: true },
    });

    if (!ficha) {
      return { alergias: [], restricciones: [], patologias: [] };
    }

    const alergias = ficha.alergias?.map((a) => a.nombre) ?? [];

    // Las restricciones alimentarias vienen como texto libre
    const restriccionesTexto = ficha.restriccionesAlimentarias ?? '';
    const restricciones = restriccionesTexto
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    // Las patologías vienen como entities con nombre
    const patologias =
      ficha.patologias?.map((p) => p.nombre).filter((p) => p.length > 0) ?? [];

    return { alergias, restricciones, patologias };
  }

  /**
   * Genera incidencias detalladas para items que violan restricciones.
   * Se usa para mostrar al profesional qué items tienen problemas.
   */
  async generarIncidencias(
    items: Array<{
      dia: string;
      comida: string;
      item: string;
      alimentoId: number;
      alimentoNombre: string;
    }>,
    socioId: number,
  ): Promise<IncidenciaRestriccion[]> {
    const { alergias, restricciones, patologias } =
      await this.obtenerRestriccionesSocio(socioId);

    const todasRestricciones = this.construirReglasRestriccion([
      ...alergias.map((a) => ({ texto: a, tipo: 'ALERGIA' as const })),
      ...restricciones.map((r) => ({
        texto: r,
        tipo: 'RESTRICCION' as const,
      })),
      ...patologias.map((p) => ({ texto: p, tipo: 'PATOLOGIA' as const })),
    ]);

    if (todasRestricciones.length === 0) {
      return [];
    }

    const incidencias: IncidenciaRestriccion[] = [];

    for (const item of items) {
      const nombreAlimento = item.alimentoNombre;

      for (const {
        texto,
        tipo,
        terminosAncla,
        terminos,
      } of todasRestricciones) {
        const nombreAlimentoNormalizado = this.normalizarTexto(nombreAlimento);

        if (
          terminosAncla.some((termino) =>
            this.estaNegado(nombreAlimentoNormalizado, termino),
          )
        ) {
          continue;
        }

        if (this.contieneRestriccion(nombreAlimento, terminos)) {
          incidencias.push({
            dia: item.dia,
            comida: item.comida,
            item: item.item,
            tipoRestriccion: tipo,
            alimento: nombreAlimento,
            descripcion: `El alimento "${nombreAlimento}" puede estar relacionado con ${tipo === 'ALERGIA' ? 'la alergia' : tipo === 'RESTRICCION' ? 'la restricción' : 'la patología'}: "${texto}"`,
          });
        }
      }
    }

    return incidencias;
  }
}
