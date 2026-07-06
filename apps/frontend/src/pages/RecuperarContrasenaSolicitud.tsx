import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function RecuperarContrasenaSolicitud() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;

    setCargando(true);
    try {
      await apiRequest<{ mensaje: string }>('/auth/solicitar-recuperacion', {
        method: 'POST',
        body: { email },
      });
      setEnviado(true);
      toast.success('Solicitud enviada correctamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo enviar el correo';
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
          <CardTitle className="text-2xl font-bold text-center">Recuperar contraseña</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {enviado 
              ? 'Revisá tu bandeja de entrada' 
              : 'Ingresá tu correo electrónico para recibir un enlace de recuperación'}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          {enviado ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Si el correo <strong>{email}</strong> está registrado, vas a recibir un email con los pasos para restablecer tu clave en los próximos minutos.
              </p>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate({ to: '/login' })}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Login
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2 relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="pl-9 h-10 border-input bg-background"
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
                    Enviando email...
                  </>
                ) : (
                  'Enviar enlace de recuperación'
                )}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full h-10 text-xs text-muted-foreground hover:text-foreground"
                type="button"
                onClick={() => navigate({ to: '/login' })}
                disabled={cargando}
              >
                <ArrowLeft className="mr-2 h-3 w-3" /> Volver al Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
