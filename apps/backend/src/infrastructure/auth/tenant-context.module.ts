import { Module, Global } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantContextInterceptor } from './tenant-context.interceptor';

@Global()
@Module({
  providers: [TenantContextService, TenantContextInterceptor],
  exports: [TenantContextService, TenantContextInterceptor],
})
export class TenantContextModule {}
