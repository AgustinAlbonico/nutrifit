import { FichaSaludEntity } from '../../FichaSalud/ficha-salud.entity';
import { PlanAlimentacionEntity } from '../../PlanAlimentacion/plan-alimentacion.entity';
import { TurnoEntity } from '../../Turno/turno.entity';
import { Genero } from '../Genero';
import { PersonaEntity } from '../persona.entity';
export declare class SocioEntity extends PersonaEntity {
    fechaAlta: Date;
    turnos: TurnoEntity[];
    fichaSalud: FichaSaludEntity | null;
    planesAlimentacion: PlanAlimentacionEntity[];
    fotoPerfilKey: string | null;
    constructor(idPersona: number | null | undefined, nombre: string, apellido: string, fechaNacimiento: Date, telefono: string, genero: Genero, direccion: string, ciudad: string, provincia: string, dni: string, turnos?: TurnoEntity[], fichaSalud?: FichaSaludEntity | null, planesAlimentacion?: PlanAlimentacionEntity[]);
}
