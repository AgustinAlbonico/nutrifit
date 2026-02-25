// Roles del sistema
export type Rol = 'SOCIO' | 'NUTRICIONISTA' | 'ASISTENTE' | 'ADMIN';

export interface InfoRol {
  rol: Rol;
  nombre: string;
  descripcion: string;
}

export const ROLES: InfoRol[] = [
  { rol: 'SOCIO', nombre: 'Socio', descripcion: 'Usuario cliente del gimnasio' },
  { rol: 'NUTRICIONISTA', nombre: 'Nutricionista', descripcion: 'Profesional de la nutrición' },
  { rol: 'ASISTENTE', nombre: 'Asistente', descripcion: 'Personal administrativo' },
  { rol: 'ADMIN', nombre: 'Administrador', descripcion: 'Administrador del sistema' },
];
