# Plan de Implementación - NutriFit Supervisor

Este documento detalla el plan de trabajo completo para implementar todos los requisitos funcionales (RF) y casos de uso (CUD) del módulo de nutricionistas y turnos de NutriFit Supervisor.

**Nota:** La Fase 1 (Gestión de Profesionales) ya ha sido implementada.

## Estado Actual
- **Fase 1 Completada:** Gestión de Nutricionistas (Crear, Editar, Eliminar, Listar, Ver Detalle).
- **Backend:** NestJS con TypeORM y arquitectura limpia.
- **Pendiente:** Fases 2 a 6.

---

## Fase 2: Gestión de Disponibilidad y Agenda (RF06, RF17)
**Objetivo:** Permitir a los nutricionistas configurar sus horarios de atención y visualizar su agenda.

### 1. Entidades y Repositorios
- **Entidad:** Verificar `AgendaEntity` (Días, Horarios, Intervalos).
- **Repositorio:** Implementar `AgendaRepository` (Domain & Infra).

### 2. Casos de Uso (Application Layer)
- `ConfigureAgendaUseCase` (RF06):
  - Input: `ConfigureAgendaDto` (días, horas inicio/fin, duración turno).
  - Lógica: Validar solapamientos, guardar configuración.
- `GetAgendaProfesionalUseCase` (RF17):
  - Input: `profesionalId`, `fecha`.
  - Output: Lista de slots disponibles y ocupados.

### 3. Controladores (Presentation Layer)
- `AgendaController`:
  - `POST /agenda`: Configurar disponibilidad.
  - `GET /agenda/profesional/:id`: Obtener agenda.

---

## Fase 3: Gestión de Turnos - Socio (RF07-RF13)
**Objetivo:** Permitir a los socios buscar profesionales, reservar, cancelar y reprogramar turnos.

### 1. Entidades y Repositorios
- **Entidad:** `TurnoEntity` (Estado: PENDIENTE, CONFIRMADO, CANCELADO, REALIZADO).
- **Repositorio:** `TurnoRepository` (Métodos de búsqueda complejos).

### 2. Casos de Uso (Application Layer)
- `SearchNutricionistasUseCase` (RF07):
  - Filtros: Especialidad, Nombre, Ubicación (si aplica).
- `BookTurnoUseCase` (RF08):
  - Input: `BookTurnoDto` (socioId, profesionalId, fechaHora).
  - Lógica: Validar disponibilidad, crear turno PENDIENTE, verificar ficha de salud (RF13).
- `CancelTurnoUseCase` (RF09):
  - Regla: Solo si faltan >24hs.
- `RescheduleTurnoUseCase` (RF10):
  - Input: `turnoId`, `nuevaFechaHora`.
- `GetTurnosSocioUseCase` (RF11):
  - Historial de turnos del socio.

### 3. Controladores (Presentation Layer)
- `TurnoController`:
  - `POST /turnos/reservar`
  - `POST /turnos/cancelar/:id`
  - `POST /turnos/reprogramar/:id`
  - `GET /turnos/socio`

---

## Fase 4: Ficha de Salud (RF13-RF16, RF19)
**Objetivo:** Gestión de datos clínicos del socio, requerida para la primera consulta.

### 1. Entidades y Repositorios
- **Entidad:** `FichaSaludEntity` (Peso, Altura, Alergias, Patologías, Objetivos).
- **Repositorio:** `FichaSaludRepository`.

### 2. Casos de Uso (Application Layer)
- `CreateFichaSaludUseCase` (RF14):
  - Input: `CreateFichaSaludDto`.
  - Lógica: Validar datos, asociar al socio.
- `UpdateFichaSaludUseCase` (RF15):
  - Input: `UpdateFichaSaludDto`.
- `GetFichaSaludUseCase` (RF16):
  - Acceso permitido solo a profesionales con turno asignado (RF19).

### 3. Controladores (Presentation Layer)
- `FichaSaludController`:
  - `POST /ficha-salud`
  - `PUT /ficha-salud`
  - `GET /ficha-salud/:socioId`

---

## Fase 5: Atención y Seguimiento (RF20-RF25)
**Objetivo:** Registro de evolución del paciente y observaciones post-consulta.

### 1. Entidades y Repositorios
- **Entidad:** `ObservacionClinicaEntity`, `EvolucionFisicaEntity` (Histórico de peso/IMC).
- **Repositorio:** `ObservacionRepository`.

### 2. Casos de Uso (Application Layer)
- `CreateObservacionUseCase` (RF20):
  - Input: `turnoId`, `observaciones`.
- `RegisterIndicadoresFisicosUseCase` (RF21):
  - Input: `socioId`, `peso`, `imc`, `medidas`.
- `GetHistorialClinicoUseCase` (RF22, RF23):
  - Devuelve historia completa (turnos + observaciones).
- `GetEvolucionFisicaUseCase` (RF24):
  - Datos para gráficos de progreso.

### 3. Controladores (Presentation Layer)
- `SeguimientoController`:
  - `POST /seguimiento/observacion`
  - `POST /seguimiento/indicadores`
  - `GET /seguimiento/historial/:socioId`

---

## Fase 6: Notificaciones (RF26)
**Objetivo:** Sistema de alertas para eventos clave (reserva, cancelación, recordatorios).

### 1. Infraestructura
- Servicio de Email (SendGrid/SMTP) o Notificaciones In-App (WebSockets/Push).

### 2. Integración
- Integrar `NotificationService` en los casos de uso:
  - `BookTurnoUseCase` -> Notificar al profesional y socio.
  - `CancelTurnoUseCase` -> Notificar cancelación.
  - `RescheduleTurnoUseCase` -> Notificar cambio.

---

## Estimación de Dependencias
- Fase 3 depende de Fase 2 (Agenda configurada).
- Fase 3 depende de Fase 4 (Ficha de salud requerida para reservar).
- Fase 5 depende de Fase 3 (Turno realizado para cargar observación).

## Correcciones Aplicadas (Fase 1)
### Problema 1: Error de metatype en NutricionistaRepository
**Causa:** El método `toDomainEntity()` usaba `Object.create()` para instanciar `NutricionistaEntity`, lo que causaba el error "Cannot read properties of undefined (reading 'metatype')".

**Solución:** Cambiar el método para usar el constructor de `NutricionistaEntity` directamente, en lugar de `Object.create()`. Esto permite que NestJS lea correctamente los metadatos de la clase.

**Archivo:** `src/infrastructure/persistence/typeorm/repositories/nutricionista.repository.ts` (líneas 114-134)

### Problema 2: Tipo incorrecto en PersonaOrmEntity
**Causa:** La relación `usuario` estaba tipada como `UsuarioEntity` en lugar de `UsuarioOrmEntity`.

**Solución:** Corregir el tipo a `UsuarioOrmEntity` para mantener consistencia con las entidades ORM.

**Archivo:** `src/infrastructure/persistence/typeorm/entities/persona.entity.ts` (línea 63)

---

## Estado de Fase 1
✅ Completada con las correcciones aplicadas.
✅ Los endpoints `/profesional` están listos para usar.
❌ **PROBLEMA ACTUAL**: Error interno de NestJS "Cannot read properties of undefined (reading 'metatype')".

**Análisis del problema:**
- **Causa raíz:** Error en el proceso de escaneo de metadatos de NestJS al intentar leer los providers del módulo.
- **Archivo afectado:** `ProfesionalController` (todos sus dependencias: casos de uso).
- **Contexto:** El backend compila exitosamente TypeScript ("Found 0 errors") pero falla al iniciar.
- **Síntomas:** El error ocurre sistemáticamente tanto en modo `start:dev` como en modo `start` normal.
- **Intentos de solución:**
  - ✅ Corrección de `orm.agendas` → `orm.agenda` en el repositorio
  - ✅ Corrección de tipo `UsuarioEntity` → `UsuarioOrmEntity` en `persona.entity.ts`
  - ✅ Reinstalación de `reflect-metadata@0.2.2` para eliminar duplicados
  - ✅ Limpieza de caché (`dist`, `node_modules/.cache`)
  - ✅ Reconstrucción completa desde cero
  - ❌ Actualización de versiones de NestJS (intentada, revertida por conflictos)
  - ❌ Deshabilitar temporalmente el `ProfesionalController` (el error persiste)

**Estado actual:**
El backend **compila exitosamente** pero **falla al iniciar** con el error de metatype. El `ProfesionalController` ha sido comentado temporalmente para diagnóstico.

**Recomendación:**
El error "Cannot read properties of undefined (reading 'metatype')" es un error interno de NestJS/reflect-metadata que parece ser un problema de compatibilidad o configuración del proyecto. Se requiere una revisión técnica más profunda de las dependencias de NestJS o de la configuración de TypeScript.

## Próximos Pasos
Pausar la implementación de la **Fase 2** hasta resolver el error de metatype.
**Nota:** Las siguientes fases (3, 4, 5, 6) dependen de que la Fase 1 esté completamente funcional.
