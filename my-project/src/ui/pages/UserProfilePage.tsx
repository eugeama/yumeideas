/**
 * Pantalla de perfil de usuario (público)
 * 
 * Muestra el perfil de cualquier usuario con sus publicaciones públicas
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PostList, PostData } from '../components/post/PostList';
import { Button } from '../components/common/Button';
import { PostService } from '../../application/services/postService';
import { LikeService } from '../../application/services/likeService';
import { UserService } from '../../application/services/userService';
import { useAuth } from '../hooks/useAuth';
import { PostVisibility } from '../../domain/enums/PostVisibility';
import { UserRole } from '../../domain/enums/UserRole';
import { Usuario } from '../../domain/models/Usuario';
import './ProfilePage.css';

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { usuario: currentUser, isAdmin: currentUserIsAdmin } = useAuth();

  const [userProfile, setUserProfile] = useState<Usuario | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    if (!userId) {
      setError('Usuario no especificado');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Cargar información del usuario
      const user = await UserService.getUserData(userId);

      if (!user) {
        setError('El usuario no existe');
        setLoading(false);
        return;
      }

      setUserProfile(user);

      // Cargar publicaciones del usuario según permisos del usuario autenticado
      const result = await PostService.getUserPosts(userId, currentUser || user);

      // Filtrar solo publicaciones públicas
      const publicPosts = result.posts.filter(
        (pub) => pub.visibilidad === PostVisibility.PUBLICA
      );

      // Convertir a PostData[]
      const postsData: PostData[] = await Promise.all(
        publicPosts.map(async (pub) => {
          const hasLiked = currentUser
            ? await LikeService.hasUserLiked(pub.id, currentUser.uid)
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
    } catch (err: any) {
      console.error('Error al cargar perfil de usuario:', err);
      setError('Error al cargar el perfil del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      setError('Debes iniciar sesión para dar "me gusta"');
      return;
    }

    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const result = await LikeService.toggleLike(postId, currentUser);

      if (result.success) {
        setPosts(
          posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                hasLiked: !post.hasLiked,
                likesCount: post.hasLiked
                  ? post.likesCount - 1
                  : post.likesCount + 1,
              };
            }
            return post;
          })
        );
        setError('');
      }
    } catch (err: any) {
      console.error('Error al dar like:', err);
      setError('Error al procesar "me gusta"');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!currentUser) return;

    if (
      !confirm('¿Estás seguro de que quieres borrar esta publicación?')
    ) {
      return;
    }

    try {
      const result = await PostService.deletePost(postId, currentUser);

      if (!result.success) {
        setError(result.error || 'Error al borrar publicación');
        return;
      }

      setPosts(posts.filter((post) => post.id !== postId));
    } catch (err: any) {
      console.error('Error al borrar publicación:', err);
      setError('Error al borrar publicación');
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <p>{error || 'Usuario no encontrado'}</p>
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
          >
            ← Volver al feed
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === userId;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <div className="profile-info">
            <h1>{isOwnProfile ? 'Mi perfil' : 'Perfil de usuario'}</h1>
            <p className="profile-username">@{userProfile.username}</p>
            {userProfile.rol === UserRole.ADMIN && (
              <span className="admin-badge">👑 Admin</span>
            )}
          </div>
          <div className="profile-actions">
            <Button
              variant="secondary"
              onClick={() => navigate('/')}
            >
              ← Volver al feed
            </Button>
            {isOwnProfile && (
              <Button
                variant="secondary"
                onClick={() => navigate('/profile/edit')}
              >
                ✏️ Editar perfil
              </Button>
            )}
          </div>
        </header>

        {error && (
          <div className="profile-error">
            {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        <div className="profile-content">
          <h2>Publicaciones públicas ({posts.length})</h2>
          <PostList
            posts={posts}
            currentUserId={currentUser?.uid || ''}
            isAdmin={currentUserIsAdmin}
            onLike={handleLike}
            onDelete={handleDelete}
            onAuthorClick={(authorId) => navigate(`/profile/${authorId}`)}
            emptyMessage="Este usuario no tiene publicaciones públicas aún"
          />
        </div>
      </div>
    </div>
  );
}
