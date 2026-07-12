/**
 * Componente Header
 * 
 * Cabecera principal de la aplicación con navegación y menú de usuario.
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';
import './Header.css';

/**
 * Componente de cabecera de la aplicación
 */
export function Header() {
  const { usuario, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="header">
      <div className="header__container">
        {/* Logo */}
        <Link to="/" className="header__logo">
          <span className="header__logo-icon">💡</span>
          <span className="header__logo-text">Yumeideas</span>
        </Link>

        {/* Navegación */}
        {usuario && !loading && (
          <nav className="header__nav">
            <Link to="/" className="header__nav-link">
              Feed
            </Link>
            <Link to="/profile" className="header__nav-link">
              Mi Perfil
            </Link>
          </nav>
        )}

        {/* Menú de usuario */}
        <div className="header__user">
          {loading ? (
            <div className="header__user-loading">Cargando...</div>
          ) : usuario ? (
            <>
              <span className="header__username">
                {usuario.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                Cerrar sesión
              </Button>
            </>
          ) : (
            <div className="header__auth-links">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Iniciar sesión
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
