# Especificación MVP - Yumeideas

**Versión:** 001  
**Nombre del proyecto:** Yumeideas  
**Tipo:** MVP (Minimum Viable Product)  
**Fecha:** 7 de julio de 2026  
**Estado:** ✅ Planificación completa - Aprobado para implementación

---

## 📋 Índice de documentos

### Documentos de especificación

1. **[constitution.md](./constitution.md)** - Constitución del proyecto
   - 13 principios constitucionales obligatorios
   - Restricciones tecnológicas (solo React + Firebase)
   - Arquitectura y patrones de diseño
   - Estado: ✅ Completo

2. **[spec.md](./spec.md)** - Especificación técnica completa
   - 3 actores (Usuario, Administrador, Sistema)
   - 26 Requisitos Funcionales (RF-01 a RF-26)
   - 13 Historias de Usuario (HU-01 a HU-13)
   - 15 Requisitos No Funcionales (RNF-01 a RNF-15)
   - Estado: ✅ Completo (1939 líneas)

3. **[clarify.md](./clarify.md)** - Resolución de ambigüedades
   - 10 ambigüedades identificadas y resueltas
   - Decisiones clave documentadas
   - Estado: ✅ Completo

4. **[checklist.md](./checklist.md)** - Validación de conformidad
   - Validación de los 13 principios constitucionales
   - Trazabilidad de requisitos
   - Verificación de ambigüedades resueltas
   - Estado: ✅ 100% conforme

---

### Documentos de planificación

5. **[plan.md](./plan.md)** - Plan de implementación
   - 4 sprints (Sprint 0-4)
   - 74 story points, 254 horas estimadas
   - 6-8 semanas de duración total
   - Definition of Done
   - Flujo de trabajo Git
   - Estado: ✅ Completo (~500 líneas)

6. **[research.md](./research.md)** - Investigación técnica
   - 6 desafíos técnicos resueltos
   - Soluciones con código de ejemplo
   - Patrones de implementación
   - Estado: ✅ Completo (~450 líneas)

7. **[data-model.md](./data-model.md)** - Modelo de datos
   - 3 colecciones de Firestore (usuarios, usernames, publicaciones)
   - 1 subcolección (likes)
   - 2 índices compuestos
   - Reglas de validación
   - Estado: ✅ Completo (~550 líneas)

---

### Contratos técnicos

8. **[contracts/firestore.rules](./contracts/firestore.rules)** - Reglas de seguridad
   - Firestore Security Rules completas
   - 6 funciones helper
   - Validación de edad >= 13 años
   - Protección de admins
   - Estado: ✅ Completo (~200 líneas)

9. **[contracts/services-contract.md](./contracts/services-contract.md)** - Contrato de servicios
   - 4 servicios (AuthService, UserService, PostService, LikeService)
   - 17 métodos con firmas TypeScript
   - Documentación de parámetros, retornos y errores
   - Ejemplos de uso
   - Estado: ✅ Completo (~1100 líneas)

---

### Guías operativas

10. **[quickstart.md](./quickstart.md)** - Guía de inicio rápido
    - Setup local paso a paso
    - Configuración de Firebase
    - Ejecución de emuladores
    - Comandos útiles
    - Troubleshooting
    - Estado: ✅ Completo (~700 líneas)

11. **[SUMMARY.md](./SUMMARY.md)** - Resumen ejecutivo
    - Resumen de todos los documentos
    - Estadísticas del proyecto
    - Conformidad con constitución
    - Próximos pasos
    - Estado: ✅ Completo

---

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| **Total de líneas** | 6,339 |
| **Total de palabras** | ~41,000 |
| **Documentos generados** | 11 |
| **Requisitos funcionales** | 26 |
| **Historias de usuario** | 13 |
| **Requisitos no funcionales** | 15 |
| **Ambigüedades resueltas** | 10 |
| **Story points** | 74 |
| **Horas estimadas** | 254 |
| **Duración estimada** | 6-8 semanas |
| **Conformidad constitución** | 100% (13/13) |

---

## 🎯 Conformidad con la constitución

| Principio | Descripción | Estado |
|-----------|-------------|--------|
| P1 | Solo React + Firebase | ✅ 100% |
| P2 | Solo Auth + Firestore + Hosting | ✅ 100% |
| P3 | Sin Cloud Functions | ✅ 100% |
| P4 | Sin Firebase Storage | ✅ 100% |
| P5 | Sin backend custom | ✅ 100% |
| P6 | Arquitectura 4 capas | ✅ 100% |
| P7 | TypeScript obligatorio | ✅ 100% |
| P8 | Tests obligatorios | ✅ 100% |
| P9 | Firebase Emulators | ✅ 100% |
| P10 | Security Rules validación | ✅ 100% |
| P11 | Borrado en cascada | ✅ 100% |
| P12 | Privacidad (edad >= 13) | ✅ 100% |
| P13 | Domain-Driven Design | ✅ 100% |

**Conformidad total: 13/13 (100%)**

---

## 🚀 Orden de lectura recomendado

Si es tu primera vez revisando esta especificación, lee los documentos en este orden:

1. **[SUMMARY.md](./SUMMARY.md)** - Para tener una visión general
2. **[constitution.md](./constitution.md)** - Para entender los principios del proyecto
3. **[spec.md](./spec.md)** - Para conocer todos los requisitos y funcionalidades
4. **[clarify.md](./clarify.md)** - Para entender las decisiones clave
5. **[plan.md](./plan.md)** - Para conocer el roadmap de implementación
6. **[data-model.md](./data-model.md)** - Para entender la estructura de datos
7. **[contracts/services-contract.md](./contracts/services-contract.md)** - Para conocer la API interna
8. **[contracts/firestore.rules](./contracts/firestore.rules)** - Para entender la seguridad
9. **[research.md](./research.md)** - Para profundizar en las soluciones técnicas
10. **[quickstart.md](./quickstart.md)** - Para comenzar a desarrollar

---

## 📚 Referencia rápida

### Actores del sistema
- **Usuario** - Usuario autenticado con rol "usuario"
- **Administrador** - Usuario autenticado con rol "admin"
- **Sistema** - Firebase (Authentication, Firestore, Hosting)

### Historias de usuario por sprint

**Sprint 1 - Autenticación (18 pts)**
- HU-01: Registro de usuario
- HU-02: Login de usuario
- HU-13: Editar perfil (username y contraseña)
- HU-12: Recuperar contraseña

**Sprint 2 - Publicaciones (22 pts)**
- HU-03: Crear publicación
- HU-04: Ver publicación
- HU-05: Editar publicación propia
- HU-07: Borrar publicación propia

**Sprint 3 - Likes y Admin (34 pts)**
- HU-06: Dar "me gusta" a publicación
- HU-08: Borrar cuenta de usuario
- HU-09: Borrar publicación (admin)
- HU-10: Borrar cuenta de usuario (admin)
- HU-11: Ver todas las publicaciones (admin)

### Colecciones de Firestore

1. **`/usuarios/{uid}`** - Datos de perfil
   - uid, username, email, fechaNacimiento, rol, fechaCreacion

2. **`/usernames/{username}`** - Reserva de usernames (auxiliar)
   - uid, fechaReserva

3. **`/publicaciones/{postId}`** - Publicaciones
   - contenido, autorId, autorUsername, autorRol, visibilidad, fechaCreacion, fechaModificacion, likesCount
   - Subcolección: `/publicaciones/{postId}/likes/{userId}`

### Servicios principales

- **AuthService**: register, login, logout, sendPasswordReset, getCurrentUser
- **UserService**: getUserData, updateUsername, updatePassword, deleteAccount
- **PostService**: createPost, updatePost, deletePost, getPublicFeed, getUserPosts, getAllPostsForAdmin
- **LikeService**: toggleLike, hasUserLiked

---

## ✅ Checklist de inicio

Antes de comenzar la implementación:

- [ ] Leer `constitution.md` completo
- [ ] Leer `spec.md` completo
- [ ] Revisar `plan.md` y entender los sprints
- [ ] Estudiar `data-model.md` (esquema de Firestore)
- [ ] Leer `contracts/services-contract.md` (API interna)
- [ ] Revisar `contracts/firestore.rules` (seguridad)
- [ ] Completar setup de `quickstart.md`
- [ ] Configurar `.env.local` con credenciales de Firebase
- [ ] Verificar que Firebase Emulators funcionan
- [ ] Verificar que la app de Vite inicia sin errores
- [ ] Verificar que los tests básicos pasan

---

## 🎯 Estado del proyecto

**🟢 PLANIFICACIÓN COMPLETA - LISTO PARA IMPLEMENTACIÓN**

- Fecha de aprobación: 7 de julio de 2026
- Próxima milestone: Sprint 0 - Setup del proyecto
- Responsable: Tech Lead

---

## 📞 Contacto

Para preguntas sobre la especificación:
- **Tech Lead:** [Nombre del tech lead]
- **Email:** soporte@yumeideas.com
- **GitHub Issues:** [Link al repositorio]

---

**Generado automáticamente por el sistema de planificación Yumeideas**  
**Versión:** 1.0  
**Última actualización:** 7 de julio de 2026
