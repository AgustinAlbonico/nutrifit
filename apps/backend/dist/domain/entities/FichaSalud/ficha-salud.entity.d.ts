import { AlergiaEntity } from './alergia.entity';
import { NivelActividadFisica } from './NivelActividadFisica';
import { FrecuenciaComidas } from './FrecuenciaComidas';
import { ConsumoAlcohol } from './ConsumoAlcohol';
import { PatologiaEntity } from './patologia.entity';
export declare class FichaSaludEntity {
    idFichaSalud: number | null;
    fechaCreacion: Date;
    nivelActividadFisica: NivelActividadFisica;
    peso: number;
    altura: number;
    patologias: PatologiaEntity[];
    alergias: AlergiaEntity[];
    objetivoPersonal: string;
    medicacionActual: string | null;
    suplementosActuales: string | null;
    cirugiasPrevias: string | null;
    antecedentesFamiliares: string | null;
    frecuenciaComidas: FrecuenciaComidas | null;
    consumoAguaDiario: number | null;
    restriccionesAlimentarias: string | null;
    consumoAlcohol: ConsumoAlcohol | null;
    fumaTabaco: boolean;
    horasSueno: number | null;
    contactoEmergenciaNombre: string | null;
    contactoEmergenciaTelefono: string | null;
    constructor(idFichaSalud: number | null | undefined, nivelActividadFisica: NivelActividadFisica, peso: number, altura: number, fechaCreacion: Date | undefined, patologias: PatologiaEntity[] | undefined, alergias: AlergiaEntity[] | undefined, objetivoPersonal: string, medicacionActual?: string | null, suplementosActuales?: string | null, cirugiasPrevias?: string | null, antecedentesFamiliares?: string | null, frecuenciaComidas?: FrecuenciaComidas | null, consumoAguaDiario?: number | null, restriccionesAlimentarias?: string | null, consumoAlcohol?: ConsumoAlcohol | null, fumaTabaco?: boolean, horasSueno?: number | null, contactoEmergenciaNombre?: string | null, contactoEmergenciaTelefono?: string | null);
}
