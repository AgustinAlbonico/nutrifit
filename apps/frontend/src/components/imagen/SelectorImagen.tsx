import { useId, useRef, useState, useEffect } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DialogoZoomImagen } from '@/components/media/DialogoZoomImagen';
import { cn } from '@/lib/utils';

interface PropiedadesSelectorImagen {
  valorActual?: string | null;
  alCambiarFoto: (archivo: File | null) => void;
  etiqueta?: string;
  error?: string | null;
  deshabilitado?: boolean;
  tamanoPreview?: number;
}

export function SelectorImagen({
  valorActual,
  alCambiarFoto,
  etiqueta = 'Foto de perfil',
  error,
  deshabilitado = false,
  tamanoPreview = 128,
}: PropiedadesSelectorImagen) {
  const [archivoEnEdicion, setArchivoEnEdicion] = useState<File | null>(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const idInput = useId();
  const idError = `${idInput}-error`;

  const [urlPreviewLocal, setUrlPreviewLocal] = useState<string | null>(null);
  const prevValorActual = useRef(valorActual);
  const seleccionandoFotoLocal = useRef(false);

  useEffect(() => {
    return () => {
      if (urlPreviewLocal) {
        URL.revokeObjectURL(urlPreviewLocal);
      }
    };
  }, [urlPreviewLocal]);

  useEffect(() => {
    if (valorActual !== prevValorActual.current) {
      if (seleccionandoFotoLocal.current) {
        seleccionandoFotoLocal.current = false;
      } else {
        if (urlPreviewLocal) {
          URL.revokeObjectURL(urlPreviewLocal);
          setUrlPreviewLocal(null);
        }
      }
      prevValorActual.current = valorActual;
    }
  }, [valorActual, urlPreviewLocal]);

  const mensajeError = error ?? errorValidacion;

  const manejarArchivo = (archivo: File) => {
    if (!archivo.type.startsWith('image/')) {
      setErrorValidacion('El archivo debe ser una imagen (jpg, png, etc.)');
      return;
    }
    setErrorValidacion(null);
    setArchivoEnEdicion(archivo);
    setDialogoAbierto(true);
  };

  const manejarInputArchivo = (evento: ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0];
    if (archivo) {
      manejarArchivo(archivo);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const manejarDrop = (evento: DragEvent<HTMLDivElement>) => {
    evento.preventDefault();
    setArrastrando(false);
    if (deshabilitado) {
      return;
    }
    const archivo = evento.dataTransfer.files[0];
    if (archivo) {
      manejarArchivo(archivo);
    }
  };

  const confirmarZoom = (archivoProcesado: File) => {
    setDialogoAbierto(false);
    setArchivoEnEdicion(null);

    seleccionandoFotoLocal.current = true;
    const url = URL.createObjectURL(archivoProcesado);
    setUrlPreviewLocal((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    alCambiarFoto(archivoProcesado);
  };

  const cancelarZoom = () => {
    setDialogoAbierto(false);
    setArchivoEnEdicion(null);
  };

  const quitarFoto = () => {
    if (deshabilitado) {
      return;
    }
    if (urlPreviewLocal) {
      URL.revokeObjectURL(urlPreviewLocal);
      setUrlPreviewLocal(null);
    }
    alCambiarFoto(null);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={idInput} className="text-sm font-medium text-foreground">
        {etiqueta}
      </label>

      <div
        data-testid="drop-zone"
        onDrop={manejarDrop}
        onDragOver={(evento) => {
          evento.preventDefault();
          if (!deshabilitado) {
            setArrastrando(true);
          }
        }}
        onDragLeave={() => setArrastrando(false)}
        className={cn(
          'rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          arrastrando
            ? 'border-primary bg-primary/5'
            : 'border-border bg-background',
          deshabilitado && 'cursor-not-allowed opacity-60',
        )}
      >
        {(valorActual || urlPreviewLocal) ? (
          <div className="relative inline-block">
            <img
              src={urlPreviewLocal || valorActual || ''}
              alt={etiqueta}
              style={{
                width: tamanoPreview,
                height: tamanoPreview,
              }}
              className="rounded-full object-cover"
            />
            {!deshabilitado && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={quitarFoto}
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0"
                aria-label={`Quitar ${etiqueta.toLowerCase()}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div data-testid="upload-icon">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                Arrastrá una imagen aquí o
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={deshabilitado}
                onClick={() => inputRef.current?.click()}
              >
                Seleccionar archivo
              </Button>
              <input
                ref={inputRef}
                id={idInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={manejarInputArchivo}
                disabled={deshabilitado}
                aria-label={etiqueta}
                aria-describedby={mensajeError ? idError : undefined}
                aria-invalid={Boolean(mensajeError)}
              />
            </div>
            {mensajeError && (
              <p
                id={idError}
                role="alert"
                className="mt-2 text-sm text-destructive"
              >
                {mensajeError}
              </p>
            )}
          </div>
        )}
      </div>

      <DialogoZoomImagen
        abierto={dialogoAbierto}
        archivoOriginal={archivoEnEdicion}
        titulo="Ajustar foto de perfil"
        onCancelar={cancelarZoom}
        onConfirmar={confirmarZoom}
      />
    </div>
  );
}