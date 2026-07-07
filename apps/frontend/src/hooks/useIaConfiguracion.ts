import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import {
  eliminarConfiguracionIa,
  guardarConfiguracionIa,
  obtenerConfiguracionesIa,
  obtenerModelosIa,
  probarConexionIa,
  solicitarReinicioIa,
} from '@/lib/api/iaConfiguracion';
import {
  PROVEEDORES_IA,
  type ConfiguracionIa,
  type GuardarConfiguracionIaDto,
  type ProveedorIa,
  configuracionVaciaPara,
} from '@/types/iaConfiguracion';

const QUERY_KEY = ['configuraciones-ia'] as const;

export function useConfiguracionesIa() {
  const { token } = useAuth();

  return useQuery<ConfiguracionIa[]>({
    queryKey: [...QUERY_KEY, token],
    enabled: Boolean(token),
    queryFn: async () => {
      const configuraciones = await obtenerConfiguracionesIa(token);
      return PROVEEDORES_IA.map<ConfiguracionIa>((meta) => {
        const encontrada = configuraciones.find(
          (config) => config.provider === meta.id,
        );
        return encontrada ?? configuracionVaciaPara(meta.id);
      });
    },
  });
}

export function useGuardarConfiguracionIa() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      provider,
      dto,
    }: {
      provider: ProveedorIa;
      dto: GuardarConfiguracionIaDto;
    }) => guardarConfiguracionIa(provider, dto, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useEliminarConfiguracionIa() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: ProveedorIa) =>
      eliminarConfiguracionIa(provider, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useProbarConexionIa() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: ({
      provider,
      dto,
    }: {
      provider: ProveedorIa;
      dto?: GuardarConfiguracionIaDto;
    }) => probarConexionIa(provider, dto, token),
  });
}

export function useObtenerModelosIa() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: ({
      provider,
      dto,
    }: {
      provider: ProveedorIa;
      dto?: GuardarConfiguracionIaDto;
    }) => obtenerModelosIa(provider, dto, token),
  });
}

export function useSolicitarReinicioIa() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: () => solicitarReinicioIa(token),
  });
}