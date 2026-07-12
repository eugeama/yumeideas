/**
 * Tests unitarios de las reglas de likes
 * 
 * Cubre:
 * - T051: puedeDarLike rechaza si usuario es autor del post (AMB-05)
 */

import { LikeRules } from './likeRules';
import { Usuario, UsuarioData } from '../models/Usuario';
import { Publicacion, PublicacionData } from '../models/Publicacion';
import { PostVisibility } from '../enums/PostVisibility';
import { UserRole } from '../enums/UserRole';

describe('LikeRules - Reglas de Negocio de Likes', () => {
  let usuarioAutor: Usuario;
  let otroUsuario: Usuario;

  beforeEach(() => {
    usuarioAutor = crearUsuario({ uid: 'autor1', username: 'autor' });
    otroUsuario = crearUsuario({ uid: 'otro1', username: 'otro' });
  });

  describe('puedeDarLike - Regla AMB-05: No like a publicación propia', () => {
    it('debe rechazar like del autor a su propia publicación pública', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PUBLICA
      });

      const resultado = LikeRules.puedeDarLike(usuarioAutor, publicacion);

      expect(resultado).toBe(false);
    });

    it('debe rechazar like del autor a su propia publicación privada', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PRIVADA
      });

      const resultado = LikeRules.puedeDarLike(usuarioAutor, publicacion);

      expect(resultado).toBe(false);
    });
  });

  describe('puedeDarLike - Solo a publicaciones públicas', () => {
    it('debe permitir like a publicación pública ajena', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PUBLICA
      });

      const resultado = LikeRules.puedeDarLike(otroUsuario, publicacion);

      expect(resultado).toBe(true);
    });

    it('debe rechazar like a publicación privada ajena', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PRIVADA
      });

      const resultado = LikeRules.puedeDarLike(otroUsuario, publicacion);

      expect(resultado).toBe(false);
    });

    it('admin debe poder dar like a publicación pública ajena', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PUBLICA
      });

      const resultado = LikeRules.puedeDarLike(admin, publicacion);

      expect(resultado).toBe(true);
    });

    it('admin NO debe poder dar like a publicación privada ajena', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PRIVADA
      });

      const resultado = LikeRules.puedeDarLike(admin, publicacion);

      expect(resultado).toBe(false);
    });
  });

  describe('puedeQuitarLike - Toggle de like', () => {
    it('debe permitir quitar like de publicación pública', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PUBLICA
      });

      const resultado = LikeRules.puedeQuitarLike(otroUsuario, publicacion);

      expect(resultado).toBe(true);
    });

    it('no debe permitir quitar like de publicación privada', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PRIVADA
      });

      const resultado = LikeRules.puedeQuitarLike(otroUsuario, publicacion);

      expect(resultado).toBe(false);
    });
  });

  describe('puedeToggleLike - Dar o quitar like', () => {
    it('debe permitir dar like (toggle desde sin like) en publicación pública ajena', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PUBLICA
      });

      const resultado = LikeRules.puedeToggleLike(otroUsuario, publicacion, false);

      expect(resultado).toBe(true);
    });

    it('debe permitir quitar like (toggle desde con like) en publicación pública ajena', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PUBLICA
      });

      const resultado = LikeRules.puedeToggleLike(otroUsuario, publicacion, true);

      expect(resultado).toBe(true);
    });

    it('debe rechazar dar like (toggle) en publicación propia', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PUBLICA
      });

      const resultado = LikeRules.puedeToggleLike(usuarioAutor, publicacion, false);

      expect(resultado).toBe(false);
    });

    it('debe rechazar dar like (toggle) en publicación privada ajena', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PRIVADA
      });

      const resultado = LikeRules.puedeToggleLike(otroUsuario, publicacion, false);

      expect(resultado).toBe(false);
    });
  });

  describe('Mensajes de error', () => {
    it('debe tener mensaje de error para like a publicación propia', () => {
      const mensaje = LikeRules.getMensajeErrorLikePropio();
      expect(mensaje).toContain('propia');
      expect(mensaje.length).toBeGreaterThan(0);
    });

    it('debe tener mensaje de error para like a publicación privada', () => {
      const mensaje = LikeRules.getMensajeErrorLikePrivada();
      expect(mensaje).toContain('privada');
      expect(mensaje.length).toBeGreaterThan(0);
    });
  });

  describe('Validación completa del flujo de likes', () => {
    it('usuario normal puede dar like a publicación pública de otro usuario', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PUBLICA
      });

      expect(LikeRules.puedeDarLike(otroUsuario, publicacion)).toBe(true);
      expect(LikeRules.puedeQuitarLike(otroUsuario, publicacion)).toBe(true);
      expect(LikeRules.puedeToggleLike(otroUsuario, publicacion, false)).toBe(true);
      expect(LikeRules.puedeToggleLike(otroUsuario, publicacion, true)).toBe(true);
    });

    it('usuario NO puede dar like a su propia publicación', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PUBLICA
      });

      expect(LikeRules.puedeDarLike(usuarioAutor, publicacion)).toBe(false);
      expect(LikeRules.puedeToggleLike(usuarioAutor, publicacion, false)).toBe(false);
    });

    it('usuario NO puede dar like a publicación privada ajena', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PRIVADA
      });

      expect(LikeRules.puedeDarLike(otroUsuario, publicacion)).toBe(false);
      expect(LikeRules.puedeToggleLike(otroUsuario, publicacion, false)).toBe(false);
    });

    it('admin puede dar like a publicación pública ajena', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PUBLICA
      });

      expect(LikeRules.puedeDarLike(admin, publicacion)).toBe(true);
      expect(LikeRules.puedeToggleLike(admin, publicacion, false)).toBe(true);
    });

    it('admin NO puede dar like a publicación privada ajena (aunque puede verla)', () => {
      const publicacion = crearPublicacion({
        autorId: usuarioAutor.uid,
        visibilidad: PostVisibility.PRIVADA
      });

      // Admin puede ver la publicación privada
      expect(publicacion.puedeVer(admin)).toBe(true);
      
      // Pero NO puede darle like
      expect(LikeRules.puedeDarLike(admin, publicacion)).toBe(false);
      expect(LikeRules.puedeToggleLike(admin, publicacion, false)).toBe(false);
    });
  });
});

// Helpers para crear objetos de prueba
function crearUsuario(overrides: Partial<UsuarioData> = {}): Usuario {
  const defaults: UsuarioData = {
    uid: 'user-id',
    username: 'testuser',
    email: 'test@example.com',
    fechaNacimiento: new Date('2000-01-01'),
    rol: UserRole.USUARIO,
    fechaCreacion: new Date('2026-01-01')
  };

  return new Usuario({ ...defaults, ...overrides });
}

function crearPublicacion(overrides: Partial<PublicacionData> = {}): Publicacion {
  const defaults: PublicacionData = {
    id: 'post-id',
    contenido: 'Contenido de prueba',
    autorId: 'user-id',
    autorUsername: 'testuser',
    autorRol: UserRole.USUARIO,
    visibilidad: PostVisibility.PUBLICA,
    fechaCreacion: new Date('2026-01-01'),
    fechaModificacion: new Date('2026-01-01'),
    likesCount: 0
  };

  return new Publicacion({ ...defaults, ...overrides });
}
