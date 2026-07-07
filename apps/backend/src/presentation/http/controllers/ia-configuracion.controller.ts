import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { GuardarIaConfiguracionDto } from 'src/application/ia-configuracion/dto/guardar-ia-configuracion.dto';
import { IaConfiguracionService } from 'src/application/ia-configuracion/ia-configuracion.service';
import { ProveedorIa } from 'src/application/ia-configuracion/ia-configuracion.types';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';

@Controller('admin/ia-configuracion')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
@Rol(RolEnum.SUPERADMIN)
export class IaConfiguracionController {
  constructor(
    private readonly iaConfiguracionService: IaConfiguracionService,
  ) {}

  @Get()
  obtenerTodas() {
    return this.iaConfiguracionService.obtenerTodas();
  }

  @Get(':provider')
  obtenerPorProvider(@Param('provider') provider: ProveedorIa) {
    return this.iaConfiguracionService.obtenerPorProvider(provider);
  }

  @Post('restart')
  solicitarReinicio() {
    return {
      requiereReinicio: true,
      mensaje:
        'Configuración guardada. Reiniciá el backend manualmente con Ctrl+C y npm run dev:backend.',
    };
  }

  @Post(':provider')
  guardar(
    @Param('provider') provider: ProveedorIa,
    @Body() dto: GuardarIaConfiguracionDto,
  ) {
    return this.iaConfiguracionService.guardar(provider, dto);
  }

  @Delete(':provider')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('provider') provider: ProveedorIa) {
    return this.iaConfiguracionService.eliminar(provider);
  }

  @Post(':provider/test')
  probarConexion(
    @Param('provider') provider: ProveedorIa,
    @Body() dto: GuardarIaConfiguracionDto = {},
  ) {
    return this.iaConfiguracionService.probarConexion(provider, dto);
  }

  @Post(':provider/modelos')
  async obtenerModelos(
    @Param('provider') provider: ProveedorIa,
    @Body() dto: GuardarIaConfiguracionDto = {},
  ) {
    return this.iaConfiguracionService.obtenerModelosRemotos(provider, dto);
  }
}
