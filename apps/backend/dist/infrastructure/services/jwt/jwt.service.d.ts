import { IJwtService } from 'src/domain/services/jwt.service';
import { JwtService as NestJwtService } from '@nestjs/jwt';
export declare class JwtServiceImpl implements IJwtService {
    private readonly jwtService;
    constructor(jwtService: NestJwtService);
    sign(payload: object): string;
    verify<T extends object>(token: string): T;
}
