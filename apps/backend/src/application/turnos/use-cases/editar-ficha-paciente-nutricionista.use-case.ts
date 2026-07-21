import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  EditarFichaPacienteNutricionistaDto,
  FichaSaludSocioResponseDto,
} from 'src/application/turnos/dtos';
import { calcularDiffFicha } from 'src/application/turnos/helpers/calcular-diff-ficha.helper';
import {
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
  TurnoOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';

/**
 * Caso de uso para que un NUTRICIONISTA edite la ficha de salud de un
 * paciente con el que tiene un turno previo.
 *
 * **Endpoint**: `PUT /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud`
 *
 * **Reglas**:
 *  - El NUT debe tener al menos un turno (cualquier estado) con el socio.
 *    Se valida contra `TurnoOrmEntity` (mismo criterio que
 *    `GetFichaSaludPacienteUseCase`).
 *  - Si el socio no tiene ficha previa, se crea una nueva con
 *    `revisadaPorNutricionistaAt = NOW()` (no se exige consentimiento
 *    porque el socio ya aceptó RGPD al crearla, o el NUT actúa en su
 *    nombre bajo autorización profesional — ver RB44).
 *  - La ficha se versiona: cada edición crea un row en
 *    `ficha_salud_version` con un snapshot inmutable (RB50).
 *  - La acción se audita con `FICHA_REVISADA_POR_NUTRICIONISTA`
 *    (`AccionAuditoria`) usando el `usuarioId` del NUT autenticado
 *    (RB33, shape seguro sin medicación/antecedentes).
 *
 * **Por qué un caso de uso separado en lugar de refactorizar
 * `UpsertFichaSaludSocioUseCase`**:
 *  - Distintos actores (NUT vs socio) y reglas de validación (sin
 *    consentimiento, distinto campo `revisadaPorNutricionistaAt`).
 *  - Mantener el caso del socio intacto evita romper RB44 ni los tests
 *    existentes que dependen de la firma `(userId, dto)`.
 *
 * RBs: RB13 (NUT solo ve/edita fichas de pacientes con turno previo),
 * RB33, RB42, RB44, RB50.
 */
@Injectable()
export class EditarFichaPacienteNutricionistaUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
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

  /**
   * @param nutricionistaUsuarioId  ID del usuario NUT autenticado
   *                                (sale de `@CurrentUserId()` en el controller).
   * @param nutricionistaPersonaId  ID de persona del NUT (sale de la URL).
   * @param socioId                 ID de persona del socio (sale de la URL).
   * @param payload                 Datos editados de la ficha.
   */
  async execute(
    nutricionistaUsuarioId: number,
    nutricionistaPersonaId: number,
    socioId: number,
    payload: EditarFichaPacienteNutricionistaDto,
  ): Promise<FichaSaludSocioResponseDto> {
    // 1. Verificar que el socio existe en este tenant.
    const socio = await this.socioRepository.findOne({
      where: {
        idPersona: socioId,
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
      throw new NotFoundError('Socio', String(socioId));
    }

    // 2. Verificar que el NUT tiene al menos un turno con el socio (RB13).
    const tieneVinculo = await this.tieneTurnoConSocio(
      nutricionistaPersonaId,
      socioId,
    );

    if (!tieneVinculo) {
      throw new ForbiddenError(
        'Solo podés editar la ficha de salud de socios con turnos asignados o historicos.',
      );
    }

    // 3. Resolver alergias/patologías (find-or-create).
    const alergias = await this.resolveAlergias(payload.alergias ?? []);
    const patologias = await this.resolvePatologias(payload.patologias ?? []);

    const ahora = new Date();
    const fichaExistente = socio.fichaSalud as FichaSaludOrmEntity | null;

    // Snapshot anterior para diff y auditoría (RB33).
    const snapshotAnterior: Record<string, unknown> | null = fichaExistente
      ? {
          altura: fichaExistente.altura,
          peso: fichaExistente.peso,
          nivelActividadFisica: fichaExistente.nivelActividadFisica,
          objetivoPersonal: fichaExistente.objetivoPersonal,
          alergias: (fichaExistente.alergias ?? []).map((a) => a.nombre),
          patologias: (fichaExistente.patologias ?? []).map((p) => p.nombre),
          restriccionesAlimentarias: fichaExistente.restriccionesAlimentarias,
          medicacionActual: fichaExistente.medicacionActual,
          suplementosActuales: fichaExistente.suplementosActuales,
        }
      : null;

    const fichaResultado = await this.dataSource.transaction(
      async (manager) => {
        const fichaRepo = manager.getRepository(FichaSaludOrmEntity);
        const versionRepo = manager.getRepository(FichaSaludVersionOrmEntity);

        let ficha: FichaSaludOrmEntity;

        if (!fichaExistente) {
          // El NUT está creando una ficha en nombre del socio.
          // RB44: ya no se exige consentimiento (lo aceptó el socio al
          // reservar el primer turno con este NUT, o el NUT actúa bajo
          // autorización profesional). Se marca `completada = true` para
          // no bloquear reservas futuras.
          ficha = new FichaSaludOrmEntity();
          ficha.completada = true;
          ficha.completadaAt = ahora;
          ficha.consentAt = null;
        } else {
          ficha = fichaExistente;
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
        ficha.contactoEmergenciaNombre =
          payload.contactoEmergenciaNombre ?? null;
        ficha.contactoEmergenciaTelefono =
          payload.contactoEmergenciaTelefono ?? null;
        // --- Marca de revisión por nutricionista (nuevo, RB42) ---
        ficha.revisadaPorNutricionistaAt = ahora;

        const fichaGuardada = await fichaRepo.save(ficha);

        // Versionado inmutable con pessimistic lock (RB50, igual que el caso del socio).
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

        const datosJson = this.construirSnapshot(fichaGuardada);

        const nuevaVersionEntity = versionRepo.create({
          idFichaSalud: fichaGuardada.idFichaSalud,
          idSocio: socio.idPersona ?? 0,
          version: nuevaVersion,
          datosJson,
          createdAt: ahora,
          createdBy: nutricionistaUsuarioId,
        });
        const versionGuardada = await versionRepo.save(nuevaVersionEntity);

        fichaGuardada.versionActualId = versionGuardada.idFichaSaludVersion;
        const fichaConVersion = await fichaRepo.save(fichaGuardada);

        // Vincular la ficha al socio si era nueva (FK one-to-one).
        socio.fichaSalud = fichaConVersion;
        await manager.getRepository(SocioOrmEntity).save(socio);

        // Auditoría RB33: shape seguro (sin medicación/antecedentes en `metadata`).
        const accion = AccionAuditoria.FICHA_REVISADA_POR_NUTRICIONISTA;
        const metadata: Record<string, unknown> = {
          version: nuevaVersion,
          versionAnterior: ultimaVersion,
          fichaSaludId: fichaGuardada.idFichaSalud,
          socioId: socio.idPersona ?? 0,
          nutricionistaPersonaId,
          esCreacion: !fichaExistente,
          antes: snapshotAnterior
            ? {
                altura: snapshotAnterior.altura,
                peso: snapshotAnterior.peso,
              }
            : null,
          despues: {
            altura: fichaGuardada.altura,
            peso: fichaGuardada.peso,
          },
          camposModificados: snapshotAnterior
            ? calcularDiffFicha(
                snapshotAnterior,
                this.construirSnapshot(fichaGuardada),
              )
            : [],
        };

        await this.auditoriaService.registrar({
          usuarioId: nutricionistaUsuarioId,
          accion,
          entidad: 'ficha_salud',
          entidadId: fichaGuardada.idFichaSalud,
          metadata,
        });

        return { ficha: fichaConVersion, nuevaVersion };
      },
    );

    this.logger.log(
      `Ficha de salud editada por nutricionista ${nutricionistaPersonaId} (usuario ${nutricionistaUsuarioId}) para socio ${socio.idPersona}. Versión=${fichaResultado.nuevaVersion}.`,
    );

    return this.toResponseDto(
      fichaResultado.ficha,
      fichaResultado.nuevaVersion,
      socioId,
    );
  }

  private async tieneTurnoConSocio(
    nutricionistaPersonaId: number,
    socioId: number,
  ): Promise<boolean> {
    const totalTurnos = await this.turnoRepository.count({
      where: {
        nutricionista: {
          idPersona: nutricionistaPersonaId,
          gimnasioId: this.tenantContext.gimnasioId,
        },
        socio: { idPersona: socioId },
      },
    });

    return totalTurnos > 0;
  }

  private construirSnapshot(
    ficha: FichaSaludOrmEntity,
  ): Record<string, unknown> {
    return {
      altura: ficha.altura,
      peso: ficha.peso,
      nivelActividadFisica: ficha.nivelActividadFisica,
      objetivoPersonal: ficha.objetivoPersonal,
      alergias: (ficha.alergias ?? []).map((a) => a.nombre),
      patologias: (ficha.patologias ?? []).map((p) => p.nombre),
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
      revisadaPorNutricionistaAt: ficha.revisadaPorNutricionistaAt,
    };
  }

  private toResponseDto(
    ficha: FichaSaludOrmEntity,
    versionActual: number,
    socioId: number,
  ): FichaSaludSocioResponseDto {
    const response = new FichaSaludSocioResponseDto();
    response.socioId = socioId;
    response.fichaSaludId = ficha.idFichaSalud;
    response.altura = ficha.altura;
    response.peso = ficha.peso;
    response.nivelActividadFisica = ficha.nivelActividadFisica;
    response.alergias = (ficha.alergias ?? []).map((item) => item.nombre);
    response.patologias = (ficha.patologias ?? []).map((item) => item.nombre);
    response.objetivoPersonal = ficha.objetivoPersonal ?? '';
    response.medicacionActual = ficha.medicacionActual;
    response.suplementosActuales = ficha.suplementosActuales;
    response.cirugiasPrevias = ficha.cirugiasPrevias;
    response.antecedentesFamiliares = ficha.antecedentesFamiliares;
    response.frecuenciaComidas = ficha.frecuenciaComidas;
    response.consumoAguaDiario = ficha.consumoAguaDiario;
    response.restriccionesAlimentarias = ficha.restriccionesAlimentarias;
    response.consumoAlcohol = ficha.consumoAlcohol;
    response.fumaTabaco = ficha.fumaTabaco ?? false;
    response.horasSueno = ficha.horasSueno;
    response.contactoEmergenciaNombre = ficha.contactoEmergenciaNombre;
    response.contactoEmergenciaTelefono = ficha.contactoEmergenciaTelefono;
    response.completada = ficha.completada ?? false;
    response.completadaAt = ficha.completadaAt ?? null;
    response.actualizadaAt = ficha.actualizadaAt ?? null;
    response.consentAt = ficha.consentAt ?? null;
    response.versionActual = versionActual;
    return response;
  }

  private async resolveAlergias(names: string[]): Promise<AlergiaOrmEntity[]> {
    const normalized = this.normalizeNames(names);
    if (!normalized.length) return [];

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
    if (!normalized.length) return [];

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
