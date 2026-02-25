export declare class ObservacionClinicaEntity {
    idObservacion: number | null;
    comentario: string;
    peso: number;
    altura: number;
    imc: number;
    objetivosSocio: string;
    sugerencias: string | null;
    habitosSocio: string | null;
    circunferenciaCintura: number;
    constructor(idObservacion: number | null | undefined, comentario: string, peso: number, altura: number, imc: number, objetivosSocio: string, sugerencias: string | null | undefined, habitosSocio: string | null | undefined, circunferenciaCintura: number);
}
