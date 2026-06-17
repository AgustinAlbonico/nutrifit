import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ApiResponse } from '@/types/api';

export function CambiarContrasenaObligatorio() {
  const { token, marcarContrasenaEstablecida } = useAuth();
  const navigate = useNavigate();

  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (nuevaContrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!/[A-Z]/.test(nuevaContrasena)) {
      setError('Debe contener al menos una letra mayúscula.');
      return;
    }

    if (!/[a-z]/.test(nuevaContrasena)) {
      setError('Debe contener al menos una letra minúscula.');
      return;
    }

    if (!/\d/.test(nuevaContrasena)) {
      setError('Debe contener al menos un número.');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(nuevaContrasena)) {
      setError('Debe contener al menos un símbolo especial.');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setGuardando(true);
      await apiRequest<ApiResponse<{ mensaje: string }>>(
        '/auth/establecer-contrasena',
        {
          method: 'PUT',
          token: token ?? undefined,
          body: { nuevaContrasena },
        },
      );

      marcarContrasenaEstablecida();
      toast.success('Contraseña establecida correctamente.');
      navigate({ to: '/dashboard', replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al establecer la contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Configurar contraseña</CardTitle>
          <CardDescription>
            Es la primera vez que iniciás sesión. Por seguridad, necesitás establecer una
            contraseña nueva antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nueva-contrasena" className="text-sm font-medium">
                Nueva contraseña
              </label>
              <div className="relative">
                <Input
                  id="nueva-contrasena"
                  type={mostrarNueva ? 'text' : 'password'}
                  placeholder="Mín. 8 caracteres, mayúscula, minúscula, número y símbolo"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  disabled={guardando}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setMostrarNueva(!mostrarNueva)}
                  tabIndex={-1}
                >
                  {mostrarNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmar-contrasena" className="text-sm font-medium">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Input
                  id="confirmar-contrasena"
                  type={mostrarConfirmar ? 'text' : 'password'}
                  placeholder="Repetí la contraseña nueva"
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  disabled={guardando}
                  required
                  minLength={8}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  tabIndex={-1}
                >
                  {mostrarConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={guardando || !nuevaContrasena || !confirmarContrasena}
            >
              {guardando ? 'Guardando...' : 'Establecer contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
