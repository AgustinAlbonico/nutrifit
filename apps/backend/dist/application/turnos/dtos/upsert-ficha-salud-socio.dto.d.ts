import { NivelActividadFisica } from 'src/domain/entities/FichaSalud/NivelActividadFisica';
import { FrecuenciaComidas } from 'src/domain/entities/FichaSalud/FrecuenciaComidas';
import { ConsumoAlcohol } from 'src/domain/entities/FichaSalud/ConsumoAlcohol';
export declare class UpsertFichaSaludSocioDto {
    altura: number;
    peso: number;
    nivelActividadFisica: NivelActividadFisica;
    objetivoPersonal: string;
    alergias?: string[];
    patologias?: string[];
    medicacionActual?: string;
    suplementosActuales?: string;
    cirugiasPrevias?: string;
    antecedentesFamiliares?: string;
    frecuenciaComidas?: FrecuenciaComidas;
    consumoAguaDiario?: number;
    restriccionesAlimentarias?: string;
    consumoAlcohol?: ConsumoAlcohol;
    fumaTabaco?: boolean;
    horasSueno?: number;
    contactoEmergenciaNombre?: string;
    contactoEmergenciaTelefono?: string;
}
