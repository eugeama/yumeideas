/**
 * Tests unitarios de las reglas de administradores
 * 
 * Cubre:
 * - T052: puedeAfectarUsuario rechaza si target es admin (AMB-07)
 */

import { AdminRules } from './adminRules';
import { Usuario, UsuarioData } from '../models/Usuario';
import { UserRole } from '../enums/UserRole';

describe('AdminRules - Protección entre Administradores (AMB-07)', () => {
  let usuarioNormal: Usuario;
  let otroUsuarioNormal: Usuario;
  let admin: Usuario;
  let otroAdmin: Usuario;

  beforeEach(() => {
    usuarioNormal = crearUsuario({ uid: 'user1', username: 'usuario1', rol: UserRole.USUARIO });
    otroUsuarioNormal = crearUsuario({ uid: 'user2', username: 'usuario2', rol: UserRole.USUARIO });
    admin = crearUsuario({ uid: 'admin1', username: 'admin1', rol: UserRole.ADMIN });
    otroAdmin = crearUsuario({ uid: 'admin2', username: 'admin2', rol: UserRole.ADMIN });
  });

  describe('puedeAfectarUsuario - Regla principal AMB-07', () => {
    it('admin puede afectar a usuario normal', () => {
      const resultado = AdminRules.puedeAfectarUsuario(
        admin,
        usuarioNormal.uid,
        usuarioNormal.rol
      );

      expect(resultado).toBe(true);
    });

    it('admin NO puede afectar a otro admin (AMB-07)', () => {
      const resultado = AdminRules.puedeAfectarUsuario(
        admin,
        otroAdmin.uid,
        otroAdmin.rol
      );

      expect(resultado).toBe(false);
    });

    it('admin puede afectarse a sí mismo', () => {
      const resultado = AdminRules.puedeAfectarUsuario(
        admin,
        admin.uid,
        admin.rol
      );

      expect(resultado).toBe(true);
    });

    it('usuario normal NO puede afectar a otro usuario (no es admin)', () => {
      const resultado = AdminRules.puedeAfectarUsuario(
        usuarioNormal,
        otroUsuarioNormal.uid,
        otroUsuarioNormal.rol
      );

      expect(resultado).toBe(false);
    });

    it('usuario normal NO puede afectar a admin (no es admin)', () => {
      const resultado = AdminRules.puedeAfectarUsuario(
        usuarioNormal,
        admin.uid,
        admin.rol
      );

      expect(resultado).toBe(false);
    });
  });

  describe('puedeBorrarCuenta - Borrado de cuentas', () => {
    it('admin puede borrar cuenta de usuario normal', () => {
      const resultado = AdminRules.puedeBorrarCuenta(
        admin,
        usuarioNormal.uid,
        usuarioNormal.rol
      );

      expect(resultado).toBe(true);
    });

    it('admin NO puede borrar cuenta de otro admin (AMB-07)', () => {
      const resultado = AdminRules.puedeBorrarCuenta(
        admin,
        otroAdmin.uid,
        otroAdmin.rol
      );

      expect(resultado).toBe(false);
    });

    it('admin puede borrar su propia cuenta', () => {
      const resultado = AdminRules.puedeBorrarCuenta(
        admin,
        admin.uid,
        admin.rol
      );

      expect(resultado).toBe(true);
    });

    it('usuario normal NO puede borrar cuentas (no es admin)', () => {
      const resultado = AdminRules.puedeBorrarCuenta(
        usuarioNormal,
        otroUsuarioNormal.uid,
        otroUsuarioNormal.rol
      );

      expect(resultado).toBe(false);
    });
  });

  describe('puedeBorrarPublicacion - Borrado de publicaciones', () => {
    it('admin puede borrar publicación de usuario normal', () => {
      const resultado = AdminRules.puedeBorrarPublicacion(
        admin,
        usuarioNormal.uid,
        usuarioNormal.rol
      );

      expect(resultado).toBe(true);
    });

    it('admin NO puede borrar publicación de otro admin (AMB-07)', () => {
      const resultado = AdminRules.puedeBorrarPublicacion(
        admin,
        otroAdmin.uid,
        otroAdmin.rol
      );

      expect(resultado).toBe(false);
    });

    it('admin puede borrar su propia publicación', () => {
      const resultado = AdminRules.puedeBorrarPublicacion(
        admin,
        admin.uid,
        admin.rol
      );

      expect(resultado).toBe(true);
    });

    it('usuario normal NO puede borrar publicaciones ajenas (no es admin)', () => {
      const resultado = AdminRules.puedeBorrarPublicacion(
        usuarioNormal,
        otroUsuarioNormal.uid,
        otroUsuarioNormal.rol
      );

      expect(resultado).toBe(false);
    });
  });

  describe('esAdmin - Detección de administrador', () => {
    it('debe detectar correctamente usuario administrador', () => {
      expect(AdminRules.esAdmin(admin)).toBe(true);
    });

    it('debe detectar correctamente usuario normal', () => {
      expect(AdminRules.esAdmin(usuarioNormal)).toBe(false);
    });
  });

  describe('esRolAdmin - Detección de rol admin', () => {
    it('debe detectar correctamente rol ADMIN', () => {
      expect(AdminRules.esRolAdmin(UserRole.ADMIN)).toBe(true);
    });

    it('debe detectar correctamente rol USUARIO', () => {
      expect(AdminRules.esRolAdmin(UserRole.USUARIO)).toBe(false);
    });
  });

  describe('Mensajes de error', () => {
    it('debe tener mensaje de error para protección entre admins', () => {
      const mensaje = AdminRules.getMensajeErrorProteccionAdmin();
      expect(mensaje).toContain('administrador');
      expect(mensaje).toContain('otro');
      expect(mensaje.length).toBeGreaterThan(0);
    });

    it('debe tener mensaje de error cuando no es admin', () => {
      const mensaje = AdminRules.getMensajeErrorNoEsAdmin();
      expect(mensaje).toContain('administrador');
      expect(mensaje).toContain('permisos');
      expect(mensaje.length).toBeGreaterThan(0);
    });
  });

  describe('Escenarios complejos de protección', () => {
    it('múltiples admins no pueden afectarse entre sí', () => {
      const admin3 = crearUsuario({ uid: 'admin3', rol: UserRole.ADMIN });

      // Admin1 no puede afectar Admin2
      expect(AdminRules.puedeAfectarUsuario(admin, otroAdmin.uid, otroAdmin.rol)).toBe(false);

      // Admin2 no puede afectar Admin1
      expect(AdminRules.puedeAfectarUsuario(otroAdmin, admin.uid, admin.rol)).toBe(false);

      // Admin1 no puede afectar Admin3
      expect(AdminRules.puedeAfectarUsuario(admin, admin3.uid, admin3.rol)).toBe(false);

      // Admin3 no puede afectar Admin2
      expect(AdminRules.puedeAfectarUsuario(admin3, otroAdmin.uid, otroAdmin.rol)).toBe(false);
    });

    it('admin puede afectar múltiples usuarios normales', () => {
      const usuario3 = crearUsuario({ uid: 'user3', rol: UserRole.USUARIO });
      const usuario4 = crearUsuario({ uid: 'user4', rol: UserRole.USUARIO });

      expect(AdminRules.puedeAfectarUsuario(admin, usuarioNormal.uid, usuarioNormal.rol)).toBe(true);
      expect(AdminRules.puedeAfectarUsuario(admin, otroUsuarioNormal.uid, otroUsuarioNormal.rol)).toBe(true);
      expect(AdminRules.puedeAfectarUsuario(admin, usuario3.uid, usuario3.rol)).toBe(true);
      expect(AdminRules.puedeAfectarUsuario(admin, usuario4.uid, usuario4.rol)).toBe(true);
    });

    it('usuarios normales no pueden afectarse entre sí ni a admins', () => {
      // Usuario1 no puede afectar Usuario2
      expect(AdminRules.puedeAfectarUsuario(usuarioNormal, otroUsuarioNormal.uid, otroUsuarioNormal.rol)).toBe(false);

      // Usuario2 no puede afectar Usuario1
      expect(AdminRules.puedeAfectarUsuario(otroUsuarioNormal, usuarioNormal.uid, usuarioNormal.rol)).toBe(false);

      // Usuario1 no puede afectar Admin
      expect(AdminRules.puedeAfectarUsuario(usuarioNormal, admin.uid, admin.rol)).toBe(false);

      // Usuario2 no puede afectar Admin
      expect(AdminRules.puedeAfectarUsuario(otroUsuarioNormal, admin.uid, admin.rol)).toBe(false);
    });
  });

  describe('Consistencia con modelo Publicacion', () => {
    it('las reglas de AdminRules deben ser consistentes con Publicacion.puedeBorrar', () => {
      // Esta es una verificación conceptual que asegura que las reglas
      // implementadas aquí son consistentes con las del modelo Publicacion

      // Admin puede borrar publicación de usuario normal (según AdminRules)
      expect(AdminRules.puedeBorrarPublicacion(admin, usuarioNormal.uid, usuarioNormal.rol)).toBe(true);

      // Admin NO puede borrar publicación de otro admin (según AdminRules)
      expect(AdminRules.puedeBorrarPublicacion(admin, otroAdmin.uid, otroAdmin.rol)).toBe(false);

      // Estas reglas deben coincidir con la lógica en Publicacion.puedeBorrar()
    });
  });
});

// Helper para crear usuarios de prueba
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
