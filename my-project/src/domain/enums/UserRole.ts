/**
 * Roles de usuario en el sistema Yumeideas
 * 
 * @enum {string}
 * @description Define los niveles de permisos de los usuarios
 */
export enum UserRole {
  /**
   * Usuario normal con permisos estándar
   * - Gestionar su propio contenido y perfil
   * - Ver publicaciones públicas
   * - Dar "me gusta" a publicaciones públicas ajenas
   */
  USUARIO = 'usuario'
}
