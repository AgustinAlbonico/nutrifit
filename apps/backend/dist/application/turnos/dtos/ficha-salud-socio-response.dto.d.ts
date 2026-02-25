import { NivelActividadFisica } from 'src/domain/entities/FichaSalud/NivelActividadFisica';
import { FrecuenciaComidas } from 'src/domain/entities/FichaSalud/FrecuenciaComidas';
import { ConsumoAlcohol } from 'src/domain/entities/FichaSalud/ConsumoAlcohol';
export declare class FichaSaludSocioResponseDto {
    socioId: number;
    fichaSaludId: number;
    altura: number;
    peso: number;
    nivelActividadFisica: NivelActividadFisica;
    alergias: string[];
    patologias: string[];
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
}
