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
let CrearPlanAlimentacionUseCase = class CrearPlanAlimentacionUseCase {
    planRepo;
    diaRepo;
    opcionRepo;
    alimentoRepo;
    socioRepo;
    nutricionistaRepo;
    fichaSaludRepo;
    usuarioRepo;
    constructor(planRepo, diaRepo, opcionRepo, alimentoRepo, socioRepo, nutricionistaRepo, fichaSaludRepo, usuarioRepo) {
        this.planRepo = planRepo;
        this.diaRepo = diaRepo;
        this.opcionRepo = opcionRepo;
        this.alimentoRepo = alimentoRepo;
        this.socioRepo = socioRepo;
        this.nutricionistaRepo = nutricionistaRepo;
        this.fichaSaludRepo = fichaSaludRepo;
        this.usuarioRepo = usuarioRepo;
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
            ...new Set(payload.dias.flatMap((d) => d.opcionesComida.flatMap((o) => o.alimentosIds))),
        ];
        const alimentos = await this.alimentoRepo.findByIds(todosAlimentosIds);
        if (alimentos.length !== todosAlimentosIds.length) {
            throw new custom_exceptions_1.NotFoundError('Uno o más alimentos no existen en el sistema');
        }
        const fichaSalud = socio.fichaSalud
            ? await this.fichaSaludRepo.findOne({
                where: {
                    idFichaSalud: socio.fichaSalud
                        .idFichaSalud,
                },
                relations: { alergias: true },
            })
            : null;
        if (fichaSalud?.alergias?.length) {
            const nombresAlergias = fichaSalud.alergias.map((a) => a.nombre.toLowerCase());
            const alimentoConflicto = alimentos.find((al) => nombresAlergias.some((alergia) => al.nombre.toLowerCase().includes(alergia)));
            if (alimentoConflicto) {
                throw new custom_exceptions_1.ConflictError(`El alimento "${alimentoConflicto.nombre}" puede estar relacionado con una alergia registrada del socio.`);
            }
        }
        const alimentoMap = new Map(alimentos.map((a) => [a.idAlimento, a]));
        const plan = new entities_2.PlanAlimentacionOrmEntity();
        plan.fechaCreacion = new Date();
        plan.objetivoNutricional = payload.objetivoNutricional;
        plan.socio = socio;
        plan.nutricionista = nutricionista;
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
                opcion.alimentos = opcionDto.alimentosIds.map((id) => alimentoMap.get(id));
                await this.opcionRepo.save(opcion);
            }
        }
        const planCompleto = await this.planRepo.findOne({
            where: { idPlanAlimentacion: planGuardado.idPlanAlimentacion },
            relations: {
                dias: { opcionesComida: { alimentos: true } },
                socio: true,
                nutricionista: true,
            },
        });
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
    __param(6, (0, typeorm_1.InjectRepository)(entities_2.FichaSaludOrmEntity)),
    __param(7, (0, typeorm_1.InjectRepository)(entities_1.UsuarioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CrearPlanAlimentacionUseCase);
//# sourceMappingURL=crear-plan-alimentacion.use-case.js.map