# Listas y Tablas No Paginadas — Inventario

**Fecha**: 2026-06-22
**Alcance**: `apps/frontend/src/**` (renderizado de colecciones de datos en UI)
**Objetivo**: Identificar todas las listas/tablas que renderizan datos sin paginación para priorizar mejoras.

---

## Resumen ejecutivo

| Estado                                                                              | Cantidad |
| ----------------------------------------------------------------------------------- | -------- |
| Paginadas correctamente (server o client-side con UI completa)                      | 6        |
| Paginadas en server **sin controles UI** (datos truncados al usuario)               | 2        |
| **No paginadas (candidatas a mejorar)**                                             | **~45**  |
| **Total detectado**                                                                 | **~53**  |

---

## Listas con paginación completa (referencia)

Estos son los patrones a replicar:

| Archivo                                              | Tipo paginación     | Detalle                                                                   |
| ---------------------------------------------------- | ------------------- | ------------------------------------------------------------------------- |
| `apps/frontend/src/pages/Permisos.tsx`               | Server-side         | Tabla de usuarios con `pagination.{limit,page,totalPages,hasNextPage}`   |
| `apps/frontend/src/pages/NutricionistasCatalogo.tsx` | Server-side         | Catálogo público con `?page=&limit=` y controles numerados                |
| `apps/frontend/src/pages/GestionNutricionistas.tsx`  | Client-side (slice) | Estado local `paginaActual`/`limitePorPagina` + slice en memoria          |
| `apps/frontend/src/pages/Socios.tsx`                 | Client-side (slice) | Mismo patrón que nutricionistas                                           |
| `apps/frontend/src/pages/Recepcionistas.tsx`         | Client-side (slice) | Mismo patrón                                                              |
| `apps/frontend/src/pages/Turnos.tsx`                | Client-side (slice) | "Mis Turnos" del socio                                                    |

> Las client-side descargan TODO y filtran en memoria. Funciona con cientos de registros; se degrada con miles.

---

## Paginadas en server pero SIN controles UI

El backend ya pagina pero el frontend no expone la navegación. El usuario ve solo la primera página y no puede cargar más.

| Archivo                                                                          | Endpoint backend                            | Problema                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `apps/frontend/src/features/notificaciones/components/NotificationCenter.tsx`    | `GET /notificaciones/mias?page=1&limit=20`  | Hardcoded `limit=20`, sin botón "Cargar más" ni paginación |
| `apps/frontend/src/features/notificaciones/pages/NotificacionesPage.tsx`         | mismo                                       | mismo                                                       |

---

## No paginadas — Priorizadas

### 🔴 CRÍTICO — Paginar ya

| Archivo:línea                                      | Qué renderiza                                       | Por qué urge                                                                                                              |
| -------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `apps/frontend/src/pages/AdminAuditoriaPage.tsx:331` | Lista plana de registros de auditoría              | Sin límite, sin paginación, filtros de fecha opcionales. En producción con miles de eventos diarios revienta la request. |

### 🟠 ALTO VOLUMEN — Recomendado

| Archivo:línea                                                                | Qué renderiza                                       | Notas                                                                            |
| ---------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| `apps/frontend/src/pages/GestionAlimentosPage.tsx:337`                        | Tabla de catálogo global de alimentos               | Búsqueda solo client-side; sin filtro servidor. Catálogo crece con cada nutri.    |
| `apps/frontend/src/pages/PacientesPage.tsx:189`                                | Grid de pacientes del nutricionista                 | Crece con cada consulta nueva. Endpoint `GET /turnos/profesional/:id/pacientes`.   |
| `apps/frontend/src/pages/AgendarTurno.tsx:560`                                 | Lista vertical de profesionales                     | Scroll vertical con `max-h-[320px]`. En gimnasios grandes con 50+ profesionales requiere mucho scroll. |
| `apps/frontend/src/features/notificaciones/components/NotificationCenter.tsx:22` | DropdownMenu de notificaciones                      | Backend pagina (`limit=20`) pero UI no expone controles.                          |
| `apps/frontend/src/features/notificaciones/pages/NotificacionesPage.tsx:13`     | Lista de notificaciones                             | Idem.                                                                              |

### 🟡 MEDIO-ALTO — Mejora futura

| Archivo:línea                                                       | Qué renderiza                                      | Notas                                                                              |
| ------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `apps/frontend/src/components/progreso/TablaEvolucionPaciente.tsx:53`  | Mediciones longitudinales por sesión              | Crece con cada turno del paciente a lo largo de años.                              |
| `apps/frontend/src/components/progreso/GaleriaFotos.tsx:120, 421`       | Fotos de progreso (carrusel + grid)               | Acumulan fotos por sesión. Carrusel horizontal sin paginación explícita.          |
| `apps/frontend/src/components/pacientes/HistorialTurnosPaciente.tsx:104`| Historial de turnos del paciente                  | Crece sin tope. Sin "load more" ni paginación.                                     |
| `apps/frontend/src/components/ficha-salud/FichaSaludHistorialModal.tsx:155` | Versiones de ficha de salud                  | Crece con cada edición del socio. Scroll area `h-72` sin paginación.              |
| `apps/frontend/src/components/plan/FoodSearchDialog.tsx:206`           | Resultados de búsqueda de alimentos               | Backend limita a 20/50 server pero UI no avisa de más resultados.                   |
| `apps/frontend/src/components/progreso/TimelineEvolucionClinica.tsx:32` | Eventos clínicos longitudinales                   | Acumula eventos por paciente.                                                       |

### 🟢 BAJO VOLUMEN — Opcional

Estas listas tienen volumen naturalmente acotado (datos fijos, por gimnasio propio, top-N en dashboards). No requieren paginación urgente pero conviene conocerlas:

| Archivo:línea                                                                | Qué renderiza                                       | Notas                                                                  |
| ---------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/frontend/src/pages/admin/GimnasiosListPage.tsx:215`                     | Tabla de gimnasios                                  | Solo superadmin; volumen bajo típico.                                  |
| `apps/frontend/src/pages/admin/GimnasioDetailPage.tsx:433`                    | Tabla de admins por gimnasio                        | Pocos admins por gimnasio (1-3 típico).                                |
| `apps/frontend/src/pages/Permisos.tsx:419`                                    | Tabla de grupos de permisos                         | Decenas de grupos.                                                     |
| `apps/frontend/src/components/dashboard/TurnosTablaCard.tsx:158`              | Tabla de "Turnos del Día" recepción                 | `slice(0, 8)` + "+N más" sin link. Volumen bajo por día.               |
| `apps/frontend/src/components/dashboard/TurnosDelDiaCard.tsx:84`              | Lista "Turnos de Hoy" nutricionista                  | `slice(0, 5)` + "+N más". Preview de dashboard.                         |
| `apps/frontend/src/components/dashboard/PacientesRecientesCard.tsx:65`        | Top 5 pacientes recientes                           | `?limite=5` server + `slice(0, 5)` client.                              |
| `apps/frontend/src/components/dashboard/UltimosRegistradosCard.tsx:70`        | Top 5 últimos socios                                | `slice(0, 5)`. Preview.                                                 |
| `apps/frontend/src/components/dashboard/ObjetivosCard.tsx:92`                 | Top 4 objetivos                                     | `slice(0, 4)`.                                                          |
| `apps/frontend/src/components/dashboard/AgendaProfesionalesCard.tsx:71`       | Top 6 profesionales                                 | `slice(0, 6)`.                                                          |
| `apps/frontend/src/pages/Agenda.tsx:668, 731, 794`                            | Datos de agenda del nutricionista propio            | Volumen bajo por nutricionista.                                         |
| `apps/frontend/src/pages/GestionPlanesPage.tsx:308, 344, 442`                  | Planes del nutricionista + pacientes modal          | Modal usa `max-h-[300px] overflow-y-auto`.                              |
| `apps/frontend/src/pages/admin/UsuarioPermisosPage.tsx:289`                    | Grupos y acciones del sistema                       | Decenas.                                                                |
| `apps/frontend/src/pages/ConsultaProfesionalPage.tsx:2052`                   | Adjuntos clínicos de una consulta                   | Decenas por consulta.                                                   |
| `apps/frontend/src/pages/RecepcionTurnosPage.tsx:269`                         | Turnos de UN día (recepción)                        | Volumen acotado por día.                                                |
| `apps/frontend/src/pages/TurnosProfesional.tsx:235`                           | Turnos del día del nutricionista                    | Volumen acotado por día.                                                |
| `apps/frontend/src/components/ficha-salud/FotosSesionConsulta.tsx:99`         | 4 tomas fijas (frente/perfil/espalda/otra)          | Constante fija. No requiere paginación.                                 |
| `apps/frontend/src/components/plan/WeeklyPlanGrid.tsx`                        | Grid semanal del plan (7 días × 4-5 tipos comida)   | Estructura fija.                                                        |
| `apps/frontend/src/components/profesionales/EditorTrayectoriaProfesional.tsx` | Formación y certificaciones del nutricionista        | Decenas.                                                                |

---

## Observaciones arquitectónicas

1. **Doble patrón inconsistente**: coexisten server-side (Permisos, NutricionistasCatalogo) con client-side slice (GestionNutricionistas, Socios, Recepcionistas, Turnos). Las client-side descargan TODO y filtran en memoria — funciona con cientos, se degrada con miles.

2. **Patrón "Top N" en dashboard cards**: `slice(0, 4/5/6/8)` con texto "+N más" sin link. Es aceptable para resúmenes pero en algunos casos (`TurnosTablaCard`, `TurnosDelDiaCard`) no hay forma rápida de ver el resto.

3. **Notificaciones**: fix de bajo costo. El backend YA pagina (`page=1&limit=20`); solo falta exponer controles UI en `useNotificaciones` y propagarlos a `NotificationCenter` y `NotificacionesPage`.

4. **Auditoría es el #1 urgente**: `AdminAuditoriaPage` no tiene paginación ni siquiera "Load more", y una sola query devuelve TODOS los registros sin restricción efectiva (filtros de fecha opcionales). En producción va a explotar.

5. **Búsqueda de alimentos** (`FoodSearchDialog`): backend limita a 20/50 server pero UI no avisa que puede haber más resultados. Mejorable.

6. **`AgendarTurno.tsx`** es el caso más visible para el socio: lista TODOS los nutricionistas en scroll vertical de 320px. En gimnasios grandes con 50+ profesionales activos requiere mucho scroll.

---

## Plan de acción sugerido

| Prioridad | Acción                                                                                                | Esfuerzo |
| --------- | ----------------------------------------------------------------------------------------------------- | -------- |
| 1         | Agregar controles UI a Notificaciones (backend ya pagina)                                            | Chico    |
| 2         | Paginar `AdminAuditoriaPage` (backend + frontend)                                                     | Medio    |
| 3         | Paginar `GestionAlimentosPage` y `PacientesPage` (alto volumen en catálogos que crecen)                | Medio    |
| 4         | Paginar `AgendarTurno` (lista de profesionales)                                                       | Medio    |
| 5         | Paginar `TablaEvolucionPaciente`, `GaleriaFotos`, `HistorialTurnosPaciente`, `FichaSaludHistorialModal` | Medio   |
| 6         | Estandarizar patrón: definir si backend (escalable) o client-side (simple) según el caso             | Diseño   |
