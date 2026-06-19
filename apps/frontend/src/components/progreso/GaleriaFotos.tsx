import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Camera, ImageIcon, Plus, RotateCcw } from 'lucide-react';
import { ReactCompareSlider } from 'react-compare-slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { GaleriaFotos, FotoProgreso, TipoFoto } from './types';

interface PropiedadesGaleriaFotos {
  socioId: number;
  galeria?: GaleriaFotos;
  cargando?: boolean;
  puedeEditar?: boolean;
  onEliminarFoto?: (fotoId: number) => void;
  fotoEliminando?: number | null;
  onSubirFoto?: () => void;
  onSubirFotoTipo?: (tipo: TipoFoto) => void;
}

const ORDEN_TIPOS: TipoFoto[] = ['frente', 'perfil', 'espalda', 'otro'];

const ETIQUETAS_TIPO: Record<string, string> = {
  frente: 'Frente',
  perfil: 'Perfil',
  espalda: 'Espalda',
  otro: 'Otro',
};

const DESCRIPCIONES_TIPO: Record<TipoFoto, string> = {
  frente: 'Vista frontal para comparar postura y composicion.',
  perfil: 'Vista lateral para seguir abdomen y alineacion.',
  espalda: 'Vista posterior para cambios de composicion.',
  otro: 'Toma complementaria o detalle clinico adicional.',
};

export function GaleriaFotos({
  galeria,
  cargando = false,
  puedeEditar = false,
  onEliminarFoto,
  fotoEliminando,
  onSubirFoto,
  onSubirFotoTipo,
}: PropiedadesGaleriaFotos) {
  const fotosPorTipo = ORDEN_TIPOS.reduce((acc, tipo) => {
    acc[tipo] = [];
    return acc;
  }, {} as Record<TipoFoto, FotoProgreso[]>);

  galeria?.fotos?.forEach((grupo) => {
    const tipo = grupo.tipoFoto as TipoFoto;
    if (fotosPorTipo[tipo]) {
      fotosPorTipo[tipo] = grupo.fotos.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      );
    }
  });

  const hayAlgunaFoto = ORDEN_TIPOS.some((tipo) => fotosPorTipo[tipo].length > 0);
  const [tipoModalActivo, setTipoModalActivo] = useState<TipoFoto | null>(null);

  const fotosTipoActivo = tipoModalActivo ? fotosPorTipo[tipoModalActivo] : [];

  if (cargando) {
    return (
      <div className="space-y-6">
        {ORDEN_TIPOS.map((tipo) => (
          <Card key={tipo}>
            <CardHeader>
              <CardTitle className="text-lg">{ETIQUETAS_TIPO[tipo]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {puedeEditar && onSubirFoto && (
        <div className="flex justify-end">
          <Button onClick={onSubirFoto}>
            <Plus className="h-4 w-4 mr-2" />
            {hayAlgunaFoto ? 'Subir foto' : 'Subir primera foto'}
          </Button>
        </div>
      )}

      {!hayAlgunaFoto && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium text-foreground">Todavia no hay fotos de progreso</p>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Cuando cargues imagenes, vas a poder organizarlas por frente, perfil, espalda u otra toma complementaria.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ORDEN_TIPOS.map((tipo) => (
          <TarjetaIndiceTipo
            key={tipo}
            tipo={tipo}
            fotos={fotosPorTipo[tipo]}
            puedeEditar={puedeEditar}
            onAbrir={() => setTipoModalActivo(tipo)}
            onSubirFotoTipo={onSubirFotoTipo}
          />
        ))}
      </div>

      <Dialog open={tipoModalActivo !== null} onOpenChange={(open) => !open && setTipoModalActivo(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
          {tipoModalActivo && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {ETIQUETAS_TIPO[tipoModalActivo]}: comparación y evolución visual
                </DialogTitle>
                <DialogDescription>
                  Compará la primera y la última foto por defecto, y ajustá manualmente el antes y el después desde el historial de tomas.
                </DialogDescription>
              </DialogHeader>

              <ComparadorFotosPorTipo
                tipo={tipoModalActivo}
                fotos={fotosTipoActivo}
                puedeEditar={puedeEditar}
                fotoEliminando={fotoEliminando}
                onEliminarFoto={onEliminarFoto}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TarjetaIndiceTipo({
  tipo,
  fotos,
  puedeEditar,
  onAbrir,
  onSubirFotoTipo,
}: {
  tipo: TipoFoto;
  fotos: FotoProgreso[];
  puedeEditar: boolean;
  onAbrir: () => void;
  onSubirFotoTipo?: (tipo: TipoFoto) => void;
}) {
  const fotosOrdenadasCronologicamente = useMemo(
    () =>
      [...fotos].sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      ),
    [fotos],
  );

  const primeraFoto = fotosOrdenadasCronologicamente[0] ?? null;
  const ultimaFoto = fotosOrdenadasCronologicamente.at(-1) ?? null;
  const fotoPreview = fotos[0] ?? null;

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <div className="aspect-[4/3] overflow-hidden border-b bg-muted/20">
        {fotoPreview ? (
          <img
            src={fotoPreview.urlFirmada}
            alt={`Preview de ${ETIQUETAS_TIPO[tipo].toLowerCase()}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Camera className="h-10 w-10" />
            <span className="text-sm">Sin fotos todavía</span>
          </div>
        )}
      </div>

      <CardHeader className="space-y-2">
        <CardTitle className="text-lg">
          {ETIQUETAS_TIPO[tipo]} ({fotos.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">{DESCRIPCIONES_TIPO[tipo]}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {fotos.length > 0 ? (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Primera: <span className="font-medium text-foreground">{formatearFechaFoto(primeraFoto)}</span>
            </p>
            <p>
              Última: <span className="font-medium text-foreground">{formatearFechaFoto(ultimaFoto)}</span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Empezá por cargar al menos una foto para este ángulo.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {fotos.length > 0 ? (
            <Button onClick={onAbrir}>
              {fotos.length >= 2 ? 'Abrir comparación' : 'Abrir historial'}
            </Button>
          ) : puedeEditar && onSubirFotoTipo ? (
            <Button onClick={() => onSubirFotoTipo(tipo)}>
              <Plus className="mr-2 h-4 w-4" />
              Cargar foto de {ETIQUETAS_TIPO[tipo].toLowerCase()}
            </Button>
          ) : null}

          {fotos.length > 0 && puedeEditar && onSubirFotoTipo && (
            <Button variant="outline" onClick={() => onSubirFotoTipo(tipo)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar foto
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ComparadorFotosPorTipo({
  tipo,
  fotos,
  puedeEditar,
  fotoEliminando,
  onEliminarFoto,
}: {
  tipo: TipoFoto;
  fotos: FotoProgreso[];
  puedeEditar: boolean;
  fotoEliminando?: number | null;
  onEliminarFoto?: (fotoId: number) => void;
}) {
  const fotosOrdenadas = useMemo(
    () =>
      [...fotos].sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      ),
    [fotos],
  );

  const fotoInicialAntes = fotosOrdenadas[0] ?? null;
  const fotoInicialDespues = fotosOrdenadas.at(-1) ?? null;
  const [fotoAntesId, setFotoAntesId] = useState<number | null>(
    fotoInicialAntes?.idFoto ?? null,
  );
  const [fotoDespuesId, setFotoDespuesId] = useState<number | null>(
    fotoInicialDespues?.idFoto ?? null,
  );

  useEffect(() => {
    setFotoAntesId((actual) => {
      if (actual && fotosOrdenadas.some((foto) => foto.idFoto === actual)) {
        return actual;
      }
      return fotoInicialAntes?.idFoto ?? null;
    });

    setFotoDespuesId((actual) => {
      if (actual && fotosOrdenadas.some((foto) => foto.idFoto === actual)) {
        return actual;
      }
      return fotoInicialDespues?.idFoto ?? null;
    });
  }, [fotosOrdenadas, fotoInicialAntes?.idFoto, fotoInicialDespues?.idFoto]);

  const fotoAntes =
    fotosOrdenadas.find((foto) => foto.idFoto === fotoAntesId) ?? fotoInicialAntes;
  const fotoDespues =
    fotosOrdenadas.find((foto) => foto.idFoto === fotoDespuesId) ?? fotoInicialDespues;
  const tieneComparacion =
    fotosOrdenadas.length >= 2 &&
    fotoAntes != null &&
    fotoDespues != null &&
    fotoAntes.idFoto !== fotoDespues.idFoto;

  const usarComoAntes = (fotoId: number) => {
    setFotoAntesId(fotoId);
    if (fotoDespuesId === fotoId) {
      const reemplazo = [...fotosOrdenadas]
        .reverse()
        .find((foto) => foto.idFoto !== fotoId);
      setFotoDespuesId(reemplazo?.idFoto ?? fotoId);
    }
  };

  const usarComoDespues = (fotoId: number) => {
    setFotoDespuesId(fotoId);
    if (fotoAntesId === fotoId) {
      const reemplazo = fotosOrdenadas.find((foto) => foto.idFoto !== fotoId);
      setFotoAntesId(reemplazo?.idFoto ?? fotoId);
    }
  };

  const restablecerPrimeraVsUltima = () => {
    setFotoAntesId(fotoInicialAntes?.idFoto ?? null);
    setFotoDespuesId(fotoInicialDespues?.idFoto ?? null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          Antes: {formatearFechaFoto(fotoAntes)}
        </Badge>
        <Badge variant="secondary">
          Después: {formatearFechaFoto(fotoDespues)}
        </Badge>
        {fotosOrdenadas.length >= 2 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={restablecerPrimeraVsUltima}
            className="ml-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Primera vs última
          </Button>
        )}
      </div>

      {tieneComparacion ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border bg-muted/30">
            <div className="aspect-[4/3] min-h-[260px]">
              <ReactCompareSlider
                itemOne={<ImagenComparacion foto={fotoAntes!} etiqueta="Antes" />}
                itemTwo={<ImagenComparacion foto={fotoDespues!} etiqueta="Después" />}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Por defecto ves la primera y la última foto de {ETIQUETAS_TIPO[tipo].toLowerCase()}. Podés cambiar ambas desde las miniaturas de abajo.
          </p>
        </div>
      ) : (
        <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-8 text-center">
          {fotoAntes ? (
            <>
              <img
                src={fotoAntes.urlFirmada}
                alt={`Unica foto de ${ETIQUETAS_TIPO[tipo].toLowerCase()}`}
                className="mb-4 h-44 w-full max-w-sm rounded-xl object-cover"
              />
              <p className="font-medium text-foreground">
                Todavía no alcanza para comparar
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ya hay una foto de {ETIQUETAS_TIPO[tipo].toLowerCase()}. Cuando cargues otra de otra sesión, el antes/después se arma solo.
              </p>
            </>
          ) : (
            <>
              <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-foreground">
                Sin historial suficiente para comparar
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Necesitás al menos dos fotos de este ángulo para ver cambios reales.
              </p>
            </>
          )}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Historial de tomas</p>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {fotosOrdenadas.map((foto) => {
            const esAntes = fotoAntes?.idFoto === foto.idFoto;
            const esDespues = fotoDespues?.idFoto === foto.idFoto;

            return (
              <div
                key={foto.idFoto}
                className="w-56 shrink-0 space-y-3 rounded-2xl border bg-card p-3"
              >
                <div className="relative overflow-hidden rounded-xl border bg-muted/20">
                  <img
                    src={foto.urlFirmada}
                    alt={`Foto ${foto.tipoFoto} del ${formatearFechaFoto(foto)}`}
                    className="aspect-[4/5] w-full object-cover"
                  />
                  <div className="absolute left-2 top-2 flex gap-2">
                    {esAntes && <Badge>Antes</Badge>}
                    {esDespues && <Badge variant="secondary">Después</Badge>}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {formatearFechaFoto(foto)}
                  </p>
                  {foto.notas && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{foto.notas}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={esAntes ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => usarComoAntes(foto.idFoto)}
                    aria-label={`Usar ${formatearFechaFoto(foto)} como antes en ${ETIQUETAS_TIPO[tipo]}`}
                  >
                    Antes
                  </Button>
                  <Button
                    type="button"
                    variant={esDespues ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => usarComoDespues(foto.idFoto)}
                    aria-label={`Usar ${formatearFechaFoto(foto)} como despues en ${ETIQUETAS_TIPO[tipo]}`}
                  >
                    Después
                  </Button>
                </div>

                {puedeEditar && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive"
                    disabled={fotoEliminando === foto.idFoto}
                    onClick={() => onEliminarFoto?.(foto.idFoto)}
                  >
                    {fotoEliminando === foto.idFoto ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ImagenComparacion({
  foto,
  etiqueta,
}: {
  foto: FotoProgreso;
  etiqueta: 'Antes' | 'Después';
}) {
  return (
    <div className="relative h-full w-full">
      <img
        src={foto.urlFirmada}
        alt={`${etiqueta}: ${formatearFechaFoto(foto)}`}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10 text-white">
        <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-medium">
          {etiqueta}
        </span>
        <span className="text-sm">{formatearFechaFoto(foto)}</span>
      </div>
    </div>
  );
}

function formatearFechaFoto(foto: FotoProgreso | null): string {
  if (!foto) return 'Sin seleccionar';

  return format(new Date(foto.fecha), "d 'de' MMM yyyy", { locale: es });
}
