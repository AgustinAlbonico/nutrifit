import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PropiedadesEstadoError {
  mensaje?: string;
  alReintentar?: () => void;
  reintentando?: boolean;
}

export function EstadoErrorCard({
  mensaje = 'No pudimos cargar la informacion. Intenta nuevamente.',
  alReintentar,
  reintentando = false,
}: PropiedadesEstadoError) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-8 text-center"
      role="alert"
      aria-live="polite"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <p className="max-w-xs text-sm text-muted-foreground">{mensaje}</p>
      {alReintentar && (
        <Button
          variant="outline"
          size="sm"
          onClick={alReintentar}
          disabled={reintentando}
          className="mt-1"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${reintentando ? 'animate-spin' : ''}`}
          />
          {reintentando ? 'Reintentando...' : 'Reintentar'}
        </Button>
      )}
    </div>
  );
}
