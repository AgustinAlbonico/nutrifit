import { Injectable, Scope, Inject, Optional } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { JwtPayload } from 'src/domain/services/jwt.service';

export interface TenantContext {
  gimnasioId: number | null; // null for SUPERADMIN
  personaId: number | null;
  usuarioId: number;
  jti: string;
  rol: string;
  impersonatedBy: number | null;
}

export const TENANT_CONTEXT = Symbol('ITenantContext');

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private _gimnasioId: number | null = null;
  private _personaId: number | null = null;
  private _usuarioId: number | null = null;
  private _jti: string | null = null;
  private _rol: string | null = null;
  private _impersonatedBy: number | null = null;

  constructor(@Inject(REQUEST) @Optional() private readonly request?: Request) {
    if (request?.user) {
      const user = request.user as JwtPayload;
      this._gimnasioId = user.gimnasioId ?? null;
      this._personaId = user.personaId ?? null;
      this._usuarioId = user.id ?? null;
      this._jti = user.jti ?? null;
      this._rol = user.rol ?? null;
      this._impersonatedBy = user.impersonatedBy ?? null;
    }
  }

  get gimnasioId(): number {
    this.hydrateFromRequest();
    if (this._gimnasioId === null) {
      throw new Error(
        'Tenant context not initialized — ensure JwtAuthGuard is applied',
      );
    }
    return this._gimnasioId;
  }

  get personaId(): number | null {
    this.hydrateFromRequest();
    return this._personaId;
  }

  get usuarioId(): number {
    this.hydrateFromRequest();
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

  get impersonatedBy(): number | null {
    return this._impersonatedBy;
  }

  get isInitialized(): boolean {
    this.hydrateFromRequest();
    return this._gimnasioId !== null;
  }

  setFromPayload(payload?: JwtPayload): void {
    if (!payload && this.request?.user) {
      payload = this.request.user as JwtPayload;
    }
    if (!payload) {
      return;
    }
    this._gimnasioId = payload.gimnasioId ?? null;
    this._personaId = payload.personaId ?? null;
    this._usuarioId = payload.id ?? null;
    this._jti = payload.jti ?? null;
    this._rol = payload.rol ?? null;
    this._impersonatedBy = payload.impersonatedBy ?? null;
  }

  private hydrateFromRequest(): void {
    if (this._gimnasioId !== null) {
      return;
    }
    const user = this.request?.user as JwtPayload | undefined;
    if (!user) {
      return;
    }
    this._gimnasioId = user.gimnasioId ?? null;
    this._personaId = user.personaId ?? null;
    this._usuarioId = user.id ?? null;
    this._jti = user.jti ?? null;
    this._rol = user.rol ?? null;
    this._impersonatedBy = user.impersonatedBy ?? null;
  }

  toJSON(): TenantContext {
    return {
      gimnasioId: this.gimnasioId,
      personaId: this.personaId,
      usuarioId: this.usuarioId,
      jti: this.jti ?? '',
      rol: this.rol ?? '',
      impersonatedBy: this.impersonatedBy,
    };
  }
}
