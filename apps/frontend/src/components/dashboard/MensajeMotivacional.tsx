import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const mensajesMotivacionales = [
  'Cada día es una nueva oportunidad para mejorar tu salud.',
  'Los pequeños cambios generan grandes resultados.',
  'Tu cuerpo es tu templo, cuidalo con amor.',
  'El éxito es la suma de pequeños esfuerzos repetidos.',
  'Creer en vos mismo es el primer paso hacia el éxito.',
  'La constancia es la clave del progreso.',
  'Celebrá cada logro, por pequeño que sea.',
  'Tu salud es tu mayor riqueza.',
];

export function MensajeMotivacional() {
  const mensajeDelDia =
    mensajesMotivacionales[new Date().getDate() % mensajesMotivacionales.length];

  return (
    <Card className="rounded-2xl border-orange-100 bg-gradient-to-r from-orange-50 to-rose-50 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Quote className="h-6 w-6 text-orange-400 flex-shrink-0 mt-1" />
          <p className="text-lg italic text-foreground/80">{mensajeDelDia}</p>
        </div>
      </CardContent>
    </Card>
  );
}
