import { AlergiaEntity } from './alergia.entity';
import { NivelActividadFisica } from './NivelActividadFisica';
import { FrecuenciaComidas } from './FrecuenciaComidas';
import { ConsumoAlcohol } from './ConsumoAlcohol';
import { PatologiaEntity } from './patologia.entity';

export class FichaSaludEntity {
  idFichaSalud: number | null;
  fechaCreacion: Date;
  nivelActividadFisica: NivelActividadFisica;
  peso: number;
  altura: number;
  patologias: PatologiaEntity[];
  alergias: AlergiaEntity[];
  objetivoPersonal: string;
  // --- Medicación y suplementos ---
  medicacionActual: string | null;
  suplementosActuales: string | null;
  // --- Historial médico ---
  cirugiasPrevias: string | null;
  antecedentesFamiliares: string | null;
  // --- Hábitos alimentarios ---
  frecuenciaComidas: FrecuenciaComidas | null;
  consumoAguaDiario: number | null;
  restriccionesAlimentarias: string | null;
  // --- Hábitos de vida ---
  consumoAlcohol: ConsumoAlcohol | null;
  fumaTabaco: boolean;
  horasSueno: number | null;
  // --- Contacto de emergencia ---
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;

  constructor(
    idFichaSalud: number | null = null,
    nivelActividadFisica: NivelActividadFisica,
    peso: number,
    altura: number,
    fechaCreacion: Date = new Date(),
    patologias: PatologiaEntity[] = [],
    alergias: AlergiaEntity[] = [],
    objetivoPersonal: string,
    medicacionActual: string | null = null,
    suplementosActuales: string | null = null,
    cirugiasPrevias: string | null = null,
    antecedentesFamiliares: string | null = null,
    frecuenciaComidas: FrecuenciaComidas | null = null,
    consumoAguaDiario: number | null = null,
    restriccionesAlimentarias: string | null = null,
    consumoAlcohol: ConsumoAlcohol | null = null,
    fumaTabaco: boolean = false,
    horasSueno: number | null = null,
    contactoEmergenciaNombre: string | null = null,
    contactoEmergenciaTelefono: string | null = null,
  ) {
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
