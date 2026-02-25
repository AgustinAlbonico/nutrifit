import { NivelActividadFisica } from 'src/domain/entities/FichaSalud/NivelActividadFisica';
export declare class FichaSaludPacienteResponseDto {
    socioId: number;
    nombreCompleto: string;
    dni: string;
    altura: number;
    peso: number;
    nivelActividadFisica: NivelActividadFisica;
    alergias: string[];
    patologias: string[];
    objetivoPersonal: string;
}
