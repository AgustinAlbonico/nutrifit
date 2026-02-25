import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  DatosTurnoResponseDto,
  FichaSalud,
  SocioTurnoResponseDto,
} from 'src/application/turnos/dtos/datos-turno-response.dto';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { NivelActividadFisica } from 'src/domain/entities/FichaSalud/NivelActividadFisica';
import { FrecuenciaComidas } from 'src/domain/entities/FichaSalud/FrecuenciaComidas';
import { ConsumoAlcohol } from 'src/domain/entities/FichaSalud/ConsumoAlcohol';
import {
  TurnoOrmEntity,
  NutricionistaOrmEntity,
  FichaSaludOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';

@Injectable()
export class GetTurnoByIdUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepository: Repository<NutricionistaOrmEntity>,
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaSaludRepository: Repository<FichaSaludOrmEntity>,
  ) {}

  async execute(
    turnoId: number,
    nutricionistaId: number,
  ): Promise<DatosTurnoResponseDto> {
    // 1. Buscar el turno con todas las relaciones necesarias
    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
      relations: ['socio', 'nutricionista'],
    });

    if (!turno) {
      throw new NotFoundError('Turno', String(turnoId));
    }

    // 2. Verificar que el turno pertenezca al nutricionista
    if (turno.nutricionista.idPersona !== nutricionistaId) {
      throw new BadRequestError(
        'No tienes permiso para ver este turno. No es de tu autoría.',
      );
    }

    // 3. Verificar estado del turno
    if (turno.estadoTurno === EstadoTurno.CANCELADO) {
      throw new BadRequestError('El turno está cancelado');
    }

    // 4. Crear la respuesta de socio (manejar caso null)
    const socioResponse: SocioTurnoResponseDto = {
      idPersona: turno.socio?.idPersona ?? 0,
      nombre: turno.socio?.nombre ?? '',
      apellido: turno.socio?.apellido ?? '',
      dni: turno.socio?.dni ?? '',
      email: '',
      telefono: turno.socio?.telefono ?? null,
    };

    // 5. Buscar ficha de salud si existe
    let fichaSaludResponse: FichaSalud | null = null;

    // Buscar ficha de salud del socio por separado
    const socioId = turno.socio?.idPersona;
    if (socioId) {
      try {
        const fichaSaludOrm = await this.fichaSaludRepository.findOne({
          where: { socio: { idPersona: socioId } },
          relations: ['alergias', 'patologias'],
        });

        if (fichaSaludOrm) {
          // Mapear al DTO
          fichaSaludResponse = {
            fichaSaludId: fichaSaludOrm.idFichaSalud,
            altura: fichaSaludOrm.altura,
            peso: Number(fichaSaludOrm.peso),
            nivelActividadFisica: this.mapNivelActividad(
              fichaSaludOrm.nivelActividadFisica,
            ),
            alergias: fichaSaludOrm.alergias?.map((a) => a.nombre) ?? [],
            patologias: fichaSaludOrm.patologias?.map((p) => p.nombre) ?? [],
            objetivoPersonal: fichaSaludOrm.objetivoPersonal ?? null,
            medicacionActual: fichaSaludOrm.medicacionActual ?? null,
            suplementosActuales: fichaSaludOrm.suplementosActuales ?? null,
            cirugiasPrevias: fichaSaludOrm.cirugiasPrevias ?? null,
            antecedentesFamiliares:
              fichaSaludOrm.antecedentesFamiliares ?? null,
            frecuenciaComidas: this.mapFrecuenciaComidas(
              fichaSaludOrm.frecuenciaComidas,
            ),
            consumoAguaDiario: fichaSaludOrm.consumoAguaDiario
              ? Number(fichaSaludOrm.consumoAguaDiario)
              : null,
            restriccionesAlimentarias:
              fichaSaludOrm.restriccionesAlimentarias || null,
            consumoAlcohol: this.mapConsumoAlcohol(
              fichaSaludOrm.consumoAlcohol,
            ),
            fumaTabaco: fichaSaludOrm.fumaTabaco ?? false,
            horasSueno: fichaSaludOrm.horasSueno || null,
            contactoEmergenciaNombre:
              fichaSaludOrm.contactoEmergenciaNombre || null,
            contactoEmergenciaTelefono:
              fichaSaludOrm.contactoEmergenciaTelefono || null,
          };
        }
      } catch (error) {
        // Si hay error al buscar la ficha de salud, continuamos sin ella
        console.error('Error al buscar ficha de salud:', error);
      }
    }

    // 6. Crear la respuesta completa
    const response: DatosTurnoResponseDto = {
      idTurno: turno.idTurno,
      fechaTurno: this.formatDate(turno.fechaTurno),
      horaTurno: turno.horaTurno,
      estadoTurno: turno.estadoTurno as string,
      socio: socioResponse,
      fichaSalud: fichaSaludResponse,
    };

    return response;
  }

  private mapNivelActividad(
    nivel: NivelActividadFisica,
  ): 'Sedentario' | 'Moderado' | 'Intenso' {
    switch (nivel) {
      case NivelActividadFisica.SEDENTARIO:
        return 'Sedentario';
      case NivelActividadFisica.MODERADO:
        return 'Moderado';
      case NivelActividadFisica.INTENSO:
        return 'Intenso';
      default:
        return 'Sedentario';
    }
  }

  private mapFrecuenciaComidas(
    frecuencia: FrecuenciaComidas | null,
  ): string | null {
    if (!frecuencia) return null;
    switch (frecuencia) {
      case FrecuenciaComidas.UNO_DOS:
        return '1-2 comidas';
      case FrecuenciaComidas.TRES:
        return '3 comidas';
      case FrecuenciaComidas.CUATRO_CINCO:
        return '4-5 comidas';
      case FrecuenciaComidas.SEIS_O_MAS:
        return '6 o más comidas';
      default:
        return null;
    }
  }

  private mapConsumoAlcohol(consumo: ConsumoAlcohol | null): string | null {
    if (!consumo) return null;
    switch (consumo) {
      case ConsumoAlcohol.NUNCA:
        return 'Nunca';
      case ConsumoAlcohol.OCASIONAL:
        return 'Ocasional';
      case ConsumoAlcohol.MODERADO:
        return 'Moderado';
      case ConsumoAlcohol.FRECUENTE:
        return 'Frecuente';
      default:
        return null;
    }
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }
}
