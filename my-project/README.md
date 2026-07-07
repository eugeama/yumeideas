# Yumeideas 💡

**Red social de ideas** - Una aplicación web donde los usuarios pueden compartir ideas en formato de publicaciones públicas o privadas.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18+-61dafb?logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-12+-orange?logo=firebase)](https://firebase.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6?logo=typescript)](https://www.typescriptlang.org)

---

## 📋 Descripción

Yumeideas es una red social estilo Twitter donde los usuarios pueden:
- Registrarse y autenticarse con email/contraseña
- Crear publicaciones públicas (visibles en feed general) o privadas (solo visibles en perfil propio)
- Dar y quitar "me gusta" a publicaciones de otros usuarios
- Administrar su perfil (editar username y contraseña)
- Borrar su cuenta (con borrado en cascada de todas sus publicaciones)

Los administradores pueden:
- Moderar publicaciones (borrar contenido inapropiado)
- Borrar cuentas de usuarios
- Ver todas las publicaciones (incluyendo privadas)

---

## 🚀 Características principales

✅ **Autenticación segura** con Firebase Authentication  
✅ **Feed público en tiempo real** con paginación infinita  
✅ **Publicaciones públicas/privadas** con control de visibilidad  
✅ **Sistema de "me gusta"** con contador atómico  
✅ **Perfil de usuario** con edición de username y contraseña  
✅ **Panel de administración** para moderación  
✅ **Borrado en cascada** (usuario → publicaciones → likes)  
✅ **Validación de edad** (≥13 años) mediante Firestore Rules  
✅ **Responsive design** (mobile-first)  

---

## 🛠️ Stack tecnológico

### Frontend
- **React 18+** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **TypeScript** - Tipado estático
- **CSS Modules** - Estilos encapsulados

### Backend (Firebase)
- **Firebase Authentication** - Autenticación de usuarios
- **Cloud Firestore** - Base de datos NoSQL
- **Firestore Security Rules** - Autorización y validación server-side
- **Firebase Hosting** - Hosting estático

### Testing
- **Jest** - Framework de testing
- **React Testing Library** - Testing de componentes
- **@firebase/rules-unit-testing** - Testing de Security Rules
- **Firebase Emulators** - Entorno local de desarrollo

---

## 📁 Estructura del proyecto

```
yumeideas/
├── specs/
│   └── 001-yumeideas-mvp/       # Documentación de planificación MVP
│       ├── constitution.md      # Constitución del proyecto (13 principios)
│       ├── spec.md              # Especificación completa
│       ├── clarify.md           # Ambigüedades resueltas
│       ├── checklist.md         # Checklist de validación
│       ├── plan.md              # Plan de implementación
│       ├── research.md          # Investigación técnica
│       ├── data-model.md        # Modelo de datos Firestore
│       ├── quickstart.md        # Guía de inicio rápido
│       ├── SUMMARY.md           # Resumen ejecutivo
│       └── contracts/
│           ├── firestore.rules      # Reglas de seguridad
│           └── services-contract.md # Contrato de servicios
├── src/
│   ├── domain/                  # Entidades y lógica de negocio
│   ├── application/             # Servicios y casos de uso
│   ├── infrastructure/          # Acceso a Firebase
│   └── ui/                      # Componentes y páginas
├── tests/                       # Tests unitarios e integración
├── firestore.rules              # Reglas de seguridad (deployed)
├── firebase.json                # Configuración de Firebase
└── package.json                 # Dependencias y scripts
```

---

## 🏃 Quickstart

### Requisitos previos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Java JDK >= 11 (para Firebase Emulators)

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/eugeama/yumeideas.git
cd yumeideas

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Firebase

# 4. Instalar Firebase CLI (si no está instalado)
npm install -g firebase-tools
firebase login
firebase use --add

# 5. Iniciar emuladores de Firebase
npm run emulators

# 6. En otra terminal, iniciar app de desarrollo
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

### Scripts disponibles

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Compilar para producción
npm run preview      # Previsualizar build de producción
npm test             # Ejecutar tests
npm run test:watch   # Tests en modo watch
npm run test:coverage # Generar reporte de cobertura
npm run lint         # Ejecutar ESLint
npm run lint:fix     # Corregir errores de ESLint
npm run format       # Formatear código con Prettier
npm run emulators    # Iniciar Firebase Emulators
```

**Para más detalles, ver:** [`specs/001-yumeideas-mvp/quickstart.md`](specs/001-yumeideas-mvp/quickstart.md)

---

## 📚 Documentación

- **[Constitución del proyecto](specs/001-yumeideas-mvp/constitution.md)** - 13 principios constitucionales del proyecto
- **[Especificación completa](specs/001-yumeideas-mvp/spec.md)** - Requisitos funcionales, historias de usuario, requisitos no funcionales
- **[Plan de implementación](specs/001-yumeideas-mvp/plan.md)** - Sprints, estimaciones, dependencias
- **[Modelo de datos](specs/001-yumeideas-mvp/data-model.md)** - Esquema de Firestore, colecciones, índices
- **[Contrato de servicios](specs/001-yumeideas-mvp/contracts/services-contract.md)** - API interna (AuthService, PostService, etc.)
- **[Reglas de seguridad](specs/001-yumeideas-mvp/contracts/firestore.rules)** - Firestore Security Rules
- **[Quickstart](specs/001-yumeideas-mvp/quickstart.md)** - Guía de inicio rápido para desarrolladores
- **[Resumen ejecutivo](specs/001-yumeideas-mvp/SUMMARY.md)** - Resumen de toda la planificación

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage

# Ejecutar tests de Firestore Rules
npm run test:rules
```

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo (Vite) |
| `npm run build` | Compilar para producción |
| `npm run preview` | Previsualizar build de producción |
| `npm test` | Ejecutar tests |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Generar reporte de cobertura |
| `npm run test:rules` | Tests de Security Rules |
| `npm run lint` | Ejecutar ESLint |
| `npm run lint:fix` | Corregir errores de ESLint |
| `npm run format` | Formatear código con Prettier |
| `npm run emulators` | Iniciar Firebase Emulators |

---

## 🏗️ Plan de implementación

El proyecto se divide en **4 sprints** de 1-2 semanas cada uno:

| Sprint | Descripción | Historias de Usuario |
|--------|-------------|----------------------|
| **Sprint 0** | Setup del proyecto | Configuración inicial |
| **Sprint 1** | Autenticación | HU-01, HU-02, HU-13, HU-12 |
| **Sprint 2** | Publicaciones | HU-03, HU-04, HU-05, HU-07 |
| **Sprint 3** | Likes y Admin | HU-06, HU-08, HU-09, HU-10, HU-11 |
| **Sprint 4** | Polish | Optimización, UX, deploy |

**Estimación total:** 6-8 semanas, 74 story points, 254 horas

**Ver detalles completos:** [`specs/001-yumeideas-mvp/plan.md`](specs/001-yumeideas-mvp/plan.md)

---

## 🔐 Seguridad y privacidad

- **Edad mínima:** 13 años (validado en Firestore Rules)
- **Username único:** Garantizado mediante colección auxiliar `usernames` con transacciones
- **Autorización server-side:** Todas las operaciones protegidas por Firestore Rules
- **No self-likes:** No se puede dar like a publicaciones propias (validado en Rules)
- **Protección de admins:** Los admins no pueden borrar cuentas o publicaciones de otros admins
- **Visibilidad de posts:** Publicaciones privadas solo visibles para el autor y admins
- **Borrado en cascada:** Al borrar cuenta, se borran todas las publicaciones y likes automáticamente

---

## 🌐 Arquitectura

Yumeideas sigue los principios de **Domain-Driven Design (DDD)** con 4 capas:

1. **Domain** - Entidades, value objects, enums (lógica de negocio pura)
2. **Application** - Servicios, casos de uso, hooks (orquestación)
3. **Infrastructure** - Repositorios, mappers (acceso a Firebase)
4. **UI** - Componentes, páginas, layouts (presentación)

**Restricción clave:** No hay backend personalizado (Node.js/Express/Java). Toda la lógica del servidor está en **Firestore Security Rules**.

---

## 🤝 Contribuir

1. Hacer fork del repositorio
2. Crear rama para feature: `git checkout -b feature/HU-XX-descripcion`
3. Hacer commits descriptivos: `git commit -m "feat: implementar registro de usuario"`
4. Push a la rama: `git push origin feature/HU-XX-descripcion`
5. Crear Pull Request

**Convención de commits:**
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `test:` Agregar/modificar tests
- `refactor:` Refactorización
- `docs:` Documentación
- `style:` Formato (sin cambio de lógica)

---

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo [LICENSE](LICENSE) para más detalles.

---

## 👥 Equipo

- **Tech Lead:** [Tu nombre]
- **Desarrolladores:** [Nombres del equipo]
- **QA:** [Nombre del QA]

---

## 📞 Contacto

- **Email:** soporte@yumeideas.com
- **Issues:** [GitHub Issues](https://github.com/tu-usuario/yumeideas/issues)

---

## 🙏 Agradecimientos

- Firebase por su plataforma robusta
- React por la excelente biblioteca de UI
- Vite por el build tool increíblemente rápido
- La comunidad open source

---

**Hecho con ❤️ por el equipo Yumeideas**

---

## 🔗 Links útiles

- [Firebase Console](https://console.firebase.google.com/)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
