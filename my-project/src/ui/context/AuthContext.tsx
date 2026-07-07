/**
 * Contexto de autenticación
 * 
 * Proporciona el estado de autenticación global de la aplicación
 * incluyendo el usuario actual, su rol, estado de carga y métodos
 * para login/logout.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../infrastructure/firebase/config';
import { Usuario } from '../../domain/models/Usuario';
import { AuthService } from '../../application/services/authService';
import { UserService } from '../../application/services/userService';

/**
 * Estado de autenticación de la aplicación
 */
interface AuthContextType {
  /** Usuario de Firebase Auth (null si no autenticado) */
  firebaseUser: FirebaseUser | null;
  
  /** Datos completos del usuario desde Firestore (null si no autenticado) */
  usuario: Usuario | null;
  
  /** Indica si se está cargando el estado de autenticación */
  loading: boolean;
  
  /** Indica si el usuario actual es administrador */
  isAdmin: boolean;
  
  /** Método para cerrar sesión */
  logout: () => Promise<void>;
  
  /** Método para refrescar los datos del usuario */
  refreshUser: () => Promise<void>;
}

/**
 * Contexto de autenticación
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props del provider de autenticación
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider del contexto de autenticación
 * 
 * Escucha cambios en el estado de autenticación de Firebase
 * y sincroniza con los datos del usuario en Firestore.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Cargar datos del usuario desde Firestore
   */
  const loadUserData = async (uid: string) => {
    try {
      const userData = await UserService.getUserData(uid);
      setUsuario(userData);
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      setUsuario(null);
    }
  };

  /**
   * Refrescar datos del usuario actual
   */
  const refreshUser = async () => {
    if (firebaseUser) {
      await loadUserData(firebaseUser.uid);
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    try {
      await AuthService.logout();
      setFirebaseUser(null);
      setUsuario(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  /**
   * Escuchar cambios en el estado de autenticación de Firebase
   */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // Usuario autenticado: cargar datos de Firestore
        await loadUserData(user.uid);
      } else {
        // Usuario no autenticado: limpiar estado
        setUsuario(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    firebaseUser,
    usuario,
    loading,
    isAdmin: usuario?.isAdmin() ?? false,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder al contexto de autenticación
 * 
 * @throws Error si se usa fuera de un AuthProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { usuario, loading, isAdmin, logout } = useAuth();
 *   
 *   if (loading) return <Loading />;
 *   if (!usuario) return <Redirect to="/login" />;
 *   
 *   return <div>Hola {usuario.username}</div>;
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  
  return context;
}
