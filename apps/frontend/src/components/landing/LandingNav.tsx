import { useEffect, useState } from 'react';
import { Activity, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ENLACES = [
  { href: '#problema', label: 'El problema' },
  { href: '#roles', label: 'Roles' },
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#suscripcion', label: 'Suscripción' },
  { href: '#como-funciona', label: 'Cómo funciona' },
];

export function LandingNav() {
  const [sobreFondo, establecerSobreFondo] = useState(false);
  const [menuAbierto, establecerMenuAbierto] = useState(false);

  useEffect(() => {
    const manejarScroll = () => establecerSobreFondo(window.scrollY > 24);
    window.addEventListener('scroll', manejarScroll, { passive: true });
    return () => window.removeEventListener('scroll', manejarScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        sobreFondo
          ? 'border-b border-landing-line-dark bg-landing-ink/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:h-20 lg:px-10">
        <a
          href="#top"
          className="group flex items-center gap-2.5 text-landing-cream"
          aria-label="NutriFit Supervisor - inicio"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-landing-lima text-landing-ink transition-transform duration-200 group-hover:scale-105">
            <Activity className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            NutriFit<span className="text-landing-lima"> Supervisor</span>
          </span>
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {ENLACES.map((enlace) => (
            <li key={enlace.href}>
              <a
                href={enlace.href}
                className="landing-kinetic-line text-sm font-medium text-landing-cream/75 transition-colors hover:text-landing-cream"
              >
                {enlace.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <a href="#top">
            <Button
              variant="ghost"
              className="text-landing-cream/75 hover:bg-landing-cream/10 hover:text-landing-cream"
            >
              Iniciar sesión
            </Button>
          </a>
          <a href="#contacto">
            <Button className="bg-landing-lima text-landing-ink hover:bg-landing-lima-bright">
              Agendar demo
            </Button>
          </a>
        </div>

        <button
          type="button"
          className="text-landing-cream lg:hidden"
          onClick={() => establecerMenuAbierto((prev) => !prev)}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
        >
          {menuAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {menuAbierto && (
        <div className="border-t border-landing-line-dark bg-landing-ink-deep px-6 py-6 lg:hidden">
          <ul className="flex flex-col gap-4">
            {ENLACES.map((enlace) => (
              <li key={enlace.href}>
                <a
                  href={enlace.href}
                  className="block text-base font-medium text-landing-cream/80 hover:text-landing-lima"
                  onClick={() => establecerMenuAbierto(false)}
                >
                  {enlace.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a href="#contacto">
                <Button className="w-full bg-landing-lima text-landing-ink hover:bg-landing-lima-bright">
                  Agendar demo
                </Button>
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
