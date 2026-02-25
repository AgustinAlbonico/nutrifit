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
exports.GetResumenProgresoUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const medicion_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/medicion.entity");
const persona_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/persona.entity");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
let GetResumenProgresoUseCase = class GetResumenProgresoUseCase {
    medicionRepository;
    socioRepository;
    constructor(medicionRepository, socioRepository) {
        this.medicionRepository = medicionRepository;
        this.socioRepository = socioRepository;
    }
    async execute(socioId) {
        const socio = await this.socioRepository.findOne({
            where: { idPersona: socioId },
            relations: ['fichaSalud'],
        });
        if (!socio) {
            throw new custom_exceptions_1.NotFoundError('Socio no encontrado');
        }
        const mediciones = await this.medicionRepository
            .createQueryBuilder('medicion')
            .innerJoin('medicion.turno', 'turno')
            .innerJoin('turno.socio', 'socio')
            .where('socio.idPersona = :socioId', { socioId })
            .orderBy('medicion.createdAt', 'ASC')
            .getMany();
        let altura = socio.fichaSalud?.altura ?? null;
        if (mediciones.length > 0) {
            const ultimaMedicionConAltura = [...mediciones]
                .reverse()
                .find((m) => m.altura > 0);
            if (ultimaMedicionConAltura) {
                altura = ultimaMedicionConAltura.altura;
            }
        }
        const respuestaVacia = {
            peso: { inicial: null, actual: null, diferencia: null, tendencia: null },
            imc: {
                inicial: null,
                actual: null,
                diferencia: null,
                categoriaActual: null,
            },
            perimetros: {
                cintura: {
                    inicial: null,
                    actual: null,
                    diferencia: null,
                    tendencia: null,
                },
                cadera: {
                    inicial: null,
                    actual: null,
                    diferencia: null,
                    tendencia: null,
                },
                brazo: {
                    inicial: null,
                    actual: null,
                    diferencia: null,
                    tendencia: null,
                },
                muslo: {
                    inicial: null,
                    actual: null,
                    diferencia: null,
                    tendencia: null,
                },
            },
            relacionCinturaCadera: {
                inicial: null,
                actual: null,
                riesgoCardiovascular: null,
            },
            rangoSaludable: {
                pesoMinimo: altura ? this.calcularPesoPorIMC(altura, 18.5) : null,
                pesoMaximo: altura ? this.calcularPesoPorIMC(altura, 24.9) : null,
            },
            totalMediciones: mediciones.length,
            primeraMedicion: mediciones.length > 0 ? mediciones[0].createdAt : null,
            ultimaMedicion: mediciones.length > 0
                ? mediciones[mediciones.length - 1].createdAt
                : null,
        };
        if (mediciones.length === 0) {
            return respuestaVacia;
        }
        const primeraMedicion = mediciones[0];
        const ultimaMedicion = mediciones[mediciones.length - 1];
        const pesoInicial = Number(primeraMedicion.peso);
        const pesoActual = Number(ultimaMedicion.peso);
        const tendenciaPeso = this.calcularTendencia(mediciones.slice(-5).map((m) => Number(m.peso)));
        const imcInicial = Number(primeraMedicion.imc);
        const imcActual = Number(ultimaMedicion.imc);
        const categoriaIMC = this.categorizarIMC(imcActual);
        const progresoCintura = this.calcularProgresoMetrica(mediciones.map((m) => m.perimetroCintura ? Number(m.perimetroCintura) : null));
        const progresoCadera = this.calcularProgresoMetrica(mediciones.map((m) => m.perimetroCadera ? Number(m.perimetroCadera) : null));
        const progresoBrazo = this.calcularProgresoMetrica(mediciones.map((m) => m.perimetroBrazo ? Number(m.perimetroBrazo) : null));
        const progresoMuslo = this.calcularProgresoMetrica(mediciones.map((m) => m.perimetroMuslo ? Number(m.perimetroMuslo) : null));
        const relacionInicial = this.calcularRelacionCinturaCadera(primeraMedicion.perimetroCintura
            ? Number(primeraMedicion.perimetroCintura)
            : null, primeraMedicion.perimetroCadera
            ? Number(primeraMedicion.perimetroCadera)
            : null);
        const relacionActual = this.calcularRelacionCinturaCadera(ultimaMedicion.perimetroCintura
            ? Number(ultimaMedicion.perimetroCintura)
            : null, ultimaMedicion.perimetroCadera
            ? Number(ultimaMedicion.perimetroCadera)
            : null);
        const riesgoCardiovascular = relacionActual
            ? this.evaluarRiesgoCardiovascular(relacionActual)
            : null;
        return {
            peso: {
                inicial: pesoInicial,
                actual: pesoActual,
                diferencia: parseFloat((pesoActual - pesoInicial).toFixed(2)),
                tendencia: tendenciaPeso,
            },
            imc: {
                inicial: imcInicial,
                actual: imcActual,
                diferencia: parseFloat((imcActual - imcInicial).toFixed(2)),
                categoriaActual: categoriaIMC,
            },
            perimetros: {
                cintura: progresoCintura,
                cadera: progresoCadera,
                brazo: progresoBrazo,
                muslo: progresoMuslo,
            },
            relacionCinturaCadera: {
                inicial: relacionInicial,
                actual: relacionActual,
                riesgoCardiovascular: riesgoCardiovascular,
            },
            rangoSaludable: {
                pesoMinimo: altura ? this.calcularPesoPorIMC(altura, 18.5) : null,
                pesoMaximo: altura ? this.calcularPesoPorIMC(altura, 24.9) : null,
            },
            totalMediciones: mediciones.length,
            primeraMedicion: primeraMedicion.createdAt,
            ultimaMedicion: ultimaMedicion.createdAt,
        };
    }
    calcularTendencia(valores) {
        if (valores.length < 2)
            return 'estable';
        const n = valores.length;
        const sumaX = (n * (n - 1)) / 2;
        const sumaY = valores.reduce((a, b) => a + b, 0);
        const sumaXY = valores.reduce((sum, y, x) => sum + x * y, 0);
        const sumaX2 = (n * (n - 1) * (2 * n - 1)) / 6;
        const pendiente = (n * sumaXY - sumaX * sumaY) / (n * sumaX2 - sumaX * sumaX);
        if (Math.abs(pendiente) < 0.1)
            return 'estable';
        return pendiente > 0 ? 'subiendo' : 'bajando';
    }
    categorizarIMC(imc) {
        if (imc < 18.5)
            return 'bajo_peso';
        if (imc < 25)
            return 'normal';
        if (imc < 30)
            return 'sobrepeso';
        return 'obesidad';
    }
    calcularProgresoMetrica(valores) {
        const valoresValidos = valores.filter((v) => v !== null);
        if (valoresValidos.length === 0) {
            return { inicial: null, actual: null, diferencia: null, tendencia: null };
        }
        const inicial = valoresValidos[0];
        const actual = valoresValidos[valoresValidos.length - 1];
        const tendencia = this.calcularTendencia(valoresValidos);
        return {
            inicial,
            actual,
            diferencia: parseFloat((actual - inicial).toFixed(2)),
            tendencia,
        };
    }
    calcularRelacionCinturaCadera(cintura, cadera) {
        if (!cintura || !cadera || cadera === 0)
            return null;
        return parseFloat((cintura / cadera).toFixed(3));
    }
    evaluarRiesgoCardiovascular(relacion) {
        if (relacion < 0.85)
            return 'bajo';
        if (relacion < 0.9)
            return 'moderado';
        return 'alto';
    }
    calcularPesoPorIMC(alturaCm, imc) {
        const alturaM = alturaCm / 100;
        return parseFloat((imc * alturaM * alturaM).toFixed(2));
    }
};
exports.GetResumenProgresoUseCase = GetResumenProgresoUseCase;
exports.GetResumenProgresoUseCase = GetResumenProgresoUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(medicion_entity_1.MedicionOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(persona_entity_1.SocioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], GetResumenProgresoUseCase);
//# sourceMappingURL=get-resumen-progreso.use-case.js.map