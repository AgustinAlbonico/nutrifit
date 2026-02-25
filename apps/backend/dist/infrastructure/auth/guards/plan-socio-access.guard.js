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
exports.PlanSocioAccessGuard = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
const usuario_repository_1 = require("../../../domain/entities/Usuario/usuario.repository");
const turno_entity_1 = require("../../persistence/typeorm/entities/turno.entity");
const plan_alimentacion_entity_1 = require("../../persistence/typeorm/entities/plan-alimentacion.entity");
let PlanSocioAccessGuard = class PlanSocioAccessGuard {
    usuarioRepository;
    turnoRepository;
    planRepository;
    constructor(usuarioRepository, turnoRepository, planRepository) {
        this.usuarioRepository = usuarioRepository;
        this.turnoRepository = turnoRepository;
        this.planRepository = planRepository;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user?.rol === Rol_1.Rol.ADMIN) {
            return true;
        }
        if (user?.rol === Rol_1.Rol.SOCIO) {
            const userId = user?.id;
            if (!userId) {
                throw new common_1.ForbiddenException('No autorizado');
            }
            const socioPersonaId = await this.usuarioRepository.findPersonaIdByUserId(userId);
            if (!socioPersonaId) {
                throw new common_1.ForbiddenException('No autorizado');
            }
            const socioIdParam = request.params?.socioId;
            let targetSocioId = null;
            if (socioIdParam !== undefined) {
                targetSocioId = Number(socioIdParam);
            }
            else {
                const planIdParam = request.params?.id;
                if (planIdParam !== undefined) {
                    const planId = Number(planIdParam);
                    if (!Number.isFinite(planId)) {
                        throw new common_1.ForbiddenException('Parámetro de plan inválido');
                    }
                    const plan = await this.planRepository.findOne({
                        where: { idPlanAlimentacion: planId },
                        relations: ['socio'],
                    });
                    if (!plan) {
                        throw new common_1.NotFoundException('Plan de alimentación no encontrado');
                    }
                    targetSocioId = plan.socio?.idPersona ?? null;
                }
            }
            if (targetSocioId !== null && targetSocioId !== socioPersonaId) {
                throw new common_1.ForbiddenException('Solo puedes acceder a tus propios planes de alimentación.');
            }
            return true;
        }
        const userId = user?.id;
        if (!userId) {
            throw new common_1.ForbiddenException('No autorizado');
        }
        const nutricionistaPersonaId = await this.usuarioRepository.findPersonaIdByUserId(userId);
        if (!nutricionistaPersonaId) {
            throw new common_1.ForbiddenException('No autorizado');
        }
        let socioId = null;
        const socioIdParam = request.params?.socioId;
        if (socioIdParam !== undefined) {
            socioId = Number(socioIdParam);
        }
        else {
            const planIdParam = request.params?.id;
            if (planIdParam !== undefined) {
                const planId = Number(planIdParam);
                if (!Number.isFinite(planId)) {
                    throw new common_1.ForbiddenException('Parámetro de plan inválido');
                }
                const plan = await this.planRepository.findOne({
                    where: { idPlanAlimentacion: planId },
                    relations: ['socio'],
                });
                if (!plan) {
                    throw new common_1.NotFoundException('Plan de alimentación no encontrado');
                }
                socioId = plan.socio?.idPersona ?? null;
            }
            else {
                const bodySocioId = request.body?.socioId;
                if (bodySocioId !== undefined) {
                    socioId = Number(bodySocioId);
                }
            }
        }
        if (socioId === null) {
            return true;
        }
        if (!Number.isFinite(socioId)) {
            throw new common_1.ForbiddenException('Parámetro de socio inválido');
        }
        const turnoCount = await this.turnoRepository.count({
            where: {
                nutricionista: { idPersona: nutricionistaPersonaId },
                socio: { idPersona: socioId },
            },
        });
        if (turnoCount === 0) {
            throw new common_1.ForbiddenException('No tenés permisos para acceder a los planes de este socio. ' +
                'Debe existir al menos un turno compartido.');
        }
        return true;
    }
};
exports.PlanSocioAccessGuard = PlanSocioAccessGuard;
exports.PlanSocioAccessGuard = PlanSocioAccessGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(usuario_repository_1.USUARIO_REPOSITORY)),
    __param(1, (0, typeorm_1.InjectRepository)(turno_entity_1.TurnoOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(plan_alimentacion_entity_1.PlanAlimentacionOrmEntity)),
    __metadata("design:paramtypes", [usuario_repository_1.UsuarioRepository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PlanSocioAccessGuard);
//# sourceMappingURL=plan-socio-access.guard.js.map