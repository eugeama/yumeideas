/**
 * Tests básicos del dominio - Fase 2
 * 
 * Estos tests verifican la lógica de negocio de los modelos de dominio
 */

import { describe, it, expect } from '@jest/globals';
import { Usuario } from '../../src/domain/models/Usuario';
import { Publicacion } from '../../src/domain/models/Publicacion';
import { UserRole } from '../../src/domain/enums/UserRole';
import { PostVisibility } from '../../src/domain/enums/PostVisibility';
import { LikeRules } from '../../src/domain/rules/likeRules';
import { AdminRules } from '../../src/domain/rules/adminRules';
import { UserValidators, PostValidators } from '../../src/infrastructure/utils/validators';

describe('Domain - Usuario', () => {
  it('debe calcular la edad correctamente', () => {
    const fechaNacimiento = new Date('2010-01-01');
    const edad = Usuario.calcularEdad(fechaNacimiento);
    expect(edad).toBeGreaterThanOrEqual(13);
  });

  it('debe validar edad mínima de 13 años', () => {
    const fechaNacimientoValida = new Date('2010-01-01');
    const fechaNacimientoInvalida = new Date('2020-01-01');
    
    expect(Usuario.validarEdad(fechaNacimientoValida)).toBe(true);
    expect(Usuario.validarEdad(fechaNacimientoInvalida)).toBe(false);
  });

  it('debe identificar correctamente si es admin', () => {
    const admin = new Usuario({
      uid: 'admin1',
      username: 'admin',
      email: 'admin@test.com',
      fechaNacimiento: new Date('2000-01-01'),
      rol: UserRole.ADMIN,
      fechaCreacion: new Date()
    });

    const usuario = new Usuario({
      uid: 'user1',
      username: 'user',
      email: 'user@test.com',
      fechaNacimiento: new Date('2000-01-01'),
      rol: UserRole.USUARIO,
      fechaCreacion: new Date()
    });

    expect(admin.isAdmin()).toBe(true);
    expect(usuario.isAdmin()).toBe(false);
  });
});

describe('Domain - Publicacion', () => {
  const autor = new Usuario({
    uid: 'autor1',
    username: 'autor',
    email: 'autor@test.com',
    fechaNacimiento: new Date('2000-01-01'),
    rol: UserRole.USUARIO,
    fechaCreacion: new Date()
  });

  const otroUsuario = new Usuario({
    uid: 'user2',
    username: 'otro',
    email: 'otro@test.com',
    fechaNacimiento: new Date('2000-01-01'),
    rol: UserRole.USUARIO,
    fechaCreacion: new Date()
  });

  const admin = new Usuario({
    uid: 'admin1',
    username: 'admin',
    email: 'admin@test.com',
    fechaNacimiento: new Date('2000-01-01'),
    rol: UserRole.ADMIN,
    fechaCreacion: new Date()
  });

  it('debe validar contenido no vacío', () => {
    expect(Publicacion.validarContenido('Hola mundo')).toBe(true);
    expect(Publicacion.validarContenido('')).toBe(false);
    expect(Publicacion.validarContenido('   ')).toBe(false);
  });

  it('debe validar contenido con longitud máxima', () => {
    const contenidoLargo = 'a'.repeat(501);
    expect(Publicacion.validarContenido(contenidoLargo)).toBe(false);
  });

  it('publicación pública debe ser visible para todos', () => {
    const publicacion = new Publicacion({
      id: 'post1',
      contenido: 'Contenido público',
      autorId: autor.uid,
      autorUsername: autor.username,
      autorRol: autor.rol,
      visibilidad: PostVisibility.PUBLICA,
      fechaCreacion: new Date(),
      fechaModificacion: new Date(),
      likesCount: 0
    });

    expect(publicacion.puedeVer(autor)).toBe(true);
    expect(publicacion.puedeVer(otroUsuario)).toBe(true);
    expect(publicacion.puedeVer(admin)).toBe(true);
  });

  it('publicación privada solo visible para autor y admin', () => {
    const publicacion = new Publicacion({
      id: 'post1',
      contenido: 'Contenido privado',
      autorId: autor.uid,
      autorUsername: autor.username,
      autorRol: autor.rol,
      visibilidad: PostVisibility.PRIVADA,
      fechaCreacion: new Date(),
      fechaModificacion: new Date(),
      likesCount: 0
    });

    expect(publicacion.puedeVer(autor)).toBe(true);
    expect(publicacion.puedeVer(otroUsuario)).toBe(false);
    expect(publicacion.puedeVer(admin)).toBe(true);
  });

  it('solo el autor puede editar su publicación', () => {
    const publicacion = new Publicacion({
      id: 'post1',
      contenido: 'Contenido',
      autorId: autor.uid,
      autorUsername: autor.username,
      autorRol: autor.rol,
      visibilidad: PostVisibility.PUBLICA,
      fechaCreacion: new Date(),
      fechaModificacion: new Date(),
      likesCount: 0
    });

    expect(publicacion.puedeEditar(autor)).toBe(true);
    expect(publicacion.puedeEditar(otroUsuario)).toBe(false);
    expect(publicacion.puedeEditar(admin)).toBe(false); // Ni siquiera admin
  });

  it('autor y admin pueden borrar, pero admin no puede borrar de otro admin', () => {
    const publicacionUsuario = new Publicacion({
      id: 'post1',
      contenido: 'Contenido',
      autorId: autor.uid,
      autorUsername: autor.username,
      autorRol: autor.rol,
      visibilidad: PostVisibility.PUBLICA,
      fechaCreacion: new Date(),
      fechaModificacion: new Date(),
      likesCount: 0
    });

    const publicacionAdmin = new Publicacion({
      id: 'post2',
      contenido: 'Contenido admin',
      autorId: admin.uid,
      autorUsername: admin.username,
      autorRol: admin.rol,
      visibilidad: PostVisibility.PUBLICA,
      fechaCreacion: new Date(),
      fechaModificacion: new Date(),
      likesCount: 0
    });

    // Autor puede borrar su propia publicación
    expect(publicacionUsuario.puedeBorrar(autor)).toBe(true);
    
    // Otro usuario no puede borrar
    expect(publicacionUsuario.puedeBorrar(otroUsuario)).toBe(false);
    
    // Admin puede borrar publicación de usuario normal
    expect(publicacionUsuario.puedeBorrar(admin)).toBe(true);
    
    // Admin NO puede borrar publicación de otro admin
    const otroAdmin = new Usuario({
      uid: 'admin2',
      username: 'admin2',
      email: 'admin2@test.com',
      fechaNacimiento: new Date('2000-01-01'),
      rol: UserRole.ADMIN,
      fechaCreacion: new Date()
    });
    expect(publicacionAdmin.puedeBorrar(otroAdmin)).toBe(false);
  });
});

describe('Domain - LikeRules', () => {
  const autor = new Usuario({
    uid: 'autor1',
    username: 'autor',
    email: 'autor@test.com',
    fechaNacimiento: new Date('2000-01-01'),
    rol: UserRole.USUARIO,
    fechaCreacion: new Date()
  });

  const otroUsuario = new Usuario({
    uid: 'user2',
    username: 'otro',
    email: 'otro@test.com',
    fechaNacimiento: new Date('2000-01-01'),
    rol: UserRole.USUARIO,
    fechaCreacion: new Date()
  });

  it('un usuario NO puede darse like a sí mismo (AMB-05)', () => {
    const publicacion = new Publicacion({
      id: 'post1',
      contenido: 'Contenido',
      autorId: autor.uid,
      autorUsername: autor.username,
      autorRol: autor.rol,
      visibilidad: PostVisibility.PUBLICA,
      fechaCreacion: new Date(),
      fechaModificacion: new Date(),
      likesCount: 0
    });

    expect(LikeRules.puedeDarLike(autor, publicacion)).toBe(false);
  });

  it('un usuario puede dar like a publicación pública ajena', () => {
    const publicacion = new Publicacion({
      id: 'post1',
      contenido: 'Contenido',
      autorId: autor.uid,
      autorUsername: autor.username,
      autorRol: autor.rol,
      visibilidad: PostVisibility.PUBLICA,
      fechaCreacion: new Date(),
      fechaModificacion: new Date(),
      likesCount: 0
    });

    expect(LikeRules.puedeDarLike(otroUsuario, publicacion)).toBe(true);
  });

  it('NO se puede dar like a publicación privada', () => {
    const publicacion = new Publicacion({
      id: 'post1',
      contenido: 'Contenido',
      autorId: autor.uid,
      autorUsername: autor.username,
      autorRol: autor.rol,
      visibilidad: PostVisibility.PRIVADA,
      fechaCreacion: new Date(),
      fechaModificacion: new Date(),
      likesCount: 0
    });

    expect(LikeRules.puedeDarLike(otroUsuario, publicacion)).toBe(false);
  });
});

describe('Domain - AdminRules', () => {
  const admin1 = new Usuario({
    uid: 'admin1',
    username: 'admin1',
    email: 'admin1@test.com',
    fechaNacimiento: new Date('2000-01-01'),
    rol: UserRole.ADMIN,
    fechaCreacion: new Date()
  });

  const admin2 = new Usuario({
    uid: 'admin2',
    username: 'admin2',
    email: 'admin2@test.com',
    fechaNacimiento: new Date('2000-01-01'),
    rol: UserRole.ADMIN,
    fechaCreacion: new Date()
  });

  const usuario = new Usuario({
    uid: 'user1',
    username: 'user',
    email: 'user@test.com',
    fechaNacimiento: new Date('2000-01-01'),
    rol: UserRole.USUARIO,
    fechaCreacion: new Date()
  });

  it('admin puede afectar a usuario normal', () => {
    expect(AdminRules.puedeAfectarUsuario(admin1, usuario.uid, usuario.rol)).toBe(true);
  });

  it('admin NO puede afectar a otro admin (AMB-07)', () => {
    expect(AdminRules.puedeAfectarUsuario(admin1, admin2.uid, admin2.rol)).toBe(false);
  });

  it('admin puede afectarse a sí mismo', () => {
    expect(AdminRules.puedeAfectarUsuario(admin1, admin1.uid, admin1.rol)).toBe(true);
  });

  it('usuario normal NO puede usar funciones de admin', () => {
    expect(AdminRules.puedeAfectarUsuario(usuario, admin1.uid, admin1.rol)).toBe(false);
  });
});

describe('Infrastructure - Validators', () => {
  it('debe validar username correcto', () => {
    expect(UserValidators.validarUsername('usuario123').valid).toBe(true);
    expect(UserValidators.validarUsername('user_name').valid).toBe(true);
    expect(UserValidators.validarUsername('abc').valid).toBe(true);
  });

  it('debe rechazar username inválido', () => {
    expect(UserValidators.validarUsername('ab').valid).toBe(false); // Muy corto
    expect(UserValidators.validarUsername('a'.repeat(21)).valid).toBe(false); // Muy largo
    expect(UserValidators.validarUsername('user-name').valid).toBe(false); // Guion no permitido
    expect(UserValidators.validarUsername('user name').valid).toBe(false); // Espacio no permitido
    expect(UserValidators.validarUsername('').valid).toBe(false); // Vacío
  });

  it('debe validar email correcto', () => {
    expect(UserValidators.validarEmail('test@example.com').valid).toBe(true);
    expect(UserValidators.validarEmail('user.name@domain.co.uk').valid).toBe(true);
  });

  it('debe rechazar email inválido', () => {
    expect(UserValidators.validarEmail('invalid').valid).toBe(false);
    expect(UserValidators.validarEmail('invalid@').valid).toBe(false);
    expect(UserValidators.validarEmail('@domain.com').valid).toBe(false);
    expect(UserValidators.validarEmail('').valid).toBe(false);
  });

  it('debe validar contraseña con mínimo 6 caracteres', () => {
    expect(UserValidators.validarPassword('123456').valid).toBe(true);
    expect(UserValidators.validarPassword('abcdefgh').valid).toBe(true);
    expect(UserValidators.validarPassword('12345').valid).toBe(false);
    expect(UserValidators.validarPassword('').valid).toBe(false);
  });

  it('debe validar contenido de publicación', () => {
    expect(PostValidators.validarContenido('Hola mundo').valid).toBe(true);
    expect(PostValidators.validarContenido('a'.repeat(500)).valid).toBe(true);
    expect(PostValidators.validarContenido('a'.repeat(501)).valid).toBe(false);
    expect(PostValidators.validarContenido('').valid).toBe(false);
    expect(PostValidators.validarContenido('   ').valid).toBe(false);
  });
});
