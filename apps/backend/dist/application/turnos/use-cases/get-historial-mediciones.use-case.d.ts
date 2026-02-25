import { Repository } from 'typeorm';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
export interface MedicionHistorial {
    idMedicion: number;
    fecha: Date;
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
    profesional: {
        id: number | null;
        nombre: string;
        apellido: string;
    } | null;
}
export interface HistorialMedicionesResponse {
    socioId: number;
    nombreSocio: string;
    apellidoSocio: string;
    altura: number;
    mediciones: MedicionHistorial[];
}
export declare class GetHistorialMedicionesUseCase {
    private readonly medicionRepository;
    private readonly socioRepository;
    constructor(medicionRepository: Repository<MedicionOrmEntity>, socioRepository: Repository<SocioOrmEntity>);
    execute(socioId: number): Promise<HistorialMedicionesResponse>;
}
