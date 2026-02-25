import { Genero } from 'src/domain/entities/Persona/Genero';
export declare class RegistrarSocioDto {
    email: string;
    contrasena: string;
    nombre: string;
    apellido: string;
    dni?: string;
    fechaNacimiento: string;
    telefono: string;
    genero: Genero;
    direccion: string;
    ciudad: string;
    provincia: string;
}
