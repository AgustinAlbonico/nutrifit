import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { TokenRevocadoOrmEntity } from '../entities/token-revocado.entity';
import {
  TokenRevocado,
  TokenRevocadoRepository,
} from 'src/domain/repositories/token-revocado.repository';

@Injectable()
export class TokenRevocadoRepositoryImplementation
  implements TokenRevocadoRepository
{
  constructor(
    @InjectRepository(TokenRevocadoOrmEntity)
    private readonly ormRepo: Repository<TokenRevocadoOrmEntity>,
  ) {}

  async save(token: TokenRevocado): Promise<void> {
    await this.ormRepo
      .createQueryBuilder()
      .insert()
      .into(TokenRevocadoOrmEntity)
      .values({
        jti: token.jti,
        usuarioId: token.usuarioId,
        gimnasioId: token.gimnasioId,
        expiresAt: token.expiresAt,
      })
      .orIgnore()
      .execute();
  }

  async existeJti(jti: string): Promise<boolean> {
    const count = await this.ormRepo.count({ where: { jti } });
    return count > 0;
  }

  async purgarExpirados(): Promise<number> {
    const result = await this.ormRepo.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected ?? 0;
  }
}