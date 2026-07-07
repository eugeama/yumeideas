import { Usuario } from '../models/Usuario';
import { UserRole } from '../enums/UserRole';

/**
 * Reglas de dominio para jerarquía entre administradores
 * 
 * @description Encapsula las reglas de protección entre administradores
 * 
 * Regla principal (AMB-07):
 * - Un administrador NO puede afectar (editar/borrar) a otro administrador
 * - Esta protección aplica tanto para:
 *   - Borrar cuenta de otro admin
 *   - Borrar publicaciones de otro admin
 *   - Modificar datos de otro admin
 */
export class AdminRules {
  /**
   * Verifica si un admin puede afectar (borrar/modificar) a un usuario objetivo
   * 
   * Reglas:
   * - Si el usuario objetivo NO es admin: permitido
   * - Si el usuario objetivo ES admin: NO permitido (AMB-07)
   * 
   * @param admin - Usuario administrador que intenta realizar la acción
   * @param targetUserId - UID del usuario objetivo
   * @param targetUserRole - Rol del usuario objetivo
   * @returns true si el admin puede afectar al usuario objetivo
   */
  static puedeAfectarUsuario(
    admin: Usuario,
    targetUserId: string,
    targetUserRole: UserRole
  ): boolean {
    // Verificar que quien ejecuta la acción es admin
    if (!admin.isAdmin()) {
      return false;
    }

    // Un admin puede afectarse a sí mismo (borrar su propia cuenta, etc.)
    if (admin.uid === targetUserId) {
      return true;
    }

    // Un admin NO puede afectar a otro admin (AMB-07)
    if (targetUserRole === UserRole.ADMIN) {
      return false;
    }

    // Puede afectar a usuarios normales
    return true;
  }

  /**
   * Verifica si un admin puede borrar la cuenta de un usuario objetivo
   * 
   * @param admin - Administrador que intenta borrar
   * @param targetUserId - UID del usuario a borrar
   * @param targetUserRole - Rol del usuario a borrar
   * @returns true si puede borrar
   */
  static puedeBorrarCuenta(
    admin: Usuario,
    targetUserId: string,
    targetUserRole: UserRole
  ): boolean {
    return this.puedeAfectarUsuario(admin, targetUserId, targetUserRole);
  }

  /**
   * Verifica si un admin puede borrar una publicación de otro usuario
   * 
   * @param admin - Administrador que intenta borrar
   * @param autorId - UID del autor de la publicación
   * @param autorRol - Rol del autor de la publicación
   * @returns true si puede borrar
   */
  static puedeBorrarPublicacion(
    admin: Usuario,
    autorId: string,
    autorRol: UserRole
  ): boolean {
    return this.puedeAfectarUsuario(admin, autorId, autorRol);
  }

  /**
   * Verifica si un usuario es administrador
   * Método de utilidad para validaciones rápidas
   * 
   * @param usuario - Usuario a verificar
   * @returns true si es administrador
   */
  static esAdmin(usuario: Usuario): boolean {
    return usuario.isAdmin();
  }

  /**
   * Verifica si un rol es de administrador
   * Método de utilidad para validaciones cuando solo se tiene el rol
   * 
   * @param rol - Rol a verificar
   * @returns true si es rol de administrador
   */
  static esRolAdmin(rol: UserRole): boolean {
    return rol === UserRole.ADMIN;
  }

  /**
   * Obtiene el mensaje de error cuando un admin intenta afectar a otro admin
   */
  static getMensajeErrorProteccionAdmin(): string {
    return 'Un administrador no puede afectar (editar/borrar) a otro administrador';
  }

  /**
   * Obtiene el mensaje de error cuando un usuario no-admin intenta una acción de admin
   */
  static getMensajeErrorNoEsAdmin(): string {
    return 'Esta acción requiere permisos de administrador';
  }
}
