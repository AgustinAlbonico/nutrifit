"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiaPlanEntity = void 0;
class DiaPlanEntity {
    idDiaPlan;
    dia;
    orden;
    opcionesComida;
    constructor(idDiaPlan = null, dia, orden, opcionesComida = []) {
        this.idDiaPlan = idDiaPlan;
        this.dia = dia;
        this.orden = orden;
        this.opcionesComida = opcionesComida;
    }
}
exports.DiaPlanEntity = DiaPlanEntity;
//# sourceMappingURL=dia-plan.entity.js.map