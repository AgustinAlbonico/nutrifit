import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, Mail, Phone, MapPin, Award, Clock, DollarSign, Calendar, UserCircle } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface HorarioProfesional {
  dia: string;
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;
}

interface PerfilNutricionista {
  idPersona: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  ciudad: string;
  provincia: string;
  añosExperiencia: number;
  tarifaSesion: number;
  matricula: string;
  email: string;
  telefono: string;
  direccion: string;
  genero: string;
  biografia: string | null;
  calificacionPromedio: number | null;
  totalOpiniones: number;
  horarios: HorarioProfesional[];
}

const DIAS_ORDENADOS: Record<string, number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  DOMINGO: 7,
};

const DIAS_TRADUCIDOS: Record<string, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

export function PerfilNutricionista() {
  const { token, rol } = useAuth();
  const params = useParams({ strict: false }) as { id?: string };
  const id = params?.id;

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<PerfilNutricionista | null>(null);

  useEffect(() => {
    if (!token || !id) {
      setCargando(false);
      return;
    }

    const cargarPerfil = async () => {
      try {
        setCargando(true);
        setError(null);

        const response = await apiRequest<ApiResponse<PerfilNutricionista>>(
          `/profesional/publico/${id}/perfil`,
          { token },
        );

        setPerfil(response.data);
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'No se pudo cargar el perfil';
        setError(mensaje);
      } finally {
        setCargando(false);
      }
    };

    void cargarPerfil();
  }, [token, id]);

  const horariosOrdenados = perfil?.horarios
    ? [...perfil.horarios].sort(
        (a, b) => (DIAS_ORDENADOS[a.dia] ?? 99) - (DIAS_ORDENADOS[b.dia] ?? 99),
      )
    : [];

  if (rol !== 'SOCIO' && rol !== 'ADMIN') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
        </CardHeader>
        <CardContent>Esta pantalla solo está disponible para socios.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/turnos/agendar">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <UserCircle className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              Perfil del Nutricionista
            </h1>
          </div>
          <p className="text-muted-foreground">
            Información profesional y horarios de atención.
          </p>
        </div>
      </div>

      {cargando ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Cargando perfil del profesional...
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-destructive">{error}</CardContent>
        </Card>
      ) : perfil ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Información principal */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {perfil.nombre} {perfil.apellido}
                  </CardTitle>
                  <p className="text-muted-foreground">{perfil.especialidad}</p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  <DollarSign className="mr-1 h-4 w-4" />$
                  {perfil.tarifaSesion.toLocaleString('es-AR')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Datos de contacto */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{perfil.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">{perfil.telefono}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:col-span-2">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Ubicación</p>
                    <p className="text-sm text-muted-foreground">
                      {perfil.direccion}, {perfil.ciudad}, {perfil.provincia}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información profesional */}
              <div className="border-t pt-4">
                <h3 className="mb-3 font-semibold">Información profesional</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span className="text-xs">Matrícula</span>
                    </div>
                    <p className="mt-1 font-medium">{perfil.matricula}</p>
                  </div>

                  <div className="rounded-md border p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Experiencia</span>
                    </div>
                    <p className="mt-1 font-medium">{perfil.añosExperiencia} años</p>
                  </div>

                  <div className="rounded-md border p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">Género</span>
                    </div>
                    <p className="mt-1 font-medium capitalize">
                      {perfil.genero.toLowerCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Biografía */}
              {perfil.biografia && (
                <div className="border-t pt-4">
                  <h3 className="mb-2 font-semibold">Acerca de</h3>
                  <p className="text-sm text-muted-foreground">{perfil.biografia}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Horarios de atención */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Horarios de atención</CardTitle>
            </CardHeader>
            <CardContent>
              {horariosOrdenados.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay horarios configurados.
                </p>
              ) : (
                <div className="space-y-3">
                  {horariosOrdenados.map((horario, index) => (
                    <div
                      key={`${horario.dia}-${index}`}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <span className="font-medium">
                        {DIAS_TRADUCIDOS[horario.dia] ?? horario.dia}
                      </span>
                      <div className="text-right text-sm">
                        <p className="font-medium">
                          {horario.horaInicio} - {horario.horaFin}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Turnos de {horario.duracionTurno} min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
