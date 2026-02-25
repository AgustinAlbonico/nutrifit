# Planificacion paso a paso - Todos los casos de uso (CUD01-CUD21)

## 1) Objetivo

Definir una guia operativa, clara y ejecutable para implementar todos los casos de uso del documento de requisitos, desde CUD01 hasta CUD21, con foco en:

- orden real de implementacion,
- controles funcionales y de seguridad,
- validaciones criticas por flujo,
- criterio de cierre por cada CU.

Fuente base: `docs/NutriFit-Supervisor_resumen-requisitos-casos-de-uso.md`.

## 2) Alcance

Incluye:

- Casos de uso del asistente: CUD01-CUD05.
- Casos de uso del profesional: CUD06-CUD12 y CUD21.
- Casos de uso del socio: CUD13-CUD20.

No incluye:

- Facturacion/pagos.
- Mensajeria externa sincrona (ej. WhatsApp integrado).
- Modulo IA de recomendaciones avanzadas.

## 3) Dependencias transversales (aplican a todos)

1. Autenticacion activa por rol (asistente, profesional, socio).
2. Autorizacion por endpoint y por vista.
3. Modelo de turno con estados: PENDIENTE, CONFIRMADO, CANCELADO, REPROGRAMADO, REALIZADO, AUSENTE.
4. Registro de auditoria para acciones sensibles y acceso a datos clinicos.
5. Validaciones de datos (formato, obligatoriedad, unicidad y reglas de negocio).

## 4) Orden recomendado de ejecucion global

1. Bloque Asistente: CUD01 -> CUD05.
2. Bloque Profesional base: CUD11 -> CUD06 -> CUD07 -> CUD08.
3. Bloque Clinico Profesional: CUD09 -> CUD10.
4. Bloque Operativo Profesional: CUD12 -> CUD21.
5. Bloque Socio descubrimiento y reserva: CUD13 -> CUD15 -> CUD14 -> CUD16.
6. Bloque Socio gestion de turnos: CUD17 -> CUD18 -> CUD19 -> CUD20.

---

## 5) Plan paso a paso por cada caso de uso

## 5.1 Casos de uso del asistente

### CUD01 - Gestionar profesionales

Objetivo: centralizar toda la operacion ABM de profesionales.

Paso a paso:

1. Crear modulo principal con listado y acciones habilitadas.
2. Conectar accesos a CUD02, CUD03, CUD04 y CUD05.
3. Validar acceso exclusivo para rol asistente.
4. Definir estados vacios y mensajes de guia.
5. Registrar auditoria de acciones administrativas.

Puntos a tener en cuenta:

- CUD01 es caso paraguas: no duplicar logica de subcasos.

Checklist de cierre:

- Desde CUD01 se puede navegar y ejecutar CUD02-05.
- Roles no autorizados quedan bloqueados.

### CUD02 - Registrar profesional

Objetivo: alta segura y completa de profesional.

Paso a paso:

1. Construir formulario con todos los campos obligatorios.
2. Validar completitud, formato y consistencia de datos.
3. Validar unicidad de DNI y email.
4. Generar contrasena provisoria (12 chars, complejidad minima).
5. Guardar contrasena en hash + salt.
6. Crear profesional en estado inicial definido y mostrar confirmacion.
7. Disparar envio de credenciales por correo.

Puntos a tener en cuenta:

- Manejar duplicados y campos invalidos sin perder datos cargados.
- Evitar exponer detalles sensibles en mensajes de error.

Checklist de cierre:

- Alta exitosa con credenciales seguras.
- Casos alternativos (duplicado/invalido) cubiertos.

### CUD03 - Modificar profesional

Objetivo: actualizar datos existentes de forma controlada.

Paso a paso:

1. Buscar profesional por nombre o DNI.
2. Cargar formulario con datos actuales.
3. Permitir edicion de campos habilitados.
4. Validar formatos antes de guardar.
5. Persistir cambios y confirmar resultado.

Puntos a tener en cuenta:

- Conservar historial/auditoria de cambios.
- Evitar romper integridad de identificadores clave.

Checklist de cierre:

- Cambios persistidos correctamente.
- Errores de validacion informados con precision.

### CUD04 - Desactivar o suspender profesional

Objetivo: suspender profesional sin inconsistencias operativas.

Paso a paso:

1. Seleccionar profesional y mostrar resumen del impacto.
2. Confirmar accion de suspension.
3. Verificar si existen turnos futuros.
4. Si hay turnos futuros, bloquear suspension hasta cancelar/reasignar.
5. Si no hay bloqueos, pasar estado a SUSPENDIDO.
6. Revocar login y posibilidad de recibir nuevos turnos.
7. Notificar a socios afectados cuando aplique.

Puntos a tener en cuenta:

- Suspension reversible segun regla de negocio.

Checklist de cierre:

- Profesional suspendido no puede operar.
- Turnos impactados gestionados y notificados.

### CUD05 - Ver listado de profesionales

Objetivo: consultar profesionales con filtros y acciones.

Paso a paso:

1. Mostrar tabla con nombre, apellido, especialidad, estado y acciones.
2. Implementar filtros por especialidad, estado y nombre.
3. Actualizar resultados en forma inmediata al aplicar filtros.
4. Exponer acciones rapidas de editar/suspender.
5. Mostrar mensaje cuando no haya coincidencias.

Puntos a tener en cuenta:

- El listado para socio debe mostrar solo profesionales activos (regla transversal).

Checklist de cierre:

- Filtros y acciones funcionan de punta a punta.
- Estado vacio bien resuelto.

## 5.2 Casos de uso del profesional

### CUD06 - Gestionar agenda

Objetivo: concentrar operacion diaria del profesional.

Paso a paso:

1. Definir pantalla principal "Mi Agenda".
2. Exponer accesos a CUD07, CUD08, CUD09, CUD10, CUD11, CUD12 y CUD21.
3. Mostrar resumen diario y pendientes.
4. Aplicar permisos por rol y estado del profesional.
5. Registrar auditoria de accesos clinicos.

Puntos a tener en cuenta:

- Evitar logica duplicada entre CUD06 y subflujos.

Checklist de cierre:

- CUD06 opera como hub unico del profesional.

### CUD07 - Ver turnos del dia

Objetivo: visualizar agenda diaria con acciones operativas.

Paso a paso:

1. Consultar turnos del dia para el profesional logueado.
2. Mostrar socio, horario, tipo y estado.
3. Habilitar accesos a ficha/historial y registro de asistencia.
4. Incorporar filtros por socio, horario y objetivo.
5. Manejar estado vacio cuando no hay turnos.

Puntos a tener en cuenta:

- No exponer turnos de otros profesionales.

Checklist de cierre:

- Vista diaria correcta con filtros y acciones.

### CUD08 - Ver pacientes

Objetivo: listar pacientes vinculados y abrir contexto clinico.

Paso a paso:

1. Definir criterio de paciente vinculado (turnos historicos o asignados).
2. Listar pacientes con datos basicos relevantes.
3. Exponer accesos a CUD09, CUD10 y CUD12.
4. Validar que no se pueda acceder a pacientes sin vinculo.
5. Resolver estado vacio para profesional sin pacientes.

Puntos a tener en cuenta:

- Alinear criterio de listado con criterio de autorizacion clinica.

Checklist de cierre:

- Solo pacientes permitidos visibles y accesibles.

### CUD09 - Ver ficha de salud del paciente

Objetivo: consultar datos clinicos base del socio.

Paso a paso:

1. Obtener ficha por socio seleccionado.
2. Verificar vinculo profesional-socio antes de mostrar.
3. Mostrar estatura, peso, actividad, alergias, patologias y objetivo.
4. Mostrar mensaje cuando no existe ficha registrada.
5. Auditar acceso a datos sensibles.

Puntos a tener en cuenta:

- Cumplir RNF08 de forma estricta.

Checklist de cierre:

- Acceso permitido/denegado funciona segun reglas.

### CUD10 - Ver historial de consultas del paciente

Objetivo: dar seguimiento longitudinal clinico.

Paso a paso:

1. Recuperar sesiones previas del socio con ese profesional.
2. Ordenar cronologicamente (definir asc/desc de manera consistente).
3. Mostrar fecha/hora, tipo, notas y adjuntos.
4. Bloquear acceso a historiales no autorizados.
5. Manejar mensaje sin consultas previas.

Puntos a tener en cuenta:

- Definir politica de adjuntos (tipos permitidos y descarga segura).

Checklist de cierre:

- Historial completo y autorizado, con fallback sin datos.

### CUD11 - Configurar horario de atencion

Objetivo: definir disponibilidad para generar agenda.

Paso a paso:

1. Permitir seleccionar dias disponibles.
2. Definir rango horario por dia.
3. Definir duracion estandar del turno.
4. Validar al menos un dia con rango valido.
5. Validar ausencia de solapamientos.
6. Guardar configuracion y generar slots.
7. Cambiar estado a activo cuando corresponda.

Puntos a tener en cuenta:

- No generar slots sobre horarios ocupados.

Checklist de cierre:

- Configuracion valida produce agenda utilizable.

### CUD12 - Asignar turno a paciente

Objetivo: crear turnos manuales para casos especiales.

Paso a paso:

1. Buscar socio por nombre o DNI.
2. Seleccionar fecha de atencion.
3. Mostrar horarios disponibles y no disponibles.
4. Seleccionar horario valido y confirmar.
5. Crear turno en estado PENDIENTE.
6. Notificar al socio por asignacion manual.

Puntos a tener en cuenta:

- Evitar superposicion y fechas pasadas.

Checklist de cierre:

- Turno manual queda creado y notificado.

### CUD21 - Registrar asistencia del socio al turno

Objetivo: cerrar turno con estado REALIZADO o AUSENTE.

Paso a paso:

1. Validar elegibilidad: turno CONFIRMADO y ya transcurrido.
2. Mostrar accion "Registrar asistencia".
3. Permitir opcion "Asistio" o "No asistio".
4. Aplicar transicion de estado correspondiente.
5. Bloquear doble registro y estados no elegibles.
6. Guardar auditoria de cambio de estado.

Puntos a tener en cuenta:

- El documento fuente tiene una post-condicion inconsistente; en implementacion debe quedar REALIZADO/AUSENTE.

Checklist de cierre:

- Transiciones correctas y no repetibles.

## 5.3 Casos de uso del socio

### CUD13 - Ver lista de profesionales

Objetivo: descubrir profesionales para reservar.

Paso a paso:

1. Mostrar lista de profesionales activos.
2. Permitir filtros por especialidad y nombre.
3. Exponer acciones "Ver perfil" (CUD15) y "Reservar turno" (CUD14).
4. Manejar escenario sin profesionales disponibles.

Puntos a tener en cuenta:

- Nunca mostrar profesionales suspendidos/inactivos al socio.

Checklist de cierre:

- Busqueda clara y accionable para iniciar reserva.

### CUD14 - Solicitar turno con profesional

Objetivo: reservar turno sobre agenda del profesional.

Paso a paso:

1. Abrir agenda del profesional seleccionado.
2. Elegir fecha.
3. Mostrar slots disponibles y reservados (no seleccionables).
4. Verificar si es primer turno y derivar a CUD16 si falta ficha.
5. Confirmar reserva.
6. Registrar turno y notificar a socio/profesional.

Puntos a tener en cuenta:

- Bloquear fechas pasadas y mas de un turno con mismo profesional en el mismo dia.

Checklist de cierre:

- Reserva consistente con reglas de negocio y notificaciones enviadas.

### CUD15 - Ver perfil de profesional

Objetivo: decidir con informacion antes de reservar.

Paso a paso:

1. Abrir perfil desde listado.
2. Mostrar datos basicos, especialidad y biografia.
3. Mostrar horarios de atencion y reputacion/opiniones.
4. Exponer CTA para reservar.

Puntos a tener en cuenta:

- Usar solo informacion publica/permitida del profesional.

Checklist de cierre:

- El perfil permite decidir y continuar reserva sin friccion.

### CUD16 - Cargar datos de salud

Objetivo: registrar ficha inicial previa a la primera reserva.

Paso a paso:

1. Detectar ausencia de ficha al iniciar primera reserva.
2. Mostrar formulario clinico completo.
3. Validar campos obligatorios.
4. Guardar ficha y asociarla al socio.
5. Continuar automaticamente con flujo de CUD14.

Puntos a tener en cuenta:

- Esta carga debe pedirse solo la primera vez.

Checklist de cierre:

- Ficha guardada y flujo de reserva continuado.

### CUD17 - Ver turnos reservados

Objetivo: administrar reservas activas del socio.

Paso a paso:

1. Mostrar tabla de turnos del socio.
2. Incluir columnas clave (fecha, hora, profesional, especialidad, acciones).
3. Permitir filtros por fecha, profesional, especialidad y estado.
4. Exponer acciones a CUD18 y CUD19.
5. Resolver estado sin turnos y acceso a nueva reserva.

Puntos a tener en cuenta:

- Mantener sincronia con estados reales de turno.

Checklist de cierre:

- El socio puede consultar y operar sus turnos desde una sola vista.

### CUD18 - Reprogramar turno

Objetivo: cambiar fecha/hora de un turno pendiente.

Paso a paso:

1. Seleccionar turno en estado pendiente.
2. Consultar disponibilidad alternativa del profesional.
3. Mostrar calendario con opciones disponibles.
4. Seleccionar nueva fecha/hora y confirmar.
5. Actualizar turno a estado REPROGRAMADO.
6. Notificar al profesional.

Puntos a tener en cuenta:

- Aplicar regla minima de 24h para cancelar/reprogramar.

Checklist de cierre:

- Reprogramacion persiste correctamente y notifica.

### CUD19 - Cancelar turno

Objetivo: cancelar turno pendiente y liberar cupo.

Paso a paso:

1. Seleccionar turno cancelable.
2. Solicitar confirmacion explicita.
3. Cambiar estado a CANCELADO.
4. Liberar horario en agenda del profesional.
5. Notificar al profesional.

Puntos a tener en cuenta:

- Bloquear turnos en curso/finalizados.
- Aplicar regla minima de 24h.

Checklist de cierre:

- Turno cancelado, horario liberado y notificacion emitida.

### CUD20 - Confirmar turno

Objetivo: confirmar asistencia del socio el dia del turno.

Paso a paso:

1. Notificar al socio el turno del dia.
2. Abrir enlace/pantalla de confirmacion.
3. Verificar turno pendiente y de fecha actual.
4. Confirmar asistencia.
5. Cambiar estado a CONFIRMADO.
6. Registrar timestamp y log de evento.

Puntos a tener en cuenta:

- Bloquear confirmacion de turnos cancelados/realizados o de otro dia.

Checklist de cierre:

- Confirmacion valida queda registrada una sola vez.

---

## 6) Checklist final comun (aplica a cada CU)

- Flujo principal y alternativos implementados.
- Reglas de negocio del CU aplicadas.
- Permisos y seguridad validados por rol.
- Mensajes de error y estados vacios claros.
- Pruebas del CU (unitarias/integracion/e2e segun impacto) ejecutadas.
- Auditoria registrada para acciones sensibles.

## 7) Siguiente uso recomendado de este plan

Usar esta guia como checklist de ejecucion diaria: tomar un CU, recorrer pasos 1..N, verificar puntos de control, cerrar checklist comun y avanzar al siguiente.

Para seguimiento operativo diario usar la plantilla reusable:

- `docs/plans/_template-seguimiento-casos-de-uso-cud01-21.md`
