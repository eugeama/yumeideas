/**
 * Formulario de creación/edición de publicación
 * 
 * T083: Textarea de contenido, toggle de visibilidad (público/privado),
 * botones guardar/cancelar
 */

import { useState, FormEvent } from 'react';
import { Button } from '../common/Button';
import { PostVisibility } from '../../../domain/enums/PostVisibility';
import './PostForm.css';

interface PostFormProps {
  /** Contenido inicial (para edición) */
  initialContent?: string;
  /** Visibilidad inicial (para edición) */
  initialVisibility?: PostVisibility;
  /** Indica si es modo edición */
  isEditing?: boolean;
  /** Callback al guardar */
  onSave: (content: string, visibility: PostVisibility) => void | Promise<void>;
  /** Callback al cancelar */
  onCancel: () => void;
  /** Indica si está guardando */
  loading?: boolean;
}

export function PostForm({
  initialContent = '',
  initialVisibility = PostVisibility.PUBLICA,
  isEditing = false,
  onSave,
  onCancel,
  loading = false,
}: PostFormProps) {
  const [content, setContent] = useState(initialContent);
  const [visibility, setVisibility] = useState<PostVisibility>(initialVisibility);
  const [error, setError] = useState<string>('');

  const maxLength = 500;
  const remainingChars = maxLength - content.length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar contenido no vacío
    if (!content.trim()) {
      setError('El contenido no puede estar vacío');
      return;
    }

    // Validar longitud máxima
    if (content.length > maxLength) {
      setError(`El contenido no puede exceder ${maxLength} caracteres`);
      return;
    }

    try {
      await onSave(content, visibility);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la publicación');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="post-form">
      <div className="post-form-header">
        <h2>{isEditing ? 'Editar publicación' : 'Nueva publicación'}</h2>
      </div>

      {error && (
        <div className="post-form-error">
          {error}
        </div>
      )}

      <div className="post-form-content">
        <textarea
          className="post-form-textarea"
          placeholder="¿Qué idea quieres compartir?"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError('');
          }}
          maxLength={maxLength}
          rows={5}
          disabled={loading}
        />
        <div className="post-form-counter">
          <span className={remainingChars < 50 ? 'warning' : ''}>
            {remainingChars} caracteres restantes
          </span>
        </div>
      </div>

      <div className="post-form-visibility">
        <label className="visibility-label">Visibilidad:</label>
        <div className="visibility-options">
          <label className="visibility-option">
            <input
              type="radio"
              name="visibility"
              value={PostVisibility.PUBLICA}
              checked={visibility === PostVisibility.PUBLICA}
              onChange={() => setVisibility(PostVisibility.PUBLICA)}
              disabled={loading}
            />
            <span className="visibility-option-label">
              <span className="visibility-icon">🌐</span>
              <span className="visibility-text">
                <strong>Pública</strong>
                <small>Visible para todos los usuarios</small>
              </span>
            </span>
          </label>

          <label className="visibility-option">
            <input
              type="radio"
              name="visibility"
              value={PostVisibility.PRIVADA}
              checked={visibility === PostVisibility.PRIVADA}
              onChange={() => setVisibility(PostVisibility.PRIVADA)}
              disabled={loading}
            />
            <span className="visibility-option-label">
              <span className="visibility-icon">🔒</span>
              <span className="visibility-text">
                <strong>Privada</strong>
                <small>Solo visible para ti y administradores</small>
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="post-form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading || !content.trim()}
        >
          {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Publicar'}
        </Button>
      </div>
    </form>
  );
}
