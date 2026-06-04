/**
 * Vista detallada de una versión histórica de la ficha de salud, en modo
 * lectura. Renderiza los mismos campos que el wizard pero todos `disabled`.
 *
 * Banner superior: "Versión N — DD/MM/YYYY HH:mm".
 *
 * El backend devuelve los datos como `Record<string, unknown>` (snapshot
 * completo de la ficha al momento de la versión). Acá se hace un cast seguro
 * a la forma conocida de la ficha.
 *
 * RBs: RB50 (UI).
 */

import { useMemo } from 'react';
import { History } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatFechaCorta } from '@/lib/fechas';
import {
  FRECUENCIAS_COMIDAS,
  NIVELES_ACTIVIDAD_FISICA,
  type FrecuenciaComidasValue,
  type NivelActividadFisicaValue,
} from '@nutrifit/shared';

interface PropiedadesDetalleVersion {
  version: number;
  fecha: Date | string;
  datos: Record<string, unknown>;
}

interface FichaDatosCrudos {
  altura?: number;
  peso?: number;
  nivelActividadFisica?: string;
  objetivoPersonal?: string;
  alergias?: string[];
  patologias?: string[];
  medicacionActual?: string | null;
  suplementosActuales?: string | null;
  cirugiasPrevias?: string | null;
  antecedentesFamiliares?: string | null;
  frecuenciaComidas?: string | null;
  consumoAguaDiario?: number | null;
  restriccionesAlimentarias?: string | null;
  consumoAlcohol?: string | null;
  fumaTabaco?: boolean;
  horasSueno?: number | null;
  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaTelefono?: string | null;
}

function etiquetaNivelActividad(valor: string | undefined): string {
  if (!valor) return '—';
  const encontrada = NIVELES_ACTIVIDAD_FISICA.find(
    (opcion) => opcion.value === (valor as NivelActividadFisicaValue),
  );
  return encontrada?.label ?? valor;
}

function etiquetaFrecuencia(valor: string | null | undefined): string {
  if (!valor) return '—';
  const encontrada = FRECUENCIAS_COMIDAS.find(
    (opcion) => opcion.value === (valor as FrecuenciaComidasValue),
  );
  return encontrada?.label ?? valor;
}

function unirLista(items: string[] | undefined): string {
  if (!items || items.length === 0) return '—';
  return items.join(', ');
}

export function FichaSaludVersionDetalle({
  version,
  fecha,
  datos,
}: PropiedadesDetalleVersion) {
  const ficha = datos as FichaDatosCrudos;

  const textoFuma = useMemo(
    () => (ficha.fumaTabaco ? 'Sí' : 'No'),
    [ficha.fumaTabaco],
  );

  return (
    <div className="space-y-4" data-testid="detalle-version">
      <div
        className="flex items-center gap-2 rounded-md border border-border/60 bg-background p-2 text-sm"
        role="status"
      >
        <History className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-medium">Versión {version}</span>
        <span className="text-muted-foreground">—</span>
        <span className="text-muted-foreground">{formatFechaCorta(fecha)}</span>
      </div>

      <fieldset disabled className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label>Altura (cm)</Label>
            <Input value={ficha.altura ?? ''} readOnly />
          </div>
          <div className="space-y-1">
            <Label>Peso (kg)</Label>
            <Input value={ficha.peso ?? ''} readOnly />
          </div>
          <div className="space-y-1">
            <Label>Nivel de actividad física</Label>
            <Input value={etiquetaNivelActividad(ficha.nivelActividadFisica)} readOnly />
          </div>
          <div className="space-y-1">
            <Label>Objetivo personal</Label>
            <Input value={ficha.objetivoPersonal ?? ''} readOnly />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Alergias</Label>
            <Input value={unirLista(ficha.alergias)} readOnly />
          </div>
          <div className="space-y-1">
            <Label>Patologías</Label>
            <Input value={unirLista(ficha.patologias)} readOnly />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Medicación actual</Label>
            <Textarea value={ficha.medicacionActual ?? ''} readOnly rows={3} />
          </div>
          <div className="space-y-1">
            <Label>Suplementos actuales</Label>
            <Textarea value={ficha.suplementosActuales ?? ''} readOnly rows={3} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Cirugías previas</Label>
            <Textarea value={ficha.cirugiasPrevias ?? ''} readOnly rows={3} />
          </div>
          <div className="space-y-1">
            <Label>Antecedentes familiares</Label>
            <Textarea
              value={ficha.antecedentesFamiliares ?? ''}
              readOnly
              rows={3}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Comidas por día</Label>
            <Input value={etiquetaFrecuencia(ficha.frecuenciaComidas)} readOnly />
          </div>
          <div className="space-y-1">
            <Label>Agua diaria (litros)</Label>
            <Input
              value={ficha.consumoAguaDiario ?? ''}
              readOnly
            />
          </div>
          <div className="space-y-1">
            <Label>Restricciones alimentarias</Label>
            <Input
              value={ficha.restriccionesAlimentarias ?? ''}
              readOnly
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Consumo de alcohol</Label>
            <Input value={ficha.consumoAlcohol ?? ''} readOnly />
          </div>
          <div className="space-y-1">
            <Label>¿Fumás tabaco?</Label>
            <Input value={textoFuma} readOnly />
          </div>
          <div className="space-y-1">
            <Label>Horas de sueño (promedio)</Label>
            <Input value={ficha.horasSueno ?? ''} readOnly />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Nombre del contacto</Label>
            <Input
              value={ficha.contactoEmergenciaNombre ?? ''}
              readOnly
            />
          </div>
          <div className="space-y-1">
            <Label>Teléfono del contacto</Label>
            <Input
              value={ficha.contactoEmergenciaTelefono ?? ''}
              readOnly
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}

export type { FichaDatosCrudos };
