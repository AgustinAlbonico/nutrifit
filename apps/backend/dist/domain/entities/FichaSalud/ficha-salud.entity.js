"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FichaSaludEntity = void 0;
class FichaSaludEntity {
    idFichaSalud;
    fechaCreacion;
    nivelActividadFisica;
    peso;
    altura;
    patologias;
    alergias;
    objetivoPersonal;
    medicacionActual;
    suplementosActuales;
    cirugiasPrevias;
    antecedentesFamiliares;
    frecuenciaComidas;
    consumoAguaDiario;
    restriccionesAlimentarias;
    consumoAlcohol;
    fumaTabaco;
    horasSueno;
    contactoEmergenciaNombre;
    contactoEmergenciaTelefono;
    constructor(idFichaSalud = null, nivelActividadFisica, peso, altura, fechaCreacion = new Date(), patologias = [], alergias = [], objetivoPersonal, medicacionActual = null, suplementosActuales = null, cirugiasPrevias = null, antecedentesFamiliares = null, frecuenciaComidas = null, consumoAguaDiario = null, restriccionesAlimentarias = null, consumoAlcohol = null, fumaTabaco = false, horasSueno = null, contactoEmergenciaNombre = null, contactoEmergenciaTelefono = null) {
        this.idFichaSalud = idFichaSalud;
        this.fechaCreacion = fechaCreacion;
        this.nivelActividadFisica = nivelActividadFisica;
        this.peso = peso;
        this.altura = altura;
        this.patologias = patologias;
        this.alergias = alergias;
        this.objetivoPersonal = objetivoPersonal;
        this.medicacionActual = medicacionActual;
        this.suplementosActuales = suplementosActuales;
        this.cirugiasPrevias = cirugiasPrevias;
        this.antecedentesFamiliares = antecedentesFamiliares;
        this.frecuenciaComidas = frecuenciaComidas;
        this.consumoAguaDiario = consumoAguaDiario;
        this.restriccionesAlimentarias = restriccionesAlimentarias;
        this.consumoAlcohol = consumoAlcohol;
        this.fumaTabaco = fumaTabaco;
        this.horasSueno = horasSueno;
        this.contactoEmergenciaNombre = contactoEmergenciaNombre;
        this.contactoEmergenciaTelefono = contactoEmergenciaTelefono;
    }
}
exports.FichaSaludEntity = FichaSaludEntity;
//# sourceMappingURL=ficha-salud.entity.js.map