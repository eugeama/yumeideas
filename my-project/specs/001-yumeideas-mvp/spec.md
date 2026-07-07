# Especificación de Yumeideas

**Proyecto:** Yumeideas (nombre provisorio)  
**Tipo:** Aplicación web tipo red social simplificada  
**Fecha:** 7 de julio de 2026  
**Versión:** 1.0  
**Estado:** Borrador - Pendiente de aclaración de ambigüedades

---

## Tabla de Contenidos

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Objetivo del proyecto](#objetivo-del-proyecto)
3. [Actores del sistema](#actores-del-sistema)
4. [Requisitos funcionales](#requisitos-funcionales)
5. [Requisitos no funcionales](#requisitos-no-funcionales)
6. [Historias de usuario](#historias-de-usuario)
7. [Criterios de aceptación](#criterios-de-aceptación)
8. [Casos borde y escenarios especiales](#casos-borde-y-escenarios-especiales)
9. [Ambigüedades identificadas](#ambigüedades-identificadas)
10. [Modelo de datos](#modelo-de-datos)
11. [Arquitectura del sistema](#arquitectura-del-sistema)
12. [Flujos de trabajo principales](#flujos-de-trabajo-principales)
13. [Restricciones técnicas](#restricciones-técnicas)

---

## 1. Resumen ejecutivo

**Yumeideas** es una aplicación web tipo red social simplificada donde los usuarios pueden publicar ideas o pensamientos cortos en formato texto, controlar la visibilidad de sus publicaciones (públicas o privadas), y recibir "me gusta" de otros usuarios en las publicaciones públicas.

El sistema diferencia dos tipos de usuarios:
- **Usuarios normales**: pueden gestionar su propio contenido y perfil
- **Administradores**: pueden moderar contenido eliminando publicaciones y cuentas de otros usuarios

El enfoque del proyecto es la **simplicidad**: sin chat, sin reposteos, sin comentarios, sin notificaciones push. La aplicación se desarrolla con **React** (frontend) y **Firebase** como backend as a service (Authentication, Firestore, Hosting únicamente).

---

## 2. Objetivo del proyecto

Permitir que los usuarios:
1. Se registren con datos mínimos
2. Publiquen contenido de texto
3. Decidan la visibilidad de cada publicación (pública o privada)
4. Interactúen con publicaciones públicas mediante "me gusta"
5. Gestionen su propio contenido y perfil

Permitir que los administradores:
1. Moderen el contenido borrando publicaciones inapropiadas
2. Gestionen usuarios eliminando cuentas
3. **NO modifiquen** contenido ajeno

Garantizar:
- Privacidad de las publicaciones privadas mediante reglas de seguridad en servidor
- Simplicidad de uso y claridad en la interfaz
- Arquitectura escalable y mantenible

---

## 3. Actores del sistema

### 3.1. Usuario (rol: `usuario`)

**Descripción:** Usuario registrado con permisos estándar.

**Capacidades:**
- Registrarse e iniciar sesión
- Gestionar su perfil (username, contraseña, correo, fecha de nacimiento)
- Crear publicaciones de texto
- Marcar sus publicaciones como públicas o privadas
- Modificar el contenido y visibilidad de sus propias publicaciones
- Borrar sus propias publicaciones
- Ver el feed de publicaciones públicas de todos los usuarios
- Ver sus propias publicaciones (públicas y privadas)
- Dar "me gusta" a publicaciones públicas de otros usuarios
- Quitar su "me gusta" (toggle)
- Borrar su propia cuenta

**Restricciones:**
- NO puede ver publicaciones privadas de otros usuarios
- NO puede modificar ni borrar publicaciones de otros usuarios
- NO puede modificar ni borrar cuentas de otros usuarios
- NO puede dar "me gusta" a publicaciones privadas ajenas

---

### 3.2. Administrador (rol: `admin`)

**Descripción:** Usuario con permisos de moderación y gestión.

**Capacidades:**
- Todas las capacidades del usuario normal sobre su propio contenido
- Ver publicaciones privadas de cualquier usuario
- Borrar publicaciones de cualquier usuario (públicas o privadas)
- Borrar cuentas de cualquier usuario

**Restricciones:**
- NO puede modificar el contenido de publicaciones ajenas
- NO puede modificar la visibilidad de publicaciones ajenas
- NO puede modificar el perfil de otros usuarios (solo borrar cuentas)

---

### 3.3. Sistema (Firebase)

**Responsabilidades:**
- Validar datos de entrada
- Gestionar autenticación mediante Firebase Authentication
- Persistir datos en Firestore
- Aplicar reglas de autorización mediante Firestore Security Rules
- Aplicar reglas de visibilidad de publicaciones
- Servir la aplicación mediante Firebase Hosting
- Rechazar operaciones no autorizadas

---

## 4. Requisitos funcionales

### RF-1. Gestión de usuarios (autenticación y perfil)

#### RF-1.1. Registro de usuario (Sign Up)

**Descripción:** Permitir que un nuevo usuario se registre en la aplicación.

**Datos requeridos:**
- **Username** (nombre de usuario): string, único en el sistema
- **Correo electrónico**: string, formato válido (Gmail según descripción inicial)
- **Contraseña**: string, mínimo de seguridad según Firebase Auth
- **Fecha de nacimiento**: date

**Validaciones:**
- Username único (no puede haber dos usuarios con el mismo username)
- Formato de correo válido
- Contraseña cumple requisitos mínimos de Firebase (mínimo 6 caracteres)
- Fecha de nacimiento es válida (formato fecha)

**Resultado:**
- Usuario creado en Firebase Authentication
- Documento de usuario creado en Firestore con datos de perfil
- Rol asignado: `usuario` por defecto
- Sesión iniciada automáticamente

**Ambigüedades relacionadas:**
- **AMB-03**: ¿Cómo se crea el primer administrador?
- **AMB-08**: ¿Se restringe estrictamente a dominios @gmail.com?
- **AMB-09**: ¿Hay restricción de edad mínima?

---

#### RF-1.2. Inicio de sesión (Login)

**Descripción:** Permitir que un usuario registrado inicie sesión.

**Datos requeridos:**
- Correo electrónico o username
- Contraseña

**Validaciones:**
- Credenciales válidas según Firebase Authentication

**Resultado:**
- Sesión activa
- Acceso a la aplicación autenticada
- Token de autenticación generado

---

#### RF-1.3. Modificar perfil

**Descripción:** Permitir que un usuario modifique sus datos de perfil.

**Datos modificables:**
- Username
- Contraseña
- ¿Correo electrónico? → **AMB-01**
- ¿Fecha de nacimiento? → **AMB-01**

**Validaciones:**
- Username único (si se cambia)
- Formato de correo válido (si es modificable)
- Contraseña actual correcta antes de permitir cambio

**Restricciones:**
- Solo el propio usuario puede modificar su perfil
- Los administradores NO pueden modificar perfiles ajenos

**Ambigüedades relacionadas:**
- **AMB-01**: ¿Son editables correo y fecha de nacimiento post-registro?

---

#### RF-1.4. Eliminar cuenta propia

**Descripción:** Permitir que un usuario borre su propia cuenta.

**Comportamiento:**
- Usuario eliminado de Firebase Authentication
- Documento de usuario eliminado de Firestore
- ¿Publicaciones del usuario? → **AMB-02**

**Confirmación:**
- Requiere confirmación explícita (diálogo de confirmación)
- Puede requerir re-autenticación

**Ambigüedades relacionadas:**
- **AMB-02**: ¿Se borran las publicaciones en cascada o quedan huérfanas?

---

#### RF-1.5. Gestión de roles

**Descripción:** Cada usuario tiene asignado un rol que determina sus permisos.

**Roles:**
- `usuario` (por defecto)
- `admin`

**Almacenamiento:**
- Campo `rol` en el documento del usuario en Firestore

**Asignación:**
- Nuevos usuarios: rol `usuario` por defecto
- Promoción a `admin`: → **AMB-03**

**Validación:**
- Las Firestore Security Rules validan el rol antes de permitir operaciones privilegiadas

**Ambigüedades relacionadas:**
- **AMB-03**: ¿Cómo se asigna el rol admin? (manual en Firestore, usuario semilla, panel de gestión)

---

#### RF-1.6. Recuperación de contraseña

**Descripción:** Funcionalidad de recuperación de contraseña olvidada.

**Estado:** → **AMB-04**

**Implementación potencial:**
- Firebase Auth ofrece reset por email de forma nativa
- Envío de email con link de recuperación

**Ambigüedades relacionadas:**
- **AMB-04**: ¿Está en el alcance de esta versión?

---

### RF-2. Gestión de publicaciones ("ideas")

#### RF-2.1. Crear publicación

**Descripción:** Permitir que un usuario autenticado cree una nueva publicación.

**Datos requeridos:**
- **Contenido**: string, texto de la publicación
- **Visibilidad**: enum (`publica` | `privada`)

**Datos generados automáticamente:**
- **autorId**: referencia al UID del usuario autor (Firebase Auth UID)
- **fechaCreacion**: timestamp
- **fechaModificacion**: timestamp (igual a fechaCreacion al crear)
- **likes**: array vacío o colección separada (ver modelo de datos)

**Validaciones:**
- Usuario autenticado
- Contenido no vacío
- Longitud máxima del contenido (a definir: ¿280 caracteres tipo Twitter, 500, sin límite?)

**Resultado:**
- Documento de publicación creado en Firestore
- Publicación visible según su visibilidad

---

#### RF-2.2. Marcar visibilidad (pública/privada)

**Descripción:** Permitir que el usuario controle quién puede ver su publicación.

**Opciones:**
- **Pública**: visible para todos los usuarios autenticados
- **Privada**: visible solo para el autor y administradores

**Control de UI:**
- Switch, toggle o selector claro al crear/editar publicación

**Comportamiento:**
- El campo `visibilidad` determina la accesibilidad en consultas Firestore
- Las Firestore Rules refuerzan esta restricción

---

#### RF-2.3. Visualización de publicaciones públicas

**Descripción:** Cualquier usuario autenticado puede ver publicaciones marcadas como públicas.

**Alcance:**
- Feed general: todas las publicaciones públicas de todos los usuarios
- Ordenamiento: por fecha de creación (más reciente primero)
- Paginación: límite de publicaciones por carga (ej: 20)

**Información mostrada:**
- Contenido de la publicación
- Autor (username)
- Fecha de creación
- Cantidad de "me gusta"
- Indicador de si el usuario actual ya dio like

---

#### RF-2.4. Visualización de publicaciones privadas

**Descripción:** Las publicaciones privadas tienen acceso restringido.

**Quién puede verlas:**
- El autor de la publicación
- Los administradores

**Quién NO puede verlas:**
- Usuarios normales que no sean el autor

**Protección:**
- Filtros en consultas Firestore (where visibilidad == 'publica' OR autorId == currentUser)
- Firestore Security Rules que rechazan lectura no autorizada
- UI que no muestra publicaciones privadas ajenas

---

#### RF-2.5. Modificar publicación propia

**Descripción:** El autor puede editar el contenido y/o visibilidad de su publicación.

**Datos modificables:**
- Contenido
- Visibilidad (pública ↔ privada)

**Datos actualizados automáticamente:**
- fechaModificacion: timestamp actual

**Validaciones:**
- Solo el autor puede modificar (`auth.uid == publicacion.autorId`)
- Contenido no vacío

**Restricciones:**
- Los administradores NO pueden modificar publicaciones ajenas

**Ambigüedades relacionadas:**
- **AMB-10**: ¿Qué ocurre con los likes al cambiar de pública a privada?

---

#### RF-2.6. Borrar publicación propia

**Descripción:** El autor puede eliminar permanentemente su publicación.

**Comportamiento:**
- Documento de publicación eliminado de Firestore
- Likes asociados eliminados (si se almacenan en subcolección/documento separado)

**Confirmación:**
- Requiere confirmación explícita

**Validaciones:**
- Solo el autor puede borrar (`auth.uid == publicacion.autorId`)

---

#### RF-2.7. Borrar publicación ajena (administrador)

**Descripción:** Un administrador puede eliminar cualquier publicación (moderación).

**Alcance:**
- Publicaciones públicas
- Publicaciones privadas (dado que puede verlas)

**Confirmación:**
- Requiere confirmación explícita

**Validaciones:**
- Solo administradores (`user.rol == 'admin'`)

---

#### RF-2.8. Restricción: administrador NO puede modificar publicaciones ajenas

**Descripción:** Aunque un administrador puede ver y borrar publicaciones ajenas, **no puede modificar** su contenido ni visibilidad.

**Razón:**
- Preservar integridad y autoría del contenido
- Evitar manipulación de ideas ajenas

**Validación:**
- Firestore Rules rechazan update de publicaciones donde `auth.uid != autorId`, incluso si es admin

---

#### RF-2.9. Estructura de datos de publicación

**Campos mínimos obligatorios:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único generado por Firestore |
| `contenido` | string | Texto de la publicación |
| `autorId` | string | UID del usuario autor (Firebase Auth) |
| `visibilidad` | enum | `'publica'` o `'privada'` |
| `fechaCreacion` | timestamp | Fecha y hora de creación |
| `fechaModificacion` | timestamp | Fecha y hora de última modificación |

**Campos opcionales/relacionados:**
- `likesCount` (number): contador de likes (desnormalizado para performance)
- Subcolección `likes` o colección separada para relación usuario-publicación-like

---

### RF-3. Interacción: "me gusta"

#### RF-3.1. Dar "me gusta" a publicación pública

**Descripción:** Cualquier usuario autenticado puede dar "me gusta" a una publicación pública.

**Restricciones:**
- Solo en publicaciones públicas
- ¿El autor puede darse like a sí mismo? → **AMB-05**
- Un usuario solo puede dar like una vez a la misma publicación

**Comportamiento:**
- Registro de like almacenado (relación usuario-publicación)
- Contador de likes incrementado
- Indicador visual actualizado

**Ambigüedades relacionadas:**
- **AMB-05**: ¿Puede el autor darse like a sí mismo?

---

#### RF-3.2. Restricción: NO dar "me gusta" a publicaciones privadas ajenas

**Descripción:** Un usuario no puede dar like a publicaciones privadas que no son suyas.

**Razón:**
- No puede ver publicaciones privadas ajenas (RF-2.4)
- La UI no muestra estas publicaciones
- Las Firestore Rules rechazan la operación

---

#### RF-3.3. Quitar "me gusta" (toggle)

**Descripción:** Un usuario puede revertir su "me gusta" previamente dado.

**Comportamiento:**
- Registro de like eliminado
- Contador de likes decrementado
- Indicador visual actualizado

**Ambigüedades relacionadas:**
- **AMB-06**: Se asume comportamiento toggle estándar

---

#### RF-3.4. Exclusión de funcionalidades sociales

**Fuera de alcance (versión 1.0):**
- ❌ Comentarios en publicaciones
- ❌ Reposteos o shares
- ❌ Compartir en redes externas
- ❌ Menciones de usuarios
- ❌ Hashtags

---

#### RF-3.5. Mostrar cantidad de "me gusta"

**Descripción:** El sistema muestra el total de "me gusta" de cada publicación pública.

**Información mostrada:**
- Número total de likes
- Indicador si el usuario actual ya dio like (para mostrar botón activo/inactivo)

---

### RF-4. Administración de usuarios (rol admin)

#### RF-4.1. Borrar cuenta de usuario (administrador)

**Descripción:** Un administrador puede eliminar la cuenta de cualquier usuario.

**Comportamiento:**
- Usuario eliminado de Firebase Authentication
- Documento de usuario eliminado de Firestore
- ¿Publicaciones del usuario? → **AMB-02**
- Sesiones activas del usuario invalidadas

**Confirmación:**
- Requiere confirmación explícita
- Idealmente, mostrar advertencia sobre consecuencias

**Validaciones:**
- Solo administradores (`user.rol == 'admin'`)

**Ambigüedades relacionadas:**
- **AMB-02**: ¿Borrado en cascada de publicaciones?
- **AMB-07**: ¿Un admin puede borrar la cuenta de otro admin?

---

#### RF-4.2. Restricción: administrador NO puede modificar perfiles ajenos

**Descripción:** Un administrador puede borrar cuentas, pero NO puede modificar los datos de perfil de otros usuarios.

**Razón:**
- Separación clara entre moderación (eliminar) y gestión de datos personales
- Privacidad del usuario

**Validación:**
- Firestore Rules rechazan update de documentos de usuario donde `auth.uid != userId`, incluso si es admin

**Ambigüedades relacionadas:**
- **AMB-07**: ¿Aplica esta restricción entre administradores?

---

#### RF-4.3. Capacidades del administrador sobre su propio contenido

**Descripción:** Un administrador tiene los mismos permisos que un usuario normal sobre su propio contenido y cuenta.

**Puede:**
- Crear, modificar, borrar sus propias publicaciones
- Modificar su propio perfil
- Borrar su propia cuenta

---

### RF-5. Visualización / feed

#### RF-5.1. Feed de publicaciones públicas

**Descripción:** Listado principal que muestra todas las publicaciones públicas de todos los usuarios.

**Características:**
- Ordenamiento: por fecha de creación descendente (más recientes primero)
- Paginación: cargar 20 publicaciones inicialmente, scroll infinito o "cargar más"
- Filtro: solo visibilidad == 'publica'
- Información mostrada por publicación:
  - Contenido
  - Autor (username)
  - Fecha de creación
  - Cantidad de likes
  - Botón de like/unlike

**Consulta Firestore:**
```javascript
// Pseudocódigo
query(
  collection(db, 'publicaciones'),
  where('visibilidad', '==', 'publica'),
  orderBy('fechaCreacion', 'desc'),
  limit(20)
)
```

---

#### RF-5.2. Vista de publicaciones propias

**Descripción:** El usuario puede ver todas sus propias publicaciones (públicas y privadas).

**Ubicación:**
- Sección "Mi Perfil" o "Mis Publicaciones"

**Características:**
- Muestra publicaciones públicas Y privadas del usuario
- Ordenamiento: por fecha de creación descendente
- Indicador visual de visibilidad (ícono de candado para privadas)
- Opciones de editar/borrar cada publicación

**Consulta Firestore:**
```javascript
// Pseudocódigo
query(
  collection(db, 'publicaciones'),
  where('autorId', '==', currentUser.uid),
  orderBy('fechaCreacion', 'desc')
)
```

---

#### RF-5.3. Vista de administrador: todas las publicaciones

**Descripción:** Un administrador puede ver publicaciones privadas de cualquier usuario para fines de moderación.

**Implementación:**
- Panel de administración separado
- Listado de todas las publicaciones (públicas + privadas)
- Filtros por usuario, visibilidad, fecha
- Opción de borrar publicaciones

**Consulta Firestore:**
```javascript
// Pseudocódigo - requiere reglas que permitan a admins leer todas
query(
  collection(db, 'publicaciones'),
  orderBy('fechaCreacion', 'desc'),
  limit(50)
)
// Validado en Security Rules: request.auth.token.rol == 'admin'
```

---

## 5. Requisitos no funcionales

### RNF-1. Usabilidad

#### RNF-1.1. Simplicidad de interfaz

**Criterio:**
- La interfaz debe ser simple, clara y accesible
- Publicar, marcar como privado/público y dar like deben ser acciones de un solo paso o casi inmediatas

**Métricas:**
- Publicar una idea: máximo 2 clics (abrir formulario, publicar)
- Cambiar visibilidad: 1 clic (toggle)
- Dar like: 1 clic

---

#### RNF-1.2. Diseño responsive

**Criterio:**
- La aplicación debe ser usable en dispositivos móviles y de escritorio
- Diseño adaptable (responsive design)

**Implementación:**
- CSS con media queries o framework CSS (Material-UI, Tailwind, etc.)
- Pruebas en diferentes tamaños de pantalla (mobile, tablet, desktop)

---

#### RNF-1.3. Feedback del usuario

**Criterio:**
- Feedback inmediato para todas las acciones:
  - Estados de carga (spinners, skeletons)
  - Mensajes de éxito (toast, snackbar)
  - Mensajes de error claros y accionables

**Ejemplos:**
- "Publicación creada exitosamente"
- "Error: el nombre de usuario ya está en uso"
- "¿Estás seguro de que quieres borrar esta publicación? Esta acción no se puede deshacer."

---

### RNF-2. Performance

#### RNF-2.1. Optimización de consultas Firestore

**Criterio:**
- La carga del feed de publicaciones públicas NO debe traer toda la colección de Firestore y filtrar en memoria del lado del cliente
- Usar `where()` sobre el campo de visibilidad
- Implementar paginación con `limit()` y cursores (startAfter)

**Métricas:**
- Carga inicial del feed: < 2 segundos en condiciones normales
- Consultas Firestore: máximo 20-50 documentos por query

---

#### RNF-2.2. Tiempo de respuesta

**Criterio:**
- Las operaciones de lectura/escritura deben responder en tiempo razonable

**Métricas objetivo:**
- Lectura (feed): < 2 segundos
- Escritura (publicar, like): < 1 segundo
- Autenticación (login): < 2 segundos

---

#### RNF-2.3. Desnormalización estratégica

**Criterio:**
- Para evitar consultas múltiples, ciertos datos pueden desnormalizarse:
  - `likesCount` en el documento de publicación (en lugar de contar subcolección)
  - `autorUsername` en el documento de publicación (en lugar de join con usuario)

**Trade-off:**
- Mayor rapidez de lectura vs. mayor complejidad de escritura (mantener consistencia)

---

### RNF-3. Seguridad y privacidad

#### RNF-3.1. Autenticación exclusiva con Firebase

**Criterio:**
- La autenticación se realiza exclusivamente mediante Firebase Authentication
- NO se implementa autenticación custom ni se almacenan contraseñas manualmente

---

#### RNF-3.2. Protección de publicaciones privadas

**Criterio:**
- Las publicaciones privadas deben estar protegidas **tanto en UI como en Firestore Security Rules**
- Ni siquiera una consulta directa a Firestore desde la consola del navegador puede exponer publicaciones privadas a usuarios no autorizados

**Implementación:**
- Firestore Rules que validen `visibilidad` y `autorId` antes de permitir lectura
- Ejemplo de regla:
  ```javascript
  // Pseudocódigo de Firestore Rules
  match /publicaciones/{publicacionId} {
    allow read: if resource.data.visibilidad == 'publica' 
                || request.auth.uid == resource.data.autorId
                || get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
  }
  ```

---

#### RNF-3.3. Gestión de contraseñas

**Criterio:**
- Las contraseñas NUNCA se gestionan ni almacenan manualmente
- 100% delegado en Firebase Authentication
- Hashing, salting y validación gestionados por Firebase

---

#### RNF-3.4. Validación de roles en servidor

**Criterio:**
- Las reglas de Firestore deben validar el rol (`usuario`/`admin`) antes de permitir operaciones privilegiadas
- NO confiar solo en validaciones del cliente

**Ejemplo:**
- Borrar publicación ajena: validar `request.auth.token.rol == 'admin'` en Firestore Rules
- Borrar cuenta ajena: validar rol de admin antes de permitir delete

---

### RNF-4. Tecnología (según constitución)

#### RNF-4.1. Stack tecnológico obligatorio

**Frontend:**
- React (versión 18+)
- TypeScript o JavaScript (a definir en arquitectura)

**Backend as a Service:**
- Firebase, utilizando **exclusivamente**:
  - Firebase Authentication
  - Cloud Firestore
  - Firebase Hosting

**Prohibido:**
- ❌ Cloud Functions
- ❌ Firebase Storage
- ❌ Realtime Database
- ❌ Firebase Analytics
- ❌ Cloud Messaging (FCM)
- ❌ Remote Config
- ❌ Cualquier otro servicio de Firebase
- ❌ Cualquier backend custom (Node/Express, Java, Python, etc.)

---

#### RNF-4.2. Lógica de negocio

**Criterio:**
- Toda lógica de negocio debe resolverse en el cliente (React) y reforzarse con Firestore Security Rules
- NO existe backend propio con lógica de servidor

**Separación de responsabilidades:**
- Modelos/dominio: clases `Usuario`, `Publicacion`, etc.
- Servicios: módulos que encapsulan llamadas a Firebase
- Infraestructura: configuración de Firebase
- Presentación: componentes React

---

### RNF-5. Calidad

#### RNF-5.1. Modelado claro

**Criterio:**
- Las reglas de negocio (quién puede editar/borrar qué) deben modelarse como entidades/servicios claros en el frontend
- NO como lógica dispersa en componentes visuales

**Estructura sugerida:**
```
src/
  domain/
    models/
      Usuario.ts
      Publicacion.ts
    enums/
      UserRole.ts
      PostVisibility.ts
  services/
    authService.ts
    postService.ts
    userService.ts
  infrastructure/
    firebaseConfig.ts
  ui/
    components/
    pages/
```

---

#### RNF-5.2. Testing de reglas de autorización

**Criterio:**
- Toda regla de autorización importante debe tener un test asociado

**Casos de test obligatorios:**
- ✅ Un post privado solo es visible por su autor y por un admin
- ✅ Un usuario normal NO puede borrar posts ajenos
- ✅ Un usuario normal NO puede borrar cuentas ajenas
- ✅ Un admin SÍ puede borrar posts de otros
- ✅ Un admin SÍ puede borrar cuentas de otros
- ✅ Un admin NO puede modificar posts ajenos

**Herramientas:**
- Jest + React Testing Library (tests de componentes)
- Firebase Emulators + @firebase/rules-unit-testing (tests de Firestore Rules)

---

#### RNF-5.3. Código mantenible

**Criterio:**
- Código legible y bien documentado
- Componentes pequeños y cohesivos (máx. 200-300 líneas)
- Funciones pequeñas (máx. 50 líneas)
- Sin duplicación de lógica

---

## 6. Historias de usuario

### Prioridades

| Prioridad | Criterio |
|-----------|----------|
| **Alta** | Funcionalidad core sin la cual la app no es usable |
| **Media** | Funcionalidad importante pero no bloqueante |
| **Baja** | Funcionalidad nice-to-have, mejora de UX |

---

### HU-01: Registro de usuario

**Como** usuario nuevo  
**Quiero** registrarme con username, correo, contraseña y fecha de nacimiento  
**Para** poder usar la app

**Prioridad:** Alta

**Criterios de aceptación:**
- Dado que soy un usuario nuevo
- Cuando completo el formulario de registro con datos válidos
- Entonces mi cuenta es creada exitosamente
- Y se me asigna el rol `usuario` por defecto
- Y mi sesión se inicia automáticamente

**Validaciones:**
- Username único
- Correo con formato válido
- Contraseña mínimo 6 caracteres
- Fecha de nacimiento válida

---

### HU-02: Inicio de sesión

**Como** usuario registrado  
**Quiero** iniciar sesión  
**Para** acceder a mi cuenta

**Prioridad:** Alta

**Criterios de aceptación:**
- Dado que tengo una cuenta creada
- Cuando ingreso mi correo/username y contraseña correctos
- Entonces accedo a la aplicación autenticada
- Y puedo ver el feed de publicaciones

**Validaciones:**
- Credenciales válidas

---

### HU-03: Publicar idea

**Como** usuario  
**Quiero** publicar una idea en texto  
**Para** compartir mis pensamientos

**Prioridad:** Alta

**Criterios de aceptación:**
- Dado que estoy autenticado
- Cuando escribo un texto y presiono "Publicar"
- Entonces mi publicación se crea con éxito
- Y aparece en mi lista de publicaciones
- Y (si es pública) aparece en el feed general

**Validaciones:**
- Contenido no vacío
- Usuario autenticado

---

### HU-04: Marcar publicación como privada/pública

**Como** usuario  
**Quiero** marcar mi publicación como privada o pública  
**Para** controlar quién la ve

**Prioridad:** Alta

**Criterios de aceptación:**
- Dado que estoy creando o editando una publicación
- Cuando activo/desactivo el switch de "Privada"
- Entonces la visibilidad de la publicación se actualiza
- Y si la marco como privada, solo yo y los admins pueden verla
- Y si la marco como pública, todos los usuarios pueden verla

**Validaciones:**
- Solo el autor puede cambiar la visibilidad

---

### HU-05: Ver feed de publicaciones públicas

**Como** usuario  
**Quiero** ver el feed de publicaciones públicas de otros usuarios  
**Para** explorar contenido

**Prioridad:** Alta

**Criterios de aceptación:**
- Dado que estoy autenticado
- Cuando accedo al feed principal
- Entonces veo las publicaciones públicas de todos los usuarios
- Ordenadas por fecha (más recientes primero)
- Con paginación (20 por carga)

---

### HU-06: Dar "me gusta"

**Como** usuario  
**Quiero** dar "me gusta" a una publicación pública  
**Para** mostrar mi interés

**Prioridad:** Media

**Criterios de aceptación:**
- Dado que veo una publicación pública
- Cuando presiono el botón de "me gusta"
- Entonces el contador de likes se incrementa
- Y el botón cambia a estado "activo"
- Y puedo presionar nuevamente para quitar mi like (toggle)

**Validaciones:**
- Solo publicaciones públicas
- Un like por usuario por publicación

---

### HU-07: Modificar/borrar publicación propia

**Como** usuario  
**Quiero** modificar o borrar mis propias publicaciones  
**Para** corregir o eliminar contenido

**Prioridad:** Alta

**Criterios de aceptación:**
- Dado que veo una de mis publicaciones
- Cuando selecciono "Editar"
- Entonces puedo modificar el contenido y/o visibilidad
- Y los cambios se guardan con nueva fecha de modificación

- Dado que veo una de mis publicaciones
- Cuando selecciono "Borrar" y confirmo
- Entonces la publicación se elimina permanentemente

**Validaciones:**
- Solo el autor puede editar/borrar

---

### HU-08: Borrar cuenta propia

**Como** usuario  
**Quiero** borrar mi propia cuenta  
**Para** dejar de usar la app

**Prioridad:** Media

**Criterios de aceptación:**
- Dado que estoy autenticado
- Cuando selecciono "Borrar mi cuenta" y confirmo
- Entonces mi cuenta es eliminada
- Y mi sesión se cierra
- Y no puedo volver a iniciar sesión con esas credenciales

---

### HU-09: Borrar publicación ajena (admin)

**Como** administrador  
**Quiero** borrar publicaciones de cualquier usuario  
**Para** moderar contenido inapropiado

**Prioridad:** Alta

**Criterios de aceptación:**
- Dado que soy administrador
- Cuando veo una publicación (pública o privada) de otro usuario
- Entonces puedo seleccionar "Borrar" y confirmar
- Y la publicación se elimina permanentemente

**Validaciones:**
- Solo administradores
- NO puedo modificar el contenido, solo borrar

---

### HU-10: Borrar cuenta de usuario (admin)

**Como** administrador  
**Quiero** borrar la cuenta de cualquier usuario  
**Para** gestionar la plataforma

**Prioridad:** Alta

**Criterios de aceptación:**
- Dado que soy administrador
- Cuando selecciono "Borrar cuenta" de un usuario y confirmo
- Entonces la cuenta del usuario es eliminada
- Y (dependiendo de AMB-02) sus publicaciones se borran o quedan huérfanas

**Validaciones:**
- Solo administradores

---

### HU-11: Ver publicaciones privadas (admin)

**Como** administrador  
**Quiero** ver publicaciones privadas de cualquier usuario  
**Para** poder moderarlas

**Prioridad:** Media

**Criterios de aceptación:**
- Dado que soy administrador
- Cuando accedo al panel de moderación
- Entonces veo todas las publicaciones (públicas y privadas)
- Con filtros por usuario, visibilidad, fecha

---

### HU-12: Modificar perfil

**Como** usuario  
**Quiero** modificar mi perfil  
**Para** mantener mis datos actualizados

**Prioridad:** Baja

**Criterios de aceptación:**
- Dado que estoy autenticado
- Cuando accedo a "Editar Perfil"
- Entonces puedo modificar username y contraseña
- Y (dependiendo de AMB-01) correo y fecha de nacimiento
- Y los cambios se guardan exitosamente

**Validaciones:**
- Username único
- Contraseña actual correcta antes de cambiar

---

## 7. Criterios de aceptación

### CA-1: Publicaciones privadas no visibles para usuarios normales

**Relacionado:** HU-04, RF-2.4

**Escenario:**
- Dado un usuario que crea una publicación y la marca como "privada"
- Cuando otro usuario (no admin) consulta el feed
- Entonces esa publicación NO aparece en el feed
- Y NO es accesible por lectura directa a Firestore (protegida por Security Rules)

**Validación técnica:**
- Consulta Firestore con filtro `where('visibilidad', '==', 'publica')`
- Firestore Rule rechaza lectura si `visibilidad == 'privada' && auth.uid != autorId && user.rol != 'admin'`

---

### CA-2: Like solo a publicaciones públicas

**Relacionado:** HU-06, RF-3.1, RF-3.2

**Escenario:**
- Dado un usuario que intenta dar like a una publicación privada ajena
- Entonces el sistema rechaza la acción
- Y no es posible ni siquiera vía consola (Firestore Rules)

**Validación técnica:**
- Firestore Rule rechaza escritura en likes si `publicacion.visibilidad == 'privada' && auth.uid != publicacion.autorId`

---

### CA-3: Solo el autor puede editar/borrar su publicación

**Relacionado:** HU-07, RF-2.5, RF-2.6

**Escenario:**
- Dado un usuario autor de una publicación
- Cuando la edita o borra
- Entonces el sistema permite la operación solo si `auth.uid == publicacion.autorId`

**Validación técnica:**
- Firestore Rule: `allow update, delete: if request.auth.uid == resource.data.autorId;`

---

### CA-4: Admin puede borrar, NO modificar publicaciones ajenas

**Relacionado:** HU-09, RF-2.7, RF-2.8

**Escenario:**
- Dado un admin que intenta editar una publicación ajena
- Entonces el sistema rechaza la operación

**Escenario:**
- Dado un admin que intenta borrar una publicación ajena
- Entonces el sistema permite la operación

**Validación técnica:**
- Firestore Rule update: rechaza si `auth.uid != autorId` (incluso para admins)
- Firestore Rule delete: permite si `user.rol == 'admin'` OR `auth.uid == autorId`

---

### CA-5: Admin puede borrar cuenta de usuario

**Relacionado:** HU-10, RF-4.1

**Escenario:**
- Dado un admin que borra la cuenta de un usuario
- Entonces el usuario es eliminado de Firebase Auth y Firestore
- Y (dependiendo de AMB-02) todas las publicaciones del usuario son eliminadas o quedan huérfanas

**Validación técnica:**
- Solo admins pueden ejecutar la función de borrar cuenta ajena
- Firestore Rule delete en colección usuarios: permite si `user.rol == 'admin'` OR `auth.uid == userId`

---

## 8. Casos borde y escenarios especiales

### CB-1: Cambio de visibilidad de publicación con likes

**Escenario:**
- Un usuario tiene una publicación pública con 50 likes
- El usuario la cambia a privada
- ¿Qué ocurre con los likes existentes?

**Ambigüedad:** AMB-10

**Posibles soluciones:**
1. **Mantener likes pero ocultarlos:** Los likes se conservan en Firestore pero no se muestran hasta que vuelva a ser pública
2. **Borrar todos los likes:** Al cambiar a privada, se eliminan los likes (más complejo)
3. **Mostrar likes solo al autor y admins:** Los likes se mantienen y el autor puede verlos

**Recomendación:** Opción 1 (mantener pero ocultar) por simplicidad

---

### CB-2: Borrado de cuenta con publicaciones con likes

**Escenario:**
- Un admin borra la cuenta de un usuario que tiene publicaciones con likes de terceros
- ¿Se borran las publicaciones o quedan con autor "usuario eliminado"?

**Ambigüedad:** AMB-02

**Posibles soluciones:**
1. **Borrado en cascada:** Borrar usuario + todas sus publicaciones + todos los likes en esas publicaciones
2. **Anonimización:** Mantener publicaciones pero con `autorId = null` o `autor = "Usuario eliminado"`
3. **Transferencia:** Transferir publicaciones a una cuenta especial de "contenido huérfano"

**Recomendación:** Opción 1 (borrado en cascada) por coherencia con privacidad y simplicidad

---

### CB-3: Jerarquía entre administradores

**Escenario:**
- Existen dos usuarios con rol `admin`
- ¿Puede el Admin A borrar la cuenta del Admin B?
- ¿Puede el Admin A borrar publicaciones del Admin B?

**Ambigüedad:** AMB-07

**Posibles soluciones:**
1. **Admins son iguales:** Cualquier admin puede borrar cuentas/publicaciones de otros admins
2. **Protección entre admins:** Un admin NO puede borrar cuentas ni publicaciones de otros admins
3. **Super-admin:** Existe un rol superior que sí puede gestionar a los admins normales

**Recomendación:** Opción 2 (protección entre admins) por seguridad

---

### CB-4: Registro con correo no Gmail

**Escenario:**
- Un usuario intenta registrarse con `usuario@outlook.com`
- ¿El sistema acepta cualquier correo válido o solo @gmail.com?

**Ambigüedad:** AMB-08

**Posibles soluciones:**
1. **Solo Gmail:** Validar dominio `@gmail.com` estrictamente
2. **Cualquier correo:** Aceptar cualquier formato de correo válido

**Recomendación:** Opción 2 (cualquier correo) por flexibilidad, salvo requisito específico del negocio

---

### CB-5: Usuario menor de edad

**Escenario:**
- Un usuario se registra con fecha de nacimiento que indica 12 años
- ¿El sistema permite el registro?

**Ambigüedad:** AMB-09

**Posibles soluciones:**
1. **Sin restricción:** Permitir cualquier edad (solo guardar el dato)
2. **Edad mínima:** Rechazar registro si edad < 13 años (por ejemplo, según COPPA en EE.UU.)
3. **Edad mínima con consentimiento:** Solicitar consentimiento de tutor si edad < 18 años

**Recomendación:** Opción 2 (edad mínima 13 años) por cumplimiento de estándares internacionales

---

### CB-6: Sesión activa tras borrado de cuenta

**Escenario:**
- Un usuario borra su cuenta mientras tiene sesión activa en otro dispositivo
- ¿Qué ocurre con esa sesión?

**Comportamiento esperado:**
- Firebase Auth invalida automáticamente el token al borrar la cuenta
- El usuario es desconectado y redirigido a login en el próximo request

---

### CB-7: Like al propio post

**Escenario:**
- Un usuario intenta dar like a su propia publicación

**Ambigüedad:** AMB-05

**Posibles soluciones:**
1. **Permitir:** El autor puede darse like a sí mismo
2. **Prohibir:** El botón de like está deshabilitado en publicaciones propias

**Recomendación:** Opción 2 (prohibir) por convención de redes sociales

---

### CB-8: Toggle de like (quitar "me gusta")

**Escenario:**
- Un usuario ya dio like a una publicación
- Presiona nuevamente el botón de like

**Ambigüedad:** AMB-06

**Comportamiento esperado (asumido):**
- El like se quita (toggle)
- Contador de likes decrementa
- Botón vuelve a estado "inactivo"

---

## 9. Ambigüedades identificadas

### AMB-01: Edición de correo y fecha de nacimiento post-registro

**Descripción:** No se especifica si el correo electrónico y la fecha de nacimiento son editables después del registro.

**Impacto:** RF-1.3, HU-12

**Opciones:**
1. **Solo username y contraseña editables:** Correo y fecha quedan fijos tras registro
2. **Todos los campos editables:** Incluir correo (con re-autenticación) y fecha de nacimiento

**Requiere aclaración de:** Product Owner

**Recomendación provisional:** Permitir editar correo (con re-autenticación) pero NO fecha de nacimiento (dato de identidad fijo)

---

### AMB-02: Borrado de publicaciones al eliminar cuenta

**Descripción:** No se especifica si al borrar una cuenta de usuario se deben borrar también todas sus publicaciones, o si deben quedar huérfanas/anonimizadas.

**Impacto:** RF-1.4, RF-4.1, HU-08, HU-10, CB-2

**Opciones:**
1. **Borrado en cascada:** Borrar usuario + todas sus publicaciones + likes asociados
2. **Anonimización:** Mantener publicaciones con `autorId = null` o "Usuario eliminado"
3. **Prohibir borrado si tiene publicaciones:** Forzar a borrar publicaciones primero

**Requiere aclaración de:** Product Owner, consideraciones legales (GDPR "derecho al olvido")

**Recomendación provisional:** Opción 1 (borrado en cascada) por simplicidad y privacidad

---

### AMB-03: Mecanismo de creación/asignación del rol admin

**Descripción:** No se especifica cómo se crea el primer administrador ni cómo se asigna el rol admin a usuarios.

**Impacto:** RF-1.5, arquitectura de seguridad

**Opciones:**
1. **Manual en Firestore:** El primer admin se crea directamente editando Firestore desde la consola
2. **Usuario semilla:** Script de inicialización que crea un admin con credenciales predefinidas
3. **Panel de gestión:** Un admin existente puede promover a otros usuarios (requiere UI adicional)
4. **Custom claims de Firebase:** Usar Firebase Admin SDK (requiere Cloud Functions, NO permitido por restricción)

**Requiere aclaración de:** Product Owner, arquitecto técnico

**Recomendación provisional:** Opción 1 (manual) para primera versión, luego evolucionar a opción 3 (panel de gestión)

---

### AMB-04: Recuperación de contraseña en alcance

**Descripción:** No se especifica si la funcionalidad de recuperación de contraseña olvidada está en el alcance de esta versión.

**Impacto:** RF-1.6, UX

**Opciones:**
1. **Incluir:** Implementar flujo de "Olvidé mi contraseña" con Firebase Auth (reset por email)
2. **Excluir:** No implementar en v1.0, agregar en versiones posteriores

**Requiere aclaración de:** Product Owner

**Recomendación provisional:** Opción 1 (incluir) porque Firebase Auth lo ofrece de forma nativa y es estándar esperado por usuarios

---

### AMB-05: Like al propio post

**Descripción:** No se especifica si el autor puede darse "me gusta" a su propia publicación.

**Impacto:** RF-3.1, UX, CB-7

**Opciones:**
1. **Permitir:** El autor puede darse like
2. **Prohibir:** Deshabilitar botón de like en publicaciones propias

**Requiere aclaración de:** Product Owner, UX

**Recomendación provisional:** Opción 2 (prohibir) por convención de redes sociales (Facebook, Twitter, etc. no permiten)

---

### AMB-06: Toggle de "me gusta" (quitar like)

**Descripción:** No se especifica explícitamente si un usuario puede quitar su "me gusta" después de haberlo dado.

**Impacto:** RF-3.3, UX, CB-8

**Opciones:**
1. **Toggle:** Permitir dar y quitar like (comportamiento estándar)
2. **Permanente:** El like es definitivo, no se puede quitar

**Requiere aclaración de:** Product Owner

**Recomendación provisional:** Opción 1 (toggle) por comportamiento estándar esperado por usuarios

---

### AMB-07: Jerarquía entre administradores

**Descripción:** No se especifica si un admin puede borrar cuentas o publicaciones de otro admin.

**Impacto:** RF-4.1, RF-4.2, seguridad, CB-3

**Opciones:**
1. **Admins son iguales:** Cualquier admin puede borrar cuentas/publicaciones de otros admins
2. **Protección entre admins:** Un admin NO puede borrar cuentas/publicaciones de otros admins
3. **Super-admin:** Existe un rol superior (`super-admin`) que sí puede gestionar admins

**Requiere aclaración de:** Product Owner, seguridad

**Recomendación provisional:** Opción 2 (protección entre admins) para evitar conflictos y proteger cuentas privilegiadas

---

### AMB-08: Validación estricta de dominio de correo

**Descripción:** La descripción inicial menciona "correo electrónico (Gmail)" pero no aclara si se acepta SOLO @gmail.com o cualquier correo válido.

**Impacto:** RF-1.1, validación de registro, CB-4

**Opciones:**
1. **Solo Gmail:** Validar dominio `@gmail.com` estrictamente
2. **Cualquier correo:** Aceptar cualquier formato de correo válido

**Requiere aclaración de:** Product Owner

**Recomendación provisional:** Opción 2 (cualquier correo) por flexibilidad y accesibilidad

---

### AMB-09: Restricción etaria (edad mínima)

**Descripción:** Se solicita fecha de nacimiento en el registro pero no se especifica una edad mínima.

**Impacto:** RF-1.1, cumplimiento legal (COPPA, GDPR), CB-5

**Opciones:**
1. **Sin restricción:** Permitir cualquier edad (solo guardar el dato)
2. **Edad mínima 13 años:** Rechazar registro si edad < 13 (COPPA EE.UU.)
3. **Edad mínima 16 años:** Rechazar registro si edad < 16 (GDPR UE con consentimiento)
4. **Edad mínima con consentimiento parental:** Solicitar consentimiento de tutor si edad < 18

**Requiere aclaración de:** Product Owner, asesoría legal

**Recomendación provisional:** Opción 2 (mínimo 13 años) por estándar internacional

---

### AMB-10: Likes al cambiar visibilidad de publicación

**Descripción:** No se especifica qué ocurre con los likes acumulados cuando una publicación pública se marca como privada.

**Impacto:** RF-2.5, RF-3, CB-1

**Opciones:**
1. **Mantener likes pero ocultarlos:** Conservar en Firestore, no mostrar mientras sea privada
2. **Borrar todos los likes:** Al cambiar a privada, eliminar registros de likes
3. **Mostrar likes solo al autor y admins:** Likes visibles solo para autor y moderadores

**Requiere aclaración de:** Product Owner, UX

**Recomendación provisional:** Opción 1 (mantener pero ocultar) por simplicidad y reversibilidad

---

## 10. Modelo de datos

### Colección: `usuarios`

**Documento:** `/usuarios/{userId}`

| Campo | Tipo | Descripción | Requerido | Único |
|-------|------|-------------|-----------|-------|
| `id` | string | UID de Firebase Auth | Sí | Sí |
| `username` | string | Nombre de usuario | Sí | Sí |
| `email` | string | Correo electrónico | Sí | Sí |
| `fechaNacimiento` | timestamp | Fecha de nacimiento | Sí | No |
| `rol` | enum | `'usuario'` o `'admin'` | Sí | No |
| `fechaCreacion` | timestamp | Fecha de creación de cuenta | Sí | No |

**Índices necesarios:**
- `username` (para búsqueda y validación de unicidad)
- `email` (para búsqueda y validación de unicidad)

**Notas:**
- El `id` del documento debe coincidir con el UID de Firebase Authentication
- La contraseña NO se almacena en Firestore (solo en Firebase Auth)

---

### Colección: `publicaciones`

**Documento:** `/publicaciones/{publicacionId}`

| Campo | Tipo | Descripción | Requerido | Único |
|-------|------|-------------|-----------|-------|
| `id` | string | ID auto-generado por Firestore | Sí | Sí |
| `contenido` | string | Texto de la publicación | Sí | No |
| `autorId` | string | UID del usuario autor | Sí | No |
| `autorUsername` | string | Username del autor (desnormalizado) | Sí | No |
| `visibilidad` | enum | `'publica'` o `'privada'` | Sí | No |
| `fechaCreacion` | timestamp | Fecha de creación | Sí | No |
| `fechaModificacion` | timestamp | Fecha de última modificación | Sí | No |
| `likesCount` | number | Contador de likes (desnormalizado) | Sí | No |

**Índices necesarios (compuestos):**
- `visibilidad` + `fechaCreacion` (desc) → Para feed de publicaciones públicas ordenado
- `autorId` + `fechaCreacion` (desc) → Para publicaciones de un usuario

**Notas:**
- `autorUsername` se desnormaliza para evitar joins al mostrar el feed
- `likesCount` se desnormaliza para performance (evitar contar subcolección)

---

### Colección: `likes`

**Opción A: Subcolección de publicación**

**Documento:** `/publicaciones/{publicacionId}/likes/{userId}`

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `userId` | string | UID del usuario que dio like | Sí |
| `timestamp` | timestamp | Fecha del like | Sí |

**Ventajas:**
- Organización jerárquica clara
- Fácil borrar todos los likes de una publicación

**Desventajas:**
- Más complejo consultar "todos los likes de un usuario"

---

**Opción B: Colección independiente**

**Documento:** `/likes/{likeId}`

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `id` | string | ID compuesto: `{publicacionId}_{userId}` | Sí |
| `publicacionId` | string | ID de la publicación | Sí |
| `userId` | string | UID del usuario que dio like | Sí |
| `timestamp` | timestamp | Fecha del like | Sí |

**Índices necesarios:**
- `publicacionId` → Para consultar likes de una publicación
- `userId` → Para consultar likes de un usuario

**Ventajas:**
- Más flexible para consultas variadas
- Fácil consultar likes por usuario

**Desventajas:**
- Más complejo garantizar integridad referencial

---

**Recomendación:** Opción A (subcolección) por simplicidad y coherencia con el modelo de Firestore

---

## 11. Arquitectura del sistema

### 11.1. Diagrama de capas (Frontend)

```
┌─────────────────────────────────────────┐
│         Presentación (UI)               │
│  - Componentes React                    │
│  - Pages, Layouts                       │
│  - Hooks de UI                          │
└─────────────────────────────────────────┘
              ↓ consume
┌─────────────────────────────────────────┐
│      Servicios / Casos de Uso           │
│  - authService                          │
│  - postService                          │
│  - userService                          │
│  - likeService                          │
└─────────────────────────────────────────┘
              ↓ usa
┌─────────────────────────────────────────┐
│         Dominio / Modelos               │
│  - Usuario (class)                      │
│  - Publicacion (class)                  │
│  - Enums (UserRole, PostVisibility)    │
└─────────────────────────────────────────┘
              ↓ usa
┌─────────────────────────────────────────┐
│         Infraestructura                 │
│  - firebaseConfig                       │
│  - auth, firestore instances            │
└─────────────────────────────────────────┘
              ↓ conecta
┌─────────────────────────────────────────┐
│            Firebase                     │
│  - Authentication                       │
│  - Firestore                            │
│  - Hosting                              │
└─────────────────────────────────────────┘
```

---

### 11.2. Estructura de carpetas sugerida

```
my-project/
├── public/
│   └── index.html
├── src/
│   ├── domain/
│   │   ├── models/
│   │   │   ├── Usuario.ts
│   │   │   └── Publicacion.ts
│   │   └── enums/
│   │       ├── UserRole.ts
│   │       └── PostVisibility.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── postService.ts
│   │   ├── userService.ts
│   │   └── likeService.ts
│   ├── infrastructure/
│   │   └── firebaseConfig.ts
│   ├── ui/
│   │   ├── components/
│   │   │   ├── Post.tsx
│   │   │   ├── PostForm.tsx
│   │   │   ├── Feed.tsx
│   │   │   ├── LikeButton.tsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── AdminPanel.tsx
│   │   └── layouts/
│   │       └── MainLayout.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePosts.ts
│   │   └── ...
│   ├── utils/
│   │   └── validators.ts
│   ├── App.tsx
│   └── index.tsx
├── firestore.rules
├── package.json
├── tsconfig.json (si se usa TypeScript)
└── README.md
```

---

### 11.3. Firestore Security Rules (pseudocódigo)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function: obtener datos del usuario actual
    function getUserData() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data;
    }
    
    // Helper function: verificar si el usuario es admin
    function isAdmin() {
      return getUserData().rol == 'admin';
    }
    
    // Colección: usuarios
    match /usuarios/{userId} {
      // Cualquier usuario autenticado puede leer cualquier perfil
      allow read: if request.auth != null;
      
      // Solo el propio usuario puede crear/actualizar su perfil
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId;
      
      // Solo el propio usuario O un admin puede borrar la cuenta
      allow delete: if request.auth.uid == userId || isAdmin();
    }
    
    // Colección: publicaciones
    match /publicaciones/{publicacionId} {
      // Leer: 
      // - Publicaciones públicas: cualquier usuario autenticado
      // - Publicaciones privadas: solo autor o admin
      allow read: if request.auth != null && (
        resource.data.visibilidad == 'publica' ||
        resource.data.autorId == request.auth.uid ||
        isAdmin()
      );
      
      // Crear: cualquier usuario autenticado
      allow create: if request.auth != null &&
                       request.resource.data.autorId == request.auth.uid;
      
      // Actualizar: solo el autor (incluso admins NO pueden modificar)
      allow update: if request.auth.uid == resource.data.autorId;
      
      // Borrar: autor O admin
      allow delete: if request.auth.uid == resource.data.autorId || isAdmin();
      
      // Subcolección: likes
      match /likes/{userId} {
        // Leer: si puede leer la publicación padre
        allow read: if request.auth != null;
        
        // Crear/borrar: solo el propio usuario (dar/quitar su like)
        // Y solo si la publicación es pública O es propia
        allow create, delete: if request.auth.uid == userId && (
          get(/databases/$(database)/documents/publicaciones/$(publicacionId)).data.visibilidad == 'publica' ||
          get(/databases/$(database)/documents/publicaciones/$(publicacionId)).data.autorId == request.auth.uid
        );
      }
    }
  }
}
```

---

## 12. Flujos de trabajo principales

### 12.1. Registro de usuario

```
Usuario → Formulario de registro
  ↓
  [Validación cliente: username único, email válido, contraseña >= 6 chars]
  ↓
authService.register(username, email, password, fechaNacimiento)
  ↓
Firebase Authentication.createUserWithEmailAndPassword()
  ↓
Firestore.collection('usuarios').doc(uid).set({ username, email, fechaNacimiento, rol: 'usuario', fechaCreacion })
  ↓
Sesión iniciada automáticamente
  ↓
Redirigir a Feed
```

---

### 12.2. Publicar idea

```
Usuario autenticado → Formulario de nueva publicación
  ↓
  [Escribe contenido, selecciona visibilidad (pública/privada)]
  ↓
postService.createPost(contenido, visibilidad)
  ↓
  [Validación cliente: contenido no vacío]
  ↓
Firestore.collection('publicaciones').add({
  contenido,
  autorId: currentUser.uid,
  autorUsername: currentUser.username,
  visibilidad,
  fechaCreacion: serverTimestamp(),
  fechaModificacion: serverTimestamp(),
  likesCount: 0
})
  ↓
  [Firestore Rules valida autorId == auth.uid]
  ↓
Publicación creada
  ↓
  [Si pública] Aparece en feed general
  [Si privada] Solo visible en "Mis publicaciones"
```

---

### 12.3. Dar "me gusta"

```
Usuario ve publicación pública → Click en botón de like
  ↓
likeService.addLike(publicacionId)
  ↓
  [Validación cliente: publicación es pública, usuario no es autor (AMB-05)]
  ↓
Transaction:
  1. Firestore.collection('publicaciones').doc(publicacionId).collection('likes').doc(currentUser.uid).set({ userId, timestamp })
  2. Firestore.collection('publicaciones').doc(publicacionId).update({ likesCount: increment(1) })
  ↓
  [Firestore Rules valida visibilidad == 'publica']
  ↓
Like registrado
  ↓
UI actualizada: botón activo, contador incrementado
```

---

### 12.4. Administrador borra publicación ajena

```
Admin ve publicación de otro usuario → Click en "Borrar"
  ↓
  [Confirmación: "¿Estás seguro?"]
  ↓
postService.deletePost(publicacionId)
  ↓
Firestore.collection('publicaciones').doc(publicacionId).delete()
  ↓
  [Firestore Rules valida: isAdmin() || autorId == auth.uid]
  ↓
  [En cascada: borrar subcolección likes]
  ↓
Publicación eliminada
  ↓
UI actualizada: publicación desaparece del feed/panel
```

---

## 13. Restricciones técnicas

### 13.1. Tecnologías permitidas

✅ **Frontend:**
- React 18+
- TypeScript o JavaScript
- React Router (navegación)
- CSS / SCSS / CSS-in-JS / Tailwind / Material-UI (estilos)

✅ **Backend as a Service:**
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

✅ **Testing:**
- Jest
- React Testing Library
- @firebase/rules-unit-testing
- Firebase Emulators

---

### 13.2. Tecnologías prohibidas

❌ Cloud Functions (ninguna lógica de servidor custom)  
❌ Firebase Storage  
❌ Firebase Realtime Database  
❌ Firebase Analytics  
❌ Firebase Cloud Messaging  
❌ Firebase Remote Config  
❌ Cualquier otro servicio de Firebase no listado en "permitidas"  
❌ Cualquier backend propio (Node/Express, Java, Python, etc.)  

---

### 13.3. Implicaciones de las restricciones

**Sin Cloud Functions:**
- Toda lógica de negocio en el cliente
- Validaciones en cliente + Firestore Rules
- No se pueden ejecutar tareas programadas (cron jobs)
- No se pueden enviar emails custom (usar Firebase Auth para reset password)

**Sin Storage:**
- No se pueden subir imágenes de perfil ni adjuntos en publicaciones
- Solo contenido de texto

**Sin Cloud Messaging:**
- No se pueden enviar notificaciones push
- Toda interacción es pull (el usuario debe actualizar para ver nuevos contenidos)

---

## Conclusión y próximos pasos

Esta especificación define el alcance, requisitos funcionales y no funcionales, modelo de datos, arquitectura y restricciones técnicas del proyecto **Yumeideas**.

### Estado actual

- ✅ Requisitos funcionales documentados
- ✅ Historias de usuario priorizadas
- ✅ Modelo de datos definido
- ✅ Arquitectura propuesta
- ⚠️ **10 ambigüedades identificadas** que requieren aclaración

### Próximos pasos según metodología Speckit

1. **Fase de aclaración** (`clarify.md`):
   - Resolver las 10 ambigüedades marcadas
   - Decisiones sobre:
     - AMB-01: Edición de correo/fecha de nacimiento
     - AMB-02: Borrado en cascada de publicaciones
     - AMB-03: Mecanismo de creación de admins
     - AMB-04: Recuperación de contraseña en alcance
     - AMB-05: Like al propio post
     - AMB-06: Toggle de like
     - AMB-07: Jerarquía entre admins
     - AMB-08: Validación de dominio de correo
     - AMB-09: Restricción etaria
     - AMB-10: Likes al cambiar visibilidad

2. **Fase de checklist** (`checklist.md`):
   - Validar conformidad con la constitución del proyecto
   - Verificar que todos los requisitos no funcionales sean testeables

3. **Fase de planificación** (`plan.md`):
   - Definir sprints
   - Priorizar historias de usuario
   - Estimar esfuerzo

4. **Fase de tareas** (`tasks.md`):
   - Desglosar historias en tareas técnicas implementables
   - Asignar tareas a sprints

5. **Implementación**:
   - Solo después de validar todos los documentos anteriores

---

**Fecha de creación:** 7 de julio de 2026  
**Versión:** 1.0  
**Estado:** Borrador - Pendiente de aclaración de ambigüedades  
**Autor:** Equipo Yumeideas
