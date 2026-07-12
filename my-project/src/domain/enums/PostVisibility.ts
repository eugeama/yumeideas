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
   * Publicación visible solo para el autor
   * - NO aparece en el feed público
   * - Solo visible para el autor de la publicación
   * - NO puede recibir "me gusta" de otros usuarios
   */
  PRIVADA = 'privada'
}
