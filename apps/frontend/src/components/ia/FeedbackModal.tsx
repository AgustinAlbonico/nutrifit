/**
 * Modal para que el nutricionista vote (👍 / 👎) un plan generado por IA.
 *
 * Props:
 * - open / onOpenChange: controlan la visibilidad
 * - versionId: versión del plan a votar
 * - onSuccess: callback opcional al guardar el voto
 *
 * Usa `useFeedbackPlan({ versionId })` para enviar POST al backend.
 * Al éxito cierra el modal y notifica al padre.
 *
 * Accesibilidad:
 * - DialogTitle obligatorio (Radix)
 * - Textarea con label asociado y contador visible
 * - Botones grandes (size lg) con iconos descriptivos
 */

import { useState } from 'react';
import { ThumbsDown, ThumbsUp, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFeedbackPlan } from '@/hooks/useFeedbackPlan';
import { cn } from '@/lib/utils';

const MAX_CARACTERES_COMENTARIO = 500;

interface PropiedadesFeedbackModal {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  versionId: number;
  onSuccess?: () => void;
}

export function FeedbackModal({
  open,
  onOpenChange,
  versionId,
  onSuccess,
}: PropiedadesFeedbackModal) {
  const [comentario, setComentario] = useState('');

  const { votar, isVoting, isError, error } = useFeedbackPlan({ versionId });

  // Resetear comentario al abrir vía handler de evento (no en useEffect
  // para evitar renders en cascada).
  const handleOpenChange = (nuevoAbierto: boolean) => {
    if (nuevoAbierto) {
      setComentario('');
    }
    onOpenChange(nuevoAbierto);
  };

  const handleVoto = (voto: 'POSITIVO' | 'NEGATIVO') => {
    votar(
      {
        voto,
        comentario: comentario.trim() || undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          handleOpenChange(false);
        },
      },
    );
  };

  const caracteresRestantes = MAX_CARACTERES_COMENTARIO - comentario.length;
  const excedido = caracteresRestantes < 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tu feedback</DialogTitle>
          <DialogDescription>
            Tu opinión ayuda a la IA a mejorar las próximas recomendaciones.
            Opcional: dejá un comentario sobre qué te gustó o qué cambiarías.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={isVoting}
              onClick={() => handleVoto('POSITIVO')}
              aria-label="Votar positivo"
              data-testid="feedback-positivo"
              className={cn(
                'h-20 flex-col gap-1 border-emerald-500/40 hover:border-emerald-500 hover:bg-emerald-500/10',
              )}
            >
              {isVoting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ThumbsUp
                  className="text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
              )}
              <span className="text-sm font-semibold">Me sirvió</span>
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={isVoting}
              onClick={() => handleVoto('NEGATIVO')}
              aria-label="Votar negativo"
              data-testid="feedback-negativo"
              className={cn(
                'h-20 flex-col gap-1 border-red-500/40 hover:border-red-500 hover:bg-red-500/10',
              )}
            >
              {isVoting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ThumbsDown
                  className="text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
              )}
              <span className="text-sm font-semibold">No me sirvió</span>
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="feedback-comentario">Comentario (opcional)</Label>
            <Textarea
              id="feedback-comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={MAX_CARACTERES_COMENTARIO}
              placeholder="Ej: respetó vegano y predominio de fibra"
              rows={3}
              disabled={isVoting}
              aria-describedby="feedback-contador"
            />
            <div
              id="feedback-contador"
              aria-live="polite"
              className={cn(
                'text-xs tabular-nums',
                excedido ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {comentario.length} / {MAX_CARACTERES_COMENTARIO} caracteres
            </div>
          </div>

          {isError && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error instanceof Error
                ? error.message
                : 'No se pudo enviar tu feedback.'}
            </p>
          )}
        </div>

        <DialogFooter showCloseButton>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isVoting}>
              Cancelar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}