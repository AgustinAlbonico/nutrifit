import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  FichaSaludSocioResponseDto,
  UpsertFichaSaludSocioDto,
} from 'src/application/turnos/dtos';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  AlergiaOrmEntity,
  FichaSaludOrmEntity,
  PatologiaOrmEntity,
  SocioOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';

@Injectable()
export class UpsertFichaSaludSocioUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaSaludRepository: Repository<FichaSaludOrmEntity>,
    @InjectRepository(AlergiaOrmEntity)
    private readonly alergiaRepository: Repository<AlergiaOrmEntity>,
    @InjectRepository(PatologiaOrmEntity)
    private readonly patologiaRepository: Repository<PatologiaOrmEntity>,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    userId: number,
    payload: UpsertFichaSaludSocioDto,
  ): Promise<FichaSaludSocioResponseDto> {
    const socio = await this.resolveSocioByUserId(userId);

    const alergias = await this.resolveAlergias(payload.alergias ?? []);
    const patologias = await this.resolvePatologias(payload.patologias ?? []);

    let ficha = socio.fichaSalud as FichaSaludOrmEntity | null;

    if (!ficha) {
      ficha = new FichaSaludOrmEntity();
    }

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
    ficha.restriccionesAlimentarias = payload.restriccionesAlimentarias ?? null;
    // --- Hábitos de vida ---
    ficha.consumoAlcohol = payload.consumoAlcohol ?? null;
    ficha.fumaTabaco = payload.fumaTabaco ?? false;
    ficha.horasSueno = payload.horasSueno ?? null;
    // --- Contacto de emergencia ---
    ficha.contactoEmergenciaNombre = payload.contactoEmergenciaNombre ?? null;
    ficha.contactoEmergenciaTelefono =
      payload.contactoEmergenciaTelefono ?? null;

    const fichaGuardada = await this.fichaSaludRepository.save(ficha);

    socio.fichaSalud = fichaGuardada;
    await this.socioRepository.save(socio);

    this.logger.log(
      `Ficha de salud guardada para socio ${socio.idPersona} por usuario ${userId}.`,
    );

    const response = new FichaSaludSocioResponseDto();
    response.socioId = socio.idPersona ?? 0;
    response.fichaSaludId = fichaGuardada.idFichaSalud;
    response.altura = fichaGuardada.altura;
    response.peso = fichaGuardada.peso;
    response.nivelActividadFisica = fichaGuardada.nivelActividadFisica;
    response.alergias = fichaGuardada.alergias.map((item) => item.nombre);
    response.patologias = fichaGuardada.patologias.map((item) => item.nombre);
    response.objetivoPersonal = fichaGuardada.objetivoPersonal ?? '';
    // --- Medicación y suplementos ---
    response.medicacionActual = fichaGuardada.medicacionActual;
    response.suplementosActuales = fichaGuardada.suplementosActuales;
    // --- Historial médico ---
    response.cirugiasPrevias = fichaGuardada.cirugiasPrevias;
    response.antecedentesFamiliares = fichaGuardada.antecedentesFamiliares;
    // --- Hábitos alimentarios ---
    response.frecuenciaComidas = fichaGuardada.frecuenciaComidas;
    response.consumoAguaDiario = fichaGuardada.consumoAguaDiario;
    response.restriccionesAlimentarias =
      fichaGuardada.restriccionesAlimentarias;
    // --- Hábitos de vida ---
    response.consumoAlcohol = fichaGuardada.consumoAlcohol;
    response.fumaTabaco = fichaGuardada.fumaTabaco ?? false;
    response.horasSueno = fichaGuardada.horasSueno;
    // --- Contacto de emergencia ---
    response.contactoEmergenciaNombre = fichaGuardada.contactoEmergenciaNombre;
    response.contactoEmergenciaTelefono =
      fichaGuardada.contactoEmergenciaTelefono;

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
      where: { idPersona: personaId },
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
