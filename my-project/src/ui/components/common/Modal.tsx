/**
 * Componente Modal
 * 
 * Modal reutilizable con backdrop, animaciones y accesibilidad.
 */

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

interface ModalProps {
  /** Si el modal está abierto */
  isOpen: boolean;
  /** Función a llamar al cerrar el modal */
  onClose: () => void;
  /** Título del modal */
  title?: string;
  /** Contenido del modal */
  children: ReactNode;
  /** Footer del modal (típicamente botones) */
  footer?: ReactNode;
  /** Tamaño del modal */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Si se puede cerrar haciendo click fuera del modal */
  closeOnBackdropClick?: boolean;
}

/**
 * Componente de modal reutilizable
 * 
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirmar acción"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={() => setIsOpen(false)}>
 *         Cancelar
 *       </Button>
 *       <Button variant="danger" onClick={handleDelete}>
 *         Borrar
 *       </Button>
 *     </>
 *   }
 * >
 *   <p>¿Estás seguro de que deseas borrar esta publicación?</p>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
}: ModalProps) {
  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll en el body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  const modalContent = (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        <div className="modal-header">
          {title && (
            <h2 className="modal-title" id="modal-title">
              {title}
            </h2>
          )}
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );

  // Renderizar en un portal para que aparezca fuera del DOM tree
  return createPortal(modalContent, document.body);
}
