// Roles del sistema
export type Rol = 'SOCIO' | 'NUTRICIONISTA' | 'ENTRENADOR' | 'RECEPCIONISTA' | 'ADMIN';

export interface InfoRol {
  rol: Rol;
  nombre: string;
  descripcion: string;
}

export const ROLES: InfoRol[] = [
  { rol: 'SOCIO', nombre: 'Socio', descripcion: 'Usuario cliente del gimnasio' },
  { rol: 'NUTRICIONISTA', nombre: 'Nutricionista', descripcion: 'Profesional de la nutrición' },
  { rol: 'ENTRENADOR', nombre: 'Entrenador', descripcion: 'Entrenador personal del gimnasio' },
  { rol: 'RECEPCIONISTA', nombre: 'Recepcionista', descripcion: 'Personal administrativo' },
  { rol: 'ADMIN', nombre: 'Administrador', descripcion: 'Administrador del sistema' },
];
