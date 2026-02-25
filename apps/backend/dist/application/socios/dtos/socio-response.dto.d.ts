export declare class SocioResponseDto {
    idPersona: number;
    nombre: string;
    apellido: string;
    dni: string;
    fechaNacimiento: string;
    telefono: string;
    genero: string;
    direccion: string;
    ciudad: string;
    provincia: string;
    email: string;
    fechaBaja: string | null;
    activo: boolean;
    fotoPerfilUrl: string | null;
    constructor(socio: any);
}
