import { Test, TestingModule } from '@nestjs/testing';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import { AiController } from './ai.controller';
import { GenerarPlanSemanalUseCase } from 'src/application/ai/use-cases/generar-plan-semanal.use-case';
import { GenerarRecomendacionComidaUseCase } from 'src/application/ai/use-cases/generar-recomendacion-comida.use-case';
import { SugerirSustitucionUseCase } from 'src/application/ai/use-cases/sugerir-sustitucion.use-case';
import { AnalizarPlanNutricionalUseCase } from 'src/application/ai/use-cases/analizar-plan-nutricional.use-case';
import { GenerarIdeasComidaUseCase } from 'src/application/ai/use-cases/generar-ideas-comida.use-case';
import { AplicarDraftPlanSemanalUseCase } from 'src/application/ai/use-cases/aplicar-draft-plan-semanal.use-case';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { RespuestaPlanSemanalDraft } from '@nutrifit/shared';
import { AplicarDraftPlanSemanalDto } from 'src/application/ai/dto/aplicar-draft-plan.dto';

/**
 * Tests de contrato para el endpoint /ia/plan-semanal y /ia/aplicar-draft.
 *
 * Task 2: Tests de contrato a nivel controlador
 * Task 4: Tests de contrato para endpoint aplicar-draft
 */
describe('AiController - Plan Semanal', () => {
  let controller: AiController;

  const mockPlanSemanalUseCase = {
    execute: jest.fn(),
  };

  const mockGenerarRecomendacionUseCase = {
    execute: jest.fn(),
  };

  const mockSugerirSustitucionUseCase = {
    execute: jest.fn(),
  };

  const mockAnalizarPlanNutricionalUseCase = {
    execute: jest.fn(),
  };

  const mockGenerarIdeasComidaUseCase = {
    execute: jest.fn(),
  };

  const mockAplicarDraftUseCase = {
    execute: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: GenerarPlanSemanalUseCase,
          useValue: mockPlanSemanalUseCase,
        },
        {
          provide: GenerarRecomendacionComidaUseCase,
          useValue: mockGenerarRecomendacionUseCase,
        },
        {
          provide: SugerirSustitucionUseCase,
          useValue: mockSugerirSustitucionUseCase,
        },
        {
          provide: AnalizarPlanNutricionalUseCase,
          useValue: mockAnalizarPlanNutricionalUseCase,
        },
        {
          provide: GenerarIdeasComidaUseCase,
          useValue: mockGenerarIdeasComidaUseCase,
        },
        {
          provide: AplicarDraftPlanSemanalUseCase,
          useValue: mockAplicarDraftUseCase,
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: mockLogger,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AiController>(AiController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /ia/plan-semanal', () => {
    it('debe retornar RespuestaPlanSemanalDraft con contrato completo en éxito', async () => {
      const dto = {
        socioId: 1,
        caloriasObjetivo: 2000,
        diasAGenerar: 7,
      };

      const respuestaEsperada: RespuestaPlanSemanalDraft = {
        exito: true,
        datos: {
          estado: 'borrador',
          socioId: 1,
          fechaCreacion: '2026-05-29T10:00:00.000Z',
          plan: {
            dias: [
              {
                dia: 1,
                comidas: [
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
                    ingredientes: ['arroz', 'pollo'],
                    caloriasEstimadas: 550,
                    proteinas: 40,
                    carbohidratos: 60,
                    grasas: 15,
                    tipoComida: 'ALMUERZO',
                  },
                  {
                    nombre: 'Merienda',
                    descripcion: 'Test',
                    ingredientes: ['fruta'],
                    caloriasEstimadas: 300,
                    proteinas: 5,
                    carbohidratos: 25,
                    grasas: 7,
                    tipoComida: 'MERIENDA',
                  },
                  {
                    nombre: 'Cena',
                    descripcion: 'Test',
                    ingredientes: ['pescado', 'ensalada'],
                    caloriasEstimadas: 450,
                    proteinas: 35,
                    carbohidratos: 20,
                    grasas: 18,
                    tipoComida: 'CENA',
                  },
                  {
                    nombre: 'Colacion',
                    descripcion: 'Test',
                    ingredientes: ['frutos secos'],
                    caloriasEstimadas: 200,
                    proteinas: 5,
                    carbohidratos: 10,
                    grasas: 12,
                    tipoComida: 'COLACION',
                  },
                ],
              },
            ],
            caloriasTotalesDiarias: 2000,
            disclaimer: 'Esta recomendación es orientación general.',
          },
          error: null,
          disclaimer:
            'Esta recomendación es orientación general y no sustituye consejo médico profesional. Consulte siempre con su nutricionista.',
        },
        error: null,
        disclaimer:
          'Esta recomendación es orientación general y no sustituye consejo médico profesional. Consulte siempre con su nutricionista.',
      };

      mockPlanSemanalUseCase.execute.mockResolvedValue(respuestaEsperada);

      const resultado = await controller.generarPlanSemanal(dto);

      expect(mockPlanSemanalUseCase.execute).toHaveBeenCalledWith({
        socioId: dto.socioId,
        caloriasObjetivo: dto.caloriasObjetivo,
        diasAGenerar: dto.diasAGenerar,
      });

      expect(resultado.exito).toBe(true);
      expect(resultado.datos).not.toBeNull();
      expect(resultado.datos!.estado).toBe('borrador');
      expect(resultado.datos!.socioId).toBe(1);
      expect(resultado.datos!.plan).not.toBeNull();
      expect(resultado.datos!.plan!.dias).toHaveLength(1);
      expect(resultado.disclaimer).toBeDefined();
      expect(resultado.disclaimer.length).toBeGreaterThan(0);
    });

    it('debe retornar RespuestaPlanSemanalDraft con borrador fallido en caso de error', async () => {
      const dto = {
        socioId: 1,
        diasAGenerar: 7,
      };

      const respuestaError: RespuestaPlanSemanalDraft = {
        exito: false,
        datos: {
          estado: 'error',
          socioId: 1,
          fechaCreacion: '2026-05-29T10:00:00.000Z',
          plan: null,
          error: 'No se pudo generar un plan válido después de 3 intentos.',
          disclaimer:
            'Esta recomendación es orientación general y no sustituye consejo médico profesional. Consulte siempre con su nutricionista.',
        },
        error: 'No se pudo generar un plan válido después de 3 intentos.',
        disclaimer:
          'Esta recomendación es orientación general y no sustituye consejo médico profesional. Consulte siempre con su nutricionista.',
      };

      mockPlanSemanalUseCase.execute.mockResolvedValue(respuestaError);

      const resultado = await controller.generarPlanSemanal(dto);

      expect(resultado.exito).toBe(false);
      expect(resultado.datos).not.toBeNull();
      expect(resultado.datos!.estado).toBe('error');
      expect(resultado.datos!.error).toBeDefined();
    });

    it('debe propagar el socioId correctamente al use-case', async () => {
      const dto = {
        socioId: 42,
        diasAGenerar: 3,
      };

      const respuestaMock: RespuestaPlanSemanalDraft = {
        exito: true,
        datos: {
          estado: 'borrador',
          socioId: 42,
          fechaCreacion: new Date().toISOString(),
          plan: {
            dias: [],
            caloriasTotalesDiarias: 2000,
            disclaimer: 'Test',
          },
          error: null,
          disclaimer: 'Test',
        },
        error: null,
        disclaimer: 'Test',
      };

      mockPlanSemanalUseCase.execute.mockResolvedValue(respuestaMock);

      await controller.generarPlanSemanal(dto);

      expect(mockPlanSemanalUseCase.execute).toHaveBeenCalledWith({
        socioId: 42,
        caloriasObjetivo: undefined,
        diasAGenerar: 3,
      });
    });
  });

  describe('POST /ia/aplicar-draft', () => {
    it('debe llamar al use case con los datos del borrador', async () => {
      const dto = {
        socioId: 1,
        objetivoNutricional: 'Bajar de peso',
        dias: [
          {
            dia: 1,
            comidas: [
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
                caloriasEstimadas: 300,
                proteinas: 10,
                carbohidratos: 25,
                grasas: 7,
                tipoComida: 'MERIENDA',
              },
              {
                nombre: 'Cena',
                descripcion: 'Test',
                ingredientes: ['pescado', 'ensalada'],
                caloriasEstimadas: 450,
                proteinas: 38,
                carbohidratos: 20,
                grasas: 18,
                tipoComida: 'CENA',
              },
              {
                nombre: 'Colacion',
                descripcion: 'Test',
                ingredientes: ['frutos secos'],
                caloriasEstimadas: 200,
                proteinas: 5,
                carbohidratos: 10,
                grasas: 12,
                tipoComida: 'COLACION',
              },
            ],
          },
        ],
      };

      const respuestaEsperada = {
        planId: 1,
        socioId: 1,
        objetivoNutricional: 'Bajar de peso',
        diasCreados: 1,
        disclaimer:
          'Esta recomendación es orientación general y no sustituye consejo médico profesional. Consulte siempre con su nutricionista.',
      };

      mockAplicarDraftUseCase.execute.mockResolvedValue(respuestaEsperada);

      const resultado = await controller.aplicarDraftPlan(10, dto as any);

      expect(mockAplicarDraftUseCase.execute).toHaveBeenCalledWith(10, dto);
      expect(resultado.planId).toBe(1);
      expect(resultado.socioId).toBe(1);
    });
  });
});
