import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { ObservacionClinicaOrmEntity } from './observacion-clinica.entity';
import { MedicionOrmEntity } from './medicion.entity';
import { NutricionistaOrmEntity, SocioOrmEntity } from './persona.entity';
export declare class TurnoOrmEntity {
    idTurno: number;
    fechaTurno: Date;
    horaTurno: string;
    estadoTurno: EstadoTurno;
    checkInAt: Date | null;
    consultaIniciadaAt: Date | null;
    consultaFinalizadaAt: Date | null;
    ausenteAt: Date | null;
    observacionClinica?: ObservacionClinicaOrmEntity;
    mediciones: MedicionOrmEntity[];
    socio: SocioOrmEntity;
    nutricionista: NutricionistaOrmEntity;
}
