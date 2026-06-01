import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Move, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PropiedadesDialogoZoomImagen {
  abierto: boolean;
  archivoOriginal: File | null;
  titulo?: string;
  descripcion?: string;
  textoBotonConfirmar?: string;
  onCancelar: () => void;
  onConfirmar: (archivoProcesado: File) => void;
}

interface DimensionesImagen {
  ancho: number;
  alto: number;
}

interface DatosVistaPrevia {
  maximoDesplazamientoX: number;
  maximoDesplazamientoY: number;
}

interface EstadoArrastre {
  inicioX: number;
  inicioY: number;
  baseX: number;
  baseY: number;
}

const ZOOM_MINIMO = 1;
const ZOOM_MAXIMO = 3;
const PASO_ZOOM = 0.05;
const ZOOM_INICIAL = 1;
const TAMANIO_SALIDA = 800;

const cargarImagen = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
    imagen.src = url;
  });
};

const obtenerNombreBase = (nombreArchivo: string): string => {
  const ultimoPunto = nombreArchivo.lastIndexOf('.');
  if (ultimoPunto <= 0) {
    return nombreArchivo;
  }

  return nombreArchivo.slice(0, ultimoPunto);
};

const convertirCanvasEnBlob = (
  canvas: HTMLCanvasElement,
  tipoMime: string,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const calidad = tipoMime === 'image/jpeg' ? 0.92 : undefined;
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo procesar la imagen.'));
          return;
        }
        resolve(blob);
      },
      tipoMime,
      calidad,
    );
  });
};

const limitarValor = (valor: number, minimo: number, maximo: number): number => {
  if (valor < minimo) {
    return minimo;
  }

  if (valor > maximo) {
    return maximo;
  }

  return valor;
};

const obtenerDatosVistaPrevia = (
  dimensionesImagen: DimensionesImagen,
  zoom: number,
  tamanioPreview: number,
): DatosVistaPrevia => {
  const escalaBase = Math.max(
    tamanioPreview / dimensionesImagen.ancho,
    tamanioPreview / dimensionesImagen.alto,
  );

  let anchoVisual = dimensionesImagen.ancho * escalaBase * zoom;
  let altoVisual = dimensionesImagen.alto * escalaBase * zoom;

  const factorMinimo = Math.max(
    tamanioPreview / anchoVisual,
    tamanioPreview / altoVisual,
    1,
  );

  anchoVisual *= factorMinimo;
  altoVisual *= factorMinimo;

  return {
    maximoDesplazamientoX: Math.max((anchoVisual - tamanioPreview) / 2, 0),
    maximoDesplazamientoY: Math.max((altoVisual - tamanioPreview) / 2, 0),
  };
};

const generarArchivoConZoom = async (
  archivoOriginal: File,
  zoom: number,
  desplazamientoNormalizadoX: number,
  desplazamientoNormalizadoY: number,
): Promise<File> => {
  const urlTemporal = URL.createObjectURL(archivoOriginal);

  try {
    const imagen = await cargarImagen(urlTemporal);
    const canvas = document.createElement('canvas');
    canvas.width = TAMANIO_SALIDA;
    canvas.height = TAMANIO_SALIDA;

    const contexto = canvas.getContext('2d');
    if (!contexto) {
      throw new Error('No se pudo inicializar el procesador de imagen.');
    }

    contexto.imageSmoothingEnabled = true;
    contexto.imageSmoothingQuality = 'high';

    const escalaBase = Math.max(
      TAMANIO_SALIDA / imagen.width,
      TAMANIO_SALIDA / imagen.height,
    );
    const escalaFinal = escalaBase * zoom;

    let anchoEscalado = imagen.width * escalaFinal;
    let altoEscalado = imagen.height * escalaFinal;

    const factorMinimo = Math.max(
      TAMANIO_SALIDA / anchoEscalado,
      TAMANIO_SALIDA / altoEscalado,
      1,
    );

    anchoEscalado *= factorMinimo;
    altoEscalado *= factorMinimo;

    const maximoDesplazamientoX = Math.max((anchoEscalado - TAMANIO_SALIDA) / 2, 0);
    const maximoDesplazamientoY = Math.max((altoEscalado - TAMANIO_SALIDA) / 2, 0);

    const normalizadoX = limitarValor(desplazamientoNormalizadoX, -1, 1);
    const normalizadoY = limitarValor(desplazamientoNormalizadoY, -1, 1);

    const desplazamientoX = normalizadoX * maximoDesplazamientoX;
    const desplazamientoY = normalizadoY * maximoDesplazamientoY;

    const posicionX = (TAMANIO_SALIDA - anchoEscalado) / 2 + desplazamientoX;
    const posicionY = (TAMANIO_SALIDA - altoEscalado) / 2 + desplazamientoY;

    contexto.drawImage(imagen, posicionX, posicionY, anchoEscalado, altoEscalado);

    const tipoMimeSalida =
      archivoOriginal.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const extensionSalida = tipoMimeSalida === 'image/png' ? 'png' : 'jpg';
    const nombreBase = obtenerNombreBase(archivoOriginal.name);

    const blob = await convertirCanvasEnBlob(canvas, tipoMimeSalida);

    return new File([blob], `${nombreBase}-zoom.${extensionSalida}`, {
      type: tipoMimeSalida,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(urlTemporal);
  }
};

export function DialogoZoomImagen({
  abierto,
  archivoOriginal,
  titulo = 'Ajustar foto de perfil',
  descripcion = 'Ajustá el zoom y mové la imagen antes de guardar.',
  textoBotonConfirmar = 'Guardar imagen',
  onCancelar,
  onConfirmar,
}: PropiedadesDialogoZoomImagen) {
  const contenedorPreviewRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState(ZOOM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [desplazamientoX, setDesplazamientoX] = useState(0);
  const [desplazamientoY, setDesplazamientoY] = useState(0);
  const [estadoArrastre, setEstadoArrastre] = useState<EstadoArrastre | null>(null);
  const [tamanioPreview, setTamanioPreview] = useState(340);
  const [dimensionesImagen, setDimensionesImagen] =
    useState<DimensionesImagen | null>(null);

  const urlPreview = useMemo(() => {
    if (!archivoOriginal) {
      return null;
    }

    return URL.createObjectURL(archivoOriginal);
  }, [archivoOriginal]);

  useEffect(() => {
    if (!urlPreview) {
      setDimensionesImagen(null);
      return;
    }

    let cancelado = false;

    void cargarImagen(urlPreview)
      .then((imagen) => {
        if (!cancelado) {
          setDimensionesImagen({ ancho: imagen.width, alto: imagen.height });
        }
      })
      .catch(() => {
        if (!cancelado) {
          setDimensionesImagen(null);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [urlPreview]);

  useEffect(() => {
    if (!urlPreview) {
      return;
    }

    return () => {
      URL.revokeObjectURL(urlPreview);
    };
  }, [urlPreview]);

  useEffect(() => {
    const elemento = contenedorPreviewRef.current;
    if (!abierto || !elemento) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entrada = entries[0];
      if (!entrada) {
        return;
      }

      setTamanioPreview(entrada.contentRect.width);
    });

    observer.observe(elemento);

    return () => {
      observer.disconnect();
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) {
      return;
    }

    const elemento = contenedorPreviewRef.current;
    if (!elemento) {
      return;
    }

    const medir = () => {
      const ancho = elemento.getBoundingClientRect().width;
      if (ancho > 0) {
        setTamanioPreview(ancho);
      }
    };

    medir();
    const raf = requestAnimationFrame(medir);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [abierto, archivoOriginal]);

  const datosVistaPrevia = useMemo(() => {
    if (!dimensionesImagen) {
      return null;
    }

    return obtenerDatosVistaPrevia(dimensionesImagen, zoom, tamanioPreview);
  }, [dimensionesImagen, tamanioPreview, zoom]);

  const puedeArrastrar = useMemo(() => {
    if (!datosVistaPrevia) {
      return false;
    }

    if (zoom <= ZOOM_MINIMO + 0.001) {
      return false;
    }

    return (
      datosVistaPrevia.maximoDesplazamientoX > 0 ||
      datosVistaPrevia.maximoDesplazamientoY > 0
    );
  }, [datosVistaPrevia, zoom]);

  const limitarDesplazamiento = useCallback(
    (x: number, y: number) => {
      if (!datosVistaPrevia) {
        return { x: 0, y: 0 };
      }

      return {
        x: limitarValor(
          x,
          -datosVistaPrevia.maximoDesplazamientoX,
          datosVistaPrevia.maximoDesplazamientoX,
        ),
        y: limitarValor(
          y,
          -datosVistaPrevia.maximoDesplazamientoY,
          datosVistaPrevia.maximoDesplazamientoY,
        ),
      };
    },
    [datosVistaPrevia],
  );

  useEffect(() => {
    if (abierto) {
      setZoom(ZOOM_INICIAL);
      setDesplazamientoX(0);
      setDesplazamientoY(0);
      setEstadoArrastre(null);
    }
  }, [abierto, archivoOriginal]);

  useEffect(() => {
    const desplazamientoLimitado = limitarDesplazamiento(
      desplazamientoX,
      desplazamientoY,
    );

    if (desplazamientoLimitado.x !== desplazamientoX) {
      setDesplazamientoX(desplazamientoLimitado.x);
    }

    if (desplazamientoLimitado.y !== desplazamientoY) {
      setDesplazamientoY(desplazamientoLimitado.y);
    }
  }, [desplazamientoX, desplazamientoY, limitarDesplazamiento]);

  useEffect(() => {
    if (zoom <= ZOOM_MINIMO + 0.001) {
      setDesplazamientoX(0);
      setDesplazamientoY(0);
      setEstadoArrastre(null);
    }
  }, [zoom]);

  const manejarInicioArrastre = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!datosVistaPrevia || !puedeArrastrar) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setEstadoArrastre({
      inicioX: event.clientX,
      inicioY: event.clientY,
      baseX: desplazamientoX,
      baseY: desplazamientoY,
    });
  };

  const manejarArrastre = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!estadoArrastre) {
      return;
    }

    event.preventDefault();

    const deltaX = event.clientX - estadoArrastre.inicioX;
    const deltaY = event.clientY - estadoArrastre.inicioY;

    const desplazamientoLimitado = limitarDesplazamiento(
      estadoArrastre.baseX + deltaX,
      estadoArrastre.baseY + deltaY,
    );

    setDesplazamientoX(desplazamientoLimitado.x);
    setDesplazamientoY(desplazamientoLimitado.y);
  };

  const finalizarArrastre = (event: React.PointerEvent<HTMLDivElement>) => {
    if (estadoArrastre) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // no-op
      }
    }

    setEstadoArrastre(null);
  };

  const manejarRecentrar = () => {
    setDesplazamientoX(0);
    setDesplazamientoY(0);
  };

  const manejarConfirmar = async () => {
    if (!archivoOriginal || !datosVistaPrevia) {
      return;
    }

    const desplazamientoNormalizadoX =
      datosVistaPrevia.maximoDesplazamientoX > 0
        ? desplazamientoX / datosVistaPrevia.maximoDesplazamientoX
        : 0;

    const desplazamientoNormalizadoY =
      datosVistaPrevia.maximoDesplazamientoY > 0
        ? desplazamientoY / datosVistaPrevia.maximoDesplazamientoY
        : 0;

    try {
      setGuardando(true);
      const archivoProcesado = await generarArchivoConZoom(
        archivoOriginal,
        zoom,
        desplazamientoNormalizadoX,
        desplazamientoNormalizadoY,
      );
      onConfirmar(archivoProcesado);
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'No se pudo ajustar la imagen.';
      toast.error(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const porcentajeZoom = Math.round(zoom * 100);

  const estiloImagenPrevia = useMemo(() => {
    if (!datosVistaPrevia || !dimensionesImagen) {
      return undefined;
    }

    const posicionX = Math.round(desplazamientoX);
    const posicionY = Math.round(desplazamientoY);

    return {
      transform: `translate3d(${posicionX}px, ${posicionY}px, 0) scale(${zoom})`,
      transformOrigin: 'center center',
    };
  }, [datosVistaPrevia, dimensionesImagen, desplazamientoX, desplazamientoY, zoom]);

  return (
    <Dialog
      open={abierto}
      onOpenChange={(siguienteAbierto) => {
        if (!siguienteAbierto && !guardando) {
          onCancelar();
        }
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            ref={contenedorPreviewRef}
            className="relative mx-auto aspect-square w-full max-w-[340px] overflow-hidden rounded-2xl border bg-muted/30 touch-none"
            onPointerDown={manejarInicioArrastre}
            onPointerMove={manejarArrastre}
            onPointerUp={finalizarArrastre}
            onPointerCancel={finalizarArrastre}
            onPointerLeave={finalizarArrastre}
            style={{
              cursor: estadoArrastre ? 'grabbing' : puedeArrastrar ? 'grab' : 'default',
            }}
          >
            {urlPreview && datosVistaPrevia ? (
              <img
                src={urlPreview}
                alt="Vista previa de imagen"
                draggable={false}
                className="absolute inset-0 h-full w-full select-none object-cover"
                style={estiloImagenPrevia}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No hay imagen seleccionada
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ZoomOut className="h-3.5 w-3.5" />
                Alejar
              </span>
              <span className="text-sm font-medium text-foreground">
                {porcentajeZoom}%
              </span>
              <span className="inline-flex items-center gap-1">
                Acercar
                <ZoomIn className="h-3.5 w-3.5" />
              </span>
            </div>

            <input
              type="range"
              min={ZOOM_MINIMO}
              max={ZOOM_MAXIMO}
              step={PASO_ZOOM}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-primary"
            />

            <div className="flex items-center justify-between">
              <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Move className="h-3.5 w-3.5" />
                {puedeArrastrar
                  ? 'Arrastrá la imagen para moverla.'
                  : 'Aumentá el zoom para poder mover la imagen.'}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs"
                onClick={manejarRecentrar}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Recentrar
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={guardando}
            onClick={onCancelar}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!archivoOriginal || guardando}
            onClick={() => void manejarConfirmar()}
          >
            {guardando ? 'Guardando...' : textoBotonConfirmar}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
