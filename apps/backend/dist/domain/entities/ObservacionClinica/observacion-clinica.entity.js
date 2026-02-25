"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservacionClinicaEntity = void 0;
class ObservacionClinicaEntity {
    idObservacion;
    comentario;
    peso;
    altura;
    imc;
    objetivosSocio;
    sugerencias;
    habitosSocio;
    circunferenciaCintura;
    constructor(idObservacion = null, comentario, peso, altura, imc, objetivosSocio, sugerencias = null, habitosSocio = null, circunferenciaCintura) {
        this.idObservacion = idObservacion;
        this.comentario = comentario;
        this.peso = peso;
        this.altura = altura;
        this.imc = imc;
        this.objetivosSocio = objetivosSocio;
        this.sugerencias = sugerencias;
        this.habitosSocio = habitosSocio;
        this.circunferenciaCintura = circunferenciaCintura;
    }
}
exports.ObservacionClinicaEntity = ObservacionClinicaEntity;
//# sourceMappingURL=observacion-clinica.entity.js.map