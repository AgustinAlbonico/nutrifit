import { Injectable, Scope, Inject, Optional } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { JwtPayload } from 'src/domain/services/jwt.service';

export interface TenantContext {
  gimnasioId: number;
  personaId: number | null;
  usuarioId: number;
  jti: string;
  rol: string;
}

export const TENANT_CONTEXT = Symbol('ITenantContext');

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private _gimnasioId: number | null = null;
  private _personaId: number | null = null;
  private _usuarioId: number | null = null;
  private _jti: string | null = null;
  private _rol: string | null = null;

  constructor(@Inject(REQUEST) @Optional() private readonly request?: Request) {
    if (request?.user) {
      const user = request.user as JwtPayload;
      this._gimnasioId = user.gimnasioId ?? null;
      this._personaId = user.personaId ?? null;
      this._usuarioId = user.id ?? null;
      this._jti = user.jti ?? null;
      this._rol = user.rol ?? null;
    }
  }

  get gimnasioId(): number {
    if (this._gimnasioId === null) {
      throw new Error(
        'Tenant context not initialized — ensure JwtAuthGuard is applied',
      );
    }
    return this._gimnasioId;
  }

  get personaId(): number | null {
    return this._personaId;
  }

  get usuarioId(): number {
    if (this._usuarioId === null) {
      throw new Error('Tenant context not initialized');
    }
    return this._usuarioId;
  }

  get jti(): string | null {
    return this._jti;
  }

  get rol(): string | null {
    return this._rol;
  }

  get isInitialized(): boolean {
    return this._gimnasioId !== null;
  }

  setFromPayload(payload: JwtPayload): void {
    this._gimnasioId = payload.gimnasioId ?? null;
    this._personaId = payload.personaId ?? null;
    this._usuarioId = payload.id ?? null;
    this._jti = payload.jti ?? null;
    this._rol = payload.rol ?? null;
  }

  toJSON(): TenantContext {
    return {
      gimnasioId: this.gimnasioId,
      personaId: this.personaId,
      usuarioId: this.usuarioId,
      jti: this.jti ?? '',
      rol: this.rol ?? '',
    };
  }
}
