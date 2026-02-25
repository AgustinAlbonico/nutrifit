import { useState } from 'react';
import { format, isBefore, startOfDay, subYears, addYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  className?: string;
}

export function DatePicker({
  date,
  setDate,
  placeholder = 'Seleccionar fecha',
  minDate,
  className,
}: DatePickerProps) {
  const fechaMinima = minDate ? startOfDay(minDate) : undefined;
  const [estaAbierto, setEstaAbierto] = useState(false);

  const manejarSeleccionFecha = (fechaSeleccionada: Date | undefined) => {
    setDate(fechaSeleccionada);
    setEstaAbierto(false);
  };

  // Para fechas de nacimiento: permitir navegar desde hace 100 años hasta hoy
  const fechaInicioNavegacion = subYears(new Date(), 100);
  const fechaFinNavegacion = addYears(new Date(), 1);

  return (
    <Popover open={estaAbierto} onOpenChange={setEstaAbierto}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[280px] justify-between text-left font-normal',
            !date && 'text-muted-foreground',
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 shrink-0" />
            {date ? format(date, 'PPP', { locale: es }) : <span>{placeholder}</span>}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-xl border p-0 shadow-xl">
        <Calendar
          mode="single"
          selected={date}
          onSelect={manejarSeleccionFecha}
          initialFocus
          locale={es}
          disabled={(fecha) => (fechaMinima ? isBefore(fecha, fechaMinima) : false)}
          startMonth={fechaInicioNavegacion}
          endMonth={fechaFinNavegacion}
          captionLayout="dropdown"
          fromYear={1920}
          toYear={new Date().getFullYear()}
        />
      </PopoverContent>
    </Popover>
  );
}
