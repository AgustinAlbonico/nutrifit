import type { ProveedorIa } from '../ia-configuracion.types';

export interface IaConfiguracionResponse {
  provider: ProveedorIa;
  apiKeyConfigurada: boolean;
  model: string | null;
  baseUrl: string | null;
  maxTokens: number | null;
  temperature: number | null;
  timeoutMs: number | null;
  habilitado: boolean;
  orden: number;
  actualizadoEn: Date;
}
