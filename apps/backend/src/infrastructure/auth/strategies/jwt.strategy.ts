// infrastructure/auth/strategies/jwt.strategy.ts
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Rol } from 'src/domain/entities/Usuario/Rol';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'super_secret', // poner en config real
    });
  }

  async validate(payload: { sub: number; email: string; role: Rol }) {
    // Esto se asigna a req.user
    return {
      idUsuario: payload.sub,
      email: payload.email,
      rol: payload.role,
    };
  }
}
