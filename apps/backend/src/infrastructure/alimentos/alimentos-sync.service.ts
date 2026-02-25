import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AlimentoOrmEntity } from '../persistence/typeorm/entities/alimento.entity';
import {
  ALIMENTOS_BASE_ARGENTINA,
  OpenFoodFactsBusqueda,
  esNombreRuidoso,
  limpiarNombreAlimento,
  mapearProductoOpenFoodFacts,
  normalizarNombreAlimento,
} from './alimentos-argentina-catalogo.util';

type OrigenSync = 'manual' | 'cron' | 'curacion-manual';
type EstadoSync = 'OK' | 'ERROR';

interface ParametrosSync {
  maxPaginas: number;
  pageSize: number;
  limiteImportacion: number;
}

interface ResultadoCuracion {
  eliminados: number;
  renombrados: number;
  duplicadosDetectados: number;
  ruidososDetectados: number;
}

export interface ResultadoSyncAlimentos {
  candidatos: number;
  insertados: number;
  eliminadosPorCuracion: number;
  duplicadosOmitidos: number;
  paginasConsultadas: number;
  mensaje: string;
}

export interface EstadoSyncAlimentos {
  id: number;
  origen: OrigenSync;
  estado: EstadoSync;
  inicio: string;
  fin: string;
  candidatos: number;
  insertados: number;
  eliminados: number;
  duplicadosOmitidos: number;
  paginasConsultadas: number;
  mensaje: string | null;
}

interface FilaNombre {
  nombre: string;
}

interface FilaAlimentoCuracion {
  id_alimento: number;
  nombre: string;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
}

interface FilaIdAlimento {
  id_alimento: number;
}

interface FilaLogSync {
  id_sync_log: number;
  origen: OrigenSync;
  estado: EstadoSync;
  inicio: Date;
  fin: Date;
  candidatos: number;
  insertados: number;
  eliminados: number;
  duplicados_omitidos: number;
  paginas_consultadas: number;
  mensaje: string | null;
}

function esRecord(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function esFilaNombre(valor: unknown): valor is FilaNombre {
  return esRecord(valor) && typeof valor.nombre === 'string';
}

function esFilaIdAlimento(valor: unknown): valor is FilaIdAlimento {
  return esRecord(valor) && typeof valor.id_alimento === 'number';
}

function esFilaAlimentoCuracion(valor: unknown): valor is FilaAlimentoCuracion {
  if (!esRecord(valor)) {
    return false;
  }

  return (
    typeof valor.id_alimento === 'number' &&
    typeof valor.nombre === 'string' &&
    (typeof valor.calorias === 'number' || valor.calorias === null) &&
    (typeof valor.proteinas === 'number' || valor.proteinas === null) &&
    (typeof valor.carbohidratos === 'number' || valor.carbohidratos === null) &&
    (typeof valor.grasas === 'number' || valor.grasas === null)
  );
}

function esFilaLogSync(valor: unknown): valor is FilaLogSync {
  if (!esRecord(valor)) {
    return false;
  }

  return (
    typeof valor.id_sync_log === 'number' &&
    typeof valor.origen === 'string' &&
    typeof valor.estado === 'string' &&
    (valor.inicio instanceof Date || typeof valor.inicio === 'string') &&
    (valor.fin instanceof Date || typeof valor.fin === 'string')
  );
}

@Injectable()
export class AlimentosSyncService implements OnModuleInit {
  private readonly logger = new Logger(AlimentosSyncService.name);
  private readonly urlOpenFoodFacts =
    'https://world.openfoodfacts.org/api/v2/search';

  constructor(
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.asegurarTablaLogSync();
  }

  sincronizacionAutomaticaHabilitada(): boolean {
    const valor = (
      process.env.ALIMENTOS_SYNC_HABILITADO ?? 'false'
    ).toLowerCase();
    return valor === 'true' || valor === '1' || valor === 'si';
  }

  async obtenerUltimoEstadoSync(): Promise<EstadoSyncAlimentos | null> {
    await this.asegurarTablaLogSync();

    const resultado = (await this.dataSource.query(
      `SELECT id_sync_log, origen, estado, inicio, fin, candidatos, insertados,
              eliminados, duplicados_omitidos, paginas_consultadas, mensaje
         FROM alimento_sync_log
        ORDER BY id_sync_log DESC
        LIMIT 1`,
    )) as unknown;

    if (!Array.isArray(resultado) || resultado.length === 0) {
      return null;
    }

    const filas = resultado as unknown[];
    const fila = filas[0];
    if (!esFilaLogSync(fila)) {
      return null;
    }

    const inicio =
      fila.inicio instanceof Date
        ? fila.inicio.toISOString()
        : new Date(fila.inicio).toISOString();
    const fin =
      fila.fin instanceof Date
        ? fila.fin.toISOString()
        : new Date(fila.fin).toISOString();

    return {
      id: fila.id_sync_log,
      origen: fila.origen,
      estado: fila.estado,
      inicio,
      fin,
      candidatos: fila.candidatos,
      insertados: fila.insertados,
      eliminados: fila.eliminados,
      duplicadosOmitidos: fila.duplicados_omitidos,
      paginasConsultadas: fila.paginas_consultadas,
      mensaje: fila.mensaje,
    };
  }

  async sincronizarCatalogo(
    origen: OrigenSync = 'manual',
  ): Promise<ResultadoSyncAlimentos> {
    const inicio = new Date();
    let candidatos = 0;
    let insertados = 0;
    let paginasConsultadas = 0;
    let duplicadosOmitidos = 0;
    let eliminadosPorCuracion = 0;
    let mensaje = 'Sincronizacion completada correctamente';

    try {
      const parametros = this.obtenerParametrosSync();

      const remotos = await this.obtenerAlimentosOpenFoodFacts(parametros);
      paginasConsultadas = remotos.paginasConsultadas;

      const candidatosMap = new Map<string, AlimentoOrmEntity>();
      for (const alimento of ALIMENTOS_BASE_ARGENTINA) {
        const clave = normalizarNombreAlimento(alimento.nombre);
        if (!clave) {
          continue;
        }

        const entidad = this.alimentoRepo.create({
          nombre: alimento.nombre,
          cantidad: alimento.cantidad,
          calorias: alimento.calorias,
          proteinas: alimento.proteinas,
          carbohidratos: alimento.carbohidratos,
          grasas: alimento.grasas,
          hidratosDeCarbono: alimento.carbohidratos,
          unidadMedida: alimento.unidadMedida,
        });
        candidatosMap.set(clave, entidad);
      }

      for (const alimento of remotos.alimentos) {
        const clave = normalizarNombreAlimento(alimento.nombre);
        if (!clave) {
          continue;
        }

        if (!candidatosMap.has(clave)) {
          const entidad = this.alimentoRepo.create({
            nombre: alimento.nombre,
            cantidad: alimento.cantidad,
            calorias: alimento.calorias,
            proteinas: alimento.proteinas,
            carbohidratos: alimento.carbohidratos,
            grasas: alimento.grasas,
            hidratosDeCarbono: alimento.carbohidratos,
            unidadMedida: alimento.unidadMedida,
          });
          candidatosMap.set(clave, entidad);
        }
      }

      const candidatosArray = Array.from(candidatosMap.values());
      candidatos = candidatosArray.length;

      const nombresExistentesRaw = (await this.dataSource.query(
        'SELECT nombre FROM alimento',
      )) as unknown;
      const nombresExistentes = new Set(
        (Array.isArray(nombresExistentesRaw)
          ? nombresExistentesRaw.filter(esFilaNombre)
          : []
        )
          .map((fila) => normalizarNombreAlimento(fila.nombre))
          .filter((nombre) => nombre.length > 0),
      );

      const nuevos = candidatosArray.filter((alimento) => {
        const clave = normalizarNombreAlimento(alimento.nombre);
        return clave.length > 0 && !nombresExistentes.has(clave);
      });

      duplicadosOmitidos = candidatosArray.length - nuevos.length;

      const tamLote = 100;
      for (let i = 0; i < nuevos.length; i += tamLote) {
        const lote = nuevos.slice(i, i + tamLote);
        await this.alimentoRepo.insert(lote);
        insertados += lote.length;
      }

      const resultadoCuracion = await this.curarCatalogoInterno();
      eliminadosPorCuracion = resultadoCuracion.eliminados;

      mensaje =
        `Sincronizacion OK. Insertados: ${insertados}. ` +
        `Eliminados por curacion: ${eliminadosPorCuracion}. ` +
        `Duplicados omitidos: ${duplicadosOmitidos}.`;

      this.logger.log(mensaje);

      await this.registrarLogSync({
        origen,
        estado: 'OK',
        inicio,
        fin: new Date(),
        candidatos,
        insertados,
        eliminados: eliminadosPorCuracion,
        duplicadosOmitidos,
        paginasConsultadas,
        mensaje,
      });

      return {
        candidatos,
        insertados,
        eliminadosPorCuracion,
        duplicadosOmitidos,
        paginasConsultadas,
        mensaje,
      };
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      mensaje = `Sincronizacion con error: ${detalle}`;
      this.logger.error(mensaje);

      await this.registrarLogSync({
        origen,
        estado: 'ERROR',
        inicio,
        fin: new Date(),
        candidatos,
        insertados,
        eliminados: eliminadosPorCuracion,
        duplicadosOmitidos,
        paginasConsultadas,
        mensaje,
      });

      throw error;
    }
  }

  async curarCatalogoManual(): Promise<ResultadoCuracion> {
    const inicio = new Date();
    const resultado = await this.curarCatalogoInterno();

    await this.registrarLogSync({
      origen: 'curacion-manual',
      estado: 'OK',
      inicio,
      fin: new Date(),
      candidatos: 0,
      insertados: 0,
      eliminados: resultado.eliminados,
      duplicadosOmitidos: resultado.duplicadosDetectados,
      paginasConsultadas: 0,
      mensaje:
        `Curacion manual OK. Eliminados: ${resultado.eliminados}. ` +
        `Renombrados: ${resultado.renombrados}.`,
    });

    return resultado;
  }

  private obtenerParametrosSync(): ParametrosSync {
    return {
      maxPaginas: this.obtenerEnteroEntorno(
        'ALIMENTOS_SYNC_MAX_PAGINAS',
        8,
        1,
        50,
      ),
      pageSize: this.obtenerEnteroEntorno(
        'ALIMENTOS_SYNC_PAGE_SIZE',
        100,
        20,
        200,
      ),
      limiteImportacion: this.obtenerEnteroEntorno(
        'ALIMENTOS_SYNC_LIMITE_IMPORTACION',
        500,
        50,
        2000,
      ),
    };
  }

  private obtenerEnteroEntorno(
    clave: string,
    valorDefecto: number,
    minimo: number,
    maximo: number,
  ): number {
    const raw = process.env[clave];
    if (!raw) {
      return valorDefecto;
    }

    const numero = Number(raw);
    if (!Number.isFinite(numero)) {
      return valorDefecto;
    }

    return Math.min(Math.max(Math.round(numero), minimo), maximo);
  }

  private async obtenerAlimentosOpenFoodFacts(
    parametros: ParametrosSync,
  ): Promise<{
    alimentos: AlimentoOrmEntity[];
    paginasConsultadas: number;
  }> {
    const alimentosMap = new Map<string, AlimentoOrmEntity>();
    let paginasConsultadas = 0;

    for (let pagina = 1; pagina <= parametros.maxPaginas; pagina += 1) {
      if (alimentosMap.size >= parametros.limiteImportacion) {
        break;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const url =
          `${this.urlOpenFoodFacts}?countries_tags=argentina` +
          `&page=${pagina}&page_size=${parametros.pageSize}` +
          `&fields=product_name,quantity,nutriments`;

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'NutriFitSupervisor/1.0 (alimentos-sync)',
          },
        });

        paginasConsultadas += 1;

        if (!response.ok) {
          this.logger.warn(
            `Open Food Facts respondio ${response.status} en pagina ${pagina}.`,
          );
          continue;
        }

        const body = (await response.json()) as OpenFoodFactsBusqueda;
        const productos = Array.isArray(body.products) ? body.products : [];

        if (productos.length === 0) {
          break;
        }

        for (const producto of productos) {
          if (alimentosMap.size >= parametros.limiteImportacion) {
            break;
          }

          const mapped = mapearProductoOpenFoodFacts(producto);
          if (!mapped) {
            continue;
          }

          const clave = normalizarNombreAlimento(mapped.nombre);
          if (!clave || esNombreRuidoso(mapped.nombre)) {
            continue;
          }

          if (!alimentosMap.has(clave)) {
            const entidad = this.alimentoRepo.create({
              nombre: mapped.nombre,
              cantidad: mapped.cantidad,
              calorias: mapped.calorias,
              proteinas: mapped.proteinas,
              carbohidratos: mapped.carbohidratos,
              grasas: mapped.grasas,
              hidratosDeCarbono: mapped.carbohidratos,
              unidadMedida: mapped.unidadMedida,
            });
            alimentosMap.set(clave, entidad);
          }
        }
      } catch (error) {
        const detalle = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Error consultando Open Food Facts pagina ${pagina}: ${detalle}`,
        );
      } finally {
        clearTimeout(timeoutId);
      }
    }

    return {
      alimentos: Array.from(alimentosMap.values()),
      paginasConsultadas,
    };
  }

  private async curarCatalogoInterno(): Promise<ResultadoCuracion> {
    const filasAlimentosRaw = (await this.dataSource.query(
      `SELECT id_alimento, nombre, calorias, proteinas, carbohidratos, grasas
         FROM alimento`,
    )) as unknown;

    const filasAlimentos = Array.isArray(filasAlimentosRaw)
      ? filasAlimentosRaw.filter(esFilaAlimentoCuracion)
      : [];

    const usadosRaw = (await this.dataSource.query(
      'SELECT DISTINCT id_alimento FROM opcion_comida_alimento',
    )) as unknown;
    const idsUsados = new Set(
      (Array.isArray(usadosRaw) ? usadosRaw.filter(esFilaIdAlimento) : []).map(
        (fila) => fila.id_alimento,
      ),
    );

    const idsEliminar = new Set<number>();
    const renombres = new Map<number, string>();
    const grupos = new Map<string, FilaAlimentoCuracion[]>();
    let ruidososDetectados = 0;
    let duplicadosDetectados = 0;

    for (const fila of filasAlimentos) {
      const nombreCurado = limpiarNombreAlimento(fila.nombre);
      const clave = normalizarNombreAlimento(nombreCurado);

      const sinMacros =
        fila.calorias === null &&
        fila.proteinas === null &&
        fila.carbohidratos === null &&
        fila.grasas === null;

      if (
        !nombreCurado ||
        !clave ||
        esNombreRuidoso(nombreCurado) ||
        sinMacros
      ) {
        ruidososDetectados += 1;
        if (!idsUsados.has(fila.id_alimento)) {
          idsEliminar.add(fila.id_alimento);
        }
        continue;
      }

      if (nombreCurado !== fila.nombre && !idsEliminar.has(fila.id_alimento)) {
        renombres.set(fila.id_alimento, nombreCurado);
      }

      const existentes = grupos.get(clave) ?? [];
      existentes.push(fila);
      grupos.set(clave, existentes);
    }

    for (const filas of grupos.values()) {
      if (filas.length <= 1) {
        continue;
      }

      duplicadosDetectados += filas.length - 1;
      const ordenadas = [...filas].sort((a, b) => {
        const scoreA = this.calcularScoreFila(a, idsUsados.has(a.id_alimento));
        const scoreB = this.calcularScoreFila(b, idsUsados.has(b.id_alimento));
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        return a.id_alimento - b.id_alimento;
      });

      const filaConservar = ordenadas[0];
      for (const candidata of ordenadas.slice(1)) {
        if (idsUsados.has(candidata.id_alimento)) {
          continue;
        }

        if (candidata.id_alimento !== filaConservar.id_alimento) {
          idsEliminar.add(candidata.id_alimento);
          renombres.delete(candidata.id_alimento);
        }
      }
    }

    const renombresAplicables = Array.from(renombres.entries()).filter(
      ([id]) => !idsEliminar.has(id),
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const [id, nombre] of renombresAplicables) {
        await queryRunner.query(
          'UPDATE alimento SET nombre = ? WHERE id_alimento = ?',
          [nombre, id],
        );
      }

      const idsAEliminar = Array.from(idsEliminar.values());
      const tamLote = 200;
      for (let i = 0; i < idsAEliminar.length; i += tamLote) {
        const lote = idsAEliminar.slice(i, i + tamLote);
        const placeholders = lote.map(() => '?').join(', ');
        await queryRunner.query(
          `DELETE FROM alimento WHERE id_alimento IN (${placeholders})`,
          lote,
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return {
      eliminados: idsEliminar.size,
      renombrados: renombresAplicables.length,
      duplicadosDetectados,
      ruidososDetectados,
    };
  }

  private calcularScoreFila(
    fila: FilaAlimentoCuracion,
    usada: boolean,
  ): number {
    let score = 0;
    if (usada) {
      score += 1000;
    }

    if (fila.calorias !== null && fila.calorias > 0) {
      score += 4;
    }
    if (fila.proteinas !== null) {
      score += 1;
    }
    if (fila.carbohidratos !== null) {
      score += 1;
    }
    if (fila.grasas !== null) {
      score += 1;
    }

    const nombreLimpio = limpiarNombreAlimento(fila.nombre);
    if (nombreLimpio.length >= 4 && nombreLimpio.length <= 60) {
      score += 1;
    }
    if (nombreLimpio.includes(',')) {
      score -= 1;
    }

    return score;
  }

  private async asegurarTablaLogSync(): Promise<void> {
    await this.dataSource.query(
      `CREATE TABLE IF NOT EXISTS alimento_sync_log (
        id_sync_log INT NOT NULL AUTO_INCREMENT,
        origen VARCHAR(30) NOT NULL,
        estado VARCHAR(20) NOT NULL,
        inicio DATETIME NOT NULL,
        fin DATETIME NOT NULL,
        candidatos INT NOT NULL DEFAULT 0,
        insertados INT NOT NULL DEFAULT 0,
        eliminados INT NOT NULL DEFAULT 0,
        duplicados_omitidos INT NOT NULL DEFAULT 0,
        paginas_consultadas INT NOT NULL DEFAULT 0,
        mensaje VARCHAR(255) NULL,
        PRIMARY KEY (id_sync_log)
      ) ENGINE=InnoDB`,
    );
  }

  private async registrarLogSync(payload: {
    origen: OrigenSync;
    estado: EstadoSync;
    inicio: Date;
    fin: Date;
    candidatos: number;
    insertados: number;
    eliminados: number;
    duplicadosOmitidos: number;
    paginasConsultadas: number;
    mensaje: string;
  }): Promise<void> {
    await this.asegurarTablaLogSync();

    await this.dataSource.query(
      `INSERT INTO alimento_sync_log
        (origen, estado, inicio, fin, candidatos, insertados, eliminados,
         duplicados_omitidos, paginas_consultadas, mensaje)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.origen,
        payload.estado,
        payload.inicio,
        payload.fin,
        payload.candidatos,
        payload.insertados,
        payload.eliminados,
        payload.duplicadosOmitidos,
        payload.paginasConsultadas,
        payload.mensaje,
      ],
    );
  }
}
