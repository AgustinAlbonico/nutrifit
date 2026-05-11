import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  LogOut,
  UserCheck,
  Dumbbell,
  User,
  FileText,
  Utensils,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Shield,
  Bell,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { obtenerUrlFoto } from '@/lib/api';
import { NotificationCenter } from '@/features/notificaciones/components/NotificationCenter';

export function Sidebar() {
  const { rol, email, nombre, apellido, fotoPerfilUrl, logout } = useAuth();
  const [expandido, establecerExpandido] = useState(false);

  const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ').trim();
  const iniciales = nombre && apellido 
    ? `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
    : 'U';

  const links = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'NUTRICIONISTA', 'SOCIO'],
    },
    {
      to: '/nutricionistas',
      label: 'Nutricionistas',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      to: '/socios',
      label: 'Socios',
      icon: User,
      roles: ['ADMIN'],
    },
    {
      to: '/permisos',
      label: 'Permisos & Roles',
      icon: UserCheck,
      roles: ['ADMIN'],
    },
    {
      to: '/agenda',
      label: 'Mi Agenda',
      icon: Calendar,
      roles: ['NUTRICIONISTA'],
    },
    {
      to: '/turnos-profesional',
      label: 'Turnos del dia',
      icon: Users,
      roles: ['ADMIN', 'NUTRICIONISTA'],
    },
    {
      to: '/pacientes',
      label: 'Mis Pacientes',
      icon: User,
      roles: ['NUTRICIONISTA'],
    },
    {
      to: '/planes',
      label: 'Planes de Alimentacion',
      icon: Utensils,
      roles: ['NUTRICIONISTA'],
    },
    {
      to: '/turnos',
      label: 'Mis Turnos',
      icon: Calendar,
      roles: ['SOCIO'],
    },
    {
      to: '/turnos/ficha-salud',
      label: 'Ficha de salud',
      icon: FileText,
      roles: ['SOCIO'],
    },
    {
      to: '/mi-progreso',
      label: 'Mi Progreso',
      icon: TrendingUp,
      roles: ['SOCIO'],
    },
    {
      to: '/mi-plan',
      label: 'Mi Plan',
      icon: Utensils,
      roles: ['SOCIO'],
    },
    {
      to: '/notificaciones',
      label: 'Notificaciones',
      icon: Bell,
      roles: ['ADMIN', 'NUTRICIONISTA', 'SOCIO', 'RECEPCIONISTA'],
    },
    {
      to: '/admin/auditoria',
      label: 'Auditoría',
      icon: Shield,
      roles: ['ADMIN'],
    },
    {
      to: '/recepcion/turnos',
      label: 'Recepcion',
      icon: UserCheck,
      roles: ['RECEPCIONISTA'],
    },
  ];

  const bottomLinks = [
    {
      to: '/configuracion',
      label: 'Configuracion',
      icon: Settings,
      roles: ['ADMIN', 'NUTRICIONISTA', 'SOCIO'],
    },
  ];

  const filterLinks = (items: typeof links) =>
    items.filter((link) => link.roles.includes(rol || ''));

  const mainLinks = filterLinks(links);
  const footerLinks = filterLinks(bottomLinks);

  const NavLink = ({ link }: { link: typeof links[number] }) => {
    const linkContent = (
      <Link
        to={link.to}
        activeOptions={{ exact: true }}
        className="group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:text-foreground hover:shadow-sm hover:shadow-primary/5"
        activeProps={{
          className:
            'group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-sm font-medium bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors duration-200">
            <link.icon className="h-4 w-4 shrink-0" />
          </div>
          <span className={`whitespace-nowrap transition-all duration-200 ${expandido ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>{link.label}</span>
        </div>
      </Link>
    );

    if (expandido) {
      return linkContent;
    }

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {linkContent}
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          sideOffset={10}
          className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20 border-0"
        >
          {link.label}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
      <aside 
        className={
          `relative sticky top-0 flex h-screen self-start flex-col border-r bg-card/50 backdrop-blur-xl transition-all duration-300 ease-in-out ` +
          (expandido ? 'w-64' : 'w-16')
        }
      >
        {/* Header / Logo */}
        <div className={`flex h-14 items-center px-3 ${expandido ? 'justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className={`flex flex-col whitespace-nowrap transition-all duration-200 ${expandido ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
              <span className="text-base font-bold tracking-tight text-foreground">
                NutriFit
              </span>
              <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                Supervisor
              </span>
            </div>
          </div>
          {expandido && <NotificationCenter />}

        </div>

        <Separator className="opacity-50" />

        {/* Toggle Button - Borde del sidebar */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => establecerExpandido(!expandido)}
              className="absolute right-0 top-[58px] z-10 flex h-6 w-5 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-md border border-border bg-background shadow-sm hover:bg-muted transition-all duration-200 text-muted-foreground hover:text-foreground"
              title={expandido ? 'Colapsar' : 'Expandir'}
            >
              {expandido ? (
                <ChevronLeft className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            sideOffset={15}
            className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20 border-0"
          >
            {expandido ? 'Colapsar menu' : 'Expandir menu'}
          </TooltipContent>
        </Tooltip>


        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-3 overflow-y-auto overflow-x-hidden">
          <div className={`mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 transition-all duration-200 ${expandido ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
            Menu Principal
          </div>
          {mainLinks.map((link) => (
            <NavLink key={link.to} link={link} />
          ))}

          <div className={`mt-4 mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 transition-all duration-200 ${expandido ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
            Sistema
          </div>
          {footerLinks.map((link) => (
            <NavLink key={link.to} link={link} />
          ))}
        </nav>

        {/* User Footer */}
        <div className={`border-t bg-muted/30 transition-all duration-200 ${expandido ? 'p-3' : 'p-2'}`}>
          {expandido ? (
            <div className="flex items-center gap-2.5 rounded-xl border bg-background p-2 shadow-sm">
              <Avatar className="size-9 ring-1 ring-border/60 shrink-0">
                {fotoPerfilUrl && (
                  <AvatarImage
                    src={obtenerUrlFoto(fotoPerfilUrl) ?? undefined}
                    alt={nombreCompleto}
                    className="object-cover object-center"
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                  {iniciales}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="truncate text-xs font-medium text-foreground">
                  {nombreCompleto || 'Usuario'}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">{email ?? '-'}</p>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <p className="truncate text-[10px] text-muted-foreground">
                    {rol ?? '-'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                onClick={logout}
                title="Cerrar sesion"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Avatar className="size-9 ring-1 ring-border/60 cursor-default">
                    {fotoPerfilUrl && (
                      <AvatarImage
                        src={obtenerUrlFoto(fotoPerfilUrl) ?? undefined}
                        alt={nombreCompleto}
                        className="object-cover object-center"
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                      {iniciales}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  sideOffset={10}
                  className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20 border-0"
                >
                  <div className="text-center">
                    <p className="font-semibold">{nombreCompleto || 'Usuario'}</p>
                    <p className="text-[10px] opacity-80">{rol ?? '-'}</p>
                  </div>
                </TooltipContent>
              </Tooltip>

            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
