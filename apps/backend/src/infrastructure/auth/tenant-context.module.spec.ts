import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';

import { TenantContextModule } from './tenant-context.module';
import { TenantContextService } from './tenant-context.service';

describe('TenantContextModule', () => {
  it('debe registrar TenantContextInterceptor con inyección explícita de Reflector', () => {
    const metadata = Reflect.getMetadata('providers', TenantContextModule) as
      | Array<{
          provide?: unknown;
          useFactory?: unknown;
          inject?: unknown[];
        }>
      | undefined;

    const interceptorProvider = metadata?.find(
      (provider) => provider.provide === APP_INTERCEPTOR,
    );

    expect(interceptorProvider).toBeDefined();
    expect(typeof interceptorProvider?.useFactory).toBe('function');
    expect(interceptorProvider?.inject).toEqual([
      Reflector,
      TenantContextService,
    ]);
  });
});
