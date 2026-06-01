import { Building2, X } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

/**
 * Indicador visual de impersonación activa.
 * Muestra un banner superior cuando un SUPERADMIN está impersonando
 * un gimnasio específico.
 */
export function ImpersonationIndicator() {
  const { estaImpersonando, gimnasioActual, salirDeImpersonacion } = useAuth();

  if (!estaImpersonando || !gimnasioActual) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-foreground">
            Modo Impersonación
          </p>
          <p className="text-xs text-muted-foreground">
            Operando como{' '}
            <span className="font-medium text-primary">
              {gimnasioActual.nombre}
            </span>
          </p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={salirDeImpersonacion}
        className="h-7 px-2 text-xs gap-1.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <X className="h-3 w-3" />
        <span>Salir</span>
      </Button>
    </div>
  );
}