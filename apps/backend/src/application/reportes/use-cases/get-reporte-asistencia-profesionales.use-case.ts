import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import {
  AsistenciaPorNutricionistaDto,
  FiltrosReporteAsistenciaProfesionalesDto,
  PuntoMensualAsistenciaDto,
  ReporteAsistenciaProfesionalesDto,
  ResumenReporteAsistenciaDto,
} from '../dtos/reporte-asistencia-profesionales.dto';

interface FilaAsistenciaNutricionistaRaw {
  nutricionistaId: string | number;
  nombreNutricionista: string;
  turnosProgramados: string | number;
  turnosRealizados: string | number;
  turnosCancelados: string | number;
  ausencias: string | number;
}

interface FilaAsistenciaMensualRaw {
  mes: string;
  programados: string | number;
  realizados: string | number;
  cancelados: string | number;
  ausencias: string | number;
}

@Injectable()
export class GetReporteAsistenciaProfesionalesUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    filtros: FiltrosReporteAsistenciaProfesionalesDto,
  ): Promise<ReporteAsistenciaProfesionalesDto> {
    const gimnasioId = this.tenantContext.gimnasioId;
    if (!gimnasioId) {
      throw new BadRequestError('No se pudo resolver el gimnasio del usuario.');
    }

    this.validarFiltros(filtros);

    const filasPorNutricionista = await this.crearQueryBase(filtros, gimnasioId)
      .select('nutricionista.idPersona', 'nutricionistaId')
      .addSelect(
        "CONCAT(nutricionista.nombre, ' ', nutricionista.apellido)",
        'nombreNutricionista',
      )
      .addSelect('COUNT(turno.idTurno)', 'turnosProgramados')
      .addSelect(
        'SUM(CASE WHEN turno.estadoTurno = :realizado THEN 1 ELSE 0 END)',
        'turnosRealizados',
      )
      .addSelect(
        'SUM(CASE WHEN turno.estadoTurno = :cancelado THEN 1 ELSE 0 END)',
        'turnosCancelados',
      )
      .addSelect(
        'SUM(CASE WHEN turno.estadoTurno = :ausente THEN 1 ELSE 0 END)',
        'ausencias',
      )
      .groupBy('nutricionista.idPersona')
      .addGroupBy("CONCAT(nutricionista.nombre, ' ', nutricionista.apellido)")
      .orderBy('nutricionista.apellido', 'ASC')
      .addOrderBy('nutricionista.nombre', 'ASC')
      .getRawMany<FilaAsistenciaNutricionistaRaw>();

    const filasMensuales = await this.crearQueryBase(filtros, gimnasioId)
      .select("DATE_FORMAT(turno.fechaTurno, '%Y-%m')", 'mes')
      .addSelect('COUNT(turno.idTurno)', 'programados')
      .addSelect(
        'SUM(CASE WHEN turno.estadoTurno = :realizado THEN 1 ELSE 0 END)',
        'realizados',
      )
      .addSelect(
        'SUM(CASE WHEN turno.estadoTurno = :cancelado THEN 1 ELSE 0 END)',
        'cancelados',
      )
      .addSelect(
        'SUM(CASE WHEN turno.estadoTurno = :ausente THEN 1 ELSE 0 END)',
        'ausencias',
      )
      .groupBy("DATE_FORMAT(turno.fechaTurno, '%Y-%m')")
      .orderBy('mes', 'ASC')
      .getRawMany<FilaAsistenciaMensualRaw>();

    const porNutricionista = filasPorNutricionista.map((fila) =>
      this.mapearFilaNutricionista(fila),
    );
    const resumen = this.calcularResumen(porNutricionista);

    return {
      periodo: {
        fechaInicio: this.formatearFecha(filtros.fechaInicio),
        fechaFin: this.formatearFecha(filtros.fechaFin),
      },
      resumen,
      porNutricionista,
      grafico: {
        evolucionMensual: this.completarMeses(filtros, filasMensuales),
      },
    };
  }

  private crearQueryBase(
    filtros: FiltrosReporteAsistenciaProfesionalesDto,
    gimnasioId: number,
  ): SelectQueryBuilder<TurnoOrmEntity> {
    const queryBuilder = this.turnoRepository
      .createQueryBuilder('turno')
      .innerJoin('turno.nutricionista', 'nutricionista')
      .leftJoin('turno.socio', 'socio')
      .where('turno.fechaTurno >= :fechaInicio', {
        fechaInicio: filtros.fechaInicio,
      })
      .andWhere('turno.fechaTurno <= :fechaFin', { fechaFin: filtros.fechaFin })
      .andWhere('turno.id_gimnasio = :gimnasioId', { gimnasioId })
      .setParameters({
        realizado: EstadoTurno.REALIZADO,
        cancelado: EstadoTurno.CANCELADO,
        ausente: EstadoTurno.AUSENTE,
      });

    if (filtros.profesionalId !== undefined) {
      queryBuilder.andWhere('nutricionista.idPersona = :profesionalId', {
        profesionalId: filtros.profesionalId,
      });
    }

    if (filtros.socioId !== undefined) {
      queryBuilder.andWhere('socio.idPersona = :socioId', {
        socioId: filtros.socioId,
      });
    }

    if (filtros.estado !== undefined) {
      queryBuilder.andWhere('turno.estadoTurno = :estado', {
        estado: filtros.estado,
      });
    }

    return queryBuilder;
  }

  private validarFiltros(
    filtros: FiltrosReporteAsistenciaProfesionalesDto,
  ): void {
    if (Number.isNaN(filtros.fechaInicio.getTime())) {
      throw new BadRequestError('La fecha de inicio es inválida.');
    }

    if (Number.isNaN(filtros.fechaFin.getTime())) {
      throw new BadRequestError('La fecha de fin es inválida.');
    }

    if (filtros.fechaInicio > filtros.fechaFin) {
      throw new BadRequestError(
        'La fecha de inicio no puede ser posterior a la fecha de fin.',
      );
    }
  }

  private mapearFilaNutricionista(
    fila: FilaAsistenciaNutricionistaRaw,
  ): AsistenciaPorNutricionistaDto {
    const turnosProgramados = this.aNumero(fila.turnosProgramados);
    const turnosRealizados = this.aNumero(fila.turnosRealizados);
    const turnosCancelados = this.aNumero(fila.turnosCancelados);
    const ausencias = this.aNumero(fila.ausencias);
    const porcentajes = this.calcularPorcentajes(turnosRealizados, ausencias);

    return {
      nutricionistaId: this.aNumero(fila.nutricionistaId),
      nombreNutricionista: fila.nombreNutricionista,
      turnosProgramados,
      turnosRealizados,
      turnosCancelados,
      ausencias,
      porcentajeAsistencia: porcentajes.porcentajeAsistencia,
      porcentajeAusentismo: porcentajes.porcentajeAusentismo,
    };
  }

  private calcularResumen(
    filas: AsistenciaPorNutricionistaDto[],
  ): ResumenReporteAsistenciaDto {
    const base = filas.reduce(
      (acumulado, fila) => ({
        turnosProgramados: acumulado.turnosProgramados + fila.turnosProgramados,
        turnosRealizados: acumulado.turnosRealizados + fila.turnosRealizados,
        turnosCancelados: acumulado.turnosCancelados + fila.turnosCancelados,
        ausencias: acumulado.ausencias + fila.ausencias,
      }),
      {
        turnosProgramados: 0,
        turnosRealizados: 0,
        turnosCancelados: 0,
        ausencias: 0,
      },
    );
    const porcentajes = this.calcularPorcentajes(
      base.turnosRealizados,
      base.ausencias,
    );

    return { ...base, ...porcentajes };
  }

  private completarMeses(
    filtros: FiltrosReporteAsistenciaProfesionalesDto,
    filas: FilaAsistenciaMensualRaw[],
  ): PuntoMensualAsistenciaDto[] {
    const porMes = new Map(
      filas.map((fila) => [
        fila.mes,
        {
          mes: fila.mes,
          programados: this.aNumero(fila.programados),
          realizados: this.aNumero(fila.realizados),
          cancelados: this.aNumero(fila.cancelados),
          ausencias: this.aNumero(fila.ausencias),
        },
      ]),
    );

    const meses: PuntoMensualAsistenciaDto[] = [];
    const cursor = new Date(
      filtros.fechaInicio.getFullYear(),
      filtros.fechaInicio.getMonth(),
      1,
    );
    const fin = new Date(
      filtros.fechaFin.getFullYear(),
      filtros.fechaFin.getMonth(),
      1,
    );

    while (cursor <= fin) {
      const mes = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      meses.push(
        porMes.get(mes) ?? {
          mes,
          programados: 0,
          realizados: 0,
          cancelados: 0,
          ausencias: 0,
        },
      );
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return meses;
  }

  private calcularPorcentajes(
    turnosRealizados: number,
    ausencias: number,
  ): Pick<
    ResumenReporteAsistenciaDto,
    'porcentajeAsistencia' | 'porcentajeAusentismo'
  > {
    const turnosConResultado = turnosRealizados + ausencias;
    if (turnosConResultado === 0) {
      return { porcentajeAsistencia: 0, porcentajeAusentismo: 0 };
    }

    return {
      porcentajeAsistencia: this.redondearPorcentaje(
        (turnosRealizados / turnosConResultado) * 100,
      ),
      porcentajeAusentismo: this.redondearPorcentaje(
        (ausencias / turnosConResultado) * 100,
      ),
    };
  }

  private redondearPorcentaje(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  private aNumero(valor: string | number | null): number {
    return Number(valor) || 0;
  }

  private formatearFecha(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
  }
}
