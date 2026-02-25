import { Repository } from 'typeorm';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
export interface SocioConFichaDto {
    idPersona: number;
    nombre: string;
    apellido: string;
    dni: string | null;
    tieneFichaSalud: boolean;
    nombreCompleto: string;
}
export declare class BuscarSociosConFichaUseCase {
    private readonly socioRepository;
    constructor(socioRepository: Repository<SocioOrmEntity>);
    execute(busqueda?: string): Promise<SocioConFichaDto[]>;
}
