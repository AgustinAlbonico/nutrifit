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
exports.CrearPlanAlimentacionUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const entities_2 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
const plan_alimentacion_mapper_1 = require("./plan-alimentacion.mapper");
const notificaciones_service_1 = require("../../notificaciones/notificaciones.service");
const tipo_notificacion_enum_1 = require("../../../domain/entities/Notificacion/tipo-notificacion.enum");
const restricciones_validator_service_1 = require("../../restricciones/restricciones-validator.service");
let CrearPlanAlimentacionUseCase = class CrearPlanAlimentacionUseCase {
    planRepo;
    diaRepo;
    opcionRepo;
    alimentoRepo;
    socioRepo;
    nutricionistaRepo;
    usuarioRepo;
    notificacionesService;
    restriccionesValidator;
    constructor(planRepo, diaRepo, opcionRepo, alimentoRepo, socioRepo, nutricionistaRepo, usuarioRepo, notificacionesService, restriccionesValidator) {
        this.planRepo = planRepo;
        this.diaRepo = diaRepo;
        this.opcionRepo = opcionRepo;
        this.alimentoRepo = alimentoRepo;
        this.socioRepo = socioRepo;
        this.nutricionistaRepo = nutricionistaRepo;
        this.usuarioRepo = usuarioRepo;
        this.notificacionesService = notificacionesService;
        this.restriccionesValidator = restriccionesValidator;
    }
    async execute(nutricionistaUserId, payload) {
        const usuario = await this.usuarioRepo.findOne({
            where: { idUsuario: nutricionistaUserId },
        });
        if (!usuario) {
            throw new custom_exceptions_1.ForbiddenError('Usuario no encontrado.');
        }
        let nutricionista = null;
        if (usuario.rol === Rol_1.Rol.ADMIN) {
            const socio = await this.socioRepo.findOne({
                where: { idPersona: payload.socioId },
            });
            if (!socio) {
                throw new custom_exceptions_1.NotFoundError('Socio', String(payload.socioId));
            }
            nutricionista = await this.nutricionistaRepo.findOne({
                where: {},
                order: { idPersona: 'ASC' },
            });
            if (!nutricionista) {
                throw new custom_exceptions_1.ForbiddenError('No hay nutricionistas disponibles para asignar al plan.');
            }
        }
        else {
            nutricionista = await this.nutricionistaRepo.findOne({
                where: { idPersona: nutricionistaUserId },
            });
            if (!nutricionista) {
                throw new custom_exceptions_1.ForbiddenError('El usuario autenticado no es un nutricionista válido.');
            }
        }
        const socio = await this.socioRepo.findOne({
            where: { idPersona: payload.socioId },
            relations: { fichaSalud: true },
        });
        if (!socio) {
            throw new custom_exceptions_1.NotFoundError('Socio', String(payload.socioId));
        }
        const planActivoExistente = await this.planRepo.findOne({
            where: {
                socio: { idPersona: payload.socioId },
                activo: true,
            },
        });
        if (planActivoExistente) {
            throw new custom_exceptions_1.ConflictError('El socio ya cuenta con un plan de alimentación activo. Debe eliminarlo antes de crear uno nuevo.');
        }
        if (!payload.dias || payload.dias.length === 0) {
            throw new custom_exceptions_1.BadRequestError('El plan debe tener al menos un día configurado.');
        }
        const totalOpciones = payload.dias.reduce((acc, d) => acc + (d.opcionesComida?.length ?? 0), 0);
        if (totalOpciones === 0) {
            throw new custom_exceptions_1.BadRequestError('El plan debe tener al menos una opción de comida en total.');
        }
        const todosAlimentosIds = [
            ...new Set(payload.dias.flatMap((d) => d.opcionesComida.flatMap((o) => o.items.map((item) => item.alimentoId)))),
        ];
        const alimentos = await this.alimentoRepo.findByIds(todosAlimentosIds);
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
        }))), socio.idPersona ?? payload.socioId);
        if (incidenciasRestriccion.length > 0) {
            throw new custom_exceptions_1.ConflictError((0, restricciones_validator_service_1.formatearIncidenciasRestriccion)(incidenciasRestriccion));
        }
        const plan = new entities_2.PlanAlimentacionOrmEntity();
        plan.fechaCreacion = new Date();
        plan.objetivoNutricional = payload.objetivoNutricional;
        plan.socio = socio;
        plan.nutricionista =
            nutricionista;
        plan.activo = true;
        plan.eliminadoEn = null;
        plan.motivoEliminacion = null;
        plan.motivoEdicion = null;
        plan.ultimaEdicion = null;
        const planGuardado = await this.planRepo.save(plan);
        for (const diaDto of payload.dias) {
            const dia = new entities_2.DiaPlanOrmEntity();
            dia.dia = diaDto.dia;
            dia.orden = diaDto.orden;
            dia.planAlimentacion = planGuardado;
            const diaGuardado = await this.diaRepo.save(dia);
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
                await this.opcionRepo.save(opcion);
            }
        }
        const planCompleto = await this.planRepo.findOne({
            where: { idPlanAlimentacion: planGuardado.idPlanAlimentacion },
            relations: {
                dias: { opcionesComida: { items: { alimento: true } } },
                socio: true,
                nutricionista: true,
            },
        });
        if (socio.idPersona) {
            await this.notificacionesService.crear({
                destinatarioId: socio.idPersona,
                tipo: tipo_notificacion_enum_1.TipoNotificacion.PLAN_CREADO,
                titulo: 'Plan de alimentación creado',
                mensaje: 'Tu nutricionista creó un nuevo plan de alimentación.',
                metadata: { planId: planGuardado.idPlanAlimentacion },
            });
        }
        return (0, plan_alimentacion_mapper_1.mapPlanToResponse)(planCompleto);
    }
};
exports.CrearPlanAlimentacionUseCase = CrearPlanAlimentacionUseCase;
exports.CrearPlanAlimentacionUseCase = CrearPlanAlimentacionUseCase = __decorate([
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
        notificaciones_service_1.NotificacionesService,
        restricciones_validator_service_1.RestriccionesValidator])
], CrearPlanAlimentacionUseCase);
//# sourceMappingURL=crear-plan-alimentacion.use-case.js.map