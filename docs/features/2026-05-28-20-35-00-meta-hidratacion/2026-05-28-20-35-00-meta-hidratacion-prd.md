# Requerimientos del Sistema: Meta de Hidratación Diaria

## 1. Introducción

### 1.1 Propósito
Este documento especifica los requerimientos funcionales y no funcionales para **Meta de Hidratación Diaria** en NutriFit Supervisor. La feature resuelve la falta de seguimiento digital del consumo de agua: hoy el nutricionista indica metas en consulta (p. ej. "tomá 2L") pero el socio no registra ni visualiza progreso diario. El beneficiario principal es el **socio** (widget en dashboard); secundario el **nutricionista** (configuración y adherencia en ficha del paciente).

### 1.2 Alcance
El módulo comprende:
- Configuración de meta diaria (ml) y tamaño de vaso por defecto por paciente (nutricionista)
- Widget circular de progreso y registro +/- vasos (socio)
- Cálculo de adherencia semanal para el nutricionista
- Registro diario por fecha en timezone Argentina (reset implícito por día calendario)
- Integración con auth JWT, vínculo nutricionista–paciente y dashboards existentes

**Fuera de MVP:** push, wearables, WhatsApp, gamificación, email, export PDF, historial gráfico 7 días para socio, ajuste de vaso por socio (solo default del nutri).

### 1.3 Caso de uso principal
El nutricionista configura en la ficha del paciente una meta de 2000 ml/día con vasos de 250 ml. El socio abre su dashboard, ve el progreso del día y registra cada vaso con un tap; el nutricionista revisa el % de adherencia de los últimos 7 días en la vista del paciente.

**Métricas de éxito (KR):**
- 60% de socios con meta activa registran ≥3 entradas/semana en 30 días
- Señales tempranas: metas configuradas en ≥50% de fichas activas; socios abren widget ≥2 veces/semana

---

## 2. Arquitectura general

### 2.1 Stack Tecnológico
- **Frontend:** React 19 + Vite + TypeScript strict, TanStack Query, TanStack Router, Tailwind CSS v4, shadcn/ui, `apiRequest` en `@/lib/api`
- **Backend:** NestJS + TypeORM + MySQL, Clean Architecture (`domain` / `application` / `infrastructure` / `presentation`)
- **Base de datos:** MySQL; migraciones TypeORM en `apps/backend/src/infrastructure/persistence/typeorm/migrations/`
- **Shared:** `@nutrifit/shared` (roles, códigos de error; extensión opcional para códigos de hidratación)
- **Jobs:** `@nestjs/schedule` ya configurado (`ScheduleModule`, `SchedulersModule`); TZ del proceso en `America/Argentina/Buenos_Aires` (`main.ts`)

### 2.2 Modelo de Datos Conceptual
```
Socio (persona, existente)
  └── MetaHidratacion (1:1 por socio, upsert)
        ├── metaMlDia, vasoMlDefault, activo
        ├── nutricionistaId (quien configuró)
        └── metaMlDiaVigenteDesde (fecha desde la que aplica cambio — ASUMIDO EC-09)
  └── RegistroHidratacionDiaria (1:N por socio, 1 por día)
        ├── fecha (DATE, AR)
        ├── consumidoMl
        ├── metaMlSnapshot (meta del día al primer registro)
        ├── vasoMlSnapshot
        └── updatedAt (last-write-wins EC-05)
```

**Nota:** `FichaSalud.consumoAguaDiario` es dato estático de autopercepción del socio; **no** reemplaza ni se fusiona con este módulo de seguimiento diario.

---

## 3. Roles y Permisos

### 3.1 SOCIO
| Acción | Permitido |
|--------|-----------|
| Ver meta y progreso del día (RF-02) | ✓ |
| Registrar +/- vasos (RF-03) | ✓ (solo con meta activa) |
| Configurar meta de otros | ✗ |
| Ver adherencia semanal ajena | ✗ |

### 3.2 NUTRICIONISTA
| Acción | Permitido |
|--------|-----------|
| Configurar/actualizar meta del paciente (RF-01) | ✓ (paciente con vínculo por turnos) |
| Ver adherencia 7 días (RF-04) | ✓ |
| Registrar consumo como socio | ✗ |
| Ver widget propio de consumo | ✗ |

### 3.3 ADMIN
| Acción | Permitido |
|--------|-----------|
| Todo lo anterior en MVP | ✗ (vista agregada futura, fuera MVP) |

**Autorización existente a reutilizar:**
- `JwtAuthGuard`, `RolesGuard`, `NutricionistaOwnershipGuard` (rutas `profesional/:nutricionistaId/...`)
- Validación de vínculo nutri–socio vía turnos (patrón `GetFichaSaludPacienteUseCase.hasTurnoVinculo`)
- Rutas socio: `@CurrentUserId()` (patrón `turnos.controller` rutas `/socio/...`)

---

## 4. Requerimientos Funcionales

### RF-01: Configurar meta de hidratación (Nutricionista)
**Descripción:** El nutricionista define o actualiza la meta diaria de agua y el tamaño de vaso por defecto desde la sección Hidratación en la ficha/vista del paciente.

**Datos requeridos:**
- `pacienteId` (socioId)
- `metaMlDia` (500–5000, múltiplo de 50)
- `vasoMlDefault` (100–500)
- `activo` (boolean)

**Comportamiento:**
1. Nutricionista abre sección Hidratación en ficha del paciente (`ConsultaProfesionalPage` o vista paciente dedicada).
2. Completa formulario y guarda.
3. Si ya existe configuración para el socio → upsert.
4. Si `activo` pasa a `false` → socio conserva lectura del día pero no puede registrar (EC-08).
5. Si cambia `metaMlDia` → aplica desde el día siguiente; el día en curso usa snapshot en `RegistroHidratacionDiaria` (EC-09, ASUMIDO).

**Validaciones:**
- Paciente pertenece al nutricionista (vínculo por turnos históricos o asignados).
- `metaMlDia` múltiplo de 50; rangos indicados.

**Errores:**
- Paciente no encontrado → 404 (`NotFoundError`)
- Sin permiso / sin vínculo → 403 (`ForbiddenError`)
- Meta inválida → 400 (`ValidationError` + `ValidationPipe`)

**Estados:** `activo` | `inactivo`

---

### RF-02: Consultar meta y progreso del día (Socio)
**Descripción:** El socio consulta su meta, consumo acumulado y progreso visual del día actual (fecha local AR).

**Datos requeridos:**
- `userId` del token JWT → resolución a `socioId`
- Fecha local: `America/Argentina/Buenos_Aires`

**Comportamiento:**
1. GET devuelve: `metaMl`, `vasoMl`, `consumidoMl`, `porcentaje` (cap 100% en UI si supera), `entradas` del día (opcional: contador de taps), `activo`, `fecha`.
2. Sin meta activa → respuesta vacía o flag `sinMeta: true` para empty state en widget.
3. Sin registro del día → `consumidoMl: 0`, `porcentaje: 0`.

**Validaciones:**
- Usuario autenticado con rol SOCIO.

**Errores:**
- No autenticado → 401

**Estados:** empty state | progreso parcial | meta alcanzada | meta superada (EC-03)

---

### RF-03: Registrar consumo de agua (Socio)
**Descripción:** El socio incrementa o decrementa vasos consumidos en el día.

**Datos requeridos:**
- `cantidadVasos`: `-1` | `+1`
- `overrideMl` (opcional; fuera MVP salvo necesidad de corrección manual — ASUMIDO: no exponer en MVP UI)

**Comportamiento:**
1. POST actualiza `consumidoMl` del registro del día: `consumidoMl += cantidadVasos * vasoMl` (o `overrideMl` si se envía).
2. No permitir `consumidoMl < 0`; si decremento llevaría bajo 0 → persistir 0 y responder 200 con `consumidoMl: 0` (EC edge del RF).
3. Crear registro del día en primer acceso (lazy) con snapshot de meta/vaso vigentes.
4. Rate limit: máximo 1 request cada 500 ms por socio (validación en use-case; no hay `@nestjs/throttler` hoy).

**Validaciones:**
- Meta debe estar `activo`.
- `cantidadVasos ∈ {-1, 1}`.

**Errores:**
- Sin meta activa → 409 (`ConflictError`)
- No autenticado → 401
- Payload inválido → 400

---

### RF-04: Ver adherencia semanal (Nutricionista)
**Descripción:** El nutricionista visualiza adherencia de hidratación del paciente en los últimos 7 días calendario (AR).

**Datos requeridos:**
- `pacienteId`
- Ventana: últimos 7 días inclusive (hoy − 6 … hoy)

**Comportamiento:**
1. GET devuelve: `porcentajeDiasCumplidos` (% días con consumo ≥ 80% de meta del día), `promedioMlDia`, `detallePorDia[]` (fecha, metaMl, consumidoMl, cumplido).
2. Días sin registro cuentan como 0% cumplimiento para ese día.

**Validaciones:**
- Paciente con vínculo al nutricionista.

**Errores:**
- 403 / 404 estándar del dominio

---

### RF-05: Reset diario automático
**Descripción:** Cada día calendario AR representa un registro independiente; no se arrastra consumo entre días.

**Comportamiento (decisión de producto):**
- Clave única `(id_socio, fecha)` en `registro_hidratacion_diaria`.
- Al consultar/registrar, el sistema usa `fecha = hoy AR`; un día nuevo implica fila nueva con `consumidoMl = 0` sin job destructivo.
- UI: polling cada 5 min o refresh al volver a la pestaña para detectar cambio de fecha (EC-11).

**ASUMIDO:** No se requiere cron de reset si el modelo es por fecha; ver ADR en plan técnico.

---

## 5. Casos borde

| ID | Escenario | Comportamiento |
|----|-----------|----------------|
| EC-01 | Socio sin meta configurada | Widget: "Tu nutricionista aún no configuró tu meta" |
| EC-02 | 0 vasos registrados | Progreso 0%, círculo vacío |
| EC-03 | Consumo > meta | Barra 100% + texto "¡Meta superada!" sin error |
| EC-04 | Doble tap rápido +1 | Debounce frontend (~300 ms) + rate limit backend 500 ms |
| EC-05 | Dos tabs abiertas | Last-write-wins por `updatedAt`; refetch al `focus` |
| EC-06 | API caída al registrar | Toast error, revertir estado optimista, retry manual |
| EC-07 | Pérdida conexión al guardar meta nutri | Form conserva datos, botón reintentar |
| EC-08 | Nutri desactiva meta mid-day | Socio ve progreso del día; POST devuelve 409 |
| EC-09 | Cambio meta mid-day | Nueva meta desde mañana; hoy usa snapshot del registro (ASUMIDO) |
| EC-10 | Token expirado | Redirect login (flujo estándar `apiRequest` 401) |
| EC-11 | Medianoche con app abierta | Polling 5 min o refetch en `visibilitychange` |
| EC-12 | Alta concurrencia MVP | Índice único `(id_socio, fecha)`; sin preocupación especial MVP |

---

## 6. Requerimientos No Funcionales

### RNF-001: Seguridad
- JWT obligatorio en todos los endpoints.
- Nutricionista solo accede a pacientes con turno vinculado (mismo criterio que ficha de salud).
- Socio solo lee/escribe su propio `socioId` derivado del token.
- Validación de entrada con `class-validator` en DTOs; whitelist en `ValidationPipe`.
- No loguear PII innecesaria; mensajes de error en español sin filtrar datos sensibles.

### RNF-002: Performance
- Índice único `(id_socio, fecha)` en registro diario.
- Consulta adherencia: máximo 7 filas por paciente.
- Rate limit 500 ms en registro para mitigar abuso (EC-04).

### RNF-003: Escalabilidad
- Modelo horizontal por filas diarias; archivado histórico fuera de MVP.
- 10.000 socios concurrentes: aceptable para MVP con índices adecuados (EC-12).

### RNF-004: Disponibilidad
- Fallo de API: UX degradada con retry manual (EC-06, EC-07).
- Sin dependencia de servicios externos.

### RNF-005: Usabilidad
- Registro con un tap (+/-).
- Progreso circular legible; empty states claros en español.
- Cumplir patrones de `DESIGN_SYSTEM.md` y cards del dashboard socio.

### RNF-006: Mantenibilidad
- Módulo `hidratacion` siguiendo capas del monorepo.
- Tests unitarios en use-cases críticos (configurar, registrar, adherencia).
- Migración TypeORM versionada.

---

## 7. API Endpoints (Backend)

Convención: sin prefijo global `/api`; rutas alineadas a `turnos` y `progreso`. Respuestas envueltas por `ApiResponse` interceptor.

### 7.1 Nutricionista (config + adherencia)
```
PUT    /hidratacion/profesional/:nutricionistaId/pacientes/:socioId/meta
GET    /hidratacion/profesional/:nutricionistaId/pacientes/:socioId/meta
GET    /hidratacion/profesional/:nutricionistaId/pacientes/:socioId/adherencia
```
Guards: `JwtAuthGuard`, `RolesGuard`, `NutricionistaOwnershipGuard`, rol `NUTRICIONISTA`.

### 7.2 Socio (progreso + registro)
```
GET    /hidratacion/socio/dia
POST   /hidratacion/socio/consumo
```
Guards: `JwtAuthGuard`, `RolesGuard`, rol `SOCIO`; `socioId` desde `@CurrentUserId()`.

---

## 8. Consideraciones de Implementación

### 8.1 Integración con Monorepo Existente
- Nuevo `HidratacionModule` en `application/hidratacion` (no mezclar con entidad `objetivo` de progreso corporal).
- Registrar controller en `controllers.module.ts` y entidades en `TypeOrmModule.forFeature`.
- Frontend: componentes en `components/hidratacion/`; integrar en `DashboardSocio.tsx` y `ConsultaProfesionalPage.tsx` (o `ProgresoPacientePage.tsx` para adherencia).
- Patrón de datos: TanStack Query + `apiRequest`, igual que `ObjetivosCard`.

### 8.2 Configuración de Servicios Externos
- Ninguna en MVP.

### 8.3 Variables de Entorno Adicionales
```
# Opcional — solo si se implementa cron de mantenimiento (no MVP recomendado)
HIDRATACION_CRON_EXPR=0 0 * * *
```
Por defecto no requeridas; reset por clave de fecha.

---

## 9. Fases de Desarrollo Sugeridas

### Fase 1: MVP Backend + datos
- Migración `meta_hidratacion` + `registro_hidratacion_diaria`
- RF-01, RF-02, RF-03, RF-05 (lazy por fecha)
- Tests unitarios use-cases

### Fase 2: MVP Frontend
- `WidgetHidratacion` en dashboard socio
- `SeccionHidratacion` en ficha paciente nutri
- Edge cases EC-01 a EC-04, EC-08, EC-10

### Fase 3: Adherencia y pulido
- RF-04 adherencia nutri
- EC-05, EC-06, EC-07, EC-11
- Código de error en `@nutrifit/shared` si se estandariza 409 meta inactiva

---

## 10. Criterios de Aceptación Generales

1. Nutricionista con paciente vinculado puede guardar meta (upsert) y desactivarla; validaciones de rango respetadas.
2. Socio con meta activa ve progreso del día y puede +/- vasos; consumo no baja de 0; sin meta muestra empty state.
3. Socio con meta inactiva no puede registrar (409); puede ver progreso del día si ya existía registro.
4. Adherencia 7 días visible para nutricionista con % días ≥80% meta y promedio ml/día.
5. Cambio de día AR crea nuevo contador sin arrastrar ml del día anterior (verificable cruzando medianoche o mock de fecha).
6. `npm run build:backend`, `npm run typecheck`, `npm run lint` sin regresiones en workspaces tocados.
