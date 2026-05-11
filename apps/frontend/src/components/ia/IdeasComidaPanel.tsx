import { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, RotateCw, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGenerarIdeasComida } from '@/hooks/useIa';
import type { PropuestaIA, RespuestaIdeasComida } from '@/types/ia';

interface PropiedadesIdeasComida {
  token: string | null;
  socioId?: number;
  alergias?: string[];
  restricciones?: string[];
  diaSeleccionado?: string;
  tipoComidaSeleccionada?: string;
  onPropuestaSeleccionada?: (propuesta: PropuestaIA, dia: string, tipoComida: string) => void;
}

export function IdeasComidaPanel({
  token,
  socioId,
  alergias = [],
  restricciones = [],
  diaSeleccionado = 'LUNES',
  tipoComidaSeleccionada = 'ALMUERZO',
  onPropuestaSeleccionada,
}: PropiedadesIdeasComida) {
  const [objetivo, establecerObjetivo] = useState('');
  const [infoExtra, establecerInfoExtra] = useState('');
  const [resultado, establecerResultado] = useState<RespuestaIdeasComida | null>(null);
  const [propuestaSeleccionada, establecerPropuestaSeleccionada] = useState<number | null>(null);
  const [modalAbierto, establecerModalAbierto] = useState(false);
  const [error, establecerError] = useState<string | null>(null);

  const { mutate: generar, isPending } = useGenerarIdeasComida({ token });

  const manejarGenerar = () => {
    if (!objetivo.trim()) {
      establecerError('El objetivo es obligatorio');
      return;
    }
    if (!infoExtra.trim()) {
      establecerError('La información extra es obligatoria');
      return;
    }
    establecerError(null);
    establecerPropuestaSeleccionada(null);

    generar(
      {
        objetivo: objetivo.trim(),
        restricciones: restricciones.length > 0 ? restricciones : undefined,
        infoExtra: infoExtra.trim(),
        socioId,
      },
      {
        onSuccess: (data) => {
          establecerResultado(data);
          establecerModalAbierto(true);
        },
        onError: (err) => {
          const mensaje = err instanceof Error ? err.message : 'Error al generar ideas';
          establecerError(mensaje);
        },
      },
    );
  };

  const manejarReintentar = () => {
    establecerPropuestaSeleccionada(null);
    manejarGenerar();
  };

  const manejarDescartar = (index: number) => {
    if (!resultado) return;
    const propuestas = [...resultado.propuestas];
    propuestas.splice(index, 1);
    if (propuestas.length < 2) {
      establecerResultado(null);
      establecerModalAbierto(false);
      establecerError('No se pudieron generar 2 propuestas válidas. Intente con menos restricciones.');
    } else {
      establecerResultado({ propuestas: propuestas as [PropuestaIA, PropuestaIA] });
    }
  };

  const seleccionarPropuesta = (propuesta: PropuestaIA) => {
    if (onPropuestaSeleccionada) {
      onPropuestaSeleccionada(propuesta, diaSeleccionado, tipoComidaSeleccionada);
      establecerModalAbierto(false);
      establecerResultado(null);
      establecerObjetivo('');
      establecerInfoExtra('');
    }
  };

  const cerrarModal = () => {
    establecerModalAbierto(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ideas de Comida con IA
          </CardTitle>
          <CardDescription>
            Generá exactamente 2 propuestas de comidas según el objetivo nutricional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alergias.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Alergias:</strong> {alergias.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="objetivo">Objetivo nutricional *</Label>
            <Textarea
              id="objetivo"
              placeholder="Ej: Reducir peso, ganar masa muscular, mantener peso actual..."
              value={objetivo}
              onChange={(e) => establecerObjetivo(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="info-extra">Información adicional *</Label>
            <Textarea
              id="info-extra"
              placeholder="Ej: Prefiero comidas ligeras, no me gusta el pescado, tengo tiempo limitado para cocinar..."
              value={infoExtra}
              onChange={(e) => establecerInfoExtra(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            onClick={manejarGenerar}
            disabled={isPending || !token || !objetivo.trim() || !infoExtra.trim()}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando 2 propuestas...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generar Ideas de Comida
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Modal de propuestas */}
      <Dialog open={modalAbierto} onOpenChange={establecerModalAbierto}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              2 Propuestas generadas
            </DialogTitle>
            <DialogDescription>
              Seleccioná una propuesta para agregarla al plan, descartá una o reintentá
            </DialogDescription>
          </DialogHeader>

          {resultado?.propuestas && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {resultado.propuestas.map((propuesta, indice) => (
                  <Card
                    key={indice}
                    className={`relative transition-all ${
                      propuestaSeleccionada === indice
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border/50 hover:border-primary/30'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{propuesta.nombre}</CardTitle>
                        <Badge variant="secondary">{indice + 1}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Ingredientes */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Ingredientes:</p>
                        <ul className="text-sm space-y-1">
                          {propuesta.ingredientes.map((ing, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="text-muted-foreground">•</span>
                              <span className="font-medium">{ing.cantidad} {ing.unidad}</span>
                              <span>{ing.nombre}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pasos */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Preparación:</p>
                        <ol className="text-sm space-y-1 list-inside list-decimal">
                          {propuesta.pasos.map((paso, i) => (
                            <li key={i}>{paso}</li>
                          ))}
                        </ol>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => seleccionarPropuesta(propuesta)}
                          className="flex-1"
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Agregar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => manejarDescartar(indice)}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Descartar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <p className="text-xs text-muted-foreground italic text-center">
                Esta sugerencia es generada por IA y debe ser validada por un profesional de la salud.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={cerrarModal}>
              Cerrar
            </Button>
            <Button variant="outline" onClick={manejarReintentar} disabled={isPending}>
              <RotateCw className="mr-1 h-4 w-4" />
              Reintentar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
