export type ProveedorIa = 'opencode' | 'gemini' | 'groq' | 'openrouter';

export interface ConfiguracionIa {
  provider: ProveedorIa;
  apiKeyConfigurada: boolean;
  model: string | null;
  baseUrl: string | null;
  maxTokens: number | null;
  temperature: number | null;
  timeoutMs: number | null;
  habilitado: boolean;
  orden: number;
  actualizadoEn: string;
}

export interface GuardarConfiguracionIaDto {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  habilitado?: boolean;
  orden?: number;
}

export interface ResultadoPruebaIa {
  ok: boolean;
  mensaje: string;
}

export interface ResultadoReinicioIa {
  requiereReinicio: true;
  mensaje: string;
}

export interface MetadatosProveedorIa {
  id: ProveedorIa;
  etiqueta: string;
  descripcion: string;
}

export const PROVEEDORES_IA: MetadatosProveedorIa[] = [
  {
    id: 'opencode',
    etiqueta: 'OpenCode Zen',
    descripcion: 'Proveedor principal usado para generación de planes.',
  },
  {
    id: 'gemini',
    etiqueta: 'Google Gemini',
    descripcion: 'Alternativa con buena relación costo/calidad.',
  },
  {
    id: 'groq',
    etiqueta: 'Groq',
    descripcion: 'Inferencia rápida. Útil como fallback.',
  },
  {
    id: 'openrouter',
    etiqueta: 'OpenRouter',
    descripcion: 'Pasarela multi-modelo.',
  },
];

export function configuracionVaciaPara(provider: ProveedorIa): ConfiguracionIa {
  return {
    provider,
    apiKeyConfigurada: false,
    model: null,
    baseUrl: null,
    maxTokens: null,
    temperature: null,
    timeoutMs: null,
    habilitado: true,
    orden: PROVEEDORES_IA.findIndex((p) => p.id === provider),
    actualizadoEn: '',
  };
}