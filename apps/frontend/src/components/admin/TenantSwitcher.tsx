import { useEffect, useState } from 'react';
import { Building2, ChevronDown, LogOut, Shield } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function TenantSwitcher() {
  const {
    esSuperadmin,
    listaGimnasios,
    gimnasioActual,
    estaImpersonando,
    impersonarGimnasio,
    salirDeImpersonacion,
    cargarGimnasios,
  } = useAuth();

  const [cargando, establecerCargando] = useState(false);
  const [error, establecerError] = useState<string | null>(null);

  // Cargar lista de gimnasios al montar si es SUPERADMIN
  useEffect(() => {
    if (esSuperadmin && listaGimnasios.length === 0) {
      cargarGimnasios();
    }
  }, [esSuperadmin, listaGimnasios.length, cargarGimnasios]);

  // No renderizar si no es SUPERADMIN
  if (!esSuperadmin) {
    return null;
  }

  const manejarImpersonacion = async (gimnasioId: number) => {
    establecerCargando(true);
    establecerError(null);

    try {
      await impersonarGimnasio(gimnasioId);
    } catch (err) {
      const mensajeError =
        err instanceof Error ? err.message : 'Error al impersonar gimnasio';
      establecerError(mensajeError);
    } finally {
      establecerCargando(false);
    }
  };

  const manejarSalidaImpersonacion = async () => {
    establecerCargando(true);
    establecerError(null);

    try {
      await salirDeImpersonacion();
    } catch (err) {
      const mensajeError =
        err instanceof Error
          ? err.message
          : 'Error al salir de impersonación';
      establecerError(mensajeError);
    } finally {
      establecerCargando(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-destructive animate-in fade-in-50">
          {error}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'flex items-center gap-2 h-8 px-3 transition-all duration-200',
              estaImpersonando &&
                'border-primary/50 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary',
            )}
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {gimnasioActual?.nombre ?? 'Seleccionar gimnasio'}
            </span>
            {!gimnasioActual && (
              <span className="hidden sm:inline text-muted-foreground">
                Gimnasios
              </span>
            )}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Modo SUPERADMIN</span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {listaGimnasios.length === 0 ? (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
              {cargando ? 'Cargando gimnasios...' : 'No hay gimnasios disponibles'}
            </div>
          ) : (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2">
                Seleccioná un gimnasio para impersonar
              </DropdownMenuLabel>

              {listaGimnasios.map((gimnasio) => (
                <DropdownMenuItem
                  key={gimnasio.id}
                  onClick={() => manejarImpersonacion(gimnasio.id)}
                  disabled={cargando}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-semibold',
                      !gimnasio.activo && 'opacity-50',
                    )}
                  >
                    {gimnasio.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {gimnasio.nombre}
                    </span>
                    {!gimnasio.activo && (
                      <Badge variant="secondary" className="w-fit text-[10px] h-4">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}

          {estaImpersonando && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={manejarSalidaImpersonacion}
                disabled={cargando}
                className="flex items-center gap-2 cursor-pointer text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span>Salir de impersonación</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}