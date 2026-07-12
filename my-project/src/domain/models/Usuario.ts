import { UserRole } from '../enums/UserRole';

/**
 * Datos de perfil de usuario
 */
export interface UsuarioData {
  uid: string;
  username: string;
  email: string;
  fechaNacimiento: Date;
  rol: UserRole;
  fechaCreacion: Date;
}

/**
 * Modelo de dominio: Usuario
 * 
 * @description Representa un usuario del sistema con sus reglas de negocio
 * 
 * Reglas de negocio:
 * - Edad mínima: 13 años (AMB-09)
 * - Username único en todo el sistema
 * - Campos inmutables post-registro: email, fechaNacimiento, rol (AMB-01)
 * - Solo el usuario puede modificar su username y contraseña
 * - Solo un admin puede modificar el rol (manualmente en Firestore Console)
 */
export class Usuario {
  readonly uid: string;
  private _username: string;
  readonly email: string;
  readonly fechaNacimiento: Date;
  readonly rol: UserRole;
  readonly fechaCreacion: Date;

  constructor(data: UsuarioData) {
    this.uid = data.uid;
    this._username = data.username;
    this.email = data.email;
    this.fechaNacimiento = data.fechaNacimiento;
    this.rol = data.rol;
    this.fechaCreacion = data.fechaCreacion;
  }

  get username(): string {
    return this._username;
  }

  /**
   * Actualiza el username del usuario
   * IMPORTANTE: Esta operación requiere transacción en Firestore para validar unicidad
   */
  setUsername(newUsername: string): void {
    this._username = newUsername;
  }



  /**
   * Calcula la edad del usuario en años
   */
  getEdad(): number {
    return Usuario.calcularEdad(this.fechaNacimiento);
  }

  /**
   * Valida si el usuario cumple con la edad mínima (13 años)
   */
  cumpleEdadMinima(): boolean {
    return this.getEdad() >= Usuario.EDAD_MINIMA;
  }

  /**
   * Convierte el modelo a formato Firestore
   */
  toFirestore(): Record<string, unknown> {
    return {
      uid: this.uid,
      username: this._username,
      email: this.email,
      fechaNacimiento: this.fechaNacimiento,
      rol: this.rol,
      fechaCreacion: this.fechaCreacion
    };
  }

  /**
   * Crea una instancia de Usuario desde datos de Firestore
   */
  static fromFirestore(data: Record<string, unknown>): Usuario {
    return new Usuario({
      uid: data.uid as string,
      username: data.username as string,
      email: data.email as string,
      fechaNacimiento: (data.fechaNacimiento as { toDate: () => Date }).toDate(),
      rol: data.rol as UserRole,
      fechaCreacion: (data.fechaCreacion as { toDate: () => Date }).toDate()
    });
  }

  // ==================== MÉTODOS ESTÁTICOS ====================

  /**
   * Edad mínima requerida para registrarse (AMB-09)
   */
  static readonly EDAD_MINIMA = 13;

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
   * Valida si una fecha de nacimiento cumple con la edad mínima
   * 
   * @param fechaNacimiento - Fecha de nacimiento a validar
   * @returns true si cumple edad mínima (>= 13 años)
   */
  static validarEdad(fechaNacimiento: Date): boolean {
    const edad = Usuario.calcularEdad(fechaNacimiento);
    return edad >= Usuario.EDAD_MINIMA;
  }

  /**
   * Obtiene el mensaje de error de validación de edad
   */
  static getMensajeErrorEdad(): string {
    return `Debes tener al menos ${Usuario.EDAD_MINIMA} años para registrarte`;
  }
}
