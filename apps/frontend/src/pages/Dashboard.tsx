import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, KeyRound } from 'lucide-react';
import { DashboardNutricionista } from '@/pages/DashboardNutricionista';
import { DashboardSocio } from '@/pages/DashboardSocio';
import { DashboardRecepcionista } from '@/pages/DashboardRecepcionista';

export function Dashboard() {
  const { rol, permissions } = useAuth();

  if (rol === 'NUTRICIONISTA') {
    return <DashboardNutricionista />;
  }

  if (rol === 'SOCIO') {
    return <DashboardSocio />;
  }

  if (rol === 'RECEPCIONISTA') {
    return <DashboardRecepcionista />;
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="h-8 w-8 text-orange-500" />
            Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-base">
            Bienvenido al panel de control. Aqui puedes ver tu informacion de sesion y permisos.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-orange-400 to-rose-400" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rol Actual
            </CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rol}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-orange-400 to-rose-400" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-orange-500" />
            Mis Permisos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <Badge key={permission} className="border-0 bg-orange-100 text-orange-700 hover:bg-orange-200">
                {permission}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
