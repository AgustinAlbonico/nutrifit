import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordEncrypterService } from 'src/domain/services/password-encrypter.service';

@Injectable()
export class PasswordEncrypterService implements IPasswordEncrypterService {
  rounds: number = 10;

  async comparePasswords(password: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(password, hashed);
  }

  async encryptPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.rounds);
  }
}
