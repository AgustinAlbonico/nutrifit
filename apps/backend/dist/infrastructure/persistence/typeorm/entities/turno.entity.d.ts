import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { GimnasioOrmEntity } from './gimnasio.entity';
import { ObservacionClinicaOrmEntity } from './observacion-clinica.entity';
import { MedicionOrmEntity } from './medicion.entity';
import { EntrenadorOrmEntity, NutricionistaOrmEntity, SocioOrmEntity } from './persona.entity';
import { AdjuntoClinicoOrmEntity } from './adjunto-clinico.entity';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';
export declare class TurnoOrmEntity extends AuditableOrmEntity {
    idTurno: number;
    fechaTurno: Date;
    horaTurno: string;
    estadoTurno: EstadoTurno;
    checkInAt: Date | null;
    consultaIniciadaAt: Date | null;
    consultaFinalizadaAt: Date | null;
    ausenteAt: Date | null;
    motivoCancelacion: string | null;
    fechaOriginal: Date | null;
    tokenConfirmacion: string | null;
    observacionClinica?: ObservacionClinicaOrmEntity;
    mediciones: MedicionOrmEntity[];
    adjuntos: AdjuntoClinicoOrmEntity[];
    socio: SocioOrmEntity;
    nutricionista: NutricionistaOrmEntity;
    entrenador?: EntrenadorOrmEntity;
    gimnasio: GimnasioOrmEntity;
}
