import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const VARIABLE_CLAVE_ENCRIPTACION = 'IA_CONFIG_ENCRYPTION_KEY';
const ALGORITMO = 'aes-256-gcm';
const BYTES_IV = 12;
const BYTES_CLAVE = 32;

@Injectable()
export class EncriptacionService {
  private readonly clave: Buffer;

  constructor(configService: ConfigService) {
    const claveHex = configService.get<string>(VARIABLE_CLAVE_ENCRIPTACION);

    if (!claveHex) {
      throw new Error(
        `${VARIABLE_CLAVE_ENCRIPTACION} es obligatoria para encriptar la configuración IA. Generá una clave con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
      );
    }

    this.clave = Buffer.from(claveHex, 'hex');

    if (this.clave.length !== BYTES_CLAVE) {
      throw new Error(
        `${VARIABLE_CLAVE_ENCRIPTACION} debe ser una clave hexadecimal de 32 bytes (64 caracteres).`,
      );
    }
  }

  cifrar(texto: string): string {
    const iv = randomBytes(BYTES_IV);
    const cipher = createCipheriv(ALGORITMO, this.clave, iv);
    const cifrado = Buffer.concat([
      cipher.update(texto, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      cifrado.toString('hex'),
    ].join(':');
  }

  descifrar(cifrado: string): string {
    const partes = cifrado.split(':');

    if (partes.length !== 3) {
      throw new Error(
        'El valor cifrado de configuración IA tiene formato inválido.',
      );
    }

    const [ivHex, authTagHex, textoCifradoHex] = partes;
    const decipher = createDecipheriv(
      ALGORITMO,
      this.clave,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    return Buffer.concat([
      decipher.update(Buffer.from(textoCifradoHex, 'hex')),
      decipher.final(),
    ]).toString('utf8');
  }
}
