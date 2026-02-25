"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAlimentoToResponse = mapAlimentoToResponse;
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
function mapOpcionToResponse(opcion) {
    const dto = new dtos_1.OpcionComidaResponseDto();
    dto.idOpcionComida = opcion.idOpcionComida;
    dto.tipoComida = opcion.tipoComida;
    dto.comentarios = opcion.comentarios;
    dto.alimentos = (opcion.alimentos ?? []).map((a) => mapAlimentoToResponse(a));
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
    const dto = new dtos_1.PlanAlimentacionResponseDto();
    dto.idPlanAlimentacion = plan.idPlanAlimentacion;
    dto.fechaCreacion = plan.fechaCreacion;
    dto.objetivoNutricional = plan.objetivoNutricional;
    dto.activo = plan.activo;
    dto.eliminadoEn = plan.eliminadoEn;
    dto.motivoEliminacion = plan.motivoEliminacion;
    dto.motivoEdicion = plan.motivoEdicion;
    dto.ultimaEdicion = plan.ultimaEdicion;
    dto.socioId = plan.socio ? plan.socio.idPersona : undefined;
    dto.nutricionistaId = plan.nutricionista
        ? plan.nutricionista.idPersona
        : undefined;
    dto.socio = plan.socio ? new socio_response_dto_1.SocioResponseDto(plan.socio) : undefined;
    dto.dias = (plan.dias ?? []).map(mapDiaToResponse);
    return dto;
}
//# sourceMappingURL=plan-alimentacion.mapper.js.map