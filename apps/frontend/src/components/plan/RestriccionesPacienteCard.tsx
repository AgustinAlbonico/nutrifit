/**
 * Card que muestra las restricciones del paciente (socio) leídas desde
 * su ficha de salud. Usado en `PlanEditorPage` para que el nutricionista
 * tenga visibilidad de las restricciones duras ANTES de generar/regenerar
 * un plan con la IA.
 *
 * Datos mostrados:
 * - Alergias (string[])
 * - Patologías (string[])
 * - Restricciones alimentarias (string CSV → array)
 * - Objetivo personal (string)
 *
 * Maneja 3 estados:
 * - Cargando: spinner pequeño
 * - Sin ficha (404): mensaje informativo + icono
 * - Con ficha: lista de restricciones
 *
 * Accesibilidad:
 * - aria-labelledby apunta al título del card
 * - role="region" para identificar landmark
 */

import { AlertCircle, Loader2, ShieldAlert } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FichaSaludSocio } from '@/types/ficha-salud';

interface PropiedadesRestriccionesPacienteCard {
  ficha: FichaSaludSocio | null | undefined;
  isLoading: boolean;
  isError: boolean;
  sinFicha: boolean;
  className?: string;
}

export function RestriccionesPacienteCard({
  ficha,
  isLoading,
  isError,
  sinFicha,
  className,
}: PropiedadesRestriccionesPacienteCard) {
  return (
    <Card
      className={cn('rounded-2xl border-border/50', className)}
      role="region"
      aria-labelledby="restricciones-paciente-titulo"
      data-testid="restricciones-paciente-card"
    >
      <CardHeader className="pb-3">
        <CardTitle
          id="restricciones-paciente-titulo"
          className="flex items-center gap-2 text-base"
        >
          <ShieldAlert
            className="size-4 text-rose-600 dark:text-rose-400"
            aria-hidden="true"
          />
          Restricciones del paciente
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Datos cargados desde la ficha de salud. La IA los usa para validar el plan.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2
              className="size-4 animate-spin"
              aria-hidden="true"
            />
            <span>Cargando restricciones…</span>
          </div>
        )}

        {!isLoading && sinFicha && (
          <div
            className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
            role="alert"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              El paciente aún no completó su ficha de salud, o no tenés
              turno previo con él. La IA no tendrá restricciones para
              validar en este plan.
            </p>
          </div>
        )}

        {!isLoading && isError && !sinFicha && (
          <div
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              No se pudo obtener la ficha del paciente. Reintentá más tarde.
            </p>
          </div>
        )}

        {!isLoading && !isError && ficha && (
          <dl className="grid gap-3 sm:grid-cols-2">
            <SeccionRestriccion
              titulo="Alergias"
              items={ficha.alergias}
              vacio="Sin alergias declaradas"
            />
            <SeccionRestriccion
              titulo="Patologías"
              items={ficha.patologias}
              vacio="Sin patologías declaradas"
            />
            <SeccionRestriccion
              titulo="Restricciones alimentarias"
              items={parsearCsv(ficha.restriccionesAlimentarias)}
              vacio="Ninguna"
            />
            <SeccionRestriccion
              titulo="Objetivo personal"
              texto={ficha.objetivoPersonal}
              vacio="Sin objetivo declarado"
            />
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

interface PropiedadesSeccionRestriccion {
  titulo: string;
  items?: string[];
  texto?: string;
  vacio: string;
}

function SeccionRestriccion({
  titulo,
  items,
  texto,
  vacio,
}: PropiedadesSeccionRestriccion) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </dt>
      <dd className="text-sm">
        {items !== undefined ? (
          items.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label={titulo}>
              {items.map((item) => (
                <li
                  key={item}
                  className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-muted-foreground">{vacio}</span>
          )
        ) : texto !== undefined ? (
          texto.trim().length > 0 ? (
            <span>{texto}</span>
          ) : (
            <span className="text-muted-foreground">{vacio}</span>
          )
        ) : (
          <span className="text-muted-foreground">{vacio}</span>
        )}
      </dd>
    </div>
  );
}

/**
 * Parsea un string CSV (posiblemente null/undefined) a un array de strings
 * trimming cada item y filtrando vacíos.
 */
function parsearCsv(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}