import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  User,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { crearGimnasio } from '@/services/gimnasio.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

// Step 1: Basic data schema
const paso1Schema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(200),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});

// Step 2: Admin user schema
const paso2Schema = z.object({
  adminNombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  adminEmail: z.string().email('Email inválido'),
  adminContrasena: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(50),
  adminConfirmarContrasena: z.string(),
}).refine((data) => data.adminContrasena === data.adminConfirmarContrasena, {
  message: 'Las contraseñas no coinciden',
  path: ['adminConfirmarContrasena'],
});

type Paso1FormData = z.infer<typeof paso1Schema>;
type Paso2FormData = z.infer<typeof paso2Schema>;

interface ResumenData {
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
  adminNombre: string;
  adminEmail: string;
}

const STEPS = [
  { number: 1, label: 'Datos básicos', icon: Building2 },
  { number: 2, label: 'Admin del gimnasio', icon: User },
  { number: 3, label: 'Confirmación', icon: CheckCircle2 },
];

export function GimnasioWizardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [pasoActual, setPasoActual] = useState(1);
  const [resumen, setResumen] = useState<ResumenData>({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    adminNombre: '',
    adminEmail: '',
  });

  // Form for step 1
  const paso1Form = useForm<Paso1FormData>({
    resolver: zodResolver(paso1Schema),
    defaultValues: {
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
    },
  });

  // Form for step 2
  const paso2Form = useForm<Paso2FormData>({
    resolver: zodResolver(paso2Schema),
    defaultValues: {
      adminNombre: '',
      adminEmail: '',
      adminContrasena: '',
      adminConfirmarContrasena: '',
    },
  });

  const mutationCrear = useMutation({
    mutationFn: (data: { gimnasio: { nombre: string; direccion: string; telefono?: string; email?: string }; admin: { nombre: string; email: string; contrasena: string } }) =>
      crearGimnasio(
        {
          nombre: data.gimnasio.nombre,
          direccion: data.gimnasio.direccion,
          telefono: data.gimnasio.telefono,
          email: data.gimnasio.email || undefined,
          admin: {
            nombre: data.admin.nombre,
            email: data.admin.email,
            contrasena: data.admin.contrasena,
          },
        },
        token!,
      ),
    onSuccess: (gimnasio) => {
      toast.success(`Gimnasio "${gimnasio.nombre}" creado exitosamente`);
      navigate({ to: '/admin/gimnasios' });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo crear el gimnasio');
    },
  });

  const handlePaso1Next = paso1Form.handleSubmit((data) => {
    setResumen((prev) => ({
      ...prev,
      nombre: data.nombre,
      direccion: data.direccion,
      telefono: data.telefono,
      email: data.email,
    }));
    setPasoActual(2);
  });

  const handlePaso2Next = paso2Form.handleSubmit((data) => {
    setResumen((prev) => ({
      ...prev,
      adminNombre: data.adminNombre,
      adminEmail: data.adminEmail,
    }));
    setPasoActual(3);
  });

const handleConfirm = () => {
    if (!resumen) return;
    const adminContrasena = paso2Form.getValues('adminContrasena');
    mutationCrear.mutate({
      gimnasio: {
        nombre: resumen.nombre,
        direccion: resumen.direccion,
        telefono: resumen.telefono,
        email: resumen.email,
      },
      admin: {
        nombre: resumen.adminNombre,
        email: resumen.adminEmail,
        contrasena: adminContrasena,
      },
    });
  };

  const handleBack = () => {
    if (pasoActual === 1) {
      navigate({ to: '/admin/gimnasios' });
    } else {
      setPasoActual((prev) => prev - 1);
    }
  };

  const progressPercent = ((pasoActual - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Nuevo Gimnasio
          </h1>
          <p className="text-sm text-muted-foreground">
            Creá un nuevo gimnasio y su administrador
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {STEPS.map((step) => {
            const isActive = step.number === pasoActual;
            const isCompleted = step.number < pasoActual;
            return (
              <div key={step.number} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isActive
                        ? 'border-primary text-primary'
                        : 'border-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {pasoActual === 1 && 'Datos básicos del gimnasio'}
            {pasoActual === 2 && 'Admin del gimnasio'}
            {pasoActual === 3 && 'Confirmar creación'}
          </CardTitle>
          <CardDescription>
            {pasoActual === 1 && 'Ingresá la información principal del gimnasio'}
            {pasoActual === 2 && 'Creá el usuario administrador para este gimnasio'}
            {pasoActual === 3 && 'Revisá los datos antes de crear el gimnasio'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic data */}
          {pasoActual === 1 && (
            <form onSubmit={handlePaso1Next} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del gimnasio *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Gym Central"
                  {...paso1Form.register('nombre')}
                  aria-invalid={!!paso1Form.formState.errors.nombre}
                />
                {paso1Form.formState.errors.nombre && (
                  <p className="text-sm text-destructive">
                    {paso1Form.formState.errors.nombre.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  placeholder="Ej: Av. Rivadavia 1234, CABA"
                  {...paso1Form.register('direccion')}
                  aria-invalid={!!paso1Form.formState.errors.direccion}
                />
                {paso1Form.formState.errors.direccion && (
                  <p className="text-sm text-destructive">
                    {paso1Form.formState.errors.direccion.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  placeholder="Ej: +54 11 1234-5678"
                  {...paso1Form.register('telefono')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email de contacto</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ej: contacto@gymcentral.com"
                  {...paso1Form.register('email')}
                  aria-invalid={!!paso1Form.formState.errors.email}
                />
                {paso1Form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {paso1Form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <Button type="submit">
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: Admin user */}
          {pasoActual === 2 && (
            <form onSubmit={handlePaso2Next} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminNombre">Nombre del administrador *</Label>
                <Input
                  id="adminNombre"
                  placeholder="Ej: Juan Pérez"
                  {...paso2Form.register('adminNombre')}
                  aria-invalid={!!paso2Form.formState.errors.adminNombre}
                />
                {paso2Form.formState.errors.adminNombre && (
                  <p className="text-sm text-destructive">
                    {paso2Form.formState.errors.adminNombre.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email del administrador *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="Ej: admin@gymcentral.com"
                  {...paso2Form.register('adminEmail')}
                  aria-invalid={!!paso2Form.formState.errors.adminEmail}
                />
                {paso2Form.formState.errors.adminEmail && (
                  <p className="text-sm text-destructive">
                    {paso2Form.formState.errors.adminEmail.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminContrasena">Contraseña *</Label>
                <Input
                  id="adminContrasena"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  {...paso2Form.register('adminContrasena')}
                  aria-invalid={!!paso2Form.formState.errors.adminContrasena}
                />
                {paso2Form.formState.errors.adminContrasena && (
                  <p className="text-sm text-destructive">
                    {paso2Form.formState.errors.adminContrasena.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminConfirmarContrasena">Confirmar contraseña *</Label>
                <Input
                  id="adminConfirmarContrasena"
                  type="password"
                  placeholder="Repetí la contraseña"
                  {...paso2Form.register('adminConfirmarContrasena')}
                  aria-invalid={!!paso2Form.formState.errors.adminConfirmarContrasena}
                />
                {paso2Form.formState.errors.adminConfirmarContrasena && (
                  <p className="text-sm text-destructive">
                    {paso2Form.formState.errors.adminConfirmarContrasena.message}
                  </p>
                )}
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Atrás
                </Button>
                <Button type="submit">
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Confirmation */}
          {pasoActual === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                    Datos del gimnasio
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre</p>
                      <p className="font-medium">{resumen.nombre}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dirección</p>
                      <p className="font-medium">{resumen.direccion}</p>
                    </div>
                    {resumen.telefono && (
                      <div>
                        <p className="text-xs text-muted-foreground">Teléfono</p>
                        <p className="font-medium">{resumen.telefono}</p>
                      </div>
                    )}
                    {resumen.email && (
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{resumen.email}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                    Admin del gimnasio
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre</p>
                      <p className="font-medium">{resumen.adminNombre}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{resumen.adminEmail}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={mutationCrear.isPending}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={mutationCrear.isPending}
                >
                  {mutationCrear.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Crear Gimnasio
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}