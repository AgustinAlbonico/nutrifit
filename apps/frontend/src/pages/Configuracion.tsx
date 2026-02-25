import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Configuracion() {
  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
              <Settings className="h-8 w-8 text-orange-500" />
              Configuración
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl text-base">
              Preferencias y datos de la cuenta.
            </p>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pantalla en construcción</CardTitle>
        </CardHeader>
        <CardContent>
          Vamos a incorporar acá las opciones de perfil y preferencias.
        </CardContent>
      </Card>
    </div>
  );
}
