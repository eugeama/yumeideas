# Documento de Aclaración de Ambigüedades - Yumeideas

**Proyecto:** Yumeideas  
**Fecha:** 7 de julio de 2026  
**Versión:** 1.0  
**Estado:** Aprobado  
**Documento base:** [spec.md](./spec.md)

---

## Tabla de Contenidos

1. [Propósito de este documento](#propósito-de-este-documento)
2. [Metodología de resolución](#metodología-de-resolución)
3. [Resumen de decisiones](#resumen-de-decisiones)
4. [Aclaraciones detalladas](#aclaraciones-detalladas)
5. [Impacto en la especificación](#impacto-en-la-especificación)
6. [Actualizaciones al modelo de datos](#actualizaciones-al-modelo-de-datos)
7. [Actualizaciones a requisitos funcionales](#actualizaciones-a-requisitos-funcionales)
8. [Próximos pasos](#próximos-pasos)

---

## 1. Propósito de este documento

Este documento resuelve las **10 ambigüedades** identificadas en la especificación inicial ([spec.md](./spec.md)) del proyecto Yumeideas. Cada ambigüedad ha sido analizada y se ha tomado una **decisión definitiva** basada en:

- Principios de la constitución del proyecto
- Mejores prácticas de UX y seguridad
- Simplicidad de implementación
- Cumplimiento de estándares legales internacionales
- Coherencia con el alcance del proyecto

**IMPORTANTE:** Las decisiones aquí documentadas son **definitivas** y deben respetarse durante la implementación. No se debe programar funcionalidad que contradiga estas decisiones.

---

## 2. Metodología de resolución

Para cada ambigüedad se siguió el siguiente proceso:

1. **Análisis del contexto:** Revisar el requisito funcional y su impacto
2. **Evaluación de opciones:** Considerar alternativas viables
3. **Criterios de decisión:** Aplicar principios de la constitución
4. **Decisión final:** Seleccionar la opción más coherente
5. **Justificación:** Documentar el razonamiento
6. **Impacto:** Identificar cambios necesarios en la especificación

---

## 3. Resumen de decisiones

| ID | Ambigüedad | Decisión Final | Justificación resumida |
|---|---|---|---|
| **AMB-01** | Edición de correo y fecha de nacimiento | Solo **username y contraseña** editables | Datos de identidad deben ser estables |
| **AMB-02** | Borrado de publicaciones al eliminar cuenta | **Borrado en cascada** completo | Privacidad y derecho al olvido |
| **AMB-03** | Creación del rol admin | **Manual en Firestore** (v1.0) | Simplicidad y cumplimiento de restricciones |
| **AMB-04** | Recuperación de contraseña | **Incluir** en v1.0 | Funcionalidad estándar esperada |
| **AMB-05** | Like al propio post | **Prohibir** | Convención de redes sociales |
| **AMB-06** | Toggle de like | **Permitir** (dar/quitar) | Comportamiento estándar esperado |
| **AMB-07** | Jerarquía entre admins | **Protección entre admins** | Seguridad y prevención de conflictos |
| **AMB-08** | Validación de correo Gmail | **Cualquier correo válido** | Accesibilidad y flexibilidad |
| **AMB-09** | Restricción etaria | **Mínimo 13 años** | Cumplimiento COPPA |
| **AMB-10** | Likes al cambiar visibilidad | **Mantener pero ocultar** | Simplicidad y reversibilidad |

---

## 4. Aclaraciones detalladas

### AMB-01: Edición de correo y fecha de nacimiento post-registro

#### Ambigüedad original
No se especificaba si el correo electrónico y la fecha de nacimiento son editables después del registro.

#### Opciones consideradas
1. Solo username y contraseña editables (correo y fecha fijos)
2. Todos los campos editables

#### ✅ Decisión final
**Solo username y contraseña son editables post-registro.**

- **Correo electrónico:** NO editable después del registro
- **Fecha de nacimiento:** NO editable después del registro
- **Username:** SÍ editable
- **Contraseña:** SÍ editable (con re-autenticación)

#### Justificación

**Correo electrónico:**
- Es la credencial principal de Firebase Authentication
- Cambiarlo genera complejidad técnica (requiere re-autenticación y actualización en Auth + Firestore)
- Es un dato de identidad que debe permanecer estable
- Si un usuario necesita cambiar su correo, puede crear una nueva cuenta

**Fecha de nacimiento:**
- Es un dato de identidad que no cambia en la realidad
- Se usa para validar edad mínima (13 años)
- Permitir editarlo podría usarse para evadir restricciones etarias
- Mantenerlo fijo garantiza integridad del dato

**Username y contraseña:**
- Son datos que lógicamente pueden necesitar cambios
- Username: por preferencias del usuario, conflictos, etc.
- Contraseña: por seguridad, compromiso, etc.

#### Impacto en requisitos

- **RF-1.3 (Modificar perfil):** Actualizar para indicar solo username y contraseña editables
- **HU-12 (Modificar perfil):** Actualizar criterios de aceptación

---

### AMB-02: Borrado de publicaciones al eliminar cuenta

#### Ambigüedad original
No se especificaba si al borrar una cuenta de usuario se deben borrar también todas sus publicaciones, o si deben quedar huérfanas/anonimizadas.

#### Opciones consideradas
1. Borrado en cascada (usuario + publicaciones + likes)
2. Anonimización (mantener publicaciones como "Usuario eliminado")
3. Prohibir borrado si tiene publicaciones

#### ✅ Decisión final
**Borrado en cascada completo.**

Cuando se elimina una cuenta de usuario (propia o por admin):
1. Se borra el documento del usuario en Firestore
2. Se borra la cuenta en Firebase Authentication
3. Se borran **todas las publicaciones** del usuario
4. Se borran **todos los likes** dados por el usuario (en publicaciones ajenas)
5. Se borran **todos los likes** en las publicaciones del usuario (subcolección)

#### Justificación

**Privacidad y derecho al olvido:**
- Coherente con GDPR y el "derecho al olvido"
- El usuario que borra su cuenta espera que TODO su contenido desaparezca
- Mantener publicaciones huérfanas contradice la expectativa de privacidad

**Simplicidad técnica:**
- Más simple de implementar que anonimización
- No requiere estado especial de "usuario eliminado"
- No genera datos inconsistentes (publicaciones sin autor válido)

**Coherencia con el modelo:**
- Las publicaciones pertenecen al usuario (relación de propiedad fuerte)
- Sin el usuario, las publicaciones pierden contexto y autoría

**Integridad referencial:**
- Evita referencias rotas (`autorId` apuntando a usuario inexistente)
- Mantiene la base de datos limpia

#### Implementación técnica

```javascript
// Pseudocódigo del flujo de borrado
async function deleteUserAccount(userId, isAdmin) {
  // 1. Validar permisos
  if (!isAdmin && auth.uid !== userId) {
    throw new Error('No autorizado');
  }
  
  // 2. Borrar todas las publicaciones del usuario
  const publicaciones = await getDocs(
    query(collection(db, 'publicaciones'), where('autorId', '==', userId))
  );
  
  for (const pub of publicaciones.docs) {
    // 2a. Borrar likes de la publicación (subcolección)
    const likes = await getDocs(collection(db, 'publicaciones', pub.id, 'likes'));
    for (const like of likes.docs) {
      await deleteDoc(like.ref);
    }
    
    // 2b. Borrar la publicación
    await deleteDoc(pub.ref);
  }
  
  // 3. Borrar todos los likes dados por el usuario en publicaciones ajenas
  // (si se usa subcolección: buscar en todas las publicaciones)
  // Nota: esto es costoso; alternativa es dejar likes huérfanos
  // DECISIÓN: Dejar likes huérfanos por performance, solo borrar los de sus propias publicaciones
  
  // 4. Borrar documento del usuario en Firestore
  await deleteDoc(doc(db, 'usuarios', userId));
  
  // 5. Borrar cuenta en Firebase Auth
  // (requiere privilegios de admin o re-autenticación si es el propio usuario)
  await deleteUser(userId);
}
```

**Simplificación aceptada:**
Los likes dados por el usuario en publicaciones ajenas pueden quedar huérfanos (por razones de performance). Esto es aceptable porque:
- No afecta la integridad crítica (las publicaciones siguen existiendo)
- El contador `likesCount` se mantiene consistente
- Evita consultas costosas a todas las publicaciones del sistema

#### Impacto en requisitos

- **RF-1.4 (Eliminar cuenta propia):** Especificar borrado en cascada
- **RF-4.1 (Borrar cuenta de usuario - admin):** Especificar borrado en cascada
- **HU-08, HU-10:** Actualizar criterios de aceptación
- **Firestore Rules:** Permitir borrado de publicaciones al borrar cuenta

---

### AMB-03: Mecanismo de creación/asignación del rol admin

#### Ambigüedad original
No se especificaba cómo se crea el primer administrador ni cómo se asigna el rol admin a usuarios.

#### Opciones consideradas
1. Manual en Firestore (consola)
2. Usuario semilla (script de inicialización)
3. Panel de gestión en UI (admin promueve a otros)
4. Custom claims de Firebase (requiere Cloud Functions - PROHIBIDO)

#### ✅ Decisión final
**Creación manual en Firestore para v1.0, con evolución futura a panel de gestión.**

**Versión 1.0 (MVP):**
- El primer administrador se crea **manualmente** editando Firestore desde la consola de Firebase
- Proceso:
  1. Usuario se registra normalmente (rol `usuario` por defecto)
  2. Admin técnico accede a Firebase Console
  3. Edita el documento del usuario en `/usuarios/{userId}`
  4. Cambia el campo `rol` de `'usuario'` a `'admin'`
  5. El usuario cierra sesión y vuelve a iniciar sesión para que se actualicen los permisos

**Versiones futuras (v2.0+):**
- Implementar panel de administración en la UI
- Un admin existente puede promover a otros usuarios a admin
- HU adicional: "Como admin, quiero promover a un usuario a administrador"

#### Justificación

**Para v1.0:**
- ✅ **Cumple restricciones:** No requiere Cloud Functions ni backend custom
- ✅ **Simplicidad:** No requiere UI adicional en el MVP
- ✅ **Seguridad:** Solo personal técnico con acceso a Firebase Console puede crear admins
- ✅ **Suficiente para MVP:** En etapas iniciales, habrá pocos admins

**Razones para NO usar Custom Claims de Firebase:**
- ❌ Requiere Firebase Admin SDK
- ❌ Requiere Cloud Functions (PROHIBIDO por constitución)
- ❌ Mayor complejidad sin beneficio significativo en v1.0

**Ventajas de evolucionar a panel de gestión:**
- Autoservicio (no requiere acceso técnico a Firebase Console)
- Auditoría de cambios de roles
- UX más profesional

#### Procedimiento documentado (v1.0)

**Crear el primer administrador:**

1. **Registro normal:**
   ```
   Usuario se registra en la app con email/contraseña
   → Automáticamente recibe rol 'usuario'
   ```

2. **Promoción manual (Firebase Console):**
   ```
   Admin técnico:
   1. Acceder a Firebase Console
   2. Ir a Firestore Database
   3. Navegar a colección "usuarios"
   4. Buscar el documento del usuario por UID
   5. Editar el campo "rol": cambiar "usuario" → "admin"
   6. Guardar cambios
   ```

3. **Activación:**
   ```
   Usuario cierra sesión y vuelve a iniciar sesión
   → Ahora tiene permisos de admin
   ```

**Crear administradores adicionales:**
- Mismo procedimiento (manual en Firestore Console)
- O esperar a v2.0 con panel de gestión

#### Impacto en requisitos

- **RF-1.5 (Gestión de roles):** Documentar procedimiento manual
- **Documentación técnica:** Crear guía de "Cómo crear el primer admin"
- **Roadmap v2.0:** Agregar HU de panel de gestión de roles

---

### AMB-04: Recuperación de contraseña en alcance

#### Ambigüedad original
No se especificaba si la funcionalidad de recuperación de contraseña olvidada está en el alcance de v1.0.

#### Opciones consideradas
1. Incluir en v1.0 (usando funcionalidad nativa de Firebase Auth)
2. Excluir de v1.0, agregar en versiones posteriores

#### ✅ Decisión final
**Incluir recuperación de contraseña en v1.0.**

Implementar flujo de "Olvidé mi contraseña" usando la funcionalidad nativa de Firebase Authentication.

#### Justificación

**Expectativa estándar de usuarios:**
- Es una funcionalidad básica esperada en cualquier sistema con autenticación
- La ausencia genera frustración y tickets de soporte

**Firebase Auth lo ofrece nativamente:**
- No requiere desarrollo custom complejo
- No requiere Cloud Functions (solo configuración)
- Solo requiere:
  1. Llamada a `sendPasswordResetEmail(email)` en el cliente
  2. Configurar plantilla de email en Firebase Console (opcional)
  3. Componente de UI simple (formulario con campo de email)

**Bajo esfuerzo de implementación:**
- Aproximadamente 2-4 horas de desarrollo
- UI: 1 página/modal simple
- Lógica: 1 llamada a Firebase Auth
- Sin backend custom necesario

**Coherente con restricciones:**
- ✅ No requiere Cloud Functions
- ✅ Funcionalidad nativa de Firebase Authentication (servicio permitido)

**Mejora significativa de UX:**
- Reduce dependencia de soporte técnico
- Permite autoservicio para usuarios

#### Implementación

**Componente UI:**
```typescript
// ForgotPassword.tsx (pseudocódigo)
function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  
  async function handleSubmit() {
    await sendPasswordResetEmail(auth, email);
    setSent(true);
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {!sent ? (
        <>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ingresa tu correo electrónico"
          />
          <button type="submit">Enviar email de recuperación</button>
        </>
      ) : (
        <p>Revisa tu email. Te hemos enviado un link para restablecer tu contraseña.</p>
      )}
    </form>
  );
}
```

**Flujo de usuario:**
1. Usuario hace clic en "Olvidé mi contraseña" en página de login
2. Ingresa su correo electrónico
3. Firebase envía email con link de recuperación
4. Usuario hace clic en el link (abre página de Firebase)
5. Usuario ingresa nueva contraseña
6. Usuario vuelve a la app e inicia sesión con nueva contraseña

#### Impacto en requisitos

- **RF-1.6 (Recuperación de contraseña):** Cambiar estado de "AMB-04" a "Incluido en v1.0"
- **Nueva HU:** "Como usuario, quiero recuperar mi contraseña si la olvido" (Prioridad: Media)
- **UI:** Agregar componente `ForgotPassword` y link en página de login

---

### AMB-05: Like al propio post

#### Ambigüedad original
No se especificaba si el autor puede darse "me gusta" a su propia publicación.

#### Opciones consideradas
1. Permitir que el autor se dé like a sí mismo
2. Prohibir (deshabilitar botón de like en publicaciones propias)

#### ✅ Decisión final
**Prohibir que el autor se dé like a su propia publicación.**

El botón de "me gusta" debe estar:
- **Deshabilitado** (o no visible) en publicaciones propias
- **Habilitado** solo en publicaciones de otros usuarios

#### Justificación

**Convención de redes sociales:**
- Facebook, Twitter, Instagram, LinkedIn NO permiten darse like a sí mismo
- Es una práctica universalmente aceptada
- Romper esta convención confundiría a los usuarios

**Razones conceptuales:**
- El "me gusta" es una señal de **aprobación de terceros**
- Darse like a sí mismo no aporta información útil
- Sería visto como vanidad o inflación artificial de métricas

**Integridad de métricas:**
- El contador de likes debe reflejar **interés externo**, no autovalidación
- Permite likes del autor distorsionaría el significado del contador

**Simplicidad de implementación:**
- Validación simple: `if (publicacion.autorId === currentUser.uid) → deshabilitar botón`
- Firestore Rule: `allow create: if request.auth.uid != publicacion.autorId`

#### Implementación

**Validación en UI:**
```typescript
// LikeButton.tsx (pseudocódigo)
function LikeButton({ publicacion, currentUser }) {
  const isOwnPost = publicacion.autorId === currentUser.uid;
  
  if (isOwnPost) {
    return null; // No mostrar botón en publicaciones propias
    // O mostrar deshabilitado: <button disabled>Me gusta</button>
  }
  
  return (
    <button onClick={handleLike}>
      {userHasLiked ? '❤️ Te gusta' : '🤍 Me gusta'}
    </button>
  );
}
```

**Validación en Firestore Rules:**
```javascript
// Firestore Rules
match /publicaciones/{publicacionId}/likes/{userId} {
  allow create: if request.auth.uid == userId 
                && request.auth.uid != get(/databases/$(database)/documents/publicaciones/$(publicacionId)).data.autorId;
}
```

#### Impacto en requisitos

- **RF-3.1 (Dar "me gusta"):** Agregar restricción explícita: "excepto en publicaciones propias"
- **HU-06:** Actualizar criterio: "Dado que veo una publicación de OTRO usuario"
- **UI:** Ocultar/deshabilitar botón de like en publicaciones propias

---

### AMB-06: Toggle de "me gusta" (quitar like)

#### Ambigüedad original
No se especificaba explícitamente si un usuario puede quitar su "me gusta" después de haberlo dado.

#### Opciones consideradas
1. Toggle: permitir dar y quitar like
2. Permanente: el like es definitivo, no se puede quitar

#### ✅ Decisión final
**Permitir toggle (dar y quitar "me gusta").**

Un usuario puede:
- Dar like a una publicación (si aún no lo ha hecho)
- Quitar su like (si ya lo había dado)
- Volver a dar like (ilimitadamente)

#### Justificación

**Comportamiento estándar esperado:**
- Todas las redes sociales modernas permiten toggle de likes
- Los usuarios esperan poder cambiar de opinión
- Es el comportamiento intuitivo y natural

**Beneficios de UX:**
- Permite corregir clicks accidentales
- Permite cambio de opinión genuino
- Reduce frustración del usuario

**Simplicidad técnica:**
- No es más complejo que like permanente
- Solo requiere validar existencia antes de crear/borrar

#### Implementación

**Lógica de toggle:**
```typescript
// likeService.ts (pseudocódigo)
async function toggleLike(publicacionId: string, userId: string) {
  const likeRef = doc(db, 'publicaciones', publicacionId, 'likes', userId);
  const likeDoc = await getDoc(likeRef);
  
  if (likeDoc.exists()) {
    // Ya tiene like → quitar
    await runTransaction(db, async (transaction) => {
      transaction.delete(likeRef);
      transaction.update(doc(db, 'publicaciones', publicacionId), {
        likesCount: increment(-1)
      });
    });
  } else {
    // No tiene like → agregar
    await runTransaction(db, async (transaction) => {
      transaction.set(likeRef, {
        userId,
        timestamp: serverTimestamp()
      });
      transaction.update(doc(db, 'publicaciones', publicacionId), {
        likesCount: increment(1)
      });
    });
  }
}
```

**UI:**
```typescript
// LikeButton.tsx
function LikeButton({ publicacion, currentUser }) {
  const [hasLiked, setHasLiked] = useState(false);
  
  async function handleClick() {
    await toggleLike(publicacion.id, currentUser.uid);
    setHasLiked(!hasLiked);
  }
  
  return (
    <button onClick={handleClick}>
      {hasLiked ? '❤️ Te gusta' : '🤍 Me gusta'}
      <span>{publicacion.likesCount}</span>
    </button>
  );
}
```

#### Impacto en requisitos

- **RF-3.3 (Quitar "me gusta"):** Cambiar de "se asume" a "confirmado"
- **HU-06:** Agregar criterio: "Y puedo presionar nuevamente para quitar mi like"

---

### AMB-07: Jerarquía entre administradores

#### Ambigüedad original
No se especificaba si un admin puede borrar cuentas o publicaciones de otro admin.

#### Opciones consideradas
1. Admins son iguales: cualquier admin puede borrar cuentas/publicaciones de otros admins
2. Protección entre admins: un admin NO puede borrar cuentas/publicaciones de otros admins
3. Super-admin: existe un rol superior que sí puede gestionar admins

#### ✅ Decisión final
**Protección entre administradores.**

Las reglas son:
- Un admin **NO puede** borrar la cuenta de otro admin
- Un admin **NO puede** borrar publicaciones de otro admin
- Un admin **SÍ puede** borrar cuentas y publicaciones de usuarios normales
- Cada admin tiene control total sobre su propio contenido (como cualquier usuario)

#### Justificación

**Seguridad:**
- Previene conflictos entre administradores
- Evita sabotaje interno o errores accidentales
- Protege cuentas privilegiadas de acciones maliciosas

**Separación de poderes:**
- Ningún admin individual tiene poder absoluto
- Requiere consenso o intervención técnica externa para remover a un admin
- Coherente con principios de seguridad corporativa

**Escalabilidad del modelo:**
- Permite tener múltiples admins sin riesgo de que se eliminen entre sí
- Facilita delegación de moderación a múltiples personas de confianza

**Simplicidad vs Super-admin:**
- No requiere crear un tercer rol (`super-admin`)
- Suficiente para v1.0
- Si se necesita mayor jerarquía, se puede agregar en versiones futuras

#### Implementación

**Firestore Rules:**
```javascript
// Helper: verificar si el objetivo es admin
function targetIsAdmin(targetUserId) {
  return get(/databases/$(database)/documents/usuarios/$(targetUserId)).data.rol == 'admin';
}

// Colección: usuarios
match /usuarios/{userId} {
  // Borrar cuenta: solo si eres el dueño O (eres admin Y el objetivo NO es admin)
  allow delete: if request.auth.uid == userId 
                || (isAdmin() && !targetIsAdmin(userId));
}

// Colección: publicaciones
match /publicaciones/{publicacionId} {
  // Borrar: solo si eres el autor O (eres admin Y el autor NO es admin)
  allow delete: if request.auth.uid == resource.data.autorId 
                || (isAdmin() && !targetIsAdmin(resource.data.autorId));
}
```

**Validación en servicios:**
```typescript
// userService.ts
async function deleteUserAccount(targetUserId: string) {
  const currentUser = auth.currentUser;
  const currentUserData = await getDoc(doc(db, 'usuarios', currentUser.uid));
  const targetUserData = await getDoc(doc(db, 'usuarios', targetUserId));
  
  // Validar: no permitir borrar otro admin
  if (currentUserData.data().rol === 'admin' && targetUserData.data().rol === 'admin') {
    throw new Error('Un administrador no puede borrar la cuenta de otro administrador');
  }
  
  // Proceder con borrado...
}
```

#### Caso especial: Remover a un admin

Si se necesita remover a un administrador:
1. **Opción 1 (Manual):** Admin técnico edita Firestore Console y cambia rol a `usuario`, luego otro admin puede borrar la cuenta
2. **Opción 2 (Manual):** Admin técnico borra directamente desde Firebase Console
3. **Opción 3 (Futuro):** Implementar rol `super-admin` con capacidad de gestionar admins

Para v1.0, las opciones 1 y 2 son suficientes.

#### Impacto en requisitos

- **RF-4.1 (Borrar cuenta de usuario):** Agregar restricción: "excepto otros admins"
- **RF-2.7 (Borrar publicación ajena - admin):** Agregar restricción: "excepto publicaciones de otros admins"
- **Firestore Rules:** Actualizar con validación `targetIsAdmin()`
- **Documentación:** Documentar procedimiento para remover un admin (manual)

---

### AMB-08: Validación estricta de dominio de correo

#### Ambigüedad original
La descripción inicial mencionaba "correo electrónico (Gmail)" pero no aclaraba si se acepta SOLO @gmail.com o cualquier correo válido.

#### Opciones consideradas
1. Solo Gmail: validar dominio `@gmail.com` estrictamente
2. Cualquier correo: aceptar cualquier formato de correo válido

#### ✅ Decisión final
**Aceptar cualquier correo electrónico con formato válido.**

No se restringe a dominios específicos (@gmail.com, @outlook.com, etc.). Se acepta:
- ✅ usuario@gmail.com
- ✅ usuario@outlook.com
- ✅ usuario@yahoo.com
- ✅ usuario@empresa.com
- ✅ usuario@universidad.edu.ar
- ✅ Cualquier correo con formato RFC válido

#### Justificación

**Accesibilidad:**
- No excluir usuarios que no usan Gmail
- Permitir uso de correos corporativos, educativos, etc.
- Aumentar base de usuarios potenciales

**La mención de "Gmail" era ilustrativa:**
- Se interpretó como ejemplo, no como restricción
- No hay razón de negocio para limitar a Gmail
- Firebase Auth soporta cualquier correo

**Simplicidad:**
- Usar validación estándar de formato de email (RFC 5322)
- No requiere lógica custom de whitelist/blacklist de dominios
- Firebase Auth ya valida formato automáticamente

**Flexibilidad futura:**
- Si en el futuro se necesita restricción, es más fácil restringir que abrir
- Pero no hay indicios de que sea necesario

#### Implementación

**Validación (client-side):**
```typescript
// validators.ts
function isValidEmail(email: string): boolean {
  // Regex básico de formato de email (HTML5 standard)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// NO validar dominio específico:
// ❌ function isGmailOnly(email: string): boolean {
//      return email.endsWith('@gmail.com');
//    }
```

**Mensaje en UI:**
```
Campo: "Correo electrónico"
Placeholder: "tu@correo.com"
Error: "Ingresa un correo electrónico válido"
```

**Firebase Auth se encarga del resto:**
- Validación de formato en servidor
- Envío de email de verificación (si se implementa)
- Gestión de duplicados

#### Impacto en requisitos

- **RF-1.1 (Registro de usuario):** Aclarar "correo electrónico válido (cualquier dominio)"
- **Documentación:** Eliminar referencia a "Gmail" como restricción, usar "correo electrónico"

---

### AMB-09: Restricción etaria (edad mínima)

#### Ambigüedad original
Se solicita fecha de nacimiento en el registro pero no se especificaba una edad mínima.

#### Opciones consideradas
1. Sin restricción (permitir cualquier edad)
2. Edad mínima 13 años (COPPA EE.UU.)
3. Edad mínima 16 años (GDPR UE)
4. Edad mínima con consentimiento parental

#### ✅ Decisión final
**Edad mínima de 13 años.**

Los usuarios deben tener al menos 13 años cumplidos al momento del registro.

- ✅ Fecha de nacimiento indica >= 13 años → Registro permitido
- ❌ Fecha de nacimiento indica < 13 años → Registro rechazado con mensaje claro

#### Justificación

**Cumplimiento legal (COPPA):**
- Children's Online Privacy Protection Act (EE.UU.) requiere 13 años mínimo
- Es el estándar internacional más adoptado (Facebook, Twitter, Instagram, TikTok, YouTube)
- Reduce riesgo legal significativamente

**Balance entre accesibilidad y responsabilidad:**
- 13 años es menos restrictivo que 16 (GDPR) o 18
- Permite audiencia adolescente (target común en redes sociales)
- Evita complejidad de consentimiento parental

**Implementación simple:**
- Cálculo directo de edad a partir de fecha de nacimiento
- Validación en cliente y Firestore Rules
- No requiere infraestructura adicional (vs. verificación de identidad real)

**Coherente con el tipo de plataforma:**
- Red social con contenido generado por usuarios
- Moderación por administradores (no hay filtros algorítmicos avanzados)
- Razonable requerir madurez mínima

#### Implementación

**Validación en cliente:**
```typescript
// validators.ts
function isOldEnough(fechaNacimiento: Date): boolean {
  const today = new Date();
  const birthDate = new Date(fechaNacimiento);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Ajustar si aún no cumplió años este año
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 13;
}

// En el formulario de registro
function validateRegistration(data) {
  if (!isOldEnough(data.fechaNacimiento)) {
    throw new Error('Debes tener al menos 13 años para registrarte');
  }
}
```

**Validación en Firestore Rules:**
```javascript
// Firestore Rules (en colección usuarios)
match /usuarios/{userId} {
  function isOldEnough(birthdate) {
    let age = duration.time(request.time - birthdate).years();
    return age >= 13;
  }
  
  allow create: if request.auth.uid == userId 
                && isOldEnough(request.resource.data.fechaNacimiento);
}
```

**Mensaje de error (UX):**
```
❌ "Debes tener al menos 13 años para crear una cuenta en Yumeideas."

Opcional: Link a política de privacidad o términos de servicio
```

#### Caso especial: Usuarios que mienten sobre su edad

- **Prevención:** Advertencia clara en registro: "Proporcionar información falsa viola nuestros términos"
- **Detección:** No hay mecanismo automatizado (fuera de alcance de v1.0)
- **Reporte:** Si se reporta/detecta un menor de 13, admin puede borrar la cuenta
- **Futuro:** Implementar sistema de reportes y verificación (v2.0+)

#### Impacto en requisitos

- **RF-1.1 (Registro de usuario):** Agregar validación: "edad >= 13 años"
- **HU-01:** Agregar criterio: "Y tengo al menos 13 años de edad"
- **UI:** Agregar validación en formulario de registro
- **Términos de servicio:** Incluir cláusula de edad mínima (documento legal separado)

---

### AMB-10: Likes al cambiar visibilidad de publicación

#### Ambigüedad original
No se especificaba qué ocurre con los likes acumulados cuando una publicación pública se marca como privada.

#### Opciones consideradas
1. Mantener likes pero ocultarlos (conservar en Firestore, no mostrar hasta que vuelva a ser pública)
2. Borrar todos los likes al cambiar a privada
3. Mostrar likes solo al autor y admins mientras sea privada

#### ✅ Decisión final
**Mantener likes pero ocultarlos.**

Cuando una publicación cambia de visibilidad:

**Pública → Privada:**
- Los likes se **conservan** en Firestore (subcolección intacta)
- El contador `likesCount` se **mantiene** (no se resetea)
- Los likes **NO se muestran** en la UI pública (solo autor y admins pueden ver el contador)
- Los usuarios que dieron like NO ven la publicación en ningún listado

**Privada → Pública:**
- Los likes vuelven a ser visibles
- El contador refleja todos los likes históricos
- La publicación vuelve al feed con su contador intacto

#### Justificación

**Simplicidad técnica:**
- No requiere borrar y recrear likes al cambiar visibilidad
- Evita transacciones complejas
- Mantiene integridad referencial

**Reversibilidad:**
- El autor puede cambiar de opinión sin perder engagement
- Si publica algo, lo hace privado temporalmente, y luego lo vuelve público, mantiene su historial

**Coherencia con privacidad:**
- Una publicación privada no se muestra a terceros
- El contador tampoco debe mostrarse a terceros (sería filtración indirecta de información)
- Pero el autor y admins sí pueden ver sus propias métricas

**Comportamiento razonable:**
- Similar a "ocultar" una publicación temporalmente
- No penaliza al autor por ajustar visibilidad
- Permite experimentación sin pérdida de datos

#### Implementación

**Modelo de datos:**
- Los likes permanecen en la subcolección `/publicaciones/{id}/likes/{userId}`
- El campo `likesCount` no se modifica al cambiar visibilidad

**UI - Mostrar contador de likes:**
```typescript
// Post.tsx (pseudocódigo)
function Post({ publicacion, currentUser }) {
  const canSeeLikes = 
    publicacion.visibilidad === 'publica' || 
    publicacion.autorId === currentUser.uid ||
    currentUser.rol === 'admin';
  
  return (
    <div>
      <p>{publicacion.contenido}</p>
      {canSeeLikes && (
        <span>{publicacion.likesCount} me gusta</span>
      )}
      {/* Botón de like solo si es pública y no es propia */}
    </div>
  );
}
```

**Firestore Rules - Leer likes:**
```javascript
match /publicaciones/{publicacionId}/likes/{userId} {
  // Leer likes: solo si la publicación es pública, o eres autor, o eres admin
  allow read: if get(/databases/$(database)/documents/publicaciones/$(publicacionId)).data.visibilidad == 'publica'
              || request.auth.uid == get(/databases/$(database)/documents/publicaciones/$(publicacionId)).data.autorId
              || isAdmin();
}
```

**NO se ejecuta al cambiar visibilidad:**
```typescript
// postService.ts
async function updatePostVisibility(postId: string, nuevaVisibilidad: 'publica' | 'privada') {
  // Solo actualizar campo de visibilidad
  await updateDoc(doc(db, 'publicaciones', postId), {
    visibilidad: nuevaVisibilidad,
    fechaModificacion: serverTimestamp()
  });
  
  // NO borrar likes
  // NO resetear likesCount
}
```

#### Caso especial: Usuario dio like, publicación se vuelve privada, usuario intenta ver sus likes

- El usuario **no debe** ver la publicación en su lista de "publicaciones que me gustaron"
- Porque no tiene permiso de lectura sobre publicaciones privadas ajenas
- Es coherente con el modelo de permisos

#### Impacto en requisitos

- **RF-2.5 (Modificar publicación propia):** Aclarar que cambiar visibilidad NO afecta likes
- **RF-3.5 (Mostrar cantidad de "me gusta"):** Aclarar que solo se muestra si visibilidad == pública O eres autor/admin
- **UI:** Lógica condicional para mostrar/ocultar contador según permisos

---

## 5. Impacto en la especificación

### Resumen de cambios necesarios en spec.md

| Sección | Cambios |
|---|---|
| **RF-1.1** | Agregar validación: edad >= 13 años, correo válido (cualquier dominio) |
| **RF-1.3** | Especificar: solo username y contraseña editables |
| **RF-1.4** | Especificar: borrado en cascada de publicaciones |
| **RF-1.5** | Documentar: procedimiento manual de creación de admins |
| **RF-1.6** | Cambiar estado: incluir recuperación de contraseña en v1.0 |
| **RF-2.5** | Aclarar: cambiar visibilidad no afecta likes |
| **RF-2.7** | Agregar restricción: no borrar publicaciones de otros admins |
| **RF-3.1** | Agregar restricción: no dar like a publicaciones propias |
| **RF-3.3** | Confirmar: toggle de like permitido |
| **RF-3.5** | Aclarar: contador solo visible si pública o eres autor/admin |
| **RF-4.1** | Especificar: borrado en cascada, no borrar otros admins |
| **HU-01** | Agregar criterio: edad >= 13 años |
| **HU-06** | Agregar criterio: no like a publicaciones propias, toggle permitido |
| **HU-08, HU-10** | Actualizar: borrado en cascada confirmado |
| **HU-12** | Actualizar: solo username y contraseña editables |
| **Nueva HU** | Agregar: recuperación de contraseña (prioridad Media) |
| **Modelo de datos** | Sin cambios estructurales |
| **Firestore Rules** | Actualizar con validaciones de edad, protección entre admins |

---

## 6. Actualizaciones al modelo de datos

### Colección: `usuarios`

**Sin cambios estructurales.**

Campo `fechaNacimiento` se valida para edad >= 13 en registro.

---

### Colección: `publicaciones`

**Sin cambios estructurales.**

Comportamiento aclarado:
- Likes se mantienen al cambiar visibilidad
- Borrado en cascada al borrar usuario autor

---

### Colección/Subcolección: `likes`

**Sin cambios estructurales.**

Comportamiento aclarado:
- Toggle permitido (crear/borrar like)
- No se borran al cambiar visibilidad de publicación
- Se borran al borrar la publicación

---

## 7. Actualizaciones a requisitos funcionales

### RF-1.1: Registro de usuario - ACTUALIZADO

**Validaciones (actualizadas):**
- Username único (no puede haber dos usuarios con el mismo username)
- Formato de correo válido (**cualquier dominio**, no solo Gmail)
- Contraseña cumple requisitos mínimos de Firebase (mínimo 6 caracteres)
- Fecha de nacimiento es válida
- **NUEVO:** Edad >= 13 años (calculada a partir de fecha de nacimiento)

**Mensaje de error si edad < 13:**
```
"Debes tener al menos 13 años para crear una cuenta en Yumeideas."
```

---

### RF-1.3: Modificar perfil - ACTUALIZADO

**Datos modificables (aclarado):**
- ✅ **Username** (con validación de unicidad)
- ✅ **Contraseña** (con re-autenticación recomendada)
- ❌ **Correo electrónico** (NO editable post-registro)
- ❌ **Fecha de nacimiento** (NO editable post-registro)

**Justificación:** Correo y fecha de nacimiento son datos de identidad que deben permanecer estables.

---

### RF-1.4: Eliminar cuenta propia - ACTUALIZADO

**Comportamiento (aclarado):**
- Usuario eliminado de Firebase Authentication
- Documento de usuario eliminado de Firestore
- **Borrado en cascada:**
  1. Todas las publicaciones del usuario se borran
  2. Todos los likes en las publicaciones del usuario se borran (subcolección)
  3. *(Simplificación aceptada)* Los likes dados por el usuario en publicaciones ajenas pueden quedar huérfanos (por performance)

---

### RF-1.5: Gestión de roles - ACTUALIZADO

**Asignación de rol admin (aclarado):**

**v1.0:**
- Nuevos usuarios: rol `usuario` por defecto (sin cambios)
- Primer admin: creación **manual** en Firestore Console
- Admins adicionales: creación **manual** en Firestore Console

**Procedimiento manual:**
1. Usuario se registra normalmente
2. Admin técnico accede a Firebase Console → Firestore
3. Edita documento en `/usuarios/{userId}`
4. Cambia campo `rol` de `'usuario'` a `'admin'`
5. Usuario cierra sesión y vuelve a iniciar sesión

**Versiones futuras (v2.0+):**
- Panel de administración en UI para que admin existente promueva a otros usuarios

---

### RF-1.6: Recuperación de contraseña - ACTUALIZADO

**Estado:** ✅ **Incluido en v1.0**

**Implementación:**
- Usar Firebase Auth `sendPasswordResetEmail(email)`
- Link "Olvidé mi contraseña" en página de login
- Formulario simple con campo de email
- Email automático enviado por Firebase con link de reset

**Nueva Historia de Usuario:**
- **HU-13:** "Como usuario, quiero recuperar mi contraseña si la olvido para poder volver a acceder a mi cuenta" (Prioridad: Media)

---

### RF-2.5: Modificar publicación propia - ACTUALIZADO

**Datos modificables:**
- Contenido
- Visibilidad (pública ↔ privada)

**Comportamiento al cambiar visibilidad (aclarado):**
- Los likes existentes se **mantienen** (no se borran)
- El contador `likesCount` se **mantiene** (no se resetea)
- Si se cambia a privada, los likes dejan de ser visibles públicamente (solo autor y admins los ven)
- Si se cambia de vuelta a pública, los likes vuelven a ser visibles

---

### RF-2.7: Borrar publicación ajena (administrador) - ACTUALIZADO

**Alcance (aclarado):**
- Un admin puede borrar publicaciones de **usuarios normales**
- Un admin **NO puede** borrar publicaciones de **otros administradores**

**Validación:**
- Firestore Rules: rechazar delete si `autorId` es un usuario con `rol == 'admin'` (excepto si es el propio admin)

---

### RF-3.1: Dar "me gusta" a publicación pública - ACTUALIZADO

**Restricciones (aclaradas):**
- Solo en publicaciones públicas (sin cambios)
- ❌ **NUEVO:** El autor **NO puede** darse like a su propia publicación
- Un usuario solo puede dar like una vez a la misma publicación (sin cambios)

**Implementación:**
- UI: ocultar/deshabilitar botón de like en publicaciones propias
- Firestore Rules: rechazar create de like si `request.auth.uid == publicacion.autorId`

---

### RF-3.3: Quitar "me gusta" (toggle) - ACTUALIZADO

**Estado:** ✅ **Confirmado** (anteriormente "se asume")

**Comportamiento:**
- Un usuario puede dar like a una publicación
- Si presiona el botón nuevamente, el like se **quita** (toggle)
- Puede volver a dar like cuantas veces quiera (comportamiento estándar de redes sociales)

---

### RF-3.5: Mostrar cantidad de "me gusta" - ACTUALIZADO

**Visibilidad del contador (aclarada):**

El contador de likes se muestra **solo si**:
- La publicación es **pública**, O
- El usuario actual es el **autor** de la publicación, O
- El usuario actual es **administrador**

**Implementación:**
```typescript
const canSeeLikes = 
  publicacion.visibilidad === 'publica' || 
  publicacion.autorId === currentUser.uid ||
  currentUser.rol === 'admin';
```

---

### RF-4.1: Borrar cuenta de usuario (administrador) - ACTUALIZADO

**Alcance (aclarado):**
- Un admin puede borrar cuentas de **usuarios normales**
- Un admin **NO puede** borrar cuentas de **otros administradores**

**Comportamiento (aclarado):**
- Borrado en cascada (igual que RF-1.4):
  1. Usuario eliminado de Firebase Auth y Firestore
  2. Todas las publicaciones del usuario se borran
  3. Todos los likes en las publicaciones del usuario se borran

**Caso especial - Remover a un admin:**
- Requiere intervención manual (editar Firestore Console)
- O implementar rol `super-admin` en versiones futuras

---

## 8. Próximos pasos

### Estado del proyecto

✅ **Especificación completa:** [spec.md](./spec.md)  
✅ **Aclaraciones completas:** [clarify.md](./clarify.md) (este documento)  

### Siguiente fase: Checklist

Crear documento `checklist.md` para:
1. Validar conformidad con la constitución del proyecto
2. Verificar que todos los requisitos no funcionales sean testeables
3. Confirmar que no quedan ambigüedades sin resolver
4. Verificar coherencia entre requisitos funcionales y no funcionales
5. Validar que el modelo de datos soporta todos los requisitos

### Luego: Planificación

Crear documento `plan.md` para:
1. Definir sprints (ej: Sprint 1, Sprint 2, Sprint 3)
2. Priorizar historias de usuario por sprint
3. Estimar esfuerzo de cada HU
4. Definir dependencias entre HU
5. Establecer criterios de "Done" por sprint

### Finalmente: Tareas

Crear documento `tasks.md` para:
1. Desglosar cada HU en tareas técnicas implementables
2. Asignar tareas a sprints
3. Definir criterios de aceptación técnicos
4. Crear checklists de implementación

### Inicio de implementación

Solo después de validar todos los documentos anteriores se puede iniciar la implementación de código.

---

## Conclusión

Este documento ha resuelto las **10 ambigüedades críticas** identificadas en la especificación inicial. Todas las decisiones están **justificadas**, **documentadas** y **listas para implementación**.

**Decisiones clave:**
1. ✅ Solo username y contraseña editables (correo y fecha fijos)
2. ✅ Borrado en cascada de publicaciones al eliminar cuenta
3. ✅ Creación manual de admins en Firestore Console (v1.0)
4. ✅ Recuperación de contraseña incluida en v1.0
5. ✅ Prohibir like al propio post
6. ✅ Permitir toggle de like (dar/quitar)
7. ✅ Protección entre administradores (no pueden borrarse entre sí)
8. ✅ Aceptar cualquier correo válido (no solo Gmail)
9. ✅ Edad mínima 13 años (cumplimiento COPPA)
10. ✅ Mantener likes al cambiar visibilidad (pero ocultarlos si es privada)

**El proyecto Yumeideas está listo para avanzar a la fase de Checklist.**

---

**Fecha de creación:** 7 de julio de 2026  
**Versión:** 1.0  
**Estado:** Aprobado  
**Autor:** Equipo Yumeideas  
**Firma de aprobación:** [Product Owner / Tech Lead]
