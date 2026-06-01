# Funcionalidades del Sistema

> **Propósito:** Este documento describe **qué puede hacer el sistema** en lenguaje de negocio (no técnico).  
> Útil para entender el estado actual del producto sin leer código.  
> Se actualiza cada vez que se agrega una nueva funcionalidad.

---

## Gestión de Gimnasios

### ✅ Multi-Tenant (múltiples gimnasios independientes)
El sistema soporta múltiples gimnasios operando de forma independiente. Cada gimnasio tiene sus propios usuarios, socios, turnos, planes y datos. **Los datos de un gimnasio NO son visibles para usuarios de otros gimnasios.**

### ✅ Crear Gimnasio
Un administrador global puede registrar un nuevo gimnasio en el sistema con sus datos básicos: nombre, dirección, teléfono y email de contacto.

### ✅ Listar Gimnasios
Un administrador global puede ver todos los gimnasios registrados en el sistema, activos e inactivos.

### ✅ Editar Gimnasio
Un administrador global puede modificar los datos de un gimnasio existente (nombre, dirección, contacto).

### ✅ Eliminar Gimnasio
Un administrador global puede dar de baja un gimnasio. El gimnasio no se borra físicamente, solo se marca como inactivo (soft delete), preservando el historial.

### ✅ Impersonar Gimnasio (Modo Impersonación)
Un administrador global puede "ponerse en los zapatos" de un gimnasio específico para operar como si fuera un usuario de ese gimnasio. Esto es útil para soporte técnico, auditoría o resolución de problemas. El sistema registra quién hizo la impersonación y durante cuánto tiempo.

---

## Gestión de Usuarios y Roles

### ✅ Roles del Sistema
El sistema tiene 5 roles:
- **SUPERADMIN:** Administrador global, puede hacer cualquier cosa en cualquier gimnasio
- **ADMIN:** Administrador de un gimnasio específico
- **RECEPCIONISTA:** Personal de recepción de un gimnasio
- **NUTRICIONISTA:** Profesional de salud de un gimnasio
- **SOCIO:** Cliente/miembro de un gimnasio

### ✅ Crear Usuarios (con restricciones por rol)
- **SUPERADMIN** puede crear: ADMIN, RECEPCIONISTA, NUTRICIONISTA, SOCIO
- **ADMIN** puede crear: RECEPCIONISTA, NUTRICIONISTA, SOCIO
- **RECEPCIONISTA** puede crear: NUTRICIONISTA, SOCIO
- **NUTRICIONISTA** y **SOCIO** no pueden crear usuarios

### ✅ Permisos Granulares por Rol
Cada rol tiene un conjunto predefinido de acciones permitidas. Por ejemplo, un RECEPCIONISTA puede ver, crear, editar y eliminar socios, pero un NUTRICIONISTA solo puede ver sus pacientes asignados.

### ✅ Permisos Personalizados por Usuario
Un ADMIN puede asignar permisos adicionales o quitar permisos a un usuario específico. Por ejemplo, si hay 2 recepcionistas, al Recepcionista 1 se le puede dar permiso para generar reportes, mientras que el Recepcionista 2 no tendrá ese permiso.

### ✅ Gestión de Grupos de Permisos
Los permisos se organizan en "grupos" (plantillas reutilizables). Por ejemplo, existe un grupo "Recepcionista" que contiene todas las acciones que un recepcionista típico puede hacer. Al crear un usuario, se le asigna automáticamente el grupo base de su rol.

### ✅ Auditoría de Acciones
El sistema registra quién hizo qué, cuándo y desde qué gimnasio. Si un SUPERADMIN impersona un gimnasio y realiza acciones, queda registrado que fue el SUPERADMIN operando en modo impersonación.

---

## Gestión de Socios (Clientes)

### ✅ Registrar Socio
Un RECEPCIONISTA o ADMIN puede registrar un nuevo socio en su gimnasio con sus datos personales.

### ✅ Listar Socios
Un RECEPCIONISTA o ADMIN puede ver la lista de socios de su gimnasio (NO ve socios de otros gimnasios).

### ✅ Editar Socio
Un RECEPCIONISTA o ADMIN puede modificar los datos de un socio (nombre, contacto, etc.).

### ✅ Eliminar Socio
Un RECEPCIONISTA o ADMIN puede dar de baja un socio.

### ✅ Ver Mi Información (como Socio)
Un SOCIO puede ver su propia información personal y su ficha clínica.

---

## Gestión de Nutricionistas

### ✅ Registrar Nutricionista
Un ADMIN o RECEPCIONISTA puede registrar un nuevo nutricionista en su gimnasio con sus datos profesionales.

### ✅ Listar Nutricionistas
Un ADMIN o RECEPCIONISTA puede ver la lista de nutricionistas de su gimnasio.

### ✅ Editar Nutricionista
Un ADMIN o RECEPCIONISTA puede modificar los datos de un nutricionista.

### ✅ Ver Mis Pacientes (como Nutricionista)
Un NUTRICIONISTA puede ver la lista de socios que tiene asignados como pacientes.

---

## Gestión de Turnos

### ✅ Reservar Turno (como Socio)
Un SOCIO puede reservar un turno con un nutricionista de su gimnasio.

### ✅ Cancelar Turno
Un SOCIO puede cancelar un turno previamente reservado.

### ✅ Reprogramar Turno
Un SOCIO puede cambiar la fecha/hora de un turno reservado.

### ✅ Confirmar Turno
Un SOCIO puede confirmar asistencia a un turno.

### ✅ Asignar Turno Manual (Recepción)
Un RECEPCIONISTA puede asignar un turno manualmente a un socio (por teléfono o presencial).

### ✅ Bloquear Turno
Un RECEPCIONISTA puede bloquear un turno para que no sea reservado (por mantenimiento, feriado, etc.).

### ✅ Ver Agenda Diaria (Nutricionista)
Un NUTRICIONISTA puede ver su agenda del día con todos los turnos programados.

### ✅ Ver Turnos del Día (Recepción)
Un RECEPCIONISTA puede ver todos los turnos del día de su gimnasio.

### ✅ Check-In de Turno
Un RECEPCIONISTA puede registrar la llegada de un socio a su turno (check-in).

### ✅ Iniciar Consulta
Un NUTRICIONISTA puede iniciar la consulta cuando el socio está presente.

### ✅ Finalizar Consulta
Un NUTRICIONISTA puede finalizar la consulta y registrar las notas/observaciones.

### ✅ Registrar Asistencia
Un RECEPCIONISTA puede registrar si un socio asistió o no a su turno.

---

## Gestión de Fichas Clínicas

### ✅ Completar Ficha de Salud (como Socio)
Un SOCIO puede completar su ficha de salud con información médica relevante (alergias, patologías, consumo de alcohol, nivel de actividad física, frecuencia de comidas).

### ✅ Ver Ficha de Salud del Paciente (como Nutricionista)
Un NUTRICIONISTA puede ver la ficha de salud de sus pacientes asignados.

### ✅ Editar Ficha de Salud (como Nutricionista)
Un NUTRICIONISTA puede actualizar la ficha de salud de un paciente después de una consulta.

### ✅ Guardar Observaciones Clínicas
Un NUTRICIONISTA puede guardar observaciones/notas de cada consulta realizada.

### ✅ Ver Historial de Consultas
Un NUTRICIONISTA puede ver el historial completo de consultas de un paciente con todas las observaciones registradas.

---

## Gestión de Mediciones y Progreso

### ✅ Registrar Mediciones (como Nutricionista)
Un NUTRICIONISTA puede registrar las mediciones de un paciente (peso, altura, circunferencias, etc.) durante una consulta.

### ✅ Ver Historial de Mediciones
Un NUTRICIONISTA puede ver la evolución de las mediciones de un paciente a lo largo del tiempo.

### ✅ Ver Resumen de Progreso
Un NUTRICIONISTA puede ver un resumen del progreso del paciente (gráficos de evolución, comparativas).

---

## Gestión de Planes Alimentarios

### ✅ Crear Plan Alimentario (como Nutricionista)
Un NUTRICIONISTA puede crear un plan alimentario personalizado para un paciente con comidas para cada día de la semana.

### ✅ Editar Plan Alimentario
Un NUTRICIONISTA puede modificar un plan alimentario existente (cambiar comidas, porciones, etc.).

### ✅ Ver Plan Activo (como Socio)
Un SOCIO puede ver el plan alimentario que tiene activo actualmente.

### ✅ Ver Historial de Planes (como Socio)
Un SOCIO puede ver todos los planes que ha tenido a lo largo del tiempo.

### ✅ Listar Planes (como Nutricionista)
Un NUTRICIONISTA puede ver todos los planes que ha creado para sus pacientes.

### ✅ Eliminar Plan Alimentario
Un NUTRICIONISTA puede eliminar un plan alimentario (soft delete).

---

## Gestión de Fotos de Progreso

### ✅ Subir Foto de Progreso
Un NUTRICIONISTA puede subir fotos del progreso físico de un paciente (frente, perfil, espalda).

### ✅ Ver Fotos de Progreso
Un NUTRICIONISTA puede ver el historial de fotos de progreso de un paciente para comparar visualmente la evolución.

---

## Gestión de Objetivos

### ✅ Crear Objetivo (como Nutricionista)
Un NUTRICIONISTA puede establecer objetivos para un paciente (perder peso, ganar masa muscular, etc.).

### ✅ Ver Objetivos del Paciente
Un NUTRICIONISTA puede ver los objetivos actuales de un paciente.

---

## Inteligencia Artificial (Sugerencias)

### ✅ Analizar Plan Nutricional
El sistema puede analizar un plan alimentario y dar sugerencias de mejora (balance de macronutrientes, variedad de alimentos, etc.).

### ✅ Generar Ideas de Comida
El sistema puede sugerir ideas de comidas basadas en las preferencias y restricciones del paciente.

### ✅ Preparar Contexto del Paciente
El sistema puede preparar un resumen del contexto clínico del paciente para asistir al nutricionista en la consulta.

---

## Autenticación y Seguridad

### ✅ Login con Email y Contraseña
Los usuarios pueden iniciar sesión con su email y contraseña.

### ✅ Token JWT
El sistema usa tokens JWT para autenticar las requests. Los tokens expiran después de un tiempo configurable.

### ✅ Cambio de Contexto (Tenant Switcher)
Un SUPERADMIN puede cambiar rápidamente entre gimnasios usando un selector de tenant en la interfaz.

### ✅ Indicador Visual de Impersonación
Cuando un SUPERADMIN está impersonando un gimnasio, el sistema muestra un banner visible indicando que está en "modo impersonación".

### ✅ Manejo de Errores de Permisos
Si un usuario intenta acceder a una funcionalidad para la que no tiene permiso, el sistema:
- En el frontend: oculta los botones/menús correspondientes
- En el backend: rechaza la request con error 403

---

## Próximas Funcionalidades (Pendientes)

### 🔄 Sistema de Notificaciones
Envío de recordatorios de turnos por email/WhatsApp a los socios.

### 🔄 Sistema de Pagos
Gestión de cuotas mensuales de los socios, registro de pagos, morosidad.

### 🔄 Reportes Avanzados
Reportes de asistencia, ingresos, progreso de pacientes, etc.

### 🔄 App Móvil
Versión móvil para que los socios puedan reservar turnos y ver sus planes desde el celular.

### 🔄 Integración con Dispositivos
Conexión con básculas inteligentes, wearables, etc. para registrar mediciones automáticamente.

---

## Resumen por Rol

### ¿Qué puede hacer un SUPERADMIN?
- Todo. Es el "dueño del sistema". Puede ver y modificar datos de cualquier gimnasio.
- Puede impersonar cualquier gimnasio.
- Puede crear/editar/eliminar gimnasios.
- Puede crear usuarios con cualquier rol.

### ¿Qué puede hacer un ADMIN?
- Todo dentro de su gimnasio: gestionar socios, nutricionistas, recepcionistas, turnos, planes, etc.
- Puede asignar/quitar permisos personalizados a usuarios de su gimnasio.
- NO puede ver datos de otros gimnasios.

### ¿Qué puede hacer un RECEPCIONISTA?
- Gestionar socios (crear, editar, eliminar, ver).
- Crear nutricionistas.
- Gestionar turnos (crear, editar, cancelar, ver agenda).
- Check-in de socios.
- Lo que el ADMIN le habilite adicionalmente (ej: reportes).

### ¿Qué puede hacer un NUTRICIONISTA?
- Ver sus pacientes asignados.
- Ver y editar fichas de salud de sus pacientes.
- Crear y editar planes alimentarios.
- Registrar mediciones y progreso.
- Ver su agenda de turnos.
- NO puede crear usuarios.

### ¿Qué puede hacer un SOCIO?
- Ver su propia información.
- Reservar, cancelar, reprogramar turnos.
- Ver su plan alimentario activo.
- Ver su ficha de salud.
- NO puede crear usuarios.
- NO puede ver datos de otros socios.

---

*Última actualización: 2026-06-01*
*Sistema en desarrollo activo*
