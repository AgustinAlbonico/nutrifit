# Funcionalidades Pendientes - NutriFit Supervisor

## 📋 Resumen Ejecutivo

Este documento lista las funcionalidades pendientes de implementación identificadas durante el testing del sistema.

**Última actualización:** 2026-02-23 - Sprint 1 UX COMPLETADO ✅

---

## ✅ COMPLETADO - Sprint 1 UX/Navegación

### 1. Sidebar del Nutricionista ✅
**Estado:** COMPLETADO

| Funcionalidad | Estado |
|---------------|--------|
| Ver lista de pacientes | ✅ Link `/pacientes` |
| Gestionar planes de alimentación | ✅ Link `/planes` |
| Ver progreso de pacientes | ✅ Accesible desde consulta y pacientes |
| Acceder al editor de planes | ✅ Link `/planes` + desde consulta |

### 2. Acceso a Planes desde Consulta Profesional ✅
**Estado:** COMPLETADO
- Sección "Plan de Alimentación" con botones:
  - Crear/Editar plan → `/profesional/plan/:socioId/editar`
  - Ver progreso → `/profesional/paciente/:socioId/progreso`

### 3. Sidebar del Socio - "Mi Progreso" ✅
**Estado:** COMPLETADO
- Link `/mi-progreso` agregado al Sidebar.tsx

### 4. Páginas de Gestión ✅
**Estado:** COMPLETADO
- `PacientesPage.tsx` - Lista de pacientes del nutricionista
- `GestionPlanesPage.tsx` - Gestión de planes del nutricionista

---

## 🟡 MEDIO - Funcionalidades Incompletas

### 5. MiPlanPage (Socio) - Vista muy básica
**Problema:** Solo muestra objetivo y cantidad de días, no el detalle de comidas.

**Mejoras necesarias:**
- Mostrar cada día con sus comidas detalladas
- Listar alimentos de cada comida
- Indicador de calorías/macros diarias
- Botón para descargar PDF del plan

---

## 🟢 MEJORAS UX

### 6. Dashboard del Nutricionista
**Mejoras sugeridas:**
- Resumen de turnos del día
- Pacientes con consultas recientes
- Alertas de pacientes sin seguimiento

### 7. Dashboard del Socio
**Mejoras sugeridas:**
- Resumen de próximo turno
- Indicador de progreso (peso actual, IMC)
- Motivación/mensajes

### 8. Notificaciones
**Funcionalidad completa NO implementada:**
- Recordatorios de turnos (email/push)
- Alertas de planes por vencer
- Notificaciones de nuevos planes asignados

---

## 🔵 FUNCIONALIDADES DEL TFI NO IMPLEMENTADAS

Según el documento TFI original, estas funcionalidades están definidas pero NO implementadas:

| RF | Funcionalidad | Estado |
|----|---------------|--------|
| RF36-RF39 | Asistente IA para sugerencias de comidas | ❌ No implementado |
| RF44-RF46 | Sistema de notificaciones | ❌ No implementado |
| - | Registro de comidas del socio (diario alimentario) | ❌ No implementado |
| - | Feedback/comentarios del socio sobre el plan | ❌ No implementado |
| - | Estadísticas avanzadas (macros, gráficos de nutrientes) | ❌ Parcial |

---

## 📊 Estado por Módulo

### ✅ Módulo Turnos y Consultas
- [x] CRUD de turnos
- [x] Estados de turno
- [x] Check-in / Iniciar consulta
- [x] Finalizar consulta
- [x] Mediciones durante consulta
- [x] Sección de planes en consulta

### ✅ Módulo Progreso
- [x] ProgresoSocioPage
- [x] ProgresoPacientePage
- [x] Gráficos de evolución
- [x] Tabla de historial
- [x] Export CSV
- [x] Link en menú del socio
- [x] Acceso desde lista de pacientes

### ✅ Módulo Planes de Alimentación
- [x] Backend CRUD completo
- [x] PlanEditorPage con selector de alimentos
- [x] FoodSearchDialog con categorías
- [x] WeeklyPlanGrid 7×5
- [x] DailyTotalsCard
- [x] ExportPlanPDFButton
- [x] Acceso desde sidebar nutricionista
- [x] Acceso desde consulta profesional
- [ ] MiPlanPage con vista detallada (mejora pendiente)

### ✅ Módulo Gestión de Pacientes
- [x] Endpoint `/turnos/profesional/:id/pacientes`
- [x] Página de lista de pacientes (PacientesPage)
- [x] Búsqueda por nombre/DNI
- [x] Acceso rápido a progreso y planes

### ❌ Módulo Notificaciones
- [ ] Backend de notificaciones
- [ ] Frontend de notificaciones
- [ ] Email service
- [ ] Push notifications

### ❌ Módulo Asistente IA
- [ ] Integración con API de IA
- [ ] Sugerencias de comidas
- [ ] Recomendaciones personalizadas

---

## 🚀 Recomendación de Prioridad

### ~~Sprint 1 (Urgente - UX Básico)~~ ✅ COMPLETADO
1. ~~Agregar "Mi Progreso" al sidebar del socio~~ ✅
2. ~~Agregar "Mis Pacientes" al sidebar del nutricionista~~ ✅
3. ~~Agregar "Planes" al sidebar del nutricionista~~ ✅
4. ~~Agregar sección de plan en ConsultaProfesionalPage~~ ✅

### Sprint 2 (Mejoras de Planes)
1. Mejorar vista de MiPlanPage con detalle de comidas

### Sprint 3 (Funcionalidades Avanzadas)
1. Dashboard mejorado para nutricionista
2. Dashboard mejorado para socio

### Sprint 4 (Nice to have)
1. Sistema de notificaciones
2. Asistente IA
3. Registro alimentario del socio

---

## 📝 Notas de Implementación

### Archivos implementados en Sprint 1:
- `src/components/layout/Sidebar.tsx` - Links agregados ✅
- `src/pages/ConsultaProfesionalPage.tsx` - Sección planes ✅
- `src/pages/PacientesPage.tsx` - Lista de pacientes ✅
- `src/pages/GestionPlanesPage.tsx` - Gestión de planes ✅
- `src/components/plan/*.tsx` - Componentes del editor ✅

### Endpoints utilizados:
- `GET /turnos/profesional/:id/pacientes` - Lista de pacientes
- `GET /planes-alimentacion/socio/:id/activo` - Plan activo
- `GET /planes-alimentacion/socio/:id` - Historial de planes
- `POST /planes-alimentacion` - Crear plan
- `PUT /planes-alimentacion/:id` - Editar plan
- `GET /alimentos` - Lista de alimentos para selector
- `GET /alimentos/grupos` - Grupos alimenticios
