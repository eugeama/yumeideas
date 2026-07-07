---
agent: speckit.constitution
---

# Constitución del Proyecto - Sistema de Red Social

## Descripción del Sistema

Este proyecto es un **sistema tipo red social** (similar a Twitter) usado para gestionar publicaciones de usuarios, con roles diferenciados (usuario normal y administrador), desarrollado con **React** (frontend) y **Firebase** (backend as a service).

---

## Principios Obligatorios

### 1. La especificación manda sobre la implementación

**NO se debe programar funcionalidad que no esté trazada a una historia de usuario o requisito.**

- Toda decisión de diseño no contemplada explícitamente debe marcarse como **ambigüedad** y aclararse antes de implementar.
- La implementación debe ser 100% rastreable a requisitos documentados.

---

### 2. Restricción tecnológica estricta

#### Frontend
- **React** (con o sin TypeScript, a definir en la especificación)

#### Backend
- **Exclusivamente Firebase** con los siguientes servicios permitidos:
  - **Firebase Authentication**
  - **Firebase Hosting**
  - **Firestore Database**

#### Servicios Explícitamente Prohibidos

❌ **Cloud Functions** (ninguna lógica de servidor propia)  
❌ Cualquier otro producto de Firebase:
  - Storage
  - Realtime Database
  - Analytics
  - Cloud Messaging
  - Remote Config
  - etc.

❌ Cualquier backend adicional fuera del cliente React y Firebase:
  - Node/Express
  - Java
  - Python
  - Cualquier otro servidor propio

#### Implicación Crítica

> **Toda regla de negocio y validación** que en otros sistemas se resolvería con backend propio **debe resolverse en el cliente y/o mediante las reglas de seguridad de Firestore** (Firestore Security Rules).

---

### 3. Modelado orientado a objetos en el frontend

Aunque no exista un backend con dominio Java, la **lógica de negocio del cliente** debe modelarse con **clases o estructuras claras y cohesivas** en TypeScript/JavaScript.

#### Evitar modelos anémicos
Cuando haya reglas de negocio claras, encapsularlas en los modelos:
- ¿Quién puede editar/borrar un post?
- ¿Qué hace público o privado a un post?
- ¿Qué validaciones tiene un perfil de usuario?

#### Ejemplo de entidades
- `Usuario`: con sus datos, rol y métodos de negocio
- `Post`: con visibilidad, permisos, autor, etc.

---

### 4. Separación de responsabilidades en el frontend

El código debe organizarse en capas claramente diferenciadas:

#### 📦 **Modelos/Dominio**
Entidades como `Usuario` y `Post`, con sus **reglas de negocio**:
- Visibilidad (público/privado)
- Permisos (quién puede editar, eliminar)
- Validaciones (longitud de texto, campos requeridos)

#### ⚙️ **Servicios/Casos de Uso**
Módulos que encapsulan las llamadas a Firebase:
- `authService`: login, registro, logout
- `postService`: crear, editar, eliminar, listar posts
- `userService`: obtener perfil, actualizar datos

**NUNCA** mezclar lógica de Firebase directamente dentro de componentes visuales.

#### 🔧 **Infraestructura**
Configuración e inicialización de Firebase:
- `firebaseConfig.js`
- Instancias de `auth` y `firestore`

#### 🎨 **Presentación/UI**
Componentes React, **exclusivamente responsables de**:
- Mostrar datos
- Capturar eventos del usuario
- Delegar lógica a los servicios

#### 🔐 **Reglas de Seguridad (Firestore Rules)**
Deben **reflejar y reforzar** en el servidor las mismas reglas de autorización que existen en el cliente.

> ⚠️ **NUNCA confiar solo en la UI** para restringir acceso a datos privados o acciones de administrador.

---

### 5. Roles y autorización explícitos

El sistema debe distinguir claramente **dos roles**:
- **Usuario normal**
- **Administrador**

#### Requisitos de autorización

1. **Toda funcionalidad** debe indicar explícitamente qué rol puede ejecutarla.

2. La autorización debe validarse en **DOS lugares**:
   - **Cliente**: ocultar/deshabilitar opciones según rol
   - **Firestore Rules**: rechazar operaciones no autorizadas

3. El cliente **nunca** es una fuente confiable de seguridad.

#### Ejemplos de permisos
- Usuario normal: crear posts, editar/eliminar solo los propios, dar like
- Administrador: eliminar cualquier post, eliminar cuentas, gestionar usuarios

---

### 6. Uso de enums o value objects para valores cerrados

Los valores cerrados deben representarse como **tipos cerrados y tipados**, NO como strings libres o banderas ambiguas.

#### Ejemplos obligatorios

```typescript
// Rol de usuario
enum UserRole {
  USER = 'usuario',
  ADMIN = 'admin'
}

// Visibilidad del post
enum PostVisibility {
  PUBLIC = 'publico',
  PRIVATE = 'privado'
}
```

❌ **Evitar**: `rol: string`, `isPublic: boolean` sin contexto claro  
✅ **Usar**: tipos cerrados que auto-documenten el dominio

---

### 7. Aplicar patrones de diseño solo si simplifican el diseño

**NO forzar patrones** (Factory, Strategy, Singleton, etc.) si una solución simple y directa resuelve el problema con la misma claridad.

- Priorizar código legible y directo
- Usar patrones cuando realmente reduzcan complejidad o mejoren mantenibilidad
- Justificar en la especificación por qué se usa un patrón específico

---

### 8. Evitar lógica duplicada y componentes/funciones gigantes

#### Centralización de validaciones
Las validaciones deben estar en **UN ÚNICO lugar**:
- Longitud de un post
- Campos obligatorios de perfil
- Formato de email o nombre de usuario

**NO repetir** estas validaciones en cada componente.

#### Límites de tamaño
- Componentes: máximo 200-300 líneas (como guía)
- Funciones: máximo 50 líneas (como guía)
- Si excede estos límites, refactorizar en subcomponentes o funciones auxiliares

---

### 9. Toda regla de negocio importante debe tener tests

Ejemplos de casos que **DEBEN testearse**:

✅ Un post privado solo debe ser visible por su autor y por un administrador  
✅ Un usuario normal NO debe poder borrar posts ajenos  
✅ Un usuario normal NO debe poder borrar cuentas ajenas  
✅ Un admin SÍ debe poder borrar posts y cuentas  
✅ Un post sin contenido no debe poder crearse  
✅ Un like de un usuario ya registrado no debe duplicarse  

---

### 10. Escalabilidad razonable de las consultas

Las consultas a Firestore deben diseñarse usando **filtros y índices de Firestore**, evitando traer toda la colección al cliente para filtrar en memoria.

#### Estrategias obligatorias

✅ Usar `where()` para filtrar en servidor  
✅ Usar `orderBy()` para ordenar en servidor  
✅ Implementar **paginación** (limit + startAfter)  
✅ Crear índices compuestos cuando sea necesario  

❌ **Evitar**: `getDocs(collection(db, 'posts'))` y luego `.filter()` en cliente  

#### Ejemplos de consultas
- Listado de posts públicos ordenados por fecha
- Posts de un usuario específico
- Posts con más likes (top posts)

---

### 11. La interfaz debe priorizar usabilidad

Las siguientes acciones deben ser **simples, rápidas y claras**:

- ✍️ Publicar un post
- ❤️ Dar like a un post
- 🔒 Marcar un post como privado/público
- ✏️ Editar contenido propio
- 🗑️ Borrar contenido propio
- 👤 Ver y editar perfil

#### Principios de UX
- Feedback inmediato (loading, success, error)
- Confirmaciones para acciones destructivas (eliminar)
- Mensajes de error claros y accionables
- Interfaz responsiva (mobile-first o adaptable)

---

### 12. Privacidad y consentimiento de datos

#### Datos de perfil
Los datos de usuario (nombre, email, etc.) deben tratarse con **criterios básicos de privacidad**:
- Mostrar solo información necesaria
- No exponer emails a otros usuarios sin consentimiento
- Permitir al usuario controlar su información visible

#### Posts privados
Un post marcado como **privado**:

❌ NUNCA debe quedar expuesto a otros usuarios normales  
❌ NUNCA debe aparecer en listados públicos  
❌ NUNCA debe ser accesible por consulta directa a Firestore  

✅ Debe estar **protegido por Firestore Security Rules**  
✅ Solo visible por: autor y administradores  

---

### 13. No implementar código durante las fases de especificación

#### Fases NO implementativas (solo documentación)

Durante estas fases **SOLO se crean o actualizan documentos**:

1. **Especificación** → Documento `spec.md`
2. **Aclaración** → Documento `clarify.md`
3. **Checklist** → Documento `checklist.md`
4. **Planificación** → Documento `plan.md`
5. **Generación de tareas** → Documento `tasks.md`

#### Fase implementativa

La **implementación** (código) ocurre **únicamente después** de validar todos los documentos anteriores.

---

## Resumen Ejecutivo

Este proyecto es un sistema de red social con React + Firebase que:

- ✅ Usa SOLO React, Firebase Authentication, Hosting y Firestore
- ✅ Modela el dominio con clases/objetos en el frontend
- ✅ Separa capas: dominio, servicios, infraestructura, UI
- ✅ Define roles claros (usuario/admin) con autorización en cliente Y Firestore Rules
- ✅ Usa tipos cerrados para valores del dominio (enums)
- ✅ Centraliza validaciones y evita código duplicado
- ✅ Testea reglas de negocio críticas
- ✅ Diseña consultas escalables con filtros de Firestore
- ✅ Prioriza usabilidad y privacidad de datos
- ✅ Documenta primero, implementa después

---

**Fecha de creación**: 7 de julio de 2026  
**Autor**: Especificación del sistema  
**Versión**: 1.0