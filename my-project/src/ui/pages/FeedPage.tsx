/**
 * Pantalla de feed público
 * 
 * T081: Feed público paginado con scroll infinito o botón "cargar más"
 * T091: Conectar con postService.getPublicFeed()
 */

import { useState, useEffect } from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { PostList, PostData } from '../components/post/PostList';
import { PostService } from '../../application/services/postService';
import { LikeService } from '../../application/services/likeService';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { PostForm } from '../components/post/PostForm';
import { PostVisibility } from '../../domain/enums/PostVisibility';
import './FeedPage.css';

export function FeedPage() {
  const { usuario, isAdmin } = useAuth();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | undefined>();
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // T091: Cargar feed inicial
  useEffect(() => {
    loadInitialFeed();
  }, []);

  const loadInitialFeed = async () => {
    setInitialLoading(true);
    setError('');

    try {
      const result = await PostService.getPublicFeed(20);
      
      // Convertir Publicacion[] a PostData[]
      const postsData: PostData[] = await Promise.all(
        result.posts.map(async (pub) => {
          // Verificar si el usuario actual ya dio like
          const hasLiked = usuario 
            ? await LikeService.hasUserLiked(pub.id, usuario.uid)
            : false;

          return {
            id: pub.id,
            content: pub.contenido,
            authorId: pub.autorId,
            authorUsername: pub.autorUsername,
            authorRole: pub.autorRol,
            visibility: pub.visibilidad,
            createdAt: pub.fechaCreacion,
            likesCount: pub.likesCount,
            hasLiked,
          };
        })
      );

      setPosts(postsData);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err: any) {
      console.error('Error al cargar feed:', err);
      setError('Error al cargar las publicaciones. Intenta nuevamente.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError('');

    try {
      const result = await PostService.getPublicFeed(20, lastDoc);
      
      const postsData: PostData[] = await Promise.all(
        result.posts.map(async (pub) => {
          const hasLiked = usuario 
            ? await LikeService.hasUserLiked(pub.id, usuario.uid)
            : false;

          return {
            id: pub.id,
            content: pub.contenido,
            authorId: pub.autorId,
            authorUsername: pub.autorUsername,
            authorRole: pub.autorRol,
            visibility: pub.visibilidad,
            createdAt: pub.fechaCreacion,
            likesCount: pub.likesCount,
            hasLiked,
          };
        })
      );

      setPosts([...posts, ...postsData]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err: any) {
      console.error('Error al cargar más publicaciones:', err);
      setError('Error al cargar más publicaciones.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!usuario) {
      setError('Debes iniciar sesión para dar "me gusta"');
      return;
    }

    // T095: Estado optimista
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          hasLiked: !post.hasLiked,
          likesCount: post.hasLiked ? post.likesCount - 1 : post.likesCount + 1,
        };
      }
      return post;
    }));

    try {
      const result = await LikeService.toggleLike(postId, usuario);

      if (!result.success) {
        // Rollback en caso de error
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              hasLiked: !post.hasLiked,
              likesCount: post.hasLiked ? post.likesCount - 1 : post.likesCount + 1,
            };
          }
          return post;
        }));
        setError(result.error || 'Error al procesar "me gusta"');
      }
    } catch (err: any) {
      // Rollback en caso de error
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            hasLiked: !post.hasLiked,
            likesCount: post.hasLiked ? post.likesCount - 1 : post.likesCount + 1,
          };
        }
        return post;
      }));
      console.error('Error al dar like:', err);
      setError('Error al procesar "me gusta"');
    }
  };

  const handleEdit = (postId: string) => {
    // TODO: Implementar edición inline o modal
    console.log('Editar post:', postId);
  };

  const handleDelete = async (postId: string) => {
    if (!usuario) return;

    if (!confirm('¿Estás seguro de que quieres borrar esta publicación?')) {
      return;
    }

    try {
      const result = await PostService.deletePost(postId, usuario);

      if (!result.success) {
        setError(result.error || 'Error al borrar publicación');
        return;
      }

      // Actualizar lista eliminando la publicación
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err: any) {
      console.error('Error al borrar publicación:', err);
      setError('Error al borrar publicación');
    }
  };

  const handleCreatePost = async (content: string, visibility: PostVisibility) => {
    if (!usuario) return;

    try {
      const result = await PostService.createPost({
        contenido: content,
        visibilidad: visibility,
        autorId: usuario.uid,
        autorUsername: usuario.username,
        autorRol: usuario.rol,
      });

      if (!result.success) {
        setError(result.error || 'Error al crear publicación');
        return;
      }

      setShowCreateModal(false);
      
      // Recargar feed para mostrar la nueva publicación
      await loadInitialFeed();
    } catch (err: any) {
      console.error('Error al crear publicación:', err);
      setError('Error al crear publicación');
    }
  };

  if (initialLoading) {
    return (
      <div className="feed-page">
        <div className="feed-container">
          <header className="feed-header">
            <h1>Feed público</h1>
            <p>Descubre las ideas más recientes de la comunidad</p>
          </header>
          <div className="feed-loading">Cargando publicaciones...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <div className="feed-container">
        <header className="feed-header">
          <h1>Feed público</h1>
          <p>Descubre las ideas más recientes de la comunidad</p>
        </header>

        {error && (
          <div className="feed-error">
            {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        <div className="feed-content">
          <PostList
            posts={posts}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            currentUserId={usuario?.uid || ''}
            isAdmin={isAdmin}
            onLike={handleLike}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage="No hay publicaciones públicas aún. ¡Sé el primero en publicar!"
          />
        </div>

        {/* Botón flotante para crear publicación */}
        {usuario && (
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="feed-create-button"
          >
            + Nueva publicación
          </Button>
        )}
      </div>

      {/* Modal para crear publicación */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Nueva publicación"
        >
          <PostForm
            onSave={handleCreatePost}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}
