# Estructura de Firestore - Yumeideas

**Proyecto:** Yumeideas  
**Fecha:** 7 de julio de 2026  
**Versión:** 1.0  
**Estado:** Implementado

---

## Resumen

Este documento describe la estructura de colecciones y documentos en Cloud Firestore para Yumeideas, tal como fue implementada en la **Fase 3**.

---

## Colecciones Principales

### 1. `/usuarios/{userId}` (T018)

**Descripción:** Almacena los datos de perfil de cada usuario registrado.

**Document ID:** UID de Firebase Authentication

**Campos:**

| Campo | Tipo | Descripción | Obligatorio | Editable | Único |
|-------|------|-------------|-------------|----------|-------|
| `uid` | `string` | UID de Firebase Auth (igual al document ID) | ✅ | ❌ | ✅ |
| `username` | `string` | Nombre de usuario (3-20 caracteres alfanuméricos + _) | ✅ | ✅* | ✅ |
| `email` | `string` | Correo electrónico | ✅ | ❌** | ✅ |
| `fechaNacimiento` | `timestamp` | Fecha de nacimiento (edad >= 13 años) | ✅ | ❌** | ❌ |
| `rol` | `string` | Rol: `'usuario'` o `'admin'` | ✅ | ❌*** | ❌ |
| `fechaCreacion` | `timestamp` | Fecha y hora de creación de la cuenta | ✅ | ❌ | ❌ |

**Notas:**
- *Editable mediante transacción (requiere actualizar `/usernames/` y `autorUsername` en publicaciones)
- **Inmutables según AMB-01
- ***Solo editable manualmente por super-admin en Firestore Console

**Ejemplo de documento:**
```json
{
  "uid": "a1b2c3d4e5f6g7h8i9j0",
  "username": "juanperez",
  "email": "juan@example.com",
  "fechaNacimiento": "2005-03-15T00:00:00.000Z",
  "rol": "usuario",
  "fechaCreacion": "2026-07-07T10:30:00.000Z"
}
```

**Reglas de seguridad implementadas:**
- ✅ Read: cualquier usuario autenticado
- ✅ Create: solo el propio usuario, con validación de edad >= 13 años
- ✅ Update: solo el propio usuario, sin modificar `uid`, `email`, `fechaNacimiento`, `rol`, `fechaCreacion`
- ✅ Delete: propio usuario O admin (con protección entre admins - AMB-07)

---

### 2. `/usernames/{username}` (T019)

**Descripción:** Colección auxiliar para garantizar unicidad de usernames mediante transacciones atómicas.

**Document ID:** El username en sí (ej: `juanperez`)

**Campos:**

| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `userId` | `string` | UID del usuario dueño del username | ✅ |

**Propósito:**
- Garantizar que no existan dos usuarios con el mismo username
- Utilizar transacciones para verificar disponibilidad antes de crear usuario
- Permitir cambio de username de forma atómica

**Ejemplo de documento:**
```json
{
  "userId": "a1b2c3d4e5f6g7h8i9j0"
}
```

**Path completo ejemplo:** `/usernames/juanperez`

**Reglas de seguridad implementadas:**
- ✅ Read: cualquier usuario autenticado (para validar disponibilidad en UI)
- ✅ Create: solo si `userId == auth.uid`
- ✅ Update: prohibido (solo create/delete)
- ✅ Delete: solo el dueño del username

---

### 3. `/publicaciones/{postId}` (T020)

**Descripción:** Almacena las publicaciones (ideas) de los usuarios.

**Document ID:** Auto-generado por Firestore

**Campos:**

| Campo | Tipo | Descripción | Obligatorio | Editable | Indexado |
|-------|------|-------------|-------------|----------|----------|
| `contenido` | `string` | Texto de la publicación (1-500 caracteres) | ✅ | ✅* | ❌ |
| `autorId` | `string` | UID del usuario autor | ✅ | ❌ | ✅** |
| `autorUsername` | `string` | Username del autor (desnormalizado) | ✅ | ❌*** | ❌ |
| `autorRol` | `string` | Rol del autor: `'usuario'` o `'admin'` (desnormalizado) | ✅ | ❌ | ❌ |
| `visibilidad` | `string` | `'publica'` o `'privada'` | ✅ | ✅* | ✅** |
| `fechaCreacion` | `timestamp` | Fecha y hora de creación | ✅ | ❌ | ✅** |
| `fechaModificacion` | `timestamp` | Fecha y hora de última modificación | ✅ | Auto | ❌ |
| `likesCount` | `number` | Contador de "me gusta" (desnormalizado) | ✅ | Auto**** | ❌ |

**Notas:**
- *Editable solo por el autor
- **Parte de índices compuestos (ver sección de Índices)
- ***Se actualiza mediante transacción si el autor cambia su username
- ****Se actualiza automáticamente mediante transacción al dar/quitar like

**Ejemplo de documento:**
```json
{
  "contenido": "Esta es una idea brillante sobre arquitectura de software.",
  "autorId": "a1b2c3d4e5f6g7h8i9j0",
  "autorUsername": "juanperez",
  "autorRol": "usuario",
  "visibilidad": "publica",
  "fechaCreacion": "2026-07-07T14:30:00.000Z",
  "fechaModificacion": "2026-07-07T14:30:00.000Z",
  "likesCount": 5
}
```

**Path completo ejemplo:** `/publicaciones/pub1a2b3c4d5e6f7g8h9`

**Reglas de seguridad implementadas:**
- ✅ Read: según visibilidad
  - Pública: cualquier usuario autenticado
  - Privada: solo autor o admin
- ✅ Create: cualquier usuario autenticado, con validaciones de contenido
- ✅ Update: solo el autor, sin modificar `autorId`, `autorUsername`, `autorRol`, `fechaCreacion`, `likesCount`
- ✅ Delete: autor O admin (con protección entre admins - AMB-07)

---

### 4. `/publicaciones/{postId}/likes/{userId}` (T021)

**Descripción:** Subcolección que almacena los "me gusta" de cada publicación.

**Document ID:** UID del usuario que dio like (garantiza 1 like por usuario por publicación)

**Campos:**

| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `userId` | `string` | UID del usuario que dio like | ✅ |
| `timestamp` | `timestamp` | Fecha y hora del like | ✅ |

**Propósito:**
- Registrar qué usuarios dieron like a cada publicación
- Permitir toggle (dar/quitar like)
- El document ID (userId) garantiza que cada usuario solo puede dar 1 like por publicación

**Ejemplo de documento:**
```json
{
  "userId": "b2c3d4e5f6g7h8i9j0k1",
  "timestamp": "2026-07-07T15:45:00.000Z"
}
```

**Path completo ejemplo:** `/publicaciones/pub1a2b3c4d5e6f7g8h9/likes/b2c3d4e5f6g7h8i9j0k1`

**Reglas de seguridad implementadas:**
- ✅ Read: cualquier usuario autenticado
- ✅ Create: solo si la publicación es pública Y el usuario no es el autor (AMB-05)
- ✅ Update: prohibido (solo create/delete)
- ✅ Delete: solo el propio usuario (para quitar like)

---

## Índices Compuestos

### Índice 1: Feed público paginado

**Colección:** `publicaciones`  
**Campos:**
1. `visibilidad` (ASCENDING)
2. `fechaCreacion` (DESCENDING)

**Uso:** Consultar publicaciones públicas ordenadas por fecha más reciente.

**Query ejemplo:**
```typescript
query(
  collection(db, 'publicaciones'),
  where('visibilidad', '==', 'publica'),
  orderBy('fechaCreacion', 'desc'),
  limit(20)
)
```

---

### Índice 2: Publicaciones de un usuario

**Colección:** `publicaciones`  
**Campos:**
1. `autorId` (ASCENDING)
2. `fechaCreacion` (DESCENDING)

**Uso:** Consultar todas las publicaciones de un usuario específico ordenadas por fecha.

**Query ejemplo:**
```typescript
query(
  collection(db, 'publicaciones'),
  where('autorId', '==', userId),
  orderBy('fechaCreacion', 'desc')
)
```

---

## Reglas de Negocio Implementadas

### AMB-01: Campos inmutables
- ✅ `email`, `fechaNacimiento`, `rol` en `/usuarios/` no son editables post-registro
- ✅ Validado en Firestore Rules: `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['email', 'fechaNacimiento', 'rol'])`

### AMB-05: No like a publicación propia
- ✅ Usuario NO puede darse like a sí mismo
- ✅ Validado en Firestore Rules: `!isPostAuthor(postId)` en creación de like

### AMB-07: Protección entre admins
- ✅ Admin NO puede borrar cuenta de otro admin
- ✅ Admin NO puede borrar publicación de otro admin
- ✅ Validado en Firestore Rules: `!targetIsAdmin(userId)` y `!isPostAuthorAdmin(autorId)`

### AMB-09: Edad mínima 13 años
- ✅ Usuario debe tener >= 13 años para registrarse
- ✅ Validado en Firestore Rules: función helper `isValidAge(fechaNacimiento)`

---

## Desnormalización Estratégica

**Campos desnormalizados para performance:**

1. **`autorUsername` en publicaciones:**
   - **Por qué:** Evitar join con `/usuarios/` para mostrar autor en cada publicación
   - **Trade-off:** Debe actualizarse si el usuario cambia su username
   - **Solución:** Transacción que actualiza username en `/usuarios/`, `/usernames/` y todas las publicaciones del usuario

2. **`autorRol` en publicaciones:**
   - **Por qué:** Validar protección entre admins sin consulta adicional a `/usuarios/`
   - **Trade-off:** Se asume que los roles no cambian frecuentemente
   - **Solución:** Si un usuario se convierte en admin, se requiere actualización manual

3. **`likesCount` en publicaciones:**
   - **Por qué:** Evitar contar subcolección de likes cada vez que se muestra una publicación
   - **Trade-off:** Debe incrementarse/decrementarse en transacción con cada like/unlike
   - **Solución:** Usar `FieldValue.increment(+1/-1)` en transacción

---

## Transacciones Atómicas Requeridas

### 1. Registro de usuario
```typescript
await runTransaction(db, async (transaction) => {
  // 1. Verificar disponibilidad de username
  const usernameRef = doc(db, 'usernames', username);
  const usernameDoc = await transaction.get(usernameRef);
  if (usernameDoc.exists()) throw new Error('Username ya existe');
  
  // 2. Reservar username
  transaction.set(usernameRef, { userId });
  
  // 3. Crear usuario
  transaction.set(doc(db, 'usuarios', userId), { ...userData });
});
```

### 2. Cambio de username
```typescript
await runTransaction(db, async (transaction) => {
  // 1. Verificar disponibilidad del nuevo username
  const newUsernameRef = doc(db, 'usernames', newUsername);
  const newUsernameDoc = await transaction.get(newUsernameRef);
  if (newUsernameDoc.exists()) throw new Error('Username ya existe');
  
  // 2. Reservar nuevo username
  transaction.set(newUsernameRef, { userId });
  
  // 3. Liberar username anterior
  transaction.delete(doc(db, 'usernames', oldUsername));
  
  // 4. Actualizar usuario
  transaction.update(doc(db, 'usuarios', userId), { username: newUsername });
  
  // 5. Actualizar autorUsername en todas las publicaciones del usuario
  const publicacionesSnapshot = await transaction.get(
    query(collection(db, 'publicaciones'), where('autorId', '==', userId))
  );
  publicacionesSnapshot.forEach(docSnap => {
    transaction.update(docSnap.ref, { autorUsername: newUsername });
  });
});
```

### 3. Toggle like (dar/quitar)
```typescript
await runTransaction(db, async (transaction) => {
  const likeRef = doc(db, `publicaciones/${postId}/likes/${userId}`);
  const publicacionRef = doc(db, 'publicaciones', postId);
  
  const likeDoc = await transaction.get(likeRef);
  
  if (likeDoc.exists()) {
    // Quitar like
    transaction.delete(likeRef);
    transaction.update(publicacionRef, { likesCount: increment(-1) });
  } else {
    // Dar like
    transaction.set(likeRef, { userId, timestamp: serverTimestamp() });
    transaction.update(publicacionRef, { likesCount: increment(1) });
  }
});
```

### 4. Borrado en cascada (usuario)
```typescript
// Requiere múltiples batches si > 500 documentos
const batch = writeBatch(db);

// 1. Borrar usuario
batch.delete(doc(db, 'usuarios', userId));

// 2. Liberar username
batch.delete(doc(db, 'usernames', username));

// 3. Borrar publicaciones del usuario (y sus likes)
const publicaciones = await getDocs(
  query(collection(db, 'publicaciones'), where('autorId', '==', userId))
);
publicaciones.forEach(pubDoc => {
  batch.delete(pubDoc.ref);
  // Nota: los likes (subcolección) deben borrarse en batch separado
});

await batch.commit();
```

---

## Validaciones en Firestore Rules

Las Firestore Security Rules implementan las siguientes validaciones server-side:

### En `/usuarios/`:
- ✅ Edad >= 13 años (`isValidAge()`)
- ✅ Rol inicial = 'usuario' (no auto-asignación de admin)
- ✅ Campos inmutables no modificables
- ✅ Solo propio usuario puede actualizar/borrar (excepto admin con protección)

### En `/usernames/`:
- ✅ `userId` coincide con usuario autenticado
- ✅ Solo creación y borrado permitidos (no updates)

### En `/publicaciones/`:
- ✅ Contenido entre 1 y 500 caracteres
- ✅ Visibilidad en ['publica', 'privada']
- ✅ `likesCount` inicial = 0
- ✅ Campos inmutables no modificables en updates
- ✅ Lectura según visibilidad (pública/privada)
- ✅ Borrado con protección entre admins

### En `/publicaciones/{postId}/likes/`:
- ✅ Solo en publicaciones públicas
- ✅ Usuario no es el autor (AMB-05)
- ✅ Solo creación y borrado permitidos (no updates)
- ✅ `userId` coincide con usuario autenticado

---

## Próximos Pasos (Fase 4)

En la siguiente fase se implementarán los servicios de aplicación que utilizarán estas estructuras:
- `authService`: registro, login, recuperación de contraseña
- `userService`: actualización de perfil, cambio de username, borrado de cuenta
- `postService`: CRUD de publicaciones, feed público, feed de usuario
- `likeService`: toggle de likes, verificación de likes

---

**Fecha de creación:** 7 de julio de 2026  
**Versión:** 1.0  
**Estado:** ✅ Implementado en Fase 3  
**Autor:** Equipo Yumeideas
