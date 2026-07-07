# Quickstart - Yumeideas

**Proyecto:** Yumeideas  
**Propósito:** Guía rápida para desarrolladores (setup local, emuladores, tests)  
**Tiempo estimado:** 15-20 minutos

---

## Tabla de Contenidos

1. [Requisitos previos](#1-requisitos-previos)
2. [Instalación inicial](#2-instalación-inicial)
3. [Configuración de Firebase](#3-configuración-de-firebase)
4. [Ejecutar emuladores locales](#4-ejecutar-emuladores-locales)
5. [Ejecutar aplicación en desarrollo](#5-ejecutar-aplicación-en-desarrollo)
6. [Ejecutar tests](#6-ejecutar-tests)
7. [Estructura del proyecto](#7-estructura-del-proyecto)
8. [Flujo de trabajo Git](#8-flujo-de-trabajo-git)
9. [Comandos útiles](#9-comandos-útiles)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.0.0 ([descarga](https://nodejs.org/))
- **npm** >= 9.0.0 (viene con Node.js)
- **Git** >= 2.30.0 ([descarga](https://git-scm.com/))
- **Java JDK** >= 11 (para Firebase Emulators) ([descarga](https://adoptium.net/))
- **Editor de código:** VS Code recomendado ([descarga](https://code.visualstudio.com/))

**Verificar versiones:**
```bash
node -v    # Debe mostrar v18.x.x o superior
npm -v     # Debe mostrar 9.x.x o superior
git --version
java -version  # Debe mostrar version 11 o superior
```

---

## 2. Instalación inicial

### 2.1. Clonar repositorio

```bash
git clone https://github.com/tu-usuario/yumeideas.git
cd yumeideas
```

### 2.2. Instalar dependencias

```bash
npm install
```

Esto instalará:
- React 18+
- Vite
- TypeScript
- Firebase SDK
- Jest & React Testing Library
- ESLint & Prettier

**Tiempo aproximado:** 2-3 minutos

---

## 3. Configuración de Firebase

### 3.1. Crear proyecto en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Clic en "Agregar proyecto"
3. Nombre: `yumeideas-dev` (para desarrollo)
4. Deshabilitar Google Analytics (opcional)
5. Clic en "Crear proyecto"

### 3.2. Habilitar servicios necesarios

**Authentication:**
1. En Firebase Console, ve a "Authentication" → "Sign-in method"
2. Habilitar "Email/Password"

**Firestore Database:**
1. Ve a "Firestore Database" → "Crear base de datos"
2. Seleccionar modo "Producción"
3. Región: `southamerica-east1` (São Paulo)

**Hosting:**
1. Ve a "Hosting" → "Comenzar"
2. Seguir los pasos (la configuración ya está en `firebase.json`)

### 3.3. Obtener credenciales

1. En Firebase Console, ve a "Configuración del proyecto" (icono de engranaje)
2. En "Tus apps", clic en "Agregar app" → Seleccionar "Web"
3. Registrar app con nombre "Yumeideas Web"
4. Copiar el objeto `firebaseConfig`

### 3.4. Configurar variables de entorno

Crear archivo `.env.local` en la raíz del proyecto:

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:

```
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

**⚠️ IMPORTANTE:** Nunca subir `.env.local` a Git (ya está en `.gitignore`)

### 3.5. Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

Iniciar sesión:

```bash
firebase login
```

Vincular proyecto local con Firebase:

```bash
firebase use --add
# Seleccionar el proyecto "yumeideas-dev"
# Alias: "default"
```

---

## 4. Ejecutar emuladores locales

Los **Firebase Emulators** permiten desarrollar localmente sin afectar la base de datos de producción.

### 4.1. Iniciar emuladores

```bash
npm run emulators
```

Esto inicia:
- **Authentication Emulator** (puerto 9099)
- **Firestore Emulator** (puerto 8080)
- **Emulator UI** (puerto 4000) - interfaz web para visualizar datos

### 4.2. Acceder a Emulator UI

Abre en el navegador:
```
http://localhost:4000
```

Desde aquí puedes:
- Ver usuarios registrados
- Consultar/modificar documentos en Firestore
- Depurar Security Rules

### 4.3. Detener emuladores

Presionar `Ctrl+C` en la terminal donde se ejecutan los emuladores.

---

## 5. Ejecutar aplicación en desarrollo

En una **nueva terminal** (mantener emuladores corriendo en otra):

```bash
npm run dev
```

Esto inicia el servidor de desarrollo de Vite:
- **URL:** `http://localhost:5173`
- **Hot Module Replacement (HMR):** Los cambios se reflejan automáticamente

### 5.1. Verificar configuración

1. Abrir `http://localhost:5173`
2. Deberías ver la pantalla de registro/login
3. Crear un usuario de prueba:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
   - Fecha de nacimiento: `01/01/2005`

4. Si el registro funciona, ¡todo está configurado correctamente! ✅

---

## 6. Ejecutar tests

Yumeideas usa **Jest** y **React Testing Library** para tests unitarios e integración.

### 6.1. Ejecutar todos los tests

```bash
npm test
```

### 6.2. Ejecutar tests en modo watch

```bash
npm run test:watch
```

### 6.3. Ejecutar tests con coverage

```bash
npm run test:coverage
```

### 6.4. Ejecutar tests de Firestore Rules

```bash
npm run test:rules
```

Esto ejecuta los tests de seguridad definidos en `tests/firestore.rules.test.ts` usando `@firebase/rules-unit-testing`.

**Requisito:** Emuladores deben estar corriendo.

---

## 7. Estructura del proyecto

```
yumeideas/
├── .github/
│   └── prompts/                 # Prompts de especificación
│       └── speckit.*.prompt.md
├── .specify/                    # Documentación de planificación
│   ├── spec.md                  # Especificación completa
│   ├── clarify.md               # Ambigüedades resueltas
│   ├── plan.md                  # Plan de implementación
│   ├── research.md              # Investigación técnica
│   ├── data-model.md            # Modelo de datos Firestore
│   ├── checklist.md             # Checklist de validación
│   ├── quickstart.md            # Esta guía
│   └── contracts/
│       ├── firestore.rules      # Reglas de seguridad
│       └── services-contract.md # Contrato de servicios
├── src/
│   ├── domain/                  # Capa de dominio
│   │   ├── entities/            # Entidades (Usuario, Publicacion)
│   │   ├── value-objects/       # Objetos de valor
│   │   └── enums/               # Enums (UserRole, PostVisibility)
│   ├── application/             # Capa de aplicación
│   │   ├── services/            # Servicios (authService, postService, etc.)
│   │   └── hooks/               # Custom hooks (useAuth, usePosts, etc.)
│   ├── infrastructure/          # Capa de infraestructura
│   │   ├── firebase/            # Configuración de Firebase
│   │   ├── repositories/        # Repositorios (acceso a Firestore)
│   │   └── mappers/             # Mappers (DTO ↔ Entidad)
│   ├── ui/                      # Capa de presentación
│   │   ├── components/          # Componentes reutilizables
│   │   ├── pages/               # Páginas (Login, Feed, Profile, etc.)
│   │   ├── layouts/             # Layouts
│   │   └── styles/              # Estilos globales
│   ├── App.tsx                  # Componente raíz
│   └── main.tsx                 # Entry point
├── tests/                       # Tests
│   ├── unit/                    # Tests unitarios
│   ├── integration/             # Tests de integración
│   └── firestore.rules.test.ts  # Tests de Security Rules
├── firestore.rules              # Reglas de seguridad (deployed)
├── firebase.json                # Configuración de Firebase
├── .env.example                 # Ejemplo de variables de entorno
├── .env.local                   # Variables de entorno (NO subir a Git)
├── package.json                 # Dependencias y scripts
├── tsconfig.json                # Configuración de TypeScript
├── vite.config.ts               # Configuración de Vite
└── README.md                    # Documentación principal
```

---

## 8. Flujo de trabajo Git

### 8.1. Crear una nueva rama para un feature

```bash
git checkout main
git pull origin main
git checkout -b feature/HU-01-registro-usuario
```

### 8.2. Hacer commits pequeños y descriptivos

```bash
git add src/application/services/authService.ts
git commit -m "feat: implementar método register() en authService"
```

**Convención de commits:**
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `test:` Agregar o modificar tests
- `refactor:` Refactorización de código
- `docs:` Actualización de documentación
- `style:` Cambios de formato (no afectan lógica)

### 8.3. Push y crear Pull Request

```bash
git push origin feature/HU-01-registro-usuario
```

Luego en GitHub:
1. Crear Pull Request
2. Asignar revisor
3. Esperar aprobación
4. Merge a `main`

---

## 9. Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo (Vite) |
| `npm run build` | Compilar para producción |
| `npm run preview` | Previsualizar build de producción |
| `npm test` | Ejecutar tests |
| `npm run test:watch` | Ejecutar tests en modo watch |
| `npm run test:coverage` | Generar reporte de cobertura |
| `npm run test:rules` | Ejecutar tests de Security Rules |
| `npm run lint` | Ejecutar ESLint |
| `npm run lint:fix` | Corregir errores de ESLint automáticamente |
| `npm run format` | Formatear código con Prettier |
| `npm run emulators` | Iniciar Firebase Emulators |
| `firebase deploy` | Desplegar a producción (Hosting + Rules) |
| `firebase deploy --only firestore:rules` | Desplegar solo las reglas de seguridad |
| `firebase deploy --only hosting` | Desplegar solo el frontend |

---

## 10. Troubleshooting

### 10.1. Error: "Firebase Emulators not starting"

**Causa:** Java no instalado o versión incorrecta.

**Solución:**
1. Instalar Java JDK >= 11 ([descarga](https://adoptium.net/))
2. Verificar instalación: `java -version`
3. Reiniciar terminal
4. Volver a ejecutar `npm run emulators`

---

### 10.2. Error: "Port 5173 already in use"

**Causa:** Otro proceso está usando el puerto de Vite.

**Solución:**
```bash
# En Linux/Mac:
lsof -i :5173
kill -9 <PID>

# En Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

O cambiar el puerto en `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3000  // Cambiar a otro puerto
  }
});
```

---

### 10.3. Error: "Firebase config is not defined"

**Causa:** Variables de entorno no configuradas correctamente.

**Solución:**
1. Verificar que existe `.env.local` en la raíz del proyecto
2. Verificar que todas las variables `VITE_FIREBASE_*` están definidas
3. Reiniciar servidor de desarrollo (`Ctrl+C` → `npm run dev`)

---

### 10.4. Tests fallan con "Cannot find module 'firebase/auth'"

**Causa:** Jest no está configurado correctamente para ES modules.

**Solución:**
Verificar que `jest.config.js` contiene:
```javascript
module.exports = {
  transformIgnorePatterns: [
    'node_modules/(?!(firebase)/)'
  ]
};
```

---

### 10.5. Firestore Rules tests fallan

**Causa:** Emuladores no están corriendo.

**Solución:**
1. Iniciar emuladores en una terminal: `npm run emulators`
2. En otra terminal, ejecutar tests: `npm run test:rules`

---

### 10.6. Error: "Username already taken" al crear usuario de prueba

**Causa:** El username ya existe en el emulador (persistencia entre sesiones).

**Solución:**
1. Ir a `http://localhost:4000` (Emulator UI)
2. En "Firestore", borrar la colección `usernames`
3. En "Authentication", borrar todos los usuarios
4. Reintentar registro

O borrar datos del emulador:
```bash
firebase emulators:start --import=./emulator-data --export-on-exit
# Al detener con Ctrl+C, los datos se exportan
# Para empezar limpio, borrar carpeta emulator-data/
```

---

## Próximos pasos

Una vez completado este quickstart:

1. **Leer la especificación completa:** `.specify/spec.md`
2. **Revisar el plan de implementación:** `.specify/plan.md`
3. **Estudiar el modelo de datos:** `.specify/data-model.md`
4. **Entender el contrato de servicios:** `.specify/contracts/services-contract.md`
5. **Comenzar con Sprint 0:** Configuración del proyecto (ver `plan.md`)

---

## Recursos adicionales

- **Firebase Docs:** https://firebase.google.com/docs
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro/

---

**¡Bienvenido al equipo Yumeideas!** 🚀

Si tienes dudas, consulta la documentación en `.specify/` o contacta al tech lead.

---

**Fecha de creación:** 7 de julio de 2026  
**Versión:** 1.0  
**Última actualización:** 7 de julio de 2026
