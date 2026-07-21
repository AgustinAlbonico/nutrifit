import { Activity } from 'lucide-react';

const COLUMNAS = [
  {
    titulo: 'Producto',
    enlaces: [
      { label: 'Funcionalidades', href: '#funcionalidades' },
      { label: 'Roles', href: '#roles' },
      { label: 'Módulos premium', href: '#modulos' },
      { label: 'Suscripción', href: '#suscripcion' },
    ],
  },
  {
    titulo: 'Compañía',
    enlaces: [
      { label: 'Cómo funciona', href: '#como-funciona' },
      { label: 'Agendar demo', href: '#contacto' },
      { label: 'Iniciar sesión', href: '/login' },
    ],
  },
  {
    titulo: 'Legal',
    enlaces: [
      { label: 'Términos de servicio', href: '#' },
      { label: 'Política de privacidad', href: '#' },
      { label: 'RGPD / Habeas Data', href: '#' },
    ],
  },
];

export function FooterSeccion() {
  return (
    <footer className="landing-section relative border-t border-landing-line-dark bg-landing-ink-deep py-16">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <a href="#top" className="flex items-center gap-2.5 text-landing-cream">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-landing-naranja text-landing-ink">
                <Activity className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                NutriFit<span className="text-landing-naranja"> Supervisor</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-landing-cream/55">
              B2B SaaS para gestión de servicios de salud en gimnasios y centros de bienestar.
              Multi-sede, RBAC, RGPD.
            </p>
          </div>

          {COLUMNAS.map((col) => (
            <div key={col.titulo}>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-landing-cream/40">
                {col.titulo}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.enlaces.map((enlace) => (
                  <li key={enlace.label}>
                    <a
                      href={enlace.href}
                      className="text-sm text-landing-cream/70 transition-colors hover:text-landing-naranja"
                    >
                      {enlace.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-landing-line-dark pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-landing-cream/40">
            © {new Date().getFullYear()} NutriFit Supervisor. Todos los derechos reservados.
          </p>
          <p className="text-xs text-landing-cream/40">
            Hecho para gimnasios que venden bienestar.
          </p>
        </div>
      </div>
    </footer>
  );
}
