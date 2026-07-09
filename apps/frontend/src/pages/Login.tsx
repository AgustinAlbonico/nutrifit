import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Solo redirigir si ya está autenticado y NO estamos en login
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard', replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await login(email, password);
      toast.success('Login exitoso');
      navigate({ to: '/dashboard', replace: true });
    } catch (loginError) {
      const loginErrorMessage =
        loginError instanceof Error ? loginError.message : 'No se pudo iniciar sesión';
      toast.error(loginErrorMessage);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 px-4">
      <div className="mb-6 flex flex-col items-center animate-fade-in">
        <img
          src="/logo-completo.png"
          alt="NutriFit Supervisor Logo"
          className="h-16 object-contain"
        />
      </div>
      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Iniciar sesión</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Panel de control administrativo
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onLogin}>
            <div className="space-y-2">
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Contraseña"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-10"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate({ to: '/solicitar-recuperacion' })}
                  className="text-xs text-primary hover:text-primary/80 hover:underline cursor-pointer transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>
            <Button className="w-full h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" type="submit">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
