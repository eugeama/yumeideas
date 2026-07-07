import { Usuario } from '../models/Usuario';
import { Publicacion } from '../models/Publicacion';

/**
 * Reglas de dominio para la funcionalidad de "me gusta"
 * 
 * @description Encapsula las reglas de negocio relacionadas con los likes
 * 
 * Reglas:
 * - Un usuario NO puede darse like a sí mismo (AMB-05)
 * - Solo se pueden dar likes a publicaciones públicas
 * - Un usuario puede dar/quitar like ilimitadamente (toggle) (AMB-06)
 * - El sistema debe validar estas reglas tanto en cliente como en Firestore Rules
 */
export class LikeRules {
  /**
   * Verifica si un usuario puede dar like a una publicación
   * 
   * Reglas:
   * - El usuario NO puede ser el autor de la publicación (AMB-05)
   * - La publicación debe ser pública
   * 
   * @param usuario - Usuario que intenta dar like
   * @param publicacion - Publicación a la que se quiere dar like
   * @returns true si el usuario puede dar like
   */
  static puedeDarLike(usuario: Usuario, publicacion: Publicacion): boolean {
    // Regla 1: No se puede dar like a publicaciones propias
    if (publicacion.autorId === usuario.uid) {
      return false;
    }

    // Regla 2: Solo se puede dar like a publicaciones públicas
    if (!publicacion.esPublica()) {
      return false;
    }

    return true;
  }

  /**
   * Verifica si un usuario puede quitar su like de una publicación
   * 
   * Regla: Un usuario siempre puede quitar su propio like (toggle)
   * 
   * @param _usuario - Usuario que intenta quitar like (no se usa en la validación)
   * @param publicacion - Publicación de la que se quiere quitar like
   * @returns true si el usuario puede quitar like
   */
  static puedeQuitarLike(_usuario: Usuario, publicacion: Publicacion): boolean {
    // Para quitar like, solo necesitamos que la publicación sea pública
    // (si el usuario ya dio like, es porque la publicación era pública en ese momento)
    return publicacion.esPublica();
  }

  /**
   * Obtiene el mensaje de error cuando un usuario intenta darse like a sí mismo
   */
  static getMensajeErrorLikePropio(): string {
    return 'No puedes dar "me gusta" a tus propias publicaciones';
  }

  /**
   * Obtiene el mensaje de error cuando un usuario intenta dar like a una publicación privada
   */
  static getMensajeErrorLikePrivada(): string {
    return 'No puedes dar "me gusta" a publicaciones privadas';
  }

  /**
   * Valida si se puede toggle like (dar o quitar)
   * Esta es una operación combinada que valida ambas acciones
   * 
   * @param usuario - Usuario que intenta hacer toggle
   * @param publicacion - Publicación afectada
   * @param yaLeDioLike - true si el usuario ya había dado like
   * @returns true si se puede hacer toggle
   */
  static puedeToggleLike(
    usuario: Usuario,
    publicacion: Publicacion,
    yaLeDioLike: boolean
  ): boolean {
    if (yaLeDioLike) {
      // Quitar like
      return this.puedeQuitarLike(usuario, publicacion);
    } else {
      // Dar like
      return this.puedeDarLike(usuario, publicacion);
    }
  }
}
