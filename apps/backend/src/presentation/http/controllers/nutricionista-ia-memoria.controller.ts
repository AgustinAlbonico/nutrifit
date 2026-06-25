import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { Actions } from 'src/infrastructure/auth/decorators/actions.decorator';
import { CurrentUser } from 'src/infrastructure/auth/decorators/current-user.decorator';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import {
  EliminarMemoriaUseCase,
  ListarMemoriaUseCase,
} from 'src/application/ia-memoria/use-cases';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { Inject } from '@nestjs/common';

/**
 * NutricionistaIaMemoriaController
 * =================================
 *
 * Endpoints para que el nutricionista gestione su memoria IA (pocas
 * entradas que se inyectan al prompt como few-shot).
 *
 * - GET /nutricionistai/memoria          → lista memoria activa + archivadas.
 * - DELETE /nutricionistai/memoria/:id   → archiva (soft) una entrada.
 *
 * RBAC: PLANES_IA_MEMORIA_EDITAR (solo nutricionista dueño).
 */
@Controller('nutricionistai/memoria')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class NutricionistaIaMemoriaController {
  constructor(
    private readonly listarMemoriaUseCase: ListarMemoriaUseCase,
    private readonly eliminarMemoriaUseCase: EliminarMemoriaUseCase,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  @Get()
  @Rol(RolEnum.NUTRICIONISTA)
  @Actions('PLANES_IA_MEMORIA_EDITAR')
  async listar(
    @CurrentUser()
    user: {
      id: number;
      rol: RolEnum;
      personaId: number | null;
      gimnasioId: number | null;
    },
  ): Promise<unknown> {
    if (user.personaId == null) {
      return { positivos: [], negativos: [], totalActivas: 0, archivadas: 0 };
    }
    this.logger.log(`Listando memoria IA del nutricionista ${user.personaId}.`);
    return this.listarMemoriaUseCase.execute({
      nutricionistaId: user.personaId,
    });
  }

  @Delete(':id')
  @Rol(RolEnum.NUTRICIONISTA)
  @Actions('PLANES_IA_MEMORIA_EDITAR')
  @HttpCode(204)
  async eliminar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser()
    user: {
      id: number;
      rol: RolEnum;
      personaId: number | null;
      gimnasioId: number | null;
    },
  ): Promise<void> {
    this.logger.log(`Archivando memoria IA ${id} por usuario ${user.id}.`);
    await this.eliminarMemoriaUseCase.execute({
      memoriaId: id,
      user: {
        id: user.id,
        rol: user.rol,
        personaId: user.personaId,
        gimnasioId: user.gimnasioId,
      },
    });
  }
}
