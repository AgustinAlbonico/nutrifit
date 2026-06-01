import { Genero } from './Genero';
import { AuditableEntity } from "../../shared/auditable.entity";
export declare abstract class PersonaEntity extends AuditableEntity {
    idPersona: number | null;
    nombre: string;
    apellido: string;
    fechaNacimiento: Date;
    genero: Genero;
    telefono: string;
    direccion: string;
    ciudad: string;
    provincia: string;
    dni: string;
    email: string;
    fotoPerfilKey: string | null;
    gimnasioId: number;
    constructor(idPersona: number | null | undefined, nombre: string, apellido: string, fechaNacimiento: Date, telefono: string, genero: Genero, direccion: string, ciudad: string, provincia: string, dni: string, email?: string, fotoPerfilKey?: string | null, gimnasioId?: number, fechaBaja?: Date | null);
}
