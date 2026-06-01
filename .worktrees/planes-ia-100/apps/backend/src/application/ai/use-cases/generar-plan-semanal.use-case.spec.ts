import { Test, TestingModule } from '@nestjs/testing';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  AI_PROVIDER_SERVICE,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import { PrepararContextoPacienteUseCase } from './preparar-contexto-paciente.use-case';
import { GenerarPlanSemanalUseCase } from './generar-plan-semanal.use-case';
import { ValidadorPlanSemanalUseCase } from './validador-plan-semanal.use-case';
import { SolicitudPlanSemanal, ContextoPaciente } from '@nutrifit/shared';
import { MAX_REINTENTOS_GENERACION } from './constants';

describe('GenerarPlanSemanalUseCase — Validación Estricta', () => {
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

  describe('Validación estricta de estructura', () => {
    it('debe rechazar plan con día incompleto (falta ALMUERZO)', async () => {
      prepararContexto.execute.mockResolvedValue(contextoPacienteValido);

      const planIncompleto = {
        dias: [
          {
            dia: 1,
            comidas: [
              {
                nombre: 'Desayuno test',
                descripcion: 'Test',
                ingredientes: ['leche'],
                caloriasEstimadas: 300,
                proteinas: 10,
                carbohidratos: 40,
                grasas: 8,
                tipoComida: 'DESAYUNO',
              },
              {
                nombre: 'Merienda test',
                descripcion: 'Test',
                ingredientes: ['fruta'],
                caloriasEstimadas: 150,
                proteinas: 5,
                carbohidratos: 20,
                grasas: 5,
                tipoComida: 'MERIENDA',
              },
            ],
          },
        ],
        caloriasTotalesDiarias: 2000,
        disclaimer: '',
      };

      aiProvider.generarRecomendacion.mockResolvedValue(planIncompleto);

      const resultado = await useCase.execute(solicitudValida);

      expect(resultado.exito).toBe(false);
      expect(resultado.error).toContain('ALMUERZO');
    });

    it('debe rechazar plan que no tiene todos los 7 días solicitados', async () => {
      prepararContexto.execute.mockResolvedValue(contextoPacienteValido);

      const planConDiasFaltantes = {
        dias: [
          { dia: 1, comidas: crearComidasCompleto() },
          { dia: 2, comidas: crearComidasCompleto() },
        ],
        caloriasTotalesDiarias: 2000,
        disclaimer: '',
      };

      aiProvider.generarRecomendacion.mockResolvedValue(planConDiasFaltantes);

      const resultado = await useCase.execute({
        ...solicitudValida,
        diasAGenerar: 7,
      });

      expect(resultado.exito).toBe(false);
      expect(resultado.error).toContain('7 días');
    });

    it('debe rechazar plan que contiene alérgenos del paciente', async () => {
      prepararContexto.execute.mockResolvedValue({
        ...contextoPacienteValido,
        alergias: ['maní', 'lácteos'],
      });

      const planConAlergenos = {
        dias: [
          {
            dia: 1,
            comidas: [
              {
                nombre: 'Desayuno con maní',
                descripcion: 'Desayuno con maní',
                ingredientes: ['leche', 'maní'],
                caloriasEstimadas: 300,
                proteinas: 10,
                carbohidratos: 40,
                grasas: 8,
                tipoComida: 'DESAYUNO',
              },
              ...crearComidasCompleto().slice(1),
            ],
          },
        ],
        caloriasTotalesDiarias: 2000,
        disclaimer: '',
      };

      aiProvider.generarRecomendacion.mockResolvedValue(planConAlergenos);

      const resultado = await useCase.execute(solicitudValida);

      expect(resultado.exito).toBe(false);
      expect(resultado.error).toMatch(/alérgeno.*maní/i);
    });

    it('NO debe usar placeholders cuando falta una comida — debe rechazar', async () => {
      prepararContexto.execute.mockResolvedValue(contextoPacienteValido);

      const planConFaltaUnaComida = {
        dias: [
          {
            dia: 1,
            comidas: [
              {
                nombre: 'Desayuno',
                descripcion: 'Test',
                ingredientes: ['leche'],
                caloriasEstimadas: 300,
                proteinas: 10,
                carbohidratos: 40,
                grasas: 8,
                tipoComida: 'DESAYUNO',
              },
              // falta ALMUERZO
              {
                nombre: 'Merienda',
                descripcion: 'Test',
                ingredientes: ['fruta'],
                caloriasEstimadas: 150,
                proteinas: 5,
                carbohidratos: 20,
                grasas: 5,
                tipoComida: 'MERIENDA',
              },
              {
                nombre: 'Cena',
                descripcion: 'Test',
                ingredientes: ['pescado'],
                caloriasEstimadas: 450,
                proteinas: 40,
                carbohidratos: 30,
                grasas: 15,
                tipoComida: 'CENA',
              },
              {
                nombre: 'Colacion',
                descripcion: 'Test',
                ingredientes: ['frutos secos'],
                caloriasEstimadas: 180,
                proteinas: 6,
                carbohidratos: 15,
                grasas: 10,
                tipoComida: 'COLACION',
              },
            ],
          },
        ],
        caloriasTotalesDiarias: 2000,
        disclaimer: '',
      };

      aiProvider.generarRecomendacion.mockResolvedValue(planConFaltaUnaComida);

      const resultado = await useCase.execute(solicitudValida);

      expect(resultado.exito).toBe(false);
      expect(resultado.error).toMatch(/día 1.*ALMUERZO/);
    });
  });

  describe('Reintentos automáticos con retroalimentación interna', () => {
    it('debe reintentar automáticamente cuando la IA devuelve estructura inválida', async () => {
      prepararContexto.execute.mockResolvedValue(contextoPacienteValido);

      // Primer llamado: plan incompleto (falta ALMUERZO en día 1)
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

      // Segundo llamado: plan completo y válido
      const planCompleto = {
        dias: Array.from({ length: 7 }, (_, i) => ({
          dia: i + 1,
          comidas: crearComidasCompleto(),
        })),
        caloriasTotalesDiarias: 2000,
        disclaimer: '',
      };

      aiProvider.generarRecomendacion
        .mockResolvedValueOnce(planIncompleto)
        .mockResolvedValueOnce(planCompleto);

      const resultado = await useCase.execute(solicitudValida);

      expect(aiProvider.generarRecomendacion).toHaveBeenCalledTimes(2);
      expect(resultado.exito).toBe(true);
      expect(resultado.datos?.plan?.dias).toHaveLength(7);
    });

    it('debe fallar después de reintentos máximos sin producir un plan válido', async () => {
      prepararContexto.execute.mockResolvedValue(contextoPacienteValido);

      // Siempre devuelve plan incompleto
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

      // Debería agotar reintentos y devolver error
      expect(aiProvider.generarRecomendacion).toHaveBeenCalledTimes(
        MAX_REINTENTOS_GENERACION,
      );
      expect(resultado.exito).toBe(false);
      expect(resultado.error).toContain('No se pudo generar un plan válido');
    });
  });

  describe('Plan válido', () => {
    it('debe aceptar un plan completo y válido', async () => {
      prepararContexto.execute.mockResolvedValue(contextoPacienteValido);

      const planCompleto = {
        dias: Array.from({ length: 7 }, (_, i) => ({
          dia: i + 1,
          comidas: crearComidasCompleto(),
        })),
        caloriasTotalesDiarias: 2000,
        disclaimer: '',
      };

      aiProvider.generarRecomendacion.mockResolvedValue(planCompleto);

      const resultado = await useCase.execute(solicitudValida);

      expect(resultado.exito).toBe(true);
      expect(resultado.datos?.plan?.dias).toHaveLength(7);
      expect(resultado.error).toBeNull();
    });
  });
});
