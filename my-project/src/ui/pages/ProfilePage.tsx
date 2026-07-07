/**
 * Pantalla de perfil propio
 * 
 * T082: Perfil propio con tabs: "Mis publicaciones públicas" y "Mis publicaciones privadas"
 * T092: Conectar con postService.getUserPosts()
 */

import { useState, useEffect } from 'react';
import { PostList, PostData } from '../components/post/PostList';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { PostForm } from '../components/post/PostForm';
import { PostVisibility } from '../../domain/enums/PostVisibility';
import { PostService } from '../../application/services/postService';
import { LikeService } from '../../application/services/likeService';
import { useAuth } from '../hooks/useAuth';
import './ProfilePage.css';

type TabType = 'publicas' | 'privadas';

export function ProfilePage() {
  const { usuario, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('publicas');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [allPosts, setAllPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // T092: Cargar publicaciones del usuario
  useEffect(() => {
    loadUserPosts();
  }, [usuario]);

  const loadUserPosts = async () => {
    if (!usuario) return;

    setLoading(true);
    setError('');

    try {
      const result = await PostService.getUserPosts(usuario.uid, usuario);
      
      // Convertir Publicacion[] a PostData[]
      const postsData: PostData[] = await Promise.all(
        result.posts.map(async (pub) => {
          const hasLiked = await LikeService.hasUserLiked(pub.id, usuario.uid);

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

      setAllPosts(postsData);
    } catch (err: any) {
      console.error('Error al cargar publicaciones:', err);
      setError('Error al cargar tus publicaciones.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar publicaciones por tab
  const publicPosts = allPosts.filter(p => p.visibility === PostVisibility.PUBLICA);
  const privatePosts = allPosts.filter(p => p.visibility === PostVisibility.PRIVADA);
  const displayedPosts = activeTab === 'publicas' ? publicPosts : privatePosts;

  const handleCreatePost = async (content: string, visibility: PostVisibility) => {
    if (!usuario) return;

    try {
      // T093: Conectar con postService.createPost()
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
      
      // Recargar publicaciones
      await loadUserPosts();
    } catch (err: any) {
      console.error('Error al crear publicación:', err);
      setError('Error al crear publicación');
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
      setAllPosts(allPosts.filter(post => post.id !== postId));
    } catch (err: any) {
      console.error('Error al borrar publicación:', err);
      setError('Error al borrar publicación');
    }
  };

  if (!usuario) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <p>Debes iniciar sesión para ver tu perfil.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <div className="profile-info">
            <h1>Mi perfil</h1>
            <p className="profile-username">@{usuario.username}</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Nueva publicación
          </Button>
        </header>

        {error && (
          <div className="profile-error">
            {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === 'publicas' ? 'active' : ''}`}
            onClick={() => setActiveTab('publicas')}
          >
            🌐 Públicas ({publicPosts.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'privadas' ? 'active' : ''}`}
            onClick={() => setActiveTab('privadas')}
          >
            🔒 Privadas ({privatePosts.length})
          </button>
        </div>

        <div className="profile-content">
          <PostList
            posts={displayedPosts}
            currentUserId={usuario.uid}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage={
              activeTab === 'publicas'
                ? 'No tienes publicaciones públicas aún'
                : 'No tienes publicaciones privadas aún'
            }
          />
        </div>
      </div>

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
