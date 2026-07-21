import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  EstadoObjetivo,
  ObjetivoEntity,
  TipoMetrica,
} from 'src/domain/entities/Objetivo/objetivo.entity';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { ObjetivoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/objetivo.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
import {
  SocioOrmEntity,
  NutricionistaOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import {
  FiltrosReporteEvolucionPacienteDto,
  ReporteEvolucionPacienteDto,
  TendenciaReporteEvolucion,
} from '../dtos/reporte-evolucion-paciente.dto';

const UMBRAL_SIN_CONTROL_DIAS = 30;

interface EstadisticasConsultasRaw {
  consultasRealizadas: string | number | null;
  primeraConsulta: Date | string | null;
  ultimaConsulta: Date | string | null;
}

@Injectable()
export class GetReporteEvolucionPacienteUseCase {
  constructor(
    @InjectRepository(MedicionOrmEntity)
    private readonly medicionRepository: Repository<MedicionOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepository: Repository<NutricionistaOrmEntity>,
    @InjectRepository(ObjetivoOrmEntity)
    private readonly objetivoRepository: Repository<ObjetivoOrmEntity>,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planAlimentacionRepository: Repository<PlanAlimentacionOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    nutricionistaId: number,
    socioId: number,
    filtros: FiltrosReporteEvolucionPacienteDto = {},
  ): Promise<ReporteEvolucionPacienteDto> {
    const gimnasioId = this.tenantContext.gimnasioId;
    if (!gimnasioId) {
      throw new BadRequestError('No se pudo resolver el gimnasio del usuario.');
    }

    this.validarPeriodo(filtros);

    const socio = await this.obtenerSocioDelGimnasio(socioId, gimnasioId);
    await this.validarNutricionistaDelGimnasio(nutricionistaId, gimnasioId);

    const [mediciones, estadisticasConsultas, objetivoPeso, planActivo] =
      await Promise.all([
        this.obtenerMediciones(nutricionistaId, socioId, gimnasioId, filtros),
        this.obtenerEstadisticasConsultas(
          nutricionistaId,
          socioId,
          gimnasioId,
          filtros,
        ),
        this.obtenerObjetivoPeso(socioId, gimnasioId),
        this.existePlanActivo(nutricionistaId, socioId, gimnasioId),
      ]);

    const primeraMedicion = mediciones[0] ?? null;
    const ultimaMedicion = mediciones[mediciones.length - 1] ?? null;
    const ultimaConsulta = this.aFecha(estadisticasConsultas.ultimaConsulta);
    const primeraConsulta = this.aFecha(estadisticasConsultas.primeraConsulta);
    const primeraInteraccion = this.obtenerFechaMasAntigua(
      primeraMedicion?.createdAt ?? null,
      primeraConsulta,
    );
    const diasDesdeUltimoControl = ultimaConsulta
      ? this.diasEntre(ultimaConsulta, new Date())
      : null;

    return {
      socio: {
        id: socio.idPersona ?? socioId,
        nombre: socio.nombre,
        apellido: socio.apellido,
      },
      periodo: {
        fechaInicio: filtros.fechaInicio
          ? this.formatearFecha(filtros.fechaInicio)
          : null,
        fechaFin: filtros.fechaFin
          ? this.formatearFecha(filtros.fechaFin)
          : null,
      },
      resumen: {
        totalMediciones: mediciones.length,
        pesoInicial: primeraMedicion ? Number(primeraMedicion.peso) : null,
        pesoActual: ultimaMedicion ? Number(ultimaMedicion.peso) : null,
        diferenciaPeso: this.calcularDiferencia(
          primeraMedicion?.peso ?? null,
          ultimaMedicion?.peso ?? null,
        ),
        tendenciaPeso:
          mediciones.length > 0
            ? this.calcularTendencia(
                mediciones.slice(-5).map((m) => Number(m.peso)),
              )
            : null,
        imcInicial: primeraMedicion ? Number(primeraMedicion.imc) : null,
        imcActual: ultimaMedicion ? Number(ultimaMedicion.imc) : null,
        diferenciaImc: this.calcularDiferencia(
          primeraMedicion?.imc ?? null,
          ultimaMedicion?.imc ?? null,
        ),
        consultasRealizadas: this.aNumero(
          estadisticasConsultas.consultasRealizadas,
        ),
        diasEnTratamiento: primeraInteraccion
          ? this.diasEntre(primeraInteraccion, new Date())
          : null,
        ultimaConsulta: ultimaConsulta ? ultimaConsulta.toISOString() : null,
        sinControles:
          diasDesdeUltimoControl === null ||
          diasDesdeUltimoControl > UMBRAL_SIN_CONTROL_DIAS,
        diasDesdeUltimoControl,
        umbralSinControlDias: UMBRAL_SIN_CONTROL_DIAS,
        planActivo,
        objetivoPeso: objetivoPeso
          ? {
              idObjetivo: objetivoPeso.idObjetivo,
              valorObjetivo: Number(objetivoPeso.valorObjetivo),
              progresoPorcentaje: this.calcularProgresoObjetivo(objetivoPeso),
              fechaObjetivo: objetivoPeso.fechaObjetivo
                ? objetivoPeso.fechaObjetivo.toISOString()
                : null,
            }
          : null,
      },
      grafico: {
        evolucion: mediciones.map((medicion) => ({
          fecha: medicion.createdAt.toISOString(),
          peso: Number(medicion.peso),
          imc: Number(medicion.imc),
          perimetroCintura: this.aNumeroOpcional(medicion.perimetroCintura),
          porcentajeGrasa: this.aNumeroOpcional(medicion.porcentajeGrasa),
          masaMagra: this.aNumeroOpcional(medicion.masaMagra),
        })),
      },
    };
  }

  private async obtenerSocioDelGimnasio(
    socioId: number,
    gimnasioId: number,
  ): Promise<SocioOrmEntity> {
    const socio = await this.socioRepository.findOne({
      where: { idPersona: socioId, gimnasioId },
    });

    if (!socio) {
      throw new NotFoundError('Socio no encontrado');
    }

    return socio;
  }

  private async validarNutricionistaDelGimnasio(
    nutricionistaId: number,
    gimnasioId: number,
  ): Promise<void> {
    const nutricionista = await this.nutricionistaRepository.findOne({
      where: { idPersona: nutricionistaId, gimnasioId },
      select: { idPersona: true },
    });

    if (!nutricionista) {
      throw new NotFoundError('Nutricionista no encontrado');
    }
  }

  private obtenerMediciones(
    nutricionistaId: number,
    socioId: number,
    gimnasioId: number,
    filtros: FiltrosReporteEvolucionPacienteDto,
  ): Promise<MedicionOrmEntity[]> {
    const queryBuilder = this.medicionRepository
      .createQueryBuilder('medicion')
      .innerJoin('medicion.turno', 'turno')
      .innerJoin('turno.socio', 'socio')
      .innerJoin('turno.nutricionista', 'nutricionista')
      .where('socio.idPersona = :socioId', { socioId })
      .andWhere('nutricionista.idPersona = :nutricionistaId', {
        nutricionistaId,
      })
      .andWhere('turno.id_gimnasio = :gimnasioId', { gimnasioId })
      .andWhere('turno.estadoTurno = :estadoRealizado', {
        estadoRealizado: EstadoTurno.REALIZADO,
      })
      .orderBy('medicion.createdAt', 'ASC');

    this.aplicarPeriodoTurno(queryBuilder, filtros);

    return queryBuilder.getMany();
  }

  private obtenerEstadisticasConsultas(
    nutricionistaId: number,
    socioId: number,
    gimnasioId: number,
    filtros: FiltrosReporteEvolucionPacienteDto,
  ): Promise<EstadisticasConsultasRaw> {
    const queryBuilder = this.turnoRepository
      .createQueryBuilder('turno')
      .innerJoin('turno.socio', 'socio')
      .innerJoin('turno.nutricionista', 'nutricionista')
      .select('COUNT(turno.idTurno)', 'consultasRealizadas')
      .addSelect('MIN(turno.fechaTurno)', 'primeraConsulta')
      .addSelect(
        'MAX(COALESCE(turno.consultaFinalizadaAt, turno.fechaTurno))',
        'ultimaConsulta',
      )
      .where('socio.idPersona = :socioId', { socioId })
      .andWhere('nutricionista.idPersona = :nutricionistaId', {
        nutricionistaId,
      })
      .andWhere('turno.id_gimnasio = :gimnasioId', { gimnasioId })
      .andWhere('turno.estadoTurno = :estadoRealizado', {
        estadoRealizado: EstadoTurno.REALIZADO,
      });

    this.aplicarPeriodoTurno(queryBuilder, filtros);

    return queryBuilder.getRawOne<EstadisticasConsultasRaw>().then(
      (fila) =>
        fila ?? {
          consultasRealizadas: 0,
          primeraConsulta: null,
          ultimaConsulta: null,
        },
    );
  }

  private async obtenerObjetivoPeso(
    socioId: number,
    gimnasioId: number,
  ): Promise<ObjetivoOrmEntity | null> {
    return this.objetivoRepository
      .createQueryBuilder('objetivo')
      .innerJoin('objetivo.socio', 'socio')
      .where('objetivo.socioId = :socioId', { socioId })
      .andWhere('socio.gimnasioId = :gimnasioId', { gimnasioId })
      .andWhere('objetivo.tipoMetrica = :tipoMetrica', {
        tipoMetrica: 'PESO' satisfies TipoMetrica,
      })
      .andWhere('objetivo.estado = :estado', {
        estado: 'ACTIVO' satisfies EstadoObjetivo,
      })
      .orderBy('objetivo.fechaInicio', 'DESC')
      .getOne();
  }

  private async existePlanActivo(
    nutricionistaId: number,
    socioId: number,
    gimnasioId: number,
  ): Promise<boolean> {
    const cantidad = await this.planAlimentacionRepository
      .createQueryBuilder('plan')
      .innerJoin('plan.socio', 'socio')
      .innerJoin('plan.nutricionista', 'nutricionista')
      .where('socio.idPersona = :socioId', { socioId })
      .andWhere('nutricionista.idPersona = :nutricionistaId', {
        nutricionistaId,
      })
      .andWhere('socio.gimnasioId = :gimnasioId', { gimnasioId })
      .andWhere('nutricionista.gimnasioId = :gimnasioId', { gimnasioId })
      .andWhere('plan.activo = :activo', { activo: true })
      .andWhere('plan.estado = :estado', { estado: 'ACTIVO' })
      .getCount();

    return cantidad > 0;
  }

  private aplicarPeriodoTurno(
    queryBuilder: SelectQueryBuilder<MedicionOrmEntity | TurnoOrmEntity>,
    filtros: FiltrosReporteEvolucionPacienteDto,
  ): void {
    if (filtros.fechaInicio) {
      queryBuilder.andWhere('turno.fechaTurno >= :fechaInicio', {
        fechaInicio: filtros.fechaInicio,
      });
    }

    if (filtros.fechaFin) {
      queryBuilder.andWhere('turno.fechaTurno <= :fechaFin', {
        fechaFin: filtros.fechaFin,
      });
    }
  }

  private validarPeriodo(filtros: FiltrosReporteEvolucionPacienteDto): void {
    if (filtros.fechaInicio && Number.isNaN(filtros.fechaInicio.getTime())) {
      throw new BadRequestError('La fecha de inicio es inválida.');
    }

    if (filtros.fechaFin && Number.isNaN(filtros.fechaFin.getTime())) {
      throw new BadRequestError('La fecha de fin es inválida.');
    }

    if (
      filtros.fechaInicio &&
      filtros.fechaFin &&
      filtros.fechaInicio > filtros.fechaFin
    ) {
      throw new BadRequestError(
        'La fecha de inicio no puede ser posterior a la fecha de fin.',
      );
    }
  }

  private calcularDiferencia(
    valorInicial: number | string | null,
    valorActual: number | string | null,
  ): number | null {
    if (valorInicial === null || valorActual === null) {
      return null;
    }

    return Number((Number(valorActual) - Number(valorInicial)).toFixed(2));
  }

  private calcularTendencia(valores: number[]): TendenciaReporteEvolucion {
    if (valores.length < 2) return 'estable';

    const cantidad = valores.length;
    const sumaX = (cantidad * (cantidad - 1)) / 2;
    const sumaY = valores.reduce((acumulado, valor) => acumulado + valor, 0);
    const sumaXY = valores.reduce(
      (acumulado, valor, indice) => acumulado + indice * valor,
      0,
    );
    const sumaX2 = (cantidad * (cantidad - 1) * (2 * cantidad - 1)) / 6;
    const pendiente =
      (cantidad * sumaXY - sumaX * sumaY) / (cantidad * sumaX2 - sumaX * sumaX);

    if (Math.abs(pendiente) < 0.1) return 'estable';
    return pendiente > 0 ? 'subiendo' : 'bajando';
  }

  private calcularProgresoObjetivo(objetivo: ObjetivoOrmEntity): number {
    return new ObjetivoEntity(
      objetivo.idObjetivo,
      objetivo.socioId,
      objetivo.tipoMetrica,
      Number(objetivo.valorInicial),
      Number(objetivo.valorObjetivo),
      Number(objetivo.valorActual),
      objetivo.estado,
      objetivo.fechaInicio,
      objetivo.fechaObjetivo,
      objetivo.createdAt,
      objetivo.updatedAt,
    ).calcularProgreso();
  }

  private obtenerFechaMasAntigua(
    fechaA: Date | null,
    fechaB: Date | null,
  ): Date | null {
    if (!fechaA) return fechaB;
    if (!fechaB) return fechaA;
    return fechaA <= fechaB ? fechaA : fechaB;
  }

  private diasEntre(fechaInicio: Date, fechaFin: Date): number {
    const milisegundosPorDia = 1000 * 60 * 60 * 24;
    return Math.floor(
      (fechaFin.getTime() - fechaInicio.getTime()) / milisegundosPorDia,
    );
  }

  private aFecha(valor: Date | string | null): Date | null {
    if (!valor) return null;
    const fecha = valor instanceof Date ? valor : new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  private aNumero(valor: string | number | null): number {
    return Number(valor) || 0;
  }

  private aNumeroOpcional(valor: string | number | null): number | null {
    if (valor === null) return null;
    return Number(valor);
  }

  private formatearFecha(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
  }
}
