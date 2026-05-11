import {
  AlimentoResponseDto,
  DiaPlanResponseDto,
  ItemComidaResponseDto,
  OpcionComidaResponseDto,
  PlanAlimentacionResponseDto,
} from '../dtos';
import { SocioResponseDto } from 'src/application/socios/dtos/socio-response.dto';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { OpcionComidaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/opcion-comida.entity';
import { DiaPlanOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/dia-plan.entity';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { ItemComidaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/item-comida.entity';

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

export function mapItemComidaToResponse(
  item: ItemComidaOrmEntity,
): ItemComidaResponseDto {
  const dto = new ItemComidaResponseDto();
  dto.idItemComida = item.idItemComida;
  dto.cantidad = item.cantidad;
  dto.unidad = item.unidad;
  dto.notas = item.notas;
  dto.alimento = mapAlimentoToResponse(item.alimento);
  return dto;
}

export function mapOpcionToResponse(
  opcion: OpcionComidaOrmEntity,
): OpcionComidaResponseDto {
  const dto = new OpcionComidaResponseDto();
  dto.idOpcionComida = opcion.idOpcionComida;
  dto.tipoComida = opcion.tipoComida;
  dto.comentarios = opcion.comentarios;
  dto.items = (opcion.items ?? []).map(mapItemComidaToResponse);
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
  const socio = plan.socio as { idPersona: number } | undefined;
  const nutricionista = plan.nutricionista as { idPersona: number } | undefined;

  if (!socio || !nutricionista) {
    throw new Error(
      'El plan de alimentacion requiere socio y nutricionista cargados.',
    );
  }

  const dto = new PlanAlimentacionResponseDto();
  dto.idPlanAlimentacion = plan.idPlanAlimentacion;
  dto.fechaCreacion = plan.fechaCreacion;
  dto.objetivoNutricional = plan.objetivoNutricional;
  dto.activo = plan.activo;
  dto.eliminadoEn = plan.eliminadoEn;
  dto.motivoEliminacion = plan.motivoEliminacion;
  dto.motivoEdicion = plan.motivoEdicion;
  dto.ultimaEdicion = plan.ultimaEdicion;
  dto.socioId = socio.idPersona;
  dto.nutricionistaId = nutricionista.idPersona;
  dto.socio = plan.socio ? new SocioResponseDto(plan.socio) : undefined;
  dto.dias = (plan.dias ?? []).map(mapDiaToResponse);
  return dto;
}
