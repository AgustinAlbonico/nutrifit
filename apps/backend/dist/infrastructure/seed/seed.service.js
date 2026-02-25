"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const grupo_permiso_entity_1 = require("../persistence/typeorm/entities/grupo-permiso.entity");
const accion_entity_1 = require("../persistence/typeorm/entities/accion.entity");
let SeedService = SeedService_1 = class SeedService {
    grupoRepository;
    accionRepository;
    logger = new common_1.Logger(SeedService_1.name);
    constructor(grupoRepository, accionRepository) {
        this.grupoRepository = grupoRepository;
        this.accionRepository = accionRepository;
    }
    async seedPermisos() {
        this.logger.log('Iniciando seed de permisos...');
        const gruposExistentes = await this.grupoRepository.count();
        if (gruposExistentes > 0) {
            this.logger.log('Los datos de permisos ya existen. Saltando seed.');
            return;
        }
        const grupoProfesional = this.grupoRepository.create({
            clave: 'PROFESIONAL',
            nombre: 'Profesional',
            descripcion: 'Grupo de permisos para nutricionistas',
            acciones: [],
            hijos: [],
        });
        await this.grupoRepository.save(grupoProfesional);
        this.logger.log('Grupo PROFESIONAL creado');
        const grupoAdmin = this.grupoRepository.create({
            clave: 'ADMIN',
            nombre: 'Administrador',
            descripcion: 'Grupo de permisos para administradores',
            acciones: [],
            hijos: [],
        });
        await this.grupoRepository.save(grupoAdmin);
        this.logger.log('Grupo ADMIN creado');
        const acciones = [
            {
                clave: 'turnos.ver',
                nombre: 'Ver turnos',
                descripcion: 'Permite ver la lista de turnos',
            },
            {
                clave: 'turnos.crear',
                nombre: 'Crear turnos',
                descripcion: 'Permite crear nuevos turnos',
            },
            {
                clave: 'turnos.editar',
                nombre: 'Editar turnos',
                descripcion: 'Permite editar turnos existentes',
            },
            {
                clave: 'turnos.eliminar',
                nombre: 'Eliminar turnos',
                descripcion: 'Permite eliminar turnos',
            },
            {
                clave: 'socios.ver',
                nombre: 'Ver socios',
                descripcion: 'Permite ver la lista de socios',
            },
            {
                clave: 'socios.registrar',
                nombre: 'Registrar socio',
                descripcion: 'Permite registrar nuevos socios',
            },
            {
                clave: 'socios.editar',
                nombre: 'Editar socio',
                descripcion: 'Permite editar datos de socios',
            },
            {
                clave: 'socios.eliminar',
                nombre: 'Eliminar socio',
                descripcion: 'Permite dar de baja socios',
            },
            {
                clave: 'socios.reactivar',
                nombre: 'Reactivar socio',
                descripcion: 'Permite reactivar socios dados de baja',
            },
            {
                clave: 'agenda.ver',
                nombre: 'Ver agenda',
                descripcion: 'Permite ver la agenda',
            },
        ];
        const accionesCreadas = [];
        for (const accion of acciones) {
            const accionEntity = this.accionRepository.create(accion);
            const saved = await this.accionRepository.save(accionEntity);
            accionesCreadas.push(saved);
            this.logger.log(`Acción ${accion.clave} creada`);
        }
        grupoProfesional.acciones = accionesCreadas;
        await this.grupoRepository.save(grupoProfesional);
        this.logger.log('Acciones asignadas al grupo PROFESIONAL');
        const accionesAdmin = [
            {
                clave: 'profesionales.ver',
                nombre: 'Ver profesionales',
                descripcion: 'Permite ver la lista de profesionales',
            },
            {
                clave: 'profesionales.crear',
                nombre: 'Crear profesionales',
                descripcion: 'Permite crear nuevos profesionales',
            },
            {
                clave: 'profesionales.editar',
                nombre: 'Editar profesionales',
                descripcion: 'Permite editar profesionales existentes',
            },
            {
                clave: 'profesionales.eliminar',
                nombre: 'Eliminar profesionales',
                descripcion: 'Permite eliminar profesionales',
            },
            {
                clave: 'socios.ver',
                nombre: 'Ver socios',
                descripcion: 'Permite ver la lista de socios',
            },
            {
                clave: 'socios.registrar',
                nombre: 'Registrar socio',
                descripcion: 'Permite registrar nuevos socios',
            },
            {
                clave: 'socios.editar',
                nombre: 'Editar socio',
                descripcion: 'Permite editar datos de socios',
            },
            {
                clave: 'socios.eliminar',
                nombre: 'Eliminar socio',
                descripcion: 'Permite dar de baja socios',
            },
            {
                clave: 'socios.reactivar',
                nombre: 'Reactivar socio',
                descripcion: 'Permite reactivar socios dados de baja',
            },
            {
                clave: 'usuarios.ver',
                nombre: 'Ver usuarios',
                descripcion: 'Permite ver la lista de usuarios',
            },
            {
                clave: 'permisos.gestionar',
                nombre: 'Gestionar permisos',
                descripcion: 'Permite gestionar permisos y grupos',
            },
        ];
        const accionesAdminCreadas = [];
        for (const accion of accionesAdmin) {
            const accionEntity = this.accionRepository.create(accion);
            const saved = await this.accionRepository.save(accionEntity);
            accionesAdminCreadas.push(saved);
            this.logger.log(`Acción admin ${accion.clave} creada`);
        }
        grupoAdmin.acciones = accionesAdminCreadas;
        await this.grupoRepository.save(grupoAdmin);
        this.logger.log('Acciones asignadas al grupo ADMIN');
        this.logger.log('Seed de permisos completado exitosamente');
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(grupo_permiso_entity_1.GrupoPermisoOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(accion_entity_1.AccionOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SeedService);
//# sourceMappingURL=seed.service.js.map