// src/common/enums/response-messages.enum.ts

export enum ResponseMessages {
  // CRUD
  CREATED_SUCCESSFULLY = 'Recurso creado correctamente',
  UPDATED_SUCCESSFULLY = 'Recurso actualizado correctamente',
  DELETED_SUCCESSFULLY = 'Recurso eliminado correctamente',
  FETCH_SUCCESS = 'Datos obtenidos correctamente',
  FETCH_ONE_SUCCESS = 'Recurso obtenido correctamente',
  NO_CONTENT = 'No hay datos para mostrar',

  // Autenticación
  LOGIN_SUCCESS = 'Inicio de sesión exitoso',
  LOGOUT_SUCCESS = 'Cierre de sesión exitoso',
  UNAUTHORIZED = 'No autorizado',
  FORBIDDEN = 'Acceso denegado',
  TOKEN_EXPIRED = 'Token expirado',
  INVALID_CREDENTIALS = 'Credenciales inválidas',
  USER_REGISTERED = 'Usuario registrado correctamente',
  PASSWORD_UPDATED = 'Contraseña actualizada correctamente',

  // Errores custom
  VALIDATION_FAILED = 'Error de validación de datos',
  RESOURCE_NOT_FOUND = 'El recurso solicitado no existe',
  DUPLICATE_RESOURCE = 'El recurso ya existe',
  OPERATION_NOT_ALLOWED = 'Operación no permitida',
  BAD_REQUEST = 'Solicitud incorrecta',
  INTERNAL_SERVER_ERROR = 'Error interno del servidor',
  DATABASE_ERROR = 'Error en la base de datos',
  SERVICE_UNAVAILABLE = 'Servicio no disponible actualmente',
}
