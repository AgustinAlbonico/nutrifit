import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Calendar, FileText, Camera } from 'lucide-react';

type RutaAccionSocio = '/turnos/agendar' | '/mi-plan' | '/mi-progreso';

const ACCIONES_SOCIO = [
  {
    etiqueta: 'Reservar Turno',
    descripcion: 'Elegí día y horario con tu nutricionista.',
    icono: Calendar,
    ruta: '/turnos/agendar',
  },
  {
    etiqueta: 'Ver Mi Plan',
    descripcion: 'Consultá comidas, porciones y calorías.',
    icono: FileText,
    ruta: '/mi-plan',
  },
  {
    etiqueta: 'Subir Avance',
    descripcion: 'Registrá fotos y evolución para tu consulta.',
    icono: Camera,
    ruta: '/mi-progreso',
  },
] satisfies Array<{
  etiqueta: string;
  descripcion: string;
  icono: typeof Calendar;
  ruta: RutaAccionSocio;
}>;

export function AccionesRapidasSocioCard() {
  const navigate = useNavigate();

  return (
    <Card className="rounded-2xl border-orange-100 bg-gradient-to-r from-orange-50 to-rose-50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-orange-500" />
          Acciones rápidas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tres atajos para mantener tu seguimiento al día.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          {ACCIONES_SOCIO.map((accion) => (
            <Button
              key={accion.etiqueta}
              variant="outline"
              className="h-auto justify-start gap-3 rounded-xl border-orange-100 bg-white/90 p-4 text-left hover:bg-orange-50"
              onClick={() => navigate({ to: accion.ruta })}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <accion.icono className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{accion.etiqueta}</span>
                <span className="mt-1 block whitespace-normal text-xs leading-5 text-muted-foreground">
                  {accion.descripcion}
                </span>
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
