import {
  AlimentoResponseDto,
  DiaPlanResponseDto,
  OpcionComidaResponseDto,
  PlanAlimentacionResponseDto,
} from '../dtos';
import { SocioResponseDto } from 'src/application/socios/dtos/socio-response.dto';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { OpcionComidaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/opcion-comida.entity';
import { DiaPlanOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/dia-plan.entity';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';

export function mapAlimentoToResponse(
  alimento: AlimentoOrmEntity,
): AlimentoResponseDto {
  const dto = new AlimentoResponseDto();
  dto.idAlimento = alimento.idAlimento;
  dto.nombre = alimento.nombre;
  dto.cantidad = alimento.cantidad;
  dto.calorias = alimento.calorias;
  dto.proteinas = alimento.proteinas;
  dto.carbohidratos = alimento.carbohidratos;
  dto.grasas = alimento.grasas;
  dto.unidadMedida = alimento.unidadMedida;
  return dto;
}

export function mapOpcionToResponse(
  opcion: OpcionComidaOrmEntity,
): OpcionComidaResponseDto {
  const dto = new OpcionComidaResponseDto();
  dto.idOpcionComida = opcion.idOpcionComida;
  dto.tipoComida = opcion.tipoComida;
  dto.comentarios = opcion.comentarios;
  dto.alimentos = (opcion.alimentos ?? []).map((a) =>
    mapAlimentoToResponse(a as AlimentoOrmEntity),
  );
  return dto;
}

export function mapDiaToResponse(dia: DiaPlanOrmEntity): DiaPlanResponseDto {
  const dto = new DiaPlanResponseDto();
  dto.idDiaPlan = dia.idDiaPlan;
  dto.dia = dia.dia;
  dto.orden = dia.orden;
  dto.opcionesComida = (dia.opcionesComida ?? []).map(mapOpcionToResponse);
  return dto;
}

export function mapPlanToResponse(
  plan: PlanAlimentacionOrmEntity,
): PlanAlimentacionResponseDto {
  const dto = new PlanAlimentacionResponseDto();
  dto.idPlanAlimentacion = plan.idPlanAlimentacion;
  dto.fechaCreacion = plan.fechaCreacion;
  dto.objetivoNutricional = plan.objetivoNutricional;
  dto.activo = plan.activo;
  dto.eliminadoEn = plan.eliminadoEn;
  dto.motivoEliminacion = plan.motivoEliminacion;
  dto.motivoEdicion = plan.motivoEdicion;
  dto.ultimaEdicion = plan.ultimaEdicion;
  dto.socioId = plan.socio ? (plan.socio as any).idPersona : undefined;
  dto.nutricionistaId = plan.nutricionista
    ? (plan.nutricionista as any).idPersona
    : undefined;
  dto.socio = plan.socio ? new SocioResponseDto(plan.socio) : undefined;
  dto.dias = (plan.dias ?? []).map(mapDiaToResponse);
  return dto;
}
