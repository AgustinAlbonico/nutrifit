"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAlimentoToResponse = mapAlimentoToResponse;
exports.mapItemComidaToResponse = mapItemComidaToResponse;
exports.mapOpcionToResponse = mapOpcionToResponse;
exports.mapDiaToResponse = mapDiaToResponse;
exports.mapPlanToResponse = mapPlanToResponse;
const dtos_1 = require("../dtos");
const socio_response_dto_1 = require("../../socios/dtos/socio-response.dto");
function mapAlimentoToResponse(alimento) {
    const dto = new dtos_1.AlimentoResponseDto();
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
function mapItemComidaToResponse(item) {
    const dto = new dtos_1.ItemComidaResponseDto();
    dto.idItemComida = item.idItemComida;
    dto.cantidad = item.cantidad;
    dto.unidad = item.unidad;
    dto.notas = item.notas;
    dto.alimento = mapAlimentoToResponse(item.alimento);
    return dto;
}
function mapOpcionToResponse(opcion) {
    const dto = new dtos_1.OpcionComidaResponseDto();
    dto.idOpcionComida = opcion.idOpcionComida;
    dto.tipoComida = opcion.tipoComida;
    dto.comentarios = opcion.comentarios;
    dto.items = (opcion.items ?? []).map(mapItemComidaToResponse);
    return dto;
}
function mapDiaToResponse(dia) {
    const dto = new dtos_1.DiaPlanResponseDto();
    dto.idDiaPlan = dia.idDiaPlan;
    dto.dia = dia.dia;
    dto.orden = dia.orden;
    dto.opcionesComida = (dia.opcionesComida ?? []).map(mapOpcionToResponse);
    return dto;
}
function mapPlanToResponse(plan) {
    const socio = plan.socio;
    const nutricionista = plan.nutricionista;
    if (!socio || !nutricionista) {
        throw new Error('El plan de alimentacion requiere socio y nutricionista cargados.');
    }
    const dto = new dtos_1.PlanAlimentacionResponseDto();
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
    dto.socio = plan.socio ? new socio_response_dto_1.SocioResponseDto(plan.socio) : undefined;
    dto.dias = (plan.dias ?? []).map(mapDiaToResponse);
    return dto;
}
//# sourceMappingURL=plan-alimentacion.mapper.js.map