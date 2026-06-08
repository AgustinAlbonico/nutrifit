import { useState, type FormEvent } from 'react';
import { Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface CambiarContrasenaRespuesta {
  success: boolean;
  data: { mensaje: string };
}

function validarNuevaContrasena(contrasena: string): boolean {
  return (
    contrasena.length >= 8 &&
    /[A-Z]/.test(contrasena) &&
    /[a-z]/.test(contrasena) &&
    /\d/.test(contrasena) &&
    /[^A-Za-z0-9]/.test(contrasena)
  );
}

export function Configuracion() {
  const { token } = useAuth();
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const manejarSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!contrasenaActual.trim()) {
      setError('Ingresá tu contraseña actual.');
      return;
    }

    if (!validarNuevaContrasena(nuevaContrasena)) {
      setError('La nueva contraseña no cumple los requisitos mínimos.');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setGuardando(true);
      const response = await apiRequest<CambiarContrasenaRespuesta>(
        '/auth/cambiar-contrasena',
        {
          method: 'PUT',
          token,
          body: {
            contrasenaActual,
            nuevaContrasena,
          },
        },
      );

      toast.success(response.data.mensaje);
      setContrasenaActual('');
      setNuevaContrasena('');
      setConfirmarContrasena('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cambio.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
              <Settings className="h-8 w-8 text-orange-500" />
              Configuración
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl text-base">
              Preferencias y seguridad de la cuenta.
            </p>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="contrasenaActual">Contraseña actual</Label>
              <Input
                id="contrasenaActual"
                type="password"
                value={contrasenaActual}
                onChange={(event) => setContrasenaActual(event.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nuevaContrasena">Nueva contraseña</Label>
              <Input
                id="nuevaContrasena"
                type="password"
                value={nuevaContrasena}
                onChange={(event) => setNuevaContrasena(event.target.value)}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarContrasena">Confirmar nueva contraseña</Label>
              <Input
                id="confirmarContrasena"
                type="password"
                value={confirmarContrasena}
                onChange={(event) => setConfirmarContrasena(event.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
