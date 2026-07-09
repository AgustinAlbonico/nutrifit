import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import {
  obtenerSuscripcionPorUuid,
  procesarPagoSimulado,
  type SuscripcionConGymOutput,
} from '@/services/suscripcion.service';

const MAPA_ESTADOS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendiente: { label: 'Pendiente', variant: 'secondary' },
  activa: { label: 'Activa', variant: 'default' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
};

export function PagoSimuladoPage() {
  const { uuid } = useParams({ from: '/suscripcion/$uuid/pago' });
  const navigate = useNavigate();
  const [suscripcion, setSuscripcion] = useState<SuscripcionConGymOutput | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        const data = await obtenerSuscripcionPorUuid(uuid);
        setSuscripcion(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [uuid]);

  const handlePago = async (accion: 'aprobar' | 'rechazar') => {
    setProcesando(true);
    setError(null);
    try {
      const res = await procesarPagoSimulado(uuid, accion);
      setResultado(res.mensaje);
      if (accion === 'aprobar' && res.estadoSuscripcion === 'activa') {
        setSuscripcion((prev) => prev ? { ...prev, estado: 'activa' } : prev);
      } else if (accion === 'rechazar') {
        setSuscripcion((prev) => prev ? { ...prev, estado: 'cancelada' } : prev);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar pago');
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error && !suscripcion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const estadoInfo = MAPA_ESTADOS[suscripcion?.estado ?? ''] ?? MAPA_ESTADOS.pendiente;
  const pagoProcesado = suscripcion?.estado !== 'pendiente';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl border-border/50 shadow-lg overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />

        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <Building2 className="h-7 w-7 text-emerald-600" />
          </div>
          <CardTitle className="text-xl font-bold">
            {suscripcion?.gymNombre ?? 'Gimnasio'}
          </CardTitle>
          <CardDescription>Suscripción mensual — Simulación de pago</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status badge */}
          <div className="flex justify-center">
            <Badge variant={estadoInfo.variant} className="text-sm px-4 py-1">
              {estadoInfo.label}
            </Badge>
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Plan</span>
              <span className="font-medium">Suscripción mensual</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Monto</span>
              <span className="font-bold text-emerald-700">
                ${Number(suscripcion?.monto ?? 99.99).toFixed(2)} / mes
              </span>
            </div>
            {suscripcion?.fechaInicio && (
              <div className="flex justify-between">
                <span className="text-slate-500">Inicio</span>
                <span>{new Date(suscripcion.fechaInicio).toLocaleDateString('es-AR')}</span>
              </div>
            )}
            {suscripcion?.fechaProximoPago && (
              <div className="flex justify-between">
                <span className="text-slate-500">Próximo pago</span>
                <span>{new Date(suscripcion.fechaProximoPago).toLocaleDateString('es-AR')}</span>
              </div>
            )}
          </div>

          {resultado && (
            <div className={`rounded-lg p-3 text-sm text-center ${
              suscripcion?.estado === 'activa'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {resultado}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Action buttons */}
          {!pagoProcesado && !resultado && (
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-14 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => handlePago('rechazar')}
                disabled={procesando}
              >
                {procesando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <XCircle className="mr-2 h-5 w-5" />
                    Rechazar
                  </>
                )}
              </Button>
              <Button
                className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handlePago('aprobar')}
                disabled={procesando}
              >
                {procesando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Aprobar pago
                  </>
                )}
              </Button>
            </div>
          )}

          {pagoProcesado && (
            <div className="text-center pt-2">
              <Button variant="outline" onClick={() => navigate({ to: '/' })}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
