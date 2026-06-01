import { Test, TestingModule } from '@nestjs/testing';
import { GenerarPlanSemanalUseCase } from './generar-plan-semanal.use-case';
import { ValidadorPlanSemanalUseCase } from './validador-plan-semanal.use-case';
import { PlanSemanalDraft } from '@nutrifit/shared';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import {
  AI_PROVIDER_SERVICE,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import { PrepararContextoPacienteUseCase } from './preparar-contexto-paciente.use-case';
import { SolicitudPlanSemanal, ContextoPaciente } from '@nutrifit/shared';

/**
 * Tests para el contrato de borrador estable de plan semanal.
 *
 * Task 2: Formalizar el borrador IA estable
 * - El endpoint /ia/plan-semanal debe retornar un RespuestaPlanSemanalDraft
 * - El borrador tiene metadatos: estado 'borrador', fechaCreacion, socioId
 * - El borrador contiene el plan validado en formato estructurado
 */
describe('GenerarPlanSemanalUseCase — Contrato Borrador Estable', () => {
  let useCase: GenerarPlanSemanalUseCase;
  let aiProvider: jest.Mocked<IAiProviderService>;
  let prepararContexto: jest.Mocked<PrepararContextoPacienteUseCase>;

  const contextoPacienteValido: ContextoPaciente = {
    socioId: 1,
    objetivoPersonal: 'Bajar de peso',
    nivelActividadFisica: 'MODERADO',
    peso: 80,
    altura: 175,
    alergias: ['maní'],
    patologias: [],
    restriccionesAlimentarias: null,
    frecuenciaComidas: '4',
    consumoAguaDiario: 2000,
    medicamentosActuales: null,
    suplementosActuales: null,
    consumoAlcohol: null,
    fumaTabaco: false,
    horasSueno: 7,
    cirugiasPrevias: null,
    antecedentesFamiliares: null,
  };

  const solicitudValida: SolicitudPlanSemanal = {
    socioId: 1,
    diasAGenerar: 7,
  };

  const crearComidasCompleto = () => [
    {
      nombre: 'Desayuno',
      descripcion: 'Test',
      ingredientes: ['avena', 'leche'],
      caloriasEstimadas: 400,
      proteinas: 15,
      carbohidratos: 50,
      grasas: 10,
      tipoComida: 'DESAYUNO',
    },
    {
      nombre: 'Almuerzo',
      descripcion: 'Test',
      ingredientes: ['arroz', 'pollo', 'verduras'],
      caloriasEstimadas: 550,
      proteinas: 40,
      carbohidratos: 60,
      grasas: 15,
      tipoComida: 'ALMUERZO',
    },
    {
      nombre: 'Merienda',
      descripcion: 'Test',
      ingredientes: ['fruta', 'yogur'],
      caloriasEstimadas: 400,
      proteinas: 10,
      carbohidratos: 25,
      grasas: 7,
      tipoComida: 'MERIENDA',
    },
    {
      nombre: 'Cena',
      descripcion: 'Test',
      ingredientes: ['pescado', 'ensalada'],
      caloriasEstimadas: 400,
      proteinas: 38,
      carbohidratos: 25,
      grasas: 18,
      tipoComida: 'CENA',
    },
    {
      nombre: 'Colacion',
      descripcion: 'Test',
      ingredientes: ['frutos secos'],
      caloriasEstimadas: 250,
      proteinas: 6,
      carbohidratos: 15,
      grasas: 10,
      tipoComida: 'COLACION',
    },
  ];

  beforeEach(async () => {
    const mockAiProvider = {
      generarRecomendacion: jest.fn(),
    };

    const mockPreparar = {
      execute: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerarPlanSemanalUseCase,
        ValidadorPlanSemanalUseCase,
        { provide: AI_PROVIDER_SERVICE, useValue: mockAiProvider },
        { provide: PrepararContextoPacienteUseCase, useValue: mockPreparar },
        { provide: APP_LOGGER_SERVICE, useValue: mockLogger },
      ],
    }).compile();

    useCase = module.get<GenerarPlanSemanalUseCase>(GenerarPlanSemanalUseCase);
    aiProvider = module.get(AI_PROVIDER_SERVICE);
    prepararContexto = module.get(PrepararContextoPacienteUseCase);
  });

  describe('Contrato RespuestaPlanSemanalDraft', () => {
    it('debe retornar RespuestaPlanSemanalDraft con metadatos de borrador', async () => {
      prepararContexto.execute.mockResolvedValue(contextoPacienteValido);

      const planCompleto = {
        dias: Array.from({ length: 7 }, (_, i) => ({
          dia: i + 1,
          comidas: crearComidasCompleto(),
        })),
        caloriasTotalesDiarias: 2000,
        disclaimer: 'Este es un borrador. Consulte con su nutricionista.',
      };

      aiProvider.generarRecomendacion.mockResolvedValue(planCompleto);

      const resultado = await useCase.execute(solicitudValida);

      // El resultado debe cumplir el contrato RespuestaPlanSemanalDraft
      expect(resultado.exito).toBe(true);
      expect(resultado.datos).not.toBeNull();

      // Verificar estructura del borrador
      const draft = resultado.datos as PlanSemanalDraft;
      expect(draft.estado).toBe('borrador');
      expect(draft.socioId).toBe(1);
      expect(draft.fechaCreacion).toBeDefined();
      expect(draft.plan).not.toBeNull();
      expect(draft.plan!.dias).toHaveLength(7);
    });

    it('debe incluir plan validado dentro del borrador', async () => {
      prepararContexto.execute.mockResolvedValue(contextoPacienteValido);

      const planCompleto = {
        dias: Array.from({ length: 7 }, (_, i) => ({
          dia: i + 1,
          comidas: crearComidasCompleto(),
        })),
        caloriasTotalesDiarias: 2000,
        disclaimer: 'Borrador IA.',
      };

      aiProvider.generarRecomendacion.mockResolvedValue(planCompleto);

      const resultado = await useCase.execute(solicitudValida);

      expect(resultado.exito).toBe(true);
      const draft = resultado.datos as PlanSemanalDraft;

      // El plan validado debe estar dentro de draft.plan
      expect(draft.plan).not.toBeNull();
      expect(draft.plan!.caloriasTotalesDiarias).toBe(2000);
      expect(Array.isArray(draft.plan!.dias)).toBe(true);
    });

    it('debe incluir disclaimer en el borrador', async () => {
      prepararContexto.execute.mockResolvedValue(contextoPacienteValido);

      const planCompleto = {
        dias: Array.from({ length: 7 }, (_, i) => ({
          dia: i + 1,
          comidas: crearComidasCompleto(),
        })),
        caloriasTotalesDiarias: 2000,
        disclaimer: 'Este plan es un borrador generated por IA.',
      };

      aiProvider.generarRecomendacion.mockResolvedValue(planCompleto);

      const resultado = await useCase.execute(solicitudValida);

      expect(resultado.exito).toBe(true);
      const draft = resultado.datos as PlanSemanalDraft;

      expect(draft.disclaimer).toBeDefined();
      expect(draft.disclaimer.length).toBeGreaterThan(0);
    });

    it('debe retornar error con estructura de borrador fallido', async () => {
      prepararContexto.execute.mockResolvedValue(contextoPacienteValido);

      // Plan incompleto que falla validación
      const planIncompleto = {
        dias: [
          {
            dia: 1,
            comidas: [
              {
                nombre: 'Solo desayuno',
                descripcion: 'Test',
                ingredientes: ['leche'],
                caloriasEstimadas: 300,
                proteinas: 10,
                carbohidratos: 40,
                grasas: 8,
                tipoComida: 'DESAYUNO',
              },
            ],
          },
        ],
        caloriasTotalesDiarias: 2000,
        disclaimer: '',
      };

      aiProvider.generarRecomendacion.mockResolvedValue(planIncompleto);

      const resultado = await useCase.execute(solicitudValida);

      // En caso de error, el borrador debe tener estado error
      expect(resultado.exito).toBe(false);
      expect(resultado.datos).toBeDefined();
      const draft = resultado.datos as PlanSemanalDraft;
      expect(draft.estado).toBe('error');
      expect(draft.error).toBeDefined();
    });
  });
});
