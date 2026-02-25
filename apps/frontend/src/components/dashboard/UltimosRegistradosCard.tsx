import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Socio {
  idPersona: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaCreacion?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export function UltimosRegistradosCard() {
  const { token } = useAuth();

  const { data: socios = [], isLoading } = useQuery({
    queryKey: ['ultimos-socios', token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<Socio[]>>(
        '/socio',
        { token },
      );
      // Ordenar por fecha de creación descendente y limitar a 5
      const sociosOrdenados = (response.data ?? []).sort((a, b) => {
        const fechaA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
        const fechaB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
        return fechaB - fechaA;
      });
      return sociosOrdenados.slice(0, 5);
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-orange-500" />
            Últimos Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-orange-500" />
          Últimos Registrados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {socios.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay pacientes registrados recientemente
          </p>
        ) : (
          <div className="space-y-3">
            {socios.map((socio) => (
              <div
                key={socio.idPersona}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">
                    {socio.nombre} {socio.apellido}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    DNI: {socio.dni}
                  </p>
                </div>
                {socio.fechaCreacion && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(socio.fechaCreacion).toLocaleDateString('es-AR')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
