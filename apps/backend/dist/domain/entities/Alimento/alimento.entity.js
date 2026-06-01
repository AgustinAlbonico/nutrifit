"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alimento = void 0;
const auditable_entity_1 = require("../../shared/auditable.entity");
class Alimento extends auditable_entity_1.AuditableEntity {
    idAlimento;
    nombre;
    cantidad;
    unidadMedida;
    grupoAlimenticio;
    calorias;
    proteinas;
    carbohidratos;
    grasas;
    hidratosDeCarbono;
    constructor(idAlimento = null, nombre, cantidad, unidadMedida, calorias = null, proteinas = null, carbohidratos = null, grasas = null, hidratosDeCarbono = null, fechaBaja = null) {
        super(fechaBaja);
        this.idAlimento = idAlimento;
        this.nombre = nombre;
        this.cantidad = cantidad;
        this.unidadMedida = unidadMedida;
        this.calorias = calorias;
        this.proteinas = proteinas;
        this.carbohidratos = carbohidratos;
        this.grasas = grasas;
        this.hidratosDeCarbono = hidratosDeCarbono;
    }
}
exports.Alimento = Alimento;
//# sourceMappingURL=alimento.entity.js.map