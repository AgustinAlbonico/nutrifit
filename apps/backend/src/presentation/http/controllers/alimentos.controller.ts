import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import {
  AlimentosSyncService,
  EstadoSyncAlimentos,
  ResultadoSyncAlimentos,
} from 'src/infrastructure/alimentos/alimentos-sync.service';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { GrupoAlimenticioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { GrupoAlimenticioDto } from 'src/application/alimentos/dtos/grupo-alimenticio.dto';
import { CrearAlimentoDto } from 'src/application/alimentos/dtos/crear-alimento.dto';
import { ActualizarAlimentoDto } from 'src/application/alimentos/dtos/actualizar-alimento.dto';
import { CrearAlimentoUseCase } from 'src/application/alimentos/use-cases/crear-alimento.use-case';
import { ActualizarAlimentoUseCase } from 'src/application/alimentos/use-cases/actualizar-alimento.use-case';
import { EliminarAlimentoUseCase } from 'src/application/alimentos/use-cases/eliminar-alimento.use-case';

export class AlimentoResponseDto {
  idAlimento: number;
  nombre: string;
  cantidad: number;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  unidadMedida: string;
  grupoAlimenticio: { id: number; descripcion: string } | null;
}

@Controller('alimentos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN, RolEnum.SOCIO)
export class AlimentosController {
  constructor(
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
    @InjectRepository(GrupoAlimenticioOrmEntity)
    private readonly grupoRepo: Repository<GrupoAlimenticioOrmEntity>,
    private readonly alimentosSyncService: AlimentosSyncService,
    private readonly crearAlimentoUseCase: CrearAlimentoUseCase,
    private readonly actualizarAlimentoUseCase: ActualizarAlimentoUseCase,
    private readonly eliminarAlimentoUseCase: EliminarAlimentoUseCase,
  ) {}

  @Get('grupos')
  async obtenerGruposAlimenticios(): Promise<GrupoAlimenticioDto[]> {
    const grupos = await this.grupoRepo.find({ order: { descripcion: 'ASC' } });
    return grupos.map((g) => ({
      idGrupoAlimenticio: g.idGrupoAlimenticio,
      descripcion: g.descripcion,
    }));
  }

  @Get('sync/estado')
  @Rol(RolEnum.ADMIN)
  async obtenerEstadoSync(): Promise<EstadoSyncAlimentos | null> {
    return this.alimentosSyncService.obtenerUltimoEstadoSync();
  }

  @Post('sync')
  @Rol(RolEnum.ADMIN)
  async sincronizarAlimentos(): Promise<ResultadoSyncAlimentos> {
    return this.alimentosSyncService.sincronizarCatalogo('manual');
  }

  @Post('sync/curar')
  @Rol(RolEnum.ADMIN)
  async curarAlimentos(): Promise<{
    eliminados: number;
    renombrados: number;
    duplicadosDetectados: number;
    ruidososDetectados: number;
  }> {
    return this.alimentosSyncService.curarCatalogoManual();
  }

  @Get()
  async listarAlimentos(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('grupoId') grupoId?: string,
  ): Promise<AlimentoResponseDto[]> {
    const take = limit ? Math.min(parseInt(limit, 10), 100) : 50;

    const where: any = {};
    if (search) {
      where.nombre = Like(`%${search}%`);
    }
    if (grupoId) {
      where.grupoAlimenticio = { idGrupoAlimenticio: parseInt(grupoId, 10) };
    }

    const alimentos = await this.alimentoRepo.find({
      where,
      take,
      order: { nombre: 'ASC' },
      relations: grupoId ? ['grupoAlimenticio'] : [],
    });

    return alimentos.map((a) => this.mapToResponse(a));
  }

  @Get(':id')
  async obtenerAlimento(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AlimentoResponseDto | null> {
    const alimento = await this.alimentoRepo.findOne({
      where: { idAlimento: id },
      relations: ['grupoAlimenticio'],
    });

    if (!alimento) {
      return null;
    }

    return this.mapToResponse(alimento);
  }

  @Post()
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  async crearAlimento(
    @Body() dto: CrearAlimentoDto,
  ): Promise<AlimentoResponseDto> {
    const alimento = await this.crearAlimentoUseCase.execute(dto);
    return this.mapToResponse(alimento);
  }

  @Put(':id')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  async actualizarAlimento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarAlimentoDto,
  ): Promise<AlimentoResponseDto> {
    const alimento = await this.actualizarAlimentoUseCase.execute(id, dto);
    return this.mapToResponse(alimento);
  }

  @Delete(':id')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  async eliminarAlimento(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.eliminarAlimentoUseCase.execute(id);
  }

  private mapToResponse(a: AlimentoOrmEntity): AlimentoResponseDto {
    // Manejar la relación ManyToMany - tomar el primer grupo si existe
    let grupoInfo: { id: number; descripcion: string } | null = null;
    if (a.grupoAlimenticio) {
      // Si es un array (ManyToMany), tomar el primer elemento
      const grupos = Array.isArray(a.grupoAlimenticio)
        ? a.grupoAlimenticio
        : [a.grupoAlimenticio];
      if (grupos.length > 0 && grupos[0]) {
        grupoInfo = {
          id: grupos[0].idGrupoAlimenticio,
          descripcion: grupos[0].descripcion,
        };
      }
    }

    return {
      idAlimento: a.idAlimento,
      nombre: a.nombre,
      cantidad: a.cantidad,
      calorias: a.calorias,
      proteinas: a.proteinas,
      carbohidratos: a.carbohidratos,
      grasas: a.grasas,
      unidadMedida: a.unidadMedida,
      grupoAlimenticio: grupoInfo,
    };
  }
}
