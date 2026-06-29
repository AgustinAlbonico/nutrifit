import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePreferenciasIa } from '@/hooks/usePreferenciasIa';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DialogPreferenciasIa({ open, onOpenChange }: Props) {
  const { preferencias, isLoading, guardarAsync, isSaving } = usePreferenciasIa();
  const [texto, setTexto] = useState('');

  // Inicializar texto cuando carguen las preferencias
  useEffect(() => {
    if (open) {
      setTexto(preferencias);
    }
  }, [open, preferencias]);

  const alGuardar = async () => {
    try {
      await guardarAsync(texto);
      toast.success('Preferencias IA guardadas', {
        description: 'Las sugerencias futuras de la IA seguirán estas directivas.',
      });
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar preferencias';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border bg-background p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Sparkles className="size-5 text-fuchsia-500 animate-pulse" />
            Preferencias de la Inteligencia Artificial
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Estas directivas se inyectan como contexto privado a la IA al generar planes semanticos completos o al pedir ideas de comida individuales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              Cargando preferencias guardadas...
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Ej: Priorizar recetas altas en proteínas, incluir grasas saludables (palta, nueces), evitar ultraprocesados y enfocar las cenas en preparaciones livianas fáciles de digerir..."
                className="min-h-[160px] rounded-xl text-sm leading-relaxed p-3 focus-visible:ring-fuchsia-500/50"
                maxLength={2000}
                data-testid="textarea-preferencias-ia"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                <span>Directiva global del nutricionista</span>
                <span>{texto.length}/2000 caracteres</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={alGuardar}
            disabled={isLoading || isSaving}
            className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-semibold gap-1.5"
            data-testid="btn-guardar-preferencias-ia"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              <>
                <Save className="size-4" />
                Guardar preferencias
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
