export declare const PASSWORD_ENCRYPTER_SERVICE: unique symbol;
export interface IPasswordEncrypterService {
    encryptPassword(password: string): Promise<string>;
    comparePasswords(password: string, hashed: string): Promise<boolean>;
}
