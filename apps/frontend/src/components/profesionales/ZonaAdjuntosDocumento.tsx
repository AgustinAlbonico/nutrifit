import { useId, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { FileText, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PropiedadesZonaAdjuntosDocumento {
  archivo: File | null;
  alCambiar: (archivo: File | null) => void;
  etiqueta?: string;
  deshabilitado?: boolean;
  aceptar?: string;
}

const ACEPTO_POR_DEFECTO = 'application/pdf,image/*';
const TAMANIO_MAX_MB = 10;

function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ZonaAdjuntosDocumento({
  archivo,
  alCambiar,
  etiqueta = 'Adjuntar documento',
  deshabilitado = false,
  aceptar = ACEPTO_POR_DEFECTO,
}: PropiedadesZonaAdjuntosDocumento) {
  const [arrastrando, setArrastrando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const idInput = useId();

  const procesarArchivo = (candidato: File | undefined | null) => {
    if (!candidato) return;

    const esPdf = candidato.type === 'application/pdf';
    const esImagen = candidato.type.startsWith('image/');
    if (!esPdf && !esImagen) {
      setErrorValidacion('Solo se aceptan PDF o imágenes.');
      return;
    }

    const tamMb = candidato.size / (1024 * 1024);
    if (tamMb > TAMANIO_MAX_MB) {
      setErrorValidacion(`El archivo supera el máximo de ${TAMANIO_MAX_MB} MB.`);
      return;
    }

    setErrorValidacion(null);
    alCambiar(candidato);
  };

  const manejarInput = (evento: ChangeEvent<HTMLInputElement>) => {
    procesarArchivo(evento.target.files?.[0]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const manejarDrop = (evento: DragEvent<HTMLDivElement>) => {
    evento.preventDefault();
    setArrastrando(false);
    if (deshabilitado) return;
    procesarArchivo(evento.dataTransfer.files?.[0]);
  };

  const quitar = () => {
    if (deshabilitado) return;
    setErrorValidacion(null);
    alCambiar(null);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{etiqueta}</p>

      <div
        data-testid="drop-zone-documento"
        onDrop={manejarDrop}
        onDragOver={(evento) => {
          evento.preventDefault();
          if (!deshabilitado) setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        className={cn(
          'rounded-md border-2 border-dashed p-4 text-center transition-colors',
          arrastrando ? 'border-primary bg-primary/5' : 'border-border bg-background',
          deshabilitado && 'cursor-not-allowed opacity-60',
        )}
      >
        {archivo ? (
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{archivo.name}</p>
                <p className="text-xs text-muted-foreground">{formatearTamano(archivo.size)}</p>
              </div>
            </div>
            {!deshabilitado && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={quitar}
                aria-label={`Quitar ${etiqueta.toLowerCase()}`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Arrastrá el archivo aquí o
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deshabilitado}
              onClick={() => inputRef.current?.click()}
            >
              Seleccionar archivo
            </Button>
            <p className="text-[11px] text-muted-foreground">PDF o imagen · máx. {TAMANIO_MAX_MB} MB</p>
            <input
              ref={inputRef}
              id={idInput}
              type="file"
              accept={aceptar}
              className="hidden"
              onChange={manejarInput}
              disabled={deshabilitado}
              aria-label={etiqueta}
            />
          </div>
        )}
      </div>

      {errorValidacion && (
        <p role="alert" className="text-xs text-destructive">
          {errorValidacion}
        </p>
      )}
    </div>
  );
}
