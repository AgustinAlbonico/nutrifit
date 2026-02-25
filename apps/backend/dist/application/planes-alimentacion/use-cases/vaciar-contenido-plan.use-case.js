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
exports.VaciarContenidoPlanUseCase = exports.VaciarContenidoPlanResponseDto = exports.VaciarContenidoPlanDto = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
class VaciarContenidoPlanDto {
    planId;
}
exports.VaciarContenidoPlanDto = VaciarContenidoPlanDto;
class VaciarContenidoPlanResponseDto {
    mensaje;
    planId;
    diasEliminados;
    opcionesEliminadas;
    vaciadoEn;
}
exports.VaciarContenidoPlanResponseDto = VaciarContenidoPlanResponseDto;
let VaciarContenidoPlanUseCase = class VaciarContenidoPlanUseCase {
    planRepo;
    nutricionistaRepo;
    usuarioRepo;
    diaPlanRepo;
    opcionComidaRepo;
    dataSource;
    constructor(planRepo, nutricionistaRepo, usuarioRepo, diaPlanRepo, opcionComidaRepo, dataSource) {
        this.planRepo = planRepo;
        this.nutricionistaRepo = nutricionistaRepo;
        this.usuarioRepo = usuarioRepo;
        this.diaPlanRepo = diaPlanRepo;
        this.opcionComidaRepo = opcionComidaRepo;
        this.dataSource = dataSource;
    }
    async execute(nutricionistaUserId, payload) {
        const plan = await this.planRepo.findOne({
            where: { idPlanAlimentacion: payload.planId },
            relations: { nutricionista: true, dias: true },
        });
        if (!plan || !plan.activo) {
            throw new custom_exceptions_1.NotFoundError('Plan de alimentación', String(payload.planId));
        }
        const usuario = await this.usuarioRepo.findOne({
            where: { idUsuario: nutricionistaUserId },
        });
        if (!usuario) {
            throw new custom_exceptions_1.ForbiddenError('Usuario no encontrado.');
        }
        if (usuario.rol !== Rol_1.Rol.ADMIN) {
            if (plan.nutricionista.idPersona !== nutricionistaUserId) {
                throw new custom_exceptions_1.ForbiddenError('Solo el nutricionista responsable del plan puede vaciarlo.');
            }
        }
        const diasDelPlan = await this.diaPlanRepo.find({
            where: { planAlimentacion: { idPlanAlimentacion: payload.planId } },
            relations: { opcionesComida: true },
        });
        let totalOpciones = 0;
        const diasIds = diasDelPlan.map((dia) => {
            totalOpciones += dia.opcionesComida?.length ?? 0;
            return dia.idDiaPlan;
        });
        await this.dataSource.transaction(async (manager) => {
            if (diasIds.length > 0) {
                await manager
                    .createQueryBuilder()
                    .delete()
                    .from(entities_1.OpcionComidaOrmEntity)
                    .where('id_dia_plan IN (:...diasIds)', { diasIds })
                    .execute();
            }
            if (diasIds.length > 0) {
                await manager
                    .createQueryBuilder()
                    .delete()
                    .from(entities_1.DiaPlanOrmEntity)
                    .where('id_plan_alimentacion = :planId', {
                    planId: payload.planId,
                })
                    .execute();
            }
            await manager
                .createQueryBuilder()
                .update(entities_1.PlanAlimentacionOrmEntity)
                .set({
                ultimaEdicion: new Date(),
                motivoEdicion: 'Contenido del plan vaciado',
            })
                .where('id_plan_alimentacion = :planId', { planId: payload.planId })
                .execute();
        });
        return {
            mensaje: 'Contenido del plan vaciado correctamente.',
            planId: plan.idPlanAlimentacion,
            diasEliminados: diasIds.length,
            opcionesEliminadas: totalOpciones,
            vaciadoEn: new Date(),
        };
    }
};
exports.VaciarContenidoPlanUseCase = VaciarContenidoPlanUseCase;
exports.VaciarContenidoPlanUseCase = VaciarContenidoPlanUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.PlanAlimentacionOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.NutricionistaOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.UsuarioOrmEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.DiaPlanOrmEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.OpcionComidaOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], VaciarContenidoPlanUseCase);
//# sourceMappingURL=vaciar-contenido-plan.use-case.js.map