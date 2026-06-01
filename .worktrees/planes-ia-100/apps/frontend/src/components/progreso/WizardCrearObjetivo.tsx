import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Target, TrendingUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useWizardObjetivo } from '@/stores/wizard-objetivo';
import type { TipoMetrica, CrearObjetivoDto } from './types';

interface PropiedadesWizardCrearObjetivo {
  abierto: boolean;
  onCerrar: () => void;
  onCrear: (datos: CrearObjetivoDto) => Promise<void>;
  cargando?: boolean;
}

const METRICAS: { valor: TipoMetrica; etiqueta: string; unidad: string }[] = [
  { valor: 'PESO', etiqueta: 'Peso', unidad: 'kg' },
  { valor: 'CINTURA', etiqueta: 'Perímetro de cintura', unidad: 'cm' },
  { valor: 'CADERA', etiqueta: 'Perímetro de cadera', unidad: 'cm' },
  { valor: 'BRAZO', etiqueta: 'Perímetro de brazo', unidad: 'cm' },
  { valor: 'MUSLO', etiqueta: 'Perímetro de muslo', unidad: 'cm' },
  { valor: 'PECHO', etiqueta: 'Perímetro de pecho', unidad: 'cm' },
];

export function WizardCrearObjetivo({
  abierto,
  onCerrar,
  onCrear,
  cargando = false,
}: PropiedadesWizardCrearObjetivo) {
  const {
    pasoActual,
    tipoMetrica,
    valorInicial,
    valorObjetivo,
    fechaObjetivo,
    error,
    establecerTipoMetrica,
    establecerValorInicial,
    establecerValorObjetivo,
    establecerFechaObjetivo,
    establecerError,
    siguientePaso,
    pasoAnterior,
    reiniciar,
    puedeAvanzar,
  } = useWizardObjetivo();

  const [valorInputInicial, establecerValorInputInicial] = useState('');
  const [valorInputObjetivo, establecerValorInputObjetivo] = useState('');

  const metricaSeleccionada = METRICAS.find((m) => m.valor === tipoMetrica);

  const manejarCerrar = () => {
    reiniciar();
    establecerValorInputInicial('');
    establecerValorInputObjetivo('');
    onCerrar();
  };

  const manejarSiguiente = () => {
    if (pasoActual === 1 && !tipoMetrica) {
      establecerError('Debés seleccionar una métrica');
      return;
    }

    if (pasoActual === 2) {
      const inicial = parseFloat(valorInputInicial);
      const objetivo = parseFloat(valorInputObjetivo);

      if (isNaN(inicial) || inicial <= 0) {
        establecerError('Ingresá un valor inicial válido');
        return;
      }

      if (isNaN(objetivo) || objetivo <= 0) {
        establecerError('Ingresá un valor objetivo válido');
        return;
      }

      if (inicial === objetivo) {
        establecerError('El valor objetivo debe ser diferente al inicial');
        return;
      }

      establecerValorInicial(inicial);
      establecerValorObjetivo(objetivo);
    }

    establecerError(null);
    siguientePaso();
  };

  const manejarCrear = async () => {
    try {
      establecerError(null);
      await onCrear({
        tipoMetrica: tipoMetrica!,
        valorInicial: valorInicial!,
        valorObjetivo: valorObjetivo!,
        fechaObjetivo: fechaObjetivo || undefined,
      });
      manejarCerrar();
    } catch (err) {
      establecerError(err instanceof Error ? err.message : 'Error al crear el objetivo');
    }
  };

  const renderPaso1 = () => (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        ¿Qué métrica querés seguir?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {METRICAS.map((metrica) => (
          <button
            key={metrica.valor}
            onClick={() => {
              establecerTipoMetrica(metrica.valor);
              establecerError(null);
            }}
            className={cn(
              'p-4 rounded-lg border text-left transition-colors',
              tipoMetrica === metrica.valor
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-medium">{metrica.etiqueta}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Unidad: {metrica.unidad}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPaso2 = () => (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Establecé los valores para tu objetivo de {metricaSeleccionada?.etiqueta.toLowerCase()}
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Valor actual ({metricaSeleccionada?.unidad})</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={valorInputInicial}
            onChange={(e) => {
              establecerValorInputInicial(e.target.value);
              establecerError(null);
            }}
            placeholder={`Ej: ${metricaSeleccionada?.valor === 'PESO' ? '80' : '90'}`}
          />
        </div>

        <div className="space-y-2">
          <Label>Valor objetivo ({metricaSeleccionada?.unidad})</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={valorInputObjetivo}
            onChange={(e) => {
              establecerValorInputObjetivo(e.target.value);
              establecerError(null);
            }}
            placeholder={`Ej: ${metricaSeleccionada?.valor === 'PESO' ? '75' : '85'}`}
          />
        </div>
      </div>
    </div>
  );

  const renderPaso3 = () => (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        ¿Tenés una fecha límite? (opcional)
      </p>

      <div className="space-y-2">
        <Label>Fecha objetivo</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fechaObjetivo
                ? format(new Date(fechaObjetivo), "d 'de' MMMM 'de' yyyy", { locale: es })
                : 'Seleccionar fecha...'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={fechaObjetivo ? new Date(fechaObjetivo) : undefined}
              onSelect={(fecha) => {
                establecerFechaObjetivo(fecha ? fecha.toISOString() : null);
              }}
              disabled={(fecha) => fecha < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Resumen del objetivo</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Métrica:</span>
            <span>{metricaSeleccionada?.etiqueta}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor actual:</span>
            <span>
              {valorInicial} {metricaSeleccionada?.unidad}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor objetivo:</span>
            <span>
              {valorObjetivo} {metricaSeleccionada?.unidad}
            </span>
          </div>
          {fechaObjetivo && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha límite:</span>
              <span>{format(new Date(fechaObjetivo), "d 'de' MMM yyyy", { locale: es })}</span>
            </div>
          )}
          <div className="flex justify-between font-medium pt-2 border-t">
            <span>Cambio:</span>
            <span
              className={
                valorObjetivo! < valorInicial! ? 'text-green-600' : 'text-orange-600'
              }
            >
              {valorObjetivo! < valorInicial! ? '-' : '+'}
              {Math.abs(valorObjetivo! - valorInicial!).toFixed(1)} {metricaSeleccionada?.unidad}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && manejarCerrar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Crear nuevo objetivo
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((paso) => (
            <div
              key={paso}
              className={cn(
                'flex-1 h-2 rounded-full transition-colors',
                paso <= pasoActual ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="min-h-[250px]">
          {pasoActual === 1 && renderPaso1()}
          {pasoActual === 2 && renderPaso2()}
          {pasoActual === 3 && renderPaso3()}
        </div>

        <div className="flex justify-between gap-2 pt-4">
          <Button
            variant="outline"
            onClick={pasoActual === 1 ? manejarCerrar : pasoAnterior}
          >
            {pasoActual === 1 ? 'Cancelar' : 'Anterior'}
          </Button>

          {pasoActual < 3 ? (
            <Button onClick={manejarSiguiente} disabled={!puedeAvanzar()}>
              Siguiente
            </Button>
          ) : (
            <Button onClick={manejarCrear} disabled={cargando}>
              <Check className="h-4 w-4 mr-2" />
              {cargando ? 'Creando...' : 'Crear objetivo'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
