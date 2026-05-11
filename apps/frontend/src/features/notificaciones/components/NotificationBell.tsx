import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NotificationBellProps {
  totalNoLeidas: number;
  onClick: () => void;
}

export function NotificationBell({ totalNoLeidas, onClick }: NotificationBellProps) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} className="relative">
      <Bell className="h-4 w-4" />
      {totalNoLeidas > 0 && (
        <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1">
          {totalNoLeidas > 99 ? '99+' : totalNoLeidas}
        </Badge>
      )}
    </Button>
  );
}
