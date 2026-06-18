import { useState } from 'react';
import { Camera, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubirFoto } from '@/components/progreso/useFotosProgreso';
import type { GaleriaFotos, TipoFoto } from '@/components/progreso/types';
import { cn } from '@/lib/utils';

interface PropiedadesFotosSesionConsulta {
  socioId: number;
  turnoId: number;
  token: string | null;
  galeria?: GaleriaFotos;
  consultaEditable: boolean;
  onFotoSubida?: () => void;
}

const tomas: Array<{ tipo: TipoFoto; titulo: string; descripcion: string }> = [
  {
    tipo: 'frente',
    titulo: 'Frente',
    descripcion: 'Postura natural, cuerpo completo si es posible.',
  },
  {
    tipo: 'perfil',
    titulo: 'Perfil',
    descripcion: 'Lateral completo para seguimiento de postura y abdomen.',
  },
  {
    tipo: 'espalda',
    titulo: 'Espalda',
    descripcion: 'Vista posterior para cambios de composición.',
  },
  {
    tipo: 'otro',
    titulo: 'Otra',
    descripcion: 'Detalle clínico o toma complementaria.',
  },
];

export function FotosSesionConsulta({
  socioId,
  turnoId,
  token,
  galeria,
  consultaEditable,
  onFotoSubida,
}: PropiedadesFotosSesionConsulta) {
  const subirFoto = useSubirFoto(socioId, token);
  const [tipoSubiendo, setTipoSubiendo] = useState<TipoFoto | null>(null);

  const fotosSesion = galeria?.sesiones?.find(
    (sesion) => sesion.turnoId === turnoId,
  );

  const obtenerFoto = (tipoFoto: TipoFoto) =>
    fotosSesion?.fotos
      .find((grupo) => grupo.tipoFoto === tipoFoto)
      ?.fotos.at(0) ?? null;

  const subirArchivo = async (tipoFoto: TipoFoto, archivo?: File) => {
    if (!archivo) return;

    try {
      setTipoSubiendo(tipoFoto);
      await subirFoto.mutateAsync({
        archivo,
        tipoFoto,
        turnoId,
        notas: `Foto ${tipoFoto} de la consulta ${turnoId}`,
      });
      toast.success('Foto de sesión guardada');
      onFotoSubida?.();
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'No se pudo subir la foto.';
      toast.error(mensaje);
    } finally {
      setTipoSubiendo(null);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-primary" />
          Fotos de esta sesión
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          Las fotos son opcionales, pero si las cargás quedan asociadas a esta
          consulta y después se pueden comparar contra otras sesiones.
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tomas.map((toma) => {
            const foto = obtenerFoto(toma.tipo);
            const subiendo = tipoSubiendo === toma.tipo;

            return (
              <div
                key={toma.tipo}
                className={cn(
                  'overflow-hidden rounded-2xl border bg-card shadow-sm',
                  foto ? 'border-emerald-200' : 'border-border/70',
                )}
              >
                <div className="aspect-[4/5] bg-muted/40">
                  {foto ? (
                    <img
                      src={foto.urlFirmada}
                      alt={`Foto de ${toma.titulo.toLowerCase()} de la sesión`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                      <ImagePlus className="h-10 w-10" />
                      <span className="text-sm">Sin foto</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="font-semibold">{toma.titulo}</h3>
                    <p className="text-xs text-muted-foreground">
                      {toma.descripcion}
                    </p>
                  </div>

                  <label className="block">
                    <input
                      type="file"
                      accept="image/*,.heic,.heif"
                      className="sr-only"
                      disabled={!consultaEditable || subiendo}
                      onChange={(event) => {
                        const archivo = event.target.files?.[0];
                        void subirArchivo(toma.tipo, archivo);
                        event.currentTarget.value = '';
                      }}
                    />
                    <span
                      className={cn(
                        'inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors',
                        consultaEditable
                          ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                          : 'cursor-not-allowed border-border bg-muted text-muted-foreground',
                      )}
                    >
                      {subiendo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Subiendo
                        </>
                      ) : foto ? (
                        'Reemplazar foto'
                      ) : (
                        'Cargar foto'
                      )}
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
