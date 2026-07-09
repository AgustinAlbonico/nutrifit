import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSeccion } from '@/components/landing/HeroSeccion';
import { ProblemaSeccion } from '@/components/landing/ProblemaSeccion';
import { RolesSeccion } from '@/components/landing/RolesSeccion';
import { FuncionalidadesSeccion } from '@/components/landing/FuncionalidadesSeccion';
import { ComoFuncionaSeccion } from '@/components/landing/ComoFuncionaSeccion';
import { SuscripcionSeccion } from '@/components/landing/SuscripcionSeccion';
import { ModulosPremiumSeccion } from '@/components/landing/ModulosPremiumSeccion';
import { CtaFinalSeccion } from '@/components/landing/CtaFinalSeccion';
import { FooterSeccion } from '@/components/landing/FooterSeccion';

export function Landing() {
  return (
    <div className="relative min-h-screen bg-landing-ink text-landing-cream">
      <LandingNav />
      <main>
        <HeroSeccion />
        <ProblemaSeccion />
        <RolesSeccion />
        <FuncionalidadesSeccion />
        <ComoFuncionaSeccion />
        <SuscripcionSeccion />
        <ModulosPremiumSeccion />
        <CtaFinalSeccion />
      </main>
      <FooterSeccion />
    </div>
  );
}
