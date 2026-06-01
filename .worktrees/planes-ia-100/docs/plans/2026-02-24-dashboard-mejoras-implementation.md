# Plan de Implementación: Mejoras de Dashboards por Rol

**Diseño:** `docs/plans/2026-02-24-dashboard-mejoras-design.md`  
**Fecha:** 2026-02-24

---

## Resumen de Tareas

| # | Tarea | Prioridad | Estimación |
|---|-------|-----------|------------|
| 1 | Instalar recharts | Alta | 2 min |
| 2 | Crear EstadisticasKpiCard | Alta | 15 min |
| 3 | Crear AccionesRapidasCard | Alta | 15 min |
| 4 | Mejorar DashboardNutricionista | Alta | 30 min |
| 5 | Crear PacienteDestacadoCard | Media | 20 min |
| 6 | Crear PlanAlimenticioCard | Alta | 25 min |
| 7 | Crear GraficoProgresoCard | Alta | 30 min |
| 8 | Crear ObjetivosCard | Media | 20 min |
| 9 | Mejorar DashboardSocio | Alta | 30 min |
| 10 | Crear TurnosTablaCard | Alta | 30 min |
| 11 | Crear AgendaProfesionalesCard | Media | 25 min |
| 12 | Crear DashboardRecepcionista | Alta | 40 min |
| 13 | Modificar Dashboard.tsx | Alta | 10 min |
| 14 | Testing y ajustes | Alta | 30 min |

**Total estimado:** ~5 horas

---

## Fase 1: Setup y Componentes Base

### Tarea 1: Instalar recharts
```bash
cd apps/frontend && npm install recharts
```

### Tarea 2: Crear EstadisticasKpiCard
**Archivo:** `apps/frontend/src/components/dashboard/EstadisticasKpiCard.tsx`

**Props:**
```typescript
interface EstadisticasKpiCardProps {
  titulo: string;
  valor: number | string;
  icono: React.ReactNode;
  descripcion?: string;
  badge?: { texto: string; color: string };
}
```

**Comportamiento:**
- Card pequeña con borde gradiente superior
- Icono a la izquierda, valor grande a la derecha
- Badge opcional para estados
- Skeleton mientras carga

### Tarea 3: Crear AccionesRapidasCard
**Archivo:** `apps/frontend/src/components/dashboard/AccionesRapidasCard.tsx`

**Props:**
```typescript
interface AccionRapida {
  etiqueta: string;
  icono: React.ReactNode;
  onClick: () => void;
  variante?: 'default' | 'outline' | 'ghost';
}

interface AccionesRapidasCardProps {
  acciones: AccionRapida[];
}
```

**Comportamiento:**
- Grid de botones (2 columnas en mobile, 3-4 en desktop)
- Icono + texto
- Click navega a la página correspondiente

---

## Fase 2: Dashboard Nutricionista

### Tarea 4: Mejorar DashboardNutricionista
**Archivo:** `apps/frontend/src/pages/DashboardNutricionista.tsx`

**Cambios:**
1. Agregar sección de KPIs (4 cards)
2. Reorganizar grid principal (2 columnas)
3. Agregar AccionesRapidasCard
4. Agregar sección de paciente destacado

**Queries necesarias:**
```typescript
// Pacientes activos
const { data: pacientes } = useQuery({
  queryKey: ['pacientes-nutricionista', personaId],
  queryFn: () => apiRequest(`/turnos/profesional/${personaId}/pacientes`),
});

// Planes creados este mes
const { data: planes } = useQuery({
  queryKey: ['planes-nutricionista', personaId],
  queryFn: () => apiRequest(`/planes-alimentacion/nutricionista/${personaId}`),
});
```

### Tarea 5: Crear PacienteDestacadoCard
**Archivo:** `apps/frontend/src/components/dashboard/PacienteDestacadoCard.tsx`

**Funcionalidad:**
- Selector de paciente (dropdown o lista)
- Mini gráfico de progreso del paciente seleccionado
- Datos básicos: nombre, IMC, último peso

---

## Fase 3: Dashboard Socio

### Tarea 6: Crear PlanAlimenticioCard
**Archivo:** `apps/frontend/src/components/dashboard/PlanAlimenticioCard.tsx`

**Endpoint:** `GET /planes-alimentacion/socio/:id/activo`

**Funcionalidad:**
- Mostrar plan activo con comidas del día actual
- Si no hay plan, mostrar mensaje "Sin plan activo"
- Link a página de planes completos

### Tarea 7: Crear GraficoProgresoCard
**Archivo:** `apps/frontend/src/components/dashboard/GraficoProgresoCard.tsx`

**Endpoint:** `GET /turnos/socio/mi-historial-mediciones`

**Funcionalidad:**
- Gráfico de línea con evolución de peso
- Línea de referencia con objetivo
- Tooltips con valores
- Usar recharts: `LineChart`, `XAxis`, `YAxis`, `Line`, `ReferenceLine`

### Tarea 8: Crear ObjetivosCard
**Archivo:** `apps/frontend/src/components/dashboard/ObjetivosCard.tsx`

**Endpoint:** `GET /progreso/:id/objetivos`

**Funcionalidad:**
- Lista de objetivos con barras de progreso
- Estado: completado / en progreso / pendiente
- Porcentaje de cumplimiento

### Tarea 9: Mejorar DashboardSocio
**Archivo:** `apps/frontend/src/pages/DashboardSocio.tsx`

**Cambios:**
1. Agregar sección de KPIs (3 cards)
2. Reorganizar grid con plan y gráfico
3. Agregar ObjetivosCard
4. Agregar AccionesRapidasCard en footer

---

## Fase 4: Dashboard Recepcionista

### Tarea 10: Crear TurnosTablaCard
**Archivo:** `apps/frontend/src/components/dashboard/TurnosTablaCard.tsx`

**Endpoint:** `GET /turnos/recepcion/dia`

**Funcionalidad:**
- Tabla con columnas: Hora, Paciente, Profesional, Estado, Acciones
- Acciones: Check-in, Ver detalle
- Filtros por estado
- Badge de estado con colores

### Tarea 11: Crear AgendaProfesionalesCard
**Archivo:** `apps/frontend/src/components/dashboard/AgendaProfesionalesCard.tsx`

**Endpoint:** `GET /turnos/admin/profesional/:id/disponibilidad` (para cada profesional)

**Funcionalidad:**
- Lista de profesionales con slots del día
- Indicador visual: disponible / ocupado
- Click para ver detalle

### Tarea 12: Crear DashboardRecepcionista
**Archivo:** `apps/frontend/src/pages/DashboardRecepcionista.tsx`

**Estructura:**
- Header con gradiente
- 4 KPIs
- Grid 2 columnas: TurnosTablaCard + AgendaProfesionalesCard
- Footer con AccionesRapidasCard

### Tarea 13: Modificar Dashboard.tsx
**Archivo:** `apps/frontend/src/pages/Dashboard.tsx`

**Cambios:**
```typescript
// Agregar caso para recepcionista
if (rol === 'RECEPCIONISTA') {
  return <DashboardRecepcionista />;
}
```

---

## Fase 5: Testing y Ajustes

### Tarea 14: Testing
- [ ] Verificar que cada KPI muestra datos correctos
- [ ] Verificar acciones rápidas navegan correctamente
- [ ] Verificar gráficos renderizan con datos
- [ ] Verificar responsive en mobile
- [ ] Verificar estados de carga (skeleton)
- [ ] Verificar estados vacíos (sin datos)

---

## Orden de Ejecución Recomendado

```
1. Instalar recharts
2. EstadisticasKpiCard
3. AccionesRapidasCard
4. DashboardNutricionista (mejoras)
5. PacienteDestacadoCard
6. DashboardSocio (mejoras)
7. PlanAlimenticioCard
8. GraficoProgresoCard
9. ObjetivosCard
10. TurnosTablaCard
11. AgendaProfesionalesCard
12. DashboardRecepcionista (nuevo)
13. Dashboard.tsx (modificar)
14. Testing final
```

---

## Notas de Implementación

1. **Reutilizar componentes existentes** de shadcn/ui (Card, Badge, Button)
2. **Usar useAuth()** para obtener token y personaId
3. **Manejar estados de carga** con skeletons
4. **Manejar estados vacíos** con mensajes amigables
5. **Responsive:** Grid se adapta de 2 a 1 columna en mobile
6. **Colores:** Mantener paleta naranja/rosa actual
