import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { PaginatedData, PaginationParams } from '@nutrifit/shared';
import { Readable, Transform } from 'stream';
import { DataSource, Repository } from 'typeorm';

import { calcularMeta, paginarQuery } from 'src/common/helpers/paginacion.helper';
import {
  AuditLogOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import {
  FiltrosAuditoria,
  ExportarAuditoriaResultado,
  RegistroAuditoriaReporte,
} from './auditoria.service';

type FilaAuditoriaRaw = Record<string, unknown>;

interface ConsultaRaw {
  sql: string;
  parametros: unknown[];
}

@Injectable()
export class AuditoriaReporteService {
  private readonly limiteStreaming = 1000;

  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly auditoriaRepository: Repository<AuditLogOrmEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async listarConFiltros(
    filtros: FiltrosAuditoria,
  ): Promise<PaginatedData<RegistroAuditoriaReporte>> {
    if (filtros.modulo === 'auth') {
      return this.listarAuthConFiltros(filtros);
    }

    const queryBuilder = this.crearQueryAuditLog(filtros);
    const paginationParams: PaginationParams = {
      page: filtros.page ?? 1,
      limit: filtros.limit ?? 50,
    };
    const resultado = await paginarQuery(queryBuilder, paginationParams);

    return {
      data: resultado.data.map((registro) => this.mapearAuditLog(registro)),
      pagination: resultado.pagination,
    };
  }

  async exportar(
    filtros: FiltrosAuditoria,
    formato: 'csv' | 'json',
  ): Promise<ExportarAuditoriaResultado> {
    const limite = filtros.limit;
    const usarStream = limite === undefined || limite > this.limiteStreaming;

    if (!usarStream) {
      const registros = await this.listarTodosParaExportar(filtros, limite);
      const contenido = formato === 'json'
        ? JSON.stringify(registros, null, 2)
        : this.convertirCsv(registros);

      return this.crearResultadoExportacion(
        Buffer.from(contenido, 'utf8'),
        formato,
        false,
      );
    }

    const contenido = filtros.modulo === 'auth'
      ? await this.crearStreamAuth(filtros, formato)
      : await this.crearStreamAuditLog(filtros, formato);

    return this.crearResultadoExportacion(contenido, formato, true);
  }

  private async listarAuthConFiltros(
    filtros: FiltrosAuditoria,
  ): Promise<PaginatedData<RegistroAuditoriaReporte>> {
    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 50;
    const offset = (page - 1) * limit;
    const consulta = this.crearConsultaAuthUnion(filtros, limit, offset);
    const totalConsulta = this.crearConsultaAuthTotal(filtros);
    const [filas, totalFilas] = await Promise.all([
      this.dataSource.query(consulta.sql, consulta.parametros) as Promise<FilaAuditoriaRaw[]>,
      this.dataSource.query(totalConsulta.sql, totalConsulta.parametros) as Promise<Array<{ total: string | number }>>,
    ]);
    const total = Number(totalFilas[0]?.total ?? 0);

    return {
      data: filas.map((fila) => this.mapearRaw(fila)),
      pagination: calcularMeta(total, page, limit),
    };
  }

  private async listarTodosParaExportar(
    filtros: FiltrosAuditoria,
    limite: number,
  ): Promise<RegistroAuditoriaReporte[]> {
    if (filtros.modulo === 'auth') {
      const consulta = this.crearConsultaAuthUnion(filtros, limite, 0);
      const filas = await this.dataSource.query(consulta.sql, consulta.parametros) as FilaAuditoriaRaw[];
      return filas.map((fila) => this.mapearRaw(fila));
    }

    const registros = await this.crearQueryAuditLog(filtros).take(limite).getMany();
    return registros.map((registro) => this.mapearAuditLog(registro));
  }

  private crearQueryAuditLog(filtros: FiltrosAuditoria) {
    const queryBuilder = this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .orderBy('auditoria.fecha', filtros.orden ?? 'DESC');

    if (filtros.gimnasioId !== undefined && filtros.gimnasioId !== null) {
      if (filtros.incluirSinGimnasio) {
        queryBuilder.andWhere(
          '(auditoria.gimnasioId = :gimnasioId OR auditoria.gimnasioId IS NULL)',
          { gimnasioId: filtros.gimnasioId },
        );
      } else {
        queryBuilder.andWhere('auditoria.gimnasioId = :gimnasioId', {
          gimnasioId: filtros.gimnasioId,
        });
      }
    }

    if (filtros.gimnasioId === null && filtros.incluirSinGimnasio) {
      queryBuilder.andWhere('auditoria.gimnasioId IS NULL');
    }

    if (filtros.fechaDesde) {
      queryBuilder.andWhere('auditoria.fecha >= :fechaDesde', { fechaDesde: filtros.fechaDesde });
    }

    if (filtros.fechaHasta) {
      queryBuilder.andWhere('auditoria.fecha <= :fechaHasta', { fechaHasta: filtros.fechaHasta });
    }

    if (filtros.modulo) {
      queryBuilder.andWhere('auditoria.modulo = :modulo', { modulo: filtros.modulo });
    }

    if (filtros.accion) {
      queryBuilder.andWhere('auditoria.accion = :accion', { accion: filtros.accion });
    }

    if (filtros.entidad) {
      queryBuilder.andWhere('auditoria.entidad = :entidad', { entidad: filtros.entidad });
    }

    if (filtros.entidadId != null) {
      queryBuilder.andWhere('auditoria.entidadId = :entidadId', {
        entidadId: String(filtros.entidadId),
      });
    }

    if (filtros.usuarioId) {
      queryBuilder.andWhere('auditoria.usuarioId = :usuarioId', {
        usuarioId: String(filtros.usuarioId),
      });
    }

    return queryBuilder;
  }

  private crearConsultaAuthUnion(
    filtros: FiltrosAuditoria,
    limit?: number,
    offset?: number,
  ): ConsultaRaw {
    const audit = this.crearCondicionesRaw(filtros, 'audit_log');
    const login = this.crearCondicionesRaw(filtros, 'login_audit');
    const parametros = [...audit.parametros, ...login.parametros];
    const orden = filtros.orden === 'ASC' ? 'ASC' : 'DESC';
    const limiteSql = limit === undefined ? '' : ' LIMIT ? OFFSET ?';

    if (limit !== undefined) {
      parametros.push(limit, offset ?? 0);
    }

    return {
      sql: `
        SELECT * FROM (
          SELECT
            'audit_log' AS kind,
            id_audit_log AS id,
            fecha,
            id_gimnasio AS gimnasioId,
            id_usuario AS usuarioId,
            modulo,
            accion,
            entidad,
            entidad_id AS entidadId,
            tipo_accion AS tipoAccion,
            descripcion,
            ip,
            user_agent AS userAgent,
            valores_antes AS valoresAntes,
            valores_despues AS valoresDespues,
            NULL AS resultado,
            NULL AS emailIntentado,
            NULL AS motivo
          FROM audit_log
          ${audit.sql}
          UNION ALL
          SELECT
            'login_audit' AS kind,
            id_login_audit AS id,
            fecha,
            id_gimnasio AS gimnasioId,
            CAST(id_usuario AS CHAR) AS usuarioId,
            'auth' AS modulo,
            resultado AS accion,
            'LoginAudit' AS entidad,
            CAST(id_login_audit AS CHAR) AS entidadId,
            NULL AS tipoAccion,
            CONCAT('Evento de autenticacion: ', resultado) AS descripcion,
            ip,
            user_agent AS userAgent,
            NULL AS valoresAntes,
            NULL AS valoresDespues,
            resultado,
            email_intentado AS emailIntentado,
            NULL AS motivo
          FROM login_audit
          ${login.sql}
        ) auditoria_union
        ORDER BY fecha ${orden}
        ${limiteSql}
      `,
      parametros,
    };
  }

  private crearConsultaAuthTotal(filtros: FiltrosAuditoria): ConsultaRaw {
    const audit = this.crearCondicionesRaw(filtros, 'audit_log');
    const login = this.crearCondicionesRaw(filtros, 'login_audit');

    return {
      sql: `
        SELECT SUM(total) AS total FROM (
          SELECT COUNT(*) AS total FROM audit_log ${audit.sql}
          UNION ALL
          SELECT COUNT(*) AS total FROM login_audit ${login.sql}
        ) conteos
      `,
      parametros: [...audit.parametros, ...login.parametros],
    };
  }

  private crearCondicionesRaw(
    filtros: FiltrosAuditoria,
    tabla: 'audit_log' | 'login_audit',
  ): ConsultaRaw {
    const condiciones: string[] = [];
    const parametros: unknown[] = [];
    const columnaUsuario = 'id_usuario';

    if (tabla === 'audit_log') {
      condiciones.push('modulo = ?');
      parametros.push('auth');
    }

    if (filtros.gimnasioId !== undefined && filtros.gimnasioId !== null) {
      if (filtros.incluirSinGimnasio) {
        condiciones.push('(id_gimnasio = ? OR id_gimnasio IS NULL)');
      } else {
        condiciones.push('id_gimnasio = ?');
      }
      parametros.push(filtros.gimnasioId);
    }

    if (filtros.gimnasioId === null && filtros.incluirSinGimnasio) {
      condiciones.push('id_gimnasio IS NULL');
    }

    if (filtros.fechaDesde) {
      condiciones.push('fecha >= ?');
      parametros.push(filtros.fechaDesde);
    }

    if (filtros.fechaHasta) {
      condiciones.push('fecha <= ?');
      parametros.push(filtros.fechaHasta);
    }

    if (filtros.accion) {
      condiciones.push(tabla === 'login_audit' ? 'resultado = ?' : 'accion = ?');
      parametros.push(filtros.accion);
    }

    if (filtros.entidad && tabla === 'audit_log') {
      condiciones.push('entidad = ?');
      parametros.push(filtros.entidad);
    }

    if (filtros.entidadId != null && tabla === 'audit_log') {
      condiciones.push('entidad_id = ?');
      parametros.push(String(filtros.entidadId));
    }

    if (filtros.usuarioId) {
      condiciones.push(`${columnaUsuario} = ?`);
      parametros.push(tabla === 'audit_log' ? String(filtros.usuarioId) : filtros.usuarioId);
    }

    return {
      sql: condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '',
      parametros,
    };
  }

  private async crearStreamAuditLog(
    filtros: FiltrosAuditoria,
    formato: 'csv' | 'json',
  ): Promise<Readable> {
    const queryBuilder = this.crearQueryAuditLog(filtros)
      .select([
        'auditoria.idAuditLog',
        'auditoria.fecha',
        'auditoria.gimnasioId',
        'auditoria.usuarioId',
        'auditoria.modulo',
        'auditoria.accion',
        'auditoria.entidad',
        'auditoria.entidadId',
        'auditoria.tipoAccion',
        'auditoria.descripcion',
        'auditoria.ip',
        'auditoria.userAgent',
        'auditoria.valoresAntes',
        'auditoria.valoresDespues',
      ]);

    if (filtros.limit !== undefined) {
      queryBuilder.limit(filtros.limit);
    }

    const stream = await queryBuilder.stream();
    return stream.pipe(this.crearTransformExportacion(formato, (fila) =>
      this.mapearRawAuditLogStream(fila),
    ));
  }

  private async crearStreamAuth(
    filtros: FiltrosAuditoria,
    formato: 'csv' | 'json',
  ): Promise<Readable> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    const consulta = this.crearConsultaAuthUnion(filtros, filtros.limit, 0);
    const stream = await queryRunner.stream(consulta.sql, consulta.parametros);

    stream.once('end', () => void queryRunner.release());
    stream.once('error', () => void queryRunner.release());

    return stream.pipe(this.crearTransformExportacion(formato, (fila) =>
      this.mapearRaw(fila),
    ));
  }

  private crearTransformExportacion(
    formato: 'csv' | 'json',
    mapear: (fila: FilaAuditoriaRaw) => RegistroAuditoriaReporte,
  ): Transform {
    let primeraFila = true;
    const encabezadosCsv = this.encabezadosCsv();
    const convertirFilaCsv = (registro: RegistroAuditoriaReporte) =>
      this.convertirFilaCsv(registro);

    return new Transform({
      objectMode: true,
      transform(fila: FilaAuditoriaRaw, _encoding, callback) {
        const registro = mapear(fila);

        if (formato === 'csv') {
          if (primeraFila) {
            this.push(`${encabezadosCsv.join(',')}\n`);
            primeraFila = false;
          }
          this.push(`${convertirFilaCsv(registro)}\n`);
          callback();
          return;
        }

        this.push(`${primeraFila ? '[' : ','}\n${JSON.stringify(registro)}`);
        primeraFila = false;
        callback();
      },
      flush(callback) {
        if (formato === 'json') {
          this.push(primeraFila ? '[]' : '\n]');
        }
        callback();
      },
    });
  }

  private crearResultadoExportacion(
    contenido: Buffer | Readable,
    formato: 'csv' | 'json',
    esStream: boolean,
  ): ExportarAuditoriaResultado {
    return {
      contenido,
      nombreArchivo: formato === 'json' ? 'auditoria.json' : 'auditoria.csv',
      contentType: formato === 'json' ? 'application/json' : 'text/csv; charset=utf-8',
      esStream,
    };
  }

  private mapearAuditLog(registro: AuditLogOrmEntity): RegistroAuditoriaReporte {
    return {
      kind: 'audit_log',
      id: registro.idAuditLog,
      fecha: registro.fecha,
      gimnasioId: registro.gimnasioId,
      usuarioId: registro.usuarioId,
      modulo: registro.modulo,
      accion: registro.accion,
      entidad: registro.entidad,
      entidadId: registro.entidadId,
      tipoAccion: registro.tipoAccion,
      descripcion: registro.descripcion,
      ip: registro.ip,
      userAgent: registro.userAgent,
      valoresAntes: registro.valoresAntes,
      valoresDespues: registro.valoresDespues,
    };
  }

  private mapearRaw(fila: FilaAuditoriaRaw): RegistroAuditoriaReporte {
    return {
      kind: fila.kind as 'audit_log' | 'login_audit',
      id: Number(fila.id),
      fecha: this.mapearFecha(fila.fecha),
      gimnasioId: this.mapearNumeroNullable(fila.gimnasioId),
      usuarioId: fila.usuarioId == null ? null : String(fila.usuarioId),
      modulo: String(fila.modulo),
      accion: String(fila.accion),
      entidad: String(fila.entidad),
      entidadId: fila.entidadId == null ? null : String(fila.entidadId),
      tipoAccion: fila.tipoAccion == null ? null : String(fila.tipoAccion),
      descripcion: fila.descripcion == null ? null : String(fila.descripcion),
      ip: fila.ip == null ? null : String(fila.ip),
      userAgent: fila.userAgent == null ? null : String(fila.userAgent),
      valoresAntes: this.mapearJsonNullable(fila.valoresAntes),
      valoresDespues: this.mapearJsonNullable(fila.valoresDespues),
      resultado: fila.resultado == null ? null : String(fila.resultado),
      emailIntentado: fila.emailIntentado == null ? null : String(fila.emailIntentado),
      motivo: fila.motivo == null ? null : String(fila.motivo),
    };
  }

  private mapearRawAuditLogStream(fila: FilaAuditoriaRaw): RegistroAuditoriaReporte {
    return {
      kind: 'audit_log',
      id: Number(fila.auditoria_id_audit_log),
      fecha: this.mapearFecha(fila.auditoria_fecha),
      gimnasioId: this.mapearNumeroNullable(fila.auditoria_id_gimnasio),
      usuarioId: fila.auditoria_id_usuario == null ? null : String(fila.auditoria_id_usuario),
      modulo: String(fila.auditoria_modulo),
      accion: String(fila.auditoria_accion),
      entidad: String(fila.auditoria_entidad),
      entidadId: fila.auditoria_entidad_id == null ? null : String(fila.auditoria_entidad_id),
      tipoAccion: fila.auditoria_tipo_accion == null ? null : String(fila.auditoria_tipo_accion),
      descripcion: fila.auditoria_descripcion == null ? null : String(fila.auditoria_descripcion),
      ip: fila.auditoria_ip == null ? null : String(fila.auditoria_ip),
      userAgent: fila.auditoria_user_agent == null ? null : String(fila.auditoria_user_agent),
      valoresAntes: this.mapearJsonNullable(fila.auditoria_valores_antes),
      valoresDespues: this.mapearJsonNullable(fila.auditoria_valores_despues),
    };
  }

  private convertirCsv(registros: RegistroAuditoriaReporte[]): string {
    return [
      this.encabezadosCsv().join(','),
      ...registros.map((registro) => this.convertirFilaCsv(registro)),
    ].join('\n');
  }

  private encabezadosCsv(): string[] {
    return [
      'id',
      'fecha',
      'modulo',
      'accion',
      'entidad',
      'entidadId',
      'descripcion',
      'usuarioId',
      'gimnasioId',
      'ip',
      'userAgent',
      'tipoAccion',
      'valoresAntes',
      'valoresDespues',
    ];
  }

  private convertirFilaCsv(registro: RegistroAuditoriaReporte): string {
    return [
      registro.id,
      registro.fecha.toISOString(),
      registro.modulo,
      registro.accion,
      registro.entidad,
      registro.entidadId ?? '',
      registro.descripcion ?? '',
      registro.usuarioId ?? '',
      registro.gimnasioId ?? '',
      registro.ip ?? '',
      registro.userAgent ?? '',
      registro.tipoAccion ?? '',
      this.serializarJsonCsv(registro.valoresAntes),
      this.serializarJsonCsv(registro.valoresDespues),
    ].map((valor) => this.escaparCsv(String(valor))).join(',');
  }

  private escaparCsv(valor: string): string {
    return `"${valor.replace(/"/g, '""')}"`;
  }

  private serializarJsonCsv(valor: Record<string, unknown> | null): string {
    return valor === null ? '' : JSON.stringify(valor);
  }

  private mapearFecha(valor: unknown): Date {
    return valor instanceof Date ? valor : new Date(String(valor));
  }

  private mapearNumeroNullable(valor: unknown): number | null {
    if (valor === null || valor === undefined) {
      return null;
    }

    const numero = Number(valor);
    return Number.isNaN(numero) ? null : numero;
  }

  private mapearJsonNullable(valor: unknown): Record<string, unknown> | null {
    if (valor === null || valor === undefined) {
      return null;
    }

    if (typeof valor === 'object' && !Buffer.isBuffer(valor)) {
      return valor as Record<string, unknown>;
    }

    const texto = Buffer.isBuffer(valor) ? valor.toString('utf8') : String(valor);
    if (texto === '') {
      return null;
    }

    try {
      return JSON.parse(texto) as Record<string, unknown>;
    } catch {
      return { valor: texto };
    }
  }
}
