import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function RecuperarContrasenaConfirmacion() {
  const navigate = useNavigate();
  // Obtener el token de la query string (por ejemplo: ?token=xyz)
  const searchParams = useSearch({ from: '/recuperar-contrasena' }) as { token?: string };
  const token = searchParams.token;

  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Token de recuperación no válido o inexistente');
    }
  }, [token]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      toast.error('Falta el token de recuperación');
      return;
    }

    if (nuevaContrasena.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);
    try {
      await apiRequest<{ mensaje: string }>('/auth/confirmar-recuperacion', {
        method: 'POST',
        body: { token, nuevaContrasena },
      });
      setExito(true);
      toast.success('Contraseña restablecida correctamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo restablecer la contraseña';
      toast.error(errorMessage);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md border-border bg-card shadow-lg relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl"></div>

        <CardHeader className="space-y-2 relative z-10">
          <CardTitle className="text-2xl font-bold text-center font-outfit">Nueva contraseña</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {exito 
              ? 'Cambio completado' 
              : 'Ingresá tu nueva clave para actualizar tu cuenta'}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          {!token ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
              <AlertTriangle className="h-16 w-16 text-rose-500 animate-pulse" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                El enlace de recuperación es inválido o no contiene un token válido. Volvé a solicitar un enlace.
              </p>
              <Button 
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => navigate({ to: '/solicitar-recuperacion' })}
              >
                Solicitar nuevo enlace
              </Button>
            </div>
          ) : exito ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                ¡Tu contraseña fue restablecida con éxito! Ya podés iniciar sesión normalmente.
              </p>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all"
                onClick={() => navigate({ to: '/login' })}
              >
                Ir a Iniciar Sesión
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2 relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nueva contraseña"
                  type={verContrasena ? 'text' : 'password'}
                  value={nuevaContrasena}
                  onChange={(event) => setNuevaContrasena(event.target.value)}
                  required
                  className="pl-9 pr-10 h-10 border-input bg-background"
                  disabled={cargando}
                />
                <button
                  type="button"
                  onClick={() => setVerContrasena(!verContrasena)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {verContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="space-y-2 relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Confirmar nueva contraseña"
                  type={verContrasena ? 'text' : 'password'}
                  value={confirmarContrasena}
                  onChange={(event) => setConfirmarContrasena(event.target.value)}
                  required
                  className="pl-9 pr-10 h-10 border-input bg-background"
                  disabled={cargando}
                />
              </div>

              <Button 
                className="w-full h-10 font-semibold bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all" 
                type="submit"
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando contraseña...
                  </>
                ) : (
                  'Restablecer contraseña'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
