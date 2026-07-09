import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerEstadoSuscripcion, type EstadoSuscripcionOutput } from '@/services/suscripcion.service';

const MAPA_ESTADOS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  pendiente: { label: 'Pendiente', variant: 'secondary', color: 'text-amber-600' },
  activa: { label: 'Activa', variant: 'default', color: 'text-emerald-600' },
  cancelada: { label: 'Cancelada', variant: 'destructive', color: 'text-red-600' },
};

export function SuscripcionStatusCard() {
  const { gimnasioId, token } = useAuth();
  const [suscripcion, setSuscripcion] = useState<EstadoSuscripcionOutput | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!gimnasioId || !token) {
      setCargando(false);
      return;
    }

    obtenerEstadoSuscripcion(gimnasioId, token).then((data) => {
      setSuscripcion(data);
      setCargando(false);
    });
  }, [gimnasioId, token]);

  if (cargando) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!suscripcion) return null;

  const estadoInfo = MAPA_ESTADOS[suscripcion.estado] ?? MAPA_ESTADOS.pendiente;
  const Icono = suscripcion.estado === 'activa'
    ? CheckCircle
    : suscripcion.estado === 'cancelada'
    ? XCircle
    : Clock;

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
      <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-emerald-500" />
          Suscripción
        </CardTitle>
        <Badge variant={estadoInfo.variant} className="text-xs">
          {estadoInfo.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <Icono className={`h-5 w-5 ${estadoInfo.color}`} />
          <span className="text-2xl font-bold ${estadoInfo.color}">
            ${Number(suscripcion.monto).toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">/mes</span>
        </div>
        {suscripcion.fechaProximoPago && (
          <p className="text-xs text-muted-foreground">
            Próximo pago: {new Date(suscripcion.fechaProximoPago).toLocaleDateString('es-AR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
