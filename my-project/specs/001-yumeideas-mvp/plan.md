# Plan de Implementación - Yumeideas

**Proyecto:** Yumeideas  
**Fecha:** 7 de julio de 2026  
**Versión:** 1.0  
**Estado:** Aprobado para implementación  
**Documentos base:** [spec.md](./spec.md) | [clarify.md](./clarify.md) | [checklist.md](./checklist.md)

---

## Tabla de Contenidos

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Metodología de desarrollo](#metodología-de-desarrollo)
3. [Arquitectura del proyecto](#arquitectura-del-proyecto)
4. [Sprints y fases](#sprints-y-fases)
5. [Priorización de historias de usuario](#priorización-de-historias-de-usuario)
6. [Estimaciones y dependencias](#estimaciones-y-dependencias)
7. [Stack tecnológico](#stack-tecnológico)
8. [Criterios de aceptación por sprint](#criterios-de-aceptación-por-sprint)
9. [Riesgos y mitigaciones](#riesgos-y-mitigaciones)
10. [Entregables](#entregables)

---

## 1. Resumen ejecutivo

Este documento define el plan de implementación del proyecto **Yumeideas**, una aplicación web tipo red social simplificada desarrollada con **React + Vite** (frontend) y **Firebase** (backend as a service).

### Alcance del proyecto

**Frontend único:**
- React 18+ con TypeScript
- Vite como build tool
- Firebase SDK para Authentication y Firestore
- Sin backend propio (toda lógica de servidor prohibida)

**Servicios de Firebase permitidos:**
- ✅ Firebase Authentication
- ✅ Cloud Firestore
- ✅ Firebase Hosting

**Servicios explícitamente prohibidos:**
- ❌ Cloud Functions
- ❌ Firebase Storage
- ❌ Cualquier otro servicio de Firebase
- ❌ Cualquier backend adicional (Node, Java, etc.)

### Duración estimada

**Total:** 6-8 semanas (3-4 sprints de 2 semanas cada uno)

### Equipo requerido

- 1 Developer Full-Stack Frontend (React + Firebase)
- 1 UX/UI Designer (part-time)
- 1 QA Engineer (part-time, sprints 2-4)
- 1 Product Owner (revisión de entregables)

---

## 2. Metodología de desarrollo

### Enfoque ágil

**Scrum adaptado:**
- Sprints de 2 semanas
- Daily standups (15 min)
- Sprint planning (inicio de sprint)
- Sprint review (demo al final)
- Sprint retrospective (mejora continua)

### Definition of Done (DoD)

Una historia de usuario se considera **Done** cuando:

1. ✅ Código implementado y funcional
2. ✅ Tests unitarios escritos y pasando (coverage >= 80%)
3. ✅ Tests de Firestore Rules escritos y pasando
4. ✅ Revisión de código completada (code review)
5. ✅ Documentación técnica actualizada
6. ✅ Criterios de aceptación validados
7. ✅ QA manual ejecutado (checklist de testing)
8. ✅ Deploy a entorno de desarrollo/staging
9. ✅ Product Owner aprueba la funcionalidad

### Flujo de trabajo Git

**Branches:**
- `main` → Producción (protegida)
- `develop` → Integración continua
- `feature/{HU-XX}-descripcion` → Desarrollo de funcionalidad
- `bugfix/{issue-id}-descripcion` → Corrección de bugs
- `hotfix/{issue-id}-descripcion` → Correcciones urgentes en producción

**Pull Requests:**
- Toda funcionalidad requiere PR hacia `develop`
- Code review obligatorio (mínimo 1 aprobación)
- Tests deben pasar antes de merge
- Merge a `main` solo desde `develop` (release)

---

## 3. Arquitectura del proyecto

### Estructura de carpetas

```
my-project/
├── frontend/
│   ├── src/
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── Usuario.ts
│   │   │   │   └── Publicacion.ts
│   │   │   └── enums/
│   │   │       ├── UserRole.ts
│   │   │       └── PostVisibility.ts
│   │   ├── application/
│   │   │   ├── services/
│   │   │   │   ├── authService.ts
│   │   │   │   ├── postService.ts
│   │   │   │   ├── userService.ts
│   │   │   │   └── likeService.ts
│   │   │   └── hooks/
│   │   │       ├── useAuth.ts
│   │   │       ├── usePosts.ts
│   │   │       └── useLikes.ts
│   │   ├── infrastructure/
│   │   │   ├── firebase/
│   │   │   │   ├── config.ts
│   │   │   │   ├── auth.ts
│   │   │   │   └── firestore.ts
│   │   │   └── utils/
│   │   │       └── validators.ts
│   │   ├── ui/
│   │   │   ├── components/
│   │   │   │   ├── common/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   └── Loading.tsx
│   │   │   │   ├── post/
│   │   │   │   │   ├── Post.tsx
│   │   │   │   │   ├── PostForm.tsx
│   │   │   │   │   ├── PostList.tsx
│   │   │   │   │   └── LikeButton.tsx
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   ├── RegisterForm.tsx
│   │   │   │   │   └── ForgotPasswordForm.tsx
│   │   │   │   └── layout/
│   │   │   │       ├── Header.tsx
│   │   │   │       ├── Navbar.tsx
│   │   │   │       └── Footer.tsx
│   │   │   ├── pages/
│   │   │   │   ├── HomePage.tsx
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   ├── ForgotPasswordPage.tsx
│   │   │   │   ├── FeedPage.tsx
│   │   │   │   ├── ProfilePage.tsx
│   │   │   │   └── AdminPanelPage.tsx
│   │   │   └── styles/
│   │   │       ├── global.css
│   │   │       └── variables.css
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── domain/
│   │   │   ├── services/
│   │   │   └── validators/
│   │   ├── integration/
│   │   │   └── flows/
│   │   └── firestore-rules/
│   │       └── security.test.ts
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env.example
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── .firebaserc
├── .specify/
│   ├── spec.md
│   ├── clarify.md
│   ├── checklist.md
│   ├── plan.md (este documento)
│   ├── research.md
│   ├── data-model.md
│   ├── contracts/
│   │   ├── firestore.rules
│   │   └── services-contract.md
│   └── quickstart.md
└── README.md
```

### Capas de la arquitectura

#### Domain (Dominio)

**Responsabilidad:** Entidades de negocio y reglas de dominio.

**Contenido:**
- `models/Usuario.ts`: Entidad Usuario con validaciones (edad >= 13, username único)
- `models/Publicacion.ts`: Entidad Publicacion con reglas de visibilidad
- `enums/UserRole.ts`: `enum UserRole { USUARIO = 'usuario', ADMIN = 'admin' }`
- `enums/PostVisibility.ts`: `enum PostVisibility { PUBLICA = 'publica', PRIVADA = 'privada' }`

**Ejemplo:**
```typescript
// domain/models/Usuario.ts
export class Usuario {
  constructor(
    public uid: string,
    public username: string,
    public email: string,
    public fechaNacimiento: Date,
    public rol: UserRole,
    public fechaCreacion: Date
  ) {}

  static validarEdad(fechaNacimiento: Date): boolean {
    const edad = this.calcularEdad(fechaNacimiento);
    return edad >= 13;
  }

  private static calcularEdad(fechaNacimiento: Date): number {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  puedeEditarPublicacion(publicacion: Publicacion): boolean {
    return publicacion.autorId === this.uid;
  }

  puedeBorrarPublicacion(publicacion: Publicacion): boolean {
    // Puede borrar si es el autor O si es admin y el autor no es admin
    return publicacion.autorId === this.uid || 
           (this.rol === UserRole.ADMIN && publicacion.autorRol !== UserRole.ADMIN);
  }
}
```

#### Application (Aplicación)

**Responsabilidad:** Casos de uso y servicios que orquestan la lógica de negocio.

**Contenido:**
- `services/authService.ts`: Registro, login, logout, recuperación de contraseña
- `services/postService.ts`: CRUD de publicaciones
- `services/userService.ts`: Gestión de usuarios, borrado de cuenta
- `services/likeService.ts`: Toggle de likes con transacciones
- `hooks/useAuth.ts`: Hook de React para estado de autenticación
- `hooks/usePosts.ts`: Hook para consultar y gestionar publicaciones
- `hooks/useLikes.ts`: Hook para dar/quitar likes

**Ejemplo:**
```typescript
// application/services/postService.ts
export class PostService {
  async createPost(
    contenido: string, 
    visibilidad: PostVisibility, 
    autor: Usuario
  ): Promise<string> {
    // Validaciones
    if (!contenido.trim()) {
      throw new Error('El contenido no puede estar vacío');
    }

    // Crear publicación en Firestore
    const publicacionData = {
      contenido,
      autorId: autor.uid,
      autorUsername: autor.username,
      autorRol: autor.rol,
      visibilidad,
      fechaCreacion: serverTimestamp(),
      fechaModificacion: serverTimestamp(),
      likesCount: 0
    };

    const docRef = await addDoc(collection(db, 'publicaciones'), publicacionData);
    return docRef.id;
  }

  // ... más métodos
}
```

#### Infrastructure (Infraestructura)

**Responsabilidad:** Configuración y acceso a servicios externos (Firebase).

**Contenido:**
- `firebase/config.ts`: Configuración de Firebase
- `firebase/auth.ts`: Instancia de Firebase Auth
- `firebase/firestore.ts`: Instancia de Firestore
- `utils/validators.ts`: Validadores compartidos (email, username, edad)

#### UI (Interfaz de Usuario)

**Responsabilidad:** Componentes visuales y páginas de React.

**Contenido:**
- `components/`: Componentes reutilizables
- `pages/`: Páginas de la aplicación
- `styles/`: Estilos CSS

**Principios:**
- **Sin lógica de negocio** en componentes visuales
- **Sin llamadas directas a Firebase** (usar hooks y servicios)
- Componentes pequeños y cohesivos (< 200-300 líneas)
- Props tipadas con TypeScript

---

## 4. Sprints y fases

### Sprint 0: Setup inicial (1 semana)

**Objetivo:** Configurar el entorno de desarrollo y las bases del proyecto.

**Tareas:**
1. Crear proyecto Vite + React + TypeScript
2. Configurar Firebase (proyecto, Authentication, Firestore)
3. Configurar ESLint, Prettier, Husky (pre-commit hooks)
4. Configurar Firebase Emulators (Auth, Firestore)
5. Crear estructura de carpetas según arquitectura
6. Configurar testing (Jest, React Testing Library, Firebase rules testing)
7. Crear README inicial y quickstart.md
8. Crear `.env.example` con variables de Firebase
9. Setup de CI/CD básico (GitHub Actions)

**Entregables:**
- Proyecto base funcional
- Firebase configurado
- Emulators funcionando
- Tests ejecutándose (aunque estén vacíos)

---

### Sprint 1: Autenticación y usuarios base (2 semanas)

**Objetivo:** Implementar registro, login y gestión básica de usuarios.

**Historias de usuario:**
- **HU-01:** Registro de usuario (Alta)
- **HU-02:** Inicio de sesión (Alta)
- **HU-13:** Recuperación de contraseña (Media) *(Nueva, de clarify.md)*
- **HU-12:** Modificar perfil (Baja) *(parcial: solo username y contraseña)*

**Tareas principales:**

#### Domain
- [ ] Crear `Usuario.ts` con validaciones de edad >= 13
- [ ] Crear `UserRole.ts` enum

#### Application
- [ ] Implementar `authService.ts`:
  - `register()`: validar edad, crear en Auth + Firestore + reservar username
  - `login()`: autenticar con email/password
  - `logout()`: cerrar sesión
  - `sendPasswordReset()`: enviar email de recuperación
- [ ] Implementar `userService.ts`:
  - `updateUsername()`: actualizar con validación de unicidad
  - `updatePassword()`: actualizar con re-autenticación
- [ ] Crear hook `useAuth.ts` para estado global de autenticación

#### Infrastructure
- [ ] Configurar Firebase (config, auth, firestore)
- [ ] Crear `validators.ts` (email, username, edad)
- [ ] Implementar transacción para reserva de username único

#### UI
- [ ] `LoginPage.tsx` y `LoginForm.tsx`
- [ ] `RegisterPage.tsx` y `RegisterForm.tsx`
- [ ] `ForgotPasswordPage.tsx` y `ForgotPasswordForm.tsx`
- [ ] `ProfilePage.tsx` (versión inicial: solo editar username/contraseña)
- [ ] `Header.tsx` con botón de logout

#### Firestore Rules
- [ ] Regla: crear usuario solo si `auth.uid == userId`
- [ ] Regla: validar edad >= 13 en servidor
- [ ] Regla: actualizar usuario solo si es el propio usuario
- [ ] Regla: leer usuarios (cualquier autenticado)

#### Tests
- [ ] Test unitario: `Usuario.validarEdad()`
- [ ] Test de servicio: `authService.register()` con edad < 13 (debe fallar)
- [ ] Test de servicio: `authService.register()` con username duplicado (debe fallar)
- [ ] Test de Firestore Rules: crear usuario con edad < 13 (debe rechazar)
- [ ] Test de integración: flujo completo de registro → login → logout

**Criterios de aceptación:**
- Usuario puede registrarse con edad >= 13
- Usuario con edad < 13 es rechazado con mensaje claro
- Username es único en todo el sistema
- Usuario puede iniciar sesión con email/password
- Usuario puede recuperar contraseña por email
- Usuario puede cambiar su username y contraseña

---

### Sprint 2: Publicaciones y feed público (2 semanas)

**Objetivo:** Implementar creación, visualización y gestión de publicaciones.

**Historias de usuario:**
- **HU-03:** Publicar idea (Alta)
- **HU-04:** Marcar publicación como privada/pública (Alta)
- **HU-05:** Ver feed de publicaciones públicas (Alta)
- **HU-07:** Modificar/borrar publicación propia (Alta)

**Tareas principales:**

#### Domain
- [ ] Crear `Publicacion.ts` con reglas de visibilidad
- [ ] Crear `PostVisibility.ts` enum

#### Application
- [ ] Implementar `postService.ts`:
  - `createPost()`: crear con visibilidad y desnormalización de username
  - `updatePost()`: modificar contenido y/o visibilidad
  - `deletePost()`: borrar publicación
  - `getPublicFeed()`: query paginada de publicaciones públicas
  - `getUserPosts()`: query de publicaciones propias (públicas + privadas)
- [ ] Crear hook `usePosts.ts` para gestionar estado de publicaciones

#### UI
- [ ] `FeedPage.tsx`: listado de publicaciones públicas
- [ ] `PostList.tsx`: componente de lista con paginación
- [ ] `Post.tsx`: componente individual de publicación
- [ ] `PostForm.tsx`: formulario de crear/editar con switch de visibilidad
- [ ] `ProfilePage.tsx` (actualizar): mostrar publicaciones propias
- [ ] Indicador visual de visibilidad (ícono candado para privadas)
- [ ] Confirmación antes de borrar publicación

#### Firestore Rules
- [ ] Regla: crear publicación solo si `autorId == auth.uid`
- [ ] Regla: leer publicación pública (cualquier autenticado)
- [ ] Regla: leer publicación privada (solo autor o admin)
- [ ] Regla: actualizar publicación (solo autor)
- [ ] Regla: borrar publicación (autor o admin, pero no si autor es admin)

#### Índices Firestore
- [ ] Índice compuesto: `(visibilidad ASC, fechaCreacion DESC)`
- [ ] Índice compuesto: `(autorId ASC, fechaCreacion DESC)`

#### Tests
- [ ] Test unitario: `Publicacion.esVisiblePara(usuario)`
- [ ] Test de servicio: crear publicación con contenido vacío (debe fallar)
- [ ] Test de servicio: cambiar visibilidad mantiene likes
- [ ] Test de Firestore Rules: leer publicación privada ajena (debe rechazar)
- [ ] Test de Firestore Rules: modificar publicación ajena (debe rechazar)
- [ ] Test de integración: crear publicación → editar → cambiar visibilidad → borrar

**Criterios de aceptación:**
- Usuario puede crear publicación con visibilidad pública/privada
- Feed público muestra solo publicaciones públicas, paginadas
- Usuario ve sus propias publicaciones (públicas + privadas)
- Usuario puede editar contenido y visibilidad de sus publicaciones
- Usuario puede borrar sus propias publicaciones
- Publicaciones privadas NO son visibles para otros usuarios normales
- Cambiar visibilidad NO borra los likes existentes

---

### Sprint 3: Interacciones y administración (2 semanas)

**Objetivo:** Implementar likes y funcionalidades de administrador.

**Historias de usuario:**
- **HU-06:** Dar "me gusta" (Media)
- **HU-09:** Borrar publicación ajena (admin) (Alta)
- **HU-10:** Borrar cuenta de usuario (admin) (Alta)
- **HU-11:** Ver publicaciones privadas (admin) (Media)
- **HU-08:** Borrar cuenta propia (Media)

**Tareas principales:**

#### Application
- [ ] Implementar `likeService.ts`:
  - `toggleLike()`: dar/quitar like con transacción (like + contador)
  - `hasUserLiked()`: verificar si usuario ya dio like
- [ ] Actualizar `postService.ts`:
  - `getAllPostsForAdmin()`: query sin filtro de visibilidad (solo admins)
- [ ] Actualizar `userService.ts`:
  - `deleteUserAccount()`: borrado en cascada (publicaciones + likes)
  - `deleteUserAccountByAdmin()`: validar que target no sea admin
- [ ] Crear hook `useLikes.ts`

#### UI
- [ ] `LikeButton.tsx`: botón toggle con contador
- [ ] Ocultar botón de like en publicaciones propias
- [ ] `AdminPanelPage.tsx`: panel con tabs (publicaciones, usuarios)
- [ ] Listado de todas las publicaciones para admin (incluidas privadas)
- [ ] Botón de borrar publicación (solo para admin)
- [ ] Listado de usuarios con botón de borrar cuenta (solo para admin)
- [ ] Confirmación antes de borrar cuenta (advertencia sobre borrado en cascada)
- [ ] Mostrar contador de likes solo si:
  - Publicación es pública, O
  - Usuario es autor, O
  - Usuario es admin

#### Firestore Rules
- [ ] Regla: crear like solo si `userId == auth.uid` y publicación es pública y autor != usuario
- [ ] Regla: borrar like solo si `userId == auth.uid`
- [ ] Regla: leer likes (si puede leer publicación padre)
- [ ] Regla: borrar usuario (propio usuario o admin, target != admin)
- [ ] Regla: admin puede leer todas las publicaciones

#### Tests
- [ ] Test de servicio: toggle like (dar → quitar → dar)
- [ ] Test de servicio: contador de likes se actualiza correctamente
- [ ] Test de servicio: no se puede dar like a publicación propia
- [ ] Test de servicio: borrado en cascada (usuario → publicaciones → likes)
- [ ] Test de Firestore Rules: dar like a publicación propia (debe rechazar)
- [ ] Test de Firestore Rules: dar like a publicación privada ajena (debe rechazar)
- [ ] Test de Firestore Rules: admin borrar publicación de otro admin (debe rechazar)
- [ ] Test de Firestore Rules: admin borrar cuenta de otro admin (debe rechazar)
- [ ] Test de integración: flujo admin borra cuenta → publicaciones desaparecen

**Criterios de aceptación:**
- Usuario puede dar like a publicaciones públicas ajenas
- Usuario NO puede dar like a publicaciones propias
- Usuario puede quitar su like (toggle)
- Contador de likes se actualiza en tiempo real
- Admin puede ver todas las publicaciones (incluidas privadas)
- Admin puede borrar publicaciones de usuarios normales
- Admin NO puede borrar publicaciones de otros admins
- Admin puede borrar cuentas de usuarios normales
- Admin NO puede borrar cuentas de otros admins
- Borrar cuenta ejecuta borrado en cascada (publicaciones + likes)

---

### Sprint 4: Refinamiento y producción (1-2 semanas)

**Objetivo:** Pulir UX, optimizar performance y preparar para producción.

**Tareas principales:**

#### UX/UI
- [ ] Mejorar diseño visual (CSS, consistencia de estilos)
- [ ] Añadir animaciones sutiles (transiciones, fade-in/out)
- [ ] Mejorar feedback de loading (spinners, skeletons)
- [ ] Mejorar mensajes de error (claros y accionables)
- [ ] Implementar toasts/snackbars para confirmaciones
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibility (ARIA labels, navegación por teclado)

#### Performance
- [ ] Lazy loading de componentes (React.lazy, Suspense)
- [ ] Paginación optimizada (cursores de Firestore)
- [ ] Evitar re-renders innecesarios (React.memo, useMemo)
- [ ] Optimizar queries de Firestore (limitar campos, índices)

#### Testing
- [ ] Aumentar coverage a >= 80%
- [ ] Tests de regresión para bugs encontrados
- [ ] Tests end-to-end con Cypress (opcional, si hay tiempo)

#### Documentación
- [ ] Completar README.md
- [ ] Actualizar quickstart.md
- [ ] Documentar Firestore Rules (comentarios)
- [ ] Documentar servicios (JSDoc)

#### Deploy
- [ ] Setup de Firebase Hosting
- [ ] Variables de entorno para producción
- [ ] Deploy a staging
- [ ] QA en staging
- [ ] Deploy a producción
- [ ] Monitoreo básico (Firebase Console)

**Criterios de aceptación:**
- Aplicación funciona en mobile, tablet y desktop
- Tiempos de carga < 2 segundos
- Coverage de tests >= 80%
- Documentación completa
- Deploy exitoso a producción

---

## 5. Priorización de historias de usuario

### Matriz de priorización

| ID | Historia de usuario | Prioridad | Sprint | Esfuerzo | Dependencias |
|----|---------------------|-----------|--------|----------|--------------|
| HU-01 | Registro de usuario | Alta | 1 | 8 | - |
| HU-02 | Inicio de sesión | Alta | 1 | 5 | HU-01 |
| HU-13 | Recuperación de contraseña | Media | 1 | 3 | HU-02 |
| HU-12 | Modificar perfil | Baja | 1 | 5 | HU-01, HU-02 |
| HU-03 | Publicar idea | Alta | 2 | 8 | HU-02 |
| HU-04 | Marcar publicación como privada/pública | Alta | 2 | 3 | HU-03 |
| HU-05 | Ver feed de publicaciones públicas | Alta | 2 | 8 | HU-03 |
| HU-07 | Modificar/borrar publicación propia | Alta | 2 | 5 | HU-03 |
| HU-06 | Dar "me gusta" | Media | 3 | 8 | HU-05 |
| HU-09 | Borrar publicación ajena (admin) | Alta | 3 | 5 | HU-07 |
| HU-10 | Borrar cuenta de usuario (admin) | Alta | 3 | 8 | HU-01 |
| HU-11 | Ver publicaciones privadas (admin) | Media | 3 | 3 | HU-05 |
| HU-08 | Borrar cuenta propia | Media | 3 | 5 | HU-01 |

**Total esfuerzo:** 74 story points (estimación: 1 SP ≈ 2-3 horas)

---

## 6. Estimaciones y dependencias

### Desglose de esfuerzo por sprint

| Sprint | HU incluidas | Story Points | Horas estimadas | Días hábiles |
|--------|--------------|--------------|-----------------|--------------|
| Sprint 0 | Setup | - | 40h | 5 días |
| Sprint 1 | HU-01, HU-02, HU-13, HU-12 | 21 | 50h | 6-7 días |
| Sprint 2 | HU-03, HU-04, HU-05, HU-07 | 24 | 56h | 7-8 días |
| Sprint 3 | HU-06, HU-09, HU-10, HU-11, HU-08 | 29 | 68h | 8-9 días |
| Sprint 4 | Refinamiento | - | 40h | 5 días |
| **Total** | **13 HU** | **74 SP** | **254h** | **31-34 días** |

**Conversión:** 254 horas ÷ 8 horas/día = **31.75 días hábiles** ≈ **6.5 semanas**

### Dependencias críticas

```
HU-01 (Registro)
  ↓
HU-02 (Login) ────┐
  ↓               ↓
HU-03 (Publicar) HU-12 (Modificar perfil)
  ↓               ↓
HU-04 (Visibilidad) HU-13 (Recuperar contraseña)
  ↓
HU-05 (Feed público)
  ↓               ↓
HU-07 (Editar/borrar propio) HU-06 (Dar like)
  ↓               ↓
HU-09 (Borrar ajena - admin) HU-08 (Borrar cuenta propia)
  ↓
HU-10 (Borrar cuenta ajena - admin)
  ↓
HU-11 (Ver privadas - admin)
```

**Camino crítico:** HU-01 → HU-02 → HU-03 → HU-04 → HU-05 → HU-06

---

## 7. Stack tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18.2+ | Framework UI |
| **TypeScript** | 5.0+ | Tipado estático |
| **Vite** | 4.0+ | Build tool |
| **React Router** | 6.0+ | Navegación |
| **Firebase SDK** | 10.0+ | Auth + Firestore |

### Estilos

| Tecnología | Propósito |
|------------|-----------|
| **CSS puro** | Estilos base |
| **CSS Variables** | Theming |
| **CSS Modules** (opcional) | Scoped styles |

### Testing

| Tecnología | Propósito |
|------------|-----------|
| **Jest** | Test runner |
| **React Testing Library** | Tests de componentes |
| **@firebase/rules-unit-testing** | Tests de Firestore Rules |
| **Firebase Emulators** | Entorno local de testing |

### Herramientas de desarrollo

| Herramienta | Propósito |
|-------------|-----------|
| **ESLint** | Linting |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |
| **GitHub Actions** | CI/CD |

### Firebase

| Servicio | Uso |
|----------|-----|
| **Authentication** | Registro, login, recuperación de contraseña |
| **Firestore** | Base de datos NoSQL |
| **Hosting** | Hosting de la aplicación web |
| **Emulators** | Desarrollo y testing local |

---

## 8. Criterios de aceptación por sprint

### Sprint 1

**Funcionalidad:**
- ✅ Usuario puede registrarse con username, email, contraseña y fecha de nacimiento
- ✅ Usuario con edad < 13 años es rechazado
- ✅ Username es único (validado en cliente y servidor)
- ✅ Usuario puede iniciar sesión con email/password
- ✅ Usuario puede cerrar sesión
- ✅ Usuario puede recuperar contraseña por email
- ✅ Usuario puede cambiar su username (validando unicidad)
- ✅ Usuario puede cambiar su contraseña (con re-autenticación)

**Técnico:**
- ✅ Firestore Rules validan edad >= 13
- ✅ Firestore Rules validan unicidad de username
- ✅ Tests unitarios de validación de edad
- ✅ Tests de Firestore Rules para autenticación
- ✅ Coverage >= 80% en domain y application

**UX:**
- ✅ Mensajes de error claros y específicos
- ✅ Loading spinners durante operaciones asíncronas
- ✅ Confirmación de éxito tras registro/login

---

### Sprint 2

**Funcionalidad:**
- ✅ Usuario puede crear publicación con contenido de texto
- ✅ Usuario puede marcar publicación como pública o privada
- ✅ Usuario ve el feed de publicaciones públicas (paginado, 20 por carga)
- ✅ Usuario ve sus propias publicaciones (públicas + privadas)
- ✅ Usuario puede editar contenido de su publicación
- ✅ Usuario puede cambiar visibilidad de su publicación (pública ↔ privada)
- ✅ Usuario puede borrar su publicación (con confirmación)
- ✅ Publicaciones privadas NO aparecen en feed público
- ✅ Publicaciones privadas NO son accesibles por usuarios normales ajenos

**Técnico:**
- ✅ Índice compuesto: `(visibilidad, fechaCreacion DESC)`
- ✅ Índice compuesto: `(autorId, fechaCreacion DESC)`
- ✅ Firestore Rules protegen publicaciones privadas
- ✅ Tests de Firestore Rules para visibilidad
- ✅ Tests de que cambiar visibilidad NO borra likes
- ✅ Coverage >= 80%

**UX:**
- ✅ Indicador visual de publicación privada (ícono candado)
- ✅ Confirmación antes de borrar publicación
- ✅ Feedback inmediato al crear/editar/borrar

---

### Sprint 3

**Funcionalidad:**
- ✅ Usuario puede dar "me gusta" a publicaciones públicas ajenas
- ✅ Usuario NO puede dar "me gusta" a publicaciones propias
- ✅ Usuario puede quitar su "me gusta" (toggle)
- ✅ Contador de likes se actualiza en tiempo real
- ✅ Contador de likes se muestra solo si: pública O es autor O es admin
- ✅ Admin puede ver todas las publicaciones (incluidas privadas)
- ✅ Admin puede borrar publicaciones de usuarios normales
- ✅ Admin NO puede borrar publicaciones de otros admins
- ✅ Admin puede borrar cuentas de usuarios normales
- ✅ Admin NO puede borrar cuentas de otros admins
- ✅ Usuario puede borrar su propia cuenta
- ✅ Borrar cuenta ejecuta borrado en cascada (publicaciones + likes)

**Técnico:**
- ✅ Toggle de like usa transacción (like doc + contador)
- ✅ Borrado en cascada implementado correctamente
- ✅ Firestore Rules validan protección entre admins
- ✅ Tests de Firestore Rules para likes y borrado
- ✅ Tests de integración de borrado en cascada
- ✅ Coverage >= 80%

**UX:**
- ✅ Botón de like deshabilitado/oculto en publicaciones propias
- ✅ Botón de like cambia estado visual al dar/quitar
- ✅ Panel de administración con tabs (publicaciones, usuarios)
- ✅ Confirmación antes de borrar cuenta (advertencia de borrado en cascada)

---

### Sprint 4

**Funcionalidad:**
- ✅ Aplicación funciona en mobile, tablet y desktop
- ✅ Todas las pantallas son responsive
- ✅ Navegación es intuitiva y clara

**Técnico:**
- ✅ Coverage de tests >= 80%
- ✅ No hay errores en consola
- ✅ Performance: carga inicial < 2 segundos
- ✅ Lighthouse score: Performance >= 90

**UX:**
- ✅ Diseño visual consistente y profesional
- ✅ Animaciones sutiles y no intrusivas
- ✅ Mensajes de error claros y accionables
- ✅ Accessibility: WCAG 2.1 AA (mínimo)

**Deploy:**
- ✅ Deploy exitoso a Firebase Hosting
- ✅ Variables de entorno configuradas
- ✅ Documentación completa (README, quickstart)

---

## 9. Riesgos y mitigaciones

### Riesgos técnicos

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|--------------|---------|------------|
| RT-01 | Firestore Rules complejas difíciles de mantener | Media | Alto | Tests exhaustivos con Firebase Emulators, documentación clara |
| RT-02 | Borrado en cascada puede ser lento con muchas publicaciones | Baja | Medio | Usar batch writes (máx 500 docs), implementar en Sprint 3 para tener tiempo de optimizar |
| RT-03 | Desnormalización (autorUsername, likesCount) puede desincronizarse | Media | Medio | Usar transacciones atómicas, tests de consistencia |
| RT-04 | Índices compuestos de Firestore tardan en crearse | Baja | Bajo | Crear índices temprano (Sprint 2), esperar antes de deploy |
| RT-05 | Unicidad de username compleja sin backend | Media | Alto | Usar colección auxiliar + transacción (implementar en Sprint 1) |

---

### Riesgos de negocio

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|--------------|---------|------------|
| RN-01 | Usuarios menores de 13 años mintiendo en edad | Alta | Alto | Validación en cliente + Firestore Rules, advertencia clara, sistema de reportes (v2.0) |
| RN-02 | Contenido inapropiado antes de moderación | Media | Alto | Panel de admin (Sprint 3), reportar funcionalidad (v2.0) |
| RN-03 | Falta de notificaciones reduce engagement | Alta | Medio | Aceptado para v1.0, roadmap para v2.0 (si no viola restricciones) |

---

### Riesgos de UX

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|--------------|---------|------------|
| RU-01 | Usuarios confundidos por likes "ocultos" al cambiar a privada | Media | Bajo | Documentar comportamiento en tooltips, mensaje al cambiar visibilidad |
| RU-02 | Usuarios frustrados por no poder editar correo/fecha nacimiento | Media | Bajo | Mensaje claro en perfil: "Estos datos no se pueden modificar" |
| RU-03 | Performance percibida baja sin optimizaciones | Media | Medio | Skeletons, lazy loading, paginación (Sprint 4) |

---

## 10. Entregables

### Por sprint

**Sprint 0:**
- [ ] Proyecto base configurado
- [ ] Firebase Emulators funcionando
- [ ] README.md inicial
- [ ] quickstart.md

**Sprint 1:**
- [ ] Autenticación funcional (registro, login, logout)
- [ ] Recuperación de contraseña
- [ ] Edición de perfil (username, contraseña)
- [ ] Firestore Rules para usuarios
- [ ] Tests de autenticación

**Sprint 2:**
- [ ] Creación y edición de publicaciones
- [ ] Feed público paginado
- [ ] Visualización de publicaciones propias
- [ ] Firestore Rules para publicaciones
- [ ] Índices de Firestore
- [ ] Tests de publicaciones

**Sprint 3:**
- [ ] Sistema de likes (toggle)
- [ ] Panel de administración
- [ ] Borrado de cuenta en cascada
- [ ] Firestore Rules completas
- [ ] Tests de likes y administración

**Sprint 4:**
- [ ] Aplicación responsive
- [ ] Performance optimizado
- [ ] Documentación completa
- [ ] Deploy a producción

---

### Documentos finales

- [x] `plan.md` (este documento)
- [ ] `research.md` (investigación técnica)
- [ ] `data-model.md` (modelo de datos Firestore)
- [ ] `contracts/firestore.rules` (reglas de seguridad)
- [ ] `contracts/services-contract.md` (contrato de servicios)
- [ ] `quickstart.md` (guía de inicio rápido)
- [ ] `README.md` (documentación principal)

---

## Conclusión

Este plan de implementación define una hoja de ruta clara y estructurada para desarrollar **Yumeideas** en 6-8 semanas, distribuido en 4 sprints de 2 semanas cada uno.

**Próximo paso:** Crear `research.md` para investigar soluciones técnicas específicas (unicidad de username, borrado en cascada, etc.) y luego `data-model.md` para definir la estructura exacta de Firestore.

---

**Fecha de creación:** 7 de julio de 2026  
**Versión:** 1.0  
**Estado:** Aprobado  
**Autor:** Equipo Yumeideas  
**Aprobado por:** [Product Owner / Tech Lead]
