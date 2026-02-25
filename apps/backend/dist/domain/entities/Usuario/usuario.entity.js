"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioEntity = void 0;
class UsuarioEntity {
    idUsuario;
    email;
    contraseña;
    fechaHoraAlta;
    persona;
    rol;
    grupos;
    acciones;
    constructor(idUsuario = null, email, contraseña, persona = null, rol, grupos = [], acciones = []) {
        this.idUsuario = idUsuario;
        this.email = email;
        this.contraseña = contraseña;
        this.fechaHoraAlta = new Date();
        this.persona = persona;
        this.rol = rol;
        this.grupos = grupos;
        this.acciones = acciones;
    }
    getAccionesEfectivas() {
        const accionesMap = new Set();
        for (const accion of this.acciones) {
            accionesMap.add(accion.clave);
        }
        const visitarGrupo = (grupo, visitados) => {
            if (visitados.has(grupo.id)) {
                return;
            }
            visitados.add(grupo.id);
            for (const accion of grupo.acciones) {
                accionesMap.add(accion.clave);
            }
            for (const hijo of grupo.hijos) {
                visitarGrupo(hijo, visitados);
            }
        };
        for (const grupo of this.grupos) {
            visitarGrupo(grupo, new Set());
        }
        return Array.from(accionesMap);
    }
}
exports.UsuarioEntity = UsuarioEntity;
//# sourceMappingURL=usuario.entity.js.map