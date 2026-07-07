import { RouterProvider } from '@tanstack/react-router';

import { useAuth } from '@/contexts/AuthContext';
import { GeneracionPlanIaProvider } from '@/contexts/GeneracionPlanIaContext';
import { ConsentimientoModal } from '@/components/consent';
import { router } from './router';

function App() {
  const auth = useAuth();

  return (
    <GeneracionPlanIaProvider>
      <RouterProvider router={router} context={{ auth }} />
      <ConsentimientoModal />
    </GeneracionPlanIaProvider>
  );
}

export default App;