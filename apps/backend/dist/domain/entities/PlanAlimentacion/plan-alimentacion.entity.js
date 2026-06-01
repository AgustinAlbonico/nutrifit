"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanAlimentacionEntity = void 0;
const auditable_entity_1 = require("../../shared/auditable.entity");
class PlanAlimentacionEntity extends auditable_entity_1.AuditableEntity {
    idPlanAlimentacion;
    fechaCreacion;
    objetivoNutricional;
    opcionesAlimentarias;
    nutricionista;
    constructor(idPlanAlimentacion = null, fechaCreacion, objetivoNutricional, opcionesAlimentarias = [], nutricionista, fechaBaja = null) {
        super(fechaBaja);
        this.idPlanAlimentacion = idPlanAlimentacion;
        this.fechaCreacion = fechaCreacion;
        this.objetivoNutricional = objetivoNutricional;
        this.opcionesAlimentarias = opcionesAlimentarias;
        this.nutricionista = nutricionista;
    }
}
exports.PlanAlimentacionEntity = PlanAlimentacionEntity;
//# sourceMappingURL=plan-alimentacion.entity.js.map