/**
 * Componente Loading
 * 
 * Muestra un indicador de carga (spinner) centrado en la pantalla
 * o inline según la prop `inline`.
 */

import './Loading.css';

interface LoadingProps {
  /** Tamaño del spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Si es true, muestra el spinner inline en lugar de centrado */
  inline?: boolean;
  /** Mensaje opcional a mostrar debajo del spinner */
  message?: string;
}

/**
 * Componente de indicador de carga
 * 
 * @example
 * ```tsx
 * // Spinner a pantalla completa
 * <Loading />
 * 
 * // Spinner inline pequeño
 * <Loading size="sm" inline />
 * 
 * // Con mensaje
 * <Loading message="Cargando publicaciones..." />
 * ```
 */
export function Loading({ size = 'md', inline = false, message }: LoadingProps) {
  const sizeClass = `loading-spinner--${size}`;
  const containerClass = inline ? 'loading-container--inline' : 'loading-container';

  return (
    <div className={containerClass}>
      <div className={`loading-spinner ${sizeClass}`} role="status" aria-label="Cargando">
        <div className="loading-spinner__circle"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}
