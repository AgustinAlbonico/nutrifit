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
const typeorm_2 = require("typeorm");
const plan_alimentacion_mapper_1 = require("./plan-alimentacion.mapper");
let EditarPlanAlimentacionUseCase = class EditarPlanAlimentacionUseCase {
    planRepo;
    diaRepo;
    opcionRepo;
    alimentoRepo;
    socioRepo;
    nutricionistaRepo;
    fichaSaludRepo;
    usuarioRepo;
    dataSource;
    constructor(planRepo, diaRepo, opcionRepo, alimentoRepo, socioRepo, nutricionistaRepo, fichaSaludRepo, usuarioRepo, dataSource) {
        this.planRepo = planRepo;
        this.diaRepo = diaRepo;
        this.opcionRepo = opcionRepo;
        this.alimentoRepo = alimentoRepo;
        this.socioRepo = socioRepo;
        this.nutricionistaRepo = nutricionistaRepo;
        this.fichaSaludRepo = fichaSaludRepo;
        this.usuarioRepo = usuarioRepo;
        this.dataSource = dataSource;
    }
    async execute(nutricionistaUserId, payload) {
        try {
            const plan = await this.planRepo.findOne({
                where: { idPlanAlimentacion: payload.planId },
                relations: {
                    nutricionista: true,
                    socio: { fichaSalud: true },
                    dias: { opcionesComida: { alimentos: true } },
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
            if (usuario.rol !== Rol_1.Rol.ADMIN) {
                if (plan.nutricionista.idPersona !== nutricionistaUserId) {
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
                    ...new Set(payload.dias.flatMap((d) => d.opcionesComida.flatMap((o) => o.alimentosIds))),
                ];
                const alimentos = await this.alimentoRepo.findBy({
                    idAlimento: (0, typeorm_2.In)(todosAlimentosIds),
                });
                if (alimentos.length !== todosAlimentosIds.length) {
                    throw new custom_exceptions_1.NotFoundError('Uno o más alimentos no existen en el sistema');
                }
                const socioConFicha = plan.socio;
                const fichaSalud = socioConFicha?.fichaSalud
                    ? await this.fichaSaludRepo.findOne({
                        where: { idFichaSalud: socioConFicha.fichaSalud.idFichaSalud },
                        relations: { alergias: true },
                    })
                    : null;
                if (fichaSalud?.alergias?.length) {
                    const nombresAlergias = fichaSalud.alergias.map((a) => a.nombre.toLowerCase());
                    const alimentoConflicto = alimentos.find((al) => nombresAlergias.some((alergia) => al.nombre.toLowerCase().includes(alergia)));
                    if (alimentoConflicto) {
                        throw new custom_exceptions_1.ForbiddenError(`El alimento "${alimentoConflicto.nombre}" puede estar relacionado con una alergia registrada del socio.`);
                    }
                }
                const alimentoMap = new Map(alimentos.map((a) => [a.idAlimento, a]));
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
                            opcion.alimentos = opcionDto.alimentosIds.map((id) => alimentoMap.get(id));
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
                relations: ['opcionesComida', 'opcionesComida.alimentos'],
                order: { orden: 'ASC' },
            });
            if (planActualizado) {
                planActualizado.dias = dias;
            }
            if (!planActualizado) {
                throw new custom_exceptions_1.NotFoundError('Plan de alimentación', String(plan.idPlanAlimentacion));
            }
            try {
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
    __param(6, (0, typeorm_1.InjectRepository)(entities_2.FichaSaludOrmEntity)),
    __param(7, (0, typeorm_1.InjectRepository)(entities_1.UsuarioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], EditarPlanAlimentacionUseCase);
//# sourceMappingURL=editar-plan-alimentacion.use-case.js.map