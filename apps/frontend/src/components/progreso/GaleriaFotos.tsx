import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Camera, ImageIcon, Plus, RotateCcw } from 'lucide-react';
import { ReactCompareSlider } from 'react-compare-slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {tipoModalActivo && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">
                  {ETIQUETAS_TIPO[tipoModalActivo]}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Comparación visual de fotos de {ETIQUETAS_TIPO[tipoModalActivo].toLowerCase()}.
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
  const [slotActivo, setSlotActivo] = useState<'antes' | 'despues'>('antes');
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

  const seleccionarFotoParaSlotActivo = (fotoId: number) => {
    if (slotActivo === 'antes') {
      usarComoAntes(fotoId);
      return;
    }

    usarComoDespues(fotoId);
  };

  return (
    <div className="space-y-4">
      {tieneComparacion ? (
        <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border bg-muted/30">
          <div className="aspect-[4/3] max-h-[340px]">
            <ReactCompareSlider
              itemOne={<ImagenComparacion foto={fotoAntes!} etiqueta="Antes" />}
              itemTwo={<ImagenComparacion foto={fotoDespues!} etiqueta="Después" />}
            />
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
          {fotoAntes ? (
            <>
              <img
                src={fotoAntes.urlFirmada}
                alt={`Unica foto de ${ETIQUETAS_TIPO[tipo].toLowerCase()}`}
                className="mb-3 h-32 w-full max-w-[200px] rounded-lg object-cover"
              />
              <p className="text-sm font-medium text-foreground">Falta una segunda foto</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Cargá otra de otra sesión para activar la comparación.
              </p>
            </>
          ) : (
            <>
              <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sin fotos para comparar</p>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 text-sm">
        <span className={fotoAntes ? 'font-medium text-foreground' : 'text-muted-foreground'}>
          {formatearFechaFoto(fotoAntes)}
        </span>
        <span className="text-muted-foreground">→</span>
        <span className={fotoDespues ? 'font-medium text-foreground' : 'text-muted-foreground'}>
          {formatearFechaFoto(fotoDespues)}
        </span>
        {fotosOrdenadas.length >= 2 && (
          <button
            type="button"
            onClick={restablecerPrimeraVsUltima}
            className="ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Restablecer primera vs última"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setSlotActivo('antes')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            slotActivo === 'antes'
              ? 'bg-blue-500 text-white'
              : 'bg-muted text-muted-foreground hover:bg-blue-100 hover:text-blue-700'
          }`}
          aria-pressed={slotActivo === 'antes'}
        >
          Estoy eligiendo: Antes
        </button>
        <button
          type="button"
          onClick={() => setSlotActivo('despues')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            slotActivo === 'despues'
              ? 'bg-emerald-500 text-white'
              : 'bg-muted text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700'
          }`}
          aria-pressed={slotActivo === 'despues'}
        >
          Estoy eligiendo: Después
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {fotosOrdenadas.map((foto) => {
          const esAntes = fotoAntes?.idFoto === foto.idFoto;
          const esDespues = fotoDespues?.idFoto === foto.idFoto;
          const borde = esAntes
            ? 'border-blue-500 ring-1 ring-blue-500/30'
            : esDespues
              ? 'border-emerald-500 ring-1 ring-emerald-500/30'
              : 'border-border';

          return (
            <div key={foto.idFoto} className="w-20 shrink-0 space-y-1.5">
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => seleccionarFotoParaSlotActivo(foto.idFoto)}
                  className={`relative w-full overflow-hidden rounded-lg border-2 transition-transform hover:scale-[1.02] ${borde}`}
                  aria-label={`Seleccionar ${formatearFechaFoto(foto)} para ${slotActivo} en ${ETIQUETAS_TIPO[tipo]}`}
                >
                  <img
                    src={foto.urlFirmada}
                    alt={`Foto ${foto.tipoFoto} del ${formatearFechaFoto(foto)}`}
                    className="aspect-[3/4] w-full object-cover"
                  />
                </button>
                {puedeEditar && (
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                    disabled={fotoEliminando === foto.idFoto}
                    onClick={() => onEliminarFoto?.(foto.idFoto)}
                    aria-label={`Eliminar foto del ${formatearFechaFoto(foto)}`}
                  >
                    <span className="text-xs leading-none">✕</span>
                  </button>
                )}
              </div>
              <p className="text-center text-[11px] leading-tight text-muted-foreground">
                {formatearFechaCorta(foto)}
              </p>
              <div className="flex items-center justify-center gap-1 text-[10px] font-medium">
                <span className={esAntes ? 'text-blue-600' : 'text-muted-foreground'}>A</span>
                <span className="text-muted-foreground">·</span>
                <span className={esDespues ? 'text-emerald-600' : 'text-muted-foreground'}>D</span>
              </div>
            </div>
          );
        })}
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
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
        {etiqueta}
      </span>
    </div>
  );
}

function formatearFechaCorta(foto: FotoProgreso): string {
  return format(new Date(foto.fecha), "d MMM yy", { locale: es });
}

function formatearFechaFoto(foto: FotoProgreso | null): string {
  if (!foto) return 'Sin seleccionar';

  return format(new Date(foto.fecha), "d 'de' MMM yyyy", { locale: es });
}
