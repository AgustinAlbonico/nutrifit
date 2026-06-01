# Plan de diseno y planificacion - Casos de uso de agenda profesional

## 1) Contexto y objetivo

Este documento planifica los casos de uso del modulo de agenda profesional mostrados en el diagrama:

- CUD06 - Gestionar Agenda
- CUD07 - Ver turnos del dia
- CUD08 - Ver pacientes
- CUD09 - Ver ficha de salud del paciente
- CUD10 - Ver historial de consultas del paciente
- CUD11 - Configurar Horario de Atencion
- CUD12 - Asignar Turno a Paciente
- CUD21 - Registrar asistencia del socio al turno

Objetivo: definir una planificacion ejecutable, con alcance funcional, dependencias, orden de implementacion, criterios de aceptacion y estrategia de pruebas para empezar desarrollo con bajo riesgo.

## 2) Insumos de referencia

Fuente principal:

- `docs/NutriFit-Supervisor_resumen-requisitos-casos-de-uso.md`

Secciones utilizadas:

- RF06, RF16, RF17, RF18, RF19, RF20, RF21, RF22, RF25, RF26
- Reglas de negocio (roles, turnos, profesional, seguridad)
- Especificaciones CUD06-CUD12 y CUD21

Nota de consistencia:

- En el documento fuente hay referencias cruzadas con numeracion inconsistente en algunos puntos de extension (por ejemplo, CUD08 menciona CUD10/CUD11/CUD13 con nombres intercambiados). En este plan se utiliza la nomenclatura consolidada de la seccion de casos de uso transcritos (CUD09 = ficha de salud, CUD10 = historial, CUD12 = asignacion manual).

## 3) Enfoques evaluados (brainstorming)

### Enfoque A - Planificar por caso de uso aislado

Cada CUD se implementa de punta a punta en orden numerico.

Ventajas:

- Facil de seguir para trazabilidad documental.

Desventajas:

- Alto retrabajo entre CUD conectados (CUD07/CUD21, CUD08/CUD09/CUD10).
- Riesgo de duplicar reglas de agenda, estados y permisos.

### Enfoque B - Planificar por flujo operativo del profesional (recomendado)

Se planifica por bloques funcionales que reflejan el uso real: configurar agenda, operar el dia, gestionar pacientes y registrar resultados.

Ventajas:

- Reduce retrabajo porque comparte base de datos, validaciones y permisos.
- Permite entregar valor usable por incrementos.
- Alinea con el diagrama (CUD06 como orquestador y extensiones).

Desventajas:

- Requiere una definicion inicial mas clara de dependencias.

### Enfoque C - Planificar por capa tecnica (backend primero)

Primero entidades y APIs, despues UI, al final QA.

Ventajas:

- Orden tecnico claro para equipos backend-heavy.

Desventajas:

- Feedback funcional tardio.
- Riesgo de contratos API alejados de la experiencia real del profesional.

### Decision

Se adopta el **Enfoque B** (por flujo operativo), con milestones pequenos y criterios de aceptacion por CUD.

## 4) Alcance de esta planificacion

### Incluye

- Flujo completo del profesional para agenda diaria y pacientes (CUD06-CUD12, CUD21).
- Permisos por rol y restricciones de acceso a ficha/historial.
- Reglas de estados del turno para registrar asistencia.
- Notificaciones asociadas a asignacion manual de turno y cambios relevantes.
- Plan de pruebas funcionales, integracion y e2e para estos CUD.

### No incluye

- Flujos del socio fuera de su interaccion indirecta con estos CUD (ej. CUD14-CUD20).
- Facturacion/pagos/mensajeria externa.
- Reentrenamiento o logica de IA.

## 5) Dependencias funcionales y tecnicas

Dependencias directas para que estos CUD funcionen:

1. Autenticacion y autorizacion por rol (profesional) operativas.
2. Modelo de turno con estados al menos: PENDIENTE, CONFIRMADO, CANCELADO, REPROGRAMADO, REALIZADO, AUSENTE.
3. Relacion socio-profesional por historial o turno asignado para acceso clinico.
4. Modulo de notificaciones disponible para RF26.3 (CUD12).
5. Auditoria de eventos clinicos y de estado (RNF09).

## 6) Modelo operativo objetivo (vision integrada)

Flujo diario esperado del profesional:

1. Configura disponibilidad (CUD11).
2. Ingresa a "Mi Agenda" (CUD06).
3. Revisa turnos del dia (CUD07).
4. Consulta base de pacientes (CUD08).
5. Abre ficha de salud (CUD09) y/o historial de consultas (CUD10).
6. Asigna turno manual si corresponde (CUD12).
7. Registra asistencia al finalizar el turno (CUD21).

## 7) Plan por fases (iteraciones sugeridas)

### Fase 0 - Base transversal (2-3 dias)

Objetivo: dejar lista la base comun para todas las funciones.

Entregables:

- Contrato de estados del turno y transiciones permitidas.
- Matriz de permisos por rol para vistas y endpoints.
- Eventos de auditoria minimos para datos sensibles/acciones clinicas.

### Fase 1 - Disponibilidad y activacion de agenda (CUD11) (3-4 dias)

Objetivo: que el profesional pueda definir horarios validos y habilitar turnos.

Entregables:

- Configuracion por dia/rango/duracion.
- Validaciones de horarios (sin superposicion, rango valido, al menos un dia).
- Generacion de slots y activacion de estado profesional.

### Fase 2 - Operacion diaria de agenda (CUD06 + CUD07 + CUD21) (4-5 dias)

Objetivo: operar el dia de atencion con seguridad y trazabilidad.

Entregables:

- Vista "Mi Agenda" como entrada unica (CUD06).
- Lista de turnos del dia con acciones (CUD07).
- Registro de asistencia (REALIZADO/AUSENTE) sobre turnos validos (CUD21).

### Fase 3 - Espacio de pacientes y contexto clinico (CUD08 + CUD09 + CUD10) (5-6 dias)

Objetivo: dar contexto clinico antes y despues de la atencion.

Entregables:

- Listado de pacientes vinculados al profesional.
- Visualizacion de ficha de salud con control de acceso.
- Historial cronologico de consultas con notas y adjuntos.

### Fase 4 - Asignacion manual y notificaciones (CUD12) (3-4 dias)

Objetivo: cubrir casos especiales donde el turno no entra por flujo del socio.

Entregables:

- Alta manual de turno en estado PENDIENTE.
- Validacion de disponibilidad en tiempo real.
- Notificacion al socio por asignacion manual.

### Fase 5 - Endurecimiento y salida (2-3 dias)

Objetivo: cerrar calidad funcional y tecnica.

Entregables:

- Suite e2e de regresion de CUD06-CUD12/CUD21.
- Validacion de RNF (seguridad, usabilidad, mensajes de error, integridad).
- Checklist de salida a staging.

## 8) Planificacion detallada por caso de uso

### CUD06 - Gestionar Agenda

Alcance:

- Punto de entrada del modulo profesional de agenda.
- Orquesta navegacion hacia CUD07, CUD08, CUD09, CUD10, CUD11, CUD12 y CUD21.

Tareas clave:

- Definir vista principal con accesos rapidos a subflujos.
- Restringir acceso por rol profesional activo.
- Incorporar estados vacios y mensajes accionables.

Criterios de aceptacion:

- Un profesional autenticado accede al panel y ve opciones de agenda/pacientes.
- Un usuario no profesional no puede acceder al modulo.
- Todas las acciones relevantes quedan auditadas.

### CUD07 - Ver turnos del dia

RF relacionados: RF17, RF18, RF19.

Tareas clave:

- Mostrar turnos del dia actual con datos minimos: socio, horario, tipo, estado.
- Exponer acciones contextuales: ver ficha, iniciar atencion, registrar asistencia.
- Implementar filtros por socio, horario u objetivo.

Validaciones y reglas:

- Turnos en fecha actual.
- No mostrar turnos de otro profesional.
- Mensaje de estado vacio cuando no hay turnos.

Criterios de aceptacion:

- El profesional visualiza correctamente su agenda diaria.
- Los filtros acotan resultados sin romper la vista.
- Puede navegar a ficha/historial del paciente desde la agenda.

### CUD08 - Ver pacientes

RF relacionados: RF18, RF19 (acceso previo a ficha), RF22.

Tareas clave:

- Listar socios con relacion historica o turnos asignados al profesional.
- Mostrar accesos a ficha de salud (CUD09), historial (CUD10), asignacion manual (CUD12).
- Definir estado vacio para profesional sin pacientes.

Validaciones y reglas:

- No listar pacientes sin vinculo valido.
- Mantener consistencia entre listado y permisos de acceso clinico.

Criterios de aceptacion:

- El listado refleja solo pacientes habilitados por relacion de turnos.
- Los accesos a ficha/historial funcionan desde cada fila.

### CUD09 - Ver ficha de salud del paciente

RF relacionados: RF16, RF19. RNF relacionados: RNF08.

Tareas clave:

- Mostrar ficha de salud con campos clinicos definidos.
- Proteger el acceso por relacion profesional-socio.
- Manejar ausencia de ficha cargada.

Validaciones y reglas:

- Solo accesible si existe turno historico o asignado con el profesional.
- Datos sensibles auditados.

Criterios de aceptacion:

- Un profesional habilitado visualiza correctamente la ficha.
- Un profesional no vinculado recibe acceso denegado.

### CUD10 - Ver historial de consultas del paciente

RF relacionados: RF20, RF22, RF25.

Tareas clave:

- Mostrar sesiones en orden cronologico con fecha/hora, tipo, notas y adjuntos.
- Implementar mensaje cuando no hay consultas previas.
- Preparar estructura para futuros filtros (rango/estado) sin romper version inicial.

Validaciones y reglas:

- Solo turnos/consultas pertenecientes al profesional actual y socio seleccionado.
- Integridad temporal de registros (sin alteracion historica indebida).

Criterios de aceptacion:

- El profesional ve historial cronologico completo del paciente vinculado.
- Los adjuntos visibles respetan autorizacion y formato permitido.

### CUD11 - Configurar Horario de Atencion

RF relacionados: RF06.

Tareas clave:

- Definir disponibilidad semanal por dias y rangos.
- Definir duracion estandar de turno.
- Generar bloques de agenda disponibles.

Validaciones y reglas:

- Minimo un dia y rango valido.
- Sin superposicion entre bloques del mismo profesional.
- No permitir agendar sobre horarios ocupados.

Criterios de aceptacion:

- Al guardar configuracion valida, se crean slots y el profesional queda activo.
- Configuraciones invalidas muestran mensaje claro y no persisten.

### CUD12 - Asignar Turno a Paciente

RF relacionados: RF26.3 (notificacion de turno asignado manualmente).

Tareas clave:

- Buscar socio por nombre o DNI.
- Mostrar disponibilidad real por fecha (slots disponibles/no disponibles).
- Crear turno en estado PENDIENTE.
- Notificar al socio tras asignacion.

Validaciones y reglas:

- Debe existir disponibilidad al confirmar.
- Evitar superposicion y fechas pasadas.
- Registrar auditoria de asignacion manual.

Criterios de aceptacion:

- Si hay disponibilidad, el turno se crea y se notifica correctamente.
- Si no hay disponibilidad, se informa y permite reintento.

### CUD21 - Registrar asistencia del socio al turno

Regla de negocio clave: actualizar estado del turno a REALIZADO o AUSENTE al finalizar.

Tareas clave:

- Exponer accion "Registrar asistencia" en turnos elegibles.
- Solicitar decision asistio/no asistio.
- Actualizar estado con control de idempotencia y auditoria.

Validaciones y reglas:

- Solo turnos en estado CONFIRMADO y ya transcurridos.
- Bloquear turnos cancelados, ya gestionados o fuera de ventana.

Criterios de aceptacion:

- Al confirmar asistencia, estado pasa a REALIZADO.
- Al marcar inasistencia, estado pasa a AUSENTE.
- No se permite doble registro.

## 9) Matriz de dependencias entre casos de uso

1. CUD11 habilita disponibilidad para CUD07 y CUD12.
2. CUD07 es entrada operativa para CUD09 y CUD21.
3. CUD08 centraliza accesos a CUD09, CUD10 y CUD12.
4. CUD21 depende de CUD07 y de estados validos del turno.
5. CUD12 depende de CUD11 y de notificaciones (RF26).

## 10) Estrategia de pruebas

### 10.1 Pruebas unitarias

- Validaciones de agenda (rangos, solapamientos, duracion).
- Reglas de transicion de estados de turno (incluye CUD21).
- Reglas de autorizacion profesional-socio para ficha/historial.

### 10.2 Pruebas de integracion

- Endpoints de agenda y turnos con base de datos de prueba.
- Persistencia de historial y adjuntos.
- Publicacion/disparo de notificaciones por CUD12.

### 10.3 Pruebas e2e

- Flujo completo profesional: CUD06 -> CUD07 -> CUD09/CUD10 -> CUD21.
- Flujo configuracion: CUD11 -> slots -> CUD12.
- Casos alternativos: sin turnos, sin pacientes, sin disponibilidad.

## 11) Riesgos y mitigaciones

1. **Riesgo:** Inconsistencia de estados del turno por multiples acciones concurrentes.
   **Mitigacion:** transiciones atomicas y validacion en backend antes de persistir.

2. **Riesgo:** Exposicion de datos clinicos a profesionales no vinculados.
   **Mitigacion:** autorizacion por relacion de turnos + auditoria de acceso sensible.

3. **Riesgo:** Generacion de slots incorrecta por configuraciones complejas.
   **Mitigacion:** validaciones fuertes, tests de frontera y vista previa de agenda.

4. **Riesgo:** Notificaciones tardias o no enviadas en CUD12.
   **Mitigacion:** cola de reintentos, trazabilidad y monitoreo de entrega.

## 12) Definition of Done para este bloque

Se considera completado cuando:

1. CUD06-CUD12 y CUD21 cumplen criterios de aceptacion funcional.
2. Reglas de negocio de turnos, permisos y seguridad quedan cubiertas por pruebas.
3. Casos alternativos principales tienen manejo explicito de errores/mensajes.
4. Existe evidencia de auditoria para accesos clinicos y cambios de estado.
5. El flujo diario del profesional puede ejecutarse de punta a punta en staging.

## 13) Proximo paso recomendado

Armar el plan de implementacion tecnico (backlog por historias y tareas por sprint) tomando esta planificacion como base de trabajo.

## 14) Planificacion paso a paso por cada CU

Esta seccion funciona como guia operativa. Cada CU tiene un orden sugerido y una lista concreta de puntos a controlar.

### CUD06 - Gestionar Agenda (caso paraguas)

Paso 1 - Definir entrada del modulo:

- Crear la pantalla/punto unico "Mi Agenda" para profesional.
- Confirmar que desde ahi se accede a CUD07, CUD08, CUD11, CUD12 y CUD21.

Paso 2 - Validar permisos:

- Permitir acceso solo a rol profesional autenticado.
- Bloquear acceso si profesional esta suspendido/inactivo.

Paso 3 - Definir informacion minima inicial:

- Resumen de turnos del dia.
- Alertas de acciones pendientes (ej. turnos por registrar asistencia).

Paso 4 - Definir estados vacios:

- Sin turnos hoy.
- Sin pacientes vinculados.
- Agenda aun no configurada.

Paso 5 - Auditoria:

- Registrar ingreso al modulo y accesos a datos sensibles.

Paso 6 - Pruebas:

- Probar redireccion y permisos cruzados por rol.

### CUD07 - Ver turnos del dia

Paso 1 - Definir consulta principal:

- Traer turnos del profesional para fecha actual.
- Incluir estado del turno, tipo de consulta y datos de socio.

Paso 2 - Definir filtros obligatorios (RF18):

- Por socio (nombre/DNI).
- Por franja horaria.
- Por objetivo cuando exista dato asociado.

Paso 3 - Acciones desde cada turno:

- Ver ficha de salud (CUD09).
- Ver historial (CUD10).
- Registrar asistencia (CUD21) cuando aplique.

Paso 4 - Reglas a bloquear:

- No mostrar turnos de otro profesional.
- No permitir acciones sobre turnos cancelados si no corresponde.

Paso 5 - Mensajeria de UX:

- Si no hay turnos: "No hay turnos asignados para el dia de hoy".

Paso 6 - Pruebas:

- Con turnos, sin turnos y con filtros combinados.

### CUD08 - Ver pacientes

Paso 1 - Definir criterio de inclusion:

- Pacientes con turnos historicos o actuales con el profesional.

Paso 2 - Definir datos de listado:

- Nombre, identificador, ultimo turno, proximo turno (si existe), objetivo resumido.

Paso 3 - Definir acciones por fila:

- Ver ficha de salud (CUD09).
- Ver historial de consultas (CUD10).
- Asignar turno manual (CUD12).

Paso 4 - Control de seguridad:

- No permitir acceso directo por URL a pacientes no vinculados.

Paso 5 - Estado vacio:

- Mostrar mensaje: "Todavia no has atendido pacientes".

Paso 6 - Pruebas:

- Profesional con pacientes, sin pacientes y acceso indebido.

### CUD09 - Ver ficha de salud del paciente

Paso 1 - Definir campos clinicos visibles:

- Estatura, peso, nivel de actividad, alergias, patologias, objetivo.

Paso 2 - Definir regla de acceso (RNF08):

- Solo profesional con vinculo valido por turnos.

Paso 3 - Definir trazabilidad:

- Auditar quien accede, a que ficha y cuando.

Paso 4 - Definir manejo de ausencia de ficha:

- Mensaje claro para el profesional cuando el socio no tiene datos cargados.

Paso 5 - Definir forma de visualizacion:

- Solo lectura en esta etapa (sin edicion desde profesional).

Paso 6 - Pruebas:

- Acceso permitido, acceso denegado y ficha inexistente.

### CUD10 - Ver historial de consultas del paciente

Paso 1 - Definir fuente de historial:

- Turnos finalizados + observaciones + adjuntos del profesional/socio.

Paso 2 - Definir orden y estructura:

- Orden cronologico descendente (mas reciente primero).
- Cada item muestra fecha/hora, tipo, notas y adjuntos.

Paso 3 - Definir autorizacion:

- Solo historial del paciente vinculado con el profesional actual.

Paso 4 - Definir comportamiento sin datos:

- Mensaje: "No se registran consultas previas con este paciente".

Paso 5 - Definir adjuntos permitidos:

- Tipos de archivo permitidos y politica de descarga segura.

Paso 6 - Pruebas:

- Historial con multiples registros, sin registros y con adjuntos.

### CUD11 - Configurar Horario de Atencion

Paso 1 - Definir modelo de disponibilidad:

- Dias habilitados por semana.
- Rango horario por dia.
- Duracion estandar del turno.

Paso 2 - Definir validaciones fuertes:

- Al menos un dia configurado.
- Rango inicio < fin.
- Sin solapamientos.

Paso 3 - Generar slots:

- Crear bloques de agenda segun configuracion.
- No crear bloques sobre horarios ya ocupados.

Paso 4 - Cambiar estado de profesional:

- Al guardar configuracion valida, pasar a activo (si la regla aplica).

Paso 5 - Definir feedback de error:

- Mensajes claros para configuracion invalida.

Paso 6 - Pruebas:

- Configuracion valida, invalida y actualizacion de horarios existentes.

### CUD12 - Asignar Turno a Paciente

Paso 1 - Definir busqueda de socio:

- Por nombre o DNI con coincidencia parcial.

Paso 2 - Definir seleccion de fecha/hora:

- Mostrar horarios disponibles y no disponibles.
- Evitar fechas pasadas.

Paso 3 - Definir reglas de reserva:

- Sin superposicion para el profesional.
- Respetar duracion de slot configurada.

Paso 4 - Crear turno:

- Estado inicial PENDIENTE.
- Asociar socio, profesional, fecha/hora, origen manual.

Paso 5 - Notificar al socio (RF26.3):

- Enviar notificacion interna con detalle del turno asignado.

Paso 6 - Pruebas:

- Asignacion exitosa, sin disponibilidad y conflictos de concurrencia.

### CUD21 - Registrar asistencia del socio al turno

Paso 1 - Definir condicion de elegibilidad:

- Turno en estado CONFIRMADO.
- Turno ya transcurrido (fecha/hora alcanzada).

Paso 2 - Definir accion del profesional:

- Marcar "Asistio" o "No asistio".

Paso 3 - Definir transiciones de estado:

- Asistio -> REALIZADO.
- No asistio -> AUSENTE.

Paso 4 - Definir bloqueos:

- No permitir doble registro.
- No permitir sobre turnos CANCELADO/REALIZADO/AUSENTE.

Paso 5 - Definir auditoria:

- Registrar usuario, timestamp y estado previo/nuevo.

Paso 6 - Pruebas:

- Casos positivos de ambas transiciones y casos bloqueados.

## 15) Orden recomendado de ejecucion real

Para minimizar bloqueos entre CU:

1. CUD11 (base de disponibilidad).
2. CUD06 (contenedor funcional).
3. CUD07 (operacion diaria).
4. CUD08 (base de pacientes).
5. CUD09 + CUD10 (contexto clinico).
6. CUD12 (asignacion manual).
7. CUD21 (cierre operativo del turno).

## 16) Checklist final antes de dar cada CU por terminado

- Cumple flujo principal y alternativos del CU.
- Respeta reglas de negocio de roles y estados.
- Tiene mensajes de error/estado vacio claros.
- Tiene pruebas unitarias e integracion del caso.
- Queda trazabilidad en auditoria para acciones sensibles.
