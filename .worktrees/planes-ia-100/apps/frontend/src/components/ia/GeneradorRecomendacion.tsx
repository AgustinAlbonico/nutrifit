import { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useGenerarRecomendacion } from '@/hooks/useIa';
import type { RecomendacionComida, TipoComida, RespuestaIA } from '@/types/ia';

interface PropiedadesGeneradorRecomendacion {
  socioId: number;
  token: string | null;
  alergias?: string[];
  onRecomendacionesSeleccionadas?: (recomendaciones: RecomendacionComida[]) => void;
}

const TIPOS_COMIDA: { valor: TipoComida; etiqueta: string }[] = [
  { valor: 'DESAYUNO', etiqueta: 'Desayuno' },
  { valor: 'ALMUERZO', etiqueta: 'Almuerzo' },
  { valor: 'MERIENDA', etiqueta: 'Merienda' },
  { valor: 'CENA', etiqueta: 'Cena' },
  { valor: 'COLACION', etiqueta: 'Colación' },
];

export function GeneradorRecomendacion({
  socioId,
  token,
  alergias = [],
  onRecomendacionesSeleccionadas,
}: PropiedadesGeneradorRecomendacion) {
  const [tipoComida, establecerTipoComida] = useState<TipoComida>('ALMUERZO');
  const [preferencias, establecerPreferencias] = useState('');
  const [resultado, establecerResultado] = useState<RespuestaIA<RecomendacionComida[]> | null>(null);
  const [seleccionadas, establecerSeleccionadas] = useState<Set<number>>(new Set());
  const [modalAbierto, establecerModalAbierto] = useState(false);

  const { mutate: generar, isPending } = useGenerarRecomendacion({ token });

  const manejarGenerar = () => {
    establecerSeleccionadas(new Set());
    generar(
      {
        socioId,
        tipoComida,
        preferenciasAdicionales: preferencias || undefined,
      },
      {
        onSuccess: (respuesta) => {
          establecerResultado(respuesta);
          if (respuesta.exito && respuesta.datos && respuesta.datos.length > 0) {
            establecerModalAbierto(true);
          }
        },
      },
    );
  };

  const toggleSeleccion = (indice: number) => {
    establecerSeleccionadas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(indice)) {
        nuevo.delete(indice);
      } else {
        nuevo.add(indice);
      }
      return nuevo;
    });
  };

  const seleccionarTodas = () => {
    if (resultado?.datos) {
      establecerSeleccionadas(new Set(resultado.datos.map((_, i) => i)));
    }
  };

  const deseleccionarTodas = () => {
    establecerSeleccionadas(new Set());
  };

  const aplicarSeleccionadas = () => {
    if (resultado?.datos && onRecomendacionesSeleccionadas) {
      const recomendacionesSeleccionadas = resultado.datos.filter((_, i) =>
        seleccionadas.has(i),
      );
      if (recomendacionesSeleccionadas.length > 0) {
        onRecomendacionesSeleccionadas(recomendacionesSeleccionadas);
        establecerModalAbierto(false);
        establecerResultado(null);
        establecerSeleccionadas(new Set());
      }
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
            Generar Recomendaciones con IA
          </CardTitle>
          <CardDescription>
            Obtén 5 sugerencias de comida personalizadas basadas en el perfil del paciente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alergias.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Alergias registradas:</strong> {alergias.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo-comida">Tipo de comida</Label>
              <Select
                value={tipoComida}
                onValueChange={(valor) => establecerTipoComida(valor as TipoComida)}
              >
                <SelectTrigger id="tipo-comida">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_COMIDA.map((tipo) => (
                    <SelectItem key={tipo.valor} value={tipo.valor}>
                      {tipo.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferencias">Preferencias adicionales</Label>
              <Textarea
                id="preferencias"
                placeholder="Ej: Sin gluten, preferencia por pollo..."
                value={preferencias}
                onChange={(e) => establecerPreferencias(e.target.value)}
                rows={1}
              />
            </div>
          </div>

          <Button onClick={manejarGenerar} disabled={isPending || !token} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando 5 opciones...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generar Recomendaciones
              </>
            )}
          </Button>

          {resultado && !resultado.exito && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{resultado.error || 'No se generaron opciones'}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Modal de opciones */}
      <Dialog open={modalAbierto} onOpenChange={establecerModalAbierto}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recomendaciones generadas
            </DialogTitle>
            <DialogDescription>
              Seleccioná las opciones que querés agregar al plan alimenticio
            </DialogDescription>
          </DialogHeader>

          {resultado?.datos && resultado.datos.length > 0 && (
            <div className="space-y-4 py-4">
              {/* Botones de selección */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {resultado.datos.length} opciones generadas
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={seleccionarTodas}
                    className="text-xs"
                  >
                    Todas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deseleccionarTodas}
                    className="text-xs"
                  >
                    Ninguna
                  </Button>
                </div>
              </div>

              {/* Lista de opciones */}
              <div className="space-y-3">
                {resultado.datos.map((opcion, indice) => (
                  <Card
                    key={indice}
                    className={`cursor-pointer transition-all ${
                      seleccionadas.has(indice)
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border/50 hover:border-primary/30'
                    }`}
                    onClick={() => toggleSeleccion(indice)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={seleccionadas.has(indice)}
                          onChange={() => toggleSeleccion(indice)}
                          className="mt-1 h-4 w-4 accent-primary shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-medium truncate">{opcion.nombre}</h4>
                            <Badge variant="secondary" className="shrink-0">
                              {opcion.tipoComida}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {opcion.descripcion}
                          </p>
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground">
                              <strong>Ingredientes:</strong> {opcion.ingredientes.join(', ')}
                            </p>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="rounded bg-muted/50 p-1.5">
                              <p className="text-[10px] text-muted-foreground">Cal</p>
                              <p className="text-sm font-semibold">{opcion.caloriasEstimadas}</p>
                            </div>
                            <div className="rounded bg-muted/50 p-1.5">
                              <p className="text-[10px] text-muted-foreground">Prot</p>
                              <p className="text-sm font-semibold">{opcion.proteinas}g</p>
                            </div>
                            <div className="rounded bg-muted/50 p-1.5">
                              <p className="text-[10px] text-muted-foreground">Carb</p>
                              <p className="text-sm font-semibold">{opcion.carbohidratos}g</p>
                            </div>
                            <div className="rounded bg-muted/50 p-1.5">
                              <p className="text-[10px] text-muted-foreground">Gras</p>
                              <p className="text-sm font-semibold">{opcion.grasas}g</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground italic text-center">
                {resultado.disclaimer}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button onClick={aplicarSeleccionadas} disabled={seleccionadas.size === 0}>
              Agregar {seleccionadas.size} seleccionada{seleccionadas.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
