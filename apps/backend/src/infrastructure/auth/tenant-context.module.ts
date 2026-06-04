import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { TenantContextService } from './tenant-context.service';
import { TenantContextInterceptor } from './tenant-context.interceptor';

@Global()
@Module({
  providers: [
    TenantContextService,
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector, tenantContext: TenantContextService) =>
        new TenantContextInterceptor(reflector, tenantContext),
      inject: [Reflector, TenantContextService],
    },
  ],
  exports: [TenantContextService],
})
export class TenantContextModule {}
