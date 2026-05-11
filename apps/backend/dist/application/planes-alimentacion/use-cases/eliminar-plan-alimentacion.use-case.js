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
exports.EliminarPlanAlimentacionUseCase = exports.EliminarPlanAlimentacionResponseDto = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const auditoria_service_1 = require("../../../infrastructure/services/auditoria/auditoria.service");
const auditoria_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/auditoria.entity");
const typeorm_2 = require("typeorm");
const notificaciones_service_1 = require("../../notificaciones/notificaciones.service");
const tipo_notificacion_enum_1 = require("../../../domain/entities/Notificacion/tipo-notificacion.enum");
class EliminarPlanAlimentacionResponseDto {
    mensaje;
    planId;
    eliminadoEn;
}
exports.EliminarPlanAlimentacionResponseDto = EliminarPlanAlimentacionResponseDto;
let EliminarPlanAlimentacionUseCase = class EliminarPlanAlimentacionUseCase {
    planRepo;
    nutricionistaRepo;
    usuarioRepo;
    auditoriaService;
    notificacionesService;
    constructor(planRepo, nutricionistaRepo, usuarioRepo, auditoriaService, notificacionesService) {
        this.planRepo = planRepo;
        this.nutricionistaRepo = nutricionistaRepo;
        this.usuarioRepo = usuarioRepo;
        this.auditoriaService = auditoriaService;
        this.notificacionesService = notificacionesService;
    }
    async execute(nutricionistaUserId, payload) {
        const plan = await this.planRepo.findOne({
            where: { idPlanAlimentacion: payload.planId },
            relations: { nutricionista: true },
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
                throw new custom_exceptions_1.ForbiddenError('Solo el nutricionista responsable del plan puede eliminarlo.');
            }
        }
        plan.activo = false;
        plan.eliminadoEn = new Date();
        plan.motivoEliminacion = payload.motivoEliminacion;
        await this.planRepo.save(plan);
        await this.auditoriaService.registrar({
            usuarioId: nutricionistaUserId,
            accion: auditoria_entity_1.AccionAuditoria.PLAN_DELETED,
            entidad: 'PlanAlimentacion',
            entidadId: plan.idPlanAlimentacion,
            metadata: {
                motivoEliminacion: payload.motivoEliminacion,
                socioId: plan.socio?.idPersona,
            },
        });
        await this.notificacionesService.crear({
            destinatarioId: plan.socio?.idPersona,
            tipo: tipo_notificacion_enum_1.TipoNotificacion.PLAN_ELIMINADO,
            titulo: 'Plan de alimentación eliminado',
            mensaje: 'Tu plan de alimentación activo fue eliminado.',
            metadata: { planId: plan.idPlanAlimentacion },
        });
        return {
            mensaje: 'Plan de alimentación eliminado correctamente.',
            planId: plan.idPlanAlimentacion,
            eliminadoEn: plan.eliminadoEn,
        };
    }
};
exports.EliminarPlanAlimentacionUseCase = EliminarPlanAlimentacionUseCase;
exports.EliminarPlanAlimentacionUseCase = EliminarPlanAlimentacionUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.PlanAlimentacionOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.NutricionistaOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.UsuarioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        auditoria_service_1.AuditoriaService,
        notificaciones_service_1.NotificacionesService])
], EliminarPlanAlimentacionUseCase);
//# sourceMappingURL=eliminar-plan-alimentacion.use-case.js.map