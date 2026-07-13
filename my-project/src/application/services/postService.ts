/**
 * Servicio de gestión de publicaciones
 * 
 * Coordina casos de uso de creación, edición, borrado y consulta de publicaciones.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../infrastructure/firebase/config';
import { Publicacion } from '../../domain/models/Publicacion';
import { Usuario } from '../../domain/models/Usuario';
import { PostVisibility } from '../../domain/enums/PostVisibility';
import { PostValidators } from '../../infrastructure/utils/validators';

/**
 * Datos para crear una publicación
 */
export interface CreatePostData {
  contenido: string;
  visibilidad: PostVisibility;
  autorId: string;
  autorUsername: string;
  autorRol: string;
}

/**
 * Resultado de operaciones de publicación
 */
export interface PostResult {
  success: boolean;
  post?: Publicacion;
  error?: string;
}

/**
 * Resultado de consultas de publicaciones
 */
export interface PostsQueryResult {
  posts: Publicacion[];
  lastDoc?: QueryDocumentSnapshot;
  hasMore: boolean;
}

/**
 * Servicio de gestión de publicaciones
 */
export class PostService {
  /**
   * T038: Crea una nueva publicación
   * 
   * Validaciones:
   * - Contenido no vacío
   * - Longitud máxima (delegado a PostValidators)
   * 
   * @param data - Datos de la publicación
   * @returns Resultado con la publicación creada
   */
  static async createPost(data: CreatePostData): Promise<PostResult> {
    try {
      // Validar contenido
      const validation = PostValidators.validarContenido(data.contenido);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Crear documento en Firestore
      const postData = {
        contenido: data.contenido,
        autorId: data.autorId,
        autorUsername: data.autorUsername,
        autorRol: data.autorRol,
        visibilidad: data.visibilidad,
        fechaCreacion: serverTimestamp(),
        fechaModificacion: serverTimestamp(),
        likesCount: 0,
      };

      const docRef = await addDoc(collection(db, 'publicaciones'), postData);

      // Crear instancia del modelo de dominio
      const publicacion = new Publicacion({
        id: docRef.id,
        contenido: data.contenido,
        autorId: data.autorId,
        autorUsername: data.autorUsername,
        autorRol: data.autorRol as any,
        visibilidad: data.visibilidad,
        fechaCreacion: new Date(),
        fechaModificacion: new Date(),
        likesCount: 0,
      });

      return {
        success: true,
        post: publicacion,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al crear publicación',
      };
    }
  }

  /**
   * T039: Actualiza una publicación existente
   * 
   * Validaciones:
   * - Solo el autor puede editar (delega a Publicacion.puedeEditar())
   * - Contenido no vacío si se modifica
   * 
   * @param postId - ID de la publicación
   * @param updates - Datos a actualizar (contenido y/o visibilidad)
   * @param currentUser - Usuario que ejecuta la acción
   * @returns Resultado de la operación
   */
  static async updatePost(
    postId: string,
    updates: { contenido?: string; visibilidad?: PostVisibility },
    currentUser: Usuario
  ): Promise<PostResult> {
    try {
      // Obtener publicación actual
      const postRef = doc(db, 'publicaciones', postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        return {
          success: false,
          error: 'La publicación no existe',
        };
      }

      const publicacion = Publicacion.fromFirestore(postId, postDoc.data());

      // Validar que el usuario puede editar
      if (!publicacion.puedeEditar(currentUser)) {
        return {
          success: false,
          error: 'No tienes permisos para editar esta publicación',
        };
      }

      // Validar contenido si se modifica
      if (updates.contenido) {
        const validation = PostValidators.validarContenido(updates.contenido);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error,
          };
        }
      }

      // Actualizar documento
      const updateData: any = {
        fechaModificacion: serverTimestamp(),
      };

      if (updates.contenido !== undefined) {
        updateData.contenido = updates.contenido;
      }

      if (updates.visibilidad !== undefined) {
        updateData.visibilidad = updates.visibilidad;
      }

      await updateDoc(postRef, updateData);

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al actualizar publicación',
      };
    }
  }

  /**
   * T040: Elimina una publicación
   * 
   * Validaciones:
   * - Solo el autor puede borrar su propia publicación
   * 
   * @param postId - ID de la publicación
   * @param currentUser - Usuario que ejecuta la acción
   * @returns Resultado de la operación
   */
  static async deletePost(
    postId: string,
    currentUser: Usuario
  ): Promise<PostResult> {
    try {
      // Obtener publicación
      const postRef = doc(db, 'publicaciones', postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        return {
          success: false,
          error: 'La publicación no existe',
        };
      }

      const publicacion = Publicacion.fromFirestore(postId, postDoc.data());

      // Validar que el usuario puede borrar
      if (!publicacion.puedeBorrar(currentUser)) {
        return {
          success: false,
          error: 'No tienes permisos para borrar esta publicación',
        };
      }

      // Borrar todos los likes de la publicación
      const likesQuery = query(collection(db, `publicaciones/${postId}/likes`));
      const likesSnapshot = await getDocs(likesQuery);

      const batch = writeBatch(db);
      likesSnapshot.docs.forEach((likeDoc) => {
        batch.delete(likeDoc.ref);
      });

      // Borrar la publicación
      batch.delete(postRef);

      await batch.commit();

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al eliminar publicación',
      };
    }
  }

  /**
   * T041: Obtiene el feed público de publicaciones
   * 
   * Consulta paginada con cursor de Firestore.
   * Usa índice compuesto (visibilidad ASC, fechaCreacion DESC).
   * 
   * @param pageSize - Número de publicaciones por página (default: 20)
   * @param lastDocument - Último documento de la página anterior (para paginación)
   * @returns Publicaciones públicas y cursor para siguiente página
   */
  static async getPublicFeed(
    pageSize: number = 20,
    lastDocument?: QueryDocumentSnapshot
  ): Promise<PostsQueryResult> {
    try {
      let q = query(
        collection(db, 'publicaciones'),
        where('visibilidad', '==', PostVisibility.PUBLICA),
        orderBy('fechaCreacion', 'desc'),
        limit(pageSize + 1) // +1 para saber si hay más páginas
      );

      if (lastDocument) {
        q = query(q, startAfter(lastDocument));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      // Verificar si hay más páginas
      const hasMore = docs.length > pageSize;
      const postsToReturn = hasMore ? docs.slice(0, pageSize) : docs;

      const posts = postsToReturn.map((doc) =>
        Publicacion.fromFirestore(doc.id, doc.data())
      );

      return {
        posts,
        lastDoc: postsToReturn[postsToReturn.length - 1],
        hasMore,
      };
    } catch (error) {
      console.error('Error al obtener feed público:', error);
      return {
        posts: [],
        hasMore: false,
      };
    }
  }

  /**
   * T042: Obtiene las publicaciones de un usuario específico
   * 
   * Si es el usuario mismo, muestra públicas + privadas.
   * Si no, muestra solo públicas.
   * 
   * @param userId - ID del usuario cuyas publicaciones se consultan
   * @param currentUser - Usuario que ejecuta la consulta
   * @param pageSize - Número de publicaciones por página (default: 20)
   * @param lastDocument - Último documento de la página anterior
   * @returns Publicaciones del usuario
   */
  static async getUserPosts(
    userId: string,
    currentUser?: Usuario,
    pageSize: number = 20,
    lastDocument?: QueryDocumentSnapshot
  ): Promise<PostsQueryResult> {
    try {
      // Si no es dueño, consultamos solo públicas para cumplir reglas de seguridad.
      const isOwner = currentUser?.uid === userId;

      let q = isOwner
        ? query(
            collection(db, 'publicaciones'),
            where('autorId', '==', userId),
            orderBy('fechaCreacion', 'desc'),
            limit(pageSize + 1)
          )
        : query(
            collection(db, 'publicaciones'),
            where('autorId', '==', userId),
            where('visibilidad', '==', PostVisibility.PUBLICA),
            orderBy('fechaCreacion', 'desc'),
            limit(pageSize + 1)
          );

      if (lastDocument) {
        q = query(q, startAfter(lastDocument));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;

      const hasMore = docs.length > pageSize;
      const postsToReturn = hasMore ? docs.slice(0, pageSize) : docs;

      const posts = postsToReturn
        .map((doc) => Publicacion.fromFirestore(doc.id, doc.data()))
        .filter((post) => {
          if (isOwner) {
            return true; // Ver todas (públicas + privadas)
          }
          return post.esPublica(); // Ver solo públicas
        });

      return {
        posts,
        lastDoc: postsToReturn[postsToReturn.length - 1],
        hasMore,
      };
    } catch (error) {
      console.error('Error al obtener publicaciones de usuario:', error);
      return {
        posts: [],
        hasMore: false,
      };
    }
  }
}
