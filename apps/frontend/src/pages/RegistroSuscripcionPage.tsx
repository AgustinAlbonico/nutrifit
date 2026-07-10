import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, User, CreditCard, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { iniciarRegistroSuscripcion, type RegistroSuscripcionInput } from '@/services/suscripcion.service';

type Step = 'gimnasio' | 'admin';

export function RegistroSuscripcionPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('gimnasio');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gymData, setGymData] = useState({
    nombre: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    telefono: '',
  });
  const [adminData, setAdminData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
  });

  const handleGymSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymData.nombre || !gymData.direccion || !gymData.ciudad || !gymData.provincia) return;
    setStep('admin');
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminData.nombre || !adminData.apellido || !adminData.email || !adminData.telefono || !adminData.password) return;

    setCargando(true);
    setError(null);

    try {
      const payload: RegistroSuscripcionInput = {
        gimnasio: {
          nombre: gymData.nombre,
          direccion: gymData.direccion,
          ciudad: gymData.ciudad || undefined,
          provincia: gymData.provincia || undefined,
          telefono: gymData.telefono || undefined,
        },
        admin: {
          nombre: adminData.nombre,
          apellido: adminData.apellido,
          email: adminData.email,
          telefono: adminData.telefono,
          password: adminData.password,
        },
      };

      const result = await iniciarRegistroSuscripcion(payload);
      navigate({ to: `/suscripcion/${result.subscription.uuid}/pago` });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg rounded-2xl border-border/50 shadow-lg overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />

        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <Building2 className="h-7 w-7 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Registrá tu gimnasio</CardTitle>
          <CardDescription className="text-base">
            Completá los datos para activar tu suscripción mensual
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`flex items-center gap-2 ${step === 'gimnasio' ? 'text-emerald-600' : 'text-emerald-600'}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === 'gimnasio' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'
              }`}>
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">Gimnasio</span>
            </div>
            <div className={`h-px w-12 ${step === 'admin' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            <div className={`flex items-center gap-2 ${step === 'admin' ? 'text-emerald-600' : 'text-slate-400'}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === 'admin' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">Admin</span>
            </div>
            <div className="h-px w-12 bg-slate-300" />
            <div className="flex items-center gap-2 text-slate-400">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium">
                <CreditCard className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">Pago</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 'gimnasio' ? (
            <form onSubmit={handleGymSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del gimnasio *</Label>
                <Input
                  id="nombre"
                  value={gymData.nombre}
                  onChange={(e) => setGymData({ ...gymData, nombre: e.target.value })}
                  placeholder="Ej: FitCenter Rosario"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  value={gymData.direccion}
                  onChange={(e) => setGymData({ ...gymData, direccion: e.target.value })}
                  placeholder="Ej: Av. Siempre Viva 742"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad *</Label>
                  <Input
                    id="ciudad"
                    value={gymData.ciudad}
                    onChange={(e) => setGymData({ ...gymData, ciudad: e.target.value })}
                    placeholder="Ej: Rosario"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia *</Label>
                  <Input
                    id="provincia"
                    value={gymData.provincia}
                    onChange={(e) => setGymData({ ...gymData, provincia: e.target.value })}
                    placeholder="Ej: Santa Fe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={gymData.telefono}
                  onChange={(e) => setGymData({ ...gymData, telefono: e.target.value })}
                  placeholder="+54 341..."
                />
              </div>

              <Button type="submit" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700">
                Continuar
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-nombre">Nombre *</Label>
                  <Input
                    id="admin-nombre"
                    value={adminData.nombre}
                    onChange={(e) => setAdminData({ ...adminData, nombre: e.target.value })}
                    placeholder="Ej: Juan"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-apellido">Apellido *</Label>
                  <Input
                    id="admin-apellido"
                    value={adminData.apellido}
                    onChange={(e) => setAdminData({ ...adminData, apellido: e.target.value })}
                    placeholder="Ej: Pérez"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email">Email *</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  placeholder="admin@ejemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-telefono">Teléfono *</Label>
                <Input
                  id="admin-telefono"
                  type="tel"
                  value={adminData.telefono}
                  onChange={(e) => setAdminData({ ...adminData, telefono: e.target.value })}
                  placeholder="+54 341 1234567"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Contraseña *</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminData.password}
                  onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('gimnasio')}
                  className="flex-1"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={cargando}
                >
                  {cargando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      Ir a pagar
                      <CreditCard className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
