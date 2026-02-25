import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, UserPlus, CalendarPlus, CheckCircle } from 'lucide-react';

const ACCIONES_RECEPCION = [
  { etiqueta: 'Registrar Paciente', icono: UserPlus, ruta: '/socios/nuevo' },
  { etiqueta: 'Asignar Turno', icono: CalendarPlus, ruta: '/turnos/nuevo' },
  { etiqueta: 'Check-in Manual', icono: CheckCircle, ruta: '/recepcion/turnos' },
];

export function AccionesRapidasRecepcionCard() {
  const navigate = useNavigate();

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-orange-500" />
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {ACCIONES_RECEPCION.map((accion) => (
            <Button
              key={accion.etiqueta}
              variant="outline"
              className="flex flex-col h-auto py-4 gap-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
              onClick={() => navigate({ to: accion.ruta })}
            >
              <accion.icono className="h-5 w-5 text-orange-500" />
              <span className="text-xs">{accion.etiqueta}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
