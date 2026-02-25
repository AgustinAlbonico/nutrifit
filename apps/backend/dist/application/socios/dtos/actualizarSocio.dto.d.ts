import { Genero } from 'src/domain/entities/Persona/Genero';
export declare class ActualizarSocioDto {
    nombre?: string;
    apellido?: string;
    dni?: string;
    fechaNacimiento?: string;
    telefono?: string;
    genero?: Genero;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    email?: string;
    contrasena?: string;
}
