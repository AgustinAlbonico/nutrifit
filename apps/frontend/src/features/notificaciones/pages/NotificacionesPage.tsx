import { useNotificaciones } from '../hooks/useNotificaciones';

export function NotificacionesPage() {
  const { lista, marcarLeida } = useNotificaciones();

  if (lista.isLoading) return <p>Cargando notificaciones...</p>;
  if (lista.isError) return <p>Error al cargar notificaciones.</p>;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Notificaciones</h1>
      {lista.data?.data?.length ? (
        lista.data.data.map((notificacion) => (
          <button
            key={notificacion.idNotificacion}
            type="button"
            onClick={() => marcarLeida.mutate(notificacion.idNotificacion)}
            className="w-full rounded-lg border p-3 text-left"
          >
            <p className="font-medium">{notificacion.titulo}</p>
            <p className="text-sm text-muted-foreground">{notificacion.mensaje}</p>
          </button>
        ))
      ) : (
        <p>No tenés notificaciones.</p>
      )}
    </div>
  );
}
