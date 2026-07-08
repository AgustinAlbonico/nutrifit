import { Injectable } from '@nestjs/common';

const VALOR_REDACTADO = '[REDACTED]';

@Injectable()
export class AuditoriaSanitizer {
  private readonly camposBase = new Set([
    'password',
    'passwordHash',
    'hash',
    'token',
    'jwt',
    'refreshToken',
    'apiKey',
  ]);

  sanitizar<T>(valor: T, camposSensibles: string[] = []): T {
    const campos = new Set([...this.camposBase, ...camposSensibles]);
    return this.sanitizarValor(valor, campos) as T;
  }

  private sanitizarValor(valor: unknown, camposSensibles: Set<string>): unknown {
    if (Array.isArray(valor)) {
      return valor.map((item) => this.sanitizarValor(item, camposSensibles));
    }

    if (valor !== null && typeof valor === 'object') {
      return Object.fromEntries(
        Object.entries(valor as Record<string, unknown>).map(([clave, dato]) => [
          clave,
          camposSensibles.has(clave) ? VALOR_REDACTADO : this.sanitizarValor(dato, camposSensibles),
        ]),
      );
    }

    return valor;
  }
}
