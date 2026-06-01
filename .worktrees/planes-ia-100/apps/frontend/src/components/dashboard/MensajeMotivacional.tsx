import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const mensajesMotivacionales = [
  'Cada dia es una nueva oportunidad para mejorar tu salud.',
  'Los pequenos cambios generan grandes resultados.',
  'Tu cuerpo es tu templo, cuidalo con amor.',
  'El exito es la suma de pequenos esfuerzos repetidos.',
  'Creer en ti mismo es el primer paso hacia el exito.',
  'La constancia es la clave del progreso.',
  'Celebra cada logro, por pequeno que sea.',
  'Tu salud es tu mayor riqueza.',
];

export function MensajeMotivacional() {
  const mensajeDelDia =
    mensajesMotivacionales[new Date().getDate() % mensajesMotivacionales.length];

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm bg-gradient-to-r from-orange-50 to-rose-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Quote className="h-6 w-6 text-orange-400 flex-shrink-0 mt-1" />
          <p className="text-lg italic text-foreground/80">{mensajeDelDia}</p>
        </div>
      </CardContent>
    </Card>
  );
}
