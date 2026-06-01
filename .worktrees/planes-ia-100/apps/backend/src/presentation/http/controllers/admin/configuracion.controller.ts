import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { GimnasioRepository } from 'src/infrastructure/persistence/typeorm/repositories/gimnasio.repository';
import {
  ConfiguracionGimnasioDto,
  UpdateConfiguracionGimnasioDto,
} from 'src/application/reportes/dtos/configuracion-gimnasio.dto';

@Controller('configuracion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConfiguracionController {
  constructor(private readonly gimnasioRepository: GimnasioRepository) {}

  @Get('gimnasio')
  @Rol(RolEnum.ADMIN)
  async getConfiguracion(): Promise<ConfiguracionGimnasioDto> {
    const gimnasio = await this.gimnasioRepository.findFirst();
    if (!gimnasio) {
      throw new Error('No se encontró configuración del gimnasio');
    }
    return this.gimnasioRepository.toDto(gimnasio);
  }

  @Put('gimnasio')
  @Rol(RolEnum.ADMIN)
  async updateConfiguracion(
    @Body() data: UpdateConfiguracionGimnasioDto,
  ): Promise<ConfiguracionGimnasioDto> {
    const gimnasio = await this.gimnasioRepository.findFirst();
    if (!gimnasio) {
      throw new Error('No se encontró configuración del gimnasio');
    }
    const updated = await this.gimnasioRepository.update(
      gimnasio.idGimnasio,
      data,
    );
    return this.gimnasioRepository.toDto(updated);
  }
}
