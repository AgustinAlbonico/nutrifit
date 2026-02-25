import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
export declare class PlanSocioAccessGuard implements CanActivate {
    private readonly usuarioRepository;
    private readonly turnoRepository;
    private readonly planRepository;
    constructor(usuarioRepository: UsuarioRepository, turnoRepository: Repository<TurnoOrmEntity>, planRepository: Repository<PlanAlimentacionOrmEntity>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
