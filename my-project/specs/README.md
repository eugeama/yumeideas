# Especificaciones - Yumeideas

Este directorio contiene todas las especificaciones y documentación de planificación del proyecto Yumeideas.

---

## 📁 Estructura

```
specs/
└── 001-yumeideas-mvp/    # Especificación del MVP (Minimum Viable Product)
    ├── README.md         # Índice de documentos de esta spec
    ├── constitution.md   # Constitución del proyecto (13 principios)
    ├── spec.md          # Especificación técnica completa
    ├── clarify.md       # Resolución de ambigüedades
    ├── checklist.md     # Validación de conformidad
    ├── plan.md          # Plan de implementación (sprints)
    ├── research.md      # Investigación técnica
    ├── data-model.md    # Modelo de datos Firestore
    ├── quickstart.md    # Guía de inicio rápido
    ├── SUMMARY.md       # Resumen ejecutivo
    └── contracts/
        ├── firestore.rules      # Reglas de seguridad de Firestore
        └── services-contract.md # Contrato de servicios (API interna)
```

---

## 📚 Especificaciones disponibles

### 001-yumeideas-mvp

**Estado:** ✅ Completa - Aprobada para implementación  
**Fecha:** 7 de julio de 2026  
**Versión:** 1.0  

**Descripción:**  
Especificación completa del MVP de Yumeideas, una red social de ideas donde los usuarios pueden compartir publicaciones públicas y privadas, dar "me gusta", y administrar su perfil.

**Alcance:**
- Autenticación de usuarios (registro, login, recuperación de contraseña)
- Publicaciones públicas y privadas
- Sistema de "me gusta"
- Panel de administración (moderación)
- Gestión de perfil (editar username/contraseña, borrar cuenta)

**Tecnologías:**
- React 18+ con Vite y TypeScript
- Firebase (Authentication, Firestore, Hosting)
- Jest y React Testing Library

**Estadísticas:**
- 6,339 líneas de documentación
- 26 requisitos funcionales
- 13 historias de usuario
- 15 requisitos no funcionales
- 4 sprints (6-8 semanas)
- 74 story points

**[Ver documentación completa →](./001-yumeideas-mvp/README.md)**

---

## 🎯 Convención de nomenclatura

Las especificaciones siguen el formato: `{número}-{nombre-proyecto}-{tipo}`

Ejemplos:
- `001-yumeideas-mvp` - Primera especificación, MVP de Yumeideas
- `002-yumeideas-v2` - Segunda especificación, versión 2.0 con nuevas features
- `003-yumeideas-mobile` - Tercera especificación, versión mobile

---

## 📖 Cómo leer una especificación

1. **Comenzar con el README.md** de la especificación para tener una visión general
2. **Leer SUMMARY.md** para entender el alcance y estado
3. **Revisar constitution.md** para conocer los principios del proyecto
4. **Estudiar spec.md** para los requisitos detallados
5. **Consultar plan.md** para el roadmap de implementación
6. **Revisar los contratos** para entender la arquitectura técnica

---

## 🚀 Estado actual

| Especificación | Estado | Fecha | Implementación |
|----------------|--------|-------|----------------|
| 001-yumeideas-mvp | ✅ Completa | 07/07/2026 | 🟡 Pendiente |

**Leyenda:**
- ✅ Completa - Especificación finalizada y aprobada
- 🟢 En progreso - Especificación en desarrollo
- 🟡 Pendiente - Implementación no iniciada
- 🔵 En desarrollo - Implementación en progreso
- ✅ Completada - Implementación finalizada

---

## 📝 Proceso de especificación

Cada especificación pasa por las siguientes fases:

1. **Constitución** - Definir principios y restricciones
2. **Especificación** - Documentar requisitos funcionales y no funcionales
3. **Clarificación** - Resolver ambigüedades
4. **Validación** - Verificar conformidad con la constitución
5. **Planificación** - Crear roadmap de implementación
6. **Investigación** - Resolver desafíos técnicos
7. **Aprobación** - Marcar como lista para implementación

---

## 🔗 Links útiles

- [README principal del proyecto](../README.md)
- [Código fuente](../src/)
- [Tests](../tests/)
- [Configuración de Firebase](../firebase.json)

---

**Mantenido por:** Equipo Yumeideas  
**Última actualización:** 7 de julio de 2026
