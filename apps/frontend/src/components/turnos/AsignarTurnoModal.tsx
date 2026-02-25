import { useState, useEffect, useCallback } from 'react';
import { Search, User, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

interface SocioConFicha {
  idPersona: number;
  nombre: string;
  apellido: string;
  dni: string | null;
  tieneFichaSalud: boolean;
  nombreCompleto: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface AsignarTurnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  fecha: string;
  hora: string;
  nutricionistaId: number;
  token: string;
  onAsignado: () => void;
}

export function AsignarTurnoModal({
  isOpen,
  onClose,
  fecha,
  hora,
  nutricionistaId,
  token,
  onAsignado,
}: AsignarTurnoModalProps) {
  const [busqueda, setBusqueda] = useState('');
  const [socios, setSocios] = useState<SocioConFicha[]>([]);
  const [socioSeleccionado, setSocioSeleccionado] = useState<SocioConFicha | null>(null);
  const [cargando, setCargando] = useState(false);
  const [asignando, setAsignando] = useState(false);

  const buscarSocios = useCallback(async () => {
    if (!token) return;

    setCargando(true);
    try {
      const queryParam = busqueda.trim() ? `?q=${encodeURIComponent(busqueda.trim())}` : '';
      const response = await apiRequest<ApiResponse<SocioConFicha[]>>(
        `/socio/buscar-con-ficha${queryParam}`,
        { token },
      );
      setSocios(response.data ?? []);
    } catch {
      toast.error('Error al buscar pacientes');
      setSocios([]);
    } finally {
      setCargando(false);
    }
  }, [busqueda, token]);

  useEffect(() => {
    if (isOpen) {
      setSocioSeleccionado(null);
      setBusqueda('');
      void buscarSocios();
    }
  }, [isOpen, buscarSocios]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        void buscarSocios();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda, isOpen, buscarSocios]);

  const handleAsignar = async () => {
    if (!socioSeleccionado || !token) return;

    if (!socioSeleccionado.tieneFichaSalud) {
      toast.error('El paciente debe completar su ficha de salud antes de reservar un turno.');
      return;
    }

    setAsignando(true);
    try {
      await apiRequest<ApiResponse<{ idTurno: number }>>(
        `/turnos/profesional/${nutricionistaId}/asignar-manual`,
        {
          method: 'POST',
          token,
          body: {
            socioId: socioSeleccionado.idPersona,
            fechaTurno: fecha,
            horaTurno: hora,
          },
        },
      );

      toast.success('Turno asignado exitosamente');
      onAsignado();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al asignar turno';
      toast.error(msg);
    } finally {
      setAsignando(false);
    }
  };

  const formatFecha = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar Turno</DialogTitle>
          <DialogDescription>
            {formatFecha(fecha)} a las {hora} hs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, apellido o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de socios */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {cargando ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : socios.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron pacientes
              </p>
            ) : (
              socios.map((socio) => (
                <button
                  key={socio.idPersona}
                  type="button"
                  onClick={() => socio.tieneFichaSalud && setSocioSeleccionado(socio)}
                  disabled={!socio.tieneFichaSalud}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    socioSeleccionado?.idPersona === socio.idPersona
                      ? 'border-orange-500 bg-orange-50'
                      : socio.tieneFichaSalud
                        ? 'border-border hover:bg-muted/50'
                        : 'border-border bg-muted/30 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div className="text-left">
                      <p className="font-medium">{socio.nombreCompleto}</p>
                      {socio.dni && (
                        <p className="text-xs text-muted-foreground">DNI: {socio.dni}</p>
                      )}
                    </div>
                  </div>
                  {socio.tieneFichaSalud ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Info de paciente sin ficha */}
          {socios.some((s) => !s.tieneFichaSalud) && (
            <p className="text-xs text-muted-foreground">
              <XCircle className="inline h-3 w-3 mr-1 text-red-400" />
              Los pacientes marcados en rojo no tienen ficha de salud cargada
            </p>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleAsignar}
              disabled={!socioSeleccionado || asignando}
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
            >
              {asignando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                'Asignar Turno'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
