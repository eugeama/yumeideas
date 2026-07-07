# Investigación Técnica - Yumeideas

**Proyecto:** Yumeideas  
**Fecha:** 7 de julio de 2026  
**Versión:** 1.0  
**Propósito:** Investigar soluciones técnicas para desafíos específicos del proyecto

---

## Tabla de Contenidos

1. [Resumen](#resumen)
2. [Desafío 1: Unicidad de username sin backend](#desafío-1-unicidad-de-username-sin-backend)
3. [Desafío 2: Borrado en cascada eficiente](#desafío-2-borrado-en-cascada-eficiente)
4. [Desafío 3: Toggle de likes con contador](#desafío-3-toggle-de-likes-con-contador)
5. [Desafío 4: Paginación eficiente del feed](#desafío-4-paginación-eficiente-del-feed)
6. [Desafío 5: Validación de edad en Firestore Rules](#desafío-5-validación-de-edad-en-firestore-rules)
7. [Desafío 6: Protección entre administradores](#desafío-6-protección-entre-administradores)
8. [Decisiones de arquitectura](#decisiones-de-arquitectura)

---

## 1. Resumen

Este documento investiga soluciones técnicas para los desafíos específicos de implementar Yumeideas con las restricciones de la constitución (sin Cloud Functions, solo Firebase Authentication, Firestore y Hosting).

**Desafíos principales:**
1. Garantizar unicidad de username sin backend propio
2. Implementar borrado en cascada eficiente
3. Toggle de likes con actualización atómica del contador
4. Paginación eficiente del feed público
5. Validación de edad >= 13 en Firestore Rules
6. Protección entre administradores en Firestore Rules

---

## 2. Desafío 1: Unicidad de username sin backend

### Problema

El username debe ser único en todo el sistema, pero Firestore no tiene constraints de unicidad nativos como SQL. Firebase Authentication garantiza unicidad de email, pero no tenemos backend (Cloud Functions) para validar username antes de crear el usuario.

### Soluciones evaluadas

#### Opción A: Query antes de crear (Race Condition) ❌

```typescript
// PROBLEMA: No es atómico, puede haber race condition
const usernameExists = await getDoc(doc(db, 'usuarios', username));
if (!usernameExists.exists()) {
  // Otro usuario podría crear el mismo username aquí ⚠️
  await setDoc(doc(db, 'usuarios', userId), { username });
}
```

**Ventajas:** Simple  
**Desventajas:** Race condition, no atómico

---

#### Opción B: Colección auxiliar con transacción ✅ **ELEGIDA**

```typescript
// Colección auxiliar: /usernames/{username} → { userId }
async function registerUser(username, email, password, fechaNacimiento) {
  // 1. Crear usuario en Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  try {
    // 2. Transacción para reservar username
    await runTransaction(db, async (transaction) => {
      const usernameRef = doc(db, 'usernames', username);
      const usernameDoc = await transaction.get(usernameRef);

      if (usernameDoc.exists()) {
        throw new Error('Username ya está en uso');
      }

      // Reservar username (atómico)
      transaction.set(usernameRef, { userId: uid });

      // Crear documento de usuario
      const userRef = doc(db, 'usuarios', uid);
      transaction.set(userRef, {
        username,
        email,
        fechaNacimiento,
        rol: 'usuario',
        fechaCreacion: serverTimestamp()
      });
    });

    return uid;
  } catch (error) {
    // Rollback: borrar usuario de Authentication si falla
    await deleteUser(userCredential.user);
    throw error;
  }
}
```

**Ventajas:**
- ✅ Atómico (transacción garantiza unicidad)
- ✅ Sin race condition
- ✅ Funciona sin Cloud Functions

**Desventajas:**
- ⚠️ Colección auxiliar extra (overhead mínimo)
- ⚠️ Requiere rollback manual si falla la transacción

**Decisión:** Opción B es la solución correcta para garantizar unicidad sin backend.

---

### Estructura de colección `usernames`

```
/usernames/{username}
  ├─ userId: string (UID del usuario)
```

**Firestore Rules:**

```javascript
match /usernames/{username} {
  // Solo se puede crear si no existe (garantizado por transacción)
  allow create: if request.auth != null;
  
  // Solo el propio usuario puede borrar su reserva de username
  allow delete: if request.auth.uid == resource.data.userId;
  
  // Lectura pública (para validar disponibilidad en UI)
  allow read: if request.auth != null;
}
```

---

### Cambio de username

```typescript
async function updateUsername(userId: string, newUsername: string) {
  const oldUsername = await getUserUsername(userId);

  await runTransaction(db, async (transaction) => {
    const newUsernameRef = doc(db, 'usernames', newUsername);
    const newUsernameDoc = await transaction.get(newUsernameRef);

    if (newUsernameDoc.exists()) {
      throw new Error('Username ya está en uso');
    }

    // Reservar nuevo username
    transaction.set(newUsernameRef, { userId });

    // Actualizar documento de usuario
    transaction.update(doc(db, 'usuarios', userId), { username: newUsername });

    // Liberar username anterior
    transaction.delete(doc(db, 'usernames', oldUsername));

    // Actualizar username desnormalizado en publicaciones
    // (esto puede ser costoso, alternativa: dejar inconsistencia temporal)
    const postsQuery = query(
      collection(db, 'publicaciones'),
      where('autorId', '==', userId)
    );
    const posts = await getDocs(postsQuery);
    posts.forEach((postDoc) => {
      transaction.update(postDoc.ref, { autorUsername: newUsername });
    });
  });
}
```

**Consideración:** Si un usuario tiene muchas publicaciones, actualizar todas puede ser costoso. Alternativas:
1. Aceptar inconsistencia temporal (username anterior en publicaciones antiguas)
2. Lazy update (actualizar solo cuando se edita la publicación)
3. Limitar cambios de username (ej: 1 vez cada 30 días)

**Decisión para v1.0:** Actualizar todas las publicaciones (simplicidad). Si hay problemas de performance, considerar lazy update en v2.0.

---

## 3. Desafío 2: Borrado en cascada eficiente

### Problema

Al borrar una cuenta de usuario, se deben borrar:
1. Documento del usuario en `/usuarios/{userId}`
2. Reserva de username en `/usernames/{username}`
3. Todas las publicaciones del usuario en `/publicaciones/{publicacionId}`
4. Todos los likes en cada publicación (subcolección `/publicaciones/{id}/likes/{userId}`)

Sin Cloud Functions, todo esto debe hacerse desde el cliente.

---

### Soluciones evaluadas

#### Opción A: Borrado secuencial simple ❌

```typescript
// PROBLEMA: Lento, muchas consultas
async function deleteUserAccount(userId: string) {
  // 1. Obtener publicaciones del usuario
  const posts = await getDocs(
    query(collection(db, 'publicaciones'), where('autorId', '==', userId))
  );

  // 2. Borrar cada publicación y sus likes
  for (const post of posts.docs) {
    const likes = await getDocs(collection(db, `publicaciones/${post.id}/likes`));
    for (const like of likes.docs) {
      await deleteDoc(like.ref); // ⚠️ Lento
    }
    await deleteDoc(post.ref);
  }

  // 3. Borrar usuario
  await deleteDoc(doc(db, 'usuarios', userId));
  await deleteDoc(doc(db, 'usernames', username));
  await deleteUser(auth.currentUser);
}
```

**Desventajas:** Muy lento (muchas awaits secuenciales)

---

#### Opción B: Batch writes ✅ **ELEGIDA**

```typescript
async function deleteUserAccount(userId: string, username: string) {
  // 1. Obtener publicaciones del usuario
  const postsSnapshot = await getDocs(
    query(collection(db, 'publicaciones'), where('autorId', '==', userId))
  );

  // 2. Usar batches para borrado masivo (máx 500 operaciones por batch)
  const batches: WriteBatch[] = [];
  let currentBatch = writeBatch(db);
  let operationCount = 0;

  // Borrar documento de usuario
  currentBatch.delete(doc(db, 'usuarios', userId));
  currentBatch.delete(doc(db, 'usernames', username));
  operationCount += 2;

  // Borrar publicaciones y sus likes
  for (const postDoc of postsSnapshot.docs) {
    // Obtener likes de esta publicación
    const likesSnapshot = await getDocs(
      collection(db, `publicaciones/${postDoc.id}/likes`)
    );

    // Borrar cada like
    for (const likeDoc of likesSnapshot.docs) {
      if (operationCount >= 500) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
      currentBatch.delete(likeDoc.ref);
      operationCount++;
    }

    // Borrar publicación
    if (operationCount >= 500) {
      batches.push(currentBatch);
      currentBatch = writeBatch(db);
      operationCount = 0;
    }
    currentBatch.delete(postDoc.ref);
    operationCount++;
  }

  // Añadir último batch
  if (operationCount > 0) {
    batches.push(currentBatch);
  }

  // Ejecutar todos los batches
  await Promise.all(batches.map((batch) => batch.commit()));

  // Borrar de Authentication (último paso)
  await deleteUser(auth.currentUser);
}
```

**Ventajas:**
- ✅ Más rápido (batches paralelos)
- ✅ Atómico por batch (500 operaciones)

**Desventajas:**
- ⚠️ Aún requiere múltiples queries (likes de cada publicación)
- ⚠️ Si hay muchas publicaciones, puede ser lento

---

#### Optimización: Simplificación aceptada ✅

**Decisión:** Para v1.0, NO borrar los likes dados por el usuario en publicaciones ajenas (solo los likes en sus propias publicaciones).

**Razón:**
- Los likes en publicaciones ajenas quedan huérfanos, pero NO afectan la integridad crítica
- El contador `likesCount` se mantiene consistente (las publicaciones siguen existiendo)
- Evita consultar TODAS las publicaciones del sistema para encontrar likes del usuario

**Implementación simplificada:**

```typescript
async function deleteUserAccount(userId: string, username: string) {
  const postsSnapshot = await getDocs(
    query(collection(db, 'publicaciones'), where('autorId', '==', userId))
  );

  const batch = writeBatch(db);
  
  // Borrar usuario y username
  batch.delete(doc(db, 'usuarios', userId));
  batch.delete(doc(db, 'usernames', username));

  // Borrar publicaciones del usuario (likes se borran en cascada por estructura)
  for (const postDoc of postsSnapshot.docs) {
    // Borrar subcolección de likes (recursivo manual)
    const likesSnapshot = await getDocs(
      collection(db, `publicaciones/${postDoc.id}/likes`)
    );
    likesSnapshot.forEach((likeDoc) => batch.delete(likeDoc.ref));
    
    // Borrar publicación
    batch.delete(postDoc.ref);
  }

  await batch.commit();
  await deleteUser(auth.currentUser);
}
```

**Límite:** Firestore batch permite máximo 500 operaciones. Si un usuario tiene > 500 publicaciones, usar múltiples batches (implementado en Opción B).

---

## 4. Desafío 3: Toggle de likes con contador

### Problema

El "me gusta" debe:
1. Ser tipo toggle (dar/quitar)
2. Actualizar el contador `likesCount` en la publicación
3. Ser atómico (evitar condiciones de carrera)

### Solución: Transacción con FieldValue.increment() ✅

```typescript
async function toggleLike(publicacionId: string, userId: string) {
  const likeRef = doc(db, `publicaciones/${publicacionId}/likes/${userId}`);
  const publicacionRef = doc(db, 'publicaciones', publicacionId);

  await runTransaction(db, async (transaction) => {
    const likeDoc = await transaction.get(likeRef);

    if (likeDoc.exists()) {
      // Ya tiene like → quitar
      transaction.delete(likeRef);
      transaction.update(publicacionRef, {
        likesCount: increment(-1)
      });
    } else {
      // No tiene like → agregar
      transaction.set(likeRef, {
        userId,
        timestamp: serverTimestamp()
      });
      transaction.update(publicacionRef, {
        likesCount: increment(1)
      });
    }
  });
}
```

**Ventajas:**
- ✅ Atómico (transacción)
- ✅ `increment()` evita race conditions
- ✅ Un solo método para dar y quitar

**Firestore Rules:**

```javascript
match /publicaciones/{publicacionId} {
  match /likes/{userId} {
    // Crear: solo si es el propio usuario, publicación es pública, y no es el autor
    allow create: if request.auth.uid == userId 
                  && get(/databases/$(database)/documents/publicaciones/$(publicacionId)).data.visibilidad == 'publica'
                  && get(/databases/$(database)/documents/publicaciones/$(publicacionId)).data.autorId != userId;
    
    // Borrar: solo el propio usuario
    allow delete: if request.auth.uid == userId;
  }
}
```

---

## 5. Desafío 4: Paginación eficiente del feed

### Problema

El feed público puede tener miles de publicaciones. NO se puede traer todo a memoria del cliente y filtrar.

### Solución: Query con cursores ✅

```typescript
const POSTS_PER_PAGE = 20;

async function getPublicFeed(lastVisible?: DocumentSnapshot) {
  let q = query(
    collection(db, 'publicaciones'),
    where('visibilidad', '==', 'publica'),
    orderBy('fechaCreacion', 'desc'),
    limit(POSTS_PER_PAGE)
  );

  // Si hay cursor (scroll infinito), continuar desde ahí
  if (lastVisible) {
    q = query(q, startAfter(lastVisible));
  }

  const snapshot = await getDocs(q);
  
  return {
    posts: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastVisible: snapshot.docs[snapshot.docs.length - 1] // Guardar para siguiente página
  };
}
```

**Índice necesario:**

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
    }
  ]
}
```

**UI (React):**

```typescript
function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  async function loadMore() {
    const result = await getPublicFeed(lastVisible);
    setPosts([...posts, ...result.posts]);
    setLastVisible(result.lastVisible);
    setHasMore(result.posts.length === POSTS_PER_PAGE);
  }

  return (
    <div>
      {posts.map(post => <Post key={post.id} {...post} />)}
      {hasMore && <button onClick={loadMore}>Cargar más</button>}
    </div>
  );
}
```

---

## 6. Desafío 5: Validación de edad en Firestore Rules

### Problema

El registro debe rechazarse si la edad calculada a partir de `fechaNacimiento` es < 13 años. Esto debe validarse en Firestore Rules (servidor), no solo en el cliente.

### Solución: Función helper en Firestore Rules ✅

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: calcular edad a partir de timestamp
    function getAge(birthdate) {
      // duration.time() calcula diferencia en segundos
      // Convertir a años: segundos / (365.25 * 24 * 60 * 60)
      let ageInSeconds = duration.time(request.time - birthdate);
      return ageInSeconds / duration.value(1, 'y'); // años
    }
    
    match /usuarios/{userId} {
      allow create: if request.auth.uid == userId
                    && getAge(request.resource.data.fechaNacimiento) >= 13
                    && request.resource.data.rol == 'usuario'; // No auto-asignar admin
    }
  }
}
```

**Nota:** `duration.value(1, 'y')` convierte 1 año a segundos (365.25 días).

**Problema potencial:** La precisión de `duration` puede variar. Para mayor precisión:

```javascript
function isOldEnough(birthdate) {
  // Calcular años de forma más precisa
  let yearsDiff = request.time.year() - birthdate.year();
  let monthDiff = request.time.month() - birthdate.month();
  let dayDiff = request.time.day() - birthdate.day();
  
  // Ajustar si aún no cumplió años este año
  return yearsDiff > 13 || 
         (yearsDiff == 13 && (monthDiff > 0 || (monthDiff == 0 && dayDiff >= 0)));
}
```

**Decisión:** Usar versión simplificada con `duration` para v1.0. Es suficientemente precisa (diferencia de días es negligible para validar >= 13 años).

---

## 7. Desafío 6: Protección entre administradores

### Problema

Un admin NO debe poder borrar cuentas ni publicaciones de otro admin. Firestore Rules debe validar esto.

### Solución: Helper para verificar rol del target ✅

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function getUserData(uid) {
      return get(/databases/$(database)/documents/usuarios/$(uid)).data;
    }
    
    function isAdmin() {
      return getUserData(request.auth.uid).rol == 'admin';
    }
    
    function targetIsAdmin(targetUid) {
      return getUserData(targetUid).rol == 'admin';
    }
    
    match /usuarios/{userId} {
      // Borrar: propio usuario O (admin Y target NO es admin)
      allow delete: if request.auth.uid == userId 
                    || (isAdmin() && !targetIsAdmin(userId));
    }
    
    match /publicaciones/{publicacionId} {
      // Borrar: autor O (admin Y autor NO es admin)
      allow delete: if request.auth.uid == resource.data.autorId 
                    || (isAdmin() && !targetIsAdmin(resource.data.autorId));
    }
  }
}
```

**Importante:** `get()` en Firestore Rules cuenta como lectura (cobra). Optimizar cacheo en cliente para minimizar llamadas.

---

## 8. Decisiones de arquitectura

### 8.1. Desnormalización vs. Normalización

**Decisión:** Desnormalizar `autorUsername` y `likesCount` en publicaciones.

**Razón:**
- Feed público necesita mostrar username del autor SIN hacer join
- Contador de likes necesita mostrar valor SIN contar subcolección
- Trade-off: Más rápido de leer, más complejo de mantener consistente

**Alternativa rechazada:** Normalización pura (requeriría múltiples queries por publicación).

---

### 8.2. Subcolección vs. Colección independiente para likes

**Decisión:** Usar subcolección `/publicaciones/{id}/likes/{userId}`

**Razón:**
- Organización jerárquica clara (los likes pertenecen a la publicación)
- Fácil borrar todos los likes de una publicación (borrar publicación → borrar subcolección)
- Firestore Rules más simples (hereda contexto de publicación padre)

**Alternativa rechazada:** Colección independiente `/likes/{likeId}` (más flexible pero más compleja).

---

### 8.3. Almacenamiento de rol: campo vs. Custom Claims

**Decisión:** Usar campo `rol` en documento de usuario en Firestore.

**Razón:**
- Custom Claims requieren Firebase Admin SDK (Cloud Functions) → PROHIBIDO
- Campo en Firestore es simple y suficiente
- Firestore Rules pueden leer el campo con `get()`

**Desventaja aceptada:** Requiere lectura extra en Firestore Rules (cuenta como lectura). Aceptable para v1.0.

---

### 8.4. Estrategia de testing de Firestore Rules

**Decisión:** Usar `@firebase/rules-unit-testing` con Firebase Emulators.

**Setup:**

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-yumeideas',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test('Usuario no puede leer publicación privada ajena', async () => {
  const alice = testEnv.authenticatedContext('alice');
  const bob = testEnv.authenticatedContext('bob');
  
  // Bob crea publicación privada
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection('publicaciones').doc('post1').set({
      autorId: 'bob',
      contenido: 'Post privado',
      visibilidad: 'privada'
    });
  });
  
  // Alice NO puede leer
  await assertFails(
    alice.firestore().collection('publicaciones').doc('post1').get()
  );
});
```

---

## Conclusión

Este documento ha investigado y definido soluciones técnicas para los principales desafíos del proyecto Yumeideas:

1. ✅ **Unicidad de username:** Colección auxiliar + transacción
2. ✅ **Borrado en cascada:** Batch writes, simplificación aceptada
3. ✅ **Toggle de likes:** Transacción con `increment()`
4. ✅ **Paginación:** Cursores con `startAfter()`
5. ✅ **Validación de edad:** Helper en Firestore Rules
6. ✅ **Protección entre admins:** Helper `targetIsAdmin()`

Todas las soluciones cumplen con la constitución (sin Cloud Functions, solo cliente + Firestore Rules).

---

**Fecha de creación:** 7 de julio de 2026  
**Versión:** 1.0  
**Estado:** Aprobado  
**Próximo paso:** Crear `data-model.md` con la estructura exacta de Firestore
