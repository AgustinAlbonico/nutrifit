import { useState } from 'react';
import { useNotificaciones } from '../hooks/useNotificaciones';
import { ControlesPaginacion } from '@/components/ui/ControlesPaginacion';

export function NotificacionesPage() {
  const [pagina, setPagina] = useState(1);
  const limit = 20;
  const { lista, marcarLeida } = useNotificaciones(pagina, limit);

  if (lista.isLoading) return <p>Cargando notificaciones...</p>;
  if (lista.isError) return <p>Error al cargar notificaciones.</p>;

  const notificaciones = lista.data?.data?.data ?? [];
  const total = lista.data?.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Notificaciones</h1>
      {notificaciones.length ? (
        <>
          <div className="space-y-3">
            {notificaciones.map((notificacion) => (
              <button
                key={notificacion.idNotificacion}
                type="button"
                onClick={() => marcarLeida.mutate(notificacion.idNotificacion)}
                className="w-full rounded-lg border p-3 text-left"
              >
                <p className="font-medium">{notificacion.titulo}</p>
                <p className="text-sm text-muted-foreground">{notificacion.mensaje}</p>
              </button>
            ))}
          </div>
          <ControlesPaginacion
            pagina={pagina}
            totalPaginas={totalPaginas}
            total={total}
            limite={limit}
            cargando={lista.isFetching && !lista.isLoading}
            onCambiarPagina={setPagina}
            onCambiarLimite={() => {}}
          />
        </>
      ) : (
        <p>No tenés notificaciones.</p>
      )}
    </div>
  );
}
