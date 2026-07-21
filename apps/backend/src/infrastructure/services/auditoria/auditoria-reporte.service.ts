import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { PaginatedData, PaginationParams } from '@nutrifit/shared';
import { Readable, Transform } from 'stream';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import {
  calcularMeta,
  paginarQuery,
} from 'src/common/helpers/paginacion.helper';
import { AuditLogOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { LoginAuditOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/login-audit.entity';
import {
  FiltrosAuditoria,
  ExportarAuditoriaResultado,
  RegistroAuditoriaReporte,
} from './auditoria.service';

type FilaAuditoriaRaw = Record<string, unknown>;

@Injectable()
export class AuditoriaReporteService {
  private readonly limiteStreaming = 1000;

  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly auditoriaRepository: Repository<AuditLogOrmEntity>,
    @InjectRepository(LoginAuditOrmEntity)
    private readonly loginAuditRepository: Repository<LoginAuditOrmEntity>,
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
      const contenido =
        formato === 'json'
          ? JSON.stringify(registros, null, 2)
          : this.convertirCsv(registros);

      return this.crearResultadoExportacion(
        Buffer.from(contenido, 'utf8'),
        formato,
        false,
      );
    }

    const contenido =
      filtros.modulo === 'auth'
        ? await this.crearStreamAuth(filtros, formato)
        : await this.crearStreamAuditLog(filtros, formato);

    return this.crearResultadoExportacion(contenido, formato, true);
  }

  /**
   * Lista eventos de autenticacion combinando `audit_log` (modulo='auth') y
   * `login_audit`. Para evitar colisiones entre collations/charsets a nivel de
   * SQL, NO usamos UNION ALL: hacemos dos queries separadas y mergeamos en
   * memoria. Paginacion en codigo (offset/limit sobre el array combinado y
   * ordenado por fecha).
   */
  private async listarAuthConFiltros(
    filtros: FiltrosAuditoria,
  ): Promise<PaginatedData<RegistroAuditoriaReporte>> {
    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 50;
    const offset = (page - 1) * limit;

    // Dos queries independientes; cada una aplica los filtros que le corresponden.
    const auditQuery = this.crearQueryAuditLog({
      ...filtros,
      modulo: 'auth',
    });
    const loginQuery = this.crearQueryLoginAudit(filtros);

    const [registrosAudit, registrosLogin] = await Promise.all([
      auditQuery.getMany(),
      loginQuery.getMany(),
    ]);

    const total = registrosAudit.length + registrosLogin.length;
    const todos = [
      ...registrosAudit.map((registro) => this.mapearAuditLog(registro)),
      ...registrosLogin.map((registro) => this.mapearLoginAudit(registro)),
    ];
    todos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    const data = todos.slice(offset, offset + limit);

    return {
      data,
      pagination: calcularMeta(total, page, limit),
    };
  }

  private async listarTodosParaExportar(
    filtros: FiltrosAuditoria,
    limite: number,
  ): Promise<RegistroAuditoriaReporte[]> {
    if (filtros.modulo === 'auth') {
      const auditQuery = this.crearQueryAuditLog({
        ...filtros,
        modulo: 'auth',
      });
      const loginQuery = this.crearQueryLoginAudit(filtros);

      const [registrosAudit, registrosLogin] = await Promise.all([
        auditQuery.take(limite).getMany(),
        loginQuery.take(limite).getMany(),
      ]);

      const todos = [
        ...registrosAudit.map((registro) => this.mapearAuditLog(registro)),
        ...registrosLogin.map((registro) => this.mapearLoginAudit(registro)),
      ];
      todos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
      return todos.slice(0, limite);
    }

    const registros = await this.crearQueryAuditLog(filtros)
      .take(limite)
      .getMany();
    return registros.map((registro) => this.mapearAuditLog(registro));
  }

  private crearQueryAuditLog(
    filtros: FiltrosAuditoria,
  ): SelectQueryBuilder<AuditLogOrmEntity> {
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
      queryBuilder.andWhere('auditoria.fecha >= :fechaDesde', {
        fechaDesde: filtros.fechaDesde,
      });
    }

    if (filtros.fechaHasta) {
      queryBuilder.andWhere('auditoria.fecha <= :fechaHasta', {
        fechaHasta: filtros.fechaHasta,
      });
    }

    if (filtros.modulo) {
      queryBuilder.andWhere('auditoria.modulo = :modulo', {
        modulo: filtros.modulo,
      });
    }

    if (filtros.accion) {
      queryBuilder.andWhere('auditoria.accion = :accion', {
        accion: filtros.accion,
      });
    }

    if (filtros.entidad) {
      queryBuilder.andWhere('auditoria.entidad = :entidad', {
        entidad: filtros.entidad,
      });
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

  private crearQueryLoginAudit(
    filtros: FiltrosAuditoria,
  ): SelectQueryBuilder<LoginAuditOrmEntity> {
    const queryBuilder = this.loginAuditRepository
      .createQueryBuilder('login')
      .orderBy('login.fecha', filtros.orden ?? 'DESC');

    if (filtros.gimnasioId !== undefined && filtros.gimnasioId !== null) {
      if (filtros.incluirSinGimnasio) {
        queryBuilder.andWhere(
          '(login.gimnasioId = :gimnasioId OR login.gimnasioId IS NULL)',
          { gimnasioId: filtros.gimnasioId },
        );
      } else {
        queryBuilder.andWhere('login.gimnasioId = :gimnasioId', {
          gimnasioId: filtros.gimnasioId,
        });
      }
    }

    if (filtros.gimnasioId === null && filtros.incluirSinGimnasio) {
      queryBuilder.andWhere('login.gimnasioId IS NULL');
    }

    if (filtros.fechaDesde) {
      queryBuilder.andWhere('login.fecha >= :fechaDesde', {
        fechaDesde: filtros.fechaDesde,
      });
    }

    if (filtros.fechaHasta) {
      queryBuilder.andWhere('login.fecha <= :fechaHasta', {
        fechaHasta: filtros.fechaHasta,
      });
    }

    // En login_audit, la "accion" del reporte es el `resultado`.
    if (filtros.accion) {
      queryBuilder.andWhere('login.resultado = :resultado', {
        resultado: filtros.accion,
      });
    }

    if (filtros.usuarioId != null) {
      queryBuilder.andWhere('login.usuarioId = :usuarioId', {
        usuarioId: filtros.usuarioId,
      });
    }

    return queryBuilder;
  }

  private async crearStreamAuditLog(
    filtros: FiltrosAuditoria,
    formato: 'csv' | 'json',
  ): Promise<Readable> {
    const queryBuilder = this.crearQueryAuditLog(filtros).select([
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
    return stream.pipe(
      this.crearTransformExportacion(formato, (fila) =>
        this.mapearRawAuditLogStream(fila),
      ),
    );
  }

  /**
   * Stream de exportacion de eventos auth. Sin UNION SQL: cargamos ambos
   * repos por separado y los envolvemos en un `Readable.from` iterable.
   * Para `modulo=auth` el volumen esperado es bajo (eventos de login/logout/
   * refresh), por lo que el mode "load all then stream" es razonable.
   */
  private async crearStreamAuth(
    filtros: FiltrosAuditoria,
    formato: 'csv' | 'json',
  ): Promise<Readable> {
    const registros = await this.listarTodosParaExportar(
      { ...filtros, modulo: 'auth' },
      filtros.limit ?? this.limiteStreaming,
    );

    const transform = this.crearTransformExportacion(formato, () => {
      throw new Error('No se invoca: usamos buffer completo');
    });

    void transform;

    if (formato === 'json') {
      const json = JSON.stringify(registros, null, 2);
      return Readable.from([Buffer.from(`${json}`, 'utf8')]);
    }

    const csv = this.convertirCsv(registros);
    return Readable.from([Buffer.from(csv, 'utf8')]);
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
      contentType:
        formato === 'json' ? 'application/json' : 'text/csv; charset=utf-8',
      esStream,
    };
  }

  private mapearAuditLog(
    registro: AuditLogOrmEntity,
  ): RegistroAuditoriaReporte {
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

  private mapearLoginAudit(
    registro: LoginAuditOrmEntity,
  ): RegistroAuditoriaReporte {
    const idString = String(registro.idLoginAudit);
    const descripcion = `Evento de autenticacion: ${registro.resultado}`;

    return {
      kind: 'login_audit',
      id: registro.idLoginAudit,
      fecha: registro.fecha,
      gimnasioId: registro.gimnasioId,
      usuarioId: registro.usuarioId == null ? null : String(registro.usuarioId),
      modulo: 'auth',
      accion: registro.resultado,
      entidad: 'LoginAudit',
      entidadId: idString,
      tipoAccion: null,
      descripcion,
      ip: registro.ip,
      userAgent: registro.userAgent,
      valoresAntes: null,
      valoresDespues: null,
      resultado: registro.resultado,
      emailIntentado: registro.emailIntentado,
      motivo: null,
    };
  }

  private mapearRawAuditLogStream(
    fila: FilaAuditoriaRaw,
  ): RegistroAuditoriaReporte {
    return {
      kind: 'audit_log',
      id: Number(fila.auditoria_id_audit_log),
      fecha: this.mapearFecha(fila.auditoria_fecha),
      gimnasioId: this.mapearNumeroNullable(fila.auditoria_id_gimnasio),
      usuarioId:
        fila.auditoria_id_usuario == null
          ? null
          : String(fila.auditoria_id_usuario),
      modulo: String(fila.auditoria_modulo),
      accion: String(fila.auditoria_accion),
      entidad: String(fila.auditoria_entidad),
      entidadId:
        fila.auditoria_entidad_id == null
          ? null
          : String(fila.auditoria_entidad_id),
      tipoAccion:
        fila.auditoria_tipo_accion == null
          ? null
          : String(fila.auditoria_tipo_accion),
      descripcion:
        fila.auditoria_descripcion == null
          ? null
          : String(fila.auditoria_descripcion),
      ip: fila.auditoria_ip == null ? null : String(fila.auditoria_ip),
      userAgent:
        fila.auditoria_user_agent == null
          ? null
          : String(fila.auditoria_user_agent),
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
    ]
      .map((valor) => this.escaparCsv(String(valor)))
      .join(',');
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

    const texto = Buffer.isBuffer(valor)
      ? valor.toString('utf8')
      : String(valor);
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
