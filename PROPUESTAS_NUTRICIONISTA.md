# Propuestas de datos / información del Nutricionista

Generado el 16/06/2026. Cada item es independiente y se puede incluir o descartar sin afectar a los demás.

**Leyenda de prioridad**
- 🔴 Alta = hueco claro, suma valor inmediato
- 🟡 Media = diferenciador, mejora UX
- 🟢 Baja = nice-to-have, depende de features que no existen

**Leyenda de complejidad**
- 🟢 Baja = ~1-2 hs (1 columna, 1 DTO, 1 form input, mostrar en perfil)
- 🟡 Media = ~3-5 hs (tabla relacionada, migración, UI con multi-select, filtros)
- 🔴 Alta = ~1-2 días (sub-feature, integración con MinIO, módulo aparte)

---

## 🔴 Prioridad alta — incluir primero

### Especialidades (deportiva, clínica, infantil, vegana, etc.)
- **Justificación**: hoy el campo está hardcodeado como `"Nutricionista"`. El socio no sabe si el profesional le sirve para su caso.
- **Modelo**: array de strings con valores controlados (enum). O relación a tabla `especialidad` si querés administrarlas desde la UI.
- **UI**: chips en el perfil, filtro en el catálogo ("Mostrar solo especialistas en X").
- **Complejidad**: 🟡 Media (tabla relacionada + multi-select + filtro)
- [X] Incluir
- Aclaracion: El sistema esta hecho solo para nutricionistas, se podria aclarar que especialidad tiene le nutricionista, otra cosa no.

### Idiomas que habla
- **Justificación**: un socio angloparlante hoy no puede saber si le van a poder atender en inglés. Crítico en zonas turísticas o ciudades con extranjeros.
- **Modelo**: array con enum `Idioma` (ES, EN, PT, FR, IT, etc.).
- **UI**: chip/badges con el idioma en el perfil.
- **Complejidad**: 🟢 Baja
- [ ] Incluir

### Modalidad de atención (presencial / virtual / mixta)
- **Justificación**: post-pandemia la telemedicina es mainstream. Hoy no se puede saber si un nutri atiende virtual.
- **Modelo**: enum `ModalidadAtencion` (PRESENCIAL, VIRTUAL, MIXTA). Default PRESENCIAL.
- **UI**: badge en el perfil + filtro en el catálogo.
- **Complejidad**: 🟢 Baja
- [ ] Incluir

### Población objetivo
- **Justificación**: una embarazada no debería reservar con un nutri deportivo. Hoy el socio adivina.
- **Modelo**: array con enum `PoblacionObjetivo` (ADULTOS, ADULTOS_MAYORES, DEPORTISTAS, EMBARAZADAS, POSTPARTO, NIÑOS, ADOLESCENTES, VEGANOS, CELIACOS, DIABETICOS, SOBREPESO, etc.).
- **UI**: chips en el perfil, filtro en el catálogo.
- **Complejidad**: 🟡 Media (enum largo + multi-select + filtro)
- [ ] Incluir

### Link a LinkedIn / sitio web profesional
- **Justificación**: señal de confianza. "Ver perfil externo" valida trayectoria.
- **Modelo**: string opcional validado como URL.
- **UI**: botón "Ver perfil externo" en el header del perfil.
- **Complejidad**: 🟢 Baja
- [ ] Incluir

---

## 🟡 Prioridad media — diferenciadores

### Enfoques nutricionales (keto, mediterránea, etc.)
- **Justificación**: hay gente que busca nutri por metodología, no por problema. Filtro potente.
- **Modelo**: array con enum `EnfoqueNutricional` (KETO, MEDITERRANEA, INTUITIVA, AYUNO_INTERMITENTE, BAJA_CARBO, etc.).
- **UI**: chips en perfil, filtro en catálogo.
- **Complejidad**: 🟡 Media
- [ ] Incluir

### Video de presentación (URL YouTube / Vimeo)
- **Justificación**: humaniza al profesional, reduce ansiedad del socio nuevo. Es un mini-presentación de 1-2 min.
- **Modelo**: string opcional URL. Embed a partir de la URL (parsear el ID de YouTube).
- **UI**: embed responsive en el header del perfil. Si no hay, no se muestra.
- **Complejidad**: 🟡 Media (parsing de URL de YouTube + embed responsive)
- [ ] Incluir

### Acepta pacientes nuevos
- **Justificación**: si un nutri está colapsado, no debería figurar como "disponible" en el catálogo. El admin lo podría tildar.
- **Modelo**: boolean. Default `true`. Cambia desde Gestión de Nutricionistas.
- **UI**: filtro "Solo aceptar nuevos" en el catálogo.
- **Complejidad**: 🟢 Baja
- [ ] Incluir

### Link a sala virtual (Meet, Zoom)
- **Justificación**: si la modalidad es VIRTUAL o MIXTA, el socio necesita el link para unirse a la consulta.
- **Modelo**: string URL opcional.
- **UI**: botón "Unirse a la consulta" en la confirmación del turno.
- **Complejidad**: 🟡 Media (hay que decidir cuándo se muestra el link: en la reserva, minutos antes, etc.)
- [ ] Incluir

### Idiomas adicionales en títulos de diplomas / certificaciones
- **Justificación**: hoy el campo `certificaciones` es un text libre. Podría ser un array de certificaciones estructuradas (nombre + entidad + año).
- **Modelo**: relación 1:N `certificacion` con `nombre`, `entidad`, `anio`. Similar a `formacion_academica` (que ya existe como patrón).
- **UI**: lista con badges. Misma UI que formación académica.
- **Complejidad**: 🟡 Media
- [ ] Incluir

---

## 🟢 Prioridad baja — dependen de features que no existen

### Calificación promedio + reseñas
- **Justificación**: poderosa señal de confianza, pero requiere un módulo de reviews entero (CRUD de reseñas, moderación, anti-abuso).
- **Modelo**: tabla `resena` con `calificacion` (1-5), `comentario`, `fecha`, `socioId`, `nutricionistaId`.
- **UI**: estrellas + última reseña destacada en el perfil. Promedio en el catálogo.
- **Complejidad**: 🔴 Alta (módulo entero + políticas + UI)
- [ ] Incluir

### Pacientes activos / turnos completados (métricas)
- **Justificación**: social proof. "Atendió a 47 pacientes en los últimos 6 meses".
- **Modelo**: cálculo en runtime desde `turno` con status `ASISTIO`. No requiere migración.
- **UI**: badge en el perfil.
- **Complejidad**: 🟡 Media (queries agregadas, caching)
- [ ] Incluir

### Badge "Verificado" (autodiplomas cargados)
- **Justificación**: señal rápida de que el nutri cargó al menos un diploma.
- **Modelo**: derivado, no requiere migración. `nutricionista.diplomas.length > 0` → badge.
- **UI**: badge verde con tooltip "Diploma verificado".
- **Complejidad**: 🟢 Baja
- [ ] Incluir

### Tiempo de respuesta promedio
- **Justificación**: "Responde en menos de 4 hs" — útil pero requiere tracking de mensajes, que no existe.
- **Depende de**: módulo de mensajería interno.
- **Complejidad**: 🔴 Alta
- [ ] Incluir

### Política de cancelación / reembolso
- **Justificación**: transparencia para el socio. Reduce conflictos.
- **Depende de**: módulo de políticas. Hoy hay un esqueleto (`politica_operativa`).
- **Complejidad**: 🟡 Media
- [ ] Incluir

---

## 🎁 Bonus — no son datos del nutri, pero complementan

### Favoritos para socios
- **Justificación**: el socio quiere guardar a sus nutris preferidos.
- **Modelo**: tabla `socio_nutricionista_favorito` (socioId, nutricionistaId, fecha).
- **UI**: corazón en la card del catálogo, sección "Mis favoritos".
- **Complejidad**: 🟡 Media
- [ ] Incluir

### Filtro por tarifa máxima en el catálogo
- **Justificación**: el socio no puede filtrar por rango de precio hoy.
- **Modelo**: parámetro de query (`tarifaMax`).
- **UI**: slider en el sidebar de filtros.
- **Complejidad**: 🟢 Baja
- [ ] Incluir

### Ordenar por "mejor match para mí" (personalizado)
- **Justificación**: matching automático basado en idioma, población objetivo, modalidad y disponibilidad del socio.
- **Depende de**: lo de arriba + perfil del socio.
- **Complejidad**: 🟡 Media
- [ ] Incluir

---

## Resumen

| # | Item | Prioridad | Complejidad | Incluir |
|---|------|-----------|-------------|---------|
| 1 | Especialidades | 🔴 | 🟡 | [ ] |
| 2 | Idiomas | 🔴 | 🟢 | [ ] |
| 3 | Modalidad de atención | 🔴 | 🟢 | [ ] |
| 4 | Población objetivo | 🔴 | 🟡 | [ ] |
| 5 | Link a LinkedIn | 🔴 | 🟢 | [ ] |
| 6 | Enfoques nutricionales | 🟡 | 🟡 | [ ] |
| 7 | Video de presentación | 🟡 | 🟡 | [ ] |
| 8 | Acepta pacientes nuevos | 🟡 | 🟢 | [ ] |
| 9 | Link a sala virtual | 🟡 | 🟡 | [ ] |
| 10 | Certificaciones estructuradas | 🟡 | 🟡 | [ ] |
| 11 | Calificación + reseñas | 🟢 | 🔴 | [ ] |
| 12 | Pacientes activos (métrica) | 🟢 | 🟡 | [ ] |
| 13 | Badge "Verificado" | 🟢 | 🟢 | [ ] |
| 14 | Tiempo de respuesta | 🟢 | 🔴 | [ ] |
| 15 | Política de cancelación | 🟢 | 🟡 | [ ] |
| 16 | Favoritos para socios | — | 🟡 | [ ] |
| 17 | Filtro por tarifa máxima | — | 🟢 | [ ] |
| 18 | Ordenar por mejor match | — | 🟡 | [ ] |

**Próximo paso**: tildá lo que querés incluir y armamos el plan de implementación agrupado por sprint.
