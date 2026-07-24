import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FormularioAltaSocio } from '@/components/socios/FormularioAltaSocio';

export function AltaSocioPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/socios' })}
          aria-label="Volver al listado de socios"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registrar socio</h1>
          <p className="text-sm text-muted-foreground">
            Alta de un nuevo paciente en el gimnasio.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Datos del nuevo socio
          </CardTitle>
          <CardDescription>
            Al guardar, el socio se asocia a tu gimnasio y queda disponible
            para asignarle turnos y abrir planes con el nutricionista.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioAltaSocio onCancel={() => navigate({ to: '/socios' })} />
        </CardContent>
      </Card>
    </div>
  );
}
