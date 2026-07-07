/**
 * Servicio de autenticación
 * 
 * Coordina casos de uso de registro, login, logout y recuperación de contraseña.
 * Delega validaciones a validators.ts y lógica de negocio a modelos de dominio.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../infrastructure/firebase/config';
import { UserRole } from '../../domain/enums/UserRole';
import { Usuario } from '../../domain/models/Usuario';
import { UserValidators } from '../../infrastructure/utils/validators';

/**
 * Datos de registro de usuario
 */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fechaNacimiento: Date;
}

/**
 * Resultado de operaciones de autenticación
 */
export interface AuthResult {
  success: boolean;
  user?: Usuario;
  error?: string;
}

/**
 * Servicio de autenticación de usuarios
 */
export class AuthService {
  /**
   * T029: Registra un nuevo usuario
   * 
   * Proceso:
   * 1. Valida edad >= 13 años (delega a validators.ts)
   * 2. Valida formato de username, email y password
   * 3. Crea cuenta en Firebase Auth
   * 4. En una transacción:
   *    - Reserva username en /usernames/{username}
   *    - Crea documento en /usuarios/{uid}
   * 
   * @param data - Datos de registro
   * @returns Resultado con usuario creado o error
   */
  static async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Validar edad >= 13 años
      const edadValidation = UserValidators.validarEdad(data.fechaNacimiento);
      if (!edadValidation.valid) {
        return {
          success: false,
          error: edadValidation.error,
        };
      }

      // Validar username
      const usernameValidation = UserValidators.validarUsername(data.username);
      if (!usernameValidation.valid) {
        return {
          success: false,
          error: usernameValidation.error,
        };
      }

      // Validar email
      const emailValidation = UserValidators.validarEmail(data.email);
      if (!emailValidation.valid) {
        return {
          success: false,
          error: emailValidation.error,
        };
      }

      // Validar password
      const passwordValidation = UserValidators.validarPassword(data.password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.error,
        };
      }

      // Crear cuenta en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const uid = userCredential.user.uid;

      // Transacción para reservar username y crear usuario
      await runTransaction(db, async (transaction) => {
        // Verificar disponibilidad del username
        const usernameRef = doc(db, 'usernames', data.username);
        const usernameDoc = await transaction.get(usernameRef);

        if (usernameDoc.exists()) {
          throw new Error('El nombre de usuario ya está en uso');
        }

        // Reservar username
        transaction.set(usernameRef, {
          userId: uid,
        });

        // Crear documento de usuario
        const userRef = doc(db, 'usuarios', uid);
        transaction.set(userRef, {
          uid,
          username: data.username,
          email: data.email,
          fechaNacimiento: data.fechaNacimiento,
          rol: UserRole.USUARIO, // Rol por defecto
          fechaCreacion: serverTimestamp(),
        });
      });

      // Obtener datos del usuario recién creado
      const usuario = new Usuario({
        uid,
        username: data.username,
        email: data.email,
        fechaNacimiento: data.fechaNacimiento,
        rol: UserRole.USUARIO,
        fechaCreacion: new Date(),
      });

      return {
        success: true,
        user: usuario,
      };
    } catch (error: any) {
      // Manejar errores específicos de Firebase Auth
      let errorMessage = 'Error al registrar usuario';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'El correo electrónico ya está en uso';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es demasiado débil';
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
   * T030: Inicia sesión con email y contraseña
   * 
   * @param email - Correo electrónico del usuario
   * @param password - Contraseña del usuario
   * @returns Resultado con usuario o error
   */
  static async login(email: string, password: string): Promise<AuthResult> {
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Obtener datos del usuario desde Firestore
      // (En producción, esto se haría en un hook useAuth que escucha cambios)
      return {
        success: true,
      };
    } catch (error: any) {
      let errorMessage = 'Error al iniciar sesión';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Esta cuenta ha sido deshabilitada';
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
   * T031: Cierra la sesión del usuario actual
   * 
   * @returns Resultado de la operación
   */
  static async logout(): Promise<AuthResult> {
    try {
      await signOut(auth);
      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al cerrar sesión',
      };
    }
  }

  /**
   * T032: Envía email de recuperación de contraseña
   * 
   * @param email - Correo electrónico del usuario
   * @returns Resultado de la operación
   */
  static async sendPasswordReset(email: string): Promise<AuthResult> {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
      };
    } catch (error: any) {
      let errorMessage = 'Error al enviar email de recuperación';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido';
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
   * T033: Obtiene el usuario autenticado actual
   * 
   * @returns Usuario de Firebase Auth o null si no hay sesión activa
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Verifica si hay un usuario autenticado
   * 
   * @returns true si hay un usuario autenticado
   */
  static isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }
}
