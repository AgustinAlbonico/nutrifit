import { MainLayout } from '@/components/layout/MainLayout';

export function AuthLayoutComponent() {
  // Ya no verificamos isAuthenticated aquí
  // El router se encarga de las redirecciones con beforeLoad

  return <MainLayout />;
}
