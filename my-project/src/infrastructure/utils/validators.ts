/**
 * Validadores centralizados para Yumeideas
 * 
 * @description Funciones de validación reutilizables para evitar duplicación
 * Principio 8 de la constitución: evitar código duplicado
 * 
 * Todos los validadores retornan:
 * - `{ valid: true }` si la validación pasa
 * - `{ valid: false, error: string }` si la validación falla
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validadores de usuario
 */
export class UserValidators {
  /**
   * Formato válido de username:
   * - Solo letras (a-z, A-Z), números (0-9) y guión bajo (_)
   * - Longitud: 3-20 caracteres
   */
  private static readonly USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
  
  /**
   * Longitud mínima de username
   */
  static readonly MIN_USERNAME_LENGTH = 3;
  
  /**
   * Longitud máxima de username
   */
  static readonly MAX_USERNAME_LENGTH = 20;

  /**
   * Edad mínima para registrarse (AMB-09)
   */
  static readonly EDAD_MINIMA = 13;

  /**
   * Valida el formato de un username
   * 
   * Reglas:
   * - Solo caracteres alfanuméricos y guión bajo
   * - Longitud entre 3 y 20 caracteres
   * 
   * @param username - Username a validar
   * @returns Resultado de validación
   */
  static validarUsername(username: string): ValidationResult {
    if (!username || username.trim().length === 0) {
      return {
        valid: false,
        error: 'El nombre de usuario es obligatorio'
      };
    }

    if (!this.USERNAME_REGEX.test(username)) {
      return {
        valid: false,
        error: `El nombre de usuario debe tener entre ${this.MIN_USERNAME_LENGTH} y ${this.MAX_USERNAME_LENGTH} caracteres y solo puede contener letras, números y guión bajo`
      };
    }

    return { valid: true };
  }

  /**
   * Valida el formato de un email
   * 
   * Usa una regex simple pero efectiva para validación básica
   * La validación definitiva la hace Firebase Auth
   * 
   * @param email - Email a validar
   * @returns Resultado de validación
   */
  static validarEmail(email: string): ValidationResult {
    if (!email || email.trim().length === 0) {
      return {
        valid: false,
        error: 'El correo electrónico es obligatorio'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        error: 'El formato del correo electrónico no es válido'
      };
    }

    return { valid: true };
  }

  /**
   * Valida que una fecha de nacimiento cumpla con la edad mínima
   * 
   * @param fechaNacimiento - Fecha de nacimiento a validar
   * @returns Resultado de validación
   */
  static validarEdad(fechaNacimiento: Date): ValidationResult {
    const edad = this.calcularEdad(fechaNacimiento);

    if (edad < this.EDAD_MINIMA) {
      return {
        valid: false,
        error: `Debes tener al menos ${this.EDAD_MINIMA} años para registrarte`
      };
    }

    return { valid: true };
  }

  /**
   * Calcula la edad en años a partir de una fecha de nacimiento
   * 
   * @param fechaNacimiento - Fecha de nacimiento
   * @returns Edad en años completos
   */
  static calcularEdad(fechaNacimiento: Date): number {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    
    // Ajustar si aún no ha cumplido años este año
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  /**
   * Valida el formato de una contraseña
   * 
   * Regla: mínimo 6 caracteres (requisito de Firebase Auth)
   * 
   * @param password - Contraseña a validar
   * @returns Resultado de validación
   */
  static validarPassword(password: string): ValidationResult {
    if (!password || password.length === 0) {
      return {
        valid: false,
        error: 'La contraseña es obligatoria'
      };
    }

    if (password.length < 6) {
      return {
        valid: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      };
    }

    return { valid: true };
  }
}

/**
 * Validadores de publicaciones
 */
export class PostValidators {
  /**
   * Longitud máxima del contenido de una publicación
   */
  static readonly MAX_CONTENIDO_LENGTH = 500;

  /**
   * Valida el contenido de una publicación
   * 
   * Reglas:
   * - No puede estar vacío (después de trim)
   * - No puede exceder MAX_CONTENIDO_LENGTH caracteres
   * 
   * @param contenido - Contenido a validar
   * @returns Resultado de validación
   */
  static validarContenido(contenido: string): ValidationResult {
    if (!contenido || contenido.trim().length === 0) {
      return {
        valid: false,
        error: 'El contenido no puede estar vacío'
      };
    }

    if (contenido.trim().length > this.MAX_CONTENIDO_LENGTH) {
      return {
        valid: false,
        error: `El contenido no puede exceder ${this.MAX_CONTENIDO_LENGTH} caracteres`
      };
    }

    return { valid: true };
  }

  /**
   * Obtiene el mensaje informativo sobre límite de caracteres
   * 
   * @param contenidoActual - Contenido actual (opcional)
   * @returns Mensaje informativo
   */
  static getMensajeLimiteCaracteres(contenidoActual?: string): string {
    if (contenidoActual) {
      const restantes = this.MAX_CONTENIDO_LENGTH - contenidoActual.length;
      return `${restantes} caracteres restantes`;
    }
    return `Máximo ${this.MAX_CONTENIDO_LENGTH} caracteres`;
  }
}

/**
 * Validadores generales
 */
export class GeneralValidators {
  /**
   * Valida que un campo no esté vacío
   * 
   * @param value - Valor a validar
   * @param fieldName - Nombre del campo para mensaje de error
   * @returns Resultado de validación
   */
  static validarNoVacio(value: string, fieldName: string): ValidationResult {
    if (!value || value.trim().length === 0) {
      return {
        valid: false,
        error: `${fieldName} es obligatorio`
      };
    }

    return { valid: true };
  }

  /**
   * Valida que una fecha sea válida
   * 
   * @param date - Fecha a validar
   * @param fieldName - Nombre del campo para mensaje de error
   * @returns Resultado de validación
   */
  static validarFecha(date: Date | null | undefined, fieldName: string): ValidationResult {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return {
        valid: false,
        error: `${fieldName} no es una fecha válida`
      };
    }

    return { valid: true };
  }

  /**
   * Valida que una fecha no sea futura
   * 
   * @param date - Fecha a validar
   * @param fieldName - Nombre del campo para mensaje de error
   * @returns Resultado de validación
   */
  static validarNoFutura(date: Date, fieldName: string): ValidationResult {
    const validacionFecha = this.validarFecha(date, fieldName);
    if (!validacionFecha.valid) {
      return validacionFecha;
    }

    if (date.getTime() > Date.now()) {
      return {
        valid: false,
        error: `${fieldName} no puede ser una fecha futura`
      };
    }

    return { valid: true };
  }
}
