import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { In } from 'typeorm';
import { Not } from 'typeorm';
import { AccionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/accion.entity';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { CreateAccionDto } from './dtos/create-accion.dto';
import { CreateGrupoPermisoDto } from './dtos/create-grupo-permiso.dto';
import { UpdateAccionDto } from './dtos/update-accion.dto';
import { UpdateGrupoPermisoDto } from './dtos/update-grupo-permiso.dto';

@Injectable()
export class PermisosService {
  constructor(
    @InjectRepository(AccionOrmEntity)
    private readonly accionRepository: Repository<AccionOrmEntity>,
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoRepository: Repository<GrupoPermisoOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
  ) {}

  async listarAcciones(): Promise<AccionOrmEntity[]> {
    return this.accionRepository.find({ order: { clave: 'ASC' } });
  }

  async crearAccion(_dto: CreateAccionDto): Promise<AccionOrmEntity> {
    throw new BadRequestException(
      'Las acciones se administran por seed. No se permite crear acciones manualmente.',
    );
  }

  async actualizarAccion(
    actionId: number,
    dto: UpdateAccionDto,
  ): Promise<AccionOrmEntity> {
    const accion = await this.accionRepository.findOne({
      where: { id: actionId },
    });

    if (!accion) {
      throw new NotFoundException('Accion no encontrada');
    }

    const existe = await this.accionRepository.findOne({
      where: {
        clave: dto.clave,
        id: Not(actionId),
      },
    });

    if (existe) {
      throw new BadRequestException('La accion ya existe');
    }

    accion.clave = dto.clave;
    accion.nombre = dto.nombre;
    accion.descripcion = dto.descripcion ?? null;

    return this.accionRepository.save(accion);
  }

  async listarUsuarios(query?: string): Promise<UsuarioOrmEntity[]> {
    const usuarios = await this.usuarioRepository.find({
      relations: {
        grupos: true,
        acciones: true,
      },
    });

    if (!query) return usuarios;

    const lowerQuery = query.toLowerCase();
    return usuarios.filter(
      (u) =>
        u.email.toLowerCase().includes(lowerQuery) ||
        u.idUsuario?.toString() === lowerQuery,
    );
  }

  async listarUsuariosPaginado(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{
    data: UsuarioOrmEntity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const { page, limit, search, isActive } = params;
    const skip = (page - 1) * limit;

    // Construir query builder con relaciones
    const queryBuilder = this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.persona', 'persona')
      .leftJoinAndSelect('usuario.grupos', 'grupos')
      .leftJoinAndSelect('usuario.acciones', 'acciones');

    // Filtro por búsqueda (email, nombre, apellido)
    if (search) {
      queryBuilder.andWhere(
        '(usuario.email LIKE :search OR persona.nombre LIKE :search OR persona.apellido LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filtro por estado activo (si existe el campo)
    // Nota: La entidad actual no tiene campo isActive, se omite por ahora

    // Contar total
    const total = await queryBuilder.getCount();

    // Aplicar paginación
    queryBuilder.skip(skip).take(limit);

    // Ejecutar query
    const [usuarios] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: usuarios,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async listarGrupos(): Promise<GrupoPermisoOrmEntity[]> {
    return this.grupoRepository.find({
      relations: { acciones: true, hijos: true },
      order: { clave: 'ASC' },
    });
  }

  async crearGrupo(dto: CreateGrupoPermisoDto): Promise<GrupoPermisoOrmEntity> {
    const existe = await this.grupoRepository.findOne({
      where: { clave: dto.clave },
    });

    if (existe) {
      throw new BadRequestException('El grupo ya existe');
    }

    const grupo = this.grupoRepository.create({
      clave: dto.clave,
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      acciones: [],
      hijos: [],
    });

    return this.grupoRepository.save(grupo);
  }

  async actualizarGrupo(
    groupId: number,
    dto: UpdateGrupoPermisoDto,
  ): Promise<GrupoPermisoOrmEntity> {
    const grupo = await this.grupoRepository.findOne({
      where: { id: groupId },
      relations: { acciones: true, hijos: true },
    });

    if (!grupo) {
      throw new NotFoundException('Grupo no encontrado');
    }

    const existe = await this.grupoRepository.findOne({
      where: {
        clave: dto.clave,
        id: Not(groupId),
      },
    });

    if (existe) {
      throw new BadRequestException('El grupo ya existe');
    }

    grupo.clave = dto.clave;
    grupo.nombre = dto.nombre;
    grupo.descripcion = dto.descripcion ?? null;

    return this.grupoRepository.save(grupo);
  }

  async asignarAccionesAGrupo(
    groupId: number,
    actionIds: number[],
  ): Promise<GrupoPermisoOrmEntity> {
    const grupo = await this.grupoRepository.findOne({
      where: { id: groupId },
      relations: { acciones: true },
    });

    if (!grupo) {
      throw new NotFoundException('Grupo no encontrado');
    }

    const acciones = await this.accionRepository.find({
      where: { id: In(actionIds) },
    });
    if (acciones.length !== actionIds.length) {
      throw new BadRequestException('Una o mas acciones no existen');
    }

    grupo.acciones = acciones;
    return this.grupoRepository.save(grupo);
  }

  async asignarGruposAUsuario(
    userId: number,
    groupIds: number[],
  ): Promise<UsuarioOrmEntity> {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: userId },
      relations: { grupos: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const grupos = await this.grupoRepository.find({
      where: { id: In(groupIds) },
    });
    if (grupos.length !== groupIds.length) {
      throw new BadRequestException('Uno o mas grupos no existen');
    }

    usuario.grupos = grupos;
    return this.usuarioRepository.save(usuario);
  }

  async asignarAccionesAUsuario(
    userId: number,
    actionIds: number[],
  ): Promise<UsuarioOrmEntity> {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: userId },
      relations: { acciones: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const acciones = await this.accionRepository.find({
      where: { id: In(actionIds) },
    });
    if (acciones.length !== actionIds.length) {
      throw new BadRequestException('Una o mas acciones no existen');
    }

    usuario.acciones = acciones;
    return this.usuarioRepository.save(usuario);
  }

  async getAccionesEfectivasUsuario(userId: number): Promise<string[]> {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: userId },
      relations: { acciones: true, grupos: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const claves = new Set<string>();

    for (const accion of usuario.acciones ?? []) {
      claves.add(accion.clave);
    }

    const visitados = new Set<number>();
    for (const grupo of usuario.grupos ?? []) {
      const accionesDeGrupo = await this.obtenerAccionesDeGrupoRecursivo(
        grupo.id,
        visitados,
      );
      for (const accion of accionesDeGrupo) {
        claves.add(accion.clave);
      }
    }

    return Array.from(claves).sort();
  }

  async hasAllActions(
    userId: number,
    requiredActions: string[],
  ): Promise<boolean> {
    if (!requiredActions.length) {
      return true;
    }

    const claves = await this.getAccionesEfectivasUsuario(userId);
    const set = new Set(claves);
    return requiredActions.every((action) => set.has(action));
  }

  private async obtenerAccionesDeGrupoRecursivo(
    groupId: number,
    visitados: Set<number>,
  ): Promise<AccionOrmEntity[]> {
    if (visitados.has(groupId)) {
      return [];
    }

    visitados.add(groupId);

    const grupo = await this.grupoRepository.findOne({
      where: { id: groupId },
      relations: { acciones: true, hijos: true },
    });

    if (!grupo) {
      return [];
    }

    const map = new Map<number, AccionOrmEntity>();

    for (const accion of grupo.acciones ?? []) {
      map.set(accion.id, accion);
    }

    for (const hijo of grupo.hijos ?? []) {
      const accionesHijo = await this.obtenerAccionesDeGrupoRecursivo(
        hijo.id,
        visitados,
      );

      for (const accion of accionesHijo) {
        map.set(accion.id, accion);
      }
    }

    return Array.from(map.values());
  }
}
