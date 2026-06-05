# Iteración 1 — Gestión de Profesionales de la Salud

> **Fecha de referencia del TFI**: 01/10/2025
> **Alcance**: Primera iteración "Gestión de Profesionales de la Salud"
> **Estado basado en exploración de código**: ver `estado-actual.md`

---

## RESUMEN EJECUTIVO

Iteración 1 cubre toda la gestión de profesionales (alta, modificación, baja), agenda y turnos, ficha de salud del socio, y visualización de progreso. Incluye 26 requisitos funcionales (RF01-RF26) y 22 casos de uso (CUD01-CUD22). La mayoría está **IMPLEMENTADA** según exploración de código, con gaps menores en especialidades y gestión de horarios por rol admin/recepción.

| Módulo | Estado | Gaps |
|---|---|---|
| Profesional CRUD | PARCIAL | Solo ADMIN; sin gestión real de especialidades |
| Agenda profesional | IMPLEMENTADO | — |
| Turnos (reserva, reprogramar, cancelar) | IMPLEMENTADO | Confirmar/cancelar por token sin @Public() |
| Ficha de salud | IMPLEMENTADO | — |
| Progreso socio/paciente | IMPLEMENTADO | — |
| Notificaciones | IMPLEMENTADO | — |

---

## 1. ALCANCE

### Inclusiones iteración 1
- **Gestión de profesionales**: registro, modificación, desactivación, listado con filtros.
- **Agenda profesional**: configuración de horarios, consulta de disponibilidad diaria, bloqueo de slots.
- **Turnos**: reserva por socio, programación manual por profesional, confirmación por token público, cancelación, reprogramación, check-in por recepción, gestión de ausentes.
- **Ficha de salud**: carga y consulta de datos clínicos del socio.
- **Progreso**: historial de mediciones, fotos, objetivos, exportación PDF.
- **Notificaciones**: automáticas por correo y panel interno.

### Exclusiones (van para iteración 2 o futuras)
- Consulta clínica (diagnóstico, mediciones en consulta, observaciones, adjuntos).
- Plan alimentario.
- Módulo de IA como recepcionista.

---

## 2. REQUISITOS FUNCIONALES (RF01–RF26)

| ID | Descripción | Actor | Prioridad |
|---|---|---|---|
| RF01 | Registrar profesional (nombre, apellido, dni, email, especialidad, matrícula, etc.) | Asistente/Recepción | Alta |
| RF02 | Modificar datos de profesional existente | Asistente | Alta |
| RF03 | Desactivar/suspender profesional (con turnos pendientes visibles) | Asistente | Alta |
| RF04 | Ver listado de profesionales con filtros por especialidad, estado, nombre | Asistente | Media |
| RF05 | Registrar profesional sin conocimiento del mismo | Asistente | Media |
| RF06 | Configurar horario de atención del profesional | Profesional | Alta |
| RF07 | Consultar agenda diaria del profesional | Profesional | Alta |
| RF08 | Consultar disponibilidad horaria del profesional | Socio | Alta |
| RF09 | Reservar turno con profesional (fecha, hora, tipo consulta) | Socio | Alta |
| RF10 | Reprogramar turno (anticipación mínima 24h) | Socio | Alta |
| RF11 | Cancelar turno (anticipación mínima 24h) | Socio | Alta |
| RF12 | Confirmar turno por link público (token por email) | Socio | Media |
| RF13 | Registrar check-in de turno | Recepción | Alta |
| RF14 | Bloquear/desbloquear horarios del profesional | Profesional | Media |
| RF15 | Ver turno desde perspectiva profesional (agenda diaria) | Profesional | Alta |
| RF16 | Visualizar datos del paciente antes de la consulta | Profesional | Alta |
| RF17 | Ver ficha de salud del paciente | Profesional | Alta |
| RF18 | Ver historial de consultas del paciente | Profesional | Alta |
| RF19 | Registrar consulta nutricional (mediciones, observaciones, adjuntos) | Profesional | Alta |
| RF20 | Ver lista de profesionales disponibles | Socio | Alta |
| RF21 | Ver perfil profesional (disponibilidad, especialidad) | Socio | Alta |
| RF22 | Solicitar turno con profesional seleccionado | Socio | Alta |
| RF23 | Ver mis turnos (historial y próximos) | Socio | Alta |
| RF24 | Cancelar turno desde panel del socio | Socio | Media |
| RF25 | Ver progreso nutricional (mediciones, fotos, objetivos) | Socio | Alta |
| RF26 | Cargar/editar ficha de salud | Socio | Alta |

---

## 3. REGLAS DE NEGOCIO (RB01–RB17)

| ID | Regla | Aplicación |
|---|---|---|
| RB01 | Un profesional tiene único email y dni | Registro profesional |
| RB02 | Turno en PROGRAMADO > 15 min sin confirmar → recordatorio automático | Scheduler |
| RB03 | Profesional desactivado no recibe turnos nuevos ni puede hacer login | Gestión profesional |
| RB04 | Turno solo editable si estado = PROGRAMADO | Reprogramar, cancelar |
| RB05 | Reprogramar/cancelar con 24h mínimo de anticipación | Socio |
| RB06 | Socio puede tener múltiples turnosPROGRAMADOS con distintos profesionales | Reserva turno |
| RB07 | Profesional puede verse a sí mismo en listado de profesionales | Listado |
| RB08 | Todos los profesionales son "Nutricionista" por defecto; "Deportólogo" no diferenciado | Especialidad |
| RB09 | Turno CONFIRMADO requiere check-in para pasar a PRESENTE | Check-in |
| RB10 | Ausente: PROGRAMADO sin check-in 30 min después → cancelado automático | Scheduler |
| RB11 | Profesional con suspensión no aparece en listados públicos | Listado |
| RB12 | Ficha de salud editable solo por el propio socio | Ficha salud |
| RB13 | Profesional solo ve ficha de pacientes con quienes tuvo al menos un turno | Ficha salud |
| RB14 | Progreso visible solo para el propio socio | Progreso |
| RB15 | Profesional puede tener múltiples gimnasios (soporte multi-tenant) | Gimnasios |
| RB16 | Agenda profesional visible solo para el propietario | Agenda |
| RB17 | Notificaciones visibles solo para el destinatario | Notificaciones |

---

## 4. DIAGRAMA DE ESTADOS DEL TURNO

```
                    ┌─────────────────────┐
                    │    PROGRAMADO      │ ← Reserva inicial (socio) o asignación manual (profesional)
                    └──────────┬──────────┘
                               │ confirmó (token email) o pasó 15min sin recordar
                               ▼
                    ┌─────────────────────┐
         ┌─────────│    CONFIRMADO       │ ← Listo para check-in (el día)
         │         └──────────┬──────────┘
         │                    │ check-in (recepción)
         │                    ▼
         │         ┌─────────────────────┐
         │         │      PRESENTE       │ ← Socio llegó y fue registrado
         │         └──────────┬──────────┘
         │                    │ profesional inicia consulta
         ▼                    ▼
┌──────────────────┐ ┌──────────────────┐
│    CANCELADO     │ │    EN_CURSO      │
│ (sociio canceló) │ │ (profesional     │
│ o reglas ausencia │ │ atiende)        │
└──────────────────┘ └──────────┬────────┘
                               │ profesional finalizar
                               ▼
                    ┌─────────────────────┐
                    │     REALIZADO       │ ← Consulta completada
                    └─────────────────────┘
```

**Transiciones válidas**:
- `PROGRAMADO` → `CONFIRMADO` (confirmó por email) | `CANCELADO` (regla ausencia) | `CANCELADO` (sociio canceló)
- `CONFIRMADO` → `PRESENTE` (check-in) | `CANCELADO` (regla ausencia)
- `PRESENTE` → `EN_CURSO` (profesional inicia)
- `EN_CURSO` → `REALIZADO` (finalizar consulta)

**Transiciones inválidas** (no deberían ocurrir):
- `REALIZADO` → cualquier otro estado
- `CANCELADO` → cualquier otro estado
- `PROGRAMADO` → `PRESENTE` directo (sin check-in)

---

## 5. CASOS DE USO (CUD01–CUD22)

---

### CUD01 — Gestionar profesionales
**Actor**: Asistente/Recepción | **Extiende**: CUD02, CUD03, CUD04, CUD05

**Principal**: Accede al módulo → ve listado con opciones → registra/edita/suspende.

**Borde**: Sin profesionales → mensaje "No hay profesionales registrados".

---

### CUD02 — Registrar profesional
**Actor**: Asistente/Recepción

**Principal**:
1. Accede a "Registrar profesional"
2. Llena: nombre, apellido, dni, email, especialidad, género, fecha nacimiento, dirección, matrícula, años experiencia, formación, certificaciones, tarifa sesión, diploma
3. Confirma
4. Sistema valida campos obligatorios + email y dni únicos
5. Genera contraseña provisional (12 chars, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo)
6. Crea perfil en estado "Activo"
7. Mensaje: "Profesional registrado. Se envió correo con credenciales."

**Bordes**:
- **A5a**: email o dni duplicado → "El documento o correo ya está registrado". Volver al paso 2.
- **A5b**: campos inválidos → "Complete todos los campos correctamente". Resalta errores.
- **A5c**: email no llegó (smtp falló) → el perfil se creó igual; se puede reenviar contraseña.

**Faltante en código**: No hay validación real de email uniqueness en el use-case (revisar `crear-profesional.use-case.ts`).

---

### CUD03 — Modificar profesional
**Actor**: Asistente/Recepción

**Principal**:
1. Busca profesional por nombre o dni
2. Ve formulario con datos actuales
3. Modifica campos necesarios
4. Guarda
5. Mensaje: "Datos actualizados"

**Bordes**:
- **A4**: campos inválidos → "Corrija los campos inválidos". Resalta errores.
- Profesional suspendido → permite edición de datos pero no activación (solo CUD04).

---

### CUD04 — Desactivar/suspender profesional
**Actor**: Asistente/Recepción

**Principal**:
1. Busca y selecciona profesional
2. Confirma desactivación
3. Sistema cambia estado a "Suspendido"

**Bordes**:
- **A3**: turnos pendientes futuros → "El profesional tiene turnos pendientes. Cancele o reasigne". Puede cancelar turnos o volver.
- Profesional ya suspendido → el botón dice "Reactivar". Transición inversa.

**Faltante en código**: No hay confirmación intermedia antes de suspender (falta modal/passo de confirmação).

---

### CUD05 — Ver listado de profesionales
**Actor**: Asistente/Recepción

**Principal**:
1. Ve tabla: nombre, apellido, especialidad, estado, acciones (editar, suspender)
2. Filtra por: especialidad (Nutricionista/Deportólogo), estado (activo/suspendido), nombre (texto)
3. Click "Filtrar"
4. Tabla se actualiza

**Bordes**:
- **A5**: sin resultados → "No se encontraron profesionales. Ajuste los filtros."

**Faltante en código**: Filtro por especialidad hardcodeado; no existe entidad de especialidad real.

---

### CUD06 — Gestionar Agenda
**Actor**: Profesional | **Extiende**: CUD07, CUD08, CUD09, CUD10, CUD12

**Principal**:
1. Accede a "Mi Agenda"
2. Ve turnos del día (CUD07)
3. Consulta lista de pacientes (CUD08)
4. Revisa fichas de pacientes (CUD09)
5. Registra observaciones
6. Configura horarios (CUD11)
7. Asigna turnos manuales (CUD12)

---

### CUD07 — Ver turnos del día
**Actor**: Profesional

**Principal**:
1. Accede a "Mi Agenda"
2. Sistema muestra automáticamente turnos del día actual en estado CONFIRMADO
3. Cada turno: nombre socio, horario, tipo consulta, estado
4. Puede acceder a ficha del paciente o iniciar atención

**Bordes**:
- Sin turnos para hoy → "No hay turnos asignados para el día de hoy"
- Solo muestra CONFIRMADO; PROGRAMADO no visible hasta confirmación

**Faltante en código**: Verificar que el filtro sea exactamente `CONFIRMADO` y no incluya PROGRAMADO.

---

### CUD08 — Ver pacientes
**Actor**: Profesional | **Extiende**: CUD09, CUD10, CUD13

**Principal**:
1. Accede a "Pacientes"
2. Sistema lista socios con quienes tuvo turnos
3. Botones: ficha médica (CUD09), historial consultas (CUD10), asignar turno manualmente (CUD13)

**Bordes**:
- **A2**: sin pacientes → "Todavía no has atendido pacientes. Cuando lo hagas, aparecerán aquí"

---

### CUD09 — Ver ficha de salud del paciente
**Actor**: Profesional

**Pre-condiciones**: Profesional tuvo al menos un turno con ese socio; socio tiene ficha cargada.

**Principal**:
1. Desde turno o historial de paciente → click "Ficha de salud"
2. Sistema muestra datos: peso, altura, nivel actividad, alergias, patologías, objetivo

**Bordes**:
- Socio sin ficha → mensaje "El paciente aún no completó su ficha de salud"
- Profesional sin turnos con ese socio → acceso denegado (RB13)

---

### CUD10 — Ver historial de consultas del paciente
**Actor**: Profesional

**Principal**:
1. Sección "Pacientes" → selecciona socio → "Ver historial de consultas"
2. Lista cronológica: fecha/hora, tipo consulta, notas, archivos adjuntos (PDF, imágenes)

**Bordes**:
- **A3**: sin consultas finalizadas → "No se registran consultas previas con este paciente"

---

### CUD11 — Configurar Horario de Atención
**Actor**: Profesional

**Principal**:
1. Sección "Configuración de agenda"
2. Selecciona días disponibles
3. Define rango horario por día
4. Establece duración estándar por turno (ej: 30 min)
5. Guarda
6. Sistema cambia estado profesional a "Activo"

**Bordes**:
- **A4**: no configuró horarios válidos → "Debe seleccionar al menos un día y un rango horario válido"

**Faltante en código**: No hay validación de solapamiento de horarios o límite de horas.

---

### CUD12 — Asignar Turno a Paciente
**Actor**: Profesional

**Principal**:
1. "Asignar turno manual"
2. Busca socio por nombre o dni
3. Selecciona fecha
4. Sistema muestra horarios disponibles y no disponibles
5. Selecciona horario → confirma
6. Turno pasa a PROGRAMADO → notifica al socio

**Bordes**:
- **A3**: sin horarios disponibles → avisa y vuelve al paso 3

---

### CUD13 — Ver lista de profesionales
**Actor**: Socio | **Extiende**: CUD14, CUD15

**Principal**:
1. Accede a "Buscar profesionales"
2. Sistema muestra todos los profesionales activos
3. Filtros: especialidad (Nutricionista/Deportólogo), nombre

**Bordes**:
- **A2**: sin profesionales activos → "No hay profesionales disponibles en este momento"

---

### CUD14 — Solicitar turno con profesional
**Actor**: Socio

**Principal**:
1. Desde ficha de profesional → "Reservar Turno" → CUD14
2. Sistema muestra agenda del profesional (slots disponibles por fecha)
3. Socio selecciona fecha/hora
4. Confirma
5. Turno creado en PROGRAMADO → notificación al profesional

**Bordes**:
- Sin horarios disponibles en la fecha → "No hay horarios disponibles". Volver a selección de fecha.

**Faltante en código**: No hay validación de solapamiento (socio con otro turno mismo horario).

---

### CUD15 — Ver perfil de profesional
**Actor**: Socio

**Principal**:
1. Click "Ver Perfil" en resultado de búsqueda
2. Sistema muestra: nombre, especialidad, horarios disponibles, formación

**Faltante en código**: En la búsqueda, la especialidad mostrada es siempre "Nutricionista" (hardcodeado).

---

### CUD16 — Reservar turno (redirigido desde CUD14)
**Actor**: Socio | **Similar a**: CUD14

**Principal**: Flujo igual a CUD14 para solicitar turno.

---

### CUD17 — Ver mis turnos
**Actor**: Socio

**Principal**:
1. Sección "Mis Turnos"
2. Sistema muestra列表: próximos y pasados
3. Cada turno: profesional, fecha/hora, estado, acciones (cancelar, reprogramar)

**Bordes**:
- Sin turnos → "No tenés turnos programados"

---

### CUD18 — Reprogramar turno
**Actor**: Socio

**Pre-condición**: Turno en estado PROGRAMADO y con más de 24h de anticipación.

**Principal**:
1. En "Mis Turnos" → click "Reprogramar" en turno
2. Sistema muestra calendario con horarios disponibles del profesional
3. Socio selecciona nueva fecha/hora
4. Confirma
5. Sistema actualiza turno → notificación al profesional

**Bordes**:
- Menos de 24h de anticipación → "No se puede reprogramar con menos de 24h de anticipación"
- Turno no está en PROGRAMADO → opción no disponible
- Sin horarios disponibles el nuevo día → "No hay horarios disponibles"

---

### CUD19 — Cancelar turno
**Actor**: Socio

**Pre-condición**: Turno en estado PROGRAMADO y más de 24h de anticipación.

**Principal**:
1. En "Mis Turnos" → click "Cancelar" en turno
2. Confirmación requerida
3. Sistema cambia estado a CANCELADO → libera horario → notificación al profesional

**Bordes**:
- **A2**: menos de 24h → "No se puede cancelar con menos de 24h de anticipación"
- Turno no PROGRAMADO → botón no disponible

---

### CUD20 — Cargar/editar ficha de salud
**Actor**: Socio

**Principal**:
1. Accede a "Mi Ficha de Salud"
2. Completa datos: peso, altura, nivel actividad física, alergias, patologías, objetivo nutricional, restricciones alimentarias
3. Guarda

**Bordes**:
- Campos obligatorios vacíos → "Complete todos los campos obligatorios"
- Validación de rango (peso 20-300 kg, altura 1-2.5m) → errores inline

---

### CUD21 — Ver progreso nutricional
**Actor**: Socio

**Principal**:
1. Accede a "Mi Progreso"
2. Sistema muestra: historial mediciones (fecha, peso, medidas), fotos comparativas, objetivos, gráficos de evolución

**Bordes**:
- Sin mediciones registradas → "Registrá tu primera medición para ver tu progreso"

---

### CUD22 — Registrar mediciones de progreso
**Actor**: Socio

**Principal**:
1. Accede a "Registrar medición"
2. Ingresa: fecha, peso, medidas corporales (contorno cintura, cadera, brazos), notes
3. Optionally sube fotos
4. Guarda

**Bordes**:
- Fecha futura → "La fecha no puede ser futura"
- Peso fuera de rango (20-300) → validación inline

---

## 6. ESTADOS DE CADA ENTIDAD

### Turno
```
PROGRAMADO → CONFIRMADO → PRESENTE → EN_CURSO → REALIZADO
     ↓            ↓           ↓
  CANCELADO   CANCELADO    CANCELADO
  (regla aus.)(socio)      (regla aus.)
```

### Profesional
```
ACTIVO ←→ SUSPENDIDO
```

### Socio
```
ACTIVO (solo estos dos estados en iteración 1)
```

### Ficha de Salud
```
COMPLETADA (socio la cargó)
PENDIENTE (socio no la cargó aún)
```

---

## 7. CHECKLIST DE ACEPTACIÓN ITERACIÓN 1

- [ ] Profesional puede registrarse (asistente) y ver su agenda
- [ ] Profesional configura horarios de atención
- [ ] Socio ve profesionales activos y reserva turnos
- [ ] Turno pasa de PROGRAMADO → CONFIRMADO (token email)
- [ ] Recepción hace check-in y turno pasa a PRESENTE
- [ ] Profesional inicia consulta → turno pasa a EN_CURSO
- [ ] Profesional finaliza → turno pasa a REALIZADO
- [ ] Ausente automático 30 min post horario sin check-in
- [ ] Socio puede reprogramar con >24h de anticipación
- [ ] Socio puede cancelar con >24h de anticipación
- [ ] Ficha de salud editable por socio y visible para profesional con turnos
- [ ] Progreso visible con mediciones y fotos
- [ ] Notificaciones envía al entrar al sistema (no email real)
- [ ] Profesional desactivado no aparece en listados públicos
- [ ] Multitenant: profesionales solo ven sus datos y agendas

---

## 8. GAPS CONOCIDOS (iteración 1)

| Gap | Gravedad | Notas |
|---|---|---|
| Especialidades sin CRUD real | Media | hardcodeado "Nutricionista"; "Deportólogo" es selectable pero sin entidad |
| Confirmar/cancelar por token sin @Public() | Alta | Endpoints existen pero no marcados como públicos; fallan con JwtAuthGuard |
| Validación de email uniqueness en crear-profesional | Media | El repositorio `findByEmail` retorna null siempre |
| Recepcionista no puede gestionar profesionales (RF01-RF05 solo ADMIN) | Baja | Por diseño de roles, pero TFI dice "Asistente" |
| Gestión de agenda por admin/recepción (RF07, RF08) | Baja | Solo el profesional propietario configura su agenda |
| Scheduler de ausentes con riesgo de zona horaria | Media | Usa fecha ISO UTC hardcodeado |

---

*Documento generado por exploración de código + TFI. Ver `estado-actual.md` para mapeo de implementación vs faltante.*