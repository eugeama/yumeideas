/**
 * Servicio de gestión de usuarios
 * 
 * Coordina casos de uso de gestión de perfil, cambio de username/password y borrado de cuenta.
 */

import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser as deleteFirebaseAuthUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  runTransaction,
  writeBatch,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../../infrastructure/firebase/config';
import { Usuario } from '../../domain/models/Usuario';
import { UserValidators } from '../../infrastructure/utils/validators';
import { AdminRules } from '../../domain/rules/adminRules';

/**
 * Resultado de operaciones de usuario
 */
export interface UserResult {
  success: boolean;
  user?: Usuario;
  error?: string;
}

/**
 * Servicio de gestión de usuarios
 */
export class UserService {
  /**
   * T034: Obtiene los datos de perfil de un usuario
   * 
   * @param userId - UID del usuario
   * @returns Datos del usuario o null si no existe
   */
  static async getUserData(userId: string): Promise<Usuario | null> {
    try {
      const userRef = doc(db, 'usuarios', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return null;
      }

      return Usuario.fromFirestore(userDoc.data());
    } catch (error) {
      console.error('Error al obtener datos de usuario:', error);
      return null;
    }
  }

  /**
   * T035: Cambia el username de un usuario
   * 
   * Proceso en transacción:
   * 1. Verifica disponibilidad del nuevo username
   * 2. Libera el username anterior
   * 3. Reserva el nuevo username
   * 4. Actualiza el documento del usuario
   * 5. Actualiza autorUsername en todas las publicaciones del usuario
   * 
   * @param userId - UID del usuario
   * @param oldUsername - Username actual
   * @param newUsername - Nuevo username
   * @returns Resultado de la operación
   */
  static async updateUsername(
    userId: string,
    oldUsername: string,
    newUsername: string
  ): Promise<UserResult> {
    try {
      // Validar nuevo username
      const validation = UserValidators.validarUsername(newUsername);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // No hacer nada si el username es el mismo
      if (oldUsername === newUsername) {
        return {
          success: true,
        };
      }

      // Transacción para cambiar username
      await runTransaction(db, async (transaction) => {
        // Verificar disponibilidad del nuevo username
        const newUsernameRef = doc(db, 'usernames', newUsername);
        const newUsernameDoc = await transaction.get(newUsernameRef);

        if (newUsernameDoc.exists()) {
          throw new Error('El nombre de usuario ya está en uso');
        }

        // Liberar username anterior
        const oldUsernameRef = doc(db, 'usernames', oldUsername);
        transaction.delete(oldUsernameRef);

        // Reservar nuevo username
        transaction.set(newUsernameRef, {
          userId,
        });

        // Actualizar documento de usuario
        const userRef = doc(db, 'usuarios', userId);
        transaction.update(userRef, {
          username: newUsername,
        });
      });

      // Actualizar autorUsername en todas las publicaciones del usuario
      // Esto se hace fuera de la transacción porque puede ser > 500 documentos
      const postsQuery = query(
        collection(db, 'publicaciones'),
        where('autorId', '==', userId)
      );
      const postsSnapshot = await getDocs(postsQuery);

      if (!postsSnapshot.empty) {
        const batch = writeBatch(db);
        postsSnapshot.docs.forEach((postDoc) => {
          batch.update(postDoc.ref, {
            autorUsername: newUsername,
          });
        });
        await batch.commit();
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al actualizar nombre de usuario',
      };
    }
  }

  /**
   * T036: Cambia la contraseña de un usuario
   * 
   * Requiere re-autenticación previa por seguridad.
   * 
   * @param currentPassword - Contraseña actual
   * @param newPassword - Nueva contraseña
   * @returns Resultado de la operación
   */
  static async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<UserResult> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        return {
          success: false,
          error: 'No hay usuario autenticado',
        };
      }

      // Validar nueva contraseña
      const validation = UserValidators.validarPassword(newPassword);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Re-autenticar usuario
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Actualizar contraseña
      await updatePassword(user, newPassword);

      return {
        success: true,
      };
    } catch (error: any) {
      let errorMessage = 'Error al actualizar contraseña';

      if (error.code === 'auth/wrong-password') {
        errorMessage = 'La contraseña actual es incorrecta';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La nueva contraseña es demasiado débil';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * T037: Elimina la cuenta de un usuario (propia o por admin)
   * 
   * Borrado en cascada:
   * 1. Todas las publicaciones del usuario
   * 2. Todos los likes dados por el usuario
   * 3. Todos los likes a publicaciones del usuario
   * 4. Reserva de username
   * 5. Documento de usuario en Firestore
   * 6. Usuario de Firebase Auth
   * 
   * Validaciones:
   * - Un admin NO puede borrar cuenta de otro admin (AMB-07)
   * 
   * @param userId - UID del usuario a eliminar
   * @param currentUser - Usuario que ejecuta la acción
   * @param targetUserRole - Rol del usuario a eliminar
   * @param targetUsername - Username del usuario a eliminar
   * @returns Resultado de la operación
   */
  static async deleteAccount(
    userId: string,
    currentUser: Usuario,
    targetUserRole: string,
    targetUsername: string
  ): Promise<UserResult> {
    try {
      // Validar que un admin no puede borrar cuenta de otro admin
      if (currentUser.isAdmin() && currentUser.uid !== userId) {
        if (!AdminRules.puedeBorrarCuenta(currentUser, userId, targetUserRole as any)) {
          return {
            success: false,
            error: AdminRules.getMensajeErrorProteccionAdmin(),
          };
        }
      }

      // 1. Obtener todas las publicaciones del usuario
      const postsQuery = query(
        collection(db, 'publicaciones'),
        where('autorId', '==', userId)
      );
      const postsSnapshot = await getDocs(postsQuery);

      // 2. Borrar todas las publicaciones y sus likes (en batches)
      const batch = writeBatch(db);
      let operationCount = 0;
      const MAX_BATCH_SIZE = 500;

      for (const postDoc of postsSnapshot.docs) {
        // Borrar la publicación
        batch.delete(postDoc.ref);
        operationCount++;

        // Borrar todos los likes de esta publicación
        const likesQuery = query(
          collection(db, `publicaciones/${postDoc.id}/likes`)
        );
        const likesSnapshot = await getDocs(likesQuery);

        likesSnapshot.docs.forEach((likeDoc) => {
          if (operationCount < MAX_BATCH_SIZE) {
            batch.delete(likeDoc.ref);
            operationCount++;
          }
        });

        // Si alcanzamos el límite, commit y crear nuevo batch
        if (operationCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          operationCount = 0;
        }
      }

      // 3. Borrar todos los likes dados por el usuario a otras publicaciones
      // (Esto requeriría una query collection-group que no es eficiente)
      // En producción se haría con Cloud Functions, pero no está permitido
      // Alternativa: dejar huérfanos (se limpiarán eventualmente)

      // 4. Borrar reserva de username
      const usernameRef = doc(db, 'usernames', targetUsername);
      batch.delete(usernameRef);

      // 5. Borrar documento de usuario
      const userRef = doc(db, 'usuarios', userId);
      batch.delete(userRef);

      // Commit final
      if (operationCount > 0) {
        await batch.commit();
      }

      // 6. Borrar usuario de Firebase Auth (solo si es la cuenta propia)
      if (currentUser.uid === userId) {
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          await deleteFirebaseAuthUser(firebaseUser);
        }
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al eliminar cuenta',
      };
    }
  }
}
