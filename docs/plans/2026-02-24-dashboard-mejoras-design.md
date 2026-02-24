# Diseño: Mejoras de Dashboards por Rol

**Fecha:** 2026-02-24  
**Estado:** Aprobado  
**Alcance:** Dashboards para Nutricionista, Socio y Recepcionista

---

## 1. Contexto

### Estado Actual
- **Dashboard Nutricionista:** 2 cards básicas (Turnos del día, Pacientes recientes)
- **Dashboard Socio:** 3 cards (Próximo turno, Mi progreso, Mensaje motivacional)
- **Dashboard Recepcionista:** NO EXISTE - Solo ve rol y permisos genéricos
- **Dashboard Admin:** NO TIENE específico

### Objetivo
Rediseñar completamente los dashboards con enfoque modular, agregando KPIs, gráficos, acciones rápidas y mejorando la experiencia de usuario.

---

## 2. Enfoque de Diseño: Layout Modular

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Título + descripción + gradiente naranja/rosa         │
├─────────────────────────────────────────────────────────────────┤
│  KPIs: Cards horizontales con métricas principales             │
├─────────────────────────────────────────────────────────────────┤
│  GRID 2-3 COLUMNAS: Contenido principal (cards más grandes)    │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER: Acciones rápidas / información adicional              │
└─────────────────────────────────────────────────────────────────┘
```

**Ventajas:**
- Fácil de escalar y mantener
- Cada widget es independiente
- Consistente con el diseño actual (shadcn/ui)
- Permite agregar/quitar funcionalidades sin romper el layout

---

## 3. Dashboard Nutricionista

### Sección 1: KPIs (Fila superior - 4 cards pequeñas)

| Card | Dato | Endpoint | Icono |
|------|------|----------|-------|
| Pacientes Activos | Número total | `GET /turnos/profesional/:id/pacientes` | Users |
| Turnos Hoy | Cantidad + badge | `GET /turnos/profesional/:id/hoy` | Calendar |
| Planes Creados | Total este mes | `GET /planes-alimentacion/nutricionista/:id` | FileText |
| Consultas Pendientes | Sin completar | `GET /turnos/profesional/:id/hoy` (filter) | Clock |

### Sección 2: Grid Principal (2 columnas)

**Columna Izquierda:**
- **Turnos de Hoy** (lista completa con estados, máximo 5, ver más)
- **Acciones Rápidas** (botones: Crear Plan, Asignar Turno, Ver Agenda)

**Columna Derecha:**
- **Pacientes Recientes** (últimos 5 con objetivo y última consulta)
- **Paciente Destacado** (seleccionable, con mini-gráfico de progreso)

### Sección 3: Footer
- Preview de turnos de mañana (2-3 próximos)

---

## 4. Dashboard Socio

### Sección 1: KPIs (Fila superior - 3 cards)

| Card | Dato | Endpoint | Icono |
|------|------|----------|-------|
| Próximo Turno | Fecha + hora | `GET /turnos/socio/mis-turnos` | Calendar |
| Mi IMC | Valor + clasificación | `GET /turnos/socio/mi-progreso` | Activity |
| Progreso | kg restantes para objetivo | `GET /turnos/socio/mi-progreso` | Target |

### Sección 2: Grid Principal (2 columnas)

**Columna Izquierda:**
- **Mi Plan Alimenticio** (comidas del día actual con detalle)
- **Mis Objetivos** (lista con barras de progreso visual)

**Columna Derecha:**
- **Gráfico de Progreso** (evolución peso/IMC en el tiempo, recharts)
- **Mensaje Motivacional** (card con gradiente, frase del día)

### Sección 3: Footer
- **Acciones Rápidas**: [Reservar Turno] [Ver Mi Plan] [Subir Foto]

---

## 5. Dashboard Recepcionista (NUEVO)

### Sección 1: KPIs (Fila superior - 4 cards)

| Card | Dato | Endpoint | Icono |
|------|------|----------|-------|
| Turnos Hoy | Total programados | `GET /turnos/recepcion/dia` | Calendar |
| Check-ins | Pacientes atendidos | `GET /turnos/recepcion/dia` (filter) | CheckCircle |
| Pendientes | Sin atender | `GET /turnos/recepcion/dia` (filter) | Clock |
| Cancelaciones | Turnos cancelados hoy | `GET /turnos/recepcion/dia` (filter) | XCircle |

### Sección 2: Grid Principal (2 columnas)

**Columna Izquierda:**
- **Turnos del Día** (tabla completa con estados y acciones de check-in)
- **Acciones Rápidas** (Registrar Paciente, Asignar Turno, Check-in Manual)

**Columna Derecha:**
- **Agenda Profesionales** (disponibilidad del día con slots libres/ocupados)
- **Últimos Pacientes Registrados** (5 más recientes)

### Sección 3: Footer
- Resumen del día (texto con estadísticas finales)

---

## 6. Componentes a Crear

### Componentes Nuevos

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `EstadisticasKpiCard` | `/components/dashboard/` | Card pequeña con número, ícono y label |
| `AccionesRapidasCard` | `/components/dashboard/` | Botones de acción rápida con iconos |
| `PlanAlimenticioCard` | `/components/dashboard/` | Muestra plan del día (Socio) |
| `GraficoProgresoCard` | `/components/dashboard/` | Gráfico de evolución con recharts (Socio) |
| `ObjetivosCard` | `/components/dashboard/` | Lista de objetivos con progreso visual (Socio) |
| `AgendaProfesionalesCard` | `/components/dashboard/` | Disponibilidad del día (Recepcionista) |
| `TurnosTablaCard` | `/components/dashboard/` | Tabla con estados y acciones (Recepcionista) |
| `PacienteDestacadoCard` | `/components/dashboard/` | Mini-gráfico y selector (Nutricionista) |
| `DashboardRecepcionista` | `/pages/` | Página completa del dashboard |

### Componentes a Modificar

| Componente | Cambios |
|------------|---------|
| `Dashboard.tsx` | Redirigir recepcionista a `DashboardRecepcionista` |
| `DashboardNutricionista.tsx` | Agregar KPIs, acciones rápidas, paciente destacado |
| `DashboardSocio.tsx` | Agregar plan, gráfico, objetivos, acciones rápidas |

---

## 7. Dependencias Técnicas

### Librerías Necesarias
- **recharts** - Para gráficos de progreso
- **lucide-react** - Ya instalado, para iconos
- **shadcn/ui** - Cards, badges, buttons ya instalados

### Endpoints Backend (Ya existen)
- `GET /turnos/profesional/:id/hoy`
- `GET /turnos/profesional/:id/pacientes`
- `GET /turnos/socio/mis-turnos`
- `GET /turnos/socio/mi-progreso`
- `GET /planes-alimentacion/socio/:id/activo`
- `GET /turnos/recepcion/dia`
- `GET /progreso/:id/objetivos`

---

## 8. Criterios de Aceptación

### Dashboard Nutricionista
- [ ] Muestra 4 KPIs con datos reales
- [ ] Lista de turnos del día con estados
- [ ] Acciones rápidas funcionales (navegan a las páginas correctas)
- [ ] Pacientes recientes con objetivo visible
- [ ] Paciente destacado con gráfico mini

### Dashboard Socio
- [ ] Muestra 3 KPIs con datos reales
- [ ] Plan alimenticio del día visible (o mensaje si no tiene)
- [ ] Gráfico de progreso con datos históricos
- [ ] Objetivos con barras de progreso
- [ ] Acciones rápidas funcionales

### Dashboard Recepcionista
- [ ] Muestra 4 KPIs con datos reales
- [ ] Tabla de turnos con acciones de check-in
- [ ] Agenda de profesionales visible
- [ ] Acciones rápidas funcionales
- [ ] Últimos pacientes registrados

---

## 9. Orden de Implementación Sugerido

1. **Fase 1 - Componentes base**
   - `EstadisticasKpiCard`
   - `AccionesRapidasCard`

2. **Fase 2 - Dashboard Nutricionista**
   - Modificar `DashboardNutricionista.tsx`
   - `PacienteDestacadoCard`

3. **Fase 3 - Dashboard Socio**
   - `PlanAlimenticioCard`
   - `GraficoProgresoCard`
   - `ObjetivosCard`
   - Modificar `DashboardSocio.tsx`

4. **Fase 4 - Dashboard Recepcionista**
   - `TurnosTablaCard`
   - `AgendaProfesionalesCard`
   - Crear `DashboardRecepcionista.tsx`
   - Modificar `Dashboard.tsx`

---

## 10. Notas Adicionales

- Los KPIs se calculan en frontend a partir de los datos de los endpoints existentes
- Los gráficos usan recharts (librería ligera y compatible con React)
- El diseño mantiene la paleta de colores actual (naranja/rosa)
- Las acciones rápidas navegan a páginas existentes (no crean nuevas funcionalidades)
