export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  CONFLICT = 'CONFLICT',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',
  SERVER_ERROR = 'SERVER_ERROR',
  /**
   * 502 Bad Gateway — upstream devolvió respuesta inválida
   * (ej: Groq devolvió JSON malformado tras reintentos).
   */
  BAD_GATEWAY = 'BAD_GATEWAY',
  /**
   * 503 Service Unavailable — upstream no disponible / no respondió
   * (ej: Groq timeout tras reintentos).
   */
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}
