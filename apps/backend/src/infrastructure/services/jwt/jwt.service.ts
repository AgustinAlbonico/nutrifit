import { Injectable } from '@nestjs/common';
import { IJwtService } from 'src/domain/services/jwt.service';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { UnauthorizedError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class JwtServiceImpl implements IJwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  sign(payload: object): string {
    return this.jwtService.sign(payload);
  }

  verify<T extends object>(token: string): T {
    try {
      return this.jwtService.verify<T>(token);
    } catch (error) {
      console.error('Error verifying JWT:', error);
      throw new UnauthorizedError('Token invalido o expirado');
    }
  }
}
