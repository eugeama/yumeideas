/**
 * Tests unitarios del modelo Publicacion
 * 
 * Cubre:
 * - T050: puedeEditar (solo autor), puedeBorrar (solo autor), puedeVer (según visibilidad)
 */

import { Publicacion, PublicacionData } from './Publicacion';
import { Usuario, UsuarioData } from './Usuario';
import { PostVisibility } from '../enums/PostVisibility';
import { UserRole } from '../enums/UserRole';

describe('Publicacion - Modelo de Dominio', () => {
  let usuarioNormal: Usuario;
  let otroUsuarioNormal: Usuario;

  beforeEach(() => {
    usuarioNormal = crearUsuario({ uid: 'user1', username: 'usuario1', rol: UserRole.USUARIO });
    otroUsuarioNormal = crearUsuario({ uid: 'user2', username: 'usuario2', rol: UserRole.USUARIO });
  });

  describe('puedeEditar - Solo el autor puede editar', () => {
    it('el autor debe poder editar su propia publicación', () => {
      const publicacion = crearPublicacion({ autorId: usuarioNormal.uid });
      expect(publicacion.puedeEditar(usuarioNormal)).toBe(true);
    });

    it('un usuario diferente NO debe poder editar publicación ajena', () => {
      const publicacion = crearPublicacion({ autorId: usuarioNormal.uid });
      expect(publicacion.puedeEditar(otroUsuarioNormal)).toBe(false);
    });
  });

  describe('puedeBorrar - Solo el autor puede borrar', () => {
    it('el autor debe poder borrar su propia publicación', () => {
      const publicacion = crearPublicacion({ autorId: usuarioNormal.uid });
      expect(publicacion.puedeBorrar(usuarioNormal)).toBe(true);
    });

    it('un usuario normal NO debe poder borrar publicación ajena', () => {
      const publicacion = crearPublicacion({ autorId: otroUsuarioNormal.uid });
      expect(publicacion.puedeBorrar(usuarioNormal)).toBe(false);
    });
  });

  describe('puedeVer - Visibilidad pública/privada', () => {
    describe('Publicación pública', () => {
      it('cualquier usuario autenticado debe poder ver publicación pública', () => {
        const publicacion = crearPublicacion({ 
          visibilidad: PostVisibility.PUBLICA,
          autorId: usuarioNormal.uid 
        });

        expect(publicacion.puedeVer(otroUsuarioNormal)).toBe(true);
      });

      it('el autor debe poder ver su propia publicación pública', () => {
        const publicacion = crearPublicacion({ 
          visibilidad: PostVisibility.PUBLICA,
          autorId: usuarioNormal.uid 
        });

        expect(publicacion.puedeVer(usuarioNormal)).toBe(true);
      });
    });

    describe('Publicación privada', () => {
      it('el autor debe poder ver su propia publicación privada', () => {
        const publicacion = crearPublicacion({ 
          visibilidad: PostVisibility.PRIVADA,
          autorId: usuarioNormal.uid 
        });

        expect(publicacion.puedeVer(usuarioNormal)).toBe(true);
      });

      it('un usuario normal NO debe poder ver publicación privada ajena', () => {
        const publicacion = crearPublicacion({ 
          visibilidad: PostVisibility.PRIVADA,
          autorId: otroUsuarioNormal.uid 
        });

        expect(publicacion.puedeVer(usuarioNormal)).toBe(false);
      });
    });
  });

  describe('Detección de visibilidad', () => {
    it('debe detectar correctamente publicación pública', () => {
      const publicacion = crearPublicacion({ visibilidad: PostVisibility.PUBLICA });
      expect(publicacion.esPublica()).toBe(true);
      expect(publicacion.esPrivada()).toBe(false);
    });

    it('debe detectar correctamente publicación privada', () => {
      const publicacion = crearPublicacion({ visibilidad: PostVisibility.PRIVADA });
      expect(publicacion.esPublica()).toBe(false);
      expect(publicacion.esPrivada()).toBe(true);
    });
  });

  describe('Validación de contenido', () => {
    it('debe aceptar contenido válido (no vacío, <= 500 caracteres)', () => {
      const contenidoValido = 'Esta es una idea brillante';
      expect(Publicacion.validarContenido(contenidoValido)).toBe(true);
    });

    it('debe rechazar contenido vacío', () => {
      expect(Publicacion.validarContenido('')).toBe(false);
      expect(Publicacion.validarContenido('   ')).toBe(false);
    });

    it('debe rechazar contenido que excede 500 caracteres', () => {
      const contenidoLargo = 'a'.repeat(501);
      expect(Publicacion.validarContenido(contenidoLargo)).toBe(false);
    });

    it('debe aceptar contenido de exactamente 500 caracteres', () => {
      const contenido500 = 'a'.repeat(500);
      expect(Publicacion.validarContenido(contenido500)).toBe(true);
    });

    it('debe trimear el contenido antes de validar', () => {
      const contenidoConEspacios = '   contenido válido   ';
      expect(Publicacion.validarContenido(contenidoConEspacios)).toBe(true);
    });
  });

  describe('Actualización de contenido', () => {
    it('debe actualizar el contenido correctamente', () => {
      const publicacion = crearPublicacion({ contenido: 'Contenido original' });
      const fechaModificacionOriginal = publicacion.fechaModificacion;

      // Esperar un poco para que la fecha sea diferente
      publicacion.setContenido('Contenido actualizado');

      expect(publicacion.contenido).toBe('Contenido actualizado');
      expect(publicacion.fechaModificacion.getTime()).toBeGreaterThanOrEqual(
        fechaModificacionOriginal.getTime()
      );
    });

    it('debe lanzar error al intentar establecer contenido vacío', () => {
      const publicacion = crearPublicacion();

      expect(() => {
        publicacion.setContenido('');
      }).toThrow('El contenido no puede estar vacío');

      expect(() => {
        publicacion.setContenido('   ');
      }).toThrow('El contenido no puede estar vacío');
    });
  });

  describe('Actualización de visibilidad', () => {
    it('debe actualizar la visibilidad correctamente', () => {
      const publicacion = crearPublicacion({ visibilidad: PostVisibility.PUBLICA });
      const fechaModificacionOriginal = publicacion.fechaModificacion;

      publicacion.setVisibilidad(PostVisibility.PRIVADA);

      expect(publicacion.visibilidad).toBe(PostVisibility.PRIVADA);
      expect(publicacion.fechaModificacion.getTime()).toBeGreaterThanOrEqual(
        fechaModificacionOriginal.getTime()
      );
    });

    it('debe poder cambiar de privada a pública', () => {
      const publicacion = crearPublicacion({ visibilidad: PostVisibility.PRIVADA });

      publicacion.setVisibilidad(PostVisibility.PUBLICA);

      expect(publicacion.visibilidad).toBe(PostVisibility.PUBLICA);
    });
  });

  describe('Gestión de contador de likes', () => {
    it('debe incrementar el contador de likes', () => {
      const publicacion = crearPublicacion({ likesCount: 5 });

      publicacion.incrementLikes();

      expect(publicacion.likesCount).toBe(6);
    });

    it('debe decrementar el contador de likes', () => {
      const publicacion = crearPublicacion({ likesCount: 5 });

      publicacion.decrementLikes();

      expect(publicacion.likesCount).toBe(4);
    });

    it('no debe decrementar el contador por debajo de 0', () => {
      const publicacion = crearPublicacion({ likesCount: 0 });

      publicacion.decrementLikes();

      expect(publicacion.likesCount).toBe(0);
    });
  });

  describe('Conversión a Firestore', () => {
    it('debe convertir correctamente el modelo a formato Firestore', () => {
      const fechaCreacion = new Date('2026-01-01');
      const fechaModificacion = new Date('2026-01-02');

      const publicacion = crearPublicacion({
        contenido: 'Contenido de prueba',
        autorId: 'user1',
        autorUsername: 'usuario1',
        autorRol: UserRole.USUARIO,
        visibilidad: PostVisibility.PUBLICA,
        fechaCreacion,
        fechaModificacion,
        likesCount: 10
      });

      const firestoreData = publicacion.toFirestore();

      expect(firestoreData).toEqual({
        contenido: 'Contenido de prueba',
        autorId: 'user1',
        autorUsername: 'usuario1',
        autorRol: UserRole.USUARIO,
        visibilidad: PostVisibility.PUBLICA,
        fechaCreacion,
        fechaModificacion,
        likesCount: 10
      });
    });
  });

  describe('Creación desde Firestore', () => {
    it('debe crear publicación correctamente desde datos de Firestore', () => {
      const fechaCreacion = new Date('2026-01-01');
      const fechaModificacion = new Date('2026-01-02');

      const firestoreData = {
        contenido: 'Contenido de prueba',
        autorId: 'user1',
        autorUsername: 'usuario1',
        autorRol: UserRole.USUARIO,
        visibilidad: PostVisibility.PUBLICA,
        fechaCreacion: {
          toDate: () => fechaCreacion
        },
        fechaModificacion: {
          toDate: () => fechaModificacion
        },
        likesCount: 10
      };

      const publicacion = Publicacion.fromFirestore('post123', firestoreData);

      expect(publicacion.id).toBe('post123');
      expect(publicacion.contenido).toBe('Contenido de prueba');
      expect(publicacion.autorId).toBe('user1');
      expect(publicacion.autorUsername).toBe('usuario1');
      expect(publicacion.autorRol).toBe(UserRole.USUARIO);
      expect(publicacion.visibilidad).toBe(PostVisibility.PUBLICA);
      expect(publicacion.fechaCreacion).toEqual(fechaCreacion);
      expect(publicacion.fechaModificacion).toEqual(fechaModificacion);
      expect(publicacion.likesCount).toBe(10);
    });
  });

  describe('Constante de longitud máxima', () => {
    it('debe tener MAX_CONTENIDO_LENGTH definida como 500', () => {
      expect(Publicacion.MAX_CONTENIDO_LENGTH).toBe(500);
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
