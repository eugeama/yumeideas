/**
 * Componente Button
 * 
 * Botón reutilizable con diferentes variantes y tamaños.
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Contenido del botón */
  children: ReactNode;
  /** Variante visual del botón */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg';
  /** Si el botón ocupa todo el ancho disponible */
  fullWidth?: boolean;
  /** Si el botón está en estado de carga */
  loading?: boolean;
}

/**
 * Componente de botón reutilizable
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Guardar
 * </Button>
 * 
 * <Button variant="outline" size="sm" loading>
 *   Cargando...
 * </Button>
 * ```
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const classes = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth && 'button--full-width',
    loading && 'button--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="button__spinner" />}
      <span className={loading ? 'button__content--loading' : 'button__content'}>
        {children}
      </span>
    </button>
  );
}
