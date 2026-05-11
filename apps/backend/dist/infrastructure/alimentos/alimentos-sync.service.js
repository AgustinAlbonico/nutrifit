"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AlimentosSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlimentosSyncService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const alimento_entity_1 = require("../persistence/typeorm/entities/alimento.entity");
const alimentos_argentina_catalogo_util_1 = require("./alimentos-argentina-catalogo.util");
function esRecord(valor) {
    return typeof valor === 'object' && valor !== null;
}
function esFilaNombre(valor) {
    return esRecord(valor) && typeof valor.nombre === 'string';
}
function esFilaIdAlimento(valor) {
    return esRecord(valor) && typeof valor.id_alimento === 'number';
}
function esFilaAlimentoCuracion(valor) {
    if (!esRecord(valor)) {
        return false;
    }
    return (typeof valor.id_alimento === 'number' &&
        typeof valor.nombre === 'string' &&
        (typeof valor.calorias === 'number' || valor.calorias === null) &&
        (typeof valor.proteinas === 'number' || valor.proteinas === null) &&
        (typeof valor.carbohidratos === 'number' || valor.carbohidratos === null) &&
        (typeof valor.grasas === 'number' || valor.grasas === null));
}
function esFilaLogSync(valor) {
    if (!esRecord(valor)) {
        return false;
    }
    return (typeof valor.id_sync_log === 'number' &&
        typeof valor.origen === 'string' &&
        typeof valor.estado === 'string' &&
        (valor.inicio instanceof Date || typeof valor.inicio === 'string') &&
        (valor.fin instanceof Date || typeof valor.fin === 'string'));
}
let AlimentosSyncService = AlimentosSyncService_1 = class AlimentosSyncService {
    alimentoRepo;
    dataSource;
    logger = new common_1.Logger(AlimentosSyncService_1.name);
    urlOpenFoodFacts = 'https://world.openfoodfacts.org/api/v2/search';
    constructor(alimentoRepo, dataSource) {
        this.alimentoRepo = alimentoRepo;
        this.dataSource = dataSource;
    }
    async onModuleInit() {
        await this.asegurarTablaLogSync();
    }
    sincronizacionAutomaticaHabilitada() {
        const valor = (process.env.ALIMENTOS_SYNC_HABILITADO ?? 'false').toLowerCase();
        return valor === 'true' || valor === '1' || valor === 'si';
    }
    async obtenerUltimoEstadoSync() {
        await this.asegurarTablaLogSync();
        const resultado = (await this.dataSource.query(`SELECT id_sync_log, origen, estado, inicio, fin, candidatos, insertados,
              eliminados, duplicados_omitidos, paginas_consultadas, mensaje
         FROM alimento_sync_log
        ORDER BY id_sync_log DESC
        LIMIT 1`));
        if (!Array.isArray(resultado) || resultado.length === 0) {
            return null;
        }
        const filas = resultado;
        const fila = filas[0];
        if (!esFilaLogSync(fila)) {
            return null;
        }
        const inicio = fila.inicio instanceof Date
            ? fila.inicio.toISOString()
            : new Date(fila.inicio).toISOString();
        const fin = fila.fin instanceof Date
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
    async sincronizarCatalogo(origen = 'manual') {
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
            const candidatosMap = new Map();
            for (const alimento of alimentos_argentina_catalogo_util_1.ALIMENTOS_BASE_ARGENTINA) {
                const clave = (0, alimentos_argentina_catalogo_util_1.normalizarNombreAlimento)(alimento.nombre);
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
                const clave = (0, alimentos_argentina_catalogo_util_1.normalizarNombreAlimento)(alimento.nombre);
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
            const nombresExistentesRaw = (await this.dataSource.query('SELECT nombre FROM alimento'));
            const nombresExistentes = new Set((Array.isArray(nombresExistentesRaw)
                ? nombresExistentesRaw.filter(esFilaNombre)
                : [])
                .map((fila) => (0, alimentos_argentina_catalogo_util_1.normalizarNombreAlimento)(fila.nombre))
                .filter((nombre) => nombre.length > 0));
            const nuevos = candidatosArray.filter((alimento) => {
                const clave = (0, alimentos_argentina_catalogo_util_1.normalizarNombreAlimento)(alimento.nombre);
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
        }
        catch (error) {
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
    async curarCatalogoManual() {
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
            mensaje: `Curacion manual OK. Eliminados: ${resultado.eliminados}. ` +
                `Renombrados: ${resultado.renombrados}.`,
        });
        return resultado;
    }
    obtenerParametrosSync() {
        return {
            maxPaginas: this.obtenerEnteroEntorno('ALIMENTOS_SYNC_MAX_PAGINAS', 8, 1, 50),
            pageSize: this.obtenerEnteroEntorno('ALIMENTOS_SYNC_PAGE_SIZE', 100, 20, 200),
            limiteImportacion: this.obtenerEnteroEntorno('ALIMENTOS_SYNC_LIMITE_IMPORTACION', 500, 50, 2000),
        };
    }
    obtenerEnteroEntorno(clave, valorDefecto, minimo, maximo) {
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
    async obtenerAlimentosOpenFoodFacts(parametros) {
        const alimentosMap = new Map();
        let paginasConsultadas = 0;
        for (let pagina = 1; pagina <= parametros.maxPaginas; pagina += 1) {
            if (alimentosMap.size >= parametros.limiteImportacion) {
                break;
            }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);
            try {
                const url = `${this.urlOpenFoodFacts}?countries_tags=argentina` +
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
                    this.logger.warn(`Open Food Facts respondio ${response.status} en pagina ${pagina}.`);
                    continue;
                }
                const body = (await response.json());
                const productos = Array.isArray(body.products) ? body.products : [];
                if (productos.length === 0) {
                    break;
                }
                for (const producto of productos) {
                    if (alimentosMap.size >= parametros.limiteImportacion) {
                        break;
                    }
                    const mapped = (0, alimentos_argentina_catalogo_util_1.mapearProductoOpenFoodFacts)(producto);
                    if (!mapped) {
                        continue;
                    }
                    const clave = (0, alimentos_argentina_catalogo_util_1.normalizarNombreAlimento)(mapped.nombre);
                    if (!clave || (0, alimentos_argentina_catalogo_util_1.esNombreRuidoso)(mapped.nombre)) {
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
            }
            catch (error) {
                const detalle = error instanceof Error ? error.message : String(error);
                this.logger.warn(`Error consultando Open Food Facts pagina ${pagina}: ${detalle}`);
            }
            finally {
                clearTimeout(timeoutId);
            }
        }
        return {
            alimentos: Array.from(alimentosMap.values()),
            paginasConsultadas,
        };
    }
    async curarCatalogoInterno() {
        const filasAlimentosRaw = (await this.dataSource.query(`SELECT id_alimento, nombre, calorias, proteinas, carbohidratos, grasas
         FROM alimento`));
        const filasAlimentos = Array.isArray(filasAlimentosRaw)
            ? filasAlimentosRaw.filter(esFilaAlimentoCuracion)
            : [];
        const usadosRaw = (await this.dataSource.query('SELECT DISTINCT id_alimento FROM item_comida'));
        const idsUsados = new Set((Array.isArray(usadosRaw) ? usadosRaw.filter(esFilaIdAlimento) : []).map((fila) => fila.id_alimento));
        const idsEliminar = new Set();
        const renombres = new Map();
        const grupos = new Map();
        let ruidososDetectados = 0;
        let duplicadosDetectados = 0;
        for (const fila of filasAlimentos) {
            const nombreCurado = (0, alimentos_argentina_catalogo_util_1.limpiarNombreAlimento)(fila.nombre);
            const clave = (0, alimentos_argentina_catalogo_util_1.normalizarNombreAlimento)(nombreCurado);
            const sinMacros = fila.calorias === null &&
                fila.proteinas === null &&
                fila.carbohidratos === null &&
                fila.grasas === null;
            if (!nombreCurado ||
                !clave ||
                (0, alimentos_argentina_catalogo_util_1.esNombreRuidoso)(nombreCurado) ||
                sinMacros) {
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
        const renombresAplicables = Array.from(renombres.entries()).filter(([id]) => !idsEliminar.has(id));
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            for (const [id, nombre] of renombresAplicables) {
                await queryRunner.query('UPDATE alimento SET nombre = ? WHERE id_alimento = ?', [nombre, id]);
            }
            const idsAEliminar = Array.from(idsEliminar.values());
            const tamLote = 200;
            for (let i = 0; i < idsAEliminar.length; i += tamLote) {
                const lote = idsAEliminar.slice(i, i + tamLote);
                const placeholders = lote.map(() => '?').join(', ');
                await queryRunner.query(`DELETE FROM alimento WHERE id_alimento IN (${placeholders})`, lote);
            }
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return {
            eliminados: idsEliminar.size,
            renombrados: renombresAplicables.length,
            duplicadosDetectados,
            ruidososDetectados,
        };
    }
    calcularScoreFila(fila, usada) {
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
        const nombreLimpio = (0, alimentos_argentina_catalogo_util_1.limpiarNombreAlimento)(fila.nombre);
        if (nombreLimpio.length >= 4 && nombreLimpio.length <= 60) {
            score += 1;
        }
        if (nombreLimpio.includes(',')) {
            score -= 1;
        }
        return score;
    }
    async asegurarTablaLogSync() {
        await this.dataSource.query(`CREATE TABLE IF NOT EXISTS alimento_sync_log (
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
      ) ENGINE=InnoDB`);
    }
    async registrarLogSync(payload) {
        await this.asegurarTablaLogSync();
        await this.dataSource.query(`INSERT INTO alimento_sync_log
        (origen, estado, inicio, fin, candidatos, insertados, eliminados,
         duplicados_omitidos, paginas_consultadas, mensaje)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
        ]);
    }
};
exports.AlimentosSyncService = AlimentosSyncService;
exports.AlimentosSyncService = AlimentosSyncService = AlimentosSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(alimento_entity_1.AlimentoOrmEntity)),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], AlimentosSyncService);
//# sourceMappingURL=alimentos-sync.service.js.map