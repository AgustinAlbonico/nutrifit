import { APP_INTERCEPTOR } from '@nestjs/core';
import { ControllersModule } from './controllers.module';
import { AuditoriaInterceptor } from 'src/infrastructure/services/auditoria/auditoria.interceptor';

describe('ControllersModule', () => {
  it('no debe registrar TenantContextInterceptor como APP_INTERCEPTOR global', () => {
    const providers = Reflect.getMetadata('providers', ControllersModule) as
      | Array<{ provide?: unknown; useClass?: unknown; useFactory?: unknown }>
      | undefined;

    const appInterceptors = (providers ?? []).filter(
      (provider) => provider?.provide === APP_INTERCEPTOR,
    );

    expect(appInterceptors).toHaveLength(1);
    expect(appInterceptors[0]?.useFactory).toBeDefined();
    expect(appInterceptors[0]?.useClass).toBe(AuditoriaInterceptor);
  });
});
