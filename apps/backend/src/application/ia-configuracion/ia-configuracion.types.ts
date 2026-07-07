export type ProveedorIa = 'opencode' | 'gemini' | 'groq' | 'openrouter';

export interface ConfiguracionIaCache {
  provider: ProveedorIa;
  apiKeyEncrypted: string | null;
  model: string | null;
  baseUrl: string | null;
  maxTokens: number | null;
  temperature: number | null;
  timeoutMs: number | null;
  habilitado: boolean;
  orden: number;
  actualizadoEn: Date;
}

export interface IaConfiguracionConsultaService {
  obtenerTodas(): import('./dto/ia-configuracion.response').IaConfiguracionResponse[];
  obtenerPorProvider(
    provider: ProveedorIa,
  ): import('./dto/ia-configuracion.response').IaConfiguracionResponse | null;
  obtenerApiKeyDescifrada(provider: ProveedorIa): string | undefined;
  obtenerChain(): ProveedorIa[];
  obtenerModel(provider: ProveedorIa): string | undefined;
  obtenerBaseUrl(provider: ProveedorIa): string | undefined;
  obtenerMaxTokens(provider: ProveedorIa): number | undefined;
  obtenerTemperature(provider: ProveedorIa): number | undefined;
  obtenerTimeoutMs(provider: ProveedorIa): number | undefined;
}

export const PROVEEDORES_IA: ProveedorIa[] = [
  'opencode',
  'gemini',
  'groq',
  'openrouter',
];

export function esProveedorIa(valor: string): valor is ProveedorIa {
  return PROVEEDORES_IA.includes(valor as ProveedorIa);
}
