import { Global, Module } from '@nestjs/common';

import { EncriptacionService } from './encriptacion.service';

@Global()
@Module({
  providers: [EncriptacionService],
  exports: [EncriptacionService],
})
export class SecurityModule {}
