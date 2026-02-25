import { AlimentoResponseDto, DiaPlanResponseDto, OpcionComidaResponseDto, PlanAlimentacionResponseDto } from '../dtos';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { OpcionComidaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/opcion-comida.entity';
import { DiaPlanOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/dia-plan.entity';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
export declare function mapAlimentoToResponse(alimento: AlimentoOrmEntity): AlimentoResponseDto;
export declare function mapOpcionToResponse(opcion: OpcionComidaOrmEntity): OpcionComidaResponseDto;
export declare function mapDiaToResponse(dia: DiaPlanOrmEntity): DiaPlanResponseDto;
export declare function mapPlanToResponse(plan: PlanAlimentacionOrmEntity): PlanAlimentacionResponseDto;
