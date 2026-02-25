import { useState, useCallback, useRef } from 'react';
import { Upload, X, ImagePlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { TipoFoto } from './types';
import {
  validarArchivo,
  prepararArchivoParaSubida,
  obtenerUrlPreview,
  liberarUrlPreview,
  formatearTamanio,
} from '@/lib/utils/imagen';

interface PropiedadesFotoUploader {
  abierto: boolean;
  onCerrar: () => void;
  onSubir: (archivo: File, tipoFoto: TipoFoto, notas?: string) => Promise<void>;
  cargando?: boolean;
}

const OPCIONES_TIPO: { valor: TipoFoto; etiqueta: string }[] = [
  { valor: 'frente', etiqueta: 'Frente' },
  { valor: 'perfil', etiqueta: 'Perfil' },
  { valor: 'espalda', etiqueta: 'Espalda' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export function FotoUploader({
  abierto,
  onCerrar,
  onSubir,
  cargando = false,
}: PropiedadesFotoUploader) {
  const [archivo, establecerArchivo] = useState<File | null>(null);
  const [previewUrl, establecerPreviewUrl] = useState<string | null>(null);
  const [tipoFoto, establecerTipoFoto] = useState<TipoFoto>('frente');
  const [notas, establecerNotas] = useState('');
  const [error, establecerError] = useState<string | null>(null);
  const [arrastrando, establecerArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const limpiarEstado = useCallback(() => {
    if (previewUrl) {
      liberarUrlPreview(previewUrl);
    }
    establecerArchivo(null);
    establecerPreviewUrl(null);
    establecerTipoFoto('frente');
    establecerNotas('');
    establecerError(null);
  }, [previewUrl]);

  const manejarCerrar = () => {
    limpiarEstado();
    onCerrar();
  };

  const manejarArchivo = useCallback((nuevoArchivo: File) => {
    const validacion = validarArchivo(nuevoArchivo);
    if (!validacion.valido) {
      establecerError(validacion.error || 'Archivo inválido');
      return;
    }

    establecerError(null);
    establecerArchivo(nuevoArchivo);
    const url = obtenerUrlPreview(nuevoArchivo);
    establecerPreviewUrl(url);
  }, []);

  const manejarCambioInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivoSeleccionado = e.target.files?.[0];
    if (archivoSeleccionado) {
      manejarArchivo(archivoSeleccionado);
    }
  };

  const manejarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    establecerArrastrando(true);
  };

  const manejarDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    establecerArrastrando(false);
  };

  const manejarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    establecerArrastrando(false);
    const archivoSoltado = e.dataTransfer.files[0];
    if (archivoSoltado) {
      manejarArchivo(archivoSoltado);
    }
  };

  const manejarSubir = async () => {
    if (!archivo) return;

    try {
      establecerError(null);
      const archivoPreparado = await prepararArchivoParaSubida(archivo);
      await onSubir(archivoPreparado, tipoFoto, notas || undefined);
      limpiarEstado();
      onCerrar();
    } catch (err) {
      establecerError(err instanceof Error ? err.message : 'Error al subir la foto');
    }
  };

  const eliminarArchivo = () => {
    if (previewUrl) {
      liberarUrlPreview(previewUrl);
    }
    establecerArchivo(null);
    establecerPreviewUrl(null);
  };

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && manejarCerrar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir foto de progreso</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!archivo ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                arrastrando
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragOver={manejarDragOver}
              onDragLeave={manejarDragLeave}
              onDrop={manejarDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.heic,.heif"
                onChange={manejarCambioInput}
                className="hidden"
              />
              <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                Arrastrá una imagen aquí o
              </p>
              <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Seleccionar archivo
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Máximo 10MB. Formatos: JPG, PNG, WebP, GIF, HEIC
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={previewUrl!}
                  alt="Vista previa"
                  className="w-full h-full object-contain"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={eliminarArchivo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {archivo.name} ({formatearTamanio(archivo.size)})
              </p>
            </div>
          )}

          {archivo && (
            <>
              <div className="space-y-2">
                <Label>Tipo de foto</Label>
                <Select
                  value={tipoFoto}
                  onValueChange={(valor) => establecerTipoFoto(valor as TipoFoto)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCIONES_TIPO.map((opcion) => (
                      <SelectItem key={opcion.valor} value={opcion.valor}>
                        {opcion.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={notas}
                  onChange={(e) => establecerNotas(e.target.value)}
                  placeholder="Notas sobre esta foto..."
                  rows={2}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={manejarCerrar}>
              Cancelar
            </Button>
            <Button onClick={manejarSubir} disabled={!archivo || cargando}>
              {cargando ? 'Subiendo...' : 'Subir foto'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
