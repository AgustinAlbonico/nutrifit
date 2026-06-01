// Roles del sistema
export type Rol = 'SOCIO' | 'NUTRICIONISTA' | 'RECEPCIONISTA' | 'ADMIN' | 'SUPERADMIN';

export interface InfoRol {
  rol: Rol;
  nombre: string;
  descripcion: string;
}

export const ROLES: InfoRol[] = [
  { rol: 'SOCIO', nombre: 'Socio', descripcion: 'Usuario cliente del gimnasio' },
  { rol: 'NUTRICIONISTA', nombre: 'Nutricionista', descripcion: 'Profesional de la nutrición' },
  { rol: 'RECEPCIONISTA', nombre: 'Recepcionista', descripcion: 'Personal administrativo' },
  { rol: 'ADMIN', nombre: 'Administrador de Gimnasio', descripcion: 'Administrador interno del gimnasio' },
  { rol: 'SUPERADMIN', nombre: 'Super Administrador', descripcion: 'Administrador global del sistema' },
];
