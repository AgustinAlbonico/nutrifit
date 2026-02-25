# Plan de Implementación - NutriFit Supervisor

Este documento detalla el plan de trabajo para implementar los requisitos funcionales (RF) y casos de uso (CUD) del módulo de profesionales de NutriFit Supervisor.

## Estado Actual
El backend cuenta con una arquitectura base (NestJS, Clean Architecture, TypeORM) y entidades definidas, pero carece de la lógica de negocio (Casos de Uso) y controladores para la gestión de profesionales, turnos y fichas de salud.

- **Entidades:** Existen `Nutricionista`, `Turno`, `FichaSalud`, pero requieren refactorización para soportar múltiples especialidades.
- **Módulos:** Existen `profesionales`, `turnos`, `agenda` pero están vacíos.
- **Controladores:** `ProfesionalController` existe pero está vacío.

## Fases de Implementación

### Fase 1: Gestión de Profesionales (RF01-RF06)
**Objetivo:** Permitir al asistente gestionar (ABM) profesionales y sus especialidades.
1.  **Refactorización de Entidades:**
    - Renombrar `Nutricionista` a `Profesional` para soportar "Deportólogos" y otros.
    - Crear entidad `Especialidad`.
    - Establecer relación Many-to-Many entre `Profesional` y `Especialidad`.
    - Actualizar Enum `Rol`.
2.  **Casos de Uso (Application Layer):**
    - `CreateProfesionalUseCase` (RF01)
    - `UpdateProfesionalUseCase` (RF02)
    - `DeleteProfesionalUseCase` (RF03)
    - `GetProfesionalUseCase` (Listado y Detalle) (RF04)
    - `AssignEspecialidadUseCase` (RF05)
3.  **Infraestructura:**
    - Repositorio de Profesionales.
    - Controladores y DTOs.

### Fase 2: Gestión de Disponibilidad y Agenda (RF06, RF17)
**Objetivo:** Permitir a los profesionales configurar sus horarios.
1.  **Entidades:** Verificar `Agenda` y su relación con `Profesional`.
2.  **Casos de Uso:**
    - `ConfigureAgendaUseCase` (RF06)
    - `GetAgendaProfesionalUseCase` (RF17)
3.  **Endpoints:** Configuración de horarios y visualización.

### Fase 3: Gestión de Turnos (Socio) (RF07-RF13)
**Objetivo:** Permitir a los socios reservar y gestionar turnos.
1.  **Casos de Uso:**
    - `SearchProfesionalesUseCase` (Filtros por especialidad/nombre) (RF07)
    - `BookTurnoUseCase` (RF08)
    - `CancelTurnoUseCase` (RF09)
    - `RescheduleTurnoUseCase` (RF10)
    - `GetTurnosSocioUseCase` (RF11)

### Fase 4: Ficha de Salud (RF13-RF16, RF19)
**Objetivo:** Gestión de datos clínicos del socio.
1.  **Casos de Uso:**
    - `CreateFichaSaludUseCase` (RF14)
    - `UpdateFichaSaludUseCase` (RF15)
    - `GetFichaSaludUseCase` (Acceso profesional) (RF16, RF19)

### Fase 5: Atención y Seguimiento (RF20-RF25)
**Objetivo:** Registro de evolución y observaciones.
1.  **Casos de Uso:**
    - `CreateObservacionUseCase` (RF20)
    - `RegisterIndicadoresFisicosUseCase` (RF21)
    - `GetHistorialClinicoUseCase` (RF22, RF23)
    - `GetEvolucionFisicaUseCase` (Gráficos) (RF24)

### Fase 6: Notificaciones (RF26)
**Objetivo:** Sistema de alertas.
1.  **Servicio:** Implementar servicio de notificaciones (Email/In-app).
2.  **Integración:** Conectar con eventos de Reserva, Cancelación, etc.

---
**Siguiente Paso Inmediato:** Inicio de Fase 1 (Refactorización de Entidades).
