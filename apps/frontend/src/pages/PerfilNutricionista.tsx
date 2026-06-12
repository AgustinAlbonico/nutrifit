import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  Award,
  Calendar,
  DollarSign,
  GraduationCap,
  MapPin,
  UserCircle,
  Clock,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest, obtenerUrlFoto } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import { CalendarioEmbed } from '@/components/catalogo/CalendarioEmbed';
import type { SlotDisponible } from '@/components/catalogo/CalendarioEmbed';
import type { ApiResponse } from '@/types/api';



interface HorarioProfesional {
  dia: string;
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;
}

interface FormacionProfesional {
  titulo: string;
  institucion: string;
  anio: number;
}

interface PerfilNutricionista {
  idPersona: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  ciudad: string;
  provincia: string;
  aniosExperiencia: number;
  tarifaSesion: number;
  matricula: string;
  presentacion: string | null;
  certificaciones: string | null;
  fotoUrl: string | null;
  duracionTurnoMin: number;
  formacionAcademica: FormacionProfesional[];
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

function obtenerIniciales(nombre: string, apellido: string): string {
  const inicialN = nombre.trim().charAt(0).toUpperCase();
  const inicialA = apellido.trim().charAt(0).toUpperCase();
  return `${inicialN}${inicialA}`;
}

function formatearTarifa(tarifa: number): { texto: string; esGratis: boolean } {
  if (tarifa <= 0) {
    return { texto: 'A convenir', esGratis: true };
  }
  return {
    texto: `$${tarifa.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    esGratis: false,
  };
}

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
        const mensaje =
          err instanceof Error ? err.message : 'No se pudo cargar el perfil';
        setError(mensaje);
      } finally {
        setCargando(false);
      }
    };

    void cargarPerfil();
  }, [token, id]);

  const handleSlotSelect = (slot: SlotDisponible) => {
    // Por ahora solo log; se integrará con el flujo de reserva
    if (!perfil) return;
    const url = `/turnos/agendar?nutricionistaId=${perfil.idPersona}&fechaHora=${encodeURIComponent(slot.fechaHora)}`;
    window.location.href = url;
  };

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
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/nutricionistas/catalogo">
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Link>
        </Button>
      </div>

      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-orange-500/30 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-orange-500" />
            <h1 className="bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-3xl font-bold text-transparent">
              Perfil del Nutricionista
            </h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Información profesional, formación y disponibilidad.
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
          <CardContent className="py-10 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : perfil ? (
        <div className="space-y-6">
          {/* Header del perfil con foto y sticky button */}
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <Card>
              <CardContent className="flex flex-col gap-6 pt-6 sm:flex-row sm:items-start">
                <Avatar className="size-[200px] shrink-0 ring-2 ring-border/60">
                  {perfil.fotoUrl && (
                    <AvatarImage
                      src={obtenerUrlFoto(perfil.fotoUrl) ?? undefined}
                      alt={`${perfil.nombre} ${perfil.apellido}`}
                      className="object-cover object-center"
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-4xl font-medium text-primary">
                    {obtenerIniciales(perfil.nombre, perfil.apellido)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {perfil.nombre} {perfil.apellido}
                    </h2>
                    <p className="text-muted-foreground">{perfil.especialidad}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Award className="h-3 w-3" />
                      Mat. {perfil.matricula}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {perfil.aniosExperiencia} años de experiencia
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {perfil.ciudad}, {perfil.provincia}
                    </Badge>
                  </div>

                  {(() => {
                    const tarifa = formatearTarifa(perfil.tarifaSesion);
                    return (
                      <Badge
                        variant={tarifa.esGratis ? 'outline' : 'default'}
                        className={`gap-1 ${tarifa.esGratis ? 'text-muted-foreground' : 'text-base'}`}
                      >
                        <DollarSign className="h-4 w-4" />
                        {tarifa.texto}
                      </Badge>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Sticky button "Reservar turno" */}
            <div className="lg:sticky lg:top-4 lg:self-start">
              <Button
                asChild
                size="lg"
                className="w-full lg:w-auto"
              >
                <Link
                  to="/turnos/agendar"
                  search={{ nutricionistaId: perfil.idPersona }}
                >
                  <Calendar className="h-5 w-5" />
                  Reservar turno
                </Link>
              </Button>
            </div>
          </div>

          {/* Sobre el profesional */}
          {perfil.presentacion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sobre el profesional</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {perfil.presentacion}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Certificaciones */}
          {perfil.certificaciones && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Certificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {perfil.certificaciones}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Formación académica */}
          {perfil.formacionAcademica.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5 text-orange-500" />
                  Formación académica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {perfil.formacionAcademica.map((formacion, idx) => (
                    <div
                      key={`${formacion.titulo}-${idx}`}
                      className="rounded-md border p-3"
                    >
                      <p className="font-medium">{formacion.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formacion.institucion} · {formacion.anio}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Horarios semanales */}
          {perfil.horarios.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Horarios de atención
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[...perfil.horarios]
                    .sort(
                      (a, b) =>
                        (DIAS_ORDENADOS[a.dia] ?? 99) -
                        (DIAS_ORDENADOS[b.dia] ?? 99),
                    )
                    .map((horario, index) => (
                      <div
                        key={`${horario.dia}-${index}`}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <span className="font-medium">
                          {DIAS_TRADUCIDOS[horario.dia] ?? horario.dia}
                        </span>
                        <div className="text-right text-sm">
                          <p className="font-medium">
                            {horario.horaInicio.slice(0, 5)} - {horario.horaFin.slice(0, 5)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Turnos de {horario.duracionTurno} min
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendario embebido para reservar slots */}
          <CalendarioEmbed
            nutricionistaId={perfil.idPersona}
            duracionMin={perfil.duracionTurnoMin}
            onSeleccionarSlot={handleSlotSelect}
          />
        </div>
      ) : null}
    </div>
  );
}
