import { RouterProvider } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { router } from './router';
import { ConsentimientoModal } from '@/components/consent';

function App() {
  const auth = useAuth();

  return (
    <>
      <RouterProvider router={router} context={{ auth }} />
      <ConsentimientoModal />
    </>
  );
}

export default App;