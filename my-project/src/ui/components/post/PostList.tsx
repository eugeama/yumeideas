/**
 * Componente de lista de publicaciones
 * 
 * T085: Reutilizable para feed, perfil, admin
 */

import { PostCard } from './PostCard';
import { Loading } from '../common/Loading';
import { Button } from '../common/Button';
import { UserRole } from '../../../domain/enums/UserRole';
import { PostVisibility } from '../../../domain/enums/PostVisibility';
import './PostList.css';

export interface PostData {
  id: string;
  content: string;
  authorId: string;
  authorUsername: string;
  authorRole: UserRole;
  visibility: PostVisibility;
  createdAt: Date;
  likesCount: number;
  hasLiked?: boolean;
}

interface PostListProps {
  /** Lista de publicaciones */
  posts: PostData[];
  /** Indica si está cargando */
  loading?: boolean;
  /** Indica si hay más publicaciones para cargar */
  hasMore?: boolean;
  /** Callback para cargar más publicaciones */
  onLoadMore?: () => void;
  /** ID del usuario actual (para determinar si es dueño) */
  currentUserId?: string;
  /** Si el usuario actual es admin */
  isAdmin?: boolean;
  /** Callback al dar/quitar like */
  onLike?: (postId: string) => void;
  /** Callback al editar */
  onEdit?: (postId: string) => void;
  /** Callback al borrar */
  onDelete?: (postId: string) => void;
  /** Mensaje cuando no hay publicaciones */
  emptyMessage?: string;
}

export function PostList({
  posts,
  loading = false,
  hasMore = false,
  onLoadMore,
  currentUserId,
  isAdmin = false,
  onLike,
  onEdit,
  onDelete,
  emptyMessage = 'No hay publicaciones para mostrar',
}: PostListProps) {
  if (loading && posts.length === 0) {
    return (
      <div className="post-list-loading">
        <Loading />
        <p>Cargando publicaciones...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="post-list-empty">
        <div className="empty-icon">📝</div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="post-list">
      <div className="post-list-items">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            content={post.content}
            authorId={post.authorId}
            authorUsername={post.authorUsername}
            authorRole={post.authorRole}
            visibility={post.visibility}
            createdAt={post.createdAt}
            likesCount={post.likesCount}
            hasLiked={post.hasLiked}
            isOwner={currentUserId === post.authorId}
            isAdmin={isAdmin}
            onLike={onLike ? () => onLike(post.id) : undefined}
            onEdit={onEdit ? () => onEdit(post.id) : undefined}
            onDelete={onDelete ? () => onDelete(post.id) : undefined}
          />
        ))}
      </div>

      {hasMore && (
        <div className="post-list-load-more">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Cargando...' : 'Cargar más publicaciones'}
          </Button>
        </div>
      )}

      {loading && posts.length > 0 && (
        <div className="post-list-loading-more">
          <Loading size="sm" />
        </div>
      )}
    </div>
  );
}
