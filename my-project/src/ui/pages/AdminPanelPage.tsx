/**
 * Pantalla de panel de administración
 * 
 * T086: Listado global de publicaciones (públicas + privadas),
 * T097-T099: Integración con servicios
 */

import { useState, useEffect } from 'react';
import { PostList, PostData } from '../components/post/PostList';
import { PostService } from '../../application/services/postService';
import { LikeService } from '../../application/services/likeService';
import { useAuth } from '../hooks/useAuth';
import { PostVisibility } from '../../domain/enums/PostVisibility';
import './AdminPanelPage.css';

type FilterVisibility = 'todas' | 'publicas' | 'privadas';

export function AdminPanelPage() {
  const { usuario, isAdmin } = useAuth();
  const [filterVisibility, setFilterVisibility] = useState<FilterVisibility>('todas');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [allPosts, setAllPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // T097: Cargar todas las publicaciones para admin
  useEffect(() => {
    if (isAdmin) {
      loadAllPosts();
    }
  }, [isAdmin]);

  const loadAllPosts = async () => {
    if (!usuario) return;

    setLoading(true);
    try {
      const result = await PostService.getAllPostsForAdmin();
      
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
      setError('Error al cargar publicaciones');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar publicaciones
  const filteredPosts = allPosts.filter((post) => {
    // Filtro por visibilidad
    if (filterVisibility === 'publicas' && post.visibility !== PostVisibility.PUBLICA) {
      return false;
    }
    if (filterVisibility === 'privadas' && post.visibility !== PostVisibility.PRIVADA) {
      return false;
    }

    // Filtro por autor
    if (searchAuthor && !post.authorUsername.toLowerCase().includes(searchAuthor.toLowerCase())) {
      return false;
    }

    return true;
  });

  const handleDeletePost = async (postId: string) => {
    if (!usuario) return;
    
    // T098: Conectar con postService.deletePost()
    if (!confirm('¿Estás seguro de que quieres borrar esta publicación?')) {
      return;
    }

    try {
      const result = await PostService.deletePost(postId, usuario);
      
      if (!result.success) {
        setError(result.error || 'Error al borrar publicación');
        return;
      }

      // Actualizar lista
      setAllPosts(allPosts.filter(post => post.id !== postId));
    } catch (err: any) {
      console.error('Error al borrar publicación:', err);
      setError('Error al borrar publicación');
    }
  };

  // Función para borrar usuario (pendiente de implementar completamente)
  // const handleDeleteUser = async (userId: string, username: string) => {
  //   if (!usuario) return;
  //   // T099: Conectar con userService.deleteAccount()
  //   if (!confirm(`¿Estás seguro de que quieres borrar la cuenta de @${username}? Esta acción borrará todas sus publicaciones y no se puede deshacer.`)) {
  //     return;
  //   }
  //   try {
  //     console.log('Borrar usuario:', userId, username);
  //     setError('Funcionalidad de borrar usuario pendiente de implementar completamente');
  //   } catch (err: any) {
  //     console.error('Error al borrar usuario:', err);
  //     setError('Error al borrar usuario');
  //   }
  // };


  if (!isAdmin) {
    return (
      <div className="admin-panel-page">
        <div className="admin-panel-container">
          <p>No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-panel-page">
        <div className="admin-panel-container">
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-page">
      <div className="admin-panel-container">
        <header className="admin-panel-header">
          <div className="admin-title">
            <h1>Panel de Administración</h1>
            <span className="admin-badge">Admin</span>
          </div>
          <p>Gestiona publicaciones y usuarios de la plataforma</p>
        </header>

        <div className="admin-filters">
          <div className="filter-group">
            <label htmlFor="filter-visibility">Visibilidad:</label>
            <select
              id="filter-visibility"
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value as FilterVisibility)}
              className="filter-select"
            >
              <option value="todas">Todas</option>
              <option value="publicas">Solo públicas</option>
              <option value="privadas">Solo privadas</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-author">Buscar autor:</label>
            <input
              id="filter-author"
              type="text"
              placeholder="Nombre de usuario..."
              value={searchAuthor}
              onChange={(e) => setSearchAuthor(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-results">
            Mostrando {filteredPosts.length} de {allPosts.length} publicaciones
          </div>
        </div>

        {error && (
          <div className="admin-error">
            {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        <div className="admin-content">
          <PostList
            posts={filteredPosts}
            currentUserId={usuario?.uid || 'admin-user'}
            isAdmin={true}
            onDelete={handleDeletePost}
            emptyMessage="No se encontraron publicaciones con los filtros aplicados"
          />
        </div>
      </div>
    </div>
  );
}
