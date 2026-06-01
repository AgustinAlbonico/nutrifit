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
exports.FotoProgresoRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const foto_progreso_entity_1 = require("../entities/foto-progreso.entity");
const tenant_context_service_1 = require("../../../auth/tenant-context.service");
function obtenerGimnasioIdActual(tenantContext) {
    if (!tenantContext?.isInitialized) {
        throw new Error('Tenant context not initialized — cannot perform tenant-scoped operation');
    }
    return tenantContext.gimnasioId;
}
let FotoProgresoRepository = class FotoProgresoRepository {
    fotoProgresoOrmRepository;
    tenantContext;
    constructor(fotoProgresoOrmRepository, tenantContext) {
        this.fotoProgresoOrmRepository = fotoProgresoOrmRepository;
        this.tenantContext = tenantContext;
    }
    get gimnasioIdActual() {
        return obtenerGimnasioIdActual(this.tenantContext);
    }
    async findBySocioId(socioId) {
        const gimnasioId = this.gimnasioIdActual;
        return this.fotoProgresoOrmRepository.find({
            where: { socio: { idPersona: socioId, gimnasioId } },
            relations: { socio: true },
            order: { fecha: 'DESC' },
        });
    }
    async findBySocioIdAndTipo(socioId, tipoFoto) {
        const gimnasioId = this.gimnasioIdActual;
        return this.fotoProgresoOrmRepository.find({
            where: { socio: { idPersona: socioId, gimnasioId }, tipoFoto },
            relations: { socio: true },
            order: { fecha: 'DESC' },
        });
    }
    async findLatestBySocioId(socioId) {
        const gimnasioId = this.gimnasioIdActual;
        return this.fotoProgresoOrmRepository.find({
            where: { socio: { idPersona: socioId, gimnasioId } },
            relations: { socio: true },
            order: { fecha: 'DESC' },
            take: 10,
        });
    }
    async findByIdAndSocioId(idFoto, socioId) {
        const gimnasioId = this.gimnasioIdActual;
        return this.fotoProgresoOrmRepository.findOne({
            where: { idFoto, socio: { idPersona: socioId, gimnasioId } },
            relations: { socio: true },
        });
    }
    async save(entity) {
        const gimnasioId = this.gimnasioIdActual;
        if (entity.socio) {
            if (entity.socio.gimnasioId !== gimnasioId) {
                throw new Error('Socio no pertenece al gimnasio actual');
            }
        }
        const foto = this.fotoProgresoOrmRepository.create(entity);
        return this.fotoProgresoOrmRepository.save(foto);
    }
    async delete(idFoto) {
        const gimnasioId = this.gimnasioIdActual;
        const foto = await this.fotoProgresoOrmRepository.findOne({
            where: { idFoto, socio: { gimnasioId } },
            relations: { socio: true },
        });
        if (!foto) {
            throw new Error(`Foto with id ${idFoto} not found in this gym`);
        }
        await this.fotoProgresoOrmRepository.delete(idFoto);
    }
};
exports.FotoProgresoRepository = FotoProgresoRepository;
exports.FotoProgresoRepository = FotoProgresoRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(foto_progreso_entity_1.FotoProgresoOrmEntity)),
    __param(1, (0, common_1.Inject)(tenant_context_service_1.TenantContextService)),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        tenant_context_service_1.TenantContextService])
], FotoProgresoRepository);
//# sourceMappingURL=foto-progreso.repository.js.map