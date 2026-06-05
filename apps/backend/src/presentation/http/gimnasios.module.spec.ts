import { Test, TestingModule } from '@nestjs/testing';
import { GimnasiosModule } from './gimnasios.module';
import { GIMNASIO_REPOSITORY } from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { USUARIO_REPOSITORY } from 'src/domain/entities/Usuario/usuario.repository';
import { JWT_SERVICE } from 'src/domain/services/jwt.service';
import { IJwtService } from 'src/domain/services/jwt.service';
import { ImpersonarUsuarioUseCase } from 'src/application/gimnasios/use-cases/impersonar-usuario.use-case';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';

function mockUsuarioRepository() {
  return {
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findPersonaIdByUserId: jest.fn(),
    findPerfilByUserId: jest.fn(),
    findByPersonaId: jest.fn(),
  };
}

function mockJwtService(): IJwtService {
  return { sign: jest.fn(), verify: jest.fn() } as unknown as IJwtService;
}

describe('GimnasiosModule DI', () => {
  /**
   * Regression test: verifies the module no longer declares class-token dummy providers
   * for UsuarioRepository or JWT_SERVICE that would cause Nest to try to instantiate
   * the abstract UsuarioRepository class directly (leading to metatype undefined errors).
   *
   * The proper providers come from RepositoriesModule (USUARIO_REPOSITORY symbol)
   * and AuthModule (JWT_SERVICE symbol) imported at the app root level.
   */
  it('should NOT have class-token dummy providers for UsuarioRepository or JWT_SERVICE', async () => {
    const moduleMetadata = Reflect.getMetadata(
      'providers',
      GimnasiosModule,
    ) as any[];
    const providerTokens = moduleMetadata?.map((p) => p.provide) ?? [];

    // Neither the abstract class nor the symbol should appear as a plain
    // class-token provider (which would cause Nest to try to newUsuarioRepository()).
    expect(providerTokens).not.toContain(UsuarioRepository);
    expect(providerTokens).not.toContain(USUARIO_REPOSITORY);
    expect(providerTokens).not.toContain(JWT_SERVICE);
  });

  /**
   * Functional regression test: ImpersonarUsuarioUseCase must resolve via the
   * USUARIO_REPOSITORY symbol token (from RepositoriesModule), not via a dummy provider.
   */
  it('should resolve ImpersonarUsuarioUseCase via symbol tokens only', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpersonarUsuarioUseCase,
        { provide: USUARIO_REPOSITORY, useValue: mockUsuarioRepository() },
        {
          provide: GIMNASIO_REPOSITORY,
          useValue: { findById: jest.fn(), findActivos: jest.fn() },
        },
        { provide: JWT_SERVICE, useValue: mockJwtService() },
      ],
    }).compile();

    const useCase = module.get(ImpersonarUsuarioUseCase);
    expect(useCase).toBeDefined();
    expect(useCase['usuarioRepository']).toBeDefined();
  });
});
