import { useEffect } from 'react';
import { Maximize2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface PropiedadesDialogFotoMaximize {
  abierto: boolean;
  alCerrar: () => void;
  urlFoto: string | null;
  nombre?: string;
  apellido?: string;
}

export function DialogFotoMaximize({
  abierto,
  alCerrar,
  urlFoto,
  nombre,
  apellido,
}: PropiedadesDialogFotoMaximize) {
  useEffect(() => {
    if (!abierto) return;
    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        alCerrar();
      }
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, alCerrar]);

  if (!urlFoto) return null;

  const altTexto =
    nombre && apellido ? `Foto de ${nombre} ${apellido}` : 'Foto de perfil';

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && alCerrar()}>
      <DialogContent
        showCloseButton={false}
        className="flex items-center justify-center max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-transparent shadow-none gap-0"
        onClick={alCerrar}
      >
        <DialogTitle className="sr-only">{altTexto}</DialogTitle>
        <div
          className="relative flex items-center justify-center max-w-[95vw] max-h-[95vh]"
          onClick={(evento) => evento.stopPropagation()}
        >
          <img
            src={urlFoto}
            alt={altTexto}
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
          />
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <div className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm flex items-center gap-1.5">
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Pantalla completa</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={alCerrar}
              className="rounded-full bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-sm"
              aria-label="Cerrar foto maximizada"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
