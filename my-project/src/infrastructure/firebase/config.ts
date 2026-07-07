import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Inicializar servicios
export const auth = getAuth(app)
export const db = getFirestore(app)

// Conectar a emuladores si está configurado (para desarrollo local)
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  const authEmulatorHost = import.meta.env.VITE_AUTH_EMULATOR_HOST || 'localhost:9099'
  const firestoreEmulatorHost =
    import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || 'localhost:8080'

  const [authHost, authPort] = authEmulatorHost.split(':')
  connectAuthEmulator(auth, `http://${authHost}:${authPort}`, {
    disableWarnings: true,
  })

  const [firestoreHost, firestorePort] = firestoreEmulatorHost.split(':')
  connectFirestoreEmulator(db, firestoreHost, parseInt(firestorePort))

  console.log('🔧 Conectado a Firebase Emulators')
  console.log(`   Auth: ${authEmulatorHost}`)
  console.log(`   Firestore: ${firestoreEmulatorHost}`)
}

export default app
