import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, Not } from 'typeorm';
import { AccionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/accion.entity';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { UsuarioGrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario-grupo-permiso.entity';
import { CreateAccionDto } from './dtos/create-accion.dto';
import { CreateGrupoPermisoDto } from './dtos/create-grupo-permiso.dto';
import { UpdateAccionDto } from './dtos/update-accion.dto';
import { UpdateGrupoPermisoDto } from './dtos/update-grupo-permiso.dto';
import { normalizarTexto } from 'src/common/utils/text.util';
import { stripAccentsLowerSql } from 'src/common/utils/sql-text.util';

@Injectable()
export class PermisosService {
  constructor(
    @InjectRepository(UsuarioGrupoPermisoOrmEntity)
    private readonly usuarioGrupoRepo: Repository<UsuarioGrupoPermisoOrmEntity>,
    @InjectRepository(AccionOrmEntity)
    private readonly accionRepository: Repository<AccionOrmEntity>,
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoRepository: Repository<GrupoPermisoOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
  ) {}

  /**
   * Obtiene todas las acciones efectivas de un usuario (union de grupos).
   * Incluye expansion de wildcards (ej: 'socios.*' se expande a todas las acciones 'socios.*')
   */
  async getUserActions(usuarioId: number): Promise<string[]> {
    const grupos = await this.getUserGroups(usuarioId);
    const acciones = new Set<string>();
    for (const grupo of grupos) {
      for (const accion of grupo.acciones ?? []) {
        acciones.add(accion.clave);
      }
    }
    return Array.from(acciones);
  }

  /**
   * Expande un wildcard a todas las acciones posibles.
   * Ej: 'socios.*' -> ['socios.crear', 'socios.editar', 'socios.eliminar', 'socios.ver']
   */
  private expandirWildcard(
    wildcard: string,
    todasLasAcciones: string[],
  ): string[] {
    if (!wildcard.endsWith('.*')) {
      return [wildcard];
    }
    const prefijo = wildcard.slice(0, -2); // 'socios.*' -> 'socios'
    // Filtrar acciones que matcheen con el prefijo (ej: 'socios.crear'.startsWith('socios.'))
    return todasLasAcciones.filter((a) => a.startsWith(prefijo + '.'));
  }

  /**
   * Obtiene todas las acciones disponibles en el sistema.
   * Se usa para expandir wildcards.
   */
  private getAllSystemActions(): string[] {
    // Lista de todas las acciones conocidas del sistema
    return [
      'socios.crear',
      'socios.editar',
      'socios.eliminar',
      'socios.ver',
      'nutricionistas.crear',
      'nutricionistas.editar',
      'nutricionistas.eliminar',
      'nutricionistas.ver',
      'recepcionistas.crear',
      'recepcionistas.editar',
      'recepcionistas.eliminar',
      'recepcionistas.ver',
      'turnos.crear',
      'turnos.editar',
      'turnos.cancelar',
      'turnos.ver',
      'turnos.reservar',
      'fichas.ver',
      'fichas.editar',
      'mi-ficha.ver',
      'planes.crear',
      'planes.editar',
      'planes.ver',
      'mis-planes.ver',
      'pacientes.ver',
      'reportes.generar',
      'reportes.ver',
      'gimnasios.crear',
      'gimnasios.editar',
      'gimnasios.eliminar',
      'gimnasios.ver',
      'gimnasios.impersonar',
    ];
  }

  /**
   * Verifica si el usuario tiene TODAS las acciones requeridas.
   * Soporta wildcards (ej: 'socios.*' cubre cualquier accion 'socios.X')
   */
  async hasAllActions(
    usuarioId: number,
    requiredActions: string[],
  ): Promise<boolean> {
    if (!requiredActions.length) {
      return true;
    }
    const userActions = await this.getUserActions(usuarioId);
    const systemActions = this.getAllSystemActions();
    // Expandir wildcards del usuario
    const expandedUserActions = new Set<string>();
    for (const action of userActions) {
      if (action.endsWith('.*')) {
        const expanded = this.expandirWildcard(action, systemActions);
        for (const e of expanded) {
          expandedUserActions.add(e);
        }
      } else {
        expandedUserActions.add(action);
      }
    }
    // Verificar exact match
    return requiredActions.every((action) => expandedUserActions.has(action));
  }

  /**
   * Verifica si el usuario tiene AL MENOS UNA de las acciones especificadas.
   * Soporta wildcards.
   */
  async hasAnyAction(usuarioId: number, actions: string[]): Promise<boolean> {
    if (!actions.length) {
      return true;
    }
    const userActions = await this.getUserActions(usuarioId);
    const systemActions = this.getAllSystemActions();
    // Expandir wildcards del usuario
    const expandedUserActions = new Set<string>();
    for (const action of userActions) {
      if (action.endsWith('.*')) {
        const expanded = this.expandirWildcard(action, systemActions);
        for (const e of expanded) {
          expandedUserActions.add(e);
        }
      } else {
        expandedUserActions.add(action);
      }
    }
    return actions.some((action) => expandedUserActions.has(action));
  }

  /**
   * Obtiene los grupos de permisos de un usuario.
   * Si gimnasioId esta definido, filtra por gimnasio (null = aplica a todos).
   */
  async getUserGroups(
    usuarioId: number,
    gimnasioId?: number | null,
  ): Promise<GrupoPermisoOrmEntity[]> {
    const where: Record<string, unknown> = {
      usuario: { idUsuario: usuarioId },
    };

    if (gimnasioId !== undefined) {
      // Include global (gimnasioId=null) and specific gym using OR
      const qb = this.usuarioGrupoRepo.createQueryBuilder('ugp');
      qb.leftJoinAndSelect('ugp.grupoPermiso', 'grupoPermiso')
        .leftJoinAndSelect('grupoPermiso.acciones', 'accion')
        .where('ugp.usuario_id_usuario = :usuarioId', { usuarioId })
        .andWhere(
          '(ugp.id_gimnasio IS NULL OR ugp.id_gimnasio = :gimnasioId)',
          { gimnasioId },
        );
      const asignaciones = await qb.getMany();
      return asignaciones.map((a) => a.grupoPermiso);
    }

    const asignaciones = await this.usuarioGrupoRepo.find({
      where,
      relations: ['grupoPermiso', 'grupoPermiso.acciones'],
    });
    return asignaciones.map((a) => a.grupoPermiso);
  }

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
        usuariosGruposPermisos: { grupoPermiso: { acciones: true } },
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
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    // Construir query builder con relaciones
    const queryBuilder = this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.persona', 'persona')
      .leftJoinAndSelect('usuario.usuariosGruposPermisos', 'ugp')
      .leftJoinAndSelect('ugp.grupoPermiso', 'grupo')
      .leftJoinAndSelect('grupo.acciones', 'accion')
      .leftJoinAndSelect('usuario.acciones', 'usuarioAccion');

    // Filtro por búsqueda (email, nombre, apellido)
    if (search) {
      const termino = `%${normalizarTexto(search)}%`;
      queryBuilder.andWhere(
        `(LOWER(usuario.email) LIKE :searchEmail OR ${stripAccentsLowerSql(
          'LOWER(persona.nombre)',
        )} LIKE :search OR ${stripAccentsLowerSql(
          'LOWER(persona.apellido)',
        )} LIKE :search)`,
        {
          search: termino,
          searchEmail: `%${search.toLowerCase()}%`,
        },
      );
    }

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

    // Eliminar asignaciones existentes
    await this.usuarioGrupoRepo.delete({ usuario: { idUsuario: userId } });

    // Crear nuevas asignaciones
    const asignaciones = grupos.map((grupo) =>
      this.usuarioGrupoRepo.create({ usuario, grupoPermiso: grupo }),
    );
    await this.usuarioGrupoRepo.save(asignaciones);

    return this.usuarioRepository.findOne({
      where: { idUsuario: userId },
      relations: {
        usuariosGruposPermisos: { grupoPermiso: { acciones: true } },
      },
    }) as Promise<UsuarioOrmEntity>;
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
    return this.getUserActions(userId);
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
