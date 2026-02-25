import { TurnoOrmEntity } from './turno.entity';
export declare class MedicionOrmEntity {
    idMedicion: number;
    peso: number;
    altura: number;
    imc: number;
    perimetroCintura: number | null;
    perimetroCadera: number | null;
    perimetroBrazo: number | null;
    perimetroMuslo: number | null;
    perimetroPecho: number | null;
    pliegueTriceps: number | null;
    pliegueAbdominal: number | null;
    pliegueMuslo: number | null;
    porcentajeGrasa: number | null;
    masaMagra: number | null;
    frecuenciaCardiaca: number | null;
    tensionSistolica: number | null;
    tensionDiastolica: number | null;
    notasMedicion: string | null;
    createdAt: Date;
    turno: TurnoOrmEntity;
}
