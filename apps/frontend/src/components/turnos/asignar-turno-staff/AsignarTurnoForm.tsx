import { useState } from 'react';
import { Calendar, FileWarning, User, UserCog } from 'lucide-react';

import { BuscadorSocio } from './BuscadorSocio';
import { SelectorNutricionista } from './SelectorNutricionista';
import { CalendarioDisponibilidad } from './CalendarioDisponibilidad';
import { WarningFichaIncompleta } from './WarningFichaIncompleta';
import { ModalConfirmacion } from './ModalConfirmacion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useCrearTurnoEnNombreDeSocio } from '@/hooks/useCrearTurnoEnNombreDeSocio';
import { useNutricionistasParaAsignar } from '@/hooks/useNutricionistasParaAsignar';
import type {
  NutricionistaActivo,
  SocioConFicha,
} from '@/types/asignar-turno';

export interface AsignarTurnoFormProps {
  /**
   * Callback al confirmar exitosamente la creacion del turno.
   * La page lo usa para navegar a la pantalla de origen.
   */
  onExito?: (resultado: { socioId: number; warning?: 'socio_sin_ficha' }) => void;
}

/**
 * Orquestador del wizard de 3 pasos:
 *  1. Buscar socio (BuscadorSocio)
 *  2. Seleccionar nutricionista (SelectorNutricionista, oculto para nutri)
 *  3. Seleccionar slot del calendario (CalendarioDisponibilidad)
 *
 * Maneja el state interno del wizard y abre el ModalConfirmacion
 * cuando se selecciona un slot.
 *
 * Es presentational puro: la navegacion entre paginas vive en
 * `AsignarTurnoPage`. El form solo maneja state interno del wizard.
 */
export function AsignarTurnoForm({ onExito }: AsignarTurnoFormProps) {
  const { rol, personaId } = useAuth();
  const { data: nutricionistas = [] } = useNutricionistasParaAsignar();
  const crearTurno = useCrearTurnoEnNombreDeSocio();

  // Para NUTRICIONISTA, nutricionistaId se autocompleta con personaId
  // y el selector de nutricionista esta oculto.
  const [nutricionistaId, setNutricionistaId] = useState<number | null>(
    rol === 'NUTRICIONISTA' ? personaId : null,
  );
  const [socioSeleccionado, setSocioSeleccionado] =
    useState<SocioConFicha | null>(null);
  const [fecha, setFecha] = useState<Date | undefined>(undefined);
  const [slot, setSlot] = useState<
    { horaInicio: string; horaFin: string } | null
  >(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const nutricionistaSeleccionado: NutricionistaActivo | null =
    nutricionistaId === null
      ? null
      : (nutricionistas.find((n) => n.idPersona === nutricionistaId) ?? {
          idPersona: nutricionistaId,
          nombre: '',
          apellido: '',
        });

  const handleConfirmar = () => {
    if (
      !socioSeleccionado ||
      nutricionistaId === null ||
      !fecha ||
      !slot
    ) {
      return;
    }

    const fechaTurno = formatearFechaIso(fecha);
    crearTurno.mutate(
      {
        socioId: socioSeleccionado.idPersona,
        nutricionistaId,
        fechaTurno,
        horaTurno: slot.horaInicio,
      },
      {
        onSuccess: (data) => {
          setModalAbierto(false);
          onExito?.({
            socioId: data.socioId,
            warning: data.warning,
          });
        },
        onError: () => {
          // El componente `ModalConfirmacion` se mantiene abierto
          // para mostrar el error (el padre lo lee via
          // crearTurno.error).
        },
      },
    );
  };

  const fichaErrorMensaje = obtenerMensajeFichaIncompleta(crearTurno.error);

  return (
    <div className="space-y-6" data-testid="asignar-turno-form">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-orange-500" />
            1) Buscar socio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BuscadorSocio
            rolActor={rol}
            socioSeleccionado={socioSeleccionado}
            onSeleccionar={setSocioSeleccionado}
            onLimpiar={() => {
              setSocioSeleccionado(null);
              setSlot(null);
            }}
          />

          {socioSeleccionado && !socioSeleccionado.tieneFichaSalud && (
            <div className="mt-4">
              <WarningFichaIncompleta socio={socioSeleccionado} />
            </div>
          )}
        </CardContent>
      </Card>

      {socioSeleccionado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCog className="h-5 w-5 text-orange-500" />
              2) Seleccionar profesional
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rol === 'NUTRICIONISTA' ? (
              <p
                className="text-sm text-muted-foreground"
                data-testid="nutri-autoseleccionado"
              >
                El turno se asignara a tu propia agenda (
                {personaId ? `id ${personaId}` : 'sesion actual'}).
              </p>
            ) : (
              <SelectorNutricionista
                value={nutricionistaId}
                onChange={setNutricionistaId}
              />
            )}
          </CardContent>
        </Card>
      )}

      {socioSeleccionado && nutricionistaId !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-orange-500" />
              3) Calendario de disponibilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarioDisponibilidad
              nutricionistaId={nutricionistaId}
              fecha={fecha}
              slotSeleccionado={slot}
              onFechaChange={(nuevaFecha) => {
                setFecha(nuevaFecha);
                setSlot(null);
              }}
              onSeleccionar={(slotElegido) => {
                setSlot(slotElegido);
                setModalAbierto(true);
              }}
            />

            {slot && !modalAbierto && (
              <div className="mt-3 rounded-md border bg-muted/50 p-3 text-sm">
                <p className="font-medium">
                  Horario seleccionado: {slot.horaInicio} - {slot.horaFin}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {crearTurno.error && fichaErrorMensaje && (
        <div
          className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-2">
            <FileWarning className="h-5 w-5 shrink-0" />
            <p>{fichaErrorMensaje}</p>
          </div>
        </div>
      )}

      <ModalConfirmacion
        open={modalAbierto}
        onClose={() => {
          if (!crearTurno.isPending) {
            setModalAbierto(false);
          }
        }}
        onConfirm={handleConfirmar}
        socio={socioSeleccionado}
        nutricionista={nutricionistaSeleccionado}
        fechaTurno={fecha ? formatearFechaIso(fecha) : ''}
        horaTurno={slot?.horaInicio ?? ''}
        warning={null}
        errorFichaIncompleta={fichaErrorMensaje}
        enviando={crearTurno.isPending}
      />
    </div>
  );
}

function formatearFechaIso(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function obtenerMensajeFichaIncompleta(error: unknown): string | null {
  if (!error || !(error instanceof Error)) {
    return null;
  }
  const mensaje = error.message.toLowerCase();
  if (
    mensaje.includes('ficha') ||
    mensaje.includes('ficha medica') ||
    mensaje.includes('ficha médica')
  ) {
    return error.message;
  }
  return null;
}
