import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Circle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Profesional {
  idPersona: number;
  nombre: string;
  apellido: string;
  matricula: string;
  activo: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export function AgendaProfesionalesCard() {
  const { token } = useAuth();

  // Obtener lista de profesionales
  const { data: profesionales = [], isLoading } = useQuery({
    queryKey: ['profesionales-lista', token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<Profesional[]>>(
        '/profesional',
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-orange-500" />
            Agenda Profesionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  const profesionalesActivos = profesionales.filter((p) => p.activo);

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-orange-500" />
          Agenda Profesionales
          <Badge variant="secondary" className="ml-2">
            {profesionalesActivos.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {profesionalesActivos.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay profesionales registrados
          </p>
        ) : (
          <div className="space-y-3">
            {profesionalesActivos.slice(0, 6).map((prof) => (
              <div
                key={prof.idPersona}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">
                    {prof.nombre} {prof.apellido}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP: {prof.matricula}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Indicadores de disponibilidad simulados */}
                  <div className="flex gap-1">
                    <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                    <Circle className="h-3 w-3 fill-orange-500 text-orange-500" />
                    <Circle className="h-3 w-3 fill-orange-500 text-orange-500" />
                    <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                  </div>
                  <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                    Ver
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
          <Circle className="h-2 w-2 fill-green-500 text-green-500" /> Disponible
          <Circle className="h-2 w-2 fill-orange-500 text-orange-500" /> Ocupado
        </p>
      </CardContent>
    </Card>
  );
}
