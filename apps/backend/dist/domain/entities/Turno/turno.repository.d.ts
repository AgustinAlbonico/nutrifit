import { TurnoEntity } from './turno.entity';
export declare abstract class ITurnoRepository {
    abstract getTurnos(): Promise<TurnoEntity>;
}
