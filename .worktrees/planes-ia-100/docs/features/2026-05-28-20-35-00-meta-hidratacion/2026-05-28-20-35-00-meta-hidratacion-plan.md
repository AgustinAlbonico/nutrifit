# Plan: Meta de Hidratación Diaria

## Objetivo

Implementar seguimiento digital de hidratación: el nutricionista configura meta y vaso por paciente; el socio registra consumo diario en el dashboard; el profesional consulta adherencia semanal — reutilizando auth, vínculo por turnos y arquitectura Clean del monorepo NutriFit.

---

## Decisiones de diseño

| # | Tema | Decisión |
|---|------|----------|
| 1 | Ubicación backend | Módulo nuevo `application/hidratacion` + `HidratacionController` en `presentation/http/controllers/` (no extender `ProgresoController`; dominio distinto de objetivos corporales/fotos) |
| 2 | Rutas API | Prefijo `hidratacion`; nutri bajo `profesional/:nutricionistaId/pacientes/:socioId/...` (igual que `turnos.controller`); socio bajo `socio/...` con `@CurrentUserId()` |
| 3 | Autorización nutri–paciente | Reutilizar lógica `hasTurnoVinculo` de `GetFichaSaludPacienteUseCase` (servicio compartido o método en repositorio de turnos) |
| 4 | Reset diario | **Lazy por fecha** (PK lógica socio + fecha DATE AR); sin cron obligatorio en MVP — ver ADR |
| 5 | Cambio de meta intradía | Campo `meta_ml_vigente_desde` en `meta_hidratacion`; registro diario guarda `meta_ml_snapshot` al primer write del día (EC-09) |
| 6 | Rate limit | Validación en `RegistrarConsumoHidratacionUseCase` con umbral 500 ms por `socioId` (cache en memoria del proceso; documentar limitación multi-instancia) |
| 7 | Coexistencia ficha salud | `FichaSalud.consumoAguaDiario` permanece; no migrar ni sincronizar automáticamente |
| 8 | Shared package | Opcional: `CODIGOS_ERROR.META_HIDRATACION_INACTIVA` en `packages/shared` — solo si se unifica manejo frontend |
| 9 | Frontend | Componentes dedicados + TanStack Query; integración mínima en páginas existentes |
| 10 | Tests | Jest en use-cases (`--runInBand`); Vitest opcional para widget si hay lógica de cálculo extraída |

---

## ADR: Reset diario — Cron vs Lazy por fecha

### Contexto
RF-05 pide reset a medianoche AR. El stack ya usa `@nestjs/schedule` (`AusenciaTurnoScheduler`, `AlimentosSyncScheduler`) y `process.env.TZ = 'America/Argentina/Buenos_Aires'` en `main.ts`.

### Decisión
**Lazy por fecha (recomendado para MVP):** cada día es una fila `registro_hidratacion_diaria` con `UNIQUE(id_socio, fecha)`. Al GET/POST del socio, se resuelve `fecha = hoy AR` y se crea o lee esa fila. No hay contador global que resetear.

### Alternativa evaluada — Cron medianoche
Job `@Cron('0 0 * * *')` que inserta filas vacías o pone `consumido_ml = 0` para todos los socios activos.

### Consecuencias
| | Lazy por fecha | Cron |
|---|----------------|------|
| Complejidad | Baja | Media-alta (batch, fallos, reintentos) |
| Consistencia multi-instancia | Natural por PK | Riesgo de doble job |
| Carga DB | Solo socios que usan la app | Potencial insert masivo nocturno |
| Medianoche (EC-11) | UI detecta nueva `fecha` al refetch | Pre-crea filas |

**Conclusión:** No implementar cron de reset en MVP. Si en el futuro se necesita precálculo analítico, agregar job opcional de mantenimiento sin reemplazar el modelo por fecha.

---

## Arquitectura general

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite + React)                    │
│  WidgetHidratacion.tsx          → DashboardSocio.tsx             │
│  SeccionHidratacionPaciente.tsx → ConsultaProfesionalPage.tsx    │
│  TarjetaAdherenciaHidratacion   → ProgresoPacientePage (opt.)    │
│  hooks: useHidratacionDia, useAdherenciaHidratacion              │
└─────────────────────────────────────────────────────────────────┘
                        │ apiRequest + TanStack Query
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  HidratacionController (@Controller('hidratacion'))              │
│    → ConfigurarMetaHidratacionUseCase                            │
│    → ObtenerProgresoDiaSocioUseCase                              │
│    → RegistrarConsumoHidratacionUseCase                          │
│    → ObtenerAdherenciaSemanalUseCase                             │
│  Guards: JwtAuthGuard, RolesGuard, NutricionistaOwnershipGuard   │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  TypeORM: meta_hidratacion, registro_hidratacion_diaria          │
│  Repositories: MetaHidratacionRepository, RegistroDiarioRepository│
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujos principales

### Flujo 1: Configurar meta (Nutricionista)
```
Nutricionista → PUT /hidratacion/profesional/:id/pacientes/:socioId/meta
  → NutricionistaOwnershipGuard
  → Validar vínculo turno
  → Upsert meta_hidratacion
  → Response DTO
```

### Flujo 2: Registrar vaso (Socio)
```
Socio → POST /hidratacion/socio/consumo { cantidadVasos: 1 }
  → Resolver socioId desde userId
  → Verificar meta.activo
  → Rate limit 500ms
  → Upsert registro fecha=hoy AR (snapshot meta/vaso si nuevo)
  → consumidoMl += vasoMl * cantidadVasos (floor 0)
  → Response progreso actualizado
```

### Flujo 3: Adherencia semanal (Nutricionista)
```
Nutricionista → GET .../adherencia
  → Vínculo paciente
  → Query 7 fechas
  → Por cada día: cumplido = consumidoMl >= 0.8 * metaMlSnapshot (o meta del día)
  → Agregar % y promedio
```

---

## Modelo de datos

### Tabla: `meta_hidratacion`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_meta_hidratacion | INT PK AI | Identificador |
| id_socio | INT UNIQUE FK → persona | Un socio, una meta |
| id_nutricionista | INT FK → persona | Quien configuró por última vez |
| meta_ml_dia | INT NOT NULL | 500–5000, múltiplo 50 |
| vaso_ml_default | INT NOT NULL | 100–500, default 250 |
| activo | TINYINT(1) NOT NULL | Default 1 |
| meta_ml_vigente_desde | DATE NULL | Próxima fecha de aplicación tras cambio (EC-09) |
| created_at | DATETIME(6) | |
| updated_at | DATETIME(6) | |

### Tabla: `registro_hidratacion_diaria`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_registro | INT PK AI | |
| id_socio | INT FK | |
| fecha | DATE NOT NULL | Día calendario AR |
| consumido_ml | INT NOT NULL DEFAULT 0 | ≥ 0 |
| meta_ml_snapshot | INT NOT NULL | Meta vigente al crear registro |
| vaso_ml_snapshot | INT NOT NULL | Vaso vigente al crear registro |
| cantidad_entradas | INT NOT NULL DEFAULT 0 | Contador taps (opcional analytics) |
| updated_at | DATETIME(6) | Last-write-wins |

**Índices:**
- `UNIQUE IDX_REGISTRO_SOCIO_FECHA (id_socio, fecha)`
- `IDX_REGISTRO_FECHA (fecha)` — mantenimiento futuro

### Entidades dominio (opcional, alineado a `ObjetivoEntity`)
- `MetaHidratacionEntity` — reglas: `esMultiploDe50()`, `puedeRegistrar()`
- `RegistroHidratacionDiariaEntity` — `aplicarVaso(cantidadVasos)`, `porcentaje()`, `superaMeta()`

### DTOs (application/hidratacion/dtos/)
- `ConfigurarMetaHidratacionDto` — class-validator
- `RegistrarConsumoHidratacionDto` — `cantidadVasos`, `overrideMl?`
- `ProgresoDiaHidratacionResponseDto`
- `AdherenciaSemanalHidratacionResponseDto`
- `MetaHidratacionResponseDto`

---

## Fases de implementación

### Fase 1 — Backend núcleo (MVP datos + API socio/nutri config)
Migración, entidades ORM, repositorios, use-cases RF-01/02/03, controller, registro en módulos.

**Dependencias:** Ninguna nueva externa.

**Endpoints:**
- `PUT/GET .../meta`
- `GET /hidratacion/socio/dia`
- `POST /hidratacion/socio/consumo`

### Fase 2 — Frontend MVP
Widget socio + sección nutri en ficha; debounce y empty states.

**Dependencias:** Fase 1 desplegada o mockeada.

### Fase 3 — Adherencia + hardening
RF-04, tests, EC-05/06/11, código error shared opcional.

**Dependencias:** Fases 1–2.

---

## Orden de ejecución

```
Fase 1 (Backend)
    ↓
Fase 2 (Frontend MVP)
    ↓
Fase 3 (Adherencia + QA)
```

---

## Archivos a crear

| Archivo | Fase |
|---------|------|
| `apps/backend/src/infrastructure/persistence/typeorm/migrations/20260528120000-AddMetaHidratacion.ts` | 1 |
| `apps/backend/src/infrastructure/persistence/typeorm/entities/meta-hidratacion.entity.ts` | 1 |
| `apps/backend/src/infrastructure/persistence/typeorm/entities/registro-hidratacion-diaria.entity.ts` | 1 |
| `apps/backend/src/domain/entities/Hidratacion/meta-hidratacion.entity.ts` | 1 |
| `apps/backend/src/domain/entities/Hidratacion/registro-hidratacion-diaria.entity.ts` | 1 |
| `apps/backend/src/infrastructure/persistence/typeorm/repositories/meta-hidratacion.repository.ts` | 1 |
| `apps/backend/src/infrastructure/persistence/typeorm/repositories/registro-hidratacion-diaria.repository.ts` | 1 |
| `apps/backend/src/application/hidratacion/hidratacion.module.ts` | 1 |
| `apps/backend/src/application/hidratacion/dtos/*.ts` | 1 |
| `apps/backend/src/application/hidratacion/use-cases/configurar-meta-hidratacion.use-case.ts` | 1 |
| `apps/backend/src/application/hidratacion/use-cases/obtener-meta-hidratacion.use-case.ts` | 1 |
| `apps/backend/src/application/hidratacion/use-cases/obtener-progreso-dia-socio.use-case.ts` | 1 |
| `apps/backend/src/application/hidratacion/use-cases/registrar-consumo-hidratacion.use-case.ts` | 1 |
| `apps/backend/src/application/hidratacion/use-cases/obtener-adherencia-semanal.use-case.ts` | 3 |
| `apps/backend/src/application/hidratacion/use-cases/*.spec.ts` | 1–3 |
| `apps/backend/src/application/hidratacion/services/validar-vinculo-nutri-socio.service.ts` | 1 |
| `apps/backend/src/application/hidratacion/services/rate-limit-hidratacion.service.ts` | 1 |
| `apps/backend/src/presentation/http/controllers/hidratacion.controller.ts` | 1 |
| `apps/frontend/src/components/hidratacion/WidgetHidratacion.tsx` | 2 |
| `apps/frontend/src/components/hidratacion/SeccionHidratacionPaciente.tsx` | 2 |
| `apps/frontend/src/components/hidratacion/TarjetaAdherenciaHidratacion.tsx` | 3 |
| `apps/frontend/src/hooks/useHidratacionDia.ts` | 2 |
| `apps/frontend/src/hooks/useAdherenciaHidratacion.ts` | 3 |
| `apps/frontend/src/types/hidratacion.ts` | 2 |

## Archivos a modificar

| Archivo | Cambio | Fase |
|---------|--------|------|
| `apps/backend/src/presentation/http/controllers.module.ts` | Import `HidratacionModule`, registrar `HidratacionController`, entidades TypeORM | 1 |
| `apps/backend/src/infrastructure/persistence/typeorm/entities/index.ts` | Export nuevas entidades | 1 |
| `apps/backend/src/infrastructure/config/typeorm/migration.schema.ts` | Incluir entidades si aplica al schema de migraciones | 1 |
| `apps/frontend/src/pages/DashboardSocio.tsx` | Render `<WidgetHidratacion />` en grid principal | 2 |
| `apps/frontend/src/pages/ConsultaProfesionalPage.tsx` | Sección Hidratación (config + adherencia resumen) | 2–3 |
| `apps/frontend/src/pages/ProgresoPacientePage.tsx` | Opcional: tarjeta adherencia | 3 |
| `packages/shared/src/constants/error-codes.ts` | `META_HIDRATACION_INACTIVA` (opcional) | 3 |

**No modificar en MVP:** `ProgresoController`, `objetivo.entity`, `FichaSalud` (salvo copy informativo cruzado opcional).

---

## Variables de entorno

```
# No obligatorias para MVP (reset lazy por fecha)

# Solo si más adelante se agrega job de mantenimiento/analytics:
# HIDRATACION_CRON_EXPR=0 3 * * *
```

Timezone: ya definido en `apps/backend/src/main.ts` (`TZ=America/Argentina/Buenos_Aires`). Usar `date-fns-tz` o util interna consistente con turnos para `fecha` DATE.

---

## Checklist OWASP (endpoints nuevos)

| Riesgo | Mitigación |
|--------|------------|
| Broken Access Control | Guards JWT + rol + vínculo turno; socio solo su ID |
| Injection | DTOs + ValidationPipe whitelist |
| Security Misconfiguration | Sin endpoints públicos; helmet global existente |
| IDOR | `socioId` en ruta nutri validado contra turnos; socio sin param en URL |
| Rate limiting | 500 ms en POST consumo |
| Sensitive Data Exposure | No exponer emails en respuestas de hidratación |

---

## ASUMIDOS documentados

1. **EC-09:** Cambio de `metaMlDia` aplica desde el día siguiente vía `meta_ml_vigente_desde`; el registro del día conserva `meta_ml_snapshot`.
2. **overrideMl:** No expuesto en UI MVP; backend puede aceptarlo para correcciones futuras.
3. **Rate limit:** En memoria de proceso (no Redis); suficiente para MVP single-instance.
4. **ADMIN:** Sin endpoints agregados en MVP.
5. **Acción permisos:** No se agrega entrada en módulo `permisos` salvo que el producto exija `hidratacion.editar`; por defecto rol `NUTRICIONISTA` + ownership (como varias rutas de `turnos`).
6. **Historial socio 7 días:** Explícitamente fuera de MVP (solo nutri en RF-04).
