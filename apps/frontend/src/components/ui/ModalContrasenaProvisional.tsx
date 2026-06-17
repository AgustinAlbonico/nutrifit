import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PropiedadesModalContrasenaProvisional {
  abierto: boolean;
  alCerrar: () => void;
  contrasena: string;
  nombreRol: string;
}

export function ModalContrasenaProvisional({
  abierto,
  alCerrar,
  contrasena,
  nombreRol,
}: PropiedadesModalContrasenaProvisional) {
  const [copiada, setCopiada] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(contrasena);
      setCopiada(true);
    } catch {
      // fallback silencioso
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(open) => { if (!open) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contraseña provisional generada</DialogTitle>
          <DialogDescription>
            El sistema generó una contraseña segura. {nombreRol} deberá
            cambiarla en su primer inicio de sesión.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Alert className="border-amber-500/40 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-700" />
            <AlertTitle className="text-amber-900">Importante</AlertTitle>
            <AlertDescription className="text-amber-800">
              Compartila por un canal seguro. Por seguridad, no se vuelve a mostrar.
            </AlertDescription>
          </Alert>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
            <code
              data-testid="contrasena-provisional"
              className="flex-1 break-all font-mono text-base font-semibold tracking-wide"
            >
              {contrasena}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copiar()}
            >
              {copiada ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t bg-muted/20 px-6 py-4">
          <Button type="button" onClick={alCerrar}>
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
