/**
 * Tipos compartidos para la pantalla de asignacion de turnos por staff
 * (`/turnos/nuevo`). Reflejan el contrato del endpoint
 * `POST /turnos/crear` introducido en el change
 * `crear-turno-en-nombre-del-socio`.
 *
 * Mantener paridad con:
 *  - `apps/backend/src/application/turnos/dtos/crear-turno-en-nombre-de-socio.dto.ts`
 *  - `apps/backend/src/application/turnos/dtos/crear-turno-en-nombre-de-socio-response.dto.ts`
 *  - `apps/backend/src/domain/entities/Turno/creado-por.enum.ts`
 */

export type CreadoPorFrontend = 'SOCIO' | 'RECEPCION' | 'ADMIN' | 'NUTRICIONISTA';

/**
 * Resultado del endpoint `GET /socio/buscar-con-ficha?q=...` consumido
 * por `useSociosParaAsignar`.
 *
 * `idPersona` es la PK de la persona; el backend filtra por gimnasio
 * del actor via `TenantContext`.
 */
export interface SocioConFicha {
  idPersona: number;
  nombre: string;
  apellido: string;
  dni: string | null;
  email?: string | null;
  tieneFichaSalud: boolean;
  nombreCompleto?: string;
}

/**
 * Nutricionista activo del gimnasio del actor, consumido por
 * `useNutricionistasParaAsignar` desde el endpoint
 * `GET /profesional` (filtrado client-side por gimnasio cuando
 * el contexto lo provee).
 */
export interface NutricionistaActivo {
  idPersona: number;
  nombre: string;
  apellido: string;
  nombreCompleto?: string;
  matricula?: string | null;
  especialidad?: string | null;
}

/**
 * Slot de disponibilidad. Re-export del tipo en `@/lib/turnos-disponibles`
 * para mantener la API del componente del nuevo wizard tipada.
 */
export interface TurnoDisponibleSlot {
  horaInicio: string;
  horaFin: string;
  estado: 'LIBRE' | 'OCUPADO';
}

/**
 * Payload que enviamos al endpoint `POST /turnos/crear`. Coincide
 * 1:1 con `CrearTurnoEnNombreDeSocioDto` del backend.
 */
export interface PayloadCreacionTurnoStaff {
  socioId: number;
  nutricionistaId: number;
  fechaTurno: string;
  horaTurno: string;
}

/**
 * Respuesta del endpoint `POST /turnos/crear`. `warning` solo se
 * popula para `RECEPCION` / `ADMIN` cuando el socio no tiene ficha
 * completa (politica RB14 diferenciada del use-case).
 */
export interface ResultadoCreacionTurnoStaff {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  socioId: number;
  nutricionistaId: number;
  gimnasioId: number;
  creadoPor: CreadoPorFrontend;
  warning?: 'socio_sin_ficha';
}
