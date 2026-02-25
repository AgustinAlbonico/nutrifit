import { Rol } from './Rol';

export interface AuthenticatedUser {
  id: number;
  email: string;
  rol: Rol;
  acciones?: string[];
}
