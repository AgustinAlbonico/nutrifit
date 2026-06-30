import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import type { PaginatedData } from '@nutrifit/shared';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { CrearPreparacionDto } from 'src/application/preparaciones/dtos';
import { ActualizarPreparacionDto } from 'src/application/preparaciones/dtos';
import { PreparacionResponseDto } from 'src/application/preparaciones/dtos';
import { CrearPreparacionUseCase } from 'src/application/preparaciones/use-cases';
import { ListarPreparacionesUseCase } from 'src/application/preparaciones/use-cases';
import { ObtenerPreparacionUseCase } from 'src/application/preparaciones/use-cases';
import { ActualizarPreparacionUseCase } from 'src/application/preparaciones/use-cases';
import { EliminarPreparacionUseCase } from 'src/application/preparaciones/use-cases';

@Controller('preparaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
export class PreparacionesController {
  constructor(
    private readonly crearPreparacionUseCase: CrearPreparacionUseCase,
    private readonly listarPreparacionesUseCase: ListarPreparacionesUseCase,
    private readonly obtenerPreparacionUseCase: ObtenerPreparacionUseCase,
    private readonly actualizarPreparacionUseCase: ActualizarPreparacionUseCase,
    private readonly eliminarPreparacionUseCase: EliminarPreparacionUseCase,
  ) {}

  @Get()
  async listar(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedData<PreparacionResponseDto>> {
    return this.listarPreparacionesUseCase.execute({ search, page, limit });
  }

  @Get(':id')
  async obtener(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PreparacionResponseDto> {
    return this.obtenerPreparacionUseCase.execute(id);
  }

  @Post()
  async crear(
    @Body() dto: CrearPreparacionDto,
  ): Promise<PreparacionResponseDto> {
    return this.crearPreparacionUseCase.execute(dto);
  }

  @Put(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarPreparacionDto,
  ): Promise<PreparacionResponseDto> {
    return this.actualizarPreparacionUseCase.execute(id, dto);
  }

  @Delete(':id')
  async eliminar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.eliminarPreparacionUseCase.execute(id);
  }
}
