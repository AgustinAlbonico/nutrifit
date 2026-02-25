import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, ImageIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { FotoProgreso } from './types';

interface PropiedadesTarjetaFoto {
  foto: FotoProgreso;
  puedeEliminar?: boolean;
  onDelete?: () => void;
  eliminando?: boolean;
}

const ETIQUETAS_TIPO: Record<string, string> = {
  frente: 'Frente',
  perfil: 'Perfil',
  espalda: 'Espalda',
  otro: 'Otro',
};

export function TarjetaFoto({
  foto,
  puedeEliminar = false,
  onDelete,
  eliminando = false,
}: PropiedadesTarjetaFoto) {
  const [mostrarModal, setMostrarModal] = useState(false);

  const fechaFormateada = format(new Date(foto.fecha), "d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  return (
    <>
      <div className="group relative rounded-lg overflow-hidden border bg-card hover:shadow-md transition-shadow">
        <button
          onClick={() => setMostrarModal(true)}
          className="w-full aspect-square bg-muted flex items-center justify-center overflow-hidden"
        >
          {foto.urlFirmada ? (
            <img
              src={foto.urlFirmada}
              alt={`Foto ${foto.tipoFoto}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          )}
        </button>

        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {ETIQUETAS_TIPO[foto.tipoFoto] || foto.tipoFoto}
            </Badge>
            {puedeEliminar && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onDelete}
                disabled={eliminando}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">{fechaFormateada}</p>

          {foto.notas && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-6 px-2">
                    <Info className="h-3 w-3 mr-1" />
                    Notas
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{foto.notas}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Foto {ETIQUETAS_TIPO[foto.tipoFoto] || foto.tipoFoto} - {fechaFormateada}
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
            {foto.urlFirmada ? (
              <img
                src={foto.urlFirmada}
                alt={`Foto ${foto.tipoFoto}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>
          {foto.notas && (
            <p className="text-sm text-muted-foreground mt-2">{foto.notas}</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
