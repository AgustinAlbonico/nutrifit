import { IPasswordEncrypterService } from 'src/domain/services/password-encrypter.service';
export declare class PasswordEncrypterService implements IPasswordEncrypterService {
    rounds: number;
    comparePasswords(password: string, hashed: string): Promise<boolean>;
    encryptPassword(password: string): Promise<string>;
}
