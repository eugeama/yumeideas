/**
 * Componente de ruta de solo-admin
 * 
 * Redirige a /login si el usuario no está autenticado.
 * Redirige a / (feed) si el usuario no es administrador.
 * Muestra un indicador de carga mientras se verifica la autenticación.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loading } from './common/Loading';

/**
 * Componente que protege rutas requiriendo rol de administrador
 * 
 * Uso con React Router v6:
 * ```tsx
 * <Route element={<AdminRoute />}>
 *   <Route path="/admin" element={<AdminPanelPage />} />
 * </Route>
 * ```
 */
export function AdminRoute() {
  const { firebaseUser, isAdmin, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return <Loading />;
  }

  // Si no hay usuario autenticado, redirigir a login
  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario no es admin, redirigir al feed
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Usuario es admin: renderizar rutas hijas
  return <Outlet />;
}
