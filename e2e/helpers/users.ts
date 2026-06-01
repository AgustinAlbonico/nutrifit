/**
 * Datos de usuarios de prueba para E2E
 * Credenciales extraidas del seed del proyecto
 */
export const USUARIOS_PRUEBA = {
  SUPERADMIN: {
    email: 'superadmin@nutrifit.com',
    password: '123456',
    rol: 'SUPERADMIN',
    nombre: 'Super Admin',
  },
  ADMIN_CENTRAL: {
    email: 'admin-central@nutrifit.com',
    password: '123456',
    rol: 'ADMIN',
    nombre: 'Admin Central',
    gimnasio: 'Gym Central',
  },
  RECEPCIONISTA_CENTRAL: {
    email: 'recep-central@nutrifit.com',
    password: '123456',
    rol: 'RECEPCIONISTA',
    nombre: 'Recepcionista Central',
    gimnasio: 'Gym Central',
  },
  NUTRICIONISTA_CENTRAL: {
    email: 'nutri-central@nutrifit.com',
    password: '123456',
    rol: 'NUTRICIONISTA',
    nombre: 'Nutricionista Central',
    gimnasio: 'Gym Central',
  },
  SOCIO_CENTRAL: {
    email: 'socio1-central@nutrifit.com',
    password: '123456',
    rol: 'SOCIO',
    nombre: 'Socio 1 Central',
    gimnasio: 'Gym Central',
  },
} as const;

export type UsuarioPrueba = (typeof USUARIOS_PRUEBA)[keyof typeof USUARIOS_PRUEBA];