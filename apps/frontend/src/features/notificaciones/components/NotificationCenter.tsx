import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NotificationBell } from './NotificationBell';
import { useNotificaciones } from '../hooks/useNotificaciones';

export function NotificationCenter() {
  const { lista, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <NotificationBell totalNoLeidas={noLeidas.data?.total ?? 0} onClick={() => {}} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notificaciones
          <button className="text-xs text-primary" onClick={() => marcarTodasLeidas.mutate()}>Marcar todas</button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {lista.data?.data?.length ? (
          lista.data.data.map((notificacion) => (
            <DropdownMenuItem key={notificacion.idNotificacion} onClick={() => marcarLeida.mutate(notificacion.idNotificacion)}>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{notificacion.titulo}</span>
                <span className="text-xs text-muted-foreground">{notificacion.mensaje}</span>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No hay notificaciones</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
