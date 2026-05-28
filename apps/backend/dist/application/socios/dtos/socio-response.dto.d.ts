import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
export interface SocioResponseSource {
    idPersona: number | null;
    nombre: string;
    apellido: string;
    dni: string | null;
    fechaNacimiento: Date | string;
    telefono: string;
    genero: string;
    direccion: string;
    ciudad: string;
    provincia: string;
    email?: string | null;
    fechaBaja?: Date | string | null;
    fotoPerfilKey?: string | null;
}
export declare class SocioResponseDto {
    idPersona: number | null;
    nombre: string;
    apellido: string;
    dni: string;
    fechaNacimiento: string | null;
    telefono: string;
    genero: string;
    direccion: string;
    ciudad: string;
    provincia: string;
    email: string;
    fechaBaja: string | null;
    activo: boolean;
    fotoPerfilUrl: string | null;
    constructor(socio: SocioEntity | SocioResponseSource);
}
