import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Calendar, FileText, Camera } from 'lucide-react';

const ACCIONES_SOCIO = [
  { etiqueta: 'Reservar Turno', icono: Calendar, ruta: '/reservar' },
  { etiqueta: 'Ver Mi Plan', icono: FileText, ruta: '/planes' },
  { etiqueta: 'Subir Foto', icono: Camera, ruta: '/progreso' },
];

export function AccionesRapidasSocioCard() {
  const navigate = useNavigate();

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm bg-gradient-to-r from-orange-50 to-rose-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-orange-500" />
          Acciones Rapidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {ACCIONES_SOCIO.map((accion) => (
            <Button
              key={accion.etiqueta}
              variant="outline"
              className="flex flex-col h-auto py-4 gap-2 bg-white hover:bg-orange-50"
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
