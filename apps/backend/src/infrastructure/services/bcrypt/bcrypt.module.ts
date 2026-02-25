import { Module } from '@nestjs/common';
import { PASSWORD_ENCRYPTER_SERVICE } from 'src/domain/services/password-encrypter.service';
import { PasswordEncrypterService } from './bcrypt.service';

@Module({
  providers: [
    { provide: PASSWORD_ENCRYPTER_SERVICE, useClass: PasswordEncrypterService },
  ],
  exports: [PASSWORD_ENCRYPTER_SERVICE],
})
export class PasswordEncrypterModule {}
