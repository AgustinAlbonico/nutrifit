"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermisosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const accion_entity_1 = require("../../infrastructure/persistence/typeorm/entities/accion.entity");
const grupo_permiso_entity_1 = require("../../infrastructure/persistence/typeorm/entities/grupo-permiso.entity");
const usuario_entity_1 = require("../../infrastructure/persistence/typeorm/entities/usuario.entity");
const permisos_service_1 = require("./permisos.service");
let PermisosModule = class PermisosModule {
};
exports.PermisosModule = PermisosModule;
exports.PermisosModule = PermisosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                usuario_entity_1.UsuarioOrmEntity,
                accion_entity_1.AccionOrmEntity,
                grupo_permiso_entity_1.GrupoPermisoOrmEntity,
            ]),
        ],
        providers: [permisos_service_1.PermisosService],
        exports: [permisos_service_1.PermisosService],
    })
], PermisosModule);
//# sourceMappingURL=permisos.module.js.map