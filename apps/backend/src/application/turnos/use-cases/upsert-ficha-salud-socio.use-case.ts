import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  FichaSaludSocioResponseDto,
  UpsertFichaSaludSocioDto,
} from 'src/application/turnos/dtos';
import { calcularDiffFicha } from 'src/application/turnos/helpers/calcular-diff-ficha.helper';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import {
  AlergiaOrmEntity,
  FichaSaludOrmEntity,
  FichaSaludVersionOrmEntity,
  PatologiaOrmEntity,
  SocioOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';

@Injectable()
export class UpsertFichaSaludSocioUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaSaludRepository: Repository<FichaSaludOrmEntity>,
    @InjectRepository(FichaSaludVersionOrmEntity)
    private readonly fichaSaludVersionRepository: Repository<FichaSaludVersionOrmEntity>,
    @InjectRepository(AlergiaOrmEntity)
    private readonly alergiaRepository: Repository<AlergiaOrmEntity>,
    @InjectRepository(PatologiaOrmEntity)
    private readonly patologiaRepository: Repository<PatologiaOrmEntity>,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly tenantContext: TenantContextService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async execute(
    userId: number,
    payload: UpsertFichaSaludSocioDto,
  ): Promise<FichaSaludSocioResponseDto> {
    const socio = await this.resolveSocioByUserId(userId);

    const alergias = await this.resolveAlergias(payload.alergias ?? []);
    const patologias = await this.resolvePatologias(payload.patologias ?? []);

    const esCreacion = !socio.fichaSalud;
    const ahora = new Date();

    // Validación semántica del consentimiento (RB44): solo se exige en creación.
    if (esCreacion && payload.consentimiento !== true) {
      throw new BadRequestError(
        'Se requiere consentimiento expreso para almacenar la ficha.',
      );
    }

    // Snapshot del estado anterior (solo para auditoría en UPDATE).
    // Hacemos una copia superficial — basta para que `calcularDiffFicha`
    // detecte cambios en campos primitivos y arrays de strings.
    const snapshotAnterior: Record<string, unknown> | null = socio.fichaSalud
      ? {
          altura: socio.fichaSalud.altura,
          peso: socio.fichaSalud.peso,
          nivelActividadFisica: socio.fichaSalud.nivelActividadFisica,
          objetivoPersonal: socio.fichaSalud.objetivoPersonal,
          alergias: (socio.fichaSalud.alergias ?? []).map((a) => a.nombre),
          patologias: (socio.fichaSalud.patologias ?? []).map((p) => p.nombre),
        }
      : null;

    const fichaResultado = await this.dataSource.transaction(async (manager) => {
      const fichaRepo = manager.getRepository(FichaSaludOrmEntity);
      const versionRepo = manager.getRepository(FichaSaludVersionOrmEntity);

      let ficha = socio.fichaSalud as FichaSaludOrmEntity | null;

      if (!ficha) {
        ficha = new FichaSaludOrmEntity();
        ficha.completada = true;
        ficha.completadaAt = ahora;
        ficha.consentAt = ahora;
      } else {
        // Edición: solo actualizamos actualizadaAt.
        // NO tocamos consentAt (RB44: consentimiento es una sola vez).
        ficha.actualizadaAt = ahora;
      }

      // Mapear todos los campos del payload
      ficha.altura = payload.altura;
      ficha.peso = payload.peso;
      ficha.nivelActividadFisica = payload.nivelActividadFisica;
      ficha.objetivoPersonal = payload.objetivoPersonal;
      ficha.alergias = alergias;
      ficha.patologias = patologias;
      // --- Medicación y suplementos ---
      ficha.medicacionActual = payload.medicacionActual ?? null;
      ficha.suplementosActuales = payload.suplementosActuales ?? null;
      // --- Historial médico ---
      ficha.cirugiasPrevias = payload.cirugiasPrevias ?? null;
      ficha.antecedentesFamiliares = payload.antecedentesFamiliares ?? null;
      // --- Hábitos alimentarios ---
      ficha.frecuenciaComidas = payload.frecuenciaComidas ?? null;
      ficha.consumoAguaDiario = payload.consumoAguaDiario ?? null;
      ficha.restriccionesAlimentarias =
        payload.restriccionesAlimentarias ?? null;
      // --- Hábitos de vida ---
      ficha.consumoAlcohol = payload.consumoAlcohol ?? null;
      ficha.fumaTabaco = payload.fumaTabaco ?? false;
      ficha.horasSueno = payload.horasSueno ?? null;
      // --- Contacto de emergencia ---
      ficha.contactoEmergenciaNombre = payload.contactoEmergenciaNombre ?? null;
      ficha.contactoEmergenciaTelefono =
        payload.contactoEmergenciaTelefono ?? null;

      const fichaGuardada = await fichaRepo.save(ficha);

      // Calcular nueva versión con pessimistic lock para evitar race conditions.
      // Si dos PATCH concurrentes llegan, una transacción espera a la otra
      // y obtiene la versión siguiente.
      const ultimaVersionRow: Array<{ max: number | null }> =
        await manager.query(
          `SELECT MAX(version) AS max
             FROM ficha_salud_version
             WHERE id_ficha_salud = ?
             FOR UPDATE`,
          [fichaGuardada.idFichaSalud],
        );

      const ultimaVersion = Number(ultimaVersionRow[0]?.max ?? 0);
      const nuevaVersion = ultimaVersion + 1;

      // Construir snapshot inmutable
      const datosJson = this.construirSnapshot(fichaGuardada, alergias, patologias);

      const nuevaVersionEntity = versionRepo.create({
        idFichaSalud: fichaGuardada.idFichaSalud,
        idSocio: socio.idPersona ?? 0,
        version: nuevaVersion,
        datosJson,
        createdAt: ahora,
        createdBy: userId,
      });
      const versionGuardada = await versionRepo.save(nuevaVersionEntity);

      fichaGuardada.versionActualId = versionGuardada.idFichaSaludVersion;
      const fichaConVersion = await fichaRepo.save(fichaGuardada);

      socio.fichaSalud = fichaConVersion;
      await manager.getRepository(SocioOrmEntity).save(socio);

      // Auditoría RB33: shape seguro (sin datos clínicos sensibles en CREATE).
      // Se llama DENTRO de la transacción — si falla, hace rollback junto
      // con el resto. En CREATE el `despues_json` se reemplaza por un
      // resumen seguro (altura, peso, counts de alergias/patologías).
      const accion = esCreacion
        ? AccionAuditoria.FICHA_COMPLETADA
        : AccionAuditoria.FICHA_ACTUALIZADA;

      const metadata: Record<string, unknown> = esCreacion
        ? {
            version: nuevaVersion,
            fichaSaludId: fichaGuardada.idFichaSalud,
            socioId: socio.idPersona ?? 0,
            consentAt: fichaGuardada.consentAt,
            resumen: {
              altura: fichaGuardada.altura,
              peso: fichaGuardada.peso,
              alergiasCount: alergias.length,
              patologiasCount: patologias.length,
            },
          }
        : {
            version: nuevaVersion,
            versionAnterior: ultimaVersion,
            fichaSaludId: fichaGuardada.idFichaSalud,
            socioId: socio.idPersona ?? 0,
            antes: {
              altura: snapshotAnterior?.altura,
              peso: snapshotAnterior?.peso,
            },
            despues: {
              altura: fichaGuardada.altura,
              peso: fichaGuardada.peso,
            },
            camposModificados: calcularDiffFicha(
              snapshotAnterior,
              this.construirSnapshot(fichaGuardada, alergias, patologias),
            ),
          };

      await this.auditoriaService.registrar({
        usuarioId: userId,
        accion,
        entidad: 'ficha_salud',
        entidadId: fichaGuardada.idFichaSalud,
        metadata,
      });

      return { ficha: fichaConVersion, nuevaVersion };
    });

    this.logger.log(
      `Ficha de salud guardada para socio ${socio.idPersona} por usuario ${userId}. Versión=${fichaResultado.nuevaVersion}.`,
    );

    return this.toResponseDto(fichaResultado.ficha, fichaResultado.nuevaVersion);
  }

  private construirSnapshot(
    ficha: FichaSaludOrmEntity,
    alergias: AlergiaOrmEntity[],
    patologias: PatologiaOrmEntity[],
  ): Record<string, unknown> {
    return {
      altura: ficha.altura,
      peso: ficha.peso,
      nivelActividadFisica: ficha.nivelActividadFisica,
      objetivoPersonal: ficha.objetivoPersonal,
      alergias: alergias.map((a) => a.nombre),
      patologias: patologias.map((p) => p.nombre),
      medicacionActual: ficha.medicacionActual,
      suplementosActuales: ficha.suplementosActuales,
      cirugiasPrevias: ficha.cirugiasPrevias,
      antecedentesFamiliares: ficha.antecedentesFamiliares,
      frecuenciaComidas: ficha.frecuenciaComidas,
      consumoAguaDiario: ficha.consumoAguaDiario,
      restriccionesAlimentarias: ficha.restriccionesAlimentarias,
      consumoAlcohol: ficha.consumoAlcohol,
      fumaTabaco: ficha.fumaTabaco,
      horasSueno: ficha.horasSueno,
      contactoEmergenciaNombre: ficha.contactoEmergenciaNombre,
      contactoEmergenciaTelefono: ficha.contactoEmergenciaTelefono,
    };
  }

  private toResponseDto(
    ficha: FichaSaludOrmEntity,
    versionActual: number,
  ): FichaSaludSocioResponseDto {
    const response = new FichaSaludSocioResponseDto();
    const socioId =
      (ficha as unknown as { socio?: { idPersona?: number } }).socio
        ?.idPersona ?? 0;
    response.socioId = socioId;
    response.fichaSaludId = ficha.idFichaSalud;
    response.altura = ficha.altura;
    response.peso = ficha.peso;
    response.nivelActividadFisica = ficha.nivelActividadFisica;
    response.alergias = (ficha.alergias ?? []).map((item) => item.nombre);
    response.patologias = (ficha.patologias ?? []).map((item) => item.nombre);
    response.objetivoPersonal = ficha.objetivoPersonal ?? '';
    // --- Medicación y suplementos ---
    response.medicacionActual = ficha.medicacionActual;
    response.suplementosActuales = ficha.suplementosActuales;
    // --- Historial médico ---
    response.cirugiasPrevias = ficha.cirugiasPrevias;
    response.antecedentesFamiliares = ficha.antecedentesFamiliares;
    // --- Hábitos alimentarios ---
    response.frecuenciaComidas = ficha.frecuenciaComidas;
    response.consumoAguaDiario = ficha.consumoAguaDiario;
    response.restriccionesAlimentarias = ficha.restriccionesAlimentarias;
    // --- Hábitos de vida ---
    response.consumoAlcohol = ficha.consumoAlcohol;
    response.fumaTabaco = ficha.fumaTabaco ?? false;
    response.horasSueno = ficha.horasSueno;
    // --- Contacto de emergencia ---
    response.contactoEmergenciaNombre = ficha.contactoEmergenciaNombre;
    response.contactoEmergenciaTelefono = ficha.contactoEmergenciaTelefono;
    // --- Versionado y estado (RB14, RB44, RB50) ---
    response.completada = ficha.completada ?? false;
    response.completadaAt = ficha.completadaAt ?? null;
    response.actualizadaAt = ficha.actualizadaAt ?? null;
    response.consentAt = ficha.consentAt ?? null;
    response.versionActual = versionActual;
    return response;
  }

  private async resolveSocioByUserId(userId: number): Promise<SocioOrmEntity> {
    const user = await this.usuarioRepository.findOne({
      where: { idUsuario: userId },
      relations: {
        persona: true,
      },
    });

    const personaId = user?.persona?.idPersona;

    if (!personaId) {
      throw new ForbiddenError(
        'El usuario autenticado no tiene un socio asociado.',
      );
    }

    const socio = await this.socioRepository.findOne({
      where: {
        idPersona: personaId,
        gimnasioId: this.tenantContext.gimnasioId,
      },
      relations: {
        fichaSalud: {
          alergias: true,
          patologias: true,
        },
      },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(personaId));
    }

    return socio;
  }

  private async resolveAlergias(names: string[]): Promise<AlergiaOrmEntity[]> {
    const normalized = this.normalizeNames(names);

    if (!normalized.length) {
      return [];
    }

    const existing = await this.alergiaRepository.find();
    const byName = new Map(
      existing.map((item) => [item.nombre.trim().toLowerCase(), item]),
    );

    const result: AlergiaOrmEntity[] = [];

    for (const name of normalized) {
      const key = name.toLowerCase();
      const found = byName.get(key);

      if (found) {
        result.push(found);
        continue;
      }

      const created = this.alergiaRepository.create({ nombre: name });
      const saved = await this.alergiaRepository.save(created);
      byName.set(key, saved);
      result.push(saved);
    }

    return result;
  }

  private async resolvePatologias(
    names: string[],
  ): Promise<PatologiaOrmEntity[]> {
    const normalized = this.normalizeNames(names);

    if (!normalized.length) {
      return [];
    }

    const existing = await this.patologiaRepository.find();
    const byName = new Map(
      existing.map((item) => [item.nombre.trim().toLowerCase(), item]),
    );

    const result: PatologiaOrmEntity[] = [];

    for (const name of normalized) {
      const key = name.toLowerCase();
      const found = byName.get(key);

      if (found) {
        result.push(found);
        continue;
      }

      const created = this.patologiaRepository.create({ nombre: name });
      const saved = await this.patologiaRepository.save(created);
      byName.set(key, saved);
      result.push(saved);
    }

    return result;
  }

  private normalizeNames(values: string[]): string[] {
    return Array.from(
      new Set(
        values.map((value) => value.trim()).filter((value) => value.length > 0),
      ),
    );
  }
}
