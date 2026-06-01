import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestError,
  ConflictError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  AlimentoOrmEntity,
  DiaPlanOrmEntity,
  ItemComidaOrmEntity,
  NutricionistaOrmEntity,
  OpcionComidaOrmEntity,
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { RestriccionesValidator } from 'src/application/restricciones/restricciones-validator.service';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { MapearIngredientesIAUseCase } from './mapear-ingredientes-ia.use-case';
import {
  AplicarDraftPlanSemanalDto,
  AplicarDraftPlanSemanalResponseDto,
} from '../dto/aplicar-draft-plan.dto';
import {
  MapeoIngredienteExacto,
  MapeoIngredienteConflicto,
} from '../dto/mapeo-ingredientes.dto';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { formatearIncidenciasRestriccion } from 'src/application/restricciones/restricciones-validator.service';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

/**
 * Caso de uso para aplicar un borrador IA como plan de alimentacion real persistido.
 *
 * Task 4: aplicar borrador IA al plan real persistido
 *
 * Flujo:
 * 1. Validar estructura del borrador (5 comidas por dia, 7 dias)
 * 2. Recolectar todos los ingredientes unicos del borrador
 * 3. Llamar a MapearIngredientesIAUseCase (Task 3) para verificar mapeo al catalogo
 * 4. Si hay conflictos -> RECHAZAR con BadRequestError y detalles
 * 5. Si todo OK -> persistir usando la misma infraestructura que CrearPlanAlimentacionUseCase
 * 6. Crear notificacion al socio
 *
 * Principios:
 * - Conflictos de mapeo = rechazo automatico (no fuzzy, no suposiciones)
 * - Reutilizar validacion de restricciones (RestriccionesValidator)
 * - Trazabilidad: marcar el objetivo como generado por IA
 */
@Injectable()
export class AplicarDraftPlanSemanalUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(DiaPlanOrmEntity)
    private readonly diaRepo: Repository<DiaPlanOrmEntity>,
    @InjectRepository(OpcionComidaOrmEntity)
    private readonly opcionRepo: Repository<OpcionComidaOrmEntity>,
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepo: Repository<SocioOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepo: Repository<NutricionistaOrmEntity>,
    private readonly mapperUseCase: MapearIngredientesIAUseCase,
    private readonly restriccionesValidator: RestriccionesValidator,
    private readonly notificacionesService: NotificacionesService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  /**
   * Ejecuta la aplicacion de un borrador IA como plan real.
   *
   * @param nutricionistaUserId - ID del usuario nutricionista que aplica
   * @param dto - Datos del borrador IA validado
   * @returns PlanAlimentacionResponseDto con el plan persistido
   * @throws BadRequestError si hay conflictos de mapeo o estructura invalida
   */
  async execute(
    nutricionistaUserId: number,
    dto: AplicarDraftPlanSemanalDto,
  ): Promise<AplicarDraftPlanSemanalResponseDto> {
    this.logger.log(
      `Aplicando borrador IA de plan semanal para socio ${dto.socioId} por nutricionista ${nutricionistaUserId}`,
    );

    // Paso 1: Validar estructura del borrador (5 comidas por dia, minimo 1 dia)
    this.validarEstructura(dto);

    // Paso 2: Recolectar todos los ingredientes unicos
    const ingredientes = this.recolectarIngredientes(dto);

    // Paso 3: Verificar mapeo al catalogo (Task 3)
    const resultadoMapeo = await this.mapperUseCase.execute({ ingredientes });

    // Paso 4: Si hay conflictos -> rechazar
    if (resultadoMapeo.tieneConflictos) {
      const mensaje = this.formatearMensajeRechazo(resultadoMapeo.conflictos);
      this.logger.error(
        `Rechazando aplicacion de draft por conflictos de mapeo: ${mensaje}`,
      );
      throw new BadRequestError(mensaje);
    }

    // Paso 5: Obtener entidades necesarias
    const [socio, nutricionista] = await Promise.all([
      this.socioRepo.findOne({ where: { idPersona: dto.socioId } }),
      this.nutricionistaRepo.findOne({
        where: { idPersona: nutricionistaUserId },
      }),
    ]);

    if (!socio) {
      throw new BadRequestError(`Socio ${dto.socioId} no encontrado`);
    }
    if (!nutricionista) {
      throw new BadRequestError(
        `Nutricionista ${nutricionistaUserId} no encontrado`,
      );
    }

    // Validar plan activo unico por socio (misma logica que CrearPlanAlimentacionUseCase)
    const planActivoExistente = await this.planRepo.findOne({
      where: {
        socio: { idPersona: dto.socioId },
        activo: true,
      },
    });
    if (planActivoExistente) {
      throw new ConflictError(
        'El socio ya cuenta con un plan de alimentación activo. Debe eliminarlo antes de crear uno nuevo.',
      );
    }

    // Paso 6: Cargar alimentos completos del catalogo usando los IDs del mapeo
    const mapeosExitosos = resultadoMapeo.mapeos.filter(
      (m): m is MapeoIngredienteExacto => m.tipo === 'exacto',
    );
    const alimentoIds = [
      ...new Set(mapeosExitosos.map((m) => m.alimento.idAlimento)),
    ];
    const alimentosFull = await this.alimentoRepo.findByIds(alimentoIds);

    // Mapa de busqueda rapida por nombre normalizado (reutilizado en validacion y creacion)
    const alimentoPorNombreNormalizado = new Map<string, AlimentoOrmEntity>();
    for (const alimento of alimentosFull) {
      alimentoPorNombreNormalizado.set(
        this.normalizarNombre(alimento.nombre),
        alimento,
      );
    }

    // Paso 7: Validar restricciones alimentarias
    const incidencias = await this.restriccionesValidator.generarIncidencias(
      this.construirIncidenciasParaValidar(dto, alimentoPorNombreNormalizado),
      dto.socioId,
    );

    if (incidencias.length > 0) {
      throw new BadRequestError(formatearIncidenciasRestriccion(incidencias));
    }

    // Paso 8: Persistir el plan
    const plan = await this.crearPlan(
      dto,
      socio,
      nutricionista,
      alimentoPorNombreNormalizado,
    );

    // Paso 9: Crear notificacion al socio
    if (socio.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: socio.idPersona,
        tipo: TipoNotificacion.PLAN_CREADO,
        titulo: 'Plan de alimentación creado',
        mensaje: 'Tu nutricionista aplicó un plan alimentario generado por IA.',
        metadata: { planId: plan.idPlanAlimentacion },
      });
    }

    this.logger.log(
      `Draft IA aplicado exitosamente. Plan ${plan.idPlanAlimentacion} creado para socio ${dto.socioId}`,
    );

    return {
      planId: plan.idPlanAlimentacion,
      socioId: dto.socioId,
      objetivoNutricional: dto.objetivoNutricional,
      diasCreados: dto.dias.length,
      disclaimer:
        'Esta recomendación es orientación general y no sustituye consejo médico profesional. Consulte siempre con su nutricionista.',
    };
  }

  /**
   * Valida que el borrador tenga estructura valida (5 comidas por dia, minimo 1 dia).
   */
  private validarEstructura(dto: AplicarDraftPlanSemanalDto): void {
    if (!dto.dias || dto.dias.length === 0) {
      throw new BadRequestError(
        'El plan debe tener al menos un día configurado.',
      );
    }

    const COMIDAS_POR_DIA = 5;
    const TIPOS_REQUERIDOS = [
      'DESAYUNO',
      'ALMUERZO',
      'MERIENDA',
      'CENA',
      'COLACION',
    ];

    for (const dia of dto.dias) {
      if (!dia.comidas || dia.comidas.length !== COMIDAS_POR_DIA) {
        throw new BadRequestError(
          `El día ${dia.dia} debe tener exactamente ${COMIDAS_POR_DIA} comidas. Tiene ${dia.comidas?.length ?? 0}.`,
        );
      }

      const tiposPresentes = new Set(
        dia.comidas.map((c) => c.tipoComida as string),
      );
      for (const tipo of TIPOS_REQUERIDOS) {
        if (!tiposPresentes.has(tipo)) {
          throw new BadRequestError(
            `El día ${dia.dia} no incluye la comida obligatoria ${tipo}.`,
          );
        }
      }
    }
  }

  /**
   * Recolecta todos los ingredientes unicos de todas las comidas del borrador.
   */
  private recolectarIngredientes(dto: AplicarDraftPlanSemanalDto): string[] {
    const ingredientes = new Set<string>();
    for (const dia of dto.dias) {
      for (const comida of dia.comidas) {
        for (const ingrediente of comida.ingredientes) {
          if (ingrediente && ingrediente.trim().length > 0) {
            ingredientes.add(ingrediente.trim());
          }
        }
      }
    }
    return Array.from(ingredientes);
  }

  /**
   * Construye la lista de incidencias para validacion de restricciones.
   */
  private construirIncidenciasParaValidar(
    dto: AplicarDraftPlanSemanalDto,
    alimentoPorNombreNormalizado: Map<string, AlimentoOrmEntity>,
  ): Array<{
    dia: string;
    comida: string;
    item: string;
    alimentoId: number;
    alimentoNombre: string;
  }> {
    const incidencias: Array<{
      dia: string;
      comida: string;
      item: string;
      alimentoId: number;
      alimentoNombre: string;
    }> = [];

    for (const dia of dto.dias) {
      for (const comida of dia.comidas) {
        for (let idx = 0; idx < comida.ingredientes.length; idx++) {
          const ingrediente = comida.ingredientes[idx].trim();
          const normalizado = this.normalizarNombre(ingrediente);
          // Buscar alimento usando el mapa pre-built (O(1) vs escaneo lineal)
          const alimento = alimentoPorNombreNormalizado.get(normalizado);

          if (alimento) {
            incidencias.push({
              dia: String(dia.dia),
              comida: comida.tipoComida,
              item: `${comida.tipoComida}.${idx + 1}`,
              alimentoId: alimento.idAlimento,
              alimentoNombre: alimento.nombre,
            });
          }
        }
      }
    }

    return incidencias;
  }

  /**
   * Persiste el plan en la base de datos.
   * Usa alimentoMapFull (pre-cargado con entidades completas) para resolvedores de items.
   */
  private async crearPlan(
    dto: AplicarDraftPlanSemanalDto,
    socio: SocioOrmEntity,
    nutricionista: NutricionistaOrmEntity,
    alimentoPorNombreNormalizado: Map<string, AlimentoOrmEntity>,
  ): Promise<PlanAlimentacionOrmEntity> {
    // Crear plan
    const plan = new PlanAlimentacionOrmEntity();
    plan.fechaCreacion = new Date();
    plan.objetivoNutricional = `[IA] ${dto.objetivoNutricional}`;
    plan.socio = socio as unknown as PlanAlimentacionOrmEntity['socio'];
    plan.nutricionista =
      nutricionista as unknown as PlanAlimentacionOrmEntity['nutricionista'];
    plan.activo = true;
    plan.eliminadoEn = null;
    plan.motivoEliminacion = null;
    plan.motivoEdicion = null;
    plan.ultimaEdicion = null;
    plan.dias = [];

    const planGuardado = await this.planRepo.save(plan);

    // Crear dias y opciones de comida
    for (let orden = 0; orden < dto.dias.length; orden++) {
      const diaDto = dto.dias[orden];
      const dia = new DiaPlanOrmEntity();
      dia.dia = this.obtenerDiaSemana(diaDto.dia);
      dia.orden = orden + 1;
      dia.planAlimentacion = planGuardado;
      dia.opcionesComida = [];

      const diaGuardado = await this.diaRepo.save(dia);

      // Crear opciones de comida para cada comida del dia
      for (const comidaDto of diaDto.comidas) {
        const opcion = new OpcionComidaOrmEntity();
        opcion.tipoComida = comidaDto.tipoComida as TipoComida;
        opcion.comentarios = null;
        opcion.diaPlan = diaGuardado;
        opcion.items = [];

        // Crear items para cada ingrediente de la comida
        for (const ingredienteStr of comidaDto.ingredientes) {
          const normalizado = this.normalizarNombre(ingredienteStr.trim());

          // Buscar alimento usando el mapa pre-built (O(1) vs escaneo lineal)
          const alimentoMatch = alimentoPorNombreNormalizado.get(normalizado);

          if (alimentoMatch) {
            const item = new ItemComidaOrmEntity();
            item.alimentoId = alimentoMatch.idAlimento;
            item.alimentoNombre = alimentoMatch.nombre;
            // TODO(Task 4B): Permitir que el nutricionista especifique cantidades por ingrediente.
            // Por ahora se usa 100g como default temporal para permitir que el plan sea persistido.
            item.cantidad = 100;
            item.unidad = alimentoMatch.unidadMedida;
            item.notas = null;
            item.calorias = alimentoMatch.calorias;
            item.proteinas = alimentoMatch.proteinas;
            item.carbohidratos = alimentoMatch.carbohidratos;
            item.grasas = alimentoMatch.grasas;
            item.alimento = alimentoMatch;
            item.opcionComida = opcion;
            opcion.items.push(item);
          }
        }

        await this.opcionRepo.save(opcion);
      }
    }

    // Recargar plan completo
    const planCompleto = await this.planRepo.findOne({
      where: { idPlanAlimentacion: planGuardado.idPlanAlimentacion },
      relations: {
        dias: { opcionesComida: { items: { alimento: true } } },
        socio: true,
        nutricionista: true,
      },
    });

    return planCompleto!;
  }

  /**
   * Normaliza un nombre de alimento para busqueda.
   */
  private normalizarNombre(nombre: string): string {
    return nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  /**
   * Obtiene el DiaSemana correspondiente al numero de dia (1=Lunes, 7=Domingo).
   * @throws BadRequestError si el dia es invalido (fuera del rango 1-7)
   */
  private obtenerDiaSemana(dia: number): DiaSemana {
    if (dia < 1 || dia > 7 || !Number.isInteger(dia)) {
      throw new BadRequestError(
        `Día inválido: ${dia}. Debe ser un número entre 1 (Lunes) y 7 (Domingo).`,
      );
    }
    const dias: DiaSemana[] = [
      DiaSemana.LUNES,
      DiaSemana.MARTES,
      DiaSemana.MIERCOLES,
      DiaSemana.JUEVES,
      DiaSemana.VIERNES,
      DiaSemana.SABADO,
      DiaSemana.DOMINGO,
    ];
    return dias[dia - 1];
  }

  /**
   * Formatea el mensaje de rechazo por conflictos de mapeo.
   */
  private formatearMensajeRechazo(
    conflictos: MapeoIngredienteConflicto[],
  ): string {
    const lineas = [
      'No se puede aplicar el borrador de plan semanal. Conflictos de mapeo de ingredientes:',
    ];

    for (const conflicto of conflictos) {
      lineas.push(`- "${conflicto.ingredienteOriginal}": ${conflicto.mensaje}`);
    }

    lineas.push('');
    lineas.push(
      'El profesional debe resolver estos conflictos manualmente antes de aplicar el plan.',
    );

    return lineas.join('\n');
  }
}
