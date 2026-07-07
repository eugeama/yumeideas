/**
 * Componente de tarjeta de publicación
 * 
 * T084: Muestra contenido, autor (username + badge si admin), fecha,
 * contador de likes, botón de like (corazón), botón de editar (solo si es propio),
 * botón de borrar (si es propio o admin)
 */

import { Button } from '../common/Button';
import { UserRole } from '../../../domain/enums/UserRole';
import { PostVisibility } from '../../../domain/enums/PostVisibility';
import './PostCard.css';

interface PostCardProps {
  /** ID de la publicación */
  id: string;
  /** Contenido de la publicación */
  content: string;
  /** ID del autor */
  authorId: string;
  /** Username del autor */
  authorUsername: string;
  /** Rol del autor */
  authorRole: UserRole;
  /** Visibilidad de la publicación */
  visibility: PostVisibility;
  /** Fecha de creación */
  createdAt: Date;
  /** Contador de likes */
  likesCount: number;
  /** Si el usuario actual ya dio like */
  hasLiked?: boolean;
  /** Si el usuario actual es el autor */
  isOwner?: boolean;
  /** Si el usuario actual es admin */
  isAdmin?: boolean;
  /** Callback al dar/quitar like */
  onLike?: () => void;
  /** Callback al editar */
  onEdit?: () => void;
  /** Callback al borrar */
  onDelete?: () => void;
}

export function PostCard({
  content,
  authorUsername,
  authorRole,
  visibility,
  createdAt,
  likesCount,
  hasLiked = false,
  isOwner = false,
  isAdmin = false,
  onLike,
  onEdit,
  onDelete,
}: PostCardProps) {
  const isAuthorAdmin = authorRole === UserRole.ADMIN;
  const isPrivate = visibility === PostVisibility.PRIVADA;
  const canEdit = isOwner;
  const canDelete = isOwner || isAdmin;
  const canLike = !isOwner && !isPrivate; // No se puede dar like a publicaciones propias ni privadas

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Hace unos segundos';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  return (
    <article className="post-card">
      <div className="post-card-header">
        <div className="post-card-author">
          <span className="author-username">{authorUsername}</span>
          {isAuthorAdmin && (
            <span className="author-badge admin-badge" title="Administrador">
              Admin
            </span>
          )}
          {isPrivate && (
            <span className="visibility-badge private-badge" title="Publicación privada">
              🔒 Privada
            </span>
          )}
        </div>
        <time className="post-card-date" dateTime={createdAt.toISOString()}>
          {formatDate(createdAt)}
        </time>
      </div>

      <div className="post-card-content">
        <p>{content}</p>
      </div>

      <div className="post-card-footer">
        <div className="post-card-stats">
          {canLike && (
            <button
              className={`like-button ${hasLiked ? 'liked' : ''}`}
              onClick={onLike}
              aria-label={hasLiked ? 'Quitar me gusta' : 'Me gusta'}
              title={hasLiked ? 'Quitar me gusta' : 'Me gusta'}
            >
              <span className="like-icon">{hasLiked ? '❤️' : '🤍'}</span>
              <span className="like-count">{likesCount}</span>
            </button>
          )}
          {!canLike && likesCount > 0 && (
            <div className="like-display">
              <span className="like-icon">❤️</span>
              <span className="like-count">{likesCount}</span>
            </div>
          )}
        </div>

        <div className="post-card-actions">
          {canEdit && onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onEdit}
            >
              Editar
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={onDelete}
            >
              Borrar
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
