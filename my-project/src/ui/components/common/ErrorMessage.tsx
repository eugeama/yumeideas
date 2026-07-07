/**
 * Componente ErrorMessage
 * 
 * Muestra mensajes de error con iconos y opciones de cierre.
 */

import './ErrorMessage.css';

interface ErrorMessageProps {
  /** Mensaje de error a mostrar */
  message: string;
  /** Título del error (opcional) */
  title?: string;
  /** Si se puede cerrar el mensaje */
  dismissible?: boolean;
  /** Callback al cerrar el mensaje */
  onDismiss?: () => void;
  /** Variante visual */
  variant?: 'error' | 'warning' | 'info' | 'success';
}

/**
 * Componente para mostrar mensajes de error/advertencia/info
 * 
 * @example
 * ```tsx
 * <ErrorMessage
 *   message="No se pudo cargar las publicaciones"
 *   dismissible
 *   onDismiss={() => setError(null)}
 * />
 * ```
 */
export function ErrorMessage({
  message,
  title,
  dismissible = false,
  onDismiss,
  variant = 'error',
}: ErrorMessageProps) {
  const icons = {
    error: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    success: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div className={`error-message error-message--${variant}`} role="alert">
      <div className="error-message__icon">{icons[variant]}</div>
      
      <div className="error-message__content">
        {title && <p className="error-message__title">{title}</p>}
        <p className="error-message__text">{message}</p>
      </div>
      
      {dismissible && onDismiss && (
        <button
          className="error-message__close"
          onClick={onDismiss}
          aria-label="Cerrar mensaje"
          type="button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="15" y1="5" x2="5" y2="15"></line>
            <line x1="5" y1="5" x2="15" y2="15"></line>
          </svg>
        </button>
      )}
    </div>
  );
}
