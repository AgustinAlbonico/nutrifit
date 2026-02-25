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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuscarSociosConFichaUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const persona_entity_1 = require("../../infrastructure/persistence/typeorm/entities/persona.entity");
let BuscarSociosConFichaUseCase = class BuscarSociosConFichaUseCase {
    socioRepository;
    constructor(socioRepository) {
        this.socioRepository = socioRepository;
    }
    async execute(busqueda) {
        const queryBuilder = this.socioRepository
            .createQueryBuilder('socio')
            .leftJoinAndSelect('socio.fichaSalud', 'fichaSalud')
            .where('socio.fechaBaja IS NULL');
        if (busqueda && busqueda.trim()) {
            const termino = `%${busqueda.trim().toLowerCase()}%`;
            queryBuilder.andWhere('(LOWER(socio.nombre) LIKE :busqueda OR LOWER(socio.apellido) LIKE :busqueda OR socio.dni LIKE :busqueda)', { busqueda: termino });
        }
        const socios = await queryBuilder
            .orderBy('socio.apellido', 'ASC')
            .addOrderBy('socio.nombre', 'ASC')
            .limit(20)
            .getMany();
        return socios.map((socio) => ({
            idPersona: socio.idPersona ?? 0,
            nombre: socio.nombre,
            apellido: socio.apellido,
            dni: socio.dni,
            tieneFichaSalud: !!socio.fichaSalud,
            nombreCompleto: `${socio.apellido}, ${socio.nombre}`,
        }));
    }
};
exports.BuscarSociosConFichaUseCase = BuscarSociosConFichaUseCase;
exports.BuscarSociosConFichaUseCase = BuscarSociosConFichaUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(persona_entity_1.SocioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BuscarSociosConFichaUseCase);
//# sourceMappingURL=buscar-socios-con-ficha.use-case.js.map