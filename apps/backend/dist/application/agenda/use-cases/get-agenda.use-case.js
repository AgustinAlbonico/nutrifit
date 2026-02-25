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
exports.GetAgendaUseCase = void 0;
const common_1 = require("@nestjs/common");
const agenda_repository_1 = require("../../../domain/entities/Agenda/agenda.repository");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
let GetAgendaUseCase = class GetAgendaUseCase {
    agendaRepository;
    nutricionistaRepository;
    constructor(agendaRepository, nutricionistaRepository) {
        this.agendaRepository = agendaRepository;
        this.nutricionistaRepository = nutricionistaRepository;
    }
    async execute(nutricionistaId) {
        const nutricionista = await this.nutricionistaRepository.findById(nutricionistaId);
        if (!nutricionista) {
            throw new custom_exceptions_1.NotFoundError('Profesional', String(nutricionistaId));
        }
        return this.agendaRepository.findByNutricionistaId(nutricionistaId);
    }
};
exports.GetAgendaUseCase = GetAgendaUseCase;
exports.GetAgendaUseCase = GetAgendaUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(agenda_repository_1.AGENDA_REPOSITORY)),
    __param(1, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __metadata("design:paramtypes", [agenda_repository_1.IAgendaRepository,
        nutricionista_repository_1.NutricionistaRepository])
], GetAgendaUseCase);
//# sourceMappingURL=get-agenda.use-case.js.map