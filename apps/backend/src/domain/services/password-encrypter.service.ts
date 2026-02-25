export const PASSWORD_ENCRYPTER_SERVICE = Symbol('IPasswordEncrypterService');

export interface IPasswordEncrypterService {
  encryptPassword(password: string): Promise<string>;
  comparePasswords(password: string, hashed: string): Promise<boolean>;
}
