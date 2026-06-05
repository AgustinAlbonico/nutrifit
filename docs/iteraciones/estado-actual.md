# Estado Actual — NutriFit Supervisor

> Basado en: exploración de código + subagente `level-salmon-lamprey` (29/05/2026)
> **Precisión**: los gaps marcados como "ALTA" son bugs confirmados; los demás son inferencias basadas en exploración de código sin tests de runtime.
> **Login 500**: `POST /auth/login` devuelve 500; causa raíz no determinada aún.

---

## RESUMEN EJECUTIVO

El sistema tiene la funcionalidad core de ambas iteraciones implementada en su mayoría. Los gaps más importantes son:
1. **Login 500** — no se puede autenticar todavía
2. **Confirmar/cancelar turno por token sin @Public()** — fallan bajo JwtAuthGuard
3. **IA no recibe datos clínicos del socio automáticamente** — el profesional debe ingresar todo manualmente

---

## MAPA DE MÓDULOS

| Módulo | Estado | evidencia | Bugs/Gaps |
|---|---|---|---|
| **Auth (login/logout/JWT)** | 🔴 FALLO | Login devuelve 500 | `POST /auth/login` → 500; causa raíz no determinada |
| **Gestión de profesionales** | 🟡 PARCIAL | 4 use-cases en `profesionales/` | Solo ADMIN; recepcionista no puede (RF01-RF05); especialidad hardcodeada "Nutricionista" |
| **Agenda profesional** | 🟢 IMPLEMENTADO | `AgendaController`, 6 use-cases en `agenda/` | Profesional gestiona su propia agenda; admin/recepción no puede (RB16) |
| **Turnos (reserva, reprogramar, cancelar)** | 🟢 IMPLEMENTADO | 16 use-cases en `turnos/` | Confirmar/cancelar por token sin @Public() (ALTA) |
| **Ficha de salud** | 🟢 IMPLEMENTADO | `upsert-ficha-salud-socio`, `get-ficha-salud-paciente` | Socio edita; profesional consulta; sin entidad Especialidad real |
| **Consulta clínica** | 🟢 IMPLEMENTADO | `iniciar-consulta`, `guardar-mediciones`, `guardar-observaciones`, `finalizar-consulta` | — |
| **Plan alimentario** | 🟢 IMPLEMENTADO | `crear-plan`, `editar-plan`, `eliminar-plan`, `get-plan-activo` | Audit logs parciales; validar que `motivo` es obligatorio en editar/eliminar |
| **IA nutricional** | 🟢 IMPLEMENTADO | `GroqService`, `sugerir-comida`, `generar-receta`, `analizar-alimento` | IA no recibe datos clínicos del socio automáticamente (ALTA); sin reintento automático en timeout |
| **Progreso socio/paciente** | 🟢 IMPLEMENTADO | `get-historial-mediciones`, `registrar-medicion`, `SubirFotosProgreso` | — |
| **Notificaciones** | 🟢 IMPLEMENTADO | `notificaciones.service.ts`, `NotificacionesController` | No email real en dev; panel interno funciona |
| **Reglas de ausencia (scheduler)** | 🟡 PARCIAL | `ausencia-turno.scheduler.ts` | Usa fecha ISO UTC hardcodeado; `gimnasioId ?? 1` (ALTA) |
| **Especialidades** | 🔴 FALTANTE | — | No hay entidad/CRUD; todos los profesionales responden "Nutricionista" |
| **Gestión de horarios por admin/recepción** | 🔴 FALTANTE | — | Solo el profesional propietario configura su agenda; no existe endpoint para que admin/recepción lo haga |
| **Documentos generales del socio** | 🟡 PARCIAL | — | Adjuntos por turno y PDFs de progreso/plan existen; módulo "biblioteca documental" amplio no existe |
| **Rol Entrenador** | 🔴 FALTANTE | — | TFI dice que Entrenador ve plan y observaciones públicas; no hay rol Entrenador en código |
| **Recepcionista gestionar profesionales** | 🟡 PARCIAL | — | Según TFI, "Asistente" puede (CUD01-CUD05); según código, solo ADMIN tiene permisos |
| **Validación runtime completa** | ⚫ NO VERIFICADO | — | No hay tests e2e verificados; login 500 bloquea testing manual |

---

## DETALLE DE BUGS Y GAPS

### 🟡 Bugs confirmados

#### 1. Login 500 (ALTA — BLOQUEANTE)
- **Descripción**: `POST /auth/login` devuelve 500 sin mensaje de error visible
- **Archivos**: `AuthController`, `AuthService`, `JwtAuthGuard`
- **Estado**: No resuelto. El subagente `moral-indigo-mule` no pudo diagnosticar; `level-salmon-lamprey` no encontró causa en exploración de código.
- **Impacto**: No se puede hacer testing E2E real. Todos los tests unitarios pasan (375/375).

#### 2. Confirmar/cancelar turno por token sin @Public() (ALTA)
- **Descripción**: `POST /turnos/:id/confirmar` y `POST /turnos/:id/cancelar` usan token público pero están bajo `JwtAuthGuard` global en `TurnosController`.
- **Archivo**: `apps/backend/src/presentation/http/controllers/turnos.controller.ts`
- **Fix requerido**: Agregar `@Public()` a esos endpoints, o crear una ruta separada sin guard.
- **Impacto**: Los links de confirmación por email no funcionan.

#### 3. NutricionistaRepository.findByEmail() retorna null siempre (ALTA)
- **Descripción**: El método `findByEmail` del repositorio siempre retorna `null`, haciendo que la validación de email único falle silenciosamente.
- **Archivo**: `apps/backend/src/infrastructure/persistence/typeorm/repositories/nutricionista.repository.ts`
- **Impacto**: Se pueden registrar profesionales con emails duplicados.

#### 4. Ausencia scheduler con gymId hardcodeado (ALTA)
- **Descripción**: `ausencia-turno.scheduler.ts` usa `gimnasioId ?? 1` en lugar del contexto real del tenant.
- **Archivo**: `apps/backend/src/infrastructure/schedulers/ausencia-turno.scheduler.ts`
- **Impacto**: En ambiente multi-tenant, las reglas de ausencia aplican al gimnasio 1 siempre.

#### 5. IA no recibe datos clínicos del socio automáticamente (ALTA)
- **Descripción**: El prompt para generar ideas con IA solo usa los campos que el profesional ingresa manualmente (Objetivo, Restricciones, Info extra). No consulta la ficha de salud del socio para agregar automáticamente patológías, alergias, medicaciones.
- **Archivo**: `apps/backend/src/infrastructure/services/groq/groq.service.ts`
- **Impacto**: El profesional debe recordar ingresar manualmente todas las restricciones; la IA no filtra contraindicaciones automáticamente.

### 🟡 Gaps de implementación

#### 6. Especialidades sin entidad CRUD
- **Descripción**: No existe entidad `Especialidad` ni endpoints para gestionarla. Los profesionales son siempre "Nutricionista" en la UI, aunque el selector dice "Nutricionista/Deportólogo".
- **Impacto**: No se pueden agregar deportólogos reales; filtro por especialidad no tiene datos reales.

#### 7. Admin/Recepción no pueden gestionar agenda de profesionales
- **Descripción**: Solo el profesional propietario puede configurar sus horarios. No existe endpoint para que admin o recepcionista vean/configuren la agenda de otro.
- **RB16**: "La agenda del profesional es visible solo para el propietario"
- **Impacto**: Si el profesional no configuró su agenda, nadie puede hacerlo por él.

#### 8. Motivo obligatorio en editar/eliminar plan — no verificado
- **Descripción**: El DTO de `editar-plan` y `eliminar-plan` tiene campo `motivo`, pero no está claro si el use-case lo valida como obligatorio.
- **Archivos**: `editar-plan.use-case.ts`, `eliminar-plan.use-case.ts`
- **Impacto**: Podría guardarse sin motivo, violando RB25.

#### 9. Rol Entrenador no existe
- **Descripción**: TFI iteration 2 dice que el Entrenador ve plan y observaciones públicas en modo lectura. El código no tiene rol Entrenador.
- **Impacto**: La funcionalidad no se puede asignar a nadie.

#### 10. Auditoría de edición de plan incompleta
- **Descripción**: Se guardan logs de auditoría en la tabla `auditoria`, pero el `motivo` y `editorId` pueden no estar persistiendo correctamente.
- **Impacto**: No hay trazabilidad completa de quién cambió qué y por qué.

### 🟢 Funcionando bien

- ✅ Check-in por recepción (turno → PRESENTE)
- ✅ Iniciar consulta (PRESENTE → EN_CURSO)
- ✅ Finalizar consulta (EN_CURSO → REALIZADO)
- ✅ Crear/editar/eliminar plan alimentario con soft delete
- ✅ Validación de alergias/restricciones en plan (si se implementó en el use-case)
- ✅ Sugerencias de IA con 2 propuestas
- ✅ Progreso con gráficos y exportación
- ✅ Notificaciones internas (panel)
- ✅ Turnos con reprogramación y cancelación con 24h de anticipación
- ✅ Multi-tenant con TenantContextInterceptor
- ✅ Tests: 375/375 pasando

---

## ARCHIVOS CLAVE POR MÓDULO

### Auth
- `apps/backend/src/presentation/http/controllers/auth.controller.ts`
- `apps/backend/src/application/auth/`
- `apps/backend/src/infrastructure/auth/`

### Profesionales
- `apps/backend/src/presentation/http/controllers/profesional.controller.ts`
- `apps/backend/src/application/profesionales/use-cases/` (4 use-cases)
- `apps/backend/src/infrastructure/persistence/typeorm/repositories/nutricionista.repository.ts`

### Agenda
- `apps/backend/src/presentation/http/controllers/agenda.controller.ts`
- `apps/backend/src/application/agenda/use-cases/` (6 use-cases)

### Turnos
- `apps/backend/src/presentation/http/controllers/turnos.controller.ts`
- `apps/backend/src/application/turnos/use-cases/` (16 use-cases)
- `apps/backend/src/infrastructure/schedulers/ausencia-turno.scheduler.ts`

### Ficha de salud
- `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts`
- `apps/backend/src/application/turnos/use-cases/get-ficha-salud-paciente.use-case.ts`

### Consulta clínica
- `apps/backend/src/application/turnos/use-cases/iniciar-consulta.use-case.ts`
- `apps/backend/src/application/turnos/use-cases/guardar-mediciones.use-case.ts`
- `apps/backend/src/application/turnos/use-cases/guardar-observaciones.use-case.ts`
- `apps/backend/src/application/turnos/use-cases/finalizar-consulta.use-case.ts`

### Plan alimentario
- `apps/backend/src/presentation/http/controllers/planes-alimentacion.controller.ts`
- `apps/backend/src/application/planes-alimentacion/use-cases/`

### IA
- `apps/backend/src/presentation/http/controllers/ai.controller.ts`
- `apps/backend/src/application/ai/use-cases/`
- `apps/backend/src/infrastructure/services/groq/groq.service.ts`

### Progreso
- `apps/backend/src/presentation/http/controllers/progreso.controller.ts`
- `apps/frontend/src/pages/ProgresoSocioPage.tsx`
- `apps/frontend/src/pages/ProgresoPacientePage.tsx`

### Notificaciones
- `apps/backend/src/presentation/http/controllers/notificaciones.controller.ts`
- `apps/backend/src/application/notificaciones/notificaciones.service.ts`

---

##不走/ARCOS PRIORITARIOS PARA ARREGLAR

| Prioridad | Acción | Dependencias |
|---|---|---|
| 1 | Diagnosticar y arreglar login 500 | Ninguna |
| 2 | Agregar `@Public()` a confirmar/cancelar turno por token | Ninguna |
| 3 | Arreglar `NutricionistaRepository.findByEmail()` | Ninguna |
| 4 | Arreglar ausencia scheduler con gymId real | Ninguna |
| 5 | Integrar ficha de salud del socio en prompt de IA | Requiere acceso a FichaSalud desde groq.service |
| 6 | Validar que `motivo` es obligatorio en editar/eliminar plan | Ninguna |
| 7 | Implementar entidad de Especialidades (opcional, bajo demanda) | Ninguna |

---

## NOTAS

- **Login 500 es el blocker principal**: hasta que se resuelva, no se puede hacer testing E2E real.
- **Los 375 tests pasando** no incluyen tests de integración con la DB real ni tests de los endpoints HTTP con autenticación real.
- **El backend responde en el puerto 3000** según Swagger UI (200), pero el login falla.
- **DB verificada**: MySQL tiene los 10 usuarios seed correctamente.

---

*Generado por subagente `level-salmon-lamprey` + revisión manual del orchestrator.*