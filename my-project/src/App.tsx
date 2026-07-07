/**
 * Componente principal de la aplicación
 * 
 * Configura el router, contextos globales y layout base.
 */

import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './ui/hooks/useAuth';
import { router } from './routes';
import './ui/styles/global.css';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
