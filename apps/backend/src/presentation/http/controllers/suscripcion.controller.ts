import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IniciarRegistroSuscripcionUseCase } from 'src/application/suscripciones/use-cases/iniciar-registro-suscripcion.use-case';
import { ProcesarPagoSimuladoUseCase } from 'src/application/suscripciones/use-cases/procesar-pago-simulado.use-case';
import { VerEstadoSuscripcionUseCase } from 'src/application/suscripciones/use-cases/ver-estado-suscripcion.use-case';
import {
  GIMNASIO_REPOSITORY,
  GimnasioRepository,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';

@ApiTags('Suscripciones')
@Controller('suscripciones')
export class SuscripcionController {
  constructor(
    private readonly iniciarRegistroUseCase: IniciarRegistroSuscripcionUseCase,
    private readonly procesarPagoUseCase: ProcesarPagoSimuladoUseCase,
    private readonly verEstadoUseCase: VerEstadoSuscripcionUseCase,
    @Inject(GIMNASIO_REPOSITORY)
    private readonly gimnasioRepository: GimnasioRepository,
  ) {}

  @Post('registro')
  @ApiOperation({ summary: 'Registro público de gimnasio + admin + suscripción' })
  async registrar(@Body() body: {
    gimnasio: {
      nombre: string;
      direccion: string;
      telefono?: string;
      email?: string;
    };
    admin: { nombre: string; email: string; password: string };
  }) {
    return this.iniciarRegistroUseCase.execute(body);
  }

  @Post(':uuid/pagar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Procesar pago simulado (aprobar/rechazar)' })
  async pagar(
    @Param('uuid') uuid: string,
    @Body() body: { accion: 'aprobar' | 'rechazar' },
  ) {
    return this.procesarPagoUseCase.execute({ uuid, accion: body.accion });
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Obtener datos de suscripción por UUID (público)' })
  async obtenerPorUuid(@Param('uuid') uuid: string) {
    const data = await this.verEstadoUseCase.executePorUuid(uuid);
    const gym = await this.gimnasioRepository.findById(data.gimnasioId);
    return { ...data, gymNombre: gym?.nombre ?? 'Gimnasio' };
  }

  @Get('gimnasio/:gimnasioId/estado')
  @ApiOperation({ summary: 'Obtener estado de suscripción por gimnasioId' })
  async obtenerPorGimnasio(
    @Param('gimnasioId', ParseIntPipe) gimnasioId: number,
  ) {
    return this.verEstadoUseCase.execute(gimnasioId);
  }
}
