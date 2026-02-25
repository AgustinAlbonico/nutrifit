import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, FileText, Calendar, Users } from 'lucide-react';

interface AccionRapida {
  etiqueta: string;
  icono: React.ReactNode;
  ruta: string;
}

const ACCIONES_NUTRICIONISTA: AccionRapida[] = [
  { etiqueta: 'Crear Plan', icono: <FileText className="h-4 w-4" />, ruta: '/planes' },
  { etiqueta: 'Mi Agenda', icono: <Calendar className="h-4 w-4" />, ruta: '/agenda' },
  { etiqueta: 'Ver Pacientes', icono: <Users className="h-4 w-4" />, ruta: '/pacientes' },
];

export function AccionesRapidasCard() {
  const navigate = useNavigate();

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-orange-500" />
          Acciones Rapidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {ACCIONES_NUTRICIONISTA.map((accion) => (
            <Button
              key={accion.etiqueta}
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
              onClick={() => navigate({ to: accion.ruta })}
            >
              {accion.icono}
              <span className="text-xs">{accion.etiqueta}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
