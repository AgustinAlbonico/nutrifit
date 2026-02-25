import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  AI_PROVIDER_SERVICE,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import { PrepararContextoPacienteUseCase } from './preparar-contexto-paciente.use-case';
import {
  ContextoPaciente,
  DiaPlanSemanal,
  PlanSemanalIA,
  RecomendacionComida,
  RespuestaIA,
  SolicitudPlanSemanal,
  TipoComida,
} from '@nutrifit/shared';
import { DISCLAIMER_IA } from './generar-recomendacion-comida.use-case';

const CALORIAS_MINIMAS_DIARIAS = 1200;
const CALORIAS_MAXIMAS_DIARIAS = 3000;
const TIPOS_COMIDA_REQUERIDOS: TipoComida[] = [
  'DESAYUNO',
  'ALMUERZO',
  'MERIENDA',
  'CENA',
  'COLACION',
];

@Injectable()
export class GenerarPlanSemanalUseCase implements BaseUseCase {
  constructor(
    @Inject(AI_PROVIDER_SERVICE)
    private readonly aiProvider: IAiProviderService,
    private readonly prepararContextoPaciente: PrepararContextoPacienteUseCase,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    solicitud: SolicitudPlanSemanal,
  ): Promise<RespuestaIA<PlanSemanalIA>> {
    try {
      const contexto = await this.prepararContextoPaciente.execute(
        solicitud.socioId,
      );

      const caloriasObjetivo = this.calcularCaloriasObjetivo(
        contexto,
        solicitud.caloriasObjetivo,
      );

      const diasAGenerar = Math.min(solicitud.diasAGenerar ?? 7, 7);

      const prompt = this.construirPrompt(
        contexto,
        caloriasObjetivo,
        diasAGenerar,
      );

      const schema = {
        dias: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dia: { type: 'number' },
              comidas: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    nombre: { type: 'string' },
                    descripcion: { type: 'string' },
                    ingredientes: { type: 'array', items: { type: 'string' } },
                    caloriasEstimadas: { type: 'number' },
                    proteinas: { type: 'number' },
                    carbohidratos: { type: 'number' },
                    grasas: { type: 'number' },
                    tipoComida: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        caloriasTotalesDiarias: { type: 'number' },
        disclaimer: { type: 'string' },
      };

      const resultado =
        await this.aiProvider.generarRecomendacion<PlanSemanalIA>(
          prompt,
          schema,
        );

      const resultadoCompleto = this.completarEstructuraPlanSemanal(
        resultado,
        diasAGenerar,
      );

      this.validarPlanSemanal(resultadoCompleto, contexto, diasAGenerar);

      resultadoCompleto.disclaimer = DISCLAIMER_IA;

      this.logger.log(
        `Plan semanal generado para socio ${solicitud.socioId}. ${diasAGenerar} días, ${caloriasObjetivo} kcal/día`,
      );

      return {
        exito: true,
        datos: resultadoCompleto,
        error: null,
        disclaimer: DISCLAIMER_IA,
      };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error generando plan semanal: ${mensaje}`);

      return {
        exito: false,
        datos: null,
        error: mensaje,
        disclaimer: DISCLAIMER_IA,
      };
    }
  }

  private calcularCaloriasObjetivo(
    contexto: ContextoPaciente,
    caloriasSugeridas?: number,
  ): number {
    if (caloriasSugeridas) {
      return Math.max(
        CALORIAS_MINIMAS_DIARIAS,
        Math.min(CALORIAS_MAXIMAS_DIARIAS, caloriasSugeridas),
      );
    }

    if (contexto.peso && contexto.altura) {
      const tmb =
        10 * contexto.peso + 6.25 * contexto.altura * 100 - 5 * 30 + 5;
      const factorActividad = this.obtenerFactorActividad(
        contexto.nivelActividadFisica,
      );
      const caloriasEstimadas = Math.round(tmb * factorActividad);

      return Math.max(
        CALORIAS_MINIMAS_DIARIAS,
        Math.min(CALORIAS_MAXIMAS_DIARIAS, caloriasEstimadas),
      );
    }

    return 2000;
  }

  private obtenerFactorActividad(nivel: string): number {
    switch (nivel) {
      case 'SEDENTARIO':
        return 1.2;
      case 'BAJO':
        return 1.375;
      case 'MODERADO':
        return 1.55;
      case 'ALTO':
        return 1.725;
      default:
        return 1.2;
    }
  }

  private construirPrompt(
    contexto: ContextoPaciente,
    caloriasObjetivo: number,
    diasAGenerar: number,
  ): string {
    return `Eres un nutricionista profesional. Genera un plan alimenticio semanal para un paciente.

CONTEXTO DEL PACIENTE (anonimizado):
- Objetivo: ${contexto.objetivoPersonal}
- Nivel de actividad física: ${contexto.nivelActividadFisica}
- Peso: ${contexto.peso ?? 'No especificado'} kg
- Altura: ${contexto.altura ?? 'No especificado'} cm
- Alergias: ${contexto.alergias.length > 0 ? contexto.alergias.join(', ') : 'Ninguna'}
- Patologías: ${contexto.patologias.length > 0 ? contexto.patologias.join(', ') : 'Ninguna'}
- Restricciones alimentarias: ${contexto.restriccionesAlimentarias ?? 'Ninguna'}
- Frecuencia de comidas: ${contexto.frecuenciaComidas ?? '4'} comidas diarias
- Medicamentos actuales: ${contexto.medicamentosActuales ?? 'Ninguno'}

PARÁMETROS DEL PLAN:
- Calorías objetivo diarias: ${caloriasObjetivo} kcal
- Días a generar: ${diasAGenerar}
- Comidas por día (OBLIGATORIAS): DESAYUNO, ALMUERZO, MERIENDA, CENA, COLACION

REGLAS IMPORTANTES:
1. NUNCA incluyas ingredientes que estén en las alergias del paciente
2. Considera las patologías y restricciones alimentarias
3. Distribuye las calorías de forma equilibrada entre las comidas
4. Varía las comidas entre días para evitar repetición
5. Incluye variedad de alimentos y grupos alimenticios
6. Debes devolver EXACTAMENTE ${diasAGenerar} días, numerados desde 1 hasta ${diasAGenerar}
7. Cada día debe incluir EXACTAMENTE 5 comidas: DESAYUNO, ALMUERZO, MERIENDA, CENA y COLACION
8. La COLACION es obligatoria en TODOS los días
9. Responde SOLO con el JSON solicitado

Genera el plan en formato JSON.`;
  }

  private completarEstructuraPlanSemanal(
    plan: PlanSemanalIA,
    diasEsperados: number,
  ): PlanSemanalIA {
    const diasFuente = Array.isArray(plan.dias) ? plan.dias : [];
    const plantillasPorTipo = new Map<TipoComida, RecomendacionComida>();

    for (const dia of diasFuente) {
      for (const comida of dia.comidas ?? []) {
        const tipoNormalizado = this.normalizarTipoComida(comida.tipoComida);
        if (!tipoNormalizado) continue;

        if (!plantillasPorTipo.has(tipoNormalizado)) {
          plantillasPorTipo.set(
            tipoNormalizado,
            this.clonarComida(comida, tipoNormalizado),
          );
        }
      }
    }

    const diasCompletos: DiaPlanSemanal[] = [];

    for (let diaNumero = 1; diaNumero <= diasEsperados; diaNumero += 1) {
      const diaOriginal = diasFuente.find((dia) => dia.dia === diaNumero);
      const comidasPorTipo = new Map<TipoComida, RecomendacionComida>();

      for (const comida of diaOriginal?.comidas ?? []) {
        const tipoNormalizado = this.normalizarTipoComida(comida.tipoComida);
        if (!tipoNormalizado || comidasPorTipo.has(tipoNormalizado)) continue;

        comidasPorTipo.set(
          tipoNormalizado,
          this.clonarComida(comida, tipoNormalizado),
        );
      }

      const comidasCompletas = TIPOS_COMIDA_REQUERIDOS.map((tipoComida) => {
        const existente = comidasPorTipo.get(tipoComida);
        if (existente) return existente;

        const plantilla = plantillasPorTipo.get(tipoComida);
        if (plantilla) return this.clonarComida(plantilla, tipoComida);

        return this.crearComidaPlaceholder(tipoComida);
      });

      diasCompletos.push({
        dia: diaNumero,
        comidas: comidasCompletas,
      });
    }

    const sumaCalorias = diasCompletos.reduce((acumulado, dia) => {
      const caloriasDia = dia.comidas.reduce(
        (total, comida) => total + comida.caloriasEstimadas,
        0,
      );

      return acumulado + caloriasDia;
    }, 0);

    const caloriasPromedio =
      diasEsperados > 0 ? Math.round(sumaCalorias / diasEsperados) : 0;

    return {
      ...plan,
      dias: diasCompletos,
      caloriasTotalesDiarias:
        caloriasPromedio > 0 ? caloriasPromedio : plan.caloriasTotalesDiarias,
    };
  }

  private normalizarTipoComida(tipoComida: string): TipoComida | null {
    const normalizado = tipoComida
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

    if (normalizado === 'DESAYUNO') return 'DESAYUNO';
    if (normalizado === 'ALMUERZO') return 'ALMUERZO';
    if (normalizado === 'MERIENDA') return 'MERIENDA';
    if (normalizado === 'CENA') return 'CENA';
    if (normalizado === 'COLACION') return 'COLACION';

    return null;
  }

  private clonarComida(
    comida: RecomendacionComida,
    tipoComida: TipoComida,
  ): RecomendacionComida {
    return {
      nombre: comida.nombre || `Comida ${tipoComida.toLowerCase()}`,
      descripcion: comida.descripcion || 'Comida sugerida por IA',
      ingredientes: comida.ingredientes.filter(
        (item) => item.trim().length > 0,
      ),
      caloriasEstimadas: this.normalizarNumero(comida.caloriasEstimadas, 250),
      proteinas: this.normalizarNumero(comida.proteinas, 15),
      carbohidratos: this.normalizarNumero(comida.carbohidratos, 25),
      grasas: this.normalizarNumero(comida.grasas, 10),
      tipoComida,
    };
  }

  private normalizarNumero(valor: number, fallback: number): number {
    if (!Number.isFinite(valor) || valor < 0) return fallback;
    return Math.round(valor);
  }

  private crearComidaPlaceholder(tipoComida: TipoComida): RecomendacionComida {
    const placeholders: Record<TipoComida, RecomendacionComida> = {
      DESAYUNO: {
        nombre: 'Desayuno equilibrado',
        descripcion: 'Yogur natural con avena y fruta',
        ingredientes: ['Yogur natural', 'Avena', 'Fruta de estación'],
        caloriasEstimadas: 350,
        proteinas: 18,
        carbohidratos: 45,
        grasas: 10,
        tipoComida: 'DESAYUNO',
      },
      ALMUERZO: {
        nombre: 'Almuerzo balanceado',
        descripcion: 'Proteína magra con vegetales y cereal integral',
        ingredientes: ['Pollo', 'Arroz integral', 'Verduras mixtas'],
        caloriasEstimadas: 550,
        proteinas: 35,
        carbohidratos: 55,
        grasas: 16,
        tipoComida: 'ALMUERZO',
      },
      MERIENDA: {
        nombre: 'Merienda nutritiva',
        descripcion: 'Lácteo y fruta para media tarde',
        ingredientes: ['Queso untable magro', 'Fruta fresca'],
        caloriasEstimadas: 220,
        proteinas: 12,
        carbohidratos: 25,
        grasas: 8,
        tipoComida: 'MERIENDA',
      },
      CENA: {
        nombre: 'Cena liviana',
        descripcion: 'Proteína magra con vegetales cocidos',
        ingredientes: ['Pescado', 'Pure de calabaza', 'Ensalada verde'],
        caloriasEstimadas: 480,
        proteinas: 32,
        carbohidratos: 38,
        grasas: 16,
        tipoComida: 'CENA',
      },
      COLACION: {
        nombre: 'Colación saludable',
        descripcion: 'Snack ligero entre comidas principales',
        ingredientes: ['Fruta fresca', 'Frutos secos'],
        caloriasEstimadas: 180,
        proteinas: 6,
        carbohidratos: 18,
        grasas: 9,
        tipoComida: 'COLACION',
      },
    };

    return placeholders[tipoComida];
  }

  private validarPlanSemanal(
    plan: PlanSemanalIA,
    contexto: ContextoPaciente,
    diasEsperados: number,
  ): void {
    if (plan.caloriasTotalesDiarias < CALORIAS_MINIMAS_DIARIAS) {
      plan.caloriasTotalesDiarias = CALORIAS_MINIMAS_DIARIAS;
    }
    if (plan.caloriasTotalesDiarias > CALORIAS_MAXIMAS_DIARIAS) {
      plan.caloriasTotalesDiarias = CALORIAS_MAXIMAS_DIARIAS;
    }

    if (plan.dias.length !== diasEsperados) {
      throw new BadRequestError(
        `El plan generado no incluye ${diasEsperados} días completos.`,
      );
    }

    for (const dia of plan.dias) {
      const tiposPresentes = new Set<TipoComida>();

      for (const comida of dia.comidas) {
        tiposPresentes.add(comida.tipoComida);

        const ingredientesLower = comida.ingredientes.map((i) =>
          i.toLowerCase(),
        );
        for (const alergia of contexto.alergias) {
          const alergiaLower = alergia.toLowerCase();
          if (ingredientesLower.some((ing) => ing.includes(alergiaLower))) {
            throw new BadRequestError(
              `El plan contiene un alérgeno (${alergia}) en el día ${dia.dia}. Por seguridad, no se puede sugerir este plan.`,
            );
          }
        }
      }

      for (const tipoComida of TIPOS_COMIDA_REQUERIDOS) {
        if (!tiposPresentes.has(tipoComida)) {
          throw new BadRequestError(
            `El día ${dia.dia} no incluye la comida obligatoria ${tipoComida}.`,
          );
        }
      }
    }
  }
}
