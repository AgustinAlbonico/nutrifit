import { TurnoEntity } from './turno.entity';

export abstract class ITurnoRepository {
  abstract getTurnos(): Promise<TurnoEntity>;
}
