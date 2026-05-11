# Exploration: fase-3-consulta-clinica-adjuntos-auditoria

## 1. Resumen de Hallazgos y Arquitectura Actual

### Estado de la Fase 3 en la Codebase

**Entidad `EstadoTurno` (Backend)**:
- Enum actual: `PROGRAMADO | CONFIRMADO | PRESENTE | EN_CURSO | ASISTIO | CANCELADO | AUSENTE | REPROGRAMADO | BLOQUEADO`
- **Difiere del PRD**: el PRD requiere `PROGRAMADO | PRESENTE | EN_CURSO | REALIZADO | CANCELADO | AUSENTE` (sin `ASISTIO`, con `REALIZADO`)
- `packages/shared/src/types/turno.ts` tiene el mismo enum desactualizado

**Entidad `TurnoOrmEntity`**:
- Relaciones existentes: `observacionClinica` (OneToOne), `mediciones` (OneToMany), `socio`, `nutricionista`, `gimnasio`
- **NO tiene relación a adjuntos clínicos**
- Campos de auditoría existentes: `checkInAt`, `consultaIniciadaAt`, `consultaFinalizadaAt`, `ausenteAt`, `fechaOriginal`

**Entidad `ObservacionClinicaOrmEntity`** (BUG CRÍTICO):
```typescript
// Línea 22-23: decorador duplicado MÁLGICO
@Column({ name: '', type: 'date' })       // ← name '' es inválido
@Column({ name: 'sugerencias', type: 'varchar', length: 255, nullable: true })
sugerencias: string | null;
```
- **NO tiene campo `esPublica`** para separar visibilidad pública/privada
- No hay forma de marcar observaciones como visibles para entrenador/socio

**Entidad `MedicionOrmEntity`**:
- Todos los campos opcionales (`nullable: true`)
- Sin validaciones de rango en la entidad
- El DTO `GuardarMedicionesDto` tiene `@Min(0)` pero no límites superiores

**Use Cases de Consulta**:
| Use Case | Estado Actual | Problema |
|----------|---------------|----------|
| `IniciarConsultaUseCase` | Exige `PRESENTE` → `EN_CURSO` ✅ | Funciona correctamente |
| `FinalizarConsultaUseCase` | `EN_CURSO` → `ASISTIO` ❌ | Debe ser `REALIZADO`; no bloquea ediciones |
| `GuardarMedicionesUseCase` | NO valida estado ❌ | Puede ejecutarse en cualquier estado |
| `GuardarObservacionesUseCase` | NO valida estado; requiere medición previa ❌ | Debe ser independiente |

**MinIO Service** (`src/infrastructure/services/minio/minio.service.ts`):
- Implementa `IObjectStorageService` completamente
- Métodos: `subirArchivo`, `eliminarArchivo`, `obtenerUrlFirmada`, `archivoExiste`, `obtenerArchivo`
- Bucket se crea automáticamente con política pública de lectura
- **Listo para reutilizar** para adjuntos clínicos

**Frontend `ConsultaProfesionalPage.tsx`**:
- UI completa para mediciones y observaciones
- Llama `iniciarConsulta` al montar (effect)
- Botón "Finalizar consulta" y "Guardar mediciones"
- **NO tiene sección de adjuntos clínicos**
- **NO tiene validación de estado de consulta** para bloquear interfaz

---

## 2. Paths y Archivos Exactos a Tocar

### Backend - Entidades y ORM

| Archivo | Cambio Necesario |
|---------|------------------|
| `src/domain/entities/Turno/EstadoTurno.ts` | Cambiar `ASISTIO` → `REALIZADO`; mantener compatibilidad hacia atrás o migrar |
| `packages/shared/src/types/turno.ts` | Actualizar `EstadoTurno` para que coincida |
| `src/infrastructure/persistence/typeorm/entities/observacion-clinica.entity.ts` | Eliminar línea 22 `@Column({ name: '', type: 'date' })` duplicado; agregar `esPublica: boolean` |
| `src/infrastructure/persistence/typeorm/entities/turno.entity.ts` | Agregar relación OneToMany a `AdjuntoClinicoOrmEntity` |
| `src/infrastructure/persistence/typeorm/entities/medicion.entity.ts` | Sin cambio (las validaciones van en DTO) |
| **NUEVO** `src/infrastructure/persistence/typeorm/entities/adjunto-clinico.entity.ts` | Crear entidad para adjuntos clínicos |

### Backend - Use Cases

| Archivo | Cambio Necesario |
|---------|------------------|
| `src/application/turnos/use-cases/finalizar-consulta.use-case.ts` | Cambiar a estado `REALIZADO`; setear `consultaFinalizadaAt` |
| `src/application/turnos/use-cases/guardar-mediciones.use-case.ts` | Validar que turno.estadoTurno === `EN_CURSO` |
| `src/application/turnos/use-cases/guardar-observaciones.use-case.ts` | Validar estado; quitar requisito de medición previa; agregar `esPublica` |
| **NUEVO** `src/application/turnos/use-cases/guardar-adjuntos.use-case.ts` | Crear para subir/eliminar adjuntos |
| **NUEVO** `src/application/turnos/use-cases/obtener-adjuntos.use-case.ts` | Crear para listar/descargar adjuntos |

### Backend - DTOs

| Archivo | Cambio Necesario |
|---------|------------------|
| `src/application/turnos/dtos/guardar-mediciones.dto.ts` | Agregar `@Min/@Max` con rangos realistas |
| `src/application/turnos/dtos/guardar-observaciones.dto.ts` | Agregar campo `esPublica?: boolean` |
| **NUEVO** `src/application/turnos/dtos/guardar-adjunto.dto.ts` | Crear DTO para upload de adjunto |
| **NUEVO** `src/application/turnos/dtos/adjunto-response.dto.ts` | Crear DTO para respuesta de adjunto |

### Backend - Controlador

| Archivo | Cambio Necesario |
|---------|------------------|
| `src/presentation/http/controllers/turnos.controller.ts` | Agregar endpoints: `POST /:id/adjuntos`, `GET /:id/adjuntos`, `DELETE /:id/adjuntos/:adjuntoId` |

### Backend - Módulo

| Archivo | Cambio Necesario |
|---------|------------------|
| `src/application/turnos/turnos.module.ts` | Importar `MinioModule`; registrar nuevos use cases |

### Backend - Auditoría (NUEVO)

| Archivo | Cambio Necesario |
|---------|------------------|
| **NUEVO** `src/domain/entities/Auditoria/auditoria.entity.ts` | Crear entidad de dominio |
| **NUEVO** `src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts` | Crear ORM entity |
| **NUEVO** `src/application/auditoria/auditoria.service.ts` | Crear servicio de auditoría |
| **NUEVO** `src/infrastructure/audit/auditable.decorator.ts` | Crear decorador `@Auditable()` |
| **NUEVO** `src/infrastructure/audit/auditoria.interceptor.ts` | Crear interceptor para auto-audit |
| **NUEVO** `src/presentation/http/controllers/auditoria.controller.ts` | Crear controlador admin para ver auditoría |

### Frontend

| Archivo | Cambio Necesario |
|---------|------------------|
| `apps/frontend/src/pages/ConsultaProfesionalPage.tsx` | Agregar sección de adjuntos; deshabilitar campos si consulta.finalizada; mostrar adjuntos subidos |
| `apps/frontend/src/lib/api.ts` | Agregar funciones para upload/download de adjuntos |

---

## 3. Gaps Técnicos y Riesgos

### Gap 1: Migraciones no confiables (Roadmap 0.1)
El sistema no tiene tracking confiable de migraciones. Cualquier cambio de schema puede requerir intervención manual o recreate de DB.

**Mitigación**: Documentar que esta fase requiere migrar con `npm run db:migrate` verificado antes de tocar entidades.

### Gap 2: Estado `ASISTIO` vs `REALIZADO`
El enum usa `ASISTIO` pero el PRD dice `REALIZADO`. Hay tests (`finalizar-consulta.use-case.spec.ts`) que probablemente esperan `ASISTIO`.

**Mitigación**: Revisar specs antes de cambiar; actualizar `packages/shared` junto con backend para mantener sincronía.

### Gap 3: Decorador duplicado en `observacion-clinica.entity.ts`
Línea 22 tiene `@Column({ name: '', type: 'date' })` que genera schema inválido. Esto puede haber creado columna sin nombre en la DB real.

**Mitigación**: Verificar schema actual con migración; puede requerir reset o workaround.

### Gap 4: Auditoría no existe
No hay ningún mecanismo de auditoría. Hay que construirlo completo.

**Riesgo**: Implementación puede afectar performance si se auditra cada request.

**Mitigación**: Diseñar para async/queue, no sincronico en el request crítico.

### Gap 5: Entrenador rol no existe
El PRD requiere que observaciones públicas sean visibles para Entrenador, pero el rol no está en el enum `Rol`.

**Mitigación**: En esta fase solo implementar el flag `esPublica`. La implementación del Entrenador es fase 1.4.

---

## 4. Decisiones Pendientes de Arquitectura

| Decisión | Opciones | Recomendación |
|----------|----------|---------------|
| Estado final de consulta | `REALIZADO` (PRD) vs `ASISTIO` (actual) | `REALIZADO` para alinear con PRD |
| Validaciones de rango | DTO (class-validator) vs Use Case (domain) | DTO para input, use case para lógica |
| Mecanismo de auditoría | Decorator `@Auditable` vs inyección manual | Decorator con fallback manual |
| Límite de tamaño adjunto | 5MB vs 10MB vs 20MB | 10MB, configurable por env |
| Tipos MIME permitidos | `['image/jpeg', 'image/png', 'application/pdf']` | Solo esos 3 tipos clínicos |
| Adjuntos post-cierre | Permitir con auditoría (PRD RB-DAT-03) | Sí, pero solo con auditoría |

---

## 5. Recomendaciones de Enfoque

### orden de Implementación Sugerido

**Paso 1: Adjuntos clínicos** (independiente, bajo riesgo)
1. Crear migración para tabla `adjunto_clinico`
2. Implementar `AdjuntoClinicoOrmEntity` con relación a `Turno`
3. Crear `GuardarAdjuntoUseCase` y `ObtenerAdjuntosUseCase`
4. Agregar endpoints en `TurnosController`
5. Integrar en frontend `ConsultaProfesionalPage`

**Paso 2: Bloqueo post-cierre** (impacto medio, requiere tests)
1. Cambiar `ASISTIO` → `REALIZADO` en `EstadoTurno`
2. Actualizar `FinalizarConsultaUseCase`
3. Validar estado en `GuardarMedicionesUseCase` y `GuardarObservacionesUseCase`
4. Ejecutar tests: `finalizar-consulta.use-case.spec.ts`, `guardar-mediciones.use-case.spec.ts`

**Paso 3: Robustecer mediciones/observaciones** (bajo riesgo)
1. Corregir decorador duplicado en `observacion-clinica.entity.ts`
2. Agregar `esPublica` a entidad y DTO
3. Agregar validaciones `@Min/@Max` realistas en `GuardarMedicionesDto`
4. Hacer observaciones independientes de mediciones

**Paso 4: Auditoría** (independiente, más complejo)
1. Crear `AuditoriaOrmEntity`
2. Crear `AuditoriaService` con métodos `registrar`, `buscar`
3. Definir eventos a auditar y decorador/interceptor
4. Agregar endpoint admin `GET /admin/auditoria`
5. Integrar en flows críticos

### Dependencias Cross-Cutting

| Dependencia | Impacto | Manejo |
|-------------|---------|--------|
| `packages/shared/src/types/turno.ts` | Sincronizar `EstadoTurno` | Actualizar junto con backend |
| `MinioService` | Reutilizar para storage | Ya existe, solo usar |
| `TurnoOrmEntity` | Agregar relación adjuntos | Una sola migración |
| Permisos/acciones | Nuevas acciones para adjuntos | Agregar a seeds: `adjuntos.subir`, `adjuntos.ver`, `adjuntos.eliminar` |
| Tests existentes | Pueden romperse con cambio `ASISTIO` → `REALIZADO` | Actualizar specs |

---

## 6. Impacto en UI y Flujos

### Flujo de Consulta Profesional (Futuro)

```
PRESENTE → EN_CURSO (iniciar-consulta)
  ├── Guardar Mediciones (solo si EN_CURSO)
  ├── Guardar Observaciones (solo si EN_CURSO)
  ├── Subir Adjuntos (siempre permitido con auditoría)
  │     └── POST /turnos/:id/adjuntos → Minio → adjunto_clinico
  └── Finalizar Consulta → REALIZADO
        └── Bloquear: guardar-mediciones, guardar-observaciones
        └── Permitir: subir-adjunto (con auditoría)
```

### Visibilidad de Observaciones (Futuro Entrenador)

```
Observación.esPublica = true → visible para Entrenador y Socio
Observación.esPublica = false → solo profesional puede ver
```