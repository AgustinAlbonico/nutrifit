import { AppConfig } from 'src/domain/config/app.config';

type CorsCallback = (error: Error | null, allow?: boolean) => void;

export interface CorsOptionsConfig {
  allowedHeaders: string[];
  credentials: boolean;
  methods: string[];
  origin: (origin: string | undefined, callback: CorsCallback) => void;
}

export function createCorsOptions(
  config: Pick<AppConfig, 'getCorsAllowedOrigins'>,
): CorsOptionsConfig {
  const allowedOrigins = config.getCorsAllowedOrigins().map(normalizeOrigin);

  return {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);

      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin no permitido por CORS: ${origin}`), false);
    },
    credentials: false,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  };
}

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}
