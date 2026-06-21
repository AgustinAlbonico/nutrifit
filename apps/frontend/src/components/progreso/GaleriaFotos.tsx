import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Camera, ImageIcon, Maximize2, Plus, RotateCcw } from 'lucide-react';
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
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl overflow-y-auto overflow-x-hidden p-4 sm:max-w-3xl sm:p-6">
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
  const [fotoAntesId, setFotoAntesId] = useState<number | null>(null);
  const [fotoDespuesId, setFotoDespuesId] = useState<number | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<FotoProgreso | null>(null);

  useEffect(() => {
    if (!fotoAmpliada) return;

    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFotoAmpliada(null);
    };

    document.addEventListener('keydown', manejarTecla);
    return () => document.removeEventListener('keydown', manejarTecla);
  }, [fotoAmpliada]);

  const fotoAntes =
    fotosOrdenadas.find((foto) => foto.idFoto === fotoAntesId) ?? fotoInicialAntes;
  const fotoDespues =
    fotosOrdenadas.find((foto) => foto.idFoto === fotoDespuesId) ?? fotoInicialDespues;
  const tieneComparacion =
    fotosOrdenadas.length >= 2 &&
    fotoAntes != null &&
    fotoDespues != null &&
    fotoAntes.idFoto !== fotoDespues.idFoto;
  const diferenciaTemporal =
    tieneComparacion && fotoAntes && fotoDespues
      ? formatearDiferenciaTemporal(fotoAntes, fotoDespues)
      : null;

  const usarComoAntes = (fotoId: number) => {
    setFotoAntesId(fotoId);
    if (fotoDespues?.idFoto === fotoId) {
      const reemplazo = [...fotosOrdenadas]
        .reverse()
        .find((foto) => foto.idFoto !== fotoId);
      setFotoDespuesId(reemplazo?.idFoto ?? null);
    }
  };

  const usarComoDespues = (fotoId: number) => {
    setFotoDespuesId(fotoId);
    if (fotoAntes?.idFoto === fotoId) {
      const reemplazo = fotosOrdenadas.find((foto) => foto.idFoto !== fotoId);
      setFotoAntesId(reemplazo?.idFoto ?? null);
    }
  };

  const restablecerPrimeraVsUltima = () => {
    setFotoAntesId(null);
    setFotoDespuesId(null);
  };

  const seleccionarFotoParaSlotActivo = (fotoId: number) => {
    if (slotActivo === 'antes') {
      usarComoAntes(fotoId);
      return;
    }

    usarComoDespues(fotoId);
  };

  return (
    <div className="min-w-0 space-y-4">
      {tieneComparacion ? (
        <div className="w-full overflow-hidden rounded-xl border bg-muted/30">
          <div className="h-[320px] w-full sm:h-[450px] lg:h-[560px]">
            <ReactCompareSlider
              className="h-full w-full"
              style={{ height: '100%', width: '100%' }}
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

      <div className="rounded-2xl border bg-muted/20 p-3 sm:p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <BotonSeleccionComparador
            tipo="antes"
            activo={slotActivo === 'antes'}
            foto={fotoAntes}
            onClick={() => setSlotActivo('antes')}
          />

          <div className="flex items-center justify-center rounded-xl border bg-background px-4 py-3 text-center">
            <div className="space-y-1" aria-live="polite">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Tiempo entre fotos
              </p>
              <p className="text-sm font-semibold text-foreground">
                {diferenciaTemporal
                  ? `Tiempo entre fotos: ${diferenciaTemporal}`
                  : 'Elegí dos fotos distintas'}
              </p>
            </div>
          </div>

          <BotonSeleccionComparador
            tipo="despues"
            activo={slotActivo === 'despues'}
            foto={fotoDespues}
            onClick={() => setSlotActivo('despues')}
          />
        </div>

        <div className="mt-3 flex flex-col gap-2 text-center text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-center">
          <span>
            {slotActivo === 'antes'
              ? 'Ahora tocá la miniatura que querés usar como ANTES.'
              : 'Ahora tocá la miniatura que querés usar como DESPUÉS.'}
          </span>
          {fotosOrdenadas.length >= 2 && (
            <button
              type="button"
              onClick={restablecerPrimeraVsUltima}
              className="inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Restablecer primera vs última"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-2">
        {fotosOrdenadas.map((foto) => {
          const esAntes = fotoAntes?.idFoto === foto.idFoto;
          const esDespues = fotoDespues?.idFoto === foto.idFoto;
          const borde = esAntes
            ? 'border-blue-500 ring-2 ring-blue-500/30'
            : esDespues
              ? 'border-emerald-500 ring-2 ring-emerald-500/30'
              : slotActivo === 'antes'
                ? 'border-border hover:border-blue-400'
                : 'border-border hover:border-emerald-400';
          const accionMiniatura = slotActivo === 'antes' ? 'antes' : 'después';

          return (
            <div key={foto.idFoto} className="w-24 shrink-0 space-y-1.5">
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => seleccionarFotoParaSlotActivo(foto.idFoto)}
                  className={`relative w-full overflow-hidden rounded-xl border-2 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${borde}`}
                  aria-label={`Usar ${formatearFechaFoto(foto)} como foto ${accionMiniatura} en ${ETIQUETAS_TIPO[tipo]}`}
                >
                  <img
                    src={foto.urlFirmada}
                    alt={`Foto ${foto.tipoFoto} del ${formatearFechaFoto(foto)}`}
                    className="aspect-[3/4] w-full object-cover"
                  />
                  {esAntes && (
                    <span className="absolute left-1 top-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      ANTES
                    </span>
                  )}
                  {esDespues && (
                    <span className="absolute left-1 top-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      DESPUÉS
                    </span>
                  )}
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFotoAmpliada(foto);
                  }}
                  className="absolute bottom-1 right-1 rounded bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  aria-label={`Ver ${formatearFechaFoto(foto)} en grande`}
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
              <p className="text-center text-[11px] leading-tight text-muted-foreground">
                {formatearFechaCorta(foto)}
              </p>
              <div className="text-center text-[10px] font-medium text-muted-foreground">
                {slotActivo === 'antes' ? 'Usar como ANTES' : 'Usar como DESPUÉS'}
              </div>
            </div>
          );
        })}
      </div>

      {fotoAmpliada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setFotoAmpliada(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada: ${formatearFechaFoto(fotoAmpliada)}`}
        >
          <button
            type="button"
            onClick={() => setFotoAmpliada(null)}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            aria-label="Cerrar foto ampliada"
          >
            <span className="text-lg font-bold">✕</span>
          </button>
          <div
            className="flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={fotoAmpliada.urlFirmada}
              alt={`Foto ampliada: ${formatearFechaFoto(fotoAmpliada)}`}
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
            />
            <p className="text-sm font-medium text-white/80">
              {ETIQUETAS_TIPO[tipo]} — {formatearFechaFoto(fotoAmpliada)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function BotonSeleccionComparador({
  tipo,
  activo,
  foto,
  onClick,
}: {
  tipo: 'antes' | 'despues';
  activo: boolean;
  foto: FotoProgreso | null;
  onClick: () => void;
}) {
  const esAntes = tipo === 'antes';
  const etiqueta = esAntes ? 'Seleccionar foto ANTES' : 'Seleccionar foto DESPUÉS';
  const colorActivo = esAntes
    ? 'border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-500/30'
    : 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30';
  const colorInactivo = esAntes
    ? 'border-border bg-background text-foreground hover:border-blue-300 hover:bg-blue-50/60'
    : 'border-border bg-background text-foreground hover:border-emerald-300 hover:bg-emerald-50/60';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      aria-pressed={activo}
      className={`rounded-2xl border-2 p-3 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-24 md:p-4 ${activo ? colorActivo : colorInactivo}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground md:text-[11px]">
        {esAntes ? 'Paso 1' : 'Paso 2'}
      </span>
      <span className="mt-1 block text-sm font-black leading-tight sm:text-base">
        {etiqueta}
      </span>
      <span className="mt-1 block text-xs font-medium text-muted-foreground sm:text-sm">
        {foto ? formatearFechaFoto(foto) : 'Sin seleccionar'}
      </span>
    </button>
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

function formatearDiferenciaTemporal(fotoAntes: FotoProgreso, fotoDespues: FotoProgreso): string {
  const fechaAntes = new Date(fotoAntes.fecha);
  const fechaDespues = new Date(fotoDespues.fecha);
  const [inicio, fin] = fechaAntes <= fechaDespues
    ? [fechaAntes, fechaDespues]
    : [fechaDespues, fechaAntes];

  let anios = fin.getFullYear() - inicio.getFullYear();
  let meses = fin.getMonth() - inicio.getMonth();
  let dias = fin.getDate() - inicio.getDate();

  if (dias < 0) {
    meses -= 1;
    dias += new Date(fin.getFullYear(), fin.getMonth(), 0).getDate();
  }

  if (meses < 0) {
    anios -= 1;
    meses += 12;
  }

  const partes = [
    formatearUnidadTemporal(anios, 'año', 'años'),
    formatearUnidadTemporal(meses, 'mes', 'meses'),
    formatearUnidadTemporal(dias, 'día', 'días'),
  ].filter((parte): parte is string => Boolean(parte));

  if (partes.length === 0) return 'mismo día';
  if (partes.length === 1) return `${partes[0]} de diferencia`;

  return `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)} de diferencia`;
}

function formatearUnidadTemporal(
  valor: number,
  singular: string,
  plural: string,
): string | null {
  if (valor <= 0) return null;

  return `${valor} ${valor === 1 ? singular : plural}`;
}
