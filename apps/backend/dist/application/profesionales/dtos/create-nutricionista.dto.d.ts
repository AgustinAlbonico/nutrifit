import { Genero } from 'src/domain/entities/Persona/Genero';
export declare class CreateNutricionistaDto {
    email: string;
    contrasena: string;
    nombre: string;
    apellido: string;
    fechaNacimiento: string;
    telefono: string;
    genero: Genero;
    direccion: string;
    ciudad: string;
    provincia: string;
    dni: string;
    matricula: string;
    tarifaSesion: number;
    añosExperiencia: number;
}
