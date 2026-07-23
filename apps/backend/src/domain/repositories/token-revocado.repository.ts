export const TOKEN_REVOCADO_REPOSITORY = Symbol('TokenRevocadoRepository');

export interface TokenRevocado {
  jti: string;
  usuarioId: number;
  gimnasioId: number | null;
  expiresAt: Date;
}

export abstract class TokenRevocadoRepository {
  abstract save(token: TokenRevocado): Promise<void>;
  abstract existeJti(jti: string): Promise<boolean>;
  abstract purgarExpirados(): Promise<number>;
}