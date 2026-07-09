import { Wrench, GraduationCap, Rocket } from 'lucide-react';

const PASOS = [
  {
    numero: '01',
    icono: Wrench,
    titulo: 'Implementación',
    duracion: '1-2 semanas',
    descripcion:
      'Configuramos tu gimnasio, cargamos datos iniciales, damos de alta profesionales y sedes. Migración desde planillas o sistemas previos si los tenés.',
    entregables: ['Setup de sedes y roles', 'Carga inicial de socios', 'Configuración de agendas'],
  },
  {
    numero: '02',
    icono: GraduationCap,
    titulo: 'Capacitación',
    duracion: '2-3 sesiones',
    descripcion:
      'Entrenamos a tu equipo por rol: nutricionistas, recepcionistas, admins. Documentación y soporte durante el rollout.',
    entregables: ['Training por rol', 'Manual operativo', 'Soporte onboarding'],
  },
  {
    numero: '03',
    icono: Rocket,
    titulo: 'Operación',
    duracion: 'Continuo',
    descripcion:
      'Tu gimnasio opera con el sistema en producción. Medimos uso, escuchamos feedback y mejoramos junto a vos. Esto no es una venta única.',
    entregables: ['Soporte continuo', 'Actualizaciones', 'Métricas de adopción'],
  },
];

export function ComoFuncionaSeccion() {
  return (
    <section
      id="como-funciona"
      className="landing-section landing-mesh-ink landing-dot-ink relative py-24 lg:py-32"
    >
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-landing-lima">
            Cómo funciona
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-landing-cream sm:text-5xl lg:text-[3.5rem]">
            De cero a operando
            <br />
            <span className="text-landing-lima">en menos de un mes.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-landing-cream/70">
            Acompañamos cada etapa. No te dejamos solo con un software y un manual.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PASOS.map((paso, indice) => (
            <div key={paso.numero} className="relative">
              {indice < PASOS.length - 1 && (
                <div
                  className="absolute left-[3.25rem] top-16 hidden h-px w-[calc(100%-3rem)] bg-gradient-to-r from-landing-lima/40 to-transparent lg:block"
                  aria-hidden
                />
              )}
              <article className="relative flex flex-col rounded-2xl border border-landing-line-dark bg-landing-ink-soft/40 p-7">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-landing-lima text-landing-ink">
                    <paso.icono className="h-7 w-7" strokeWidth={1.75} />
                  </span>
                  <div>
                    <span className="font-display text-xs font-semibold uppercase tracking-wider text-landing-lima">
                      Paso {paso.numero}
                    </span>
                    <h3 className="font-display text-2xl font-bold text-landing-cream">
                      {paso.titulo}
                    </h3>
                  </div>
                </div>

                <span className="mt-5 inline-flex w-fit items-center rounded-full border border-landing-line-dark px-3 py-1 text-xs font-medium text-landing-cream/60">
                  {paso.duracion}
                </span>

                <p className="mt-4 text-sm leading-relaxed text-landing-cream/65">
                  {paso.descripcion}
                </p>

                <ul className="mt-5 space-y-2 border-t border-landing-line-dark pt-5">
                  {paso.entregables.map((entregable) => (
                    <li key={entregable} className="flex items-center gap-2 text-sm text-landing-cream/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-landing-lima" />
                      {entregable}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
