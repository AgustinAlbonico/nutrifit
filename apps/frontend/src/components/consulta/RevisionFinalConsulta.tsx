import { AlertTriangle, CheckCircle2, CircleSlash, Circle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { EtapaConsulta } from '@/types/consulta';

interface PropiedadesRevisionFinalConsulta {
  etapas: EtapaConsulta[];
  puedeCerrar: boolean;
  finalizando: boolean;
  consultaEditable: boolean;
  onFinalizar: () => void;
}

const textoEstado: Record<string, string> = {
  completa: 'completa',
  pendiente: 'pendiente',
  omitida: 'omitida',
  error: 'error',
  bloqueada: 'bloqueada',
};

const variantBadge = (estado: string) => {
  if (estado === 'error') return 'destructive' as const;
  if (estado === 'pendiente') return 'outline' as const;
  return 'secondary' as const;
};

export function RevisionFinalConsulta({
  etapas,
  puedeCerrar,
  finalizando,
  consultaEditable,
  onFinalizar,
}: PropiedadesRevisionFinalConsulta) {
  const obligatoriasConError = etapas.filter(
    (etapa) => etapa.estado === 'error' || etapa.estado === 'bloqueada',
  );
  const pendientes = etapas.filter((etapa) => etapa.estado === 'pendiente');

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-lg">
          {puedeCerrar && pendientes.length === 0 ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
          Revisión final
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-3 md:grid-cols-2">
          {etapas.map((etapa) => (
            <div
              key={etapa.id}
              className={cn(
                'flex items-start justify-between gap-3 rounded-xl border p-4',
                etapa.estado === 'pendiente'
                  ? 'border-amber-200 bg-amber-50/40'
                  : 'border-border/60',
              )}
            >
              <div>
                <p className="font-medium">{etapa.titulo}</p>
                <p className="text-sm text-muted-foreground">
                  {etapa.descripcion}
                </p>
              </div>
              <Badge
                variant={variantBadge(etapa.estado)}
                className={cn(
                  'shrink-0',
                  etapa.estado === 'pendiente' &&
                    'border-amber-300 bg-amber-100 text-amber-700 hover:bg-amber-100',
                )}
              >
                {textoEstado[etapa.estado] ?? etapa.estado}
              </Badge>
            </div>
          ))}
        </div>

        {obligatoriasConError.length > 0 ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Error al cargar datos</p>
                <p>
                  No se pudieron cargar algunos datos de la consulta.
                  Revisá la sección de evolución.
                </p>
              </div>
            </div>
          </div>
        ) : pendientes.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <Circle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Faltan datos en algunas secciones</p>
                <p>
                  Las secciones marcadas como pendiente no tienen datos cargados.
                  Si querés, podés cerrar la consulta igual.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Consulta lista para cierre</p>
                <p>Todos los datos de la consulta están cargados.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleSlash className="h-4 w-4" />
            Las etapas opcionales omitidas no bloquean el cierre.
          </div>
          <Button
            type="button"
            size="lg"
            disabled={!consultaEditable || finalizando || !puedeCerrar}
            onClick={onFinalizar}
          >
            {finalizando ? 'Finalizando...' : 'Finalizar consulta'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
