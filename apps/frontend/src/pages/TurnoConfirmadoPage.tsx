import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Stethoscope,
  User,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest, obtenerUrlFoto } from '@/lib/api';
import { formatearFechaArgentinaCorta } from '@/lib/fechasArgentina';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { ApiResponse } from '@/types/api';

interface DatosTurnoConfirmado {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  socio: {
    idPersona: number;
    nombre: string;
    apellido: string;
    dni: string | null;
    email: string;
    telefono: string | null;
  };
  nutricionista: {
    idPersona: number;
    nombre: string;
    apellido: string;
    matricula: string;
    especialidad: string;
    ciudad: string;
    provincia: string;
    fotoPerfilUrl: string | null;
  };
}

const obtenerIniciales = (nombre: string, apellido: string): string => {
  const n = nombre?.trim().charAt(0).toUpperCase() ?? '';
  const a = apellido?.trim().charAt(0).toUpperCase() ?? '';
  return `${n}${a}` || '?';
};

const formatearFechaLarga = (fechaIso: string): string => {
  const fecha = new Date(`${fechaIso}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return fechaIso;
  return formatearFechaArgentinaCorta(fecha);
};

export function TurnoConfirmadoPage() {
  const { idTurno } = useParams({ strict: false }) as { idTurno: string };
  const { token } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<DatosTurnoConfirmado | null>(null);

  useEffect(() => {
    const cargar = async () => {
      if (!token || !idTurno) return;
      try {
        setCargando(true);
        setError(null);
        const response = await apiRequest<ApiResponse<DatosTurnoConfirmado>>(
          `/turnos/socio/turno/${idTurno}`,
          { token },
        );
        setDatos(response.data);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo cargar la información del turno reservado.';
        setError(message);
      } finally {
        setCargando(false);
      }
    };
    void cargar();
  }, [idTurno, token]);

  if (cargando) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Cargando la información de tu turno...
        </CardContent>
      </Card>
    );
  }

  if (error || !datos) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-8 text-sm text-destructive">
            {error ?? 'No se encontró el turno.'}
          </CardContent>
        </Card>
        <Button asChild variant="outline">
          <Link to="/turnos">
            <ArrowLeft className="h-4 w-4" />
            Volver a mis turnos
          </Link>
        </Button>
      </div>
    );
  }

  const nombreCompletoNutri = `${datos.nutricionista.nombre} ${datos.nutricionista.apellido}`.trim();
  const inicialesNutri = obtenerIniciales(
    datos.nutricionista.nombre,
    datos.nutricionista.apellido,
  );
  const urlFotoNutri = datos.nutricionista.fotoPerfilUrl
    ? obtenerUrlFoto(datos.nutricionista.fotoPerfilUrl)
    : null;

  return (
    <div className="space-y-6 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-8 border border-emerald-500/20 shadow-sm">
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/15 p-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                ¡Turno reservado!
              </h1>
              <p className="mt-1 text-muted-foreground">
                Guardá los datos de la reserva. Si necesitás cambiar algo, podés
                hacerlo desde "Mis turnos".
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Código
            </p>
            <p className="mt-1 text-2xl font-bold">#{datos.idTurno}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Estado
            </p>
            <Badge variant="secondary" className="mt-2">
              {datos.estadoTurno}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Matrícula profesional
            </p>
            <p className="mt-1 text-sm font-mono">
              {datos.nutricionista.matricula || '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Datos del turno
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3 rounded-md border bg-card p-3">
            <Calendar className="mt-0.5 h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Fecha</p>
              <p className="font-medium">{formatearFechaLarga(datos.fechaTurno)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md border bg-card p-3">
            <Clock className="mt-0.5 h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Hora</p>
              <p className="font-medium">{datos.horaTurno} hs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-emerald-600" />
            Profesional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="h-16 w-16">
              {urlFotoNutri ? (
                <AvatarImage src={urlFotoNutri} alt={nombreCompletoNutri} />
              ) : null}
              <AvatarFallback>{inicialesNutri}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-base font-semibold">{nombreCompletoNutri}</p>
              <p className="text-sm text-muted-foreground">
                {datos.nutricionista.especialidad}
              </p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {datos.nutricionista.ciudad}, {datos.nutricionista.provincia}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-emerald-600" />
            Socio
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Nombre y apellido</p>
            <p className="font-medium">
              {datos.socio.nombre} {datos.socio.apellido}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">DNI</p>
            <p className="font-mono">{datos.socio.dni ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium break-all">
              {datos.socio.email || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Teléfono</p>
            <p className="font-medium">{datos.socio.telefono ?? '-'}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button asChild>
          <Link to="/turnos">
            <ArrowLeft className="h-4 w-4" />
            Volver a mis turnos
          </Link>
        </Button>
      </div>
    </div>
  );
}
