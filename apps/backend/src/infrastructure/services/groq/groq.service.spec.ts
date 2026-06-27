import { GroqService } from './groq.service';
import type { EnvironmentConfigService } from '../../config/environment-config/environment-config.service';

interface SolicitudCompletionGroq {
  messages: Array<{ content: string }>;
  temperature?: number;
  max_tokens?: number;
  [key: string]: unknown;
}

interface OpcionesRequestGroq {
  timeout?: number;
}

interface RespuestaCompletionGroq {
  choices: Array<{ message: { content: string } }>;
}

const mockCrearCompletion = jest.fn<
  Promise<RespuestaCompletionGroq>,
  [SolicitudCompletionGroq, OpcionesRequestGroq?]
>();

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCrearCompletion,
      },
    },
  })),
);

describe('GroqService', () => {
  let configService: jest.Mocked<EnvironmentConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCrearCompletion.mockResolvedValue({
      choices: [{ message: { content: '{"ok":true}' } }],
    });
    configService = {
      getGroqBaseUrl: jest
        .fn()
        .mockReturnValue('https://api.groq.com/openai/v1'),
      getGroqModel: jest.fn().mockReturnValue('llama-3.3-70b-versatile'),
      getGroqApiKey: jest.fn().mockReturnValue('gsk_test_key_1234567890'),
    } as unknown as jest.Mocked<EnvironmentConfigService>;
  });

  it('usa max_tokens y temperature enviados por el caso de uso', async () => {
    const service = new GroqService(configService);

    await service.generarRecomendacion<{ ok: boolean }>('prompt', {
      schema: { type: 'object', additionalProperties: false },
      temperature: 0.4,
      max_tokens: 8192,
      timeoutMs: 45000,
    });

    expect(mockCrearCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.4,
        max_tokens: 8192,
      }),
      expect.objectContaining({ timeout: 45000 }),
    );

    const request = mockCrearCompletion.mock.calls[0][0] as {
      messages: Array<{ content: string }>;
    };
    expect(request.messages[1].content).toContain('"type": "object"');
    expect(request.messages[1].content).not.toContain('"max_tokens"');
  });

  it('usa defaults cuando no se envían opciones de generación', async () => {
    const service = new GroqService(configService);

    await service.generarRecomendacion<{ ok: boolean }>('prompt');

    expect(mockCrearCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.7,
        max_tokens: 2048,
      }),
      expect.objectContaining({ timeout: 120000 }),
    );
  });
});
