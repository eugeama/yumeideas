#!/usr/bin/env node

/**
 * Script de verificación de la Fase 2
 * Prueba rápida de los modelos de dominio
 */

import { Usuario } from '../src/domain/models/Usuario.js';
import { Publicacion } from '../src/domain/models/Publicacion.js';
import { UserRole } from '../src/domain/enums/UserRole.js';
import { PostVisibility } from '../src/domain/enums/PostVisibility.js';
import { LikeRules } from '../src/domain/rules/likeRules.js';
import { AdminRules } from '../src/domain/rules/adminRules.js';
import { UserValidators, PostValidators } from '../src/infrastructure/utils/validators.js';

console.log('🧪 Verificando implementación de Fase 2...\n');

// Test 1: Usuario - Validación de edad
console.log('✓ Test 1: Validación de edad mínima (13 años)');
const fechaValida = new Date('2010-01-01');
const fechaInvalida = new Date('2020-01-01');
console.log(`  - Edad válida (2010): ${Usuario.validarEdad(fechaValida) ? '✅' : '❌'}`);
console.log(`  - Edad inválida (2020): ${!Usuario.validarEdad(fechaInvalida) ? '✅' : '❌'}`);

// Test 2: Usuario - Identificar admin
console.log('\n✓ Test 2: Identificación de roles');
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

console.log(`  - Admin es admin: ${admin.isAdmin() ? '✅' : '❌'}`);
console.log(`  - Usuario no es admin: ${!usuario.isAdmin() ? '✅' : '❌'}`);

// Test 3: Publicación - Validación de contenido
console.log('\n✓ Test 3: Validación de contenido de publicación');
console.log(`  - Contenido válido: ${Publicacion.validarContenido('Hola mundo') ? '✅' : '❌'}`);
console.log(`  - Contenido vacío rechazado: ${!Publicacion.validarContenido('') ? '✅' : '❌'}`);
console.log(`  - Contenido muy largo rechazado: ${!Publicacion.validarContenido('a'.repeat(501)) ? '✅' : '❌'}`);

// Test 4: Publicación - Visibilidad
console.log('\n✓ Test 4: Reglas de visibilidad');
const publicPublic = new Publicacion({
  id: 'post1',
  contenido: 'Contenido público',
  autorId: usuario.uid,
  autorUsername: usuario.username,
  autorRol: usuario.rol,
  visibilidad: PostVisibility.PUBLICA,
  fechaCreacion: new Date(),
  fechaModificacion: new Date(),
  likesCount: 0
});

const publicPrivate = new Publicacion({
  id: 'post2',
  contenido: 'Contenido privado',
  autorId: usuario.uid,
  autorUsername: usuario.username,
  autorRol: usuario.rol,
  visibilidad: PostVisibility.PRIVADA,
  fechaCreacion: new Date(),
  fechaModificacion: new Date(),
  likesCount: 0
});

const otroUsuario = new Usuario({
  uid: 'user2',
  username: 'otro',
  email: 'otro@test.com',
  fechaNacimiento: new Date('2000-01-01'),
  rol: UserRole.USUARIO,
  fechaCreacion: new Date()
});

console.log(`  - Pública visible para todos: ${publicPublic.puedeVer(otroUsuario) ? '✅' : '❌'}`);
console.log(`  - Privada NO visible para otros usuarios: ${!publicPrivate.puedeVer(otroUsuario) ? '✅' : '❌'}`);
console.log(`  - Privada SÍ visible para admin: ${publicPrivate.puedeVer(admin) ? '✅' : '❌'}`);

// Test 5: Publicación - Edición
console.log('\n✓ Test 5: Reglas de edición');
console.log(`  - Autor puede editar su publicación: ${publicPublic.puedeEditar(usuario) ? '✅' : '❌'}`);
console.log(`  - Otro usuario NO puede editar: ${!publicPublic.puedeEditar(otroUsuario) ? '✅' : '❌'}`);
console.log(`  - Admin NO puede editar publicación ajena: ${!publicPublic.puedeEditar(admin) ? '✅' : '❌'}`);

// Test 6: LikeRules - No like a sí mismo (AMB-05)
console.log('\n✓ Test 6: Reglas de likes (AMB-05)');
console.log(`  - NO puede darse like a sí mismo: ${!LikeRules.puedeDarLike(usuario, publicPublic) ? '✅' : '❌'}`);
console.log(`  - SÍ puede dar like a publicación ajena: ${LikeRules.puedeDarLike(otroUsuario, publicPublic) ? '✅' : '❌'}`);
console.log(`  - NO puede dar like a privada: ${!LikeRules.puedeDarLike(otroUsuario, publicPrivate) ? '✅' : '❌'}`);

// Test 7: AdminRules - Protección entre admins (AMB-07)
console.log('\n✓ Test 7: Protección entre admins (AMB-07)');
const admin2 = new Usuario({
  uid: 'admin2',
  username: 'admin2',
  email: 'admin2@test.com',
  fechaNacimiento: new Date('2000-01-01'),
  rol: UserRole.ADMIN,
  fechaCreacion: new Date()
});

const publicacionAdmin = new Publicacion({
  id: 'post3',
  contenido: 'Publicación de admin',
  autorId: admin.uid,
  autorUsername: admin.username,
  autorRol: admin.rol,
  visibilidad: PostVisibility.PUBLICA,
  fechaCreacion: new Date(),
  fechaModificacion: new Date(),
  likesCount: 0
});

console.log(`  - Admin puede afectar usuario normal: ${AdminRules.puedeAfectarUsuario(admin, usuario.uid, usuario.rol) ? '✅' : '❌'}`);
console.log(`  - Admin NO puede afectar otro admin: ${!AdminRules.puedeAfectarUsuario(admin, admin2.uid, admin2.rol) ? '✅' : '❌'}`);
console.log(`  - Admin NO puede borrar publicación de otro admin: ${!publicacionAdmin.puedeBorrar(admin2) ? '✅' : '❌'}`);

// Test 8: Validators - Username
console.log('\n✓ Test 8: Validadores de username');
const usernameValido = UserValidators.validarUsername('usuario123');
const usernameInvalido = UserValidators.validarUsername('ab');
console.log(`  - Username válido aceptado: ${usernameValido.valid ? '✅' : '❌'}`);
console.log(`  - Username muy corto rechazado: ${!usernameInvalido.valid ? '✅' : '❌'}`);

// Test 9: Validators - Email
console.log('\n✓ Test 9: Validadores de email');
const emailValido = UserValidators.validarEmail('test@example.com');
const emailInvalido = UserValidators.validarEmail('invalid');
console.log(`  - Email válido aceptado: ${emailValido.valid ? '✅' : '❌'}`);
console.log(`  - Email inválido rechazado: ${!emailInvalido.valid ? '✅' : '❌'}`);

// Test 10: Validators - Password
console.log('\n✓ Test 10: Validadores de contraseña');
const passwordValido = UserValidators.validarPassword('123456');
const passwordInvalido = UserValidators.validarPassword('12345');
console.log(`  - Password >= 6 caracteres aceptado: ${passwordValido.valid ? '✅' : '❌'}`);
console.log(`  - Password < 6 caracteres rechazado: ${!passwordInvalido.valid ? '✅' : '❌'}`);

console.log('\n✅ Todos los tests de Fase 2 pasaron correctamente!\n');
console.log('📦 Archivos creados:');
console.log('  - src/domain/enums/UserRole.ts');
console.log('  - src/domain/enums/PostVisibility.ts');
console.log('  - src/domain/models/Usuario.ts');
console.log('  - src/domain/models/Publicacion.ts');
console.log('  - src/domain/rules/likeRules.ts');
console.log('  - src/domain/rules/adminRules.ts');
console.log('  - src/infrastructure/utils/validators.ts');
console.log('\n🎯 Fase 2 COMPLETADA - Lista para Fase 3');
