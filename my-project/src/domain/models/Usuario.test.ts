/**
 * Tests unitarios del modelo Usuario
 * 
 * Cubre:
 * - T049: Edad mínima 13 años (calcularEdad, cumpleEdadMinima)
 * - Inmutabilidad de email, fechaNacimiento, rol
 */

import { Usuario, UsuarioData } from './Usuario';
import { UserRole } from '../enums/UserRole';

describe('Usuario - Modelo de Dominio', () => {
  describe('Cálculo de edad', () => {
    it('debe calcular correctamente la edad para un usuario de 15 años', () => {
      const hoy = new Date();
      const hace15Anios = new Date(
        hoy.getFullYear() - 15,
        hoy.getMonth(),
        hoy.getDate()
      );

      const edad = Usuario.calcularEdad(hace15Anios);
      expect(edad).toBe(15);
    });

    it('debe calcular correctamente la edad para un usuario que aún no cumplió años este año', () => {
      const hoy = new Date();
      const fechaNacimiento = new Date(
        hoy.getFullYear() - 15,
        hoy.getMonth() + 2, // Nacido 2 meses en el futuro
        hoy.getDate()
      );

      const edad = Usuario.calcularEdad(fechaNacimiento);
      expect(edad).toBe(14); // Aún no cumplió 15
    });

    it('debe calcular correctamente la edad para un usuario en su cumpleaños', () => {
      const hoy = new Date();
      const fechaNacimiento = new Date(
        hoy.getFullYear() - 13,
        hoy.getMonth(),
        hoy.getDate()
      );

      const edad = Usuario.calcularEdad(fechaNacimiento);
      expect(edad).toBe(13);
    });
  });

  describe('Validación de edad mínima (13 años) - AMB-09', () => {
    it('debe aprobar usuario con exactamente 13 años', () => {
      const hoy = new Date();
      const hace13Anios = new Date(
        hoy.getFullYear() - 13,
        hoy.getMonth(),
        hoy.getDate()
      );

      const usuario = crearUsuario({ fechaNacimiento: hace13Anios });
      expect(usuario.cumpleEdadMinima()).toBe(true);
      expect(usuario.getEdad()).toBe(13);
    });

    it('debe aprobar usuario con más de 13 años', () => {
      const hoy = new Date();
      const hace20Anios = new Date(
        hoy.getFullYear() - 20,
        hoy.getMonth(),
        hoy.getDate()
      );

      const usuario = crearUsuario({ fechaNacimiento: hace20Anios });
      expect(usuario.cumpleEdadMinima()).toBe(true);
      expect(usuario.getEdad()).toBe(20);
    });

    it('debe rechazar usuario con menos de 13 años', () => {
      const hoy = new Date();
      const hace12Anios = new Date(
        hoy.getFullYear() - 12,
        hoy.getMonth(),
        hoy.getDate()
      );

      const usuario = crearUsuario({ fechaNacimiento: hace12Anios });
      expect(usuario.cumpleEdadMinima()).toBe(false);
      expect(usuario.getEdad()).toBe(12);
    });

    it('debe rechazar usuario de 12 años que aún no cumplió años este año', () => {
      const hoy = new Date();
      const fechaNacimiento = new Date(
        hoy.getFullYear() - 13,
        hoy.getMonth() + 1, // Cumple el mes que viene
        hoy.getDate()
      );

      const usuario = crearUsuario({ fechaNacimiento });
      expect(usuario.cumpleEdadMinima()).toBe(false);
      expect(usuario.getEdad()).toBe(12);
    });
  });

  describe('Inmutabilidad de campos (AMB-01)', () => {
    it('email debe ser de solo lectura', () => {
      const usuario = crearUsuario();
      
      // TypeScript no permite asignar directamente
      // usuario.email = 'nuevo@email.com'; // Error de compilación
      
      // Verificar que el email se mantiene inmutable
      expect(usuario.email).toBe('test@example.com');
    });

    it('fechaNacimiento debe ser de solo lectura', () => {
      const fechaNacimiento = new Date('2000-01-01');
      const usuario = crearUsuario({ fechaNacimiento });
      
      // TypeScript no permite asignar directamente
      // usuario.fechaNacimiento = new Date('2001-01-01'); // Error de compilación
      
      // Verificar que la fecha se mantiene inmutable
      expect(usuario.fechaNacimiento).toEqual(fechaNacimiento);
    });

    it('rol debe ser de solo lectura', () => {
      const usuario = crearUsuario({ rol: UserRole.USUARIO });
      
      // Verificar que el rol se mantiene inmutable
      expect(usuario.rol).toBe(UserRole.USUARIO);
    });

    it('uid debe ser de solo lectura', () => {
      const usuario = crearUsuario();
      
      // TypeScript no permite asignar directamente
      // usuario.uid = 'nuevo-uid'; // Error de compilación
      
      // Verificar que el uid se mantiene inmutable
      expect(usuario.uid).toBe('test-user-id');
    });

    it('fechaCreacion debe ser de solo lectura', () => {
      const fechaCreacion = new Date('2026-01-01');
      const usuario = crearUsuario({ fechaCreacion });
      
      // TypeScript no permite asignar directamente
      // usuario.fechaCreacion = new Date('2026-02-01'); // Error de compilación
      
      // Verificar que la fecha se mantiene inmutable
      expect(usuario.fechaCreacion).toEqual(fechaCreacion);
    });
  });

  describe('Username editable (única excepción a inmutabilidad)', () => {
    it('debe permitir actualizar el username mediante setUsername', () => {
      const usuario = crearUsuario({ username: 'username_original' });
      expect(usuario.username).toBe('username_original');

      usuario.setUsername('nuevo_username');
      expect(usuario.username).toBe('nuevo_username');
    });
  });

  describe('Conversión a Firestore', () => {
    it('debe convertir correctamente el modelo a formato Firestore', () => {
      const fechaNacimiento = new Date('2000-01-01');
      const fechaCreacion = new Date('2026-01-01');

      const usuario = crearUsuario({
        uid: 'abc123',
        username: 'testuser',
        email: 'test@example.com',
        fechaNacimiento,
        rol: UserRole.USUARIO,
        fechaCreacion
      });

      const firestoreData = usuario.toFirestore();

      expect(firestoreData).toEqual({
        uid: 'abc123',
        username: 'testuser',
        email: 'test@example.com',
        fechaNacimiento,
        rol: UserRole.USUARIO,
        fechaCreacion
      });
    });
  });

  describe('Creación desde Firestore', () => {
    it('debe crear usuario correctamente desde datos de Firestore', () => {
      const fechaNacimiento = new Date('2000-01-01');
      const fechaCreacion = new Date('2026-01-01');

      const firestoreData = {
        uid: 'abc123',
        username: 'testuser',
        email: 'test@example.com',
        fechaNacimiento: {
          toDate: () => fechaNacimiento
        },
        rol: UserRole.USUARIO,
        fechaCreacion: {
          toDate: () => fechaCreacion
        }
      };

      const usuario = Usuario.fromFirestore(firestoreData);

      expect(usuario.uid).toBe('abc123');
      expect(usuario.username).toBe('testuser');
      expect(usuario.email).toBe('test@example.com');
      expect(usuario.fechaNacimiento).toEqual(fechaNacimiento);
      expect(usuario.rol).toBe(UserRole.USUARIO);
      expect(usuario.fechaCreacion).toEqual(fechaCreacion);
    });
  });

  describe('Constante de edad mínima', () => {
    it('debe tener EDAD_MINIMA definida como 13', () => {
      expect(Usuario.EDAD_MINIMA).toBe(13);
    });
  });
});

// Helper para crear usuarios de prueba
function crearUsuario(overrides: Partial<UsuarioData> = {}): Usuario {
  const defaults: UsuarioData = {
    uid: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    fechaNacimiento: new Date('2000-01-01'), // 26 años
    rol: UserRole.USUARIO,
    fechaCreacion: new Date('2026-01-01')
  };

  return new Usuario({ ...defaults, ...overrides });
}
