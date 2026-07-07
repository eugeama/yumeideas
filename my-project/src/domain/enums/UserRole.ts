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
  USUARIO = 'usuario',

  /**
   * Administrador con permisos de moderación
   * - Todas las capacidades de usuario normal
   * - Ver publicaciones privadas de cualquier usuario
   * - Borrar publicaciones de usuarios normales
   * - Borrar cuentas de usuarios normales
   * - NO puede afectar (editar/borrar) a otros administradores
   */
  ADMIN = 'admin'
}
