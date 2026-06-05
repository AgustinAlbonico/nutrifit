import { APP_INTERCEPTOR } from '@nestjs/core';
import { ControllersModule } from './controllers.module';

describe('ControllersModule', () => {
  it('no debe registrar TenantContextInterceptor como APP_INTERCEPTOR global', () => {
    const providers = Reflect.getMetadata('providers', ControllersModule) as
      | Array<{ provide?: unknown }>
      | undefined;

    const providerTokens = (providers ?? []).map(
      (provider) => provider?.provide,
    );

    expect(providerTokens).not.toContain(APP_INTERCEPTOR);
  });
});
