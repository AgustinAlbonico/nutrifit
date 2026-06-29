/**
 * Modal para que el nutricionista vote (👍 / 👎) un plan generado por IA.
 *
 * Mejora v2 (ver `iteracion 1/errores/plan-alimentacion-validacion-playwright.md`):
 * - El voto positivo es `default` (botón verde lleno).
 * - El voto negativo es `outline` (ghost rojo).
 * Antes ambos eran `outline` y visualmente pesaban igual.
 *
 * Props:
 * - open / onOpenChange: controlan la visibilidad
 * - versionId: versión del plan a votar
 * - onSuccess: callback opcional al guardar el voto
 *
 * Usa `useFeedbackPlan({ versionId })` para enviar POST al backend.
 *
 * Accesibilidad:
 * - DialogTitle obligatorio (Radix)
 * - Textarea con label asociado y contador visible
 * - Botones grandes (size lg) con aria-label descriptivo y feedback visual
 *   al pasar el mouse
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

  // Resetear comentario al abrir (handler de evento, no useEffect para
  // evitar renders en cascada).
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
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Voto sobre la recomendación">
            {/* Voto positivo: jerarquía primaria (verde lleno, llama la atención). */}
            <Button
              type="button"
              size="lg"
              disabled={isVoting}
              onClick={() => handleVoto('POSITIVO')}
              aria-label="Votar positivo: la recomendación me sirvió"
              data-testid="feedback-positivo"
              className={cn(
                'h-20 flex-col gap-1 border-emerald-500/40 bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 hover:border-emerald-600',
                'dark:bg-emerald-600 dark:hover:bg-emerald-700',
              )}
            >
              {isVoting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ThumbsUp aria-hidden="true" />
              )}
              <span className="text-sm font-semibold">Me sirvió</span>
            </Button>
            {/* Voto negativo: jerarquía secundaria (ghost/outline rojo). */}
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={isVoting}
              onClick={() => handleVoto('NEGATIVO')}
              aria-label="Votar negativo: la recomendación no me sirvió"
              data-testid="feedback-negativo"
              className="h-20 flex-col gap-1 border-red-500/40 text-red-700 hover:border-red-500 hover:bg-red-500/10 hover:text-red-800 dark:text-red-300 dark:hover:bg-red-500/15 dark:hover:text-red-200"
            >
              {isVoting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ThumbsDown aria-hidden="true" />
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
