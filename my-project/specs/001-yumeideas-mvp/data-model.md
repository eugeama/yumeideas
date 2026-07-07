# Modelo de Datos - Yumeideas

**Proyecto:** Yumeideas  
**Fecha:** 7 de julio de 2026  
**Versión:** 1.0  
**Base de datos:** Cloud Firestore (NoSQL)

---

## Tabla de Contenidos

1. [Resumen](#resumen)
2. [Diagrama de colecciones](#diagrama-de-colecciones)
3. [Colección: usuarios](#colección-usuarios)
4. [Colección: usernames](#colección-usernames)
5. [Colección: publicaciones](#colección-publicaciones)
6. [Subcolección: likes](#subcolección-likes)
7. [Índices compuestos](#índices-compuestos)
8. [Reglas de negocio en el modelo](#reglas-de-negocio-en-el-modelo)
9. [Límites y consideraciones](#límites-y-consideraciones)

---

## 1. Resumen

Yumeideas utiliza **Cloud Firestore** como base de datos NoSQL. La estructura consta de:

- **3 colecciones principales:** `usuarios`, `usernames`, `publicaciones`
- **1 subcolección:** `likes` (dentro de cada publicación)
- **2 índices compuestos:** para feed público y publicaciones por usuario

**Principios de diseño:**
- **Desnormalización estratégica:** `autorUsername` y `likesCount` desnormalizados para performance
- **Atomic operations:** Transacciones para username único y likes
- **Security by design:** Firestore Rules refuerzan todas las reglas de autorización

---

## 2. Diagrama de colecciones

```
Firestore Database
│
├── usuarios/                           # Colección principal de usuarios
│   ├── {userId}/                       # Documento por usuario (UID de Firebase Auth)
│   │   ├── username: string
│   │   ├── email: string
│   │   ├── fechaNacimiento: timestamp
│   │   ├── rol: string ('usuario' | 'admin')
│   │   └── fechaCreacion: timestamp
│
├── usernames/                          # Colección auxiliar para unicidad
│   ├── {username}/                     # Documento por username
│   │   └── userId: string              # UID del usuario dueño
│
└── publicaciones/                      # Colección principal de publicaciones
    ├── {publicacionId}/                # Documento por publicación
    │   ├── contenido: string
    │   ├── autorId: string             # UID del autor
    │   ├── autorUsername: string       # Desnormalizado (performance)
    │   ├── autorRol: string            # Desnormalizado (protección entre admins)
    │   ├── visibilidad: string ('publica' | 'privada')
    │   ├── fechaCreacion: timestamp
    │   ├── fechaModificacion: timestamp
    │   ├── likesCount: number          # Desnormalizado (performance)
    │   │
    │   └── likes/                      # Subcolección de likes
    │       ├── {userId}/               # Documento por usuario que dio like
    │       │   ├── userId: string
    │       │   └── timestamp: timestamp
```

---

## 3. Colección: usuarios

**Path:** `/usuarios/{userId}`

**Descripción:** Almacena los datos de perfil de cada usuario registrado.

### Estructura del documento

| Campo | Tipo | Descripción | Obligatorio | Editable | Único |
|-------|------|-------------|-------------|----------|-------|
| `id` | string | UID de Firebase Auth (ID del documento) | Sí | No | Sí |
| `username` | string | Nombre de usuario | Sí | Sí* | Sí |
| `email` | string | Correo electrónico | Sí | No** | Sí |
| `fechaNacimiento` | timestamp | Fecha de nacimiento | Sí | No** | No |
| `rol` | string | Rol del usuario: `'usuario'` o `'admin'` | Sí | No*** | No |
| `fechaCreacion` | timestamp | Fecha de creación de la cuenta | Sí | No | No |

**Notas:**
- *Username es editable, pero requiere transacción para validar unicidad
- **Email y fechaNacimiento NO son editables post-registro (decisión AMB-01)
- ***Rol NO es editable por el usuario; solo manualmente por admin en Firestore Console

### Ejemplo de documento

```json
{
  "id": "a1b2c3d4e5f6g7h8i9j0",
  "username": "juanperez",
  "email": "juan@example.com",
  "fechaNacimiento": "2005-03-15T00:00:00.000Z",
  "rol": "usuario",
  "fechaCreacion": "2026-07-07T10:30:00.000Z"
}
```

### Validaciones

**En cliente (TypeScript):**
```typescript
class Usuario {
  static validarEdad(fechaNacimiento: Date): boolean {
    const edad = this.calcularEdad(fechaNacimiento);
    return edad >= 13;
  }

  static validarUsername(username: string): boolean {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  }
}
```

**En Firestore Rules:**
```javascript
match /usuarios/{userId} {
  allow create: if request.auth.uid == userId
                && isValidAge(request.resource.data.fechaNacimiento)
                && request.resource.data.rol == 'usuario'; // No auto-asignar admin
  
  allow update: if request.auth.uid == userId
                && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['email', 'fechaNacimiento', 'rol']);
  
  allow delete: if request.auth.uid == userId 
                || (isAdmin() && !targetIsAdmin(userId));
  
  allow read: if request.auth != null;
}
```

---

## 4. Colección: usernames

**Path:** `/usernames/{username}`

**Descripción:** Colección auxiliar para garantizar unicidad de usernames mediante transacciones.

### Estructura del documento

| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `userId` | string | UID del usuario dueño del username | Sí |

### Ejemplo de documento

```json
{
  "userId": "a1b2c3d4e5f6g7h8i9j0"
}
```

**Document ID:** El username en sí (ej: `/usernames/juanperez`)

### Operaciones

**Registro de usuario:**
```typescript
await runTransaction(db, async (transaction) => {
  const usernameRef = doc(db, 'usernames', username);
  const usernameDoc = await transaction.get(usernameRef);
  
  if (usernameDoc.exists()) {
    throw new Error('Username ya está en uso');
  }
  
  transaction.set(usernameRef, { userId });
  transaction.set(doc(db, 'usuarios', userId), { ...userData });
});
```

**Cambio de username:**
```typescript
await runTransaction(db, async (transaction) => {
  // Verificar disponibilidad del nuevo username
  const newUsernameRef = doc(db, 'usernames', newUsername);
  const newUsernameDoc = await transaction.get(newUsernameRef);
  
  if (newUsernameDoc.exists()) {
    throw new Error('Username ya está en uso');
  }
  
  // Reservar nuevo, liberar anterior
  transaction.set(newUsernameRef, { userId });
  transaction.delete(doc(db, 'usernames', oldUsername));
  transaction.update(doc(db, 'usuarios', userId), { username: newUsername });
});
```

### Firestore Rules

```javascript
match /usernames/{username} {
  allow create: if request.auth != null 
                && request.resource.data.userId == request.auth.uid;
  
  allow delete: if request.auth.uid == resource.data.userId;
  
  allow read: if request.auth != null; // Para validar disponibilidad en UI
}
```

---

## 5. Colección: publicaciones

**Path:** `/publicaciones/{publicacionId}`

**Descripción:** Almacena las publicaciones (ideas) de los usuarios.

### Estructura del documento

| Campo | Tipo | Descripción | Obligatorio | Editable | Indexado |
|-------|------|-------------|-------------|----------|----------|
| `id` | string | ID auto-generado por Firestore | Sí | No | PK |
| `contenido` | string | Texto de la publicación | Sí | Sí* | No |
| `autorId` | string | UID del usuario autor | Sí | No | Sí** |
| `autorUsername` | string | Username del autor (desnormalizado) | Sí | No*** | No |
| `autorRol` | string | Rol del autor (desnormalizado) | Sí | No | No |
| `visibilidad` | string | `'publica'` o `'privada'` | Sí | Sí* | Sí** |
| `fechaCreacion` | timestamp | Fecha de creación | Sí | No | Sí** |
| `fechaModificacion` | timestamp | Fecha de última modificación | Sí | Auto | No |
| `likesCount` | number | Contador de likes (desnormalizado) | Sí | Auto**** | No |

**Notas:**
- *Solo editable por el autor
- **Parte de índices compuestos (ver sección 7)
- ***Se actualiza si el autor cambia su username (transacción)
- ****Se actualiza automáticamente mediante transacción al dar/quitar like

### Ejemplo de documento

```json
{
  "id": "pub1a2b3c4d5e6f7g8h9",
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

### Validaciones

**En cliente:**
```typescript
class Publicacion {
  static validarContenido(contenido: string): boolean {
    return contenido.trim().length > 0 && contenido.length <= 500;
  }
  
  esVisiblePara(usuario: Usuario): boolean {
    return this.visibilidad === 'publica' 
           || this.autorId === usuario.uid 
           || usuario.rol === 'admin';
  }
}
```

**En Firestore Rules:**
```javascript
match /publicaciones/{publicacionId} {
  allow create: if request.auth != null 
                && request.resource.data.autorId == request.auth.uid
                && request.resource.data.contenido.size() > 0;
  
  allow update: if request.auth.uid == resource.data.autorId
                && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['autorId', 'autorUsername', 'fechaCreacion']);
  
  allow delete: if request.auth.uid == resource.data.autorId 
                || (isAdmin() && !targetIsAdmin(resource.data.autorId));
  
  allow read: if request.auth != null 
              && (resource.data.visibilidad == 'publica' 
                  || request.auth.uid == resource.data.autorId 
                  || isAdmin());
}
```

---

## 6. Subcolección: likes

**Path:** `/publicaciones/{publicacionId}/likes/{userId}`

**Descripción:** Almacena los "me gusta" de cada publicación. Es una subcolección dentro de cada publicación.

### Estructura del documento

| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `userId` | string | UID del usuario que dio like | Sí |
| `timestamp` | timestamp | Fecha y hora del like | Sí |

**Document ID:** El UID del usuario (garantiza que cada usuario solo puede dar 1 like por publicación)

### Ejemplo de documento

```json
{
  "userId": "b2c3d4e5f6g7h8i9j0k1",
  "timestamp": "2026-07-07T15:45:00.000Z"
}
```

**Path completo ejemplo:** `/publicaciones/pub1a2b3c4d5e6f7g8h9/likes/b2c3d4e5f6g7h8i9j0k1`

### Operaciones

**Toggle like (dar/quitar):**
```typescript
async function toggleLike(publicacionId: string, userId: string) {
  await runTransaction(db, async (transaction) => {
    const likeRef = doc(db, `publicaciones/${publicacionId}/likes/${userId}`);
    const publicacionRef = doc(db, 'publicaciones', publicacionId);
    
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
}
```

### Firestore Rules

```javascript
match /publicaciones/{publicacionId}/likes/{userId} {
  allow create: if request.auth.uid == userId 
                && isPublicPost(publicacionId) 
                && !isAuthor(publicacionId, userId);
  
  allow delete: if request.auth.uid == userId;
  
  allow read: if request.auth != null;
}

function isPublicPost(publicacionId) {
  return get(/databases/$(database)/documents/publicaciones/$(publicacionId)).data.visibilidad == 'publica';
}

function isAuthor(publicacionId, userId) {
  return get(/databases/$(database)/documents/publicaciones/$(publicacionId)).data.autorId == userId;
}
```

---

## 7. Índices compuestos

Firestore requiere índices compuestos para queries con múltiples filtros u ordenamientos.

### Índice 1: Feed público paginado

**Query:**
```typescript
query(
  collection(db, 'publicaciones'),
  where('visibilidad', '==', 'publica'),
  orderBy('fechaCreacion', 'desc'),
  limit(20)
)
```

**Índice:**
```json
{
  "collectionGroup": "publicaciones",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "visibilidad", "order": "ASCENDING" },
    { "fieldPath": "fechaCreacion", "order": "DESCENDING" }
  ]
}
```

---

### Índice 2: Publicaciones de un usuario

**Query:**
```typescript
query(
  collection(db, 'publicaciones'),
  where('autorId', '==', userId),
  orderBy('fechaCreacion', 'desc')
)
```

**Índice:**
```json
{
  "collectionGroup": "publicaciones",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "autorId", "order": "ASCENDING" },
    { "fieldPath": "fechaCreacion", "order": "DESCENDING" }
  ]
}
```

---

### Archivo: firestore.indexes.json

```json
{
  "indexes": [
    {
      "collectionGroup": "publicaciones",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "visibilidad", "order": "ASCENDING" },
        { "fieldPath": "fechaCreacion", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "publicaciones",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "autorId", "order": "ASCENDING" },
        { "fieldPath": "fechaCreacion", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## 8. Reglas de negocio en el modelo

### 8.1. Edad mínima (13 años)

**Validación en creación de usuario:**
- Cliente: `Usuario.validarEdad(fechaNacimiento)` antes de llamar a `register()`
- Servidor: Firestore Rule `isValidAge(fechaNacimiento)` rechaza si edad < 13

---

### 8.2. Unicidad de username

**Garantía:**
- Colección `usernames/` con transacción atómica
- Firestore Rules validan que `userId` coincida con `auth.uid`

---

### 8.3. Visibilidad de publicaciones

**Regla:**
- Pública: visible para todos los usuarios autenticados
- Privada: visible solo para autor y administradores

**Implementación:**
- Firestore Rule: `visibilidad == 'publica' || autorId == auth.uid || isAdmin()`

---

### 8.4. Autorización de edición/borrado

| Operación | Usuario normal | Administrador |
|-----------|----------------|---------------|
| Editar publicación propia | ✅ | ✅ |
| Editar publicación ajena | ❌ | ❌ |
| Borrar publicación propia | ✅ | ✅ |
| Borrar publicación ajena (autor = usuario) | ❌ | ✅ |
| Borrar publicación ajena (autor = admin) | ❌ | ❌ |
| Borrar cuenta propia | ✅ | ✅ |
| Borrar cuenta ajena (rol = usuario) | ❌ | ✅ |
| Borrar cuenta ajena (rol = admin) | ❌ | ❌ |

**Implementación:**
- Firestore Rules con helper `targetIsAdmin(userId)`

---

### 8.5. Likes

**Reglas:**
- Solo a publicaciones públicas
- No a publicaciones propias
- Toggle permitido (dar/quitar ilimitadamente)
- Contador `likesCount` actualizado atómicamente

**Implementación:**
- Transacción con `increment(+1)` o `increment(-1)`
- Firestore Rules validan `visibilidad == 'publica'` y `autorId != userId`

---

### 8.6. Desnormalización y consistencia

**Campos desnormalizados:**
- `autorUsername` en publicaciones
- `autorRol` en publicaciones
- `likesCount` en publicaciones

**Mantenimiento de consistencia:**
- `autorUsername`: actualizar al cambiar username (transacción sobre todas las publicaciones del usuario)
- `autorRol`: se asume estático (cambio de rol requiere intervención manual)
- `likesCount`: actualizar en transacción de like/unlike

---

## 9. Límites y consideraciones

### Límites de Firestore

| Límite | Valor | Impacto en Yumeideas |
|--------|-------|----------------------|
| Tamaño máximo de documento | 1 MB | OK (publicaciones son solo texto) |
| Operaciones por transacción | 500 | Limitación en borrado en cascada (múltiples batches si > 500) |
| Writes por segundo por documento | 1 | OK (likes no excederán este límite por publicación) |
| Queries por índice | Ilimitadas | OK |
| Tiempo máximo de query | 60 segundos | OK (paginación previene queries largas) |

---

### Consideraciones de escalabilidad

**Borrado en cascada:**
- Si un usuario tiene > 500 publicaciones, requiere múltiples batches
- Cada publicación puede tener < 500 likes (subcolección)
- Total: O(n * m) donde n = publicaciones, m = likes por publicación

**Cambio de username:**
- Actualizar `autorUsername` en todas las publicaciones del usuario
- Puede ser costoso si tiene muchas publicaciones
- Alternativa v2.0: lazy update o limitar frecuencia de cambio

**Contador de likes:**
- `increment()` es atómico y sin límite de frecuencia
- No hay problema de hotspotting (cada publicación es un documento diferente)

---

### Costos estimados (Firebase Pricing)

**Free tier:**
- 50k lecturas/día
- 20k escrituras/día
- 1 GB almacenamiento

**Estimación v1.0 (100 usuarios activos/día):**
- Lecturas: ~5k/día (feed, publicaciones, likes) ✅ Dentro de free tier
- Escrituras: ~1k/día (publicaciones, likes, ediciones) ✅ Dentro de free tier
- Almacenamiento: ~10 MB ✅ Dentro de free tier

**Conclusión:** v1.0 puede funcionar completamente en free tier de Firebase.

---

## Conclusión

Este modelo de datos cumple con:
- ✅ Todos los requisitos funcionales de spec.md
- ✅ Todas las decisiones de clarify.md (AMB-01 a AMB-10)
- ✅ Restricciones de la constitución (sin Cloud Functions)
- ✅ Escalabilidad razonable para v1.0

**Próximo paso:** Definir contratos de servicios y Firestore Rules completas.

---

**Fecha de creación:** 7 de julio de 2026  
**Versión:** 1.0  
**Estado:** Aprobado  
**Autor:** Equipo Yumeideas
