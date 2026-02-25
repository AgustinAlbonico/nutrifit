"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjetivoEntity = void 0;
class ObjetivoEntity {
    idObjetivo;
    socioId;
    tipoMetrica;
    valorInicial;
    valorObjetivo;
    valorActual;
    estado;
    fechaInicio;
    fechaObjetivo;
    createdAt;
    updatedAt;
    constructor(idObjetivo = null, socioId, tipoMetrica, valorInicial, valorObjetivo, valorActual, estado, fechaInicio, fechaObjetivo = null, createdAt = new Date(), updatedAt = new Date()) {
        this.idObjetivo = idObjetivo;
        this.socioId = socioId;
        this.tipoMetrica = tipoMetrica;
        this.valorInicial = valorInicial;
        this.valorObjetivo = valorObjetivo;
        this.valorActual = valorActual;
        this.estado = estado;
        this.fechaInicio = fechaInicio;
        this.fechaObjetivo = fechaObjetivo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    calcularProgreso() {
        const recorridoTotal = this.valorObjetivo - this.valorInicial;
        if (recorridoTotal === 0) {
            return 100;
        }
        const recorridoActual = this.valorActual - this.valorInicial;
        const progreso = (recorridoActual / recorridoTotal) * 100;
        if (!Number.isFinite(progreso)) {
            return 0;
        }
        return Math.max(0, Math.min(100, Number(progreso.toFixed(2))));
    }
}
exports.ObjetivoEntity = ObjetivoEntity;
//# sourceMappingURL=objetivo.entity.js.map