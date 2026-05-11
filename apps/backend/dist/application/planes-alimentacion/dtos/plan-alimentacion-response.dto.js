"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanAlimentacionResponseDto = exports.DiaPlanResponseDto = exports.OpcionComidaResponseDto = exports.ItemComidaResponseDto = exports.AlimentoResponseDto = void 0;
class AlimentoResponseDto {
    idAlimento;
    nombre;
    cantidad;
    calorias;
    proteinas;
    carbohidratos;
    grasas;
    unidadMedida;
}
exports.AlimentoResponseDto = AlimentoResponseDto;
class ItemComidaResponseDto {
    idItemComida;
    cantidad;
    unidad;
    notas;
    alimento;
}
exports.ItemComidaResponseDto = ItemComidaResponseDto;
class OpcionComidaResponseDto {
    idOpcionComida;
    tipoComida;
    comentarios;
    items;
}
exports.OpcionComidaResponseDto = OpcionComidaResponseDto;
class DiaPlanResponseDto {
    idDiaPlan;
    dia;
    orden;
    opcionesComida;
}
exports.DiaPlanResponseDto = DiaPlanResponseDto;
class PlanAlimentacionResponseDto {
    idPlanAlimentacion;
    fechaCreacion;
    objetivoNutricional;
    activo;
    eliminadoEn;
    motivoEliminacion;
    motivoEdicion;
    ultimaEdicion;
    socioId;
    nutricionistaId;
    socio;
    dias;
}
exports.PlanAlimentacionResponseDto = PlanAlimentacionResponseDto;
//# sourceMappingURL=plan-alimentacion-response.dto.js.map