import { useState, type KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PropiedadesChipsInput {
  valor: string[];
  onChange: (valor: string[]) => void;
  placeholder?: string;
  labelAgregar?: string;
  className?: string;
  id?: string;
}

export function ChipsInput({
  valor = [],
  onChange,
  placeholder = 'Escribí un valor y presioná Enter',
  labelAgregar = 'Agregar',
  className,
  id,
}: PropiedadesChipsInput) {
  const [texto, setTexto] = useState('');

  const textoNormalizado = texto.trim();

  function agregar(): void {
    if (!textoNormalizado) return;
    if (valor.includes(textoNormalizado)) {
      setTexto('');
      return;
    }
    onChange([...valor, textoNormalizado]);
    setTexto('');
  }

  function eliminar(indice: number): void {
    const nuevo = [...valor];
    nuevo.splice(indice, 1);
    onChange(nuevo);
  }

  function manejarKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      agregar();
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <Input
          id={id}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={manejarKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={agregar}
          disabled={!textoNormalizado}
          aria-label={labelAgregar}
        >
          <Plus className="h-4 w-4" />
          {labelAgregar}
        </Button>
      </div>

      {valor.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Lista de elementos">
          {valor.map((item, indice) => (
            <Badge
              key={`${item}-${indice}`}
              variant="secondary"
              className="gap-1 pl-2 pr-1 py-1 text-sm"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => eliminar(indice)}
                className="ml-0.5 inline-flex items-center justify-center rounded-full hover:bg-destructive/20 hover:text-destructive size-4 transition-colors"
                aria-label={`Eliminar ${item}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
