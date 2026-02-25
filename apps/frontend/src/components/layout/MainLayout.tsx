import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-muted/10 p-4 lg:p-6">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
