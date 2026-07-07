/**
 * Componente Input
 * 
 * Input reutilizable con soporte para diferentes tipos,
 * etiquetas, mensajes de error y estados.
 */

import { InputHTMLAttributes, ReactNode } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Etiqueta del input */
  label?: string;
  /** Mensaje de error a mostrar */
  error?: string;
  /** Texto de ayuda a mostrar debajo del input */
  helperText?: string;
  /** Icono a mostrar antes del input */
  iconBefore?: ReactNode;
  /** Icono a mostrar después del input */
  iconAfter?: ReactNode;
}

/**
 * Componente de input reutilizable
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="tu@email.com"
 *   error={errors.email}
 * />
 * ```
 */
export function Input({
  label,
  error,
  helperText,
  iconBefore,
  iconAfter,
  className = '',
  disabled,
  ...props
}: InputProps) {
  const hasError = Boolean(error);
  const inputClasses = [
    'input',
    hasError && 'input--error',
    disabled && 'input--disabled',
    iconBefore && 'input--with-icon-before',
    iconAfter && 'input--with-icon-after',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="input-wrapper">
      {label && (
        <label className="input-label" htmlFor={props.id}>
          {label}
          {props.required && <span className="input-label__required">*</span>}
        </label>
      )}
      
      <div className="input-container">
        {iconBefore && <span className="input-icon input-icon--before">{iconBefore}</span>}
        
        <input
          className={inputClasses}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            error
              ? `${props.id}-error`
              : helperText
              ? `${props.id}-helper`
              : undefined
          }
          {...props}
        />
        
        {iconAfter && <span className="input-icon input-icon--after">{iconAfter}</span>}
      </div>
      
      {error && (
        <p className="input-error" id={`${props.id}-error`} role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="input-helper" id={`${props.id}-helper`}>
          {helperText}
        </p>
      )}
    </div>
  );
}
