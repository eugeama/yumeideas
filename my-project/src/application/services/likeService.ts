/**
 * Servicio de gestión de "me gusta"
 * 
 * Coordina casos de uso de dar/quitar likes a publicaciones.
 */

import {
  doc,
  getDoc,
  runTransaction,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../infrastructure/firebase/config';
import { Publicacion } from '../../domain/models/Publicacion';
import { Usuario } from '../../domain/models/Usuario';
import { LikeRules } from '../../domain/rules/likeRules';

/**
 * Resultado de operaciones de like
 */
export interface LikeResult {
  success: boolean;
  liked?: boolean; // true si se dio like, false si se quitó
  error?: string;
}

/**
 * Servicio de gestión de likes
 */
export class LikeService {
  /**
   * T044: Toggle de like (dar o quitar)
   * 
   * Transacción atómica que:
   * 1. Verifica que la publicación existe y es pública
   * 2. Verifica que el usuario no es el autor (AMB-05)
   * 3. Si el usuario ya dio like, lo quita
   * 4. Si el usuario no dio like, lo da
   * 5. Actualiza el contador likesCount con increment()
   * 
   * @param postId - ID de la publicación
   * @param user - Usuario que ejecuta la acción
   * @returns Resultado de la operación
   */
  static async toggleLike(postId: string, user: Usuario): Promise<LikeResult> {
    try {
      const result = await runTransaction(db, async (transaction) => {
        // Obtener publicación
        const postRef = doc(db, 'publicaciones', postId);
        const postDoc = await transaction.get(postRef);

        if (!postDoc.exists()) {
          throw new Error('La publicación no existe');
        }

        const publicacion = Publicacion.fromFirestore(postId, postDoc.data());

        // Verificar si el usuario ya dio like
        const likeRef = doc(db, `publicaciones/${postId}/likes/${user.uid}`);
        const likeDoc = await transaction.get(likeRef);
        const yaLeDioLike = likeDoc.exists();

        // Validar con LikeRules
        if (!LikeRules.puedeToggleLike(user, publicacion, yaLeDioLike)) {
          if (publicacion.autorId === user.uid) {
            throw new Error(LikeRules.getMensajeErrorLikePropio());
          }
          if (!publicacion.esPublica()) {
            throw new Error(LikeRules.getMensajeErrorLikePrivada());
          }
          throw new Error('No puedes dar "me gusta" a esta publicación');
        }

        if (yaLeDioLike) {
          // Quitar like
          transaction.delete(likeRef);
          transaction.update(postRef, {
            likesCount: increment(-1),
          });
          return { liked: false };
        } else {
          // Dar like
          transaction.set(likeRef, {
            userId: user.uid,
            timestamp: serverTimestamp(),
          });
          transaction.update(postRef, {
            likesCount: increment(1),
          });
          return { liked: true };
        }
      });

      return {
        success: true,
        liked: result.liked,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al procesar "me gusta"',
      };
    }
  }

  /**
   * T045: Verifica si un usuario ya dio like a una publicación
   * 
   * @param postId - ID de la publicación
   * @param userId - ID del usuario
   * @returns true si el usuario ya dio like
   */
  static async hasUserLiked(postId: string, userId: string): Promise<boolean> {
    try {
      const likeRef = doc(db, `publicaciones/${postId}/likes/${userId}`);
      const likeDoc = await getDoc(likeRef);
      return likeDoc.exists();
    } catch (error) {
      console.error('Error al verificar like:', error);
      return false;
    }
  }

  /**
   * Obtiene la cantidad de likes de una publicación
   * 
   * @param postId - ID de la publicación
   * @returns Cantidad de likes
   */
  static async getLikesCount(postId: string): Promise<number> {
    try {
      const postRef = doc(db, 'publicaciones', postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        return 0;
      }

      const data = postDoc.data();
      return data.likesCount || 0;
    } catch (error) {
      console.error('Error al obtener cantidad de likes:', error);
      return 0;
    }
  }
}
