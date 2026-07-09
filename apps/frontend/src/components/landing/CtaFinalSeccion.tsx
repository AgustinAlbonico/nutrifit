import { useState, type FormEvent } from 'react';
import { ArrowRight, Mail, Phone, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CtaFinalSeccion() {
  const [enviado, establecerEnviado] = useState(false);

  const manejarEnvio = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    establecerEnviado(true);
  };

  return (
    <section
      id="contacto"
      className="landing-section relative overflow-hidden bg-landing-ink-deep py-24 lg:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 60% at 50% 100%, oklch(0.84 0.21 128 / 0.25), transparent 70%)',
        }}
        aria-hidden
      />
      <div className="landing-ribbon landing-ribbon-animated" style={{ top: '50%' }} aria-hidden />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center">
            <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-landing-lima">
              Agendá tu demo
            </span>
            <h2 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-landing-cream sm:text-5xl lg:text-[3.75rem]">
              Tu gimnasio,
              <br />
              <span className="text-landing-lima">operando en semanas.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-landing-cream/70">
              30 minutos de demo, sin compromiso. Te mostramos el flujo completo,
              respondemos dudas y armamos una propuesta para tu operación.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                'Demo personalizada por rol',
                'Cotización por número de sedes',
                'Plan de rollout sin lock-in',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-landing-cream/80">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-landing-lima" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-3 text-sm text-landing-cream/60">
              <a
                href="mailto:ventas@nutrifitsupervisor.com"
                className="landing-kinetic-line inline-flex w-fit items-center gap-2 hover:text-landing-cream"
              >
                <Mail className="h-4 w-4 text-landing-lima" />
                ventas@nutrifitsupervisor.com
              </a>
              <a
                href="tel:+541100000000"
                className="landing-kinetic-line inline-flex w-fit items-center gap-2 hover:text-landing-cream"
              >
                <Phone className="h-4 w-4 text-landing-lima" />
                +54 11 0000-0000
              </a>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-2xl border border-landing-line-dark bg-landing-ink-soft/60 p-7 backdrop-blur-md lg:p-9">
              {enviado ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-landing-lima text-landing-ink">
                    <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
                  </span>
                  <h3 className="mt-5 font-display text-2xl font-bold text-landing-cream">
                    ¡Gracias!
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-landing-cream/65">
                    Recibimos tu solicitud. Te contactamos en menos de 24hs hábiles.
                  </p>
                </div>
              ) : (
                <form onSubmit={manejarEnvio} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="nombre" className="text-xs font-medium uppercase tracking-wide text-landing-cream/60">
                      Nombre
                    </label>
                    <Input
                      id="nombre"
                      name="nombre"
                      required
                      placeholder="¿Cómo te llamás?"
                      className="border-landing-line-dark bg-landing-ink/60 text-landing-cream placeholder:text-landing-cream/30 focus-visible:border-landing-lima focus-visible:ring-landing-lima/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-landing-cream/60">
                      Email laboral
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="vos@gimnasio.com"
                      className="border-landing-line-dark bg-landing-ink/60 text-landing-cream placeholder:text-landing-cream/30 focus-visible:border-landing-lima focus-visible:ring-landing-lima/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="gimnasio" className="text-xs font-medium uppercase tracking-wide text-landing-cream/60">
                      Gimnasio / organización
                    </label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-landing-cream/40" />
                      <Input
                        id="gimnasio"
                        name="gimnasio"
                        required
                        placeholder="Nombre del gimnasio"
                        className="border-landing-line-dark bg-landing-ink/60 pl-9 text-landing-cream placeholder:text-landing-cream/30 focus-visible:border-landing-lima focus-visible:ring-landing-lima/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="sedes" className="text-xs font-medium uppercase tracking-wide text-landing-cream/60">
                      Cantidad de sedes
                    </label>
                    <Input
                      id="sedes"
                      name="sedes"
                      type="number"
                      min={1}
                      defaultValue={1}
                      className="border-landing-line-dark bg-landing-ink/60 text-landing-cream placeholder:text-landing-cream/30 focus-visible:border-landing-lima focus-visible:ring-landing-lima/30"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="group mt-2 w-full bg-landing-lima text-landing-ink hover:bg-landing-lima-bright"
                  >
                    Solicitar demo
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>

                  <p className="text-center text-[11px] leading-relaxed text-landing-cream/40">
                    Al enviar aceptás ser contactado por el equipo de NutriFit Supervisor.
                    No compartimos tus datos.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
