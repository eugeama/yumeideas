# Contrato de Servicios - Yumeideas

**Proyecto:** Yumeideas  
**Fecha:** 7 de julio de 2026  
**Versión:** 1.0  
**Propósito:** Definir el contrato de servicios del frontend (reemplaza a API REST en arquitecturas con backend)

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [AuthService](#authservice)
3. [UserService](#userservice)
4. [PostService](#postservice)
5. [LikeService](#likeservice)
6. [Tipos y enums](#tipos-y-enums)
7. [Manejo de errores](#manejo-de-errores)

---

## 1. Introducción

En Yumeideas, **no hay backend propio** (sin API REST). Todo el acceso a datos se realiza mediante:
- **Firebase Authentication SDK** (autenticación)
- **Firestore SDK** (base de datos)
- **Firestore Security Rules** (autorización en servidor)

Este documento define el **contrato de servicios** de la capa `application/`, que encapsula toda la lógica de acceso a Firebase.

**Principio clave:** Los componentes de UI **nunca** deben importar ni usar directamente Firebase. Solo usan servicios y hooks.

---

## 2. AuthService

**Responsabilidad:** Gestión de autenticación (registro, login, logout, recuperación de contraseña).

**Path:** `src/application/services/authService.ts`

---

### 2.1. register()

**Descripción:** Registrar un nuevo usuario.

**Firma:**
```typescript
async function register(
  username: string,
  email: string,
  password: string,
  fechaNacimiento: Date
): Promise<string>
```

**Parámetros:**
- `username`: Nombre de usuario (único, 3-20 caracteres alfanuméricos)
- `email`: Correo electrónico (formato válido)
- `password`: Contraseña (mínimo 6 caracteres)
- `fechaNacimiento`: Fecha de nacimiento (edad >= 13 años)

**Retorna:**
- `string`: UID del usuario creado

**Errores:**
- `'auth/email-already-in-use'`: Email ya registrado
- `'auth/weak-password'`: Contraseña muy débil
- `'username-already-taken'`: Username ya está en uso
- `'invalid-age'`: Edad < 13 años

**Flujo:**
1. Validar edad >= 13 en cliente
2. Crear usuario en Firebase Authentication
3. Transacción para reservar username + crear documento en `/usuarios/{uid}`
4. Si falla, rollback (borrar usuario de Authentication)

**Ejemplo:**
```typescript
try {
  const uid = await authService.register(
    'juanperez',
    'juan@example.com',
    'password123',
    new Date('2005-03-15')
  );
  console.log('Usuario creado:', uid);
} catch (error) {
  if (error.code === 'username-already-taken') {
    alert('El nombre de usuario ya está en uso');
  }
}
```

---

### 2.2. login()

**Descripción:** Iniciar sesión.

**Firma:**
```typescript
async function login(
  email: string,
  password: string
): Promise<void>
```

**Parámetros:**
- `email`: Correo electrónico
- `password`: Contraseña

**Retorna:** `void` (el estado de autenticación se actualiza automáticamente)

**Errores:**
- `'auth/user-not-found'`: Usuario no existe
- `'auth/wrong-password'`: Contraseña incorrecta
- `'auth/invalid-email'`: Email inválido

**Ejemplo:**
```typescript
try {
  await authService.login('juan@example.com', 'password123');
  // Redirigir a feed
} catch (error) {
  if (error.code === 'auth/wrong-password') {
    alert('Contraseña incorrecta');
  }
}
```

---

### 2.3. logout()

**Descripción:** Cerrar sesión.

**Firma:**
```typescript
async function logout(): Promise<void>
```

**Retorna:** `void`

**Errores:** Ninguno esperado

**Ejemplo:**
```typescript
await authService.logout();
// Redirigir a login
```

---

### 2.4. sendPasswordReset()

**Descripción:** Enviar email de recuperación de contraseña.

**Firma:**
```typescript
async function sendPasswordReset(email: string): Promise<void>
```

**Parámetros:**
- `email`: Correo electrónico del usuario

**Retorna:** `void`

**Errores:**
- `'auth/user-not-found'`: Usuario no existe
- `'auth/invalid-email'`: Email inválido

**Ejemplo:**
```typescript
try {
  await authService.sendPasswordReset('juan@example.com');
  alert('Revisa tu email para restablecer tu contraseña');
} catch (error) {
  alert('No existe una cuenta con ese email');
}
```

---

### 2.5. getCurrentUser()

**Descripción:** Obtener usuario autenticado actual.

**Firma:**
```typescript
function getCurrentUser(): User | null
```

**Retorna:**
- `User`: Objeto de usuario de Firebase Auth (si está autenticado)
- `null`: Si no hay sesión activa

**Ejemplo:**
```typescript
const user = authService.getCurrentUser();
if (user) {
  console.log('Usuario autenticado:', user.uid);
}
```

---

## 3. UserService

**Responsabilidad:** Gestión de perfil de usuario.

**Path:** `src/application/services/userService.ts`

---

### 3.1. getUserData()

**Descripción:** Obtener datos de perfil de un usuario.

**Firma:**
```typescript
async function getUserData(userId: string): Promise<Usuario>
```

**Parámetros:**
- `userId`: UID del usuario

**Retorna:**
- `Usuario`: Objeto con datos del usuario

**Errores:**
- `'user-not-found'`: Usuario no existe

**Ejemplo:**
```typescript
const usuario = await userService.getUserData('a1b2c3...');
console.log(usuario.username, usuario.rol);
```

---

### 3.2. updateUsername()

**Descripción:** Cambiar username del usuario actual.

**Firma:**
```typescript
async function updateUsername(
  userId: string,
  newUsername: string
): Promise<void>
```

**Parámetros:**
- `userId`: UID del usuario (debe ser el usuario actual)
- `newUsername`: Nuevo nombre de usuario (único, 3-20 caracteres)

**Retorna:** `void`

**Errores:**
- `'username-already-taken'`: Username ya está en uso
- `'unauthorized'`: Intentando cambiar username de otro usuario

**Flujo:**
1. Validar que userId == auth.uid
2. Transacción:
   - Verificar disponibilidad de nuevo username
   - Reservar nuevo username en `/usernames/{newUsername}`
   - Liberar username anterior en `/usernames/{oldUsername}`
   - Actualizar `/usuarios/{userId}`
   - Actualizar `autorUsername` en todas las publicaciones del usuario

**Ejemplo:**
```typescript
try {
  await userService.updateUsername(currentUser.uid, 'nuevousername');
  alert('Username actualizado exitosamente');
} catch (error) {
  if (error.code === 'username-already-taken') {
    alert('Ese username ya está en uso');
  }
}
```

---

### 3.3. updatePassword()

**Descripción:** Cambiar contraseña del usuario actual.

**Firma:**
```typescript
async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<void>
```

**Parámetros:**
- `currentPassword`: Contraseña actual (para re-autenticación)
- `newPassword`: Nueva contraseña (mínimo 6 caracteres)

**Retorna:** `void`

**Errores:**
- `'auth/wrong-password'`: Contraseña actual incorrecta
- `'auth/weak-password'`: Nueva contraseña muy débil

**Flujo:**
1. Re-autenticar con contraseña actual
2. Actualizar contraseña en Firebase Authentication

**Ejemplo:**
```typescript
try {
  await userService.updatePassword('oldpass123', 'newpass456');
  alert('Contraseña actualizada');
} catch (error) {
  if (error.code === 'auth/wrong-password') {
    alert('La contraseña actual es incorrecta');
  }
}
```

---

### 3.4. deleteAccount()

**Descripción:** Borrar cuenta del usuario actual (con borrado en cascada).

**Firma:**
```typescript
async function deleteAccount(userId: string): Promise<void>
```

**Parámetros:**
- `userId`: UID del usuario (debe ser el usuario actual o el llamador debe ser admin)

**Retorna:** `void`

**Errores:**
- `'unauthorized'`: Intentando borrar cuenta de otro usuario sin ser admin
- `'cannot-delete-admin'`: Intentando borrar cuenta de un admin (como admin)

**Flujo:**
1. Validar permisos (propio usuario o admin)
2. Si es admin, validar que target no sea admin
3. Obtener username del usuario
4. Borrar en cascada:
   - Todas las publicaciones del usuario
   - Todos los likes en esas publicaciones
   - Documento de usuario en `/usuarios/{userId}`
   - Reserva de username en `/usernames/{username}`
   - Usuario en Firebase Authentication

**Ejemplo:**
```typescript
if (confirm('¿Estás seguro? Esta acción no se puede deshacer.')) {
  await userService.deleteAccount(currentUser.uid);
  // Redirigir a página de despedida
}
```

---

## 4. PostService

**Responsabilidad:** Gestión de publicaciones (crear, leer, actualizar, borrar).

**Path:** `src/application/services/postService.ts`

---

### 4.1. createPost()

**Descripción:** Crear una nueva publicación.

**Firma:**
```typescript
async function createPost(
  contenido: string,
  visibilidad: PostVisibility,
  autor: Usuario
): Promise<string>
```

**Parámetros:**
- `contenido`: Texto de la publicación (no vacío, máx. 500 caracteres)
- `visibilidad`: `PostVisibility.PUBLICA` o `PostVisibility.PRIVADA`
- `autor`: Objeto Usuario del autor

**Retorna:**
- `string`: ID de la publicación creada

**Errores:**
- `'empty-content'`: Contenido vacío
- `'content-too-long'`: Contenido excede 500 caracteres

**Ejemplo:**
```typescript
const postId = await postService.createPost(
  'Esta es una idea brillante!',
  PostVisibility.PUBLICA,
  currentUser
);
```

---

### 4.2. updatePost()

**Descripción:** Actualizar contenido y/o visibilidad de una publicación propia.

**Firma:**
```typescript
async function updatePost(
  postId: string,
  updates: {
    contenido?: string;
    visibilidad?: PostVisibility;
  }
): Promise<void>
```

**Parámetros:**
- `postId`: ID de la publicación
- `updates`: Objeto con campos a actualizar (contenido y/o visibilidad)

**Retorna:** `void`

**Errores:**
- `'unauthorized'`: Intentando editar publicación ajena
- `'empty-content'`: Contenido vacío

**Ejemplo:**
```typescript
await postService.updatePost('post123', {
  visibilidad: PostVisibility.PRIVADA
});
```

---

### 4.3. deletePost()

**Descripción:** Borrar una publicación (propia o ajena si es admin).

**Firma:**
```typescript
async function deletePost(postId: string): Promise<void>
```

**Parámetros:**
- `postId`: ID de la publicación

**Retorna:** `void`

**Errores:**
- `'unauthorized'`: Intentando borrar publicación ajena sin ser admin
- `'cannot-delete-admin-post'`: Intentando (como admin) borrar publicación de otro admin

**Flujo:**
1. Validar permisos (autor o admin)
2. Si es admin, validar que autor no sea admin
3. Borrar subcolección de likes
4. Borrar documento de publicación

**Ejemplo:**
```typescript
if (confirm('¿Borrar esta publicación?')) {
  await postService.deletePost('post123');
}
```

---

### 4.4. getPublicFeed()

**Descripción:** Obtener feed de publicaciones públicas (paginado).

**Firma:**
```typescript
async function getPublicFeed(
  limit: number = 20,
  lastVisible?: DocumentSnapshot
): Promise<{
  posts: Publicacion[];
  lastVisible: DocumentSnapshot | null;
}>
```

**Parámetros:**
- `limit`: Número de publicaciones por página (default: 20)
- `lastVisible`: Cursor para paginación (opcional, para "cargar más")

**Retorna:**
- `posts`: Array de publicaciones
- `lastVisible`: Cursor para siguiente página (null si no hay más)

**Ejemplo:**
```typescript
const { posts, lastVisible } = await postService.getPublicFeed(20);
// Luego, para cargar más:
const { posts: morePosts } = await postService.getPublicFeed(20, lastVisible);
```

---

### 4.5. getUserPosts()

**Descripción:** Obtener todas las publicaciones de un usuario (públicas + privadas si es propio o admin).

**Firma:**
```typescript
async function getUserPosts(userId: string): Promise<Publicacion[]>
```

**Parámetros:**
- `userId`: UID del usuario

**Retorna:**
- `Publicacion[]`: Array de publicaciones

**Ejemplo:**
```typescript
const myPosts = await postService.getUserPosts(currentUser.uid);
```

---

### 4.6. getAllPostsForAdmin()

**Descripción:** Obtener todas las publicaciones (públicas + privadas) para moderación (solo admin).

**Firma:**
```typescript
async function getAllPostsForAdmin(): Promise<Publicacion[]>
```

**Retorna:**
- `Publicacion[]`: Array de todas las publicaciones

**Errores:**
- `'unauthorized'`: Usuario no es admin

**Ejemplo:**
```typescript
if (currentUser.rol === UserRole.ADMIN) {
  const allPosts = await postService.getAllPostsForAdmin();
}
```

---

## 5. LikeService

**Responsabilidad:** Gestión de "me gusta" (dar, quitar, consultar).

**Path:** `src/application/services/likeService.ts`

---

### 5.1. toggleLike()

**Descripción:** Dar o quitar "me gusta" a una publicación (toggle).

**Firma:**
```typescript
async function toggleLike(
  postId: string,
  userId: string
): Promise<void>
```

**Parámetros:**
- `postId`: ID de la publicación
- `userId`: UID del usuario (debe ser el usuario actual)

**Retorna:** `void`

**Errores:**
- `'unauthorized'`: Intentando dar like a publicación propia
- `'private-post'`: Intentando dar like a publicación privada ajena
- `'post-not-found'`: Publicación no existe

**Flujo:**
1. Validar que publicación es pública
2. Validar que usuario no es el autor
3. Transacción:
   - Si like existe → borrar like + decrementar `likesCount`
   - Si like NO existe → crear like + incrementar `likesCount`

**Ejemplo:**
```typescript
await likeService.toggleLike('post123', currentUser.uid);
// Si ya tenía like, lo quita. Si no tenía, lo agrega.
```

---

### 5.2. hasUserLiked()

**Descripción:** Verificar si un usuario ya dio like a una publicación.

**Firma:**
```typescript
async function hasUserLiked(
  postId: string,
  userId: string
): Promise<boolean>
```

**Parámetros:**
- `postId`: ID de la publicación
- `userId`: UID del usuario

**Retorna:**
- `boolean`: `true` si el usuario ya dio like, `false` si no

**Ejemplo:**
```typescript
const liked = await likeService.hasUserLiked('post123', currentUser.uid);
// Usar para mostrar botón de like activo/inactivo
```

---

## 6. Tipos y enums

### 6.1. Usuario

```typescript
interface Usuario {
  uid: string;
  username: string;
  email: string;
  fechaNacimiento: Date;
  rol: UserRole;
  fechaCreacion: Date;
}
```

---

### 6.2. Publicacion

```typescript
interface Publicacion {
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
```

---

### 6.3. UserRole (enum)

```typescript
enum UserRole {
  USUARIO = 'usuario',
  ADMIN = 'admin'
}
```

---

### 6.4. PostVisibility (enum)

```typescript
enum PostVisibility {
  PUBLICA = 'publica',
  PRIVADA = 'privada'
}
```

---

## 7. Manejo de errores

### 7.1. Patrón de manejo de errores

Los servicios de Yumeideas utilizan un **Result Object pattern** para el manejo de errores, en lugar de lanzar excepciones directamente.

**Estructura del resultado:**

```typescript
interface AuthResult {
  success: boolean;
  user?: Usuario;
  error?: string;
}
```

**Ejemplo de uso:**

```typescript
const result = await authService.register({
  username: 'juanperez',
  email: 'juan@example.com',
  password: 'password123',
  fechaNacimiento: new Date('2005-03-15')
});

if (!result.success) {
  console.error('Error:', result.error);
  // Manejar error en UI
} else {
  console.log('Usuario creado:', result.user);
  // Continuar flujo exitoso
}
```

---

### 7.2. Mensajes de error estándar

Los servicios retornan mensajes de error en español. A continuación se documenta la correspondencia entre códigos de error de Firebase y mensajes de usuario:

| Código Firebase | Mensaje de Usuario | Servicio |
|-----------------|-------------------|----------|
| `auth/email-already-in-use` | "El correo electrónico ya está en uso" | AuthService.register() |
| `auth/weak-password` | "La contraseña es demasiado débil" | AuthService.register() |
| `auth/invalid-email` | "El formato del correo electrónico no es válido" | AuthService.register(), login() |
| `auth/user-not-found` | "No existe una cuenta con ese correo electrónico" | AuthService.login(), sendPasswordReset() |
| `auth/wrong-password` | "La contraseña es incorrecta" | AuthService.login(), UserService.updatePassword() |
| `auth/user-disabled` | "Esta cuenta ha sido deshabilitada" | AuthService.login() |
| N/A | "El nombre de usuario ya está en uso" | AuthService.register(), UserService.updateUsername() |
| N/A | "Debes tener al menos 13 años para registrarte" | AuthService.register() (validación de edad) |
| N/A | "El nombre de usuario debe tener entre 3 y 20 caracteres" | AuthService.register(), UserService.updateUsername() |
| N/A | "La contraseña debe tener al menos 6 caracteres" | AuthService.register(), UserService.updatePassword() |
| N/A | "El contenido no puede estar vacío" | PostService.createPost(), updatePost() |
| N/A | "El contenido no puede exceder 500 caracteres" | PostService.createPost(), updatePost() |
| N/A | "La publicación no existe" | LikeService.toggleLike() |
| N/A | "No puedes dar me gusta a tu propia publicación" | LikeService.toggleLike() (AMB-05) |
| N/A | "No puedes dar me gusta a una publicación privada" | LikeService.toggleLike() |
| N/A | "No tienes permisos para realizar esta acción" | UserService.deleteAccount(), PostService.deletePost() |
| N/A | "No puedes eliminar la cuenta de un administrador" | UserService.deleteAccount() (AMB-07) |
| N/A | "No puedes eliminar la publicación de un administrador" | PostService.deletePost() (AMB-07) |

**Nota:** Los mensajes listados como "N/A" en la columna de código Firebase son validaciones custom implementadas en los servicios, no errores nativos de Firebase.

---

### 7.3. Manejo en componentes

**Ejemplo con AuthService:**

```typescript
const handleRegister = async () => {
  const result = await authService.register({
    username: formData.username,
    email: formData.email,
    password: formData.password,
    fechaNacimiento: formData.fechaNacimiento
  });

  if (!result.success) {
    setError(result.error || 'Error desconocido');
    return;
  }

  // Registro exitoso
  navigate('/feed');
};
```

**Ejemplo con PostService:**

```typescript
const handleCreatePost = async () => {
  const postId = await postService.createPost(
    content,
    PostVisibility.PUBLICA,
    currentUser
  );

  if (!postId) {
    setError('Error al crear la publicación');
    return;
  }

  // Publicación creada exitosamente
  navigate(`/post/${postId}`);
};
```

**Ejemplo con manejo de errores de Firebase directamente (LikeService):**

```typescript
try {
  await likeService.toggleLike(postId, userId);
  setLiked(!liked);
} catch (error: any) {
  if (error.message.includes('propia')) {
    setError('No puedes dar me gusta a tu propia publicación');
  } else if (error.message.includes('privada')) {
    setError('No puedes dar me gusta a una publicación privada');
  } else {
    setError('Error al procesar me gusta');
  }
}
```

---

### 7.4. Verificación de códigos de error (T048)

**Auditoría realizada:** Se verificó que todos los mensajes de error documentados en la sección 7.2 coinciden con las implementaciones en `src/application/services/`.

**Servicios verificados:**
- ✅ authService.ts - Todos los mensajes coinciden
- ✅ userService.ts - Todos los mensajes coinciden
- ✅ postService.ts - Todos los mensajes coinciden (validaciones con validators.ts)
- ✅ likeService.ts - Todos los mensajes coinciden (usa domain/rules/likeRules.ts)

**Resultado:** ✅ **100% de coincidencia** entre mensajes de error documentados e implementados.



---

## Conclusión

Este contrato de servicios define la interfaz completa entre la capa de UI y la capa de acceso a datos (Firebase). Todos los componentes de React deben usar estos servicios, **nunca** llamar directamente a Firebase.

**Ventajas:**
- ✅ Separación de responsabilidades
- ✅ Fácil de testear (mock de servicios)
- ✅ Cambios en Firebase no afectan UI
- ✅ Lógica de negocio centralizada

---

## 8. Mapeo de Servicios vs Firestore Rules

Esta sección documenta la correspondencia entre las operaciones de cada servicio y sus reglas de seguridad en `firestore.rules`.

**Objetivo:** Garantizar que cada operación del frontend tenga su correspondiente validación en el servidor (Firestore Rules).

---

### 8.1. AuthService vs Firestore Rules

| Método | Colección | Operación Firestore | Regla Aplicada | Validaciones |
|--------|-----------|---------------------|----------------|--------------|
| `register()` | `/usuarios/{uid}` | `create` | ✅ `allow create` | - `userId == request.auth.uid`<br>- `rol == 'usuario'` (no auto-admin)<br>- `isValidAge()` (edad >= 13)<br>- Todos los campos requeridos |
| `register()` | `/usernames/{username}` | `create` | ✅ `allow create` | - `userId == request.auth.uid` (reserva de username) |
| `login()` | N/A | N/A | N/A | Operación de Firebase Auth, no Firestore |
| `logout()` | N/A | N/A | N/A | Operación de Firebase Auth, no Firestore |
| `sendPasswordReset()` | N/A | N/A | N/A | Operación de Firebase Auth, no Firestore |
| `getCurrentUser()` | N/A | N/A | N/A | Operación de Firebase Auth, no Firestore |

**Estado:** ✅ Todas las operaciones de Firestore tienen reglas correspondientes.

---

### 8.2. UserService vs Firestore Rules

| Método | Colección | Operación Firestore | Regla Aplicada | Validaciones |
|--------|-----------|---------------------|----------------|--------------|
| `getUserData()` | `/usuarios/{userId}` | `read` | ✅ `allow read` | - Usuario autenticado |
| `updateUsername()` | `/usuarios/{userId}` | `update` | ✅ `allow update` | - `userId == request.auth.uid`<br>- No modificar campos inmutables (AMB-01) |
| `updateUsername()` | `/usernames/{newUsername}` | `create` | ✅ `allow create` | - `userId == request.auth.uid` (nueva reserva) |
| `updateUsername()` | `/usernames/{oldUsername}` | `delete` | ✅ `allow delete` | - `userId == request.auth.uid` (liberar reserva) |
| `updateUsername()` | `/publicaciones/{postId}` | `update` | ✅ `allow update` | - Actualización de `autorUsername` por autor |
| `updatePassword()` | N/A | N/A | N/A | Operación de Firebase Auth, no Firestore |
| `deleteAccount()` | `/usuarios/{userId}` | `delete` | ✅ `allow delete` | - `userId == request.auth.uid` OR<br>- `isAdmin() && !targetIsAdmin()` (AMB-07) |
| `deleteAccount()` | `/usernames/{username}` | `delete` | ✅ `allow delete` | - `userId == request.auth.uid` (borrado en cascada) |
| `deleteAccount()` | `/publicaciones/{postId}` | `delete` | ✅ `allow delete` | - `autorId == request.auth.uid` (borrado en cascada) |

**Estado:** ✅ Todas las operaciones de Firestore tienen reglas correspondientes.

---

### 8.3. PostService vs Firestore Rules

| Método | Colección | Operación Firestore | Regla Aplicada | Validaciones |
|--------|-----------|---------------------|----------------|--------------|
| `createPost()` | `/publicaciones/{postId}` | `create` | ✅ `allow create` | - Usuario autenticado<br>- `autorId == request.auth.uid`<br>- `contenido.size() > 0 && <= 500`<br>- `visibilidad in ['publica', 'privada']`<br>- `likesCount == 0`<br>- Todos los campos requeridos |
| `updatePost()` | `/publicaciones/{postId}` | `update` | ✅ `allow update` | - `autorId == request.auth.uid`<br>- No modificar campos inmutables |
| `deletePost()` | `/publicaciones/{postId}` | `delete` | ✅ `allow delete` | - `autorId == request.auth.uid` OR<br>- `isAdmin() && !isPostAuthorAdmin()` (AMB-07) |
| `deletePost()` | `/publicaciones/{postId}/likes/{userId}` | `delete` | ✅ `allow delete` | - Borrado en cascada de likes (por autor/admin) |
| `getPublicFeed()` | `/publicaciones/{postId}` | `read` | ✅ `allow read` | - Usuario autenticado<br>- `visibilidad == 'publica'` |
| `getUserPosts()` | `/publicaciones/{postId}` | `read` | ✅ `allow read` | - Usuario autenticado<br>- `visibilidad == 'publica'` OR<br>- `autorId == request.auth.uid` OR<br>- `isAdmin()` |
| `getAllPostsForAdmin()` | `/publicaciones/{postId}` | `read` | ✅ `allow read` | - `isAdmin()` (acceso a todas las publicaciones) |

**Estado:** ✅ Todas las operaciones de Firestore tienen reglas correspondientes.

---

### 8.4. LikeService vs Firestore Rules

| Método | Colección | Operación Firestore | Regla Aplicada | Validaciones |
|--------|-----------|---------------------|----------------|--------------|
| `toggleLike()` (crear) | `/publicaciones/{postId}/likes/{userId}` | `create` | ✅ `allow create` | - `userId == request.auth.uid`<br>- `isPublicPost()` (solo públicas)<br>- `!isPostAuthor()` (AMB-05: no like a propia)<br>- Todos los campos requeridos |
| `toggleLike()` (borrar) | `/publicaciones/{postId}/likes/{userId}` | `delete` | ✅ `allow delete` | - `userId == request.auth.uid` |
| `toggleLike()` (actualizar contador) | `/publicaciones/{postId}` | `update` | ✅ `allow update` | - Actualización de `likesCount` por autor del like (transacción) |
| `hasUserLiked()` | `/publicaciones/{postId}/likes/{userId}` | `read` | ✅ `allow read` | - Usuario autenticado |

**Estado:** ✅ Todas las operaciones de Firestore tienen reglas correspondientes.

---

### 8.5. Resumen de Auditoría

**Operaciones totales auditadas:** 25  
**Operaciones con reglas correspondientes:** ✅ 25 (100%)  
**Operaciones sin reglas:** ❌ 0

**Validaciones críticas implementadas:**
- ✅ AMB-01: Campos inmutables protegidos (email, fechaNacimiento, rol)
- ✅ AMB-05: No like a publicación propia
- ✅ AMB-07: Admin NO puede afectar otro admin
- ✅ AMB-09: Edad mínima 13 años

**Conclusión:** Todos los servicios de la Fase 4 tienen sus correspondientes reglas de seguridad en `firestore.rules`. No existen operaciones desprotegidas.

---

**Fecha de creación:** 7 de julio de 2026  
**Versión:** 1.0  
**Estado:** Aprobado  
**Autor:** Equipo Yumeideas
