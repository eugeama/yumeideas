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
  deleteDoc,
  getDoc,
  runTransaction,
  writeBatch,
  collection,
  query,
  where,
  getDocs,
  DocumentReference,
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
   * Re-autentica al usuario actual para operaciones sensibles (ej: borrar cuenta)
   */
  private static async reauthenticateCurrentUser(currentPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No hay usuario autenticado');
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }

  /**
   * Ejecuta borrados en batches para respetar el límite de Firestore
   */
  private static async deleteInBatches(refs: DocumentReference[]): Promise<void> {
    const MAX_BATCH_SIZE = 450;

    for (let i = 0; i < refs.length; i += MAX_BATCH_SIZE) {
      const chunk = refs.slice(i, i + MAX_BATCH_SIZE);
      const batch = writeBatch(db);

      chunk.forEach((ref) => {
        batch.delete(ref);
      });

      await batch.commit();
    }
  }

  /**
   * T034: Obtiene los datos de perfil de un usuario
   * 
   * Con retry automático para manejar latencia de replicación en Firestore
   * (especialmente importante después de registro nuevo)
   * 
   * @param userId - UID del usuario
   * @param maxRetries - Número máximo de intentos (default: 5)
   * @returns Datos del usuario o null si no existe
   */
  static async getUserData(userId: string, maxRetries: number = 5): Promise<Usuario | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const userRef = doc(db, 'usuarios', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          // Documento encontrado exitosamente
          return Usuario.fromFirestore(userDoc.data());
        }

        // Documento no existe aún, intentar de nuevo si hay reintentos
        if (attempt < maxRetries - 1) {
          const delayMs = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms, 800ms, 1600ms
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        // Guardar error por si falla todos los reintentos
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Si no es el último intento, esperar e intentar de nuevo
        if (attempt < maxRetries - 1) {
          const delayMs = Math.pow(2, attempt) * 100;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    if (lastError) {
      console.error(
        `Error al obtener datos de usuario después de ${maxRetries} intentos:`,
        lastError
      );
    } else {
      console.warn(
        `Documento de usuario ${userId} no encontrado después de ${maxRetries} intentos ` +
        '(esto puede ocurrir si el usuario acaba de registrarse y Firestore aún no ha replicado el documento)'
      );
    }

    return null;
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
    targetUsername: string,
    currentPassword?: string
  ): Promise<UserResult> {
    let stage = 'inicio';

    try {
      // Para cuenta propia, re-autenticar antes de ejecutar borrado en Firestore
      // y evitar borrados parciales si la contraseña es incorrecta.
      if (currentUser.uid === userId) {
        stage = 'reautenticar usuario';
        if (!currentPassword) {
          return {
            success: false,
            error: 'Debes confirmar tu contraseña para borrar tu cuenta',
          };
        }

        await this.reauthenticateCurrentUser(currentPassword);
      }

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
      stage = 'leer publicaciones del usuario';
      const postsQuery = query(
        collection(db, 'publicaciones'),
        where('autorId', '==', userId)
      );
      const postsSnapshot = await getDocs(postsQuery);

      const postRefs: DocumentReference[] = postsSnapshot.docs.map((postDoc) => postDoc.ref);
      // 2. Borrar publicaciones del usuario (las subcolecciones quedan huérfanas en Firestore)
      stage = 'borrar publicaciones del usuario';
      if (postRefs.length > 0) {
        await this.deleteInBatches(postRefs);
      }

      // 3. Borrar reserva de username si pertenece al usuario
      stage = 'borrar reserva de username';
      const usernameRef = doc(db, 'usernames', targetUsername);
      const usernameDoc = await getDoc(usernameRef);
      if (usernameDoc.exists() && usernameDoc.data().userId === userId) {
        await deleteDoc(usernameRef);
      }

      // 4. Borrar documento de usuario (al final para no afectar helpers de reglas durante el proceso)
      stage = 'borrar documento de usuario';
      const userRef = doc(db, 'usuarios', userId);
      await deleteDoc(userRef);

      // 5. Borrar usuario de Firebase Auth (solo si es la cuenta propia)
      if (currentUser.uid === userId) {
        stage = 'borrar usuario en Firebase Auth';
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          await deleteFirebaseAuthUser(firebaseUser);
        }
      }

      return {
        success: true,
      };
    } catch (error: any) {
      let errorMessage = error.message || 'Error al eliminar cuenta';

      if (error.code === 'permission-denied') {
        errorMessage = `Permisos insuficientes al intentar ${stage}.`;
      }

      if (error.code === 'auth/wrong-password') {
        errorMessage = 'La contraseña actual es incorrecta';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Por seguridad, vuelve a iniciar sesión e intenta nuevamente';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
