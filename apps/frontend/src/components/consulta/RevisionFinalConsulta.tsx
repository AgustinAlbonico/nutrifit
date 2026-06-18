import { AlertTriangle, CheckCircle2, CircleSlash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EtapaConsulta } from '@/types/consulta';

interface PropiedadesRevisionFinalConsulta {
  etapas: EtapaConsulta[];
  puedeCerrar: boolean;
  finalizando: boolean;
  consultaEditable: boolean;
  onFinalizar: () => void;
}

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

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-lg">
          {puedeCerrar ? (
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
              className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-4"
            >
              <div>
                <p className="font-medium">{etapa.titulo}</p>
                <p className="text-sm text-muted-foreground">
                  {etapa.descripcion}
                </p>
              </div>
              <Badge
                variant={etapa.estado === 'error' ? 'destructive' : 'secondary'}
                className="shrink-0"
              >
                {etapa.estado}
              </Badge>
            </div>
          ))}
        </div>

        {obligatoriasConError.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Faltan mínimos para cerrar</p>
                <p>
                  Guardá al menos una medición base y un comentario clínico.
                  Fotos, plan y adjuntos pueden omitirse si no aplican.
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
                <p>
                  El backend vuelve a validar los mínimos antes de cerrar. Bien:
                  doble control, cero confianza ciega en la UI.
                </p>
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
