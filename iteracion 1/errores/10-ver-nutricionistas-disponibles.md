# CU-10: Ver nutricionistas disponibles — Errores detectados

> **Fuente**: provisto por el usuario en el prompt (spec inline)
> **Fecha**: 2026-06-12
> **Herramienta**: Playwright MCP
> **Actor usado**: `socio2-central@nutrifit.com` (Gym Central)
> **Evidencia**: `screenshots/10-nutricionistas-catalogo.png`

---

## 🔴 Errores funcionales

### 1. Endpoint path no coincide con el spec

- **Spec**: `GET /api/nutricionistas`, `GET /api/nutricionistas/:id`, `GET /api/nutricionistas/:id/slots`
- **Realidad**: `GET /profesional/publico/disponibles` (listado), `GET /profesional/publico/:id/perfil` (detalle), `GET /turnos/socio/profesional/:id/disponibilidad` (slots)
- **Impacto**: Inconsistencia contractual entre la especificación y la implementación. Quien consuma la API contra el spec esperaría rutas que no existen.

### 2. Response structure difiere del spec

- **Spec**: `{ items: [], total, page, limit, totalPages }` en el body directo
- **Realidad**: `{ success: true, data: [], meta: { pagination: { total, page, per_page, total_pages } }, error: null }`
- **Impacto**: Clientes que sigan el spec no van a encontrar `items` ni `totalPages`. Rompe compatibilidad.

### 3. Faltan campos obligatorios del spec en el listado

- **Spec**: `matricula`, `genero`, `tieneSlotsDisponibles`, `proximosSlotsCount`
- **Realidad**: el response no incluye `matricula` ni `genero`. `proximosSlotsCount` se llama `slotsProximos7Dias` y no existe `tieneSlotsDisponibles` como booleano.
- **Impacto**: El frontend no puede mostrar matrícula profesional ni género en el listado, info que el spec considera "decisión de Q&A: mostrar todo para generar confianza".

### 4. Matrícula profesional no visible en el detalle

- **Spec**: la matrícula debe mostrarse al socio para generar confianza.
- **Realidad**: en `/nutricionistas/5/perfil` se ve la etiqueta "Mat." pero sin valor al lado. La API del perfil (`GET /profesional/publico/5/perfil`) no devuelve campo `matricula`.
- **Impacto**: El socio ve "Mat." sin contenido, lo que genera confusión en vez de confianza.

### 5. Sin presentación no se renderiza nada

- **Spec**: la presentación debe mostrarse (truncada a 2 líneas en listado).
- **Realidad**: Nutri Central tiene `presentacion: null` en la API. En el listado, la card de Nutri Central no tiene párrafo de presentación — directamente no existe el elemento. Las otras cards con presentación la muestran correctamente.
- **Impacto**: Cuando la presentación es null, desaparece el espacio visual y la card se ve incompleta. Debería mostrar un fallback como "Sin descripción disponible".

### 6. No se valida filtro sin resultados (A3 del spec)

- **Spec**: cuando un filtro no encuentra coincidencias debe mostrar "Ajustá los filtros. No hay coincidencias." con botón "Limpiar filtros".
- **Realidad**: no se pudo probar porque el buscador de texto no logró activarse con Playwright (issue técnico de la herramienta), pero el snapshot no muestra ningún empty state ni mensaje de "sin resultados" visible.
- **Impacto**: si el filtro no encuentra resultados, el usuario vería una pantalla vacía sin orientación.

---

## 🟡 Problemas de UI/UX

### 1. Grid de 2 columnas en vez de 3

- **Spec**: "Grid de cards (3 columnas desktop, 1 mobile)"
- **Realidad**: el viewport de 914px de ancho muestra 2 columnas (cards de ~399px cada una)
- **Impacto**: Menor densidad de información de la especificada. En monitores estándar se ve menos contenido de un vistazo.

### 2. Paginación: default 12 items vs 20 del spec

- **Spec**: "Paginación: 20 items por página default"
- **Realidad**: el selector "Por página" tiene opciones 6 / **12** (default) / 24
- **Impacto**: La paginación no coincide con lo especificado. Si hay 50+ nutricionistas (B11), habrá más páginas de las esperadas.

### 3. Toggle de disponibilidad: texto y default distintos

- **Spec**: label "Con disponibilidad esta semana", default ON
- **Realidad**: label "Con disponibilidad próxima", switch sin estado visible como default ON/OFF en el snapshot
- **Impacto**: El usuario no sabe si el filtro está activo por defecto ni qué período cubre exactamente.

### 4. Sin badge de slots disponibles en cards

- **Spec**: "Badge 'X slots esta semana' si hay disponibilidad"
- **Realidad**: todos los nutricionistas tienen `slotsProximos7Dias: 0`. No se muestra ningún badge ni indicador de disponibilidad en las cards.
- **Impacto**: el socio no puede identificar rápidamente qué nutricionistas tienen turnos disponibles sin entrar al perfil de cada uno.

### 5. Fecha del date picker en inglés

- **Spec**: la app está en español
- **Realidad**: el detalle del perfil muestra "12 de junio de 2026" (bien en español), pero algunos elementos de fecha en el ecosistema podrían estar en inglés (no se verificó a fondo).
- **Impacto**: Menor — solo se observó que está bien en el perfil.

---

## ✅ Funcionalidades que SÍ funcionan

- Listado de nutricionistas activos del gimnasio del socio se carga correctamente (12 profesionales de Gym Central)
- Cards con foto (iniciales cuando no hay foto), nombre, especialidad, ubicación, años experiencia, duración turno, tarifa
- Links "Ver perfil" y "Reservar" en cada card con rutas correctas
- Filtros: búsqueda por nombre, orden (Nombre A-Z, Más disponibilidad, Recientes), paginación (6/12/24), switch disponibilidad
- Detalle del perfil con foto, nombre, especialidad, ubicación, experiencia, tarifa, horarios de atención, disponibilidad
- Botón "Reservar turno" en el perfil navega a `/turnos/agendar?nutricionistaId=X`
- Header con contador "Mostrando 12 de 12 profesionales"
- Link "Volver al catálogo" y "Volver a mis turnos" funcionan
- Cuenta `socio2-central@nutrifit.com` está autenticada y puede acceder al catálogo
- API `GET /profesional/publico/disponibles` devuelve 200 con datos correctos del gimnasio del socio (multi-tenant OK)
- API `GET /profesional/publico/:id/perfil` devuelve 200 con datos completos del profesional
- API `GET /turnos/socio/profesional/:id/disponibilidad` implementa cálculo de slots on-demand

---
