/**
 * Componente Footer
 * 
 * Pie de página de la aplicación.
 */

import './Footer.css';

/**
 * Componente de pie de página de la aplicación
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        <p className="footer__text">
          © {currentYear} Yumeideas. Todos los derechos reservados.
        </p>
        
        <div className="footer__links">
          <a href="#" className="footer__link">
            Términos de servicio
          </a>
          <span className="footer__separator">•</span>
          <a href="#" className="footer__link">
            Privacidad
          </a>
          <span className="footer__separator">•</span>
          <a href="#" className="footer__link">
            Ayuda
          </a>
        </div>
      </div>
    </footer>
  );
}
