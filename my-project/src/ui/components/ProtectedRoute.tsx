/**
 * Componente de ruta protegida
 * 
 * Redirige a /login si el usuario no está autenticado.
 * Muestra un indicador de carga mientras se verifica la autenticación.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loading } from './common/Loading';

/**
 * Componente que protege rutas requiriendo autenticación
 * 
 * Uso con React Router v6:
 * ```tsx
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/profile" element={<ProfilePage />} />
 *   <Route path="/feed" element={<FeedPage />} />
 * </Route>
 * ```
 */
export function ProtectedRoute() {
  const { firebaseUser, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return <Loading />;
  }

  // Si no hay usuario autenticado, redirigir a login
  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  // Usuario autenticado: renderizar rutas hijas
  return <Outlet />;
}
