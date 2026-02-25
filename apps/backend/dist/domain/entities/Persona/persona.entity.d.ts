import { Genero } from './Genero';
export declare abstract class PersonaEntity {
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
    fechaBaja: Date | null;
    fotoPerfilKey: string | null;
    constructor(idPersona: number | null | undefined, nombre: string, apellido: string, fechaNacimiento: Date, telefono: string, genero: Genero, direccion: string, ciudad: string, provincia: string, dni: string, email?: string, fotoPerfilKey?: string | null);
}
