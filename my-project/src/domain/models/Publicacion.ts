import { PostVisibility } from '../enums/PostVisibility';
import { Usuario } from './Usuario';
import { UserRole } from '../enums/UserRole';

/**
 * Datos de una publicación
 */
export interface PublicacionData {
  id: string;
  contenido: string;
  autorId: string;
  autorUsername: string;
  autorRol: UserRole;
  visibilidad: PostVisibility;
  fechaCreacion: Date;
  fechaModificacion: Date;
  likesCount: number;
}

/**
 * Modelo de dominio: Publicación
 * 
 * @description Representa una publicación (idea) con sus reglas de visibilidad y autorización
 * 
 * Reglas de negocio:
 * - El contenido no puede estar vacío
 * - La visibilidad puede ser pública o privada
 * - Solo el autor puede editar su publicación
 * - Solo el autor o un admin puede borrar la publicación
 * - Un admin NO puede borrar publicaciones de otro admin (AMB-07)
 * - La visibilidad determina quién puede ver la publicación:
 *   - Pública: todos los usuarios autenticados
 *   - Privada: solo autor y administradores
 */
export class Publicacion {
  readonly id: string;
  private _contenido: string;
  readonly autorId: string;
  readonly autorUsername: string;
  readonly autorRol: UserRole;
  private _visibilidad: PostVisibility;
  readonly fechaCreacion: Date;
  private _fechaModificacion: Date;
  private _likesCount: number;

  constructor(data: PublicacionData) {
    this.id = data.id;
    this._contenido = data.contenido;
    this.autorId = data.autorId;
    this.autorUsername = data.autorUsername;
    this.autorRol = data.autorRol;
    this._visibilidad = data.visibilidad;
    this.fechaCreacion = data.fechaCreacion;
    this._fechaModificacion = data.fechaModificacion;
    this._likesCount = data.likesCount;
  }

  get contenido(): string {
    return this._contenido;
  }

  get visibilidad(): PostVisibility {
    return this._visibilidad;
  }

  get fechaModificacion(): Date {
    return this._fechaModificacion;
  }

  get likesCount(): number {
    return this._likesCount;
  }

  /**
   * Actualiza el contenido de la publicación
   */
  setContenido(nuevoContenido: string): void {
    if (!Publicacion.validarContenido(nuevoContenido)) {
      throw new Error('El contenido no puede estar vacío');
    }
    this._contenido = nuevoContenido;
    this._fechaModificacion = new Date();
  }

  /**
   * Actualiza la visibilidad de la publicación
   */
  setVisibilidad(nuevaVisibilidad: PostVisibility): void {
    this._visibilidad = nuevaVisibilidad;
    this._fechaModificacion = new Date();
  }

  /**
   * Incrementa el contador de likes
   * IMPORTANTE: Esta operación debe ejecutarse en transacción en Firestore
   */
  incrementLikes(): void {
    this._likesCount++;
  }

  /**
   * Decrementa el contador de likes
   * IMPORTANTE: Esta operación debe ejecutarse en transacción en Firestore
   */
  decrementLikes(): void {
    if (this._likesCount > 0) {
      this._likesCount--;
    }
  }

  /**
   * Verifica si la publicación es pública
   */
  esPublica(): boolean {
    return this._visibilidad === PostVisibility.PUBLICA;
  }

  /**
   * Verifica si la publicación es privada
   */
  esPrivada(): boolean {
    return this._visibilidad === PostVisibility.PRIVADA;
  }

  /**
   * Verifica si un usuario puede ver esta publicación
   * 
   * Reglas:
   * - Publicación pública: todos los usuarios autenticados
   * - Publicación privada: solo autor y administradores
   * 
   * @param usuario - Usuario que intenta ver la publicación
   * @returns true si el usuario puede ver la publicación
   */
  puedeVer(usuario: Usuario): boolean {
    // Publicación pública: todos pueden ver
    if (this.esPublica()) {
      return true;
    }

    // Publicación privada: solo autor o admin
    return this.esAutor(usuario) || usuario.isAdmin();
  }

  /**
   * Verifica si un usuario puede editar esta publicación
   * 
   * Regla: Solo el autor puede editar su propia publicación
   * Ni siquiera un admin puede editar publicaciones ajenas
   * 
   * @param usuario - Usuario que intenta editar
   * @returns true si el usuario puede editar
   */
  puedeEditar(usuario: Usuario): boolean {
    return this.esAutor(usuario);
  }

  /**
   * Verifica si un usuario puede borrar esta publicación
   * 
   * Reglas:
   * - El autor puede borrar su propia publicación
   * - Un admin puede borrar publicaciones de usuarios normales
   * - Un admin NO puede borrar publicaciones de otro admin (AMB-07)
   * 
   * @param usuario - Usuario que intenta borrar
   * @returns true si el usuario puede borrar
   */
  puedeBorrar(usuario: Usuario): boolean {
    // El autor siempre puede borrar su propia publicación
    if (this.esAutor(usuario)) {
      return true;
    }

    // Un admin puede borrar publicaciones de usuarios normales
    // pero NO de otros admins
    if (usuario.isAdmin()) {
      return this.autorRol !== UserRole.ADMIN;
    }

    return false;
  }

  /**
   * Verifica si un usuario es el autor de esta publicación
   */
  private esAutor(usuario: Usuario): boolean {
    return this.autorId === usuario.uid;
  }

  /**
   * Convierte el modelo a formato Firestore
   */
  toFirestore(): Record<string, unknown> {
    return {
      contenido: this._contenido,
      autorId: this.autorId,
      autorUsername: this.autorUsername,
      autorRol: this.autorRol,
      visibilidad: this._visibilidad,
      fechaCreacion: this.fechaCreacion,
      fechaModificacion: this._fechaModificacion,
      likesCount: this._likesCount
    };
  }

  /**
   * Crea una instancia de Publicacion desde datos de Firestore
   */
  static fromFirestore(id: string, data: Record<string, unknown>): Publicacion {
    return new Publicacion({
      id,
      contenido: data.contenido as string,
      autorId: data.autorId as string,
      autorUsername: data.autorUsername as string,
      autorRol: data.autorRol as UserRole,
      visibilidad: data.visibilidad as PostVisibility,
      fechaCreacion: (data.fechaCreacion as { toDate: () => Date }).toDate(),
      fechaModificacion: (data.fechaModificacion as { toDate: () => Date }).toDate(),
      likesCount: (data.likesCount as number) || 0
    });
  }

  // ==================== MÉTODOS ESTÁTICOS ====================

  /**
   * Longitud máxima del contenido de una publicación (caracteres)
   */
  static readonly MAX_CONTENIDO_LENGTH = 500;

  /**
   * Valida que el contenido de una publicación sea válido
   * 
   * Reglas:
   * - No puede estar vacío (después de trim)
   * - No puede exceder MAX_CONTENIDO_LENGTH caracteres
   * 
   * @param contenido - Contenido a validar
   * @returns true si el contenido es válido
   */
  static validarContenido(contenido: string): boolean {
    const trimmed = contenido.trim();
    return trimmed.length > 0 && trimmed.length <= Publicacion.MAX_CONTENIDO_LENGTH;
  }

  /**
   * Obtiene el mensaje de error de validación de contenido
   */
  static getMensajeErrorContenido(): string {
    return `El contenido debe tener entre 1 y ${Publicacion.MAX_CONTENIDO_LENGTH} caracteres`;
  }
}
