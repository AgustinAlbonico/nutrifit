import { Outlet } from '@tanstack/react-router';

import { Sidebar } from './Sidebar';
import { ImpersonationIndicator } from '@/components/admin/ImpersonationIndicator';
import { BannerConsultaActiva } from './BannerConsultaActiva';
import { BadgeGeneracionPlanIa } from '@/components/ia/BadgeGeneracionPlanIa';

export function MainLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground relative">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-muted/10 p-4 lg:p-6">
        <div className="w-full">
          <ImpersonationIndicator />
          <div className="mt-4">
            <Outlet />
          </div>
        </div>
      </main>
      <BannerConsultaActiva />
      <BadgeGeneracionPlanIa />
    </div>
  );
}
