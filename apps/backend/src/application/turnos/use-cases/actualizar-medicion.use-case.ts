import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { ActualizarMedicionDto } from '../dtos/actualizar-medicion.dto';

export interface ActualizarMedicionResponse {
  success: boolean;
  imc: number;
  idMedicion: number;
}

@Injectable()
export class ActualizarMedicionUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(MedicionOrmEntity)
    private readonly medicionRepository: Repository<MedicionOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    turnoId: number,
    medicionId: number,
    dto: ActualizarMedicionDto,
  ): Promise<ActualizarMedicionResponse> {
    const turno = await this.turnoRepository.findOne({
      where: {
        idTurno: turnoId,
        nutricionista: { gimnasioId: this.tenantContext.gimnasioId },
      },
      relations: ['nutricionista'],
    });

    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }

    if (turno.nutricionista.idPersona !== this.tenantContext.personaId) {
      throw new ForbiddenError(
        'No podés editar mediciones de otro nutricionista',
      );
    }

    if (turno.consultaFinalizadaAt !== null) {
      throw new BadRequestError(
        'No se pueden editar mediciones de una consulta ya finalizada',
      );
    }

    if (turno.estadoTurno !== EstadoTurno.EN_CURSO) {
      throw new BadRequestError(
        `Solo se pueden editar mediciones durante una consulta en curso. Estado actual: ${turno.estadoTurno}`,
      );
    }

    const medicion = await this.medicionRepository.findOne({
      where: { idMedicion: medicionId },
      relations: ['turno'],
    });

    if (!medicion) {
      throw new NotFoundError('Medición no encontrada');
    }

    if (medicion.turno.idTurno !== turnoId) {
      throw new BadRequestError('La medición no pertenece al turno indicado');
    }

    const peso = dto.peso ?? Number(medicion.peso);
    const altura = dto.altura ?? medicion.altura;
    const tensionSistolica = dto.tensionSistolica ?? medicion.tensionSistolica;
    const tensionDiastolica =
      dto.tensionDiastolica ?? medicion.tensionDiastolica;
    const imc = this.calcularImc(peso, altura);
    this.validarRangosClinicos(imc, tensionSistolica, tensionDiastolica);

    medicion.peso = peso;
    medicion.altura = altura;
    medicion.imc = imc;
    medicion.perimetroCintura =
      dto.perimetroCintura ?? medicion.perimetroCintura;
    medicion.perimetroCadera = dto.perimetroCadera ?? medicion.perimetroCadera;
    medicion.perimetroBrazo = dto.perimetroBrazo ?? medicion.perimetroBrazo;
    medicion.perimetroMuslo = dto.perimetroMuslo ?? medicion.perimetroMuslo;
    medicion.perimetroPecho = dto.perimetroPecho ?? medicion.perimetroPecho;
    medicion.pliegueTriceps = dto.pliegueTriceps ?? medicion.pliegueTriceps;
    medicion.pliegueAbdominal =
      dto.pliegueAbdominal ?? medicion.pliegueAbdominal;
    medicion.pliegueMuslo = dto.pliegueMuslo ?? medicion.pliegueMuslo;
    medicion.porcentajeGrasa = dto.porcentajeGrasa ?? medicion.porcentajeGrasa;
    medicion.masaMagra = this.calcularMasaMagra(peso, medicion.porcentajeGrasa);
    medicion.frecuenciaCardiaca =
      dto.frecuenciaCardiaca ?? medicion.frecuenciaCardiaca;
    medicion.tensionSistolica = tensionSistolica;
    medicion.tensionDiastolica = tensionDiastolica;
    medicion.notasMedicion = dto.notasMedicion ?? medicion.notasMedicion;

    const medicionGuardada = await this.medicionRepository.save(medicion);

    return {
      success: true,
      imc,
      idMedicion: medicionGuardada.idMedicion,
    };
  }

  private calcularImc(peso: number, altura: number): number {
    const alturaEnMetros = altura / 100;
    return parseFloat((peso / (alturaEnMetros * alturaEnMetros)).toFixed(2));
  }

  private calcularMasaMagra(
    peso: number,
    porcentajeGrasa: number | null,
  ): number | null {
    if (porcentajeGrasa === null) {
      return null;
    }

    return parseFloat((peso * (1 - porcentajeGrasa / 100)).toFixed(2));
  }

  private validarRangosClinicos(
    imc: number,
    tensionSistolica: number | null,
    tensionDiastolica: number | null,
  ): void {
    if (imc < 10 || imc > 80) {
      throw new BadRequestError(
        'El IMC calculado queda fuera de un rango clinico razonable. Revisá peso y altura.',
      );
    }

    const tieneTensionSistolica = tensionSistolica !== null;
    const tieneTensionDiastolica = tensionDiastolica !== null;

    if (tieneTensionSistolica !== tieneTensionDiastolica) {
      throw new BadRequestError(
        'Para registrar la tensión arterial debes informar el valor sistólico y el diastólico.',
      );
    }

    if (
      tensionSistolica !== null &&
      tensionDiastolica !== null &&
      tensionDiastolica >= tensionSistolica
    ) {
      throw new BadRequestError(
        'La tensión diastólica debe ser menor que la sistólica.',
      );
    }
  }
}
