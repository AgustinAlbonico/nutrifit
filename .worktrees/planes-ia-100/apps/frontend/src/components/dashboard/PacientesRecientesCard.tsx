import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarPaciente } from '@/components/ui/avatar-paciente';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Paciente {
  idSocio: number;
  nombreCompleto: string;
  ultimaConsulta: string | null;
  objetivo: string | null;
  fotoPerfilUrl: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export function PacientesRecientesCard() {
  const { token, personaId } = useAuth();

  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientes-recientes', personaId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<Paciente[]>>(
        `/turnos/profesional/${personaId}/pacientes?limite=5`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId,
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-orange-500" />
            Pacientes Recientes
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-orange-500" />
          Pacientes Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pacientes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No tienes pacientes registrados
          </p>
        ) : (
          <div className="space-y-3">
            {pacientes.filter((p) => p.idSocio !== undefined).slice(0, 5).map((paciente) => (
              <div
                key={paciente.idSocio}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <AvatarPaciente
                  fotoUrl={paciente.fotoPerfilUrl}
                  nombreCompleto={paciente.nombreCompleto}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{paciente.nombreCompleto}</p>
                  {paciente.objetivo && (
                    <p className="text-xs text-muted-foreground truncate">
                      {paciente.objetivo}
                    </p>
                  )}
                </div>
                {paciente.ultimaConsulta && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {paciente.ultimaConsulta}
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
