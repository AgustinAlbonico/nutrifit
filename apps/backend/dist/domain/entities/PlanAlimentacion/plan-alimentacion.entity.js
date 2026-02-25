"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanAlimentacionEntity = void 0;
class PlanAlimentacionEntity {
    idPlanAlimentacion;
    fechaCreacion;
    objetivoNutricional;
    opcionesAlimentarias;
    nutricionista;
    constructor(idPlanAlimentacion = null, fechaCreacion, objetivoNutricional, opcionesAlimentarias = [], nutricionista) {
        this.idPlanAlimentacion = idPlanAlimentacion;
        this.fechaCreacion = fechaCreacion;
        this.objetivoNutricional = objetivoNutricional;
        this.opcionesAlimentarias = opcionesAlimentarias;
        this.nutricionista = nutricionista;
    }
}
exports.PlanAlimentacionEntity = PlanAlimentacionEntity;
//# sourceMappingURL=plan-alimentacion.entity.js.map