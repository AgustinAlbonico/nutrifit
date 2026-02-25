import { Rol } from 'src/domain/entities/Usuario/Rol';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        rol: Rol;
        acciones?: string[];
      };
    }
  }
}
