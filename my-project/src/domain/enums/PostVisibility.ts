/**
 * Niveles de visibilidad de publicaciones
 * 
 * @enum {string}
 * @description Define quién puede ver una publicación
 */
export enum PostVisibility {
  /**
   * Publicación visible para todos los usuarios autenticados
   * - Aparece en el feed público
   * - Puede recibir "me gusta"
   * - Visible para cualquier usuario autenticado
   */
  PUBLICA = 'publica',

  /**
   * Publicación visible solo para el autor y administradores
   * - NO aparece en el feed público
   * - Solo visible para:
   *   - El autor de la publicación
   *   - Usuarios con rol de administrador
   * - NO puede recibir "me gusta" de otros usuarios
   */
  PRIVADA = 'privada'
}
