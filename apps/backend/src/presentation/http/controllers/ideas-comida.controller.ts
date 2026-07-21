import {
  Body,
  Controller,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
import { GenerarIdeasComidaUseCase } from 'src/application/planes-alimentacion/use-cases/generar-ideas-comida.use-case';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { Actions } from 'src/infrastructure/auth/decorators/actions.decorator';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { CurrentUser } from 'src/infrastructure/auth/decorators/current-user.decorator';
import { ACCIONES } from '@nutrifit/shared';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';

export class GenerarIdeasComidaRequestDto {
  @IsEnum(DiaSemana)
  dia!: DiaSemana;

  @IsEnum(TipoComida)
  tipoComida!: TipoComida;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  cantidadAlternativas?: number;
}

@Controller('planes-alimentacion/:id/ideas-comida')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class IdeasComidaController {
  constructor(
    private readonly generarIdeasComidaUseCase: GenerarIdeasComidaUseCase,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  @Post()
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  @Actions(ACCIONES.PLANES_IDEAS_GENERAR)
  async generar(
    @CurrentUser()
    user: {
      id: number;
      personaId: number;
      gimnasioId: number;
      rol: RolEnum;
    },
    @Param('id', ParseIntPipe) planId: number,
    @Body() body: GenerarIdeasComidaRequestDto,
  ) {
    return this.generarIdeasComidaUseCase.execute(user, {
      planAlimentacionId: planId,
      dia: body.dia,
      tipoComida: body.tipoComida,
      cantidadAlternativas: body.cantidadAlternativas,
    });
  }
}
