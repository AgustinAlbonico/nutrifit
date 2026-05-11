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
exports.EditarPlanAlimentacionUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const entities_2 = require("../../../infrastructure/persistence/typeorm/entities");
const auditoria_service_1 = require("../../../infrastructure/services/auditoria/auditoria.service");
const auditoria_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/auditoria.entity");
const typeorm_2 = require("typeorm");
const plan_alimentacion_mapper_1 = require("./plan-alimentacion.mapper");
const notificaciones_service_1 = require("../../notificaciones/notificaciones.service");
const tipo_notificacion_enum_1 = require("../../../domain/entities/Notificacion/tipo-notificacion.enum");
const restricciones_validator_service_1 = require("../../restricciones/restricciones-validator.service");
let EditarPlanAlimentacionUseCase = class EditarPlanAlimentacionUseCase {
    planRepo;
    diaRepo;
    opcionRepo;
    alimentoRepo;
    socioRepo;
    nutricionistaRepo;
    usuarioRepo;
    auditoriaService;
    dataSource;
    notificacionesService;
    restriccionesValidator;
    constructor(planRepo, diaRepo, opcionRepo, alimentoRepo, socioRepo, nutricionistaRepo, usuarioRepo, auditoriaService, dataSource, notificacionesService, restriccionesValidator) {
        this.planRepo = planRepo;
        this.diaRepo = diaRepo;
        this.opcionRepo = opcionRepo;
        this.alimentoRepo = alimentoRepo;
        this.socioRepo = socioRepo;
        this.nutricionistaRepo = nutricionistaRepo;
        this.usuarioRepo = usuarioRepo;
        this.auditoriaService = auditoriaService;
        this.dataSource = dataSource;
        this.notificacionesService = notificacionesService;
        this.restriccionesValidator = restriccionesValidator;
    }
    async execute(nutricionistaUserId, payload) {
        try {
            const plan = await this.planRepo.findOne({
                where: { idPlanAlimentacion: payload.planId },
                relations: {
                    nutricionista: true,
                    socio: { fichaSalud: true },
                    dias: { opcionesComida: { items: { alimento: true } } },
                },
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
            const nutricionistaPlan = plan.nutricionista;
            const socioPlan = plan.socio;
            const socioPlanId = socioPlan.idPersona;
            if (socioPlanId == null) {
                throw new custom_exceptions_1.NotFoundError('Socio', String(payload.planId));
            }
            if (usuario.rol !== Rol_1.Rol.ADMIN) {
                if (nutricionistaPlan.idPersona !== nutricionistaUserId) {
                    throw new custom_exceptions_1.ForbiddenError('Solo el nutricionista responsable del plan puede editarlo.');
                }
            }
            if (payload.objetivoNutricional !== undefined) {
                plan.objetivoNutricional = payload.objetivoNutricional;
            }
            plan.motivoEdicion = payload.motivoEdicion ?? null;
            plan.ultimaEdicion = new Date();
            if (payload.dias !== undefined) {
                if (payload.dias.length === 0) {
                    throw new custom_exceptions_1.BadRequestError('El plan debe tener al menos un día configurado.');
                }
                const totalOpciones = payload.dias.reduce((acc, d) => acc + (d.opcionesComida?.length ?? 0), 0);
                if (totalOpciones === 0) {
                    throw new custom_exceptions_1.BadRequestError('El plan debe tener al menos una opción de comida en total.');
                }
                const todosAlimentosIds = [
                    ...new Set(payload.dias.flatMap((d) => d.opcionesComida.flatMap((o) => o.items.map((item) => item.alimentoId)))),
                ];
                const alimentos = await this.alimentoRepo.findBy({
                    idAlimento: (0, typeorm_2.In)(todosAlimentosIds),
                });
                if (alimentos.length !== todosAlimentosIds.length) {
                    throw new custom_exceptions_1.NotFoundError('Uno o más alimentos no existen en el sistema');
                }
                const alimentoMap = new Map(alimentos.map((a) => [a.idAlimento, a]));
                const incidenciasRestriccion = await this.restriccionesValidator.generarIncidencias(payload.dias.flatMap((diaDto) => diaDto.opcionesComida.flatMap((opcionDto, indiceOpcion) => opcionDto.items.map((itemDto, indiceItem) => {
                    const alimento = alimentoMap.get(itemDto.alimentoId);
                    return {
                        dia: diaDto.dia,
                        comida: opcionDto.tipoComida,
                        item: `${indiceOpcion + 1}.${indiceItem + 1}`,
                        alimentoId: alimento.idAlimento,
                        alimentoNombre: alimento.nombre,
                    };
                }))), socioPlanId);
                if (incidenciasRestriccion.length > 0) {
                    throw new custom_exceptions_1.ConflictError((0, restricciones_validator_service_1.formatearIncidenciasRestriccion)(incidenciasRestriccion));
                }
                await this.dataSource.transaction(async (manager) => {
                    for (const diaExistente of plan.dias ?? []) {
                        for (const opcion of diaExistente.opcionesComida ?? []) {
                            await manager.remove(opcion);
                        }
                        await manager.remove(diaExistente);
                    }
                    for (const diaDto of payload.dias) {
                        const dia = new entities_2.DiaPlanOrmEntity();
                        dia.dia = diaDto.dia;
                        dia.orden = diaDto.orden;
                        dia.planAlimentacion = plan;
                        const diaGuardado = await manager.save(dia);
                        for (const opcionDto of diaDto.opcionesComida) {
                            const opcion = new entities_2.OpcionComidaOrmEntity();
                            opcion.tipoComida = opcionDto.tipoComida;
                            opcion.comentarios = opcionDto.comentarios ?? null;
                            opcion.diaPlan = diaGuardado;
                            opcion.items = opcionDto.items.map((itemDto) => {
                                const alimento = alimentoMap.get(itemDto.alimentoId);
                                const item = new entities_2.ItemComidaOrmEntity();
                                item.alimentoId = alimento.idAlimento;
                                item.alimentoNombre = alimento.nombre;
                                item.cantidad = itemDto.cantidad;
                                item.unidad = alimento.unidadMedida;
                                item.notas = null;
                                item.calorias = alimento.calorias;
                                item.proteinas = alimento.proteinas;
                                item.carbohidratos = alimento.carbohidratos;
                                item.grasas = alimento.grasas;
                                item.alimento = alimento;
                                item.opcionComida = opcion;
                                return item;
                            });
                            await manager.save(opcion);
                        }
                    }
                    plan.dias = [];
                });
                await this.planRepo.update(plan.idPlanAlimentacion, {
                    objetivoNutricional: plan.objetivoNutricional,
                    motivoEdicion: plan.motivoEdicion,
                    ultimaEdicion: plan.ultimaEdicion,
                });
            }
            else {
                await this.planRepo.save(plan);
            }
            const planId = plan.idPlanAlimentacion;
            const planActualizado = await this.planRepo.findOne({
                where: { idPlanAlimentacion: planId },
                relations: ['socio', 'nutricionista'],
            });
            const dias = await this.diaRepo.find({
                where: { planAlimentacion: { idPlanAlimentacion: planId } },
                relations: [
                    'opcionesComida',
                    'opcionesComida.items',
                    'opcionesComida.items.alimento',
                ],
                order: { orden: 'ASC' },
            });
            if (planActualizado) {
                planActualizado.dias = dias;
            }
            if (!planActualizado) {
                throw new custom_exceptions_1.NotFoundError('Plan de alimentación', String(plan.idPlanAlimentacion));
            }
            try {
                await this.auditoriaService.registrar({
                    usuarioId: nutricionistaUserId,
                    accion: auditoria_entity_1.AccionAuditoria.PLAN_EDITADO,
                    entidad: 'PlanAlimentacion',
                    entidadId: plan.idPlanAlimentacion,
                    metadata: {
                        objetivoNutricional: plan.objetivoNutricional,
                        motivoEdicion: payload.motivoEdicion,
                    },
                });
                const socioActualizado = planActualizado.socio;
                if (socioActualizado.idPersona == null) {
                    throw new custom_exceptions_1.NotFoundError('Socio', String(plan.idPlanAlimentacion));
                }
                await this.notificacionesService.crear({
                    destinatarioId: socioActualizado.idPersona,
                    tipo: tipo_notificacion_enum_1.TipoNotificacion.PLAN_EDITADO,
                    titulo: 'Plan de alimentación editado',
                    mensaje: 'Tu nutricionista actualizó tu plan de alimentación.',
                    metadata: { planId: planActualizado.idPlanAlimentacion },
                });
                return (0, plan_alimentacion_mapper_1.mapPlanToResponse)(planActualizado);
            }
            catch (err) {
                console.error('[EditarPlanAlimentacionUseCase] Error in mapper:', err);
                throw err;
            }
        }
        catch (error) {
            console.error('[EditarPlan] Unexpected error:', error);
            throw error;
        }
    }
};
exports.EditarPlanAlimentacionUseCase = EditarPlanAlimentacionUseCase;
exports.EditarPlanAlimentacionUseCase = EditarPlanAlimentacionUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_2.PlanAlimentacionOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_2.DiaPlanOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_2.OpcionComidaOrmEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_2.AlimentoOrmEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_2.SocioOrmEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_2.NutricionistaOrmEntity)),
    __param(6, (0, typeorm_1.InjectRepository)(entities_1.UsuarioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        auditoria_service_1.AuditoriaService,
        typeorm_2.DataSource,
        notificaciones_service_1.NotificacionesService,
        restricciones_validator_service_1.RestriccionesValidator])
], EditarPlanAlimentacionUseCase);
//# sourceMappingURL=editar-plan-alimentacion.use-case.js.map