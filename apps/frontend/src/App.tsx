import { RouterProvider } from '@tanstack/react-router';

import { useAuth } from '@/contexts/AuthContext';
import { GeneracionPlanIaProvider } from '@/contexts/GeneracionPlanIaContext';
import { router } from './router';

function App() {
  const auth = useAuth();

  return (
    <GeneracionPlanIaProvider>
      <RouterProvider router={router} context={{ auth }} />
    </GeneracionPlanIaProvider>
  );
}

export default App;