/**
 * Tipos del frontend para la ficha de salud del socio.
 *
 * Espejo de los DTOs del backend (PR 1a + PR 1b). Mantener en sincronía
 * con `apps/backend/src/application/turnos/dtos/*-ficha-salud*.dto.ts`.
 *
 * RBs relacionados: RB15, RB42, RB44, RB50.
 */

import type {
  FrecuenciaComidasValue,
  NivelActividadFisicaValue,
} from '@nutrifit/shared';

export type { NivelActividadFisicaValue, FrecuenciaComidasValue };

export type ConsumoAlcoholValue =
  | 'Nunca'
  | 'Ocasional'
  | 'Moderado'
  | 'Frecuente';

/**
 * Respuesta del backend en `GET /turnos/socio/ficha-salud` y `PUT /turnos/socio/ficha-salud`.
 * En creación la respuesta es `null` (404 → `null` en el controller).
 */
export interface FichaSaludSocio {
  socioId: number;
  fichaSaludId: number;
  altura: number;
  peso: number;
  nivelActividadFisica: NivelActividadFisicaValue;
  alergias: string[];
  patologias: string[];
  objetivoPersonal: string;
  medicacionActual: string | null;
  suplementosActuales: string | null;
  cirugiasPrevias: string | null;
  antecedentesFamiliares: string | null;
  frecuenciaComidas: FrecuenciaComidasValue | null;
  consumoAguaDiario: number | null;
  restriccionesAlimentarias: string | null;
  consumoAlcohol: ConsumoAlcoholValue | null;
  fumaTabaco: boolean;
  horasSueno: number | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
  // PR 1a: campos nuevos de versionado
  completada: boolean;
  completadaAt: Date | null;
  actualizadaAt: Date | null;
  consentAt: Date | null;
  versionActual: number;
}

/**
 * Item del historial de versiones del socio.
 * `GET /turnos/socio/ficha-salud/historial` → `HistorialItem[]`
 */
export interface HistorialItem {
  version: number;
  versionId: number;
  createdAt: Date;
  createdBy: number | null;
}

/**
 * Datos completos de una versión específica.
 * `GET /turnos/socio/ficha-salud/version/:n` → `DatosVersion`
 */
export interface DatosVersion {
  version: number;
  createdAt: Date;
  datos: Record<string, unknown>;
}
