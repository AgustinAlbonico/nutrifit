import { Genero } from 'src/domain/entities/Persona/Genero';
import { AgendaOrmEntity } from './agenda.entity';
import { AgendaEntity } from 'src/domain/entities/Agenda/agenda.entity';
import { FormacionAcademicaOrmEntity } from './formacion-academica.entity';
import { FormacionAcademicaEntity } from 'src/domain/entities/FormacionAcademica/formacion-academica.entity';
import { FichaSaludOrmEntity } from './ficha-salud.entity';
import { FichaSaludEntity } from 'src/domain/entities/FichaSalud/ficha-salud.entity';
import { PlanAlimentacionOrmEntity } from './plan-alimentacion.entity';
import { PlanAlimentacionEntity } from 'src/domain/entities/PlanAlimentacion/plan-alimentacion.entity';
import { UsuarioOrmEntity } from './usuario.entity';
import { TurnoOrmEntity } from './turno.entity';
import { TurnoEntity } from 'src/domain/entities/Turno/turno.entity';
export declare abstract class PersonaOrmEntity {
    idPersona: number | null;
    nombre: string;
    apellido: string;
    fechaNacimiento: Date;
    genero: Genero;
    telefono: string;
    direccion: string;
    ciudad: string;
    provincia: string;
    dni: string | null;
    fotoPerfilKey: string | null;
    gimnasioId: number;
    usuario: UsuarioOrmEntity | null;
}
export declare class SocioOrmEntity extends PersonaOrmEntity {
    fechaAlta: Date;
    fechaBaja: Date | null;
    fichaSalud: FichaSaludOrmEntity | FichaSaludEntity | null;
    planesAlimentacion: PlanAlimentacionOrmEntity[] | PlanAlimentacionEntity[];
    turnos: TurnoOrmEntity[] | TurnoEntity[];
}
export declare class AsistenteOrmEntity extends PersonaOrmEntity {
}
export declare class NutricionistaOrmEntity extends PersonaOrmEntity {
    matricula: string;
    añosExperiencia: number;
    tarifaSesion: number;
    fechaBaja: Date | null;
    agenda?: AgendaOrmEntity[] | AgendaEntity[];
    formacionAcademica: FormacionAcademicaOrmEntity[] | FormacionAcademicaEntity[];
    planesAlimentacion: PlanAlimentacionOrmEntity[] | PlanAlimentacionEntity[] | null;
    turnos: TurnoOrmEntity[] | TurnoEntity[] | null;
}
export declare class EntrenadorOrmEntity extends PersonaOrmEntity {
    especialidad: string;
    fechaBaja: Date | null;
    turnos: TurnoOrmEntity[] | TurnoEntity[];
}
