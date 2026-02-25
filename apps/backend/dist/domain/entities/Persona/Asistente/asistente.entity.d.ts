import { Genero } from '../Genero';
import { PersonaEntity } from '../persona.entity';
export declare class AsistenteEntity extends PersonaEntity {
    constructor(idPersona: number | null | undefined, nombre: string, apellido: string, fechaNacimiento: Date, telefono: string, genero: Genero, direccion: string, ciudad: string, provincia: string, dni: string);
}
