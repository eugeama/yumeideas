# Tasks - Yumeideas MVP

**Proyecto:** Yumeideas  
**Fecha:** 7 de julio de 2026  
**Versión:** 1.0  
**Propósito:** Descomposición granular de tareas de implementación  
**Documentos base:** spec.md | clarify.md | plan.md | research.md | data-model.md | contracts/

---

## Introducción

Este documento descompone el plan de implementación de Yumeideas en **tareas atómicas** siguiendo 10 fases que respetan la arquitectura **React + Firebase** (sin backend propio, sin Cloud Functions).

### Adaptación de estructura

Yumeideas **no tiene** backend Java/Spring ni base SQL con Flyway. Su "backend" son:
- **Firebase Authentication** (autenticación)
- **Cloud Firestore** (base de datos NoSQL)
- **Firestore Security Rules** (autorización y validación server-side)
- **Firebase Hosting** (hosting estático)

Por eso las 10 fases se reformulan así, respetando el mismo espíritu (dominio y reglas de negocio primero, luego persistencia, luego casos de uso, luego "API" —en este caso reglas de Firestore—, luego tests, luego frontend, luego integración, luego validación e2e):

1. **Setup del proyecto** (React + Firebase)
2. **Modelo de dominio y enums** (lógica de negocio)
3. **Configuración de Firestore** (colecciones, índices, reglas de seguridad)
4. **Servicios de aplicación** (casos de uso)
5. **Contrato de acceso a datos** (Firestore Rules como "API")
6. **Tests** (unitarios, integración, rules)
7. **Setup del frontend** (UI base)
8. **Pantallas frontend** (componentes y páginas)
9. **Integración pantallas–servicios** (conectar UI con lógica)
10. **Validación end-to-end** (según quickstart.md)

### Convenciones

- **[P]** = Paralelizable (puede ejecutarse en paralelo con otras tareas marcadas [P])
- **ID** = Identificador único de tarea (T001, T002, etc.)
- **Archivos** = Archivos principales afectados por la tarea
- **Dependencias** = IDs de tareas que deben completarse antes

---

## Tabla de Contenidos

1. [Fase 1 — Setup del proyecto](#fase-1--setup-del-proyecto-react--firebase)
2. [Fase 2 — Modelo de dominio y enums](#fase-2--modelo-de-dominio-y-enums)
3. [Fase 3 — Configuración de Firestore](#fase-3--configuración-de-firestore-colecciones-índices-reglas-de-seguridad)
4. [Fase 4 — Servicios de aplicación](#fase-4--servicios-de-aplicación-casos-de-uso)
5. [Fase 5 — Contrato de acceso a datos](#fase-5--contrato-de-acceso-a-datos-firestore-rules-como-api)
6. [Fase 6 — Tests](#fase-6--tests)
7. [Fase 7 — Setup del frontend](#fase-7--setup-del-frontend-ui)
8. [Fase 8 — Pantallas frontend](#fase-8--pantallas-frontend)
9. [Fase 9 — Integración pantallas–servicios](#fase-9--integración-pantallasservicios)
10. [Fase 10 — Validación end-to-end](#fase-10--validación-end-to-end-según-quickstartmd)
11. [Resumen de dependencias críticas](#resumen-de-dependencias-críticas)

---

## Fase 1 — Setup del proyecto (React + Firebase)

**Objetivo:** Configurar el entorno de desarrollo base con React, Vite, TypeScript y Firebase SDK cliente.

**Duración estimada:** 1 semana (Sprint 0)

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T001** | Inicializar proyecto React con Vite + TypeScript | `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` | — | Ninguna |
| **T002** | Instalar y configurar SDK cliente de Firebase (`firebase`), **sin** `firebase-admin` ni `firebase-functions` | `package.json` | [P] | T001 |
| **T003** | Crear proyecto en Firebase Console habilitando **solo** Authentication (Email/Password), Firestore y Hosting | (config externa, sin archivo de código) | [P] | Ninguna |
| **T004** | Configurar `infrastructure/firebase/config.ts` con credenciales del proyecto Firebase | `src/infrastructure/firebase/config.ts` | — | T002, T003 |
| **T005** | Configurar variables de entorno para credenciales de Firebase | `.env`, `.env.example`, `.gitignore` | [P] | T003 |
| **T006** | Configurar Firebase Emulator Suite (Auth + Firestore, **sin Functions**) para desarrollo local | `firebase.json`, `.firebaserc` | — | T004 |
| **T007** | Configurar ESLint, Prettier y Husky (pre-commit hooks) | `.eslintrc.js`, `.prettierrc`, `.husky/pre-commit` | [P] | T001 |
| **T008** | Configurar Jest y React Testing Library para tests | `jest.config.js`, `package.json` | [P] | T001 |
| **T009** | Configurar `@firebase/rules-unit-testing` para testing de Firestore Rules | `package.json`, `tests/firestore-rules/setup.ts` | [P] | T006, T008 |
| **T010** | Crear estructura de carpetas base según arquitectura de 4 capas (domain, application, infrastructure, ui) | `src/domain/`, `src/application/`, `src/infrastructure/`, `src/ui/` | — | T001 |

**Entregables:**
- ✅ Proyecto Vite + React + TypeScript funcional
- ✅ Firebase SDK configurado
- ✅ Emulators funcionando
- ✅ Tests configurados (aunque vacíos)
- ✅ Estructura de carpetas creada

---

## Fase 2 — Modelo de dominio y enums

**Objetivo:** Definir entidades de negocio y reglas de dominio **antes** que cualquier persistencia o UI.

**Prioridad:** **ALTA** — El dominio se define primero (Principio 3 de la constitución)

**Duración estimada:** 3-4 días

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T011** | Crear enum `UserRole` con valores `USUARIO = 'usuario'` y `ADMIN = 'admin'` | `src/domain/enums/UserRole.ts` | [P] | T010 |
| **T012** | Crear enum `PostVisibility` con valores `PUBLICA = 'publica'` y `PRIVADA = 'privada'` | `src/domain/enums/PostVisibility.ts` | [P] | T010 |
| **T013** | Crear modelo `Usuario` con reglas propias: cálculo de edad a partir de `fechaNacimiento`, validación de edad mínima (13 años, AMB-09), campos inmutables (`email`, `fechaNacimiento`, `rol`) | `src/domain/models/Usuario.ts` | [P] | T011, T010 |
| **T014** | Crear modelo `Publicacion` con reglas propias: `puedeEditar(usuario)`, `puedeBorrar(usuario)`, `puedeVer(usuario)` según visibilidad y rol | `src/domain/models/Publicacion.ts` | [P] | T012, T013 |
| **T015** | Crear reglas de dominio para "me gusta": un usuario no puede darse like a sí mismo (AMB-05); lógica encapsulada como método de dominio, no en componente UI | `src/domain/rules/likeRules.ts` | [P] | T013, T014 |
| **T016** | Crear reglas de dominio para jerarquía entre administradores: un admin no puede afectar (editar/borrar) a otro admin (AMB-07) | `src/domain/rules/adminRules.ts` | [P] | T013 |
| **T017** | Centralizar validadores reutilizables (username único, edad mínima, formato de email, longitud de contenido) para evitar duplicación (Principio 8) | `src/infrastructure/utils/validators.ts` | — | T013 |

**Entregables:**
- ✅ Enums `UserRole` y `PostVisibility`
- ✅ Modelos `Usuario` y `Publicacion` con lógica de negocio
- ✅ Reglas de dominio para likes y admins
- ✅ Validadores centralizados

---

## Fase 3 — Configuración de Firestore (colecciones, índices, reglas de seguridad)

**Objetivo:** Definir estructura de datos en Firestore y reglas de seguridad server-side.

**Equivalente a:** "Migraciones Flyway y persistencia" en stack Java — pero sin SQL, con colecciones NoSQL + reglas declarativas.

**Duración estimada:** 5-6 días

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T018** | Definir estructura de la colección `/usuarios/{uid}` según `data-model.md`: campos `uid`, `username`, `email`, `fechaNacimiento`, `rol`, `fechaCreacion` | `specs/001-yumeideas-mvp/data-model.md` (referencia) | [P] | T013 |
| **T019** | Definir estructura de la colección auxiliar `/usernames/{username}` con campo `userId` para garantizar unicidad de username (research.md Desafío 1) | `specs/001-yumeideas-mvp/data-model.md` (referencia) | [P] | T018 |
| **T020** | Definir estructura de la colección `/publicaciones/{postId}` con campos: `contenido`, `autorId`, `autorUsername`, `autorRol`, `visibilidad`, `fechaCreacion`, `fechaModificacion`, `likesCount` | `specs/001-yumeideas-mvp/data-model.md` (referencia) | [P] | T014 |
| **T021** | Definir estructura de la subcolección `/publicaciones/{postId}/likes/{userId}` con campos `userId` y `timestamp` | `specs/001-yumeideas-mvp/data-model.md` (referencia) | [P] | T020 |
| **T022** | Escribir `firestore.rules` completo según `contracts/firestore.rules`, implementando helpers: `getUserData()`, `isAdmin()`, `targetIsAdmin()`, `isValidAge()`, `isPublicPost()`, `isPostAuthor()` | `firestore.rules` | — | T018, T019, T020, T021, T016 |
| **T023** | Implementar reglas de CRUD para `/usuarios/{userId}`: lectura pública (autenticado), creación solo propio usuario con validación de edad >= 13, actualización sin modificar `email`/`fechaNacimiento`/`rol`, borrado por propio usuario o admin (con protección entre admins) | `firestore.rules` | — | T022 |
| **T024** | Implementar reglas de CRUD para `/usernames/{username}`: lectura pública (validar disponibilidad), creación/borrado solo por dueño (transacciones), actualización prohibida | `firestore.rules` | — | T022 |
| **T025** | Implementar reglas de CRUD para `/publicaciones/{postId}`: lectura según visibilidad (pública = todos, privada = autor/admin), creación por autenticado, actualización solo por autor (sin modificar `autorId`/`autorUsername`/`fechaCreacion`), borrado por autor o admin (con protección entre admins) | `firestore.rules` | — | T022 |
| **T026** | Implementar reglas de CRUD para `/publicaciones/{postId}/likes/{userId}`: lectura pública, creación solo si post es público y usuario no es autor (AMB-05), borrado solo por propio usuario, actualización prohibida | `firestore.rules` | — | T022 |
| **T027** | Definir índices compuestos en `firestore.indexes.json`: 1) `publicaciones(visibilidad ASC, fechaCreacion DESC)` para feed público, 2) `publicaciones(autorId ASC, fechaCreacion DESC)` para posts de usuario | `firestore.indexes.json` | [P] | T020 |
| **T028** | Desplegar reglas e índices al Emulator Suite para pruebas locales | `firebase.json` (comando: `firebase deploy --only firestore`) | — | T022, T023, T024, T025, T026, T027, T006 |

**Entregables:**
- ✅ Estructura de colecciones documentada
- ✅ `firestore.rules` completo con todos los helpers y reglas de autorización
- ✅ Índices compuestos definidos
- ✅ Reglas e índices desplegados al Emulator Suite

---

## Fase 4 — Servicios de aplicación (casos de uso)

**Objetivo:** Implementar casos de uso que coordinan lógica de dominio + acceso a Firestore.

**Equivalente a:** "Servicios de aplicación" del stack Java — coordinan casos de uso, **sin lógica de negocio propia** (esa vive en `domain/`).

**Duración estimada:** 1.5 semanas

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T029** ✅ | `authService.register()`: crea cuenta en Auth + documento en `/usuarios/{uid}` + reserva de username en `/usernames/{username}` en una **transacción**, valida edad >= 13 delegando a `validators.ts` | `src/application/services/authService.ts` | — | T004, T013, T017, T022, T023, T024 |
| **T030** ✅ | `authService.login()`: autenticación con email/password usando Firebase Auth SDK | `src/application/services/authService.ts` | [P] | T029 |
| **T031** ✅ | `authService.logout()`: cierre de sesión | `src/application/services/authService.ts` | [P] | T029 |
| **T032** ✅ | `authService.sendPasswordReset()`: envío de email de recuperación (AMB-04) usando Firebase Auth `sendPasswordResetEmail()` | `src/application/services/authService.ts` | [P] | T029 |
| **T033** ✅ | `authService.getCurrentUser()`: obtener usuario autenticado actual | `src/application/services/authService.ts` | [P] | T029 |
| **T034** ✅ | `userService.getUserData()`: obtener datos de perfil de un usuario desde `/usuarios/{uid}` | `src/application/services/userService.ts` | [P] | T004, T018 |
| **T035** ✅ | `userService.updateUsername()`: cambiar username con **transacción** que libera username anterior, reserva nuevo, actualiza `/usuarios/{uid}` y actualiza `autorUsername` en todas las publicaciones del usuario (research.md Desafío 1) | `src/application/services/userService.ts` | — | T034, T019, T023, T024 |
| **T036** ✅ | `userService.updatePassword()`: cambiar contraseña con re-autenticación usando `reauthenticateWithCredential()` y `updatePassword()` | `src/application/services/userService.ts` | [P] | T034 |
| **T037** ✅ | `userService.deleteAccount()`: borrado en cascada (usuario, reserva username, publicaciones, likes) usando `writeBatch`, para cuenta propia o por admin validando protección entre admins (AMB-02, AMB-07) | `src/application/services/userService.ts` | — | T034, T016, T023, T024, T025 |
| **T038** ✅ | `postService.createPost()`: crear publicación validando contenido no vacío, delegando reglas de negocio a modelo `Publicacion` | `src/application/services/postService.ts` | [P] | T014, T017, T025 |
| **T039** ✅ | `postService.updatePost()`: actualizar contenido y/o visibilidad de publicación propia, validando con `Publicacion.puedeEditar()` | `src/application/services/postService.ts` | [P] | T038 |
| **T040** ✅ | `postService.deletePost()`: borrar publicación propia o ajena (admin), validando con `Publicacion.puedeBorrar()` y protección entre admins | `src/application/services/postService.ts` | [P] | T038, T016 |
| **T041** ✅ | `postService.getPublicFeed()`: consulta paginada de publicaciones públicas usando índice `(visibilidad ASC, fechaCreacion DESC)` con cursores Firestore (research.md Desafío 4) | `src/application/services/postService.ts` | [P] | T027, T038 |
| **T042** ✅ | `postService.getUserPosts()`: consulta de publicaciones de un usuario específico (públicas + privadas si es propio usuario o admin) usando índice `(autorId ASC, fechaCreacion DESC)` | `src/application/services/postService.ts` | [P] | T027, T038 |
| **T043** ✅ | `postService.getAllPostsForAdmin()`: consulta de **todas** las publicaciones (públicas + privadas) solo para admin, sin filtro de visibilidad | `src/application/services/postService.ts` | [P] | T038 |
| **T044** ✅ | `likeService.toggleLike()`: transacción atómica que crea/borra documento de like en `/publicaciones/{postId}/likes/{userId}` y actualiza `likesCount` con `FieldValue.increment()`, aplicando reglas de `likeRules.ts` (no like a propio post, solo posts públicos) (AMB-05, AMB-06, research.md Desafío 3) | `src/application/services/likeService.ts` | — | T015, T021, T026 |
| **T045** ✅ | `likeService.hasUserLiked()`: verificar si un usuario ya dio like a una publicación consultando documento en subcolección | `src/application/services/likeService.ts` | [P] | T044 |

**Entregables:**
- ✅ `authService` completo (registro, login, logout, reset password)
- ✅ `userService` completo (perfil, cambio username/password, borrado cuenta)
- ✅ `postService` completo (CRUD posts, feed, posts de usuario, posts admin)
- ✅ `likeService` completo (toggle like, verificar like)

---

## Fase 5 — Contrato de acceso a datos (Firestore Rules como "API")

**Objetivo:** Validar y documentar el contrato de operaciones permitidas por Firestore Rules (equivalente a endpoints REST en stack tradicional).

**Equivalente a:** "API REST" — pero no hay controladores; el contrato ya está implementado en `firestore.rules` (Fase 3). Esta fase valida y documenta ese contrato.

**Duración estimada:** 2-3 días

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T046** ✅ | Documentar el contrato final de operaciones permitidas por colección según `contracts/services-contract.md`, verificando que cada servicio de Fase 4 tiene su regla correspondiente en `firestore.rules` | `specs/001-yumeideas-mvp/contracts/services-contract.md` (actualización) | — | T022–T028, T029–T045 |
| **T047** ✅ | Revisar que ningún servicio de `application/services/` haga una operación no cubierta o contradictoria con `firestore.rules` (auditoría cruzada) | (checklist interno, sin archivo nuevo) | — | T046 |
| **T048** ✅ | Verificar que todos los códigos de error documentados en `services-contract.md` están correctamente mapeados en los servicios | `src/application/services/*.ts` | — | T046 |

**Entregables:**
- ✅ Contrato de servicios actualizado y validado
- ✅ Auditoría cruzada entre servicios y rules completada
- ✅ Códigos de error consistentes

---

## Fase 6 — Tests

**Objetivo:** Testear reglas de negocio del dominio, servicios de aplicación y Firestore Rules.

**Prioridad:** **ALTA** junto con el dominio — cada regla de negocio importante debe tener test (Principio 9).

**Duración estimada:** 1.5 semanas (en paralelo con Fase 4 y 7)

### Tests unitarios de dominio

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T049** ✅ | Tests unitarios de `Usuario`: edad mínima 13 años (`calcularEdad()`, `esEdadValida()`), inmutabilidad de `email`/`fechaNacimiento`/`rol` | `src/domain/models/Usuario.test.ts` | [P] | T013 |
| **T050** ✅ | Tests unitarios de `Publicacion`: `puedeEditar()` (solo autor), `puedeBorrar()` (autor o admin, protección entre admins), `puedeVer()` (pública = todos, privada = autor/admin) | `src/domain/models/Publicacion.test.ts` | [P] | T014, T016 |
| **T051** ✅ | Tests unitarios de `likeRules.ts`: `puedeHacerLike()` rechaza si usuario es autor del post (AMB-05) | `src/domain/rules/likeRules.test.ts` | [P] | T015 |
| **T052** ✅ | Tests unitarios de `adminRules.ts`: `adminPuedeAfectarUsuario()` rechaza si target es admin (AMB-07) | `src/domain/rules/adminRules.test.ts` | [P] | T016 |

### Tests de servicios de aplicación

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T053** | Tests de `authService.register()`: rechaza menores de 13 años, rechaza usernames duplicados, crea usuario + documento + reserva username en transacción | `src/application/services/authService.test.ts` | [P] | T029 |
| **T054** | Tests de `authService.login()`: autenticación exitosa con credenciales válidas, rechazo con credenciales inválidas | `src/application/services/authService.test.ts` | [P] | T030 |
| **T055** | Tests de `authService.sendPasswordReset()`: envío exitoso de email, manejo de email no encontrado | `src/application/services/authService.test.ts` | [P] | T032 |
| **T056** | Tests de `userService.updateUsername()`: transacción libera anterior y reserva nuevo, actualiza `autorUsername` en publicaciones, rechaza username duplicado | `src/application/services/userService.test.ts` | [P] | T035 |
| **T057** | Tests de `userService.deleteAccount()`: borrado en cascada de usuario, username, publicaciones y likes; admin puede borrar usuario normal pero no otro admin | `src/application/services/userService.test.ts` | [P] | T037 |
| **T058** | Tests de `postService`: crear/actualizar/borrar publicación respetando permisos (autor, admin, protección entre admins) | `src/application/services/postService.test.ts` | [P] | T038, T039, T040 |
| **T059** | Tests de `postService.getPublicFeed()`: solo retorna publicaciones públicas, ordenadas por fecha descendente, paginación con cursor funciona | `src/application/services/postService.test.ts` | [P] | T041 |
| **T060** | Tests de `postService.getUserPosts()`: usuario normal ve solo sus posts (públicos + privados), admin ve posts privados de cualquier usuario | `src/application/services/postService.test.ts` | [P] | T042 |
| **T061** | Tests de `likeService.toggleLike()`: da/quita like correctamente, actualiza `likesCount`, rechaza like a propio post, rechaza like a post privado | `src/application/services/likeService.test.ts` | [P] | T044 |

### Tests de Firestore Rules

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T062** | Tests de reglas de `/usuarios/{userId}`: usuario puede crear solo su propio documento con edad >= 13, puede actualizar sin modificar `email`/`fechaNacimiento`/`rol`, puede borrar su cuenta, admin puede borrar cuenta ajena pero no de otro admin | `tests/firestore-rules/usuarios.rules.test.ts` | [P] | T023, T009 |
| **T063** | Tests de reglas de `/usernames/{username}`: usuario puede crear/borrar solo su propia reserva, cualquier autenticado puede leer para validar disponibilidad | `tests/firestore-rules/usernames.rules.test.ts` | [P] | T024, T009 |
| **T064** | Tests de reglas de `/publicaciones/{postId}`: post privado solo visible por autor/admin, usuario puede crear post, solo autor puede actualizar (sin modificar `autorId`/`autorUsername`), autor o admin puede borrar (con protección entre admins) | `tests/firestore-rules/publicaciones.rules.test.ts` | [P] | T025, T009 |
| **T065** | Tests de reglas de `/publicaciones/{postId}/likes/{userId}`: usuario puede dar like solo a posts públicos y solo si no es el autor, puede quitar su propio like | `tests/firestore-rules/likes.rules.test.ts` | [P] | T026, T009 |
| **T066** | Tests de protección entre admins en Firestore Rules: admin no puede borrar ni actualizar usuario/publicación de otro admin | `tests/firestore-rules/admin-protection.rules.test.ts` | [P] | T023, T025, T009 |

### Tests de integración

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T067** | Test de integración: flujo completo de registro → login → crear publicación → dar like → borrar cuenta en cascada (contra Emulator Suite) | `tests/integration/flujo-completo.test.ts` | — | T029–T045, T062–T066 |
| **T068** | Test de integración: cambio de username actualiza `autorUsername` en publicaciones existentes | `tests/integration/cambio-username.test.ts` | — | T035, T067 |
| **T069** | Test de integración: borrado de publicación incluye borrado de likes en subcolección | `tests/integration/borrado-publicacion.test.ts` | — | T040, T067 |

**Entregables:**
- ✅ Tests unitarios de dominio (4 archivos)
- ✅ Tests de servicios (8 archivos)
- ✅ Tests de Firestore Rules (5 archivos)
- ✅ Tests de integración (3 archivos)
- ✅ Coverage >= 80% en reglas de negocio críticas

---

## Fase 7 — Setup del frontend (UI)

**Objetivo:** Configurar estructura base de la UI (router, contextos, rutas protegidas, estilos).

**Duración estimada:** 3-4 días

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T070** ✅ | Instalar y configurar React Router v6 | `package.json`, `src/App.tsx` | — | T001 |
| **T071** ✅ | Configurar rutas de la aplicación (públicas: login, register, forgot-password; protegidas: feed, profile, admin) | `src/routes.tsx`, `src/App.tsx` | — | T070 |
| **T072** ✅ | Crear contexto/hook de sesión (`useAuth`) que expone usuario actual, rol, estado de carga, métodos login/logout | `src/ui/hooks/useAuth.tsx`, `src/ui/context/AuthContext.tsx` | [P] | T029, T030, T031, T033 |
| **T073** ✅ | Crear componente de ruta protegida que redirige a login si no hay sesión | `src/ui/components/ProtectedRoute.tsx` | [P] | T072 |
| **T074** ✅ | Crear componente de ruta de solo-admin que redirige a feed si no es admin | `src/ui/components/AdminRoute.tsx` | [P] | T072 |
| **T075** ✅ | Configurar estilos base (CSS Modules o CSS simple, sin librería de componentes pesada) | `src/ui/styles/global.css`, `src/ui/styles/variables.css` | [P] | T001 |
| **T076** ✅ | Crear componentes comunes reutilizables: `Button`, `Input`, `Modal`, `Loading`, `ErrorMessage` | `src/ui/components/common/*.tsx` | [P] | T075 |
| **T077** ✅ | Crear layout base con header/navbar/footer | `src/ui/components/layout/Header.tsx`, `Navbar.tsx`, `Footer.tsx` | [P] | T076 |

**Entregables:**
- ✅ React Router configurado
- ✅ Rutas públicas y protegidas definidas
- ✅ Hook `useAuth` funcional
- ✅ Componentes de ruta protegida (`ProtectedRoute`, `AdminRoute`)
- ✅ Estilos base y componentes comunes
- ✅ Layout base

---

## Fase 8 — Pantallas frontend

**Objetivo:** Crear componentes de páginas (sin conectar con servicios todavía, solo UI).

**Duración estimada:** 1 semana

### Pantallas de autenticación

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T078** | Pantalla de registro con formulario: username, email, password, fecha nacimiento; validación cliente de edad >= 13 | `src/ui/pages/RegisterPage.tsx` | [P] | T076, T017 |
| **T079** | Pantalla de login con formulario: email, password | `src/ui/pages/LoginPage.tsx` | [P] | T076 |
| **T080** | Pantalla de recuperación de contraseña con formulario: email | `src/ui/pages/ForgotPasswordPage.tsx` | [P] | T076 |

### Pantallas de publicaciones

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T081** | Pantalla de feed público paginado (scroll infinito o botón "cargar más") | `src/ui/pages/FeedPage.tsx` | [P] | T076, T077 |
| **T082** | Pantalla de perfil propio con tabs: "Mis publicaciones públicas" y "Mis publicaciones privadas" | `src/ui/pages/ProfilePage.tsx` | [P] | T076, T077 |
| **T083** | Formulario de creación/edición de publicación con: textarea de contenido, toggle de visibilidad (público/privado), botones guardar/cancelar | `src/ui/components/post/PostForm.tsx` | [P] | T076 |
| **T084** | Componente de tarjeta de publicación mostrando: contenido, autor (username + badge si admin), fecha, contador de likes, botón de like (corazón), botón de editar (solo si es propio), botón de borrar (si es propio o admin) | `src/ui/components/post/PostCard.tsx` | [P] | T076 |
| **T085** | Componente de lista de publicaciones (reutilizable para feed, perfil, admin) | `src/ui/components/post/PostList.tsx` | [P] | T084 |

### Pantallas de administración

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T086** | Pantalla de panel de administración con: listado global de publicaciones (públicas + privadas), filtros por visibilidad/autor, botones de borrar publicación, botones de borrar cuenta de usuario | `src/ui/pages/AdminPanelPage.tsx` | [P] | T076, T077, T085 |

### Pantallas de perfil

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T087** | Pantalla de edición de perfil con formularios: cambiar username, cambiar contraseña, botón de borrar cuenta (con confirmación) | `src/ui/pages/EditProfilePage.tsx` | [P] | T076, T077 |

**Entregables:**
- ✅ 3 pantallas de autenticación (register, login, forgot-password)
- ✅ 2 pantallas de publicaciones (feed, profile)
- ✅ 3 componentes de publicaciones (PostForm, PostCard, PostList)
- ✅ 1 pantalla de administración (admin panel)
- ✅ 1 pantalla de edición de perfil

---

## Fase 9 — Integración pantallas–servicios

**Objetivo:** Conectar componentes de UI con servicios de aplicación, implementando lógica de interacción.

**Duración estimada:** 1.5 semanas

### Integración de autenticación

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T088** | Conectar `RegisterPage` con `authService.register()`: validación de formulario, llamada al servicio, manejo de errores (`username-already-taken`, `invalid-age`, `auth/email-already-in-use`), estados de carga, redirección al feed tras éxito | `src/ui/pages/RegisterPage.tsx` | — | T078, T029 |
| **T089** | Conectar `LoginPage` con `authService.login()`: validación de formulario, llamada al servicio, manejo de errores (`auth/user-not-found`, `auth/wrong-password`), estados de carga, redirección al feed tras éxito | `src/ui/pages/LoginPage.tsx` | — | T079, T030 |
| **T090** | Conectar `ForgotPasswordPage` con `authService.sendPasswordReset()`: validación de email, llamada al servicio, mensaje de éxito/error, estado de carga | `src/ui/pages/ForgotPasswordPage.tsx` | — | T080, T032 |

### Integración de publicaciones

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T091** | Conectar `FeedPage` con `postService.getPublicFeed()`: carga inicial de posts, scroll infinito con cursor de paginación, estados de carga/vacío/error | `src/ui/pages/FeedPage.tsx` | — | T081, T041 |
| **T092** | Conectar `ProfilePage` con `postService.getUserPosts()`: carga de posts propios (públicos + privados), tabs separados, estados de carga/vacío | `src/ui/pages/ProfilePage.tsx` | — | T082, T042 |
| **T093** | Conectar `PostForm` con `postService.createPost()` y `postService.updatePost()`: validación de contenido (no vacío, máx. 500 caracteres), manejo de errores, estados de carga, actualización de lista tras éxito | `src/ui/components/post/PostForm.tsx` | — | T083, T038, T039 |
| **T094** | Conectar `PostCard` botón de borrar con `postService.deletePost()`: confirmación antes de borrar, manejo de permisos (ocultar si no es autor ni admin), actualización de lista tras éxito | `src/ui/components/post/PostCard.tsx` | — | T084, T040 |
| **T095** | Conectar `PostCard` botón de like con `likeService.toggleLike()`: estado optimista (actualiza UI inmediatamente), rollback si falla, ocultar/deshabilitar si es propio post o post privado | `src/ui/components/post/PostCard.tsx` | — | T084, T044 |
| **T096** | Implementar lógica de visibilidad de botones en `PostCard`: mostrar editar/borrar solo si `Publicacion.puedeEditar()` / `puedeBorrar()` retornan true, mostrar like solo si no es propio post | `src/ui/components/post/PostCard.tsx` | — | T095, T014, T015 |

### Integración de administración

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T097** | Conectar `AdminPanelPage` con `postService.getAllPostsForAdmin()`: carga de todas las publicaciones (públicas + privadas), filtros de visibilidad/autor, estados de carga | `src/ui/pages/AdminPanelPage.tsx` | — | T086, T043 |
| **T098** | Conectar `AdminPanelPage` botón de borrar publicación con `postService.deletePost()`: validación de permisos (ocultar si autor es otro admin por AMB-07), confirmación, actualización de lista | `src/ui/pages/AdminPanelPage.tsx` | — | T097, T040, T016 |
| **T099** | Conectar `AdminPanelPage` botón de borrar cuenta con `userService.deleteAccount()`: validación de permisos (ocultar si target es otro admin por AMB-07), confirmación, actualización de lista | `src/ui/pages/AdminPanelPage.tsx` | — | T097, T037, T016 |

### Integración de perfil

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T100** | Conectar `EditProfilePage` formulario de cambio de username con `userService.updateUsername()`: validación de formato, manejo de error `username-already-taken`, confirmación, actualización de contexto de sesión | `src/ui/pages/EditProfilePage.tsx` | — | T087, T035 |
| **T101** | Conectar `EditProfilePage` formulario de cambio de contraseña con `userService.updatePassword()`: validación de contraseña actual, manejo de error `auth/wrong-password`, confirmación | `src/ui/pages/EditProfilePage.tsx` | — | T087, T036 |
| **T102** | Conectar `EditProfilePage` botón de borrar cuenta con `userService.deleteAccount()`: doble confirmación (modal + input "BORRAR"), borrado en cascada, logout y redirección a página de despedida | `src/ui/pages/EditProfilePage.tsx` | — | T087, T037 |

### Validación de permisos en UI

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T103** | Auditoría de toda la UI: verificar que las acciones no permitidas (editar post ajeno, admin sobre otro admin, like a uno mismo, modificar `email`/`fechaNacimiento`/`rol`) estén **deshabilitadas u ocultas**, no solo bloqueadas por Firestore Rules | `src/ui/pages/*`, `src/ui/components/*` | — | T088–T102 |

**Entregables:**
- ✅ Autenticación integrada (registro, login, reset password)
- ✅ Feed público integrado con paginación
- ✅ Perfil de usuario integrado (ver posts, crear, editar, borrar)
- ✅ Likes integrados con estado optimista
- ✅ Panel de admin integrado (ver todas las publicaciones, borrar posts, borrar cuentas)
- ✅ Edición de perfil integrada (username, password, borrar cuenta)
- ✅ Validación de permisos en UI completada

---

## Fase 10 — Validación end-to-end según quickstart.md

**Objetivo:** Ejecutar flujos completos de prueba manual siguiendo la guía de `quickstart.md` para validar el sistema end-to-end.

**Duración estimada:** 3-4 días

| ID | Tarea | Archivos | Paralelizable | Dependencias |
|---|---|---|---|---|
| **T104** | Ejecutar el flujo de `quickstart.md`: iniciar emuladores, ejecutar app, crear dos usuarios (uno mayor de 13 años, intentar uno menor simulando fecha de nacimiento futura) y verificar rechazo del menor | `validacion-e2e.md` (documento de resultados) | — | T067, T103 |
| **T105** | Crear publicaciones pública y privada con usuario 1; verificar que usuario 2 ve solo la pública en el feed | `validacion-e2e.md` | — | T104 |
| **T106** | Dar like desde usuario 2 a la publicación pública de usuario 1; verificar que el contador aumenta; intentar dar like a su propia publicación y verificar que está deshabilitado | `validacion-e2e.md` | — | T105 |
| **T107** | Quitar like de usuario 2 a la publicación pública de usuario 1 (toggle); verificar que el contador disminuye | `validacion-e2e.md` | — | T106 |
| **T108** | Crear un admin manualmente en Firestore Console (según AMB-03): registrar usuario normal, ir a Firestore Console, editar documento en `/usuarios/{uid}`, cambiar campo `rol` de `'usuario'` a `'admin'`; verificar que el admin ve la publicación privada de usuario 1 en el panel de administración | `validacion-e2e.md` | — | T107 |
| **T109** | Verificar que el admin puede borrar la publicación pública de usuario 1 pero **no** puede editarla (botón de editar no aparece) | `validacion-e2e.md` | — | T108 |
| **T110** | Crear un segundo admin manualmente; verificar que admin 1 **no** puede borrar publicaciones ni cuenta de admin 2 (botones no aparecen, AMB-07) | `validacion-e2e.md` | — | T109 |
| **T111** | Cambiar username de usuario 1; verificar que `autorUsername` se actualiza en todas sus publicaciones existentes | `validacion-e2e.md` | — | T110 |
| **T112** | Borrar la cuenta de usuario 1; verificar el borrado en cascada de: documento en `/usuarios/{uid}`, reserva en `/usernames/{username}`, todas sus publicaciones, todos los likes en sus publicaciones (subcolección) | `validacion-e2e.md` | — | T111 |
| **T113** | Ejecutar todos los tests automatizados (unitarios, integración, rules) y verificar que pasan al 100% | (resultados de `npm test`) | — | T049–T069 |
| **T114** | Documentar resultados de T104–T113 en un checklist final de validación e2e con capturas de pantalla y logs de consola | `validacion-e2e.md` | — | T112, T113 |

**Entregables:**
- ✅ Documento `validacion-e2e.md` con todos los flujos validados
- ✅ Capturas de pantalla de cada escenario
- ✅ Logs de consola de Firebase Emulator
- ✅ Confirmación de que todos los tests automatizados pasan
- ✅ Sistema validado y listo para deploy

---

## Resumen de dependencias críticas

### Camino principal de implementación

```
SETUP
T001 (Vite+React+TS)
  ↓
T002 (Firebase SDK) + T003 (Firebase Console)
  ↓
T004 (Config Firebase)
  ↓
T006 (Emulators) + T010 (Estructura carpetas)

DOMINIO
T011/T012 (Enums)
  ↓
T013 (Usuario) + T014 (Publicacion)
  ↓
T015 (likeRules) + T016 (adminRules) + T017 (validators)

FIRESTORE
T018/T019/T020/T021 (Estructura colecciones)
  ↓
T022 (firestore.rules base)
  ↓
T023/T024/T025/T026 (Reglas CRUD)
  ↓
T027 (Índices) + T028 (Deploy)

SERVICIOS
T029 (authService.register)
  ↓
T030/T031/T032/T033 (resto de authService)
T034 (userService.getUserData)
  ↓
T035/T036/T037 (resto de userService)
T038 (postService.createPost)
  ↓
T039/T040/T041/T042/T043 (resto de postService)
T044/T045 (likeService)

TESTS (en paralelo con SERVICIOS)
T049–T069 (tests de dominio, servicios, rules, integración)

FRONTEND UI
T070/T071 (Router)
  ↓
T072 (useAuth) → T073/T074 (ProtectedRoute/AdminRoute)
  ↓
T076 (Componentes comunes) + T077 (Layout)
  ↓
T078–T087 (Pantallas)

INTEGRACIÓN
T088–T103 (Conectar pantallas con servicios)

VALIDACIÓN E2E
T104–T114 (Flujos completos + documentación)
```

### Paralelización posible

- **Fase 2 (Dominio):** T011, T012, T013, T014, T015, T016 pueden ejecutarse en paralelo después de T010
- **Fase 3 (Firestore):** T018, T019, T020, T021 pueden ejecutarse en paralelo; T027 en paralelo con T023–T026
- **Fase 4 (Servicios):** Grupos paralelos dentro de cada servicio (auth, user, post, like)
- **Fase 6 (Tests):** Todos los tests unitarios y de rules pueden ejecutarse en paralelo entre sí
- **Fase 8 (Pantallas):** T078–T087 pueden ejecutarse en paralelo después de T076–T077

### Ruta crítica

**Setup → Dominio → Firestore → Servicios → Integración → Validación**

Tiempo mínimo estimado (sin paralelización): **6-8 semanas**  
Tiempo optimizado (con paralelización): **4-6 semanas**

---

## Notas finales

### Principios respetados

✅ **Dominio primero:** Fase 2 (modelos + reglas) antes que persistencia  
✅ **Tests obligatorios:** Fase 6 cubre unitarios, integración y rules  
✅ **Separación de responsabilidades:** 4 capas (domain, application, infrastructure, ui)  
✅ **Sin backend propio:** Solo Firebase SDK cliente, sin Cloud Functions  
✅ **Firestore Rules como "API":** Validación server-side en rules, no en backend  
✅ **Validación doble:** Cliente (UX) + servidor (security)  
✅ **Transacciones atómicas:** Username único, toggle de likes, borrado en cascada  

### Archivos generados

Este documento (`tasks.md`) debe ubicarse en:
```
specs/001-yumeideas-mvp/tasks.md
```

Junto con:
- `spec.md` (especificación completa)
- `clarify.md` (ambigüedades resueltas)
- `plan.md` (roadmap de sprints)
- `research.md` (soluciones técnicas)
- `data-model.md` (esquema Firestore)
- `contracts/firestore.rules` (reglas de seguridad)
- `contracts/services-contract.md` (contrato de servicios)
- `quickstart.md` (guía de setup)

---

**No se implementó código todavía, conforme a la constitución del proyecto.**

**Estado:** ✅ Documento de tasks completo y listo para implementación

**Fecha de generación:** 7 de julio de 2026  
**Versión:** 1.0  
**Autor:** Sistema de planificación Yumeideas
