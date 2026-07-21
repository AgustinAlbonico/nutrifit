import { User, Stethoscope, ClipboardList, Shield, Building2 } from 'lucide-react';

const ROLES = [
  {
    icono: User,
    nombre: 'Socio',
    descripcion: 'Reserva turnos online, completa su ficha de salud, sigue su plan alimentario y mide su progreso desde una sola cuenta.',
    tag: 'Paciente recurrente',
  },
  {
    icono: Stethoscope,
    nombre: 'Nutricionista',
    descripcion: 'Gestiona agenda, atiende pacientes, edita fichas clínicas con versionado, arma planes alimentarios manuales o con IA.',
    tag: 'Profesional de salud',
  },
  {
    icono: ClipboardList,
    nombre: 'Recepcionista',
    descripcion: 'Coordina turnos presenciales, confirma asistencia, ve disponibilidad — sin acceso a datos clínicos sensibles.',
    tag: 'Operación',
  },
  {
    icono: Shield,
    nombre: 'Admin',
    descripcion: 'Administra sedes, usuarios, profesionales y configuración del gimnasio. Reportes operativos en tiempo real.',
    tag: 'Por sede',
  },
  {
    icono: Building2,
    nombre: 'SuperAdmin',
    descripcion: 'Visión multi-sede, gestión global de la cadena, métricas consolidadas y control total del ecosistema.',
    tag: 'Multi-sede',
  },
];

export function RolesSeccion() {
  return (
    <section
      id="roles"
      className="landing-section landing-mesh-ink landing-dot-ink relative py-24 lg:py-32"
    >
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-landing-naranja">
            Roles y permisos
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-landing-cream sm:text-5xl lg:text-[3.5rem]">
            Una plataforma.
            <br />
            <span className="text-landing-naranja">Cinco experiencias.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-landing-cream/70">
            Cada rol ve exactamente lo que necesita. Control granular por permisos,
            datos clínicos protegidos por diseño, multi-sede nativo.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((rol) => (
            <article
              key={rol.nombre}
              className="landing-card-hover group relative flex flex-col rounded-2xl border border-landing-line-dark bg-landing-ink-soft/50 p-7 hover:border-landing-naranja/40 hover:bg-landing-ink-soft"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-landing-naranja-soft text-landing-naranja transition-colors group-hover:bg-landing-naranja group-hover:text-landing-ink">
                  <rol.icono className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="rounded-full border border-landing-line-dark px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-landing-cream/50">
                  {rol.tag}
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-landing-cream">
                {rol.nombre}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-landing-cream/60">
                {rol.descripcion}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3 rounded-xl border border-landing-line-dark bg-landing-ink-soft/40 px-6 py-5">
          <Shield className="h-5 w-5 text-landing-naranja" strokeWidth={1.75} />
          <p className="text-sm text-landing-cream/70">
            <span className="font-semibold text-landing-cream">RBAC por design.</span>{' '}
            Recepcionistas nunca ven datos clínicos. Nutricionistas solo ven pacientes con
            turno previo. Todo queda auditado.
          </p>
        </div>
      </div>
    </section>
  );
}
