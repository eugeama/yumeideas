/**
 * Configuración de rutas de la aplicación
 * 
 * Rutas públicas:
 * - /login - Inicio de sesión
 * - /register - Registro de usuario
 * - /forgot-password - Recuperación de contraseña
 * 
 * Rutas protegidas (requieren autenticación):
 * - / (feed) - Feed público de publicaciones
 * - /profile - Perfil del usuario actual
 * - /profile/edit - Edición de perfil
 * 
 * Rutas de admin (requieren rol admin):
 * - /admin - Panel de administración
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ui/components/ProtectedRoute';
import { AdminRoute } from './ui/components/AdminRoute';

// Importar páginas de Fase 8
import { LoginPage } from './ui/pages/LoginPage';
import { RegisterPage } from './ui/pages/RegisterPage';
import { ForgotPasswordPage } from './ui/pages/ForgotPasswordPage';
import { FeedPage } from './ui/pages/FeedPage';
import { ProfilePage } from './ui/pages/ProfilePage';
import { EditProfilePage } from './ui/pages/EditProfilePage';
import { AdminPanelPage } from './ui/pages/AdminPanelPage';

/**
 * Configuración del router con React Router v6
 */
export const router = createBrowserRouter([
  // Rutas públicas
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },

  // Rutas protegidas (requieren autenticación)
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <FeedPage />,
      },
      {
        path: 'feed',
        element: <Navigate to="/" replace />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'profile/edit',
        element: <EditProfilePage />,
      },
    ],
  },

  // Rutas de admin (requieren rol admin)
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        index: true,
        element: <AdminPanelPage />,
      },
    ],
  },

  // Ruta 404
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
