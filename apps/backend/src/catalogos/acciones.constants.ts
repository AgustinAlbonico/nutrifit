// Catálogo de acciones para PROFESIONAL - alineado con @Actions() decorators
// Estas acciones corresponden a los decorators usados en profesional.controller.ts, socios.controller.ts, progreso.controller.ts
export const accionesProfesional = [
  {
    clave: 'turnos.ver',
    nombre: 'Ver turnos',
    descripcion: 'Permite ver la lista de turnos',
  },
  {
    clave: 'turnos.crear',
    nombre: 'Crear turnos',
    descripcion: 'Permite crear nuevos turnos',
  },
  {
    clave: 'turnos.editar',
    nombre: 'Editar turnos',
    descripcion: 'Permite editar turnos existentes',
  },
  {
    clave: 'turnos.eliminar',
    nombre: 'Eliminar turnos',
    descripcion: 'Permite eliminar turnos',
  },
  {
    clave: 'socios.ver',
    nombre: 'Ver socios',
    descripcion: 'Permite ver la lista de socios',
  },
  {
    clave: 'socios.registrar',
    nombre: 'Registrar socios',
    descripcion: 'Permite registrar nuevos socios',
  },
  {
    clave: 'socios.editar',
    nombre: 'Editar socios',
    descripcion: 'Permite editar socios existentes',
  },
  {
    clave: 'socios.eliminar',
    nombre: 'Eliminar socios',
    descripcion: 'Permite eliminar socios',
  },
  {
    clave: 'socios.reactivar',
    nombre: 'Reactivar socios',
    descripcion: 'Permite reactivar socios dados de baja',
  },
  {
    clave: 'agenda.ver',
    nombre: 'Ver agenda',
    descripcion: 'Permite ver la agenda',
  },
  {
    clave: 'profesionales.ver',
    nombre: 'Ver profesionales',
    descripcion: 'Permite ver la lista de profesionales',
  },
  {
    clave: 'profesionales.listar',
    nombre: 'Listar profesionales',
    descripcion: 'Permite listar profesionales',
  },
  {
    clave: 'profesionales.actualizar',
    nombre: 'Actualizar profesionales',
    descripcion: 'Permite actualizar profesionales existentes',
  },
  {
    clave: 'profesionales.crear',
    nombre: 'Crear profesionales',
    descripcion: 'Permite crear nuevos profesionales',
  },
  {
    clave: 'profesionales.eliminar',
    nombre: 'Eliminar profesionales',
    descripcion: 'Permite eliminar profesionales',
  },
  {
    clave: 'progreso.editar',
    nombre: 'Editar progreso',
    descripcion: 'Permite editar el progreso de un socio',
  },
] as const;

// Catálogo de acciones para ADMIN - alineado con @Actions() decorators
// Estas acciones corresponden a los decorators usados en permisos.controller.ts
export const accionesAdmin = [
  {
    clave: 'profesionales.ver',
    nombre: 'Ver profesionales',
    descripcion: 'Permite ver la lista de profesionales',
  },
  {
    clave: 'profesionales.listar',
    nombre: 'Listar profesionales',
    descripcion: 'Permite listar profesionales',
  },
  {
    clave: 'profesionales.actualizar',
    nombre: 'Actualizar profesionales',
    descripcion: 'Permite actualizar profesionales existentes',
  },
  {
    clave: 'profesionales.crear',
    nombre: 'Crear profesionales',
    descripcion: 'Permite crear nuevos profesionales',
  },
  {
    clave: 'profesionales.eliminar',
    nombre: 'Eliminar profesionales',
    descripcion: 'Permite eliminar profesionales',
  },
  {
    clave: 'usuarios.ver',
    nombre: 'Ver usuarios',
    descripcion: 'Permite ver la lista de usuarios',
  },
  {
    clave: 'permisos.gestionar',
    nombre: 'Gestionar permisos',
    descripcion: 'Permite gestionar permisos y grupos',
  },
  {
    clave: 'auth.permissions.read',
    nombre: 'Leer permisos',
    descripcion: 'Permite leer permisos del sistema',
  },
  {
    clave: 'auth.permissions.write',
    nombre: 'Escribir permisos',
    descripcion: 'Permite modificar permisos del sistema',
  },
  {
    clave: 'auth.permissions.assign',
    nombre: 'Asignar permisos',
    descripcion: 'Permite asignar permisos a usuarios',
  },
] as const;
