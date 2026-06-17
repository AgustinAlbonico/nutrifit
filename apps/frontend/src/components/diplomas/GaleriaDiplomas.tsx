import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Download } from 'lucide-react';

import type { DiplomaDto } from '@/types/nutricionista';
import { obtenerUrlFoto } from '@/lib/api';

interface GaleriaDiplomasProps {
  diplomas: DiplomaDto[];
  indiceInicial: number;
  onCerrar: () => void;
}

const esImagen = (d: DiplomaDto): boolean => {
  if (d.mimeType?.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(d.nombreOriginal ?? '');
};

export function GaleriaDiplomas({
  diplomas,
  indiceInicial,
  onCerrar,
}: GaleriaDiplomasProps) {
  const [indice, setIndice] = useState(indiceInicial);
  const diplomaActual = diplomas[indice];
  const total = diplomas.length;

  const irAnterior = useCallback(() => {
    setIndice((i) => (i - 1 + total) % total);
  }, [total]);

  const irSiguiente = useCallback(() => {
    setIndice((i) => (i + 1) % total);
  }, [total]);

  useEffect(() => {
    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCerrar();
      } else if (e.key === 'ArrowLeft' && total > 1) {
        irAnterior();
      } else if (e.key === 'ArrowRight' && total > 1) {
        irSiguiente();
      }
    };
    window.addEventListener('keydown', manejarTecla);
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', manejarTecla);
      document.body.style.overflow = overflowOriginal;
    };
  }, [onCerrar, irAnterior, irSiguiente, total]);

  if (!diplomaActual) return null;

  const url = obtenerUrlFoto(diplomaActual.url) ?? '';
  const imagen = esImagen(diplomaActual);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Diploma ${indice + 1} de ${total}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCerrar}
      data-testid="galeria-diplomas"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCerrar();
        }}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white/90 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Cerrar galería"
        data-testid="galeria-cerrar"
      >
        <X className="h-6 w-6" />
      </button>

      <a
        href={url}
        download={diplomaActual.nombreOriginal ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-16 top-4 z-10 rounded-full bg-white/10 p-2 text-white/90 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Descargar diploma"
        title="Descargar"
        data-testid="galeria-descargar"
      >
        <Download className="h-6 w-6" />
      </a>

      <div
        className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white"
        data-testid="galeria-contador"
      >
        {indice + 1} / {total}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              irAnterior();
            }}
            className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white/90 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Diploma anterior"
            data-testid="galeria-anterior"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              irSiguiente();
            }}
            className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white/90 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Diploma siguiente"
            data-testid="galeria-siguiente"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </>
      )}

      <div
        className="relative max-h-[83vh] max-w-[87vw]"
        onClick={(e) => e.stopPropagation()}
        data-testid="galeria-contenido"
      >
        {imagen ? (
          <img
            src={url}
            alt={diplomaActual.nombreOriginal ?? `Diploma ${indice + 1}`}
            className="max-h-[83vh] max-w-[87vw] rounded object-contain shadow-2xl"
            data-testid="galeria-imagen"
          />
        ) : (
          <iframe
            src={url}
            title={diplomaActual.nombreOriginal ?? `Diploma ${indice + 1}`}
            className="h-[83vh] w-[87vw] rounded bg-white shadow-2xl"
            data-testid="galeria-iframe"
          />
        )}
      </div>
    </div>
  );
}
