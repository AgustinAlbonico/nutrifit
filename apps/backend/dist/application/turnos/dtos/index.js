"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./agenda-slot.dto"), exports);
__exportStar(require("./asignar-turno-manual.dto"), exports);
__exportStar(require("./bloquear-turno.dto"), exports);
__exportStar(require("./datos-turno-response.dto"), exports);
__exportStar(require("./ficha-salud-paciente-response.dto"), exports);
__exportStar(require("./ficha-salud-socio-response.dto"), exports);
__exportStar(require("./get-agenda-diaria-query.dto"), exports);
__exportStar(require("./get-turnos-del-dia-query.dto"), exports);
__exportStar(require("./guardar-mediciones.dto"), exports);
__exportStar(require("./guardar-observaciones.dto"), exports);
__exportStar(require("./historial-consulta-paciente-response.dto"), exports);
__exportStar(require("./list-mis-turnos-query.dto"), exports);
__exportStar(require("./list-pacientes-profesional-query.dto"), exports);
__exportStar(require("./mi-turno-response.dto"), exports);
__exportStar(require("./paciente-profesional-response.dto"), exports);
__exportStar(require("./recepcion-turno-response.dto"), exports);
__exportStar(require("./reprogramar-turno-socio.dto"), exports);
__exportStar(require("./registrar-asistencia-turno.dto"), exports);
__exportStar(require("./reservar-turno-socio.dto"), exports);
__exportStar(require("./turno-del-dia-response.dto"), exports);
__exportStar(require("./turno-operacion-response.dto"), exports);
__exportStar(require("./upsert-ficha-salud-socio.dto"), exports);
//# sourceMappingURL=index.js.map