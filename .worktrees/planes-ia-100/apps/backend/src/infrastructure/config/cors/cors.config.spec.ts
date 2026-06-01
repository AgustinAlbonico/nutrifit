import { createCorsOptions } from './cors.config';

describe('createCorsOptions', () => {
  it('permite requests sin origin', () => {
    const corsOptions = createCorsOptions({
      getCorsAllowedOrigins: () => ['https://app.nutrifit.com'],
    });

    corsOptions.origin(undefined, (error, allowed) => {
      expect(error).toBeNull();
      expect(allowed).toBe(true);
    });
  });

  it('permite origins configurados aunque vengan con slash final', () => {
    const corsOptions = createCorsOptions({
      getCorsAllowedOrigins: () => ['https://app.nutrifit.com/'],
    });

    corsOptions.origin('https://app.nutrifit.com', (error, allowed) => {
      expect(error).toBeNull();
      expect(allowed).toBe(true);
    });
  });

  it('rechaza origins no configurados', () => {
    const corsOptions = createCorsOptions({
      getCorsAllowedOrigins: () => ['https://app.nutrifit.com'],
    });

    corsOptions.origin('https://evil.example', (error, allowed) => {
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('Origin no permitido por CORS');
      expect(allowed).toBe(false);
    });
  });
});
