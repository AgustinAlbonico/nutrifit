# NutriFit Supervisor (MFS) — Resumen, Requisitos y Casos de Uso

**Autor del documento:** Albónico, Agustín  
**Fecha del documento:** 30/06/2025

## 1. Resumen del proyecto

### 1.1 En una frase
- NutriFit Supervisor es una plataforma web orientada a gimnasios que buscan incorporar servicios profesionales de salud de manera digital y centralizada. El proyecto se enfoca en permitir que nutricionistas y deportólogos —como prestadores externos— puedan ser integrados al sistema y brindar atención personalizada a los socios, generando planes alimentarios o indicaciones clínicas basadas en sus objetivos y rutinas de entrenamiento.

### 1.2 Resumen (texto del documento)

> NutriFit Supervisor es una plataforma web orientada a gimnasios que buscan incorporar servicios profesionales de salud de manera digital y centralizada. El proyecto se enfoca en permitir que nutricionistas y deportólogos —como prestadores externos— puedan ser integrados al sistema y brindar atención personalizada a los socios, generando planes alimentarios o indicaciones clínicas basadas en sus objetivos y rutinas de entrenamiento.
> El sistema está desarrollado bajo un enfoque B2B, pensado para ser utilizado por gimnasios que deseen profesionalizar su servicio, mejorar la coordinación interdisciplinaria y ofrecer a sus socios una experiencia más completa. La solución se implementa como una aplicación web moderna, con tecnologías actuales y buenas prácticas de desarrollo, priorizando escalabilidad, seguridad y facilidad de uso. Este proyecto representa un paso hacia la digitalización del ecosistema fitness, integrando entrenamiento, salud y bienestar en una misma plataforma.

### 1.3 Descripción del proyecto (texto del documento)

> NutriFit Supervisor es un sistema web desarrollado para modernizar la gestión integral de gimnasios de Rosario que buscan brindar una experiencia completa y personalizada a sus socios. Está diseñado para funcionar desde cualquier dispositivo con conexión a Internet, sin necesidad de instalar aplicaciones, y adaptado específicamente a las necesidades de gimnasios que deseen incorporar servicios de salud integrados, como nutricionistas o médicos del deporte.
> El sistema permite que cada socio acceda a su espacio personalizado, donde puede consultar sus rutinas diarias, visualizar planes alimentarios creados por profesionales, reservar turnos, contratar especialistas y realizar un seguimiento de su progreso físico en forma clara y estructurada. El gimnasio, como cliente principal del sistema, centraliza así todos los servicios en una única plataforma digital.
> Entrenadores, nutricionistas y deportólogos pueden acceder a los perfiles de sus pacientes, crear y actualizar rutinas, cargar observaciones clínicas o planes alimentarios, y colaborar entre sí desde un entorno interdisciplinario. Además, los socios pueden contratar directamente estos servicios profesionales desde su cuenta, seleccionando turnos disponibles y realizando consultas desde el sistema.
> Una característica central del proyecto es la integración de inteligencia artificial, que analiza el historial, preferencias, restricciones, y objetivos del socio para generar recomendaciones automáticas de rutinas, planes nutricionales y horarios sugeridos. Este motor actúa como asistente estratégico para el equipo profesional, mejorando la calidad de las decisiones y reduciendo la carga operativa diaria.
> NutriFit Supervisor apunta a convertirse en la plataforma digital de referencia para gimnasios que deseen ofrecer una experiencia profesional, ágil y conectada con el ecosistema de la salud, posicionándose como solución integral y moderna en el creciente mercado del fitness en Rosario y sus alrededores.

### 1.4 Alcance (según documento)

- Durante las reuniones iniciales con propietarios de gimnasios y profesionales del área de la salud involucrados en el sector (nutricionistas, deportólogos, entrenadores), se identificaron los aspectos clave que dieron origen a los requerimientos funcionales y no funcionales del módulo interdisciplinario del sistema NutriFit Supervisor.
- Los dueños de los gimnasios destacaron el valor de incorporar servicios de salud directamente dentro de su propuesta, permitiendo a los socios acceder a nutricionistas y médicos del deporte desde la misma plataforma. Subrayaron la necesidad de contar con una herramienta centralizada que permita administrar estos profesionales externos, organizar turnos, visualizar estadísticas de uso y ofrecer un servicio diferenciado que fidelice a sus clientes.
- Los nutricionistas y deportólogos manifestaron la necesidad de trabajar dentro de un entorno digital estructurado, con la posibilidad de registrar planes alimentarios, realizar observaciones clínicas, acceder a la evolución del paciente y compartir información con entrenadores para asegurar un abordaje integral. También plantearon que el sistema debería permitir mantener una relación directa con cada socio, facilitando el seguimiento personalizado a través de agendas digitales, historiales clínicos y alertas automáticas.
- Desde el rol técnico, se destacó la importancia de contar con un módulo de inteligencia artificial que complemente la labor profesional, generando sugerencias automáticas de planes alimentarios o recomendaciones según los objetivos, restricciones y preferencias del socio. Este asistente virtual, si bien no reemplaza la intervención humana, permite anticipar acciones, detectar desvíos en el progreso y agilizar el trabajo interdisciplinario.
- En cuanto a la experiencia del socio, se estableció que el sistema debe permitir el ingreso con credenciales personales, la visualización de perfiles profesionales disponibles, la reserva de turnos, la lectura de sus planes alimentarios vigentes, el seguimiento de su evolución y el acceso a recomendaciones generadas por IA. También se acordó que cada socio contará con un perfil personal único, desde el cual podrá revisar su historial clínico, cancelar o reprogramar citas y valorar la atención recibida.
- Se concluyó que este módulo del sistema debe desarrollarse como parte de una aplicación web adaptable a distintos dispositivos, con un alto nivel de usabilidad, medidas estrictas de seguridad, segmentación de permisos por rol profesional y respaldo automático de la información médica. También se definió que el enfoque estará centrado en el bienestar del socio, priorizando la asistencia interdisciplinaria y evitando la inclusión de funciones no relacionadas, como gestiones contables o financieras.
#### Alcance
- Este proyecto comprende el diseño, desarrollo e integración de un módulo especializado dentro de la plataforma NutriFit Supervisor, orientado a la gestión y coordinación de servicios profesionales de salud (nutricionistas y deportólogos) dentro del ecosistema de un gimnasio. El sistema se propone como una solución destinada a gimnasios que deseen ampliar su propuesta de valor, facilitando a sus socios la contratación directa de profesionales de la salud desde un entorno digital unificado.
#### Inclusiones
#### Asignación de Profesional al Socio
- Aunque el sistema incluye una sección desde donde el socio puede seleccionar un profesional de la salud (como nutricionista o deportólogo), la lógica específica de vinculación, control de disponibilidad, validaciones de cupos y asignación formal del profesional al perfil del socio se encuentra implementada en un módulo paralelo, desarrollado por otro responsable del proyecto. Esta funcionalidad no está a cargo del presente módulo.
#### Gestión de Profesionales
- El asistente podrá registrar, modificar y eliminar perfiles de profesionales de la salud, como nutricionistas o deportólogos, asignándoles una cuenta con credenciales para acceder al sistema. Cada profesional contará con una ficha que incluirá datos personales, especialidad, horarios de atención y observaciones relevantes. Una vez creado su perfil, el profesional podrá ingresar a la plataforma web con su cuenta y acceder a las funciones que le correspondan, como la carga y actualización de planes alimentarios, el registro de observaciones clínicas y la consulta de la rutina del socio. Esta funcionalidad garantiza que los profesionales trabajen de forma integrada con el equipo del gimnasio y mantengan un seguimiento interdisciplinario continuo de cada socio.
#### Seguimiento Nutricional
- Los profesionales de la salud podrán cargar planes alimentarios y observaciones para cada socio. Esta información estará disponible para el socio y para los entrenadores que deban coordinar la planificación física con la nutricional.
#### Visualización por parte del socio
- Cada socio podrá consultar los planes alimentarios activos, las observaciones realizadas por profesionales y su historial clínico desde su perfil.
#### Visualización parcial por parte del entrenador
- Los entrenadores podrán ver (sin modificar) las observaciones y planes registrados por nutricionistas o deportólogos, con el fin de coordinar la planificación física con la alimentaria o clínica.
#### Módulo de inteligencia artificial
- Se integrará una IA capaz de sugerir planes alimentarios preliminares o recomendaciones básicas, en función de los objetivos, restricciones y evolución del socio. Las sugerencias serán siempre revisables y editables por el profesional humano.
#### Notificaciones automáticas
- Notificaciones internas para avisar al profesional y al socio sobre cargas de observaciones, sugerencias nuevas o seguimientos pendientes.
#### Panel de control administrativo
- Para ver estadísticas de uso, consultas realizadas y profesionales activos.
#### Exclusiones
- Gestión de Turnos
- Los socios podrán reservar, cancelar y consultar turnos a través de la página web. El sistema mostrará entrenadores disponibles, cupos por franja horaria y enviará notificaciones por correo electrónico. Se validará automáticamente que cada socio tenga la cuota al día y que no reserve múltiples turnos en un mismo día.
- Gestión de Rutinas de Entrenamiento
- Los entrenadores podrán asignar y modificar rutinas diferenciadas por día para cada socio, organizadas por tipo (calentamiento, entrenamiento, estiramiento). Además, podrán consultar el historial de cada socio y adaptar los entrenamientos según su progreso.
- Gestión del Gimnasio
- El dueño podrá administrar toda la información crítica del gimnasio, incluyendo máquinas, ejercicios, equipamiento, horarios, empleados y planes. También podrá definir cupos máximos por franja horaria, asignar entrenadores y profesionales a distintos turnos, y configurar condiciones generales del sistema.
#### Procesamiento de pagos
#### Entre socio y profesional (queda fuera del alcance funcional).
#### Mensajería externa (WhatsApp, SMS) o consultas sincrónicas integradas.
#### Registro contable, facturación o gestión de impuestos de los servicios contratados.

## 2. Requisitos funcionales (RF)

### 2.1 Lista RF (texto del documento)

#### Gestión de Profesionales (Asistente)
- RF01 – El sistema debe permitir al asistente registrar nuevos profesionales.
- RF02 – El sistema debe permitir modificar los datos de un profesional existente.
- RF03 – El sistema debe permitir desactivar o eliminar un profesional.
- RF04 – El sistema debe mostrar un listado de todos los profesionales registrados.
- RF05 – El sistema debe permitir asignar una o más especialidades a cada profesional (ej: nutricionista, deportólogo).
- RF06 – El sistema debe permitir configurar los horarios de atención de cada profesional.
#### Gestión de Turnos (Socio)
- RF07 – El sistema debe permitir al socio visualizar el perfil y la disponibilidad de los profesionales.
- RF08 – El sistema debe permitir al socio solicitar un turno con el profesional seleccionado.
- RF09 – El sistema debe permitir al socio cancelar un turno reservado.
- RF10 – El sistema debe permitir al socio reprogramar un turno previamente reservado.
- RF11 – El sistema debe mostrar al socio el listado de sus turnos reservados, pasados y futuros.
- RF12 – El sistema debe mostrar los detalles del profesional antes de reservar (nombre, especialidad, presentación, horarios).
- RF13 – El sistema debe requerir que el socio complete su ficha de salud solo la primera vez que solicita un turno con un especialista.
#### Ficha de Salud del Socio
- RF14 – El sistema debe permitir al socio completar su ficha de salud con los siguientes datos:   a. Estatura   b. Peso actual   c. Nivel de actividad física   d. Alergias o patologías   e. Objetivo personal
- RF15 – El sistema debe permitir al socio modificar su ficha de salud luego de haberla completado.
- RF16 – El sistema debe mostrar al profesional la ficha de salud del socio en cada turno.
#### Gestión de Turnos del Día (Profesional)
- RF17 – El sistema debe permitir al profesional visualizar todos sus turnos del día.
- RF18 – El sistema debe permitir al profesional filtrar los turnos por socio, horario u objetivo.
- RF19 – El sistema debe permitir al profesional acceder a la ficha de salud del socio antes de la sesión.
#### Atención y Seguimiento (Profesional)
- RF20 – El sistema debe permitir al profesional registrar observaciones sobre el turno realizado.
- RF21 – El sistema debe permitir registrar indicadores físicos del socio (peso, IMC, medidas, etc.).
- RF22 – El sistema debe guardar el historial de turnos y observaciones del profesional por socio.
#### Visualización del Progreso (Socio)
- RF23 – El sistema debe mostrar al socio su historial de turnos con cada profesional.
- RF24 – El sistema debe mostrar gráficamente su evolución física (peso, IMC u otros datos registrados).
- RF25 – El sistema debe permitir visualizar los documentos o recomendaciones cargadas por el profesional.
- RF26 – El sistema tiene que enviar notificaciones.

### 2.2 Detalle granular por requisito (criterios/acciones)

#### RF01 – El sistema debe permitir al asistente registrar nuevos profesionales.
- **RF01.1** Ofrecer dentro del módulo **“Gestionar profesionales”** la acción **“Registrar profesional”** (CUD02).
- **RF01.2** Proveer un formulario de alta que permita cargar datos del profesional: nombre, apellido, DNI, email, especialidad, género, fecha de nacimiento, dirección, matrícula, años de experiencia, formación académica, certificaciones, tarifa por sesión, diploma y matrícula profesional (CUD02).
- **RF01.3** Validar que **todos los campos requeridos** estén completos antes de confirmar el registro (CUD02).
- **RF01.4** Validar **unicidad** de DNI y correo electrónico en la base de datos (CUD02).
- **RF01.5** Validar formato de correo y teléfono (si aplica) antes de persistir (CUD02).
- **RF01.6** Generar automáticamente una **contraseña provisional** de 12 caracteres con al menos 1 mayúscula, 1 minúscula, 1 número y 1 símbolo (CUD02).
- **RF01.7** Asociar la contraseña provisional al profesional y almacenarla **encriptada** (hash + salt) (CUD02, RNF06).
- **RF01.8** Crear el perfil con estado **“Pendiente de configuración”** (según flujo) y/o **“Activo”** (según post-condiciones) (CUD02).
- **RF01.9** Mostrar confirmación de éxito: “Profesional registrado exitosamente. Se envió un correo con las credenciales.” (CUD02).
- **RF01.10** Enviar un correo al profesional con usuario y contraseña provisional (si el envío se realiza correctamente) (CUD02).
- **RF01.11** Manejar el caso de duplicados (documento/correo ya registrado) informando el error y permitiendo corrección (CUD02).
- **RF01.12** Manejar campos incompletos/ inválidos resaltando errores y permitiendo corrección (CUD02).

#### RF02 – El sistema debe permitir modificar los datos de un profesional existente.
- **RF02.1** Permitir seleccionar un profesional desde el listado o buscarlo por DNI o nombre (CUD03).
- **RF02.2** Mostrar un formulario con los datos actuales del profesional para edición (CUD03).
- **RF02.3** Permitir modificar los campos necesarios (datos personales, contacto, credenciales u otros) (CUD03).
- **RF02.4** Validar formatos de campos (por ejemplo, teléfono numérico) antes de guardar (CUD03).
- **RF02.5** Persistir los cambios y confirmar: “Datos del profesional actualizados exitosamente.” (CUD03).
- **RF02.6** Resaltar campos inválidos y permitir corregirlos antes de continuar (CUD03).

#### RF03 – El sistema debe permitir desactivar o eliminar un profesional.
- **RF03.1** Permitir seleccionar un profesional desde el listado o buscarlo por DNI o nombre (CUD04).
- **RF03.2** Mostrar datos del profesional antes de ejecutar la acción de suspensión/desactivación (CUD04).
- **RF03.3** Requerir confirmación explícita de desactivación/suspensión (CUD04).
- **RF03.4** Detectar si el profesional tiene **turnos futuros** asignados (CUD04).
- **RF03.5** Bloquear la suspensión si hay turnos pendientes y exigir cancelación o reasignación (CUD04).
- **RF03.6** Al suspender, actualizar el estado del profesional a **“Suspendido”** (CUD04).
- **RF03.7** Impedir inicio de sesión del profesional suspendido y la recepción de nuevos turnos (CUD04).
- **RF03.8** Notificar a los socios si sus turnos fueron cancelados (cuando aplique) (CUD04, RF26).

#### RF04 – El sistema debe mostrar un listado de todos los profesionales registrados.
- **RF04.1** Proveer una vista/listado de profesionales registrados en el sistema (CUD05).
- **RF04.2** Mostrar una tabla con columnas: nombre, apellido, especialidad, estado y acciones (editar, desactivar/suspender) (CUD05).
- **RF04.3** Permitir filtrar por especialidad (nutricionista/deportólogo) (CUD05).
- **RF04.4** Permitir filtrar por estado (activo/suspendido) (CUD05).
- **RF04.5** Permitir buscar por nombre (búsqueda parcial) (CUD05).
- **RF04.6** Aplicar filtros y actualizar la tabla con los resultados (CUD05).
- **RF04.7** Mostrar mensaje de “No se encontraron profesionales...” cuando no haya coincidencias (CUD05).
- **RF04.8** Permitir desde el listado iniciar acciones “Editar” (CUD03) o “Suspender” (CUD04) (CUD05).

#### RF05 – El sistema debe permitir asignar una o más especialidades a cada profesional (ej: nutricionista, deportólogo).
- **RF05.1** Permitir asignar una o más especialidades por profesional (nutricionista, deportólogo, etc.) (RF05).
- **RF05.2** Incluir la especialidad como dato registrable en el alta de profesional (CUD02).
- **RF05.3** Mostrar la especialidad en listados de profesionales (CUD05) y en la búsqueda de profesionales para socios (CUD13).
- **RF05.4** Permitir filtrar por especialidad en listados (CUD05, CUD13).
- **RF05.5** Restringir la visibilidad a socios a profesionales con estado **Activo** (Reglas de negocio: Socio / Administración de profesionales).

#### RF06 – El sistema debe permitir configurar los horarios de atención de cada profesional.
- **RF06.1** Permitir al profesional acceder a **“Configuración de agenda”** (CUD11).
- **RF06.2** Permitir seleccionar días disponibles (CUD11).
- **RF06.3** Permitir definir rango horario por cada día (CUD11).
- **RF06.4** Permitir establecer duración estándar por turno (por ejemplo, 30 min) (CUD11; Reglas de negocio: Turnos).
- **RF06.5** Validar que se configure al menos un día y un rango horario válido (CUD11).
- **RF06.6** Guardar la configuración de disponibilidad (CUD11).
- **RF06.7** Crear bloques/slots de turnos disponibles en la agenda en base a la configuración (CUD11).
- **RF06.8** Cambiar el estado del profesional a “activo” al finalizar la configuración (CUD11).
- **RF06.9** Evitar superposición de turnos para el mismo profesional (Reglas de negocio: Turnos).
- **RF06.10** No permitir agendar turnos en horarios ocupados (Reglas de negocio: Profesional).

#### RF07 – El sistema debe permitir al socio visualizar el perfil y la disponibilidad de los profesionales.
- **RF07.1** Permitir al socio acceder a “Buscar profesionales” y ver profesionales activos (CUD13).
- **RF07.2** Mostrar la lista completa de profesionales activos (CUD13).
- **RF07.3** Permitir filtrar por especialidad y por nombre (CUD13).
- **RF07.4** Permitir acceder al perfil completo del profesional (CUD15).
- **RF07.5** Mostrar información de perfil: datos básicos, especialidad, biografía, opiniones y calificaciones (CUD15).
- **RF07.6** Permitir visualizar agenda/disponibilidad del profesional para iniciar una reserva (CUD14).

#### RF08 – El sistema debe permitir al socio solicitar un turno con el profesional seleccionado.
- **RF08.1** Permitir al socio iniciar la reserva desde la ficha/agenda de un profesional (CUD14).
- **RF08.2** Mostrar agenda del profesional y permitir elegir fecha (CUD14).
- **RF08.3** Mostrar horarios disponibles y horarios ya reservados (no seleccionables) (CUD14).
- **RF08.4** Requerir completar ficha de salud si es el primer turno (CUD14, CUD16).
- **RF08.5** Confirmar la reserva y registrar el turno en el sistema (CUD14).
- **RF08.6** Notificar al profesional y al socio cuando el turno queda registrado (CUD14, RF26).
- **RF08.7** Ofrecer días alternativos cuando no haya turnos disponibles (CUD14).
- **RF08.8** Evitar reservar turnos en fechas pasadas y evitar más de un turno con el mismo profesional en el mismo día (Reglas de negocio: Turnos / Socio).

#### RF09 – El sistema debe permitir al socio cancelar un turno reservado.
- **RF09.1** Permitir al socio cancelar un turno reservado (CUD19).
- **RF09.2** Restringir cancelación a turnos en estado “pendiente” (CUD19).
- **RF09.3** Requerir confirmación en un cuadro de diálogo antes de cancelar (CUD19).
- **RF09.4** Actualizar el estado del turno a “CANCELADO” (CUD19).
- **RF09.5** Liberar el horario en la agenda del profesional tras la cancelación (CUD19; Reglas de negocio: Turnos).
- **RF09.6** Notificar al profesional de la cancelación (CUD19, RF26).
- **RF09.7** Bloquear cancelación de turnos en curso o finalizados (CUD19).
- **RF09.8** Aplicar regla de 24h mínima para cancelar/reprogramar (Reglas de negocio: Socio).

#### RF10 – El sistema debe permitir al socio reprogramar un turno previamente reservado.
- **RF10.1** Permitir al socio reprogramar un turno reservado (CUD18).
- **RF10.2** Restringir reprogramación a turnos en estado “pendiente” (CUD18).
- **RF10.3** Consultar disponibilidad alternativa del profesional (CUD18).
- **RF10.4** Mostrar calendario con fechas y horarios disponibles (CUD18).
- **RF10.5** Requerir selección de nueva fecha y hora antes de confirmar (CUD18).
- **RF10.6** Actualizar el turno con la nueva información y cambiar estado a “REPROGRAMADO” (CUD18).
- **RF10.7** Notificar al profesional de la modificación (CUD18, RF26).
- **RF10.8** Mostrar confirmación al socio: “Tu turno fue reprogramado con éxito” (CUD18).
- **RF10.9** Informar cuando no existan horarios alternativos disponibles (CUD18).
- **RF10.10** Aplicar regla de 24h mínima para cancelar/reprogramar (Reglas de negocio: Socio).

#### RF11 – El sistema debe mostrar al socio el listado de sus turnos reservados, pasados y futuros.
- **RF11.1** Permitir al socio ver una lista de turnos reservados en estados “Confirmado” o “Pendiente” (CUD17).
- **RF11.2** Mostrar tabla con columnas: Fecha, Hora, Profesional (Nombre y Apellido), Especialidad y Acciones (CUD17).
- **RF11.3** Incluir acciones por turno: “Cancelar reserva” y “Reprogramar reserva” (CUD17).
- **RF11.4** Permitir filtrar la lista por fecha (rango), profesional, especialidad y estado (CUD17).
- **RF11.5** Actualizar resultados al aplicar filtros (CUD17).
- **RF11.6** Mostrar mensaje “Sin turnos reservados.” cuando corresponda (CUD17).
- **RF11.7** Ofrecer acción “Reservar nuevo turno” redirigiendo a búsqueda de profesionales (CUD17).

#### RF12 – El sistema debe mostrar los detalles del profesional antes de reservar (nombre, especialidad, presentación, horarios).
- **RF12.1** Antes de reservar, permitir ver detalles del profesional (CUD15).
- **RF12.2** Mostrar nombre, especialidad, presentación/biografía, horarios y opiniones/calificaciones (CUD15).
- **RF12.3** Disponibilizar desde la lista botones “Ver perfil” y “Reservar turno” (CUD13).

#### RF13 – El sistema debe requerir que el socio complete su ficha de salud solo la primera vez que solicita un turno con un especialista.
- **RF13.1** Detectar si el socio no tiene ficha de salud cargada al iniciar su primera reserva (CUD16).
- **RF13.2** Solicitar completar ficha de salud únicamente la primera vez (RF13, CUD16).
- **RF13.3** Bloquear la continuación del flujo de reserva hasta completar los datos requeridos (CUD16).

#### RF14 – El sistema debe permitir al socio completar su ficha de salud con los siguientes datos:   a. Estatura   b. Peso actual   c. Nivel de actividad física   d. Alergias o patologías   e. Objetivo personal
- **RF14.1** Mostrar un formulario de ficha de salud con campos: estatura, peso actual, nivel de actividad física, alergias, patologías/condiciones médicas y objetivo personal (CUD16, RF14).
- **RF14.2** Permitir completar y guardar la ficha de salud (CUD16).
- **RF14.3** Validar campos requeridos antes de guardar (CUD16).
- **RF14.4** Persistir la ficha de salud y marcarla como registrada para el socio (CUD16).
- **RF14.5** Restringir visibilidad de la ficha de salud al profesional asignado (Reglas de negocio: Socio / Seguridad).

#### RF15 – El sistema debe permitir al socio modificar su ficha de salud luego de haberla completado.
- **RF15.1** Permitir al socio **modificar** su ficha de salud luego de haberla completado (RF15).
- **RF15.2** Exponer una acción de edición desde el perfil del socio o desde la sección de salud (RF15).
- **RF15.3** Validar campos con las mismas reglas del alta (completitud/formato) (RF15).
- **RF15.4** Persistir cambios manteniendo integridad del historial clínico (RNF21).

#### RF16 – El sistema debe mostrar al profesional la ficha de salud del socio en cada turno.
- **RF16.1** Permitir al profesional acceder a la ficha de salud del socio desde un turno o desde el historial de un paciente (CUD09).
- **RF16.2** Mostrar datos clínicos: peso, altura, nivel de actividad física, alergias, patologías y objetivo (CUD09).
- **RF16.3** Restringir acceso a fichas de salud únicamente a socios con turnos asignados o históricos con el profesional (CUD09; RNF08; Reglas de negocio: Profesional).

#### RF17 – El sistema debe permitir al profesional visualizar todos sus turnos del día.
- **RF17.1** Permitir al profesional visualizar sus turnos del día en “Mi Agenda” (CUD07).
- **RF17.2** Mostrar automáticamente turnos del día actual con estado “CONFIRMADO” (CUD07).
- **RF17.3** Incluir por turno: nombre del socio, horario, tipo de consulta y estado (CUD07).
- **RF17.4** Permitir acceder desde la agenda a la ficha del paciente o a iniciar la atención (CUD07).
- **RF17.5** Mostrar mensaje cuando no existan turnos asignados para hoy (CUD07).

#### RF18 – El sistema debe permitir al profesional filtrar los turnos por socio, horario u objetivo.
- **RF18.1** Permitir filtrar turnos por socio, horario u objetivo (RF18).
- **RF18.2** Exponer controles de filtro en la vista de agenda/listado de turnos (RF18).
- **RF18.3** Actualizar resultados al aplicar filtros sin perder el estado de la vista (RF18).
- **RF18.4** Validar combinaciones de filtros y mostrar mensaje si no hay resultados (RF18).

#### RF19 – El sistema debe permitir al profesional acceder a la ficha de salud del socio antes de la sesión.
- **RF19.1** Permitir al profesional acceder a la ficha de salud del socio **antes** de la sesión (RF19).
- **RF19.2** Ofrecer acceso directo desde la vista de turnos del día (CUD07) o desde pacientes (CUD08) hacia ficha de salud (CUD09).

#### RF20 – El sistema debe permitir al profesional registrar observaciones sobre el turno realizado.
- **RF20.1** Permitir al profesional registrar observaciones del turno realizado (RF20).
- **RF20.2** Asociar observaciones a una sesión/turno y al socio correspondiente (RF20).
- **RF20.3** Incluir las observaciones dentro del historial de consultas del paciente (CUD10).
- **RF20.4** Restringir edición/registro de observaciones a profesionales con relación de turno con el socio (RNF08; Reglas de negocio: Profesional).

#### RF21 – El sistema debe permitir registrar indicadores físicos del socio (peso, IMC, medidas, etc.).
- **RF21.1** Permitir registrar indicadores físicos del socio (peso, IMC, medidas, etc.) (RF21).
- **RF21.2** Asociar indicadores a fechas/sesiones para construir evolución en el tiempo (RF21).
- **RF21.3** Validar consistencia de unidades y rangos razonables (RNF19).

#### RF22 – El sistema debe guardar el historial de turnos y observaciones del profesional por socio.
- **RF22.1** Guardar el historial de turnos y observaciones por socio y por profesional (RF22).
- **RF22.2** Mostrar sesiones en orden cronológico, incluyendo fecha/hora, tipo de consulta, notas y adjuntos (CUD10).
- **RF22.3** Persistir el historial clínico y asegurar integridad en el tiempo (RNF21).

#### RF23 – El sistema debe mostrar al socio su historial de turnos con cada profesional.
- **RF23.1** Permitir al socio ver su historial de turnos con cada profesional (RF23).
- **RF23.2** Incluir turnos pasados y futuros y sus estados (RF23; ver modelo de “Mis turnos” CUD17).
- **RF23.3** Restringir visibilidad del historial a la cuenta del socio autenticado (RNF05, RNF07).

#### RF24 – El sistema debe mostrar gráficamente su evolución física (peso, IMC u otros datos registrados).
- **RF24.1** Mostrar gráficamente la evolución física del socio (peso, IMC u otros indicadores) (RF24).
- **RF24.2** Permitir seleccionar el indicador a visualizar (peso/IMC/medidas/otros) (RF24).
- **RF24.3** Permitir seleccionar período (rango de fechas) y recalcular la visualización (RF24).

#### RF25 – El sistema debe permitir visualizar los documentos o recomendaciones cargadas por el profesional.
- **RF25.1** Permitir visualizar documentos o recomendaciones cargadas por el profesional (RF25).
- **RF25.2** Soportar adjuntos como PDF e imágenes asociados a consultas/sesiones (CUD10).
- **RF25.3** Restringir acceso a documentos a los actores autorizados (socio/profesional según relación) (RNF07, RNF08).

#### RF26 – El sistema tiene que enviar notificaciones.
- **RF26.1** Enviar notificaciones internas por eventos relevantes (RF26).
- **RF26.2** Notificar al profesional y al socio al registrar un turno (CUD14).
- **RF26.3** Notificar al socio cuando un turno sea asignado manualmente por el profesional (CUD12).
- **RF26.4** Notificar al profesional ante reprogramación o cancelación (CUD18, CUD19).
- **RF26.5** Notificar al socio sobre turnos del día y permitir confirmar asistencia mediante un enlace (CUD20).
- **RF26.6** Notificar a socios si un profesional suspendido afecta sus turnos (CUD04).

### 2.3 Reglas de negocio (texto del documento)

#### 🔐 Autenticación y roles
- El sistema debe validar credenciales al inicio de sesión y redirigir al usuario según su rol (socio, profesional, asistente).
- El usuario debe estar en estado activo para iniciar sesión.
- Cada usuario tiene un único rol asignado.
- Las vistas y funciones estarán habilitadas de forma dinámica según el rol.
#### 👤 Socio
- El socio solo puede solicitar turno con profesionales activos.
- El socio no podrá reservar más de un turno con el mismo profesional en el mismo día.
- El socio solo podrá reprogramar o cancelar un turno si faltan al menos 24 h.
- El socio debe confirmar asistencia antes del horario del turno.
- Solo podrá visualizar profesionales activos y sus horarios disponibles.
- Puede cargar o actualizar sus datos de salud de forma voluntaria.
- Los datos de salud cargados son visibles únicamente para el profesional asignado.
#### 👩‍⚕️ Profesional
- Solo los profesionales activos podrán atender turnos.
- El profesional puede definir y modificar su agenda de atención.
- El profesional no podrá agendar turnos en horarios ya ocupados.
- Solo puede acceder a la ficha de pacientes que tienen o tuvieron turnos con él.
- Puede registrar la asistencia o inasistencia del socio solo después de la hora del turno.
- No puede eliminar turnos ya pasados, solo marcarlos como “atendido” o “no asistió”.
- El profesional no puede autogenerarse turnos como paciente.
#### 🧑‍💼 Asistente
- La asistente solo puede registrar, modificar o suspender profesionales.
- No puede acceder a fichas clínicas ni agendar turnos.
- Solo puede operar sobre el módulo de profesionales.
- Al suspender un profesional, todos sus turnos futuros quedan inhabilitados para reserva.
#### 📅 Turnos
- Los turnos tiene los estados: “PENDIENTE”, “CONFIRMADO”, “CANCELADO”, “REPROGRAMADO”, “REALIZADO” O “AUSENTE”.
- No se puede reservar un turno en una fecha ya pasada.
- Los turnos deben tener duración fija definida por el profesional (ej. 30 min).
- No puede haber superposición de turnos para el mismo profesional.
- Si un turno es cancelado, queda liberado automáticamente en la agenda.
- Los turnos deben almacenarse con fecha, hora, socio, profesional y estado.
#### 🗂️ Administración de profesionales
- Solo la asistente puede crear o suspender profesionales.
- Los datos obligatorios de un profesional incluyen: nombre, especialidad, matrícula, disponibilidad.
- No se pueden registrar dos profesionales con el mismo email.
- Solo los profesionales con estado “Activo” pueden figurar en los listados para los socios.
- La suspensión de un profesional es reversible.
#### 🔐 Seguridad y validaciones
- Las contraseñas deben estar encriptadas.
- No se deben mostrar errores específicos en login (evitar fuga de info).
- Todas las acciones deben ser auditables por ID de usuario y timestamp.
- Debe implementarse control de acceso por rol en cada endpoint del backend.
- Se solicita la confirmación de los turnos pendientes, esto se hace mediante el envío de una notificación tres horas previas al turno.
- Iteraciones del Proyecto
- Primera iteracion “Gestión de Profesionales de la Salud”
- Esta primera iteración se centra en la implementación del módulo de gestión de profesionales de la salud dentro del sistema NutriFit Supervisor. El objetivo principal es permitir al asistente del gimnasio registrar perfiles de nutricionistas y médicos del deporte, gestionar su disponibilidad y asignarlos formalmente a los socios según los requerimientos del gimnasio. Esta funcionalidad sienta las bases operativas necesarias para habilitar, en futuras iteraciones, la carga de planes de alimentación, observaciones clínicas y la incorporación de inteligencia artificial para asistencia personalizada.
- Del lado del asistente
- Registrar nuevos profesionales de la salud, completando datos personales, especialidad (nutricionista o deportólogo), horarios de atención y credenciales de acceso.
- Consultar, modificar o eliminar perfiles de profesionales existentes.
- Visualizar el listado completo de profesionales activos, filtrando por especialidad, estado o disponibilidad horaria.
- Del lado del profesional
- Acceder al sistema con su usuario y contraseña, y verificar que su perfil esté correctamente configurado.
- Consultar el listado de socios asignados a su cargo, visualizando únicamente datos generales como nombre, edad, sexo y objetivos básicos.
#### (NOTA: En esta iteración, los profesionales aún no pueden cargar observaciones ni planes alimentarios; solo visualizan su lista de pacientes.)
- Del lado del socio
- Ver qué profesionales hay y reservar un turno con el que desee.
- Ver una lista de sus turnos y poder modificarlos o cancelarlos.
- Esta iteración establece la estructura base para la gestión ordenada y segura de profesionales dentro del sistema, así como la lógica de vinculación con los socios. En la próxima iteración, se incorporará la posibilidad de que los profesionales asignados puedan crear planes alimentarios personalizados y observaciones clínicas. Además, se activará el módulo de inteligencia artificial para generar sugerencias automáticas a partir del perfil, evolución y objetivos del socio.
- Diagrama de Transición de Estados
- Objeto: “Turno”
- Objeto: “Ficha de salud”
- Especificación de requerimientos “Core”

## 3. Requisitos no funcionales (RNF)

### 3.1 Lista RNF (texto del documento)

#### Rendimiento y disponibilidad
- RNF01 – El sistema debe estar disponible al menos el 99% del tiempo (alta disponibilidad).
- RNF02 – El sistema debe permitir al menos 100 usuarios concurrentes sin degradar la experiencia.
- RNF03 – El tiempo de respuesta del sistema no debe superar los 2 segundos en el 95% de las operaciones.
- RNF04 – El sistema debe escalar horizontalmente para soportar más gimnasios y profesionales con el tiempo.
#### Seguridad
- RNF05 – El sistema debe requerir autenticación de usuarios mediante correo electrónico y contraseña segura.
- RNF06 – Las contraseñas deben almacenarse de forma encriptada (hash + salt).
- RNF07 – El sistema debe contar con control de acceso basado en roles (Administrador, Profesional, Socio).
- RNF08 – El profesional solo podrá acceder a las fichas de salud de los socios con los que tenga un turno asignado.
- RNF09 – El sistema debe registrar logs de acceso a datos sensibles para auditoría.
- RNF10 – Toda la información debe transmitirse cifrada a través de HTTPS.
#### Usabilidad
- RNF11 – La interfaz debe ser intuitiva, clara y accesible para usuarios sin conocimientos técnicos.
- RNF12 – El sistema debe estar optimizado para desktop y dispositivos móviles (diseño responsive).
- RNF13 – El sistema debe mostrar mensajes de error claros y sugerencias de acción cuando el usuario cometa un error.
#### Mantenibilidad y escalabilidad
- RNF14 – El sistema debe desarrollarse siguiendo principios de arquitectura modular para permitir futuros módulos.
- RNF15 – El código debe estar documentado y ser entendible para facilitar su mantenimiento.
- RNF16 – Las nuevas funcionalidades deben poder integrarse sin modificar la lógica central del sistema.
#### Portabilidad y compatibilidad
- RNF17 – El sistema debe ser accesible desde los navegadores modernos más utilizados (Chrome, Firefox, Edge, Safari).
- RNF18 – El sistema debe poder ejecutarse en cualquier sistema operativo con navegador (Windows, macOS, Linux).
#### Integridad y consistencia de datos
- RNF19 – El sistema debe validar todos los datos ingresados por el usuario para evitar inconsistencias.
- RNF20 – Ante un corte de sesión o error inesperado, el sistema no debe perder datos críticos ingresados.
- RNF21 – Los datos de turnos, historial clínico y observaciones deben persistir y mantenerse íntegros en el tiempo.
#### Inicio de sesión general(Socio, Profesional o Asistente)
#### Pantallas del Socio
#### Inicio
#### Pantalla profesionales
#### Perfil de un profesional
#### Reseñas de un profesional
#### Sacar turno
#### Carga de datos de salud antes de confirmar turno
#### Confirmación de turno
#### Turnos activos
#### Historico de turnos junto con las observaciones de cada profesional
#### Ver detalles de un turno
#### Pantallas del Profesional
#### Inicio
#### Turnos del día
#### Turnos de la semana
#### Pacientes
#### Ficha de salud de un paciente
#### Mediciones del paciente
#### Configuración de horarios
#### Pacientes de un profesional
#### Ficha de paciente
#### Anotaciones a paciente
#### Carga de documentos para el paciente
#### Consulta para el paciente
#### Asignar turno a un paciente
#### Configuración de horarios del profesional
#### Pantallas Asistente
#### Inicio
#### Registro de profesional
#### Confirmación de profesional registrado
#### Profesionales
#### Pantalla de especialidades
#### Carga de especialidad
#### Análisis de requisitos
#### Modelo de casos de uso
#### Diagrama de casos de uso
#### Casos de uso “Asistente”
#### Casos de uso “Profesional”
#### Casos de uso “Socio”
#### Especificación de casos de uso
#### Caso de uso
#### ID y Nombre
#### CUD01 - Gestionar profesionales
#### Estado
#### Activo
#### Descripción
#### Caso de uso general que agrupa todas las acciones que puede realizar el asistente sobre los profesionales registrados en el sistema, como registrar, modificar, desactivar y visualizar su listado.
#### Actor Principal
#### Asistente
#### Actor Secundario
#### Profesional
#### Pre-Condiciones
#### El asistente debe estar autenticado en el sistema.
#### Punto de extensión
#### Registrar profesional CUD02
#### Modificar profesional CUD03
#### Desactivar profesional CUD04
#### Ver listado de profesionales CUD05
#### Condición
#### Se desea gestionar todo lo relacionado a profesionales desde un módulo centralizado.
#### Escenario Principal
#### El asistente accede al módulo “Gestionar profesionales”.
#### Visualiza el listado y opciones por cada profesional.
#### Desde ahí puede registrar uno nuevo, editarlo, suspenderlo o consultarlo.
#### Flujos Alternativos
#### Post-Condiciones
#### Se centraliza la gestión de profesionales de forma eficiente y ordenada.
#### Caso de uso
#### ID y Nombre
#### CUD02 - Registrar profesional
#### Estado
#### Activo
#### Descripción
#### Permite al asistente registrar un nuevo profesional en el sistema.
#### Actor Principal
#### Asistente
#### Actor Secundario
#### Profesional
#### Pre-Condiciones
#### El asistente debe estar autenticado en el sistema.
#### El profesional no debe estar registrado previamente.
#### Punto de extensión
#### Condición
#### El asistente necesita incorporar un nuevo profesional al sistema.
#### Escenario Principal
#### El asistente accede al módulo “Gestionar profesionales”.
#### Selecciona “Registrar profesional”.
#### Ingresa datos como nombre, apellido, dni, email, especialidad, género, fecha de nacimiento, dirección, número de matrícula, años de experiencia, formación académica, certificaciones, tarifa por sesión, diploma y matrícula profesional.
#### Asistente confirma el registro.
#### El sistema valida los datos:
#### Verifica que todos los campos estén completos.
#### Confirma que el número de documento y correo no existan en la base de datos.
#### Valida el formato de correo y teléfono.
#### El sistema genera automáticamente una contraseña provisional (12 caracteres, con al menos 1 mayúscula, 1 minúscula, 1 número, 1 símbolo).
#### El sistema crea el perfil del profesional en estado “Pendiente de configuración”.
#### El sistema muestra un mensaje: "Profesional registrado exitosamente. Se envió un correo con las credenciales."
#### Flujos Alternativos
#### A5a: Documento o correo ya registrado:
#### El sistema detecta que el número de documento o correo ya existe.
#### Muestra un mensaje: "El documento o correo ya está registrado. Verifique los datos."
#### Permite al asistente corregir los campos y volver al paso 5.
#### A5b: Campos incompletos o inválidos:
#### El sistema detecta campos vacíos o con formato incorrecto (por ejemplo, correo sin "@").
#### Muestra un mensaje: "Complete todos los campos correctamente."
#### Resalta los campos con errores y permite corregirlos, volviendo al paso 3.
#### Post-Condiciones
#### El perfil del profesional está creado en la base de datos con estado "Activo".
#### La contraseña provisional está encriptada y asociada al profesional.
#### El profesional recibe un correo con su usuario y contraseña provisional (si el correo se envió correctamente).
#### Caso de uso
#### ID y Nombre
#### CUD03 - Modificar profesional
#### Estado
#### Activo
#### Descripción
#### El asistente actualiza los datos de un profesional existente, como nombre, contacto o credenciales.
#### Actor Principal
#### Asistente
#### Actor Secundario
#### Profesional
#### Pre-Condiciones
#### El asistente debe estar autenticado en el sistema.
#### El profesional está registrado en el sistema.
#### Punto de extensión
#### Condición
#### Se requiere actualizar datos incorrectos o desactualizados.
#### Escenario Principal
#### Asistente selecciona a profesional de la lista de profesionales o lo busca por dni o nombre.
#### El sistema muestra un formulario con los datos actuales del profesional.
#### El asistente modifica los campos necesarios.
#### El Asistente guarda los cambios.
#### El sistema muestra un mensaje: "Datos del profesional actualizados exitosamente."
#### Flujos Alternativos
#### A4: Campos inválidos:
#### El sistema detecta un formato incorrecto (por ejemplo, teléfono no numérico).
#### Muestra un mensaje: "Corrija los campos inválidos."
#### Resalta los errores y permite corregirlos, volviendo al paso 3.
#### Post-Condiciones
#### Los datos del profesional están actualizados en la base de datos.
#### Caso de uso
#### ID y Nombre
#### CUD04 - Desactivar o suspender profesional
#### Estado
#### Activo
#### Descripción
#### El asistente desactiva el perfil de un profesional, impidiendo que reciba turnos o acceda al sistema.
#### Actor Principal
#### Asistente
#### Actor Secundario
#### Profesional
#### Pre-Condiciones
#### El asistente debe estar autenticado en el sistema.
#### Punto de extensión
#### Condición
#### Se requiere bloquear definitivamente al profesional.
#### Escenario Principal
#### Asistente selecciona a profesional de la lista de profesionales o lo busca por dni o nombre.
#### Sistema muestra datos del profesional.
#### Asistente selecciona y confirma la desactivación del profesional.
#### El sistema muestra un mensaje: "Profesional desactivado/suspendido exitosamente."
#### Flujos Alternativos
#### A3: Turnos pendientes:
#### El sistema detecta turnos futuros asignados al profesional.
#### Muestra un mensaje: "El profesional tiene turnos pendientes. Cancele o reasigne los turnos."
#### Permite al asistente cancelar los turnos o volver al listado.
#### Post-Condiciones
#### El profesional está en estado "Suspendido" en la base de datos.
#### No puede iniciar sesión ni recibir turnos.
#### Los socios reciben notificaciones si sus turnos fueron cancelados (si aplica).
#### Caso de uso
#### ID y Nombre
#### CUD05 - Ver listado de profesionales
#### Estado
#### Activo
#### Descripción
#### El asistente consulta un listado de profesionales registrados, con filtros por especialidad, estado o nombre.
#### Actor Principal
#### Asistente
#### Actor Secundario
#### Pre-Condiciones
#### El asistente debe estar autenticado en el sistema.
#### Existen profesionales registrados en el sistema.
#### Punto de extensión
#### CUD03, CUD04
#### Condición
#### Se desea consultar el estado, datos o historial de profesionales.
#### Escenario Principal
#### Selecciona "Ver listado de profesionales".
#### El sistema muestra una tabla con columnas: nombre, apellido, especialidad, estado, acciones (editar, desactivar/suspender).
#### El asistente aplica filtros:
#### Especialidad: lista desplegable (nutricionista o deportólogo).
#### Estado: lista desplegable (activo o suspendido).
#### Nombre: campo de texto para búsqueda parcial.
#### Asistente hace clic en "Filtrar".
#### El sistema actualiza la tabla con los resultados filtrados.
#### El asistente puede hacer clic en "Editar" (CUD03) o "Suspender" (CUD04) para un profesional.
#### Flujos Alternativos
#### A5: Sin resultados:
#### El sistema no encuentra profesionales que coincidan con los filtros.
#### Muestra un mensaje: "No se encontraron profesionales. Ajuste los filtros."
#### Permite al asistente modificar los filtros y volver al paso 4.
#### Post-Condiciones
#### El asistente visualiza el listado de profesionales filtrado.
#### Caso de uso
#### ID y Nombre
#### CUD06 - Gestionar Agenda
#### Estado
#### Activo
#### Descripción
#### Este caso de uso general permite al profesional acceder a toda la funcionalidad relacionada con su carga de turnos y atención: visualización diaria y semanal, historial de pacientes, ficha médica, anotaciones y configuración horaria.
#### Actor Principal
#### Profesional
#### Actor Secundario
#### Pre-Condiciones
#### El profesional debe estar autenticado en el sistema.
#### Debe tener una agenda activa o turnos programados.
#### Punto de extensión
#### Extiende a CUD-07, CUD-08, CUD-09, CUD-10, CUD-12.
#### Condición
#### El profesional quiere consultar, gestionar o registrar información relacionada con su actividad diaria.
#### Escenario Principal
#### El profesional accede al panel "Mi Agenda".
#### Visualiza los turnos del día actual (CUD-07).
#### Consulta la lista de pacientes que atendió o que tiene asignados (CUD-08).
#### Revisa la ficha clínica de cada paciente antes o después de un turno (CUD-09).
#### Puede registrar observaciones y seguimiento.
#### Tiene acceso a la configuración de horarios (CUD-11).
#### Puede asignar manualmente turnos a un paciente en circunstancias especiales (CUD-12).
#### Flujos Alternativos
#### Post-Condiciones
#### El profesional puede gestionar su agenda integralmente, y todas las acciones quedan registradas en el sistema.
#### Caso de uso
#### ID y Nombre
#### CUD07 - Ver turnos del día.
#### Estado
#### Activo
#### Descripción
#### Permite al profesional visualizar en una lista todos los turnos agendados para el día en curso.
#### Actor Principal
#### Profesional
#### Actor Secundario
#### Pre-Condiciones
#### El profesional debe estar autenticado en el sistema.
#### El profesional debe tener turnos programados para hoy.
#### Punto de extensión
#### Condición
#### El profesional desea conocer su cronograma diario de atención.
#### Escenario Principal
#### El profesional accede a "Mi Agenda".
#### El sistema muestra automáticamente la vista de turnos del día actual que estén con el estado “CONFIRMADO”.
#### Cada turno incluye nombre del socio, horario, tipo de consulta y estado.
#### Desde esta vista, puede acceder a la ficha del paciente o comenzar la atención.
#### Flujos Alternativos
#### Si no hay turnos asignados para hoy, el sistema muestra el mensaje: “No hay turnos asignados para el día de hoy”.
#### Post-Condiciones
#### El profesional conoce en detalle su agenda del día.
#### Caso de uso
#### ID y Nombre
#### CUD08 - Ver pacientes
#### Estado
#### Activo
#### Descripción
#### Permite al profesional acceder a una lista de todos los socios que ha atendido o tiene turnos agendados con él.
#### Actor Principal
#### Profesional
#### Actor Secundario
#### Socio
#### Pre-Condiciones
#### El profesional debe estar autenticado en el sistema.
#### El profesional debe haber tenido al menos un turno con un socio.
#### Punto de extensión
#### CUD10 - Ver ficha de salud del paciente, CUD11 - Ver historial de consultas del paciente, CUD13 - Asignar Turno a Paciente
#### Condición
#### El profesional desea revisar su historial de pacientes.
#### Escenario Principal
#### El profesional accede a "Pacientes" desde su panel.
#### El sistema lista los pacientes con los que tuvo turnos.
#### El sistema muestra botones para acceder a la ficha médica(CUD10 - Ver Ficha de salud del paciente), al historial de consultas(CUD11 - Ver historial de consultas del paciente) o asignar un turno manualmente(CUD13 - Asignar Turno a Paciente).
#### Flujos Alternativos
#### A2: Si no hay pacientes registrados
#### Se muestra: “Todavía no has atendido pacientes. Cuando lo hagas, aparecerán aquí”.
#### Post-Condiciones
#### El profesional accede a su base de pacientes con acceso rápido a su historial.
#### Caso de uso
#### ID y Nombre
#### CUD09 - Ver ficha de salud del paciente
#### Estado
#### Activo
#### Descripción
#### Muestra al profesional los datos clínicos básicos provistos por el socio, como peso, altura, nivel de actividad física, alergias, patologías y objetivo.
#### Actor Principal
#### Profesional
#### Actor Secundario
#### Socio
#### Pre-Condiciones
#### El profesional debe estar autenticado en el sistema.
#### El profesional debe tener al menos un turno con ese socio.
#### El socio debe tener cargada la ficha de salud.
#### Punto de extensión
#### Condición
#### El profesional quiere conocer el contexto clínico del paciente antes de atenderlo.
#### Escenario Principal
#### Desde un turno o desde el historial de un paciente, el profesional hace clic en “Ficha de salud”.
#### El sistema muestra los datos ingresados por el socio.
#### Flujos Alternativos
#### Post-Condiciones
#### El profesional accede a la ficha y puede tomar decisiones informadas.
#### Caso de uso
#### ID y Nombre
#### CUD10 - Ver historial de consultas del paciente
#### Estado
#### Activo
#### Descripción
#### Permite al profesional visualizar todas las sesiones previas realizadas con un socio en orden cronológico, incluyendo fecha, tipo de consulta, notas y archivos adjuntos.
#### Actor Principal
#### Profesional
#### Actor Secundario
#### Socio
#### Pre-Condiciones
#### El profesional debe estar autenticado en el sistema.
#### Debe haber al menos un turno finalizado con el socio.
#### Punto de extensión
#### Condición
#### El profesional desea consultar el historial clínico completo de un socio determinado.
#### Escenario Principal
#### El profesional accede a la sección “Pacientes”.
#### Selecciona un socio específico.
#### Hace clic en “Ver historial de consultas”.
#### El sistema muestra una lista ordenada cronológicamente de las sesiones anteriores con:
#### Fecha y hora
#### Tipo de consulta
#### Notas del profesional
#### Archivos adjuntos (PDF, imágenes)
#### Flujos Alternativos
#### A3: El paciente aún no tiene consultas finalizadas
#### El sistema muestra: “No se registran consultas previas con este paciente.”
#### Post-Condiciones
#### El profesional accede al historial clínico y puede realizar seguimiento longitudinal del paciente.
#### Caso de uso
#### ID y Nombre
#### CUD11 - Configurar Horario de Atención
#### Estado
#### Activo
#### Descripción
#### Permite al profesional definir sus días y horarios de atención, así como la duración de cada consulta.
#### Actor Principal
#### Profesional
#### Actor Secundario
#### Pre-Condiciones
#### El profesional debe estar autenticado en el sistema.
#### Punto de extensión
#### Condición
#### El profesional desea establecer o modificar su disponibilidad horaria.
#### Escenario Principal
#### El profesional accede a la sección "Configuración de agenda".
#### Selecciona los días en los que estará disponible.
#### Define el rango horario para cada día.
#### Establece la duración estándar por turno (ej.: 30 min).
#### Guarda los cambios.
#### Sistema cambia el estado del profesional a “activo”.
#### Flujos Alternativos
#### A4: No se configuran horarios válidos.
#### El sistema muestra una alerta: “Debe seleccionar al menos un día y un rango horario válido”.
#### Post-Condiciones
#### El sistema crea los bloques de turnos disponibles en la agenda.
#### Caso de uso
#### ID y Nombre
#### CUD12 - Asignar Turno a Paciente
#### Estado
#### Activo
#### Descripción
#### Permite al profesional agendar un turno manualmente para un socio que no lo solicitó mediante el sistema (ej.: atención especial, casos urgentes).
#### Actor Principal
#### Profesional
#### Actor Secundario
#### Socio
#### Pre-Condiciones
#### El profesional debe estar autenticado en el sistema.
#### El socio debe estar registrado en el sistema.
#### Debe haber disponibilidad horaria.
#### Punto de extensión
#### Condición
#### El turno es solicitado o coordinado fuera del sistema (ej: por WhatsApp o presencialmente).
#### Escenario Principal
#### El profesional accede a la opción “Asignar turno manual”.
#### Busca al socio por nombre o dni.
#### Profesional selecciona una fecha.
#### Sistema muestra tanto los horarios disponibles como los no disponibles en la fecha seleccionada.
#### Profesional selecciona horario y confirma la acción.
#### Sistema agenda el turno, cambia el estado del turno a “PENDIENTE” y notifica al socio.
#### Flujos Alternativos
#### A3: no hay horarios disponibles.
#### Sistema avisa que no hay horarios disponibles en la fecha seleccionada.
#### Se vuelve al paso 3.
#### Post-Condiciones
#### El turno queda reservado y se notifica al socio correspondiente.
#### Caso de uso
#### ID y Nombre
#### CUD13 - Ver lista de profesionales
#### Estado
#### Activo
#### Descripción
#### Permite al socio explorar la lista completa de profesionales disponibles y aplicar filtros por especialidad, nombre, horario o tipo de consulta para encontrar fácilmente a quien necesita.
#### Actor Principal
#### Socio
#### Actor Secundario
#### Profesional
#### Pre-Condiciones
#### El socio debe estar autenticado en el sistema.
#### Punto de extensión
#### CUD14 - Solicitar turno con profesional, CUD15 - Ver perfil de profesional
#### Condición
#### El socio desea consultar qué profesionales están disponibles para reservar turno.
#### Escenario Principal
#### El socio accede a la sección “Buscar profesionales”.
#### El sistema muestra la lista completa de profesionales activos.
#### El socio puede filtrar por:
#### Especialidad (Nutricionista o Deportólogo)
#### Nombre
#### En cada resultado de la lista hay dos botones:
#### Reservar Turno (CUD15 - Solicitar turno con profesional)
#### Ver Perfil (CUD16 - Ver perfil de profesional)
#### Flujos Alternativos
#### A2: No hay profesionales activos
#### El sistema muestra: “No hay profesionales disponibles en este momento.”
#### Post-Condiciones
#### El socio encuentra al profesional adecuado y puede continuar con la reserva.
#### Caso de uso
#### ID y Nombre
#### CUD14 - Solicitar turno con profesional
#### Estado
#### Activo
#### Descripción
#### Permite al socio iniciar la solicitud de turno directamente desde la ficha de un profesional, accediendo a su agenda específica.
#### Actor Principal
#### Socio
#### Actor Secundario
#### Profesional
#### Pre-Condiciones
#### El socio debe estar autenticado en el sistema.
#### El profesional debe tener horarios disponibles configurados.
#### Punto de extensión
#### CUD17 - Cargar datos de salud
#### Condición
#### El socio desea iniciar una consulta con un profesional.
#### Escenario Principal
#### El sistema muestra la agenda del profesional.
#### El socio elige fecha.
#### El sistema muestra tanto los horarios disponibles como los horarios que ya fueron reservados pero sin poder seleccionarlos.
#### Si es su primer turno, se solicita completar ficha de salud (CUD17 - Cargar datos de salud).
#### El socio confirma la reserva.
#### Flujos Alternativos
#### A2: No hay turnos disponibles
#### El sistema ofrece otros días.
#### Post-Condiciones
#### El turno queda registrado y se notifica al profesional y al socio.
#### Caso de uso
#### ID y Nombre
#### CUD15 - Ver perfil de profesional
#### Estado
#### Activo
#### Descripción
#### Permite al socio acceder al perfil completo de un profesional seleccionado, incluyendo su experiencia, especialidad, tipo de atención, horarios y opiniones de otros socios.
#### Actor Principal
#### Socio
#### Actor Secundario
#### Profesional
#### Pre-Condiciones
#### El asistente debe estar autenticado en el sistema.
#### El profesional debe estar activo.
#### Punto de extensión
#### Condición
#### El socio desea conocer más información antes de reservar un turno.
#### Escenario Principal
#### El socio, desde la lista de profesionales, hace clic en “Ver perfil”.
#### El sistema muestra una vista con:
#### Datos basicos
#### Especialidad
#### Breve biografía profesional
#### Opiniones y calificaciones
#### Flujos Alternativos
#### Post-Condiciones
#### El socio decide si continuar con la reserva.
#### Caso de uso
#### ID y Nombre
#### CUD16 - Cargar datos de salud
#### Estado
#### Activo
#### Descripción
#### Permite al socio ingresar su información personal y médica necesaria antes de reservar su primer turno. Esta información será utilizada por el profesional para brindar una atención personalizada.
#### Actor Principal
#### Socio
#### Actor Secundario
#### Pre-Condiciones
#### El socio debe estar autenticado en el sistema.
#### El socio no debe tener una ficha de salud registrada previamente.
#### Punto de extensión
#### Condición
#### El socio intenta agendar su primer turno con un profesional.
#### Escenario Principal
#### El socio accede al proceso de reserva de turno por primera vez.
#### El sistema detecta que no tiene ficha de salud cargada.
#### Se muestra un formulario con los siguientes campos:
#### Estatura (cm)
#### Peso actual (kg)
#### Nivel de actividad física (sedentario, moderado, intenso)
#### Alergias conocidas
#### Patologías o condiciones médicas
#### Objetivo personal (bajar de peso, aumentar masa, mejorar salud, etc.)
#### El socio completa los campos requeridos.
#### Presiona “Guardar”.
#### El sistema registra la información y continúa con el proceso de reserva.
#### Flujos Alternativos
#### A4: El socio deja campos obligatorios en blanco.
#### El sistema bloquea el envío y muestra: “Debe completar todos los campos obligatorios para continuar”.
#### Post-Condiciones
#### La ficha de salud queda registrada y disponible para los profesionales que atiendan al socio.
#### Caso de uso
#### ID y Nombre
#### CUD17 - Ver turnos reservados
#### Estado
#### Activo
#### Descripción
#### El Socio consulta una lista de sus turnos reservados (en estado "Confirmado" o "Pendiente"), con detalles como fecha, hora, profesional, especialidad, y tipo de consulta. Cada turno muestra botones para cancelar o reprogramar.
#### Actor Principal
#### Socio
#### Actor Secundario
#### Pre-Condiciones
#### El socio debe estar autenticado en el sistema.
#### Tiene al menos un turno reservado.
#### Punto de extensión
#### CUD13 - Ver lista de profesionales, CUD18 - Reprogramar turno, CUD19 - Cancelar turno
#### Condición
#### El socio accede a la sección de sus turnos para revisar o gestionar reservas activas.
#### Escenario Principal
#### Navega al menú principal y selecciona "Mis Turnos".
#### El sistema muestra una tabla con los turnos reservados:
#### Columnas: Fecha, Hora, Profesional (Nombre y Apellido),
#### Especialidad (Nutricionista/Deportólogo),
#### Acciones: Botones "Cancelar reserva" y "Reprogramar reserva" por cada turno.
#### El Socio puede filtrar la lista:
#### Por fecha: calendario (rango de fechas).
#### Por profesional: lista desplegable con nombres.
#### Por especialidad: lista desplegable (Nutricionista, Deportólogo).
#### Por estado: lista desplegable (Confirmado, Pendiente).
#### El Socio selecciona los filtros y hace clic en "Filtrar".
#### El sistema actualiza la tabla según los filtros aplicados.
#### El Socio puede hacer clic en:
#### Flujos Alternativos
#### A4: Sin turnos
#### El socio no tiene turnos activos.
#### Muestra: “Sin turnos reservados.”
#### Ofrece “Reservar nuevo turno” y redirige a CUD14 - Ver lista de profesionales.
#### Post-Condiciones
#### El socio visualiza correctamente sus turnos y puede tomar acciones sobre ellos (cancelar o reprogramar).
#### Caso de uso
#### ID y Nombre
#### CUD18 - Reprogramar turno
#### Estado
#### Activo
#### Descripción
#### Permite al socio modificar la fecha y/u hora de un turno reservado, siempre y cuando el turno esté en estado pendiente y el profesional tenga disponibilidad alternativa.
#### Actor Principal
#### Socio
#### Actor Secundario
#### Pre-Condiciones
#### El socio debe estar autenticado en el sistema.
#### Debe existir al menos un turno reservado en estado pendiente.
#### El profesional asignado al turno debe contar con horarios disponibles para reprogramación.
#### Punto de extensión
#### Condición
#### El socio desea cambiar la fecha u hora de un turno que ya había reservado, por motivos personales u organizativos.
#### Escenario Principal
#### El socio accede a “Mis Turnos” (CUD-44).
#### Selecciona un turno en estado pendiente.
#### Presiona el botón “Reprogramar Turno”.
#### El sistema consulta la disponibilidad del profesional.
#### El sistema muestra un calendario con las fechas y horarios disponibles.
#### El socio elige una nueva fecha y hora.
#### Presiona “Confirmar”.
#### El sistema actualiza el turno con la nueva información y cambia el estado del turno a “REPROGRAMADO”.
#### Se envía una notificación al profesional con la modificación.
#### Se muestra al socio una confirmación: “Tu turno fue reprogramado con éxito”.
#### Flujos Alternativos
#### A4: El profesional no tiene disponibilidad alternativa
#### El sistema muestra: “No hay horarios disponibles para reprogramación con este profesional”.
#### A6: El socio no elige una fecha y hora
#### el sistema bloquea el paso 7 con el mensaje: “Debe seleccionar una nueva fecha y hora para confirmar la reprogramación”.
#### Post-Condiciones
#### El turno queda actualizado en la base de datos con su nueva fecha y hora.
#### Caso de uso
#### ID y Nombre
#### CUD19 - Cancelar turno
#### Estado
#### Activo
#### Descripción
#### Permite al socio cancelar un turno reservado que aún no fue realizado, liberando el horario para otros usuarios.
#### Actor Principal
#### Socio
#### Actor Secundario
#### Pre-Condiciones
#### El socio debe estar autenticado en el sistema.
#### El turno debe encontrarse en estado “pendiente”.
#### Punto de extensión
#### Condición
#### El socio desea cancelar un turno al que no podrá asistir.
#### Escenario Principal
#### El socio accede a “Mis Turnos”.
#### Selecciona el turno que desea cancelar.
#### Presiona el botón “Cancelar” y confirma la acción en un cuadro de diálogo.
#### El sistema actualiza el estado del turno como “CANCELADO”.
#### Se libera el horario en la agenda del profesional.
#### Se envía una notificación al profesional.
#### Flujos Alternativos
#### A2: El turno ya está en curso o finalizado
#### El sistema bloquea la opción y muestra: “No es posible cancelar un turno ya realizado o en curso.”
#### Post-Condiciones
#### El turno queda cancelado y el horario queda liberado para poder ser reservado nuevamente.
#### Caso de uso
#### ID y Nombre
#### CUD20 - Confirmar turno
#### Estado
#### Activo
#### Descripción
#### Permite al socio confirmar su asistencia a un turno reservado el mismo día en que se realiza. Esta acción cambia el estado del turno de “pendiente” a “confirmado” y habilita su realización por parte del profesional.
#### Actor Principal
#### Socio
#### Actor Secundario
#### Pre-Condiciones
#### El socio debe estar autenticado en el sistema.
#### El turno debe encontrarse en estado “pendiente”.
#### El turno debe ser del día actual
#### Punto de extensión
#### Condición
#### El socio desea confirmar que asistirá al turno reservado para el día de hoy.
#### Escenario Principal
#### El sistema notifica al socio sobre su turno del día.
#### El socio accede a la pantalla de confirmación del turno mediante el link notificado.
#### Visualiza el turno del día con estado “Pendiente”.
#### Presiona el botón “Confirmar asistencia”.
#### El sistema actualiza el estado del turno como “CONFIRMADO”.
#### Se registra la fecha y hora de confirmación.
#### El turno queda listo para ser atendido por el profesional.
#### Flujos Alternativos
#### A1: El turno no es del día actual
#### El sistema no permite confirmar turnos cuya fecha sea distinta a hoy y muestra: “Solo podés confirmar asistencia el mismo día del turno.”
#### A2: El turno ya fue cancelado o realizado
#### El sistema bloquea la opción y muestra: “Este turno ya ha sido gestionado. No es posible confirmarlo.”
#### Post-Condiciones
#### El turno queda en estado “CONFIRMADO”.
#### El profesional verá que el socio ha confirmado su presencia.
#### Se impide la doble confirmación y se guarda un log del evento.
#### Caso de uso
#### ID y Nombre
#### CUD21 - Registrar asistencia del socio al turno
#### Estado
#### Activo
#### Descripción
#### Permite al profesional marcar si el socio asistió o no al turno una vez alcanzada la fecha y hora programada. Esta acción cambia el estado del turno a “REALIZADO”o , ”AUSENTE” lo cual impacta directamente en el historial clínico del socio.
#### Actor Principal
#### Profesional
#### Actor Secundario
#### Pre-Condiciones
#### El profesional debe estar autenticado en el sistema.
#### El turno debe encontrarse en estado “CONFIRMADO”.
#### El turno debe ser del día actual
#### Punto de extensión
#### Condición
#### El profesional desea registrar si el socio asistió o no al turno una vez finalizado el mismo.
#### Escenario Principal
#### El profesional accede al historial de turnos.
#### Selecciona un turno que ya ha transcurrido.
#### Presiona el botón “Registrar asistencia”.
#### El sistema solicita indicar si el socio asistió o no asistió.
#### El profesional selecciona una de las opciones.
#### El sistema actualiza el estado del turno como:
#### REALIZADO si asistió.
#### AUSENTE si no asistió.
#### Flujos Alternativos
#### A2: El turno ya fue cancelado o realizado
#### El sistema bloquea la opción y muestra: “Este turno ya ha sido gestionado. No es posible confirmarlo.”
#### Post-Condiciones
#### El turno queda en estado “CONFIRMADO”.
#### El profesional verá que el socio ha confirmado su presencia.
#### Se impide la doble confirmación y se guarda un log del evento.
#### Modelo de dominio
#### Diagrama de dominio conceptual del problema
#### Link a imagen mas detallada: https://drive.google.com/file/d/1bi3mWmygshECK5A9iabt42fqWmyIvVMB/view?usp=drive_link
#### Análisis del diseño preliminar
#### Diagrama de dominio actualizado
#### Link a imagen mas detallada:
#### https://drive.google.com/file/d/1kbxdC_834rMXdK4Q1Ki4Ng2QTdkUY4bg/view?usp=drive_link
#### Diseño detallado
#### Diagrama de secuencia
#### Módulo Asistente
#### CUD 02 – Registrar profesional
#### CUD 03 – Modificar profesional
#### CUD 04 – Desactivar o suspender profesional
#### CUD 05 – Ver listado de profesionales
#### Módulo Profesional
#### CUD09 - Ver ficha salud paciente
#### CUD11 - Configurar Horario de Atención
#### CUD12 - Asignar Turno a Paciente
#### Link:https://drive.google.com/file/d/1L6qQqHmzlwmU5CWelVdMvA8Ut1FVwudV/view?usp=drive_link
#### Módulo Socio
#### CUD14 - Solicitar turno con profesional
#### Link:https://drive.google.com/file/d/1g5nY1_hdOzKeW9OAKzqrFFyWJMk1npc9/view?usp=drive_link
#### CUD16 - Cargar datos de salud
#### Link:https://drive.google.com/file/d/1fWw7LrdhAjmXstiXQ_FxRLjjmpJHpxHv/view?usp=drive_link
#### Diagrama de clases
#### Link:https://drive.google.com/file/d/1fR-5_y-KH6kJjEI5p6gWSyai-Qc38WHp/view?usp=drive_link
#### Implementación
#### Autor y fecha
#### Avances
#### Albónico, Agustín - 28/05/2025
#### Se completaron los puntos del 1 al 11
#### Albónico, Agustín - 29/05/2025
#### Se realizaron los diagramas de caso de uso y de transición de estados
#### Albónico, Agustín - 01/06/2025
#### Se especificaron todos los casos de uso
#### Albónico, Agustín - 30/06/2025
#### Se crearon los diagramas de secuencia, diagrama de clases y diagrama entidad relación

### 3.2 Detalle granular por requisito (criterios/verificación)

#### RNF01 – El sistema debe estar disponible al menos el 99% del tiempo (alta disponibilidad).
- **RNF01.1** Asegurar disponibilidad ≥ 99% del tiempo (RNF01).
- **RNF01.2** Contar con monitoreo y alertas de disponibilidad (RNF01).

#### RNF02 – El sistema debe permitir al menos 100 usuarios concurrentes sin degradar la experiencia.
- **RNF02.1** Soportar ≥ 100 usuarios concurrentes (RNF02).
- **RNF02.2** Validar con pruebas de carga en los flujos críticos (RNF02).

#### RNF03 – El tiempo de respuesta del sistema no debe superar los 2 segundos en el 95% de las operaciones.
- **RNF03.1** Cumplir p95 ≤ 2s en operaciones (RNF03).
- **RNF03.2** Medir y reportar percentiles de latencia para evidenciar cumplimiento (RNF03).

#### RNF04 – El sistema debe escalar horizontalmente para soportar más gimnasios y profesionales con el tiempo.
- **RNF04.1** Permitir escalado horizontal para más gimnasios y profesionales (RNF04).
- **RNF04.2** Evitar dependencias que impidan multiplicar instancias de la aplicación (RNF04).

#### RNF05 – El sistema debe requerir autenticación de usuarios mediante correo electrónico y contraseña segura.
- **RNF05.1** Autenticación mediante correo y contraseña segura (RNF05).
- **RNF05.2** Bloquear inicio de sesión de usuarios no activos (Reglas de negocio: Autenticación y roles).

#### RNF06 – Las contraseñas deben almacenarse de forma encriptada (hash + salt).
- **RNF06.1** Almacenar contraseñas con hash + salt (RNF06).
- **RNF06.2** No persistir contraseñas en texto plano (RNF06).

#### RNF07 – El sistema debe contar con control de acceso basado en roles (Administrador, Profesional, Socio).
- **RNF07.1** Control de acceso basado en roles (Administrador/Profesional/Socio) (RNF07).
- **RNF07.2** Habilitar vistas y funciones según rol asignado (Reglas de negocio: Autenticación y roles).

#### RNF08 – El profesional solo podrá acceder a las fichas de salud de los socios con los que tenga un turno asignado.
- **RNF08.1** Restringir acceso del profesional a fichas de salud solo con turno asignado (RNF08).
- **RNF08.2** Evitar accesos directos a recursos no autorizados (RNF08).

#### RNF09 – El sistema debe registrar logs de acceso a datos sensibles para auditoría.
- **RNF09.1** Registrar logs de acceso a datos sensibles para auditoría (RNF09).
- **RNF09.2** Almacenar eventos con usuario, fecha/hora y recurso accedido (RNF09).

#### RNF10 – Toda la información debe transmitirse cifrada a través de HTTPS.
- **RNF10.1** Transmitir información cifrada mediante HTTPS (RNF10).
- **RNF10.2** Aplicar TLS en todas las comunicaciones cliente-servidor (RNF10).

#### RNF11 – La interfaz debe ser intuitiva, clara y accesible para usuarios sin conocimientos técnicos.
- **RNF11.1** Interfaz intuitiva y accesible para usuarios sin conocimientos técnicos (RNF11).
- **RNF11.2** Usabilidad consistente en los flujos principales (reserva, agenda, gestión de profesionales) (RNF11).

#### RNF12 – El sistema debe estar optimizado para desktop y dispositivos móviles (diseño responsive).
- **RNF12.1** Diseño responsive para desktop y móviles (RNF12).
- **RNF12.2** Layouts adaptativos para pantallas pequeñas sin perder funcionalidad (RNF12).

#### RNF13 – El sistema debe mostrar mensajes de error claros y sugerencias de acción cuando el usuario cometa un error.
- **RNF13.1** Mensajes de error claros y con sugerencia de acción (RNF13).
- **RNF13.2** Resaltar campos con error y permitir corrección (ej.: CUD02, CUD03) (RNF13).

#### RNF14 – El sistema debe desarrollarse siguiendo principios de arquitectura modular para permitir futuros módulos.
- **RNF14.1** Arquitectura modular para permitir futuros módulos (RNF14).
- **RNF14.2** Separación por componentes/módulos para evolucionar sin reescrituras (RNF14).

#### RNF15 – El código debe estar documentado y ser entendible para facilitar su mantenimiento.
- **RNF15.1** Código documentado y entendible para facilitar mantenimiento (RNF15).
- **RNF15.2** Incluir documentación mínima de módulos, entidades y reglas relevantes (RNF15).

#### RNF16 – Las nuevas funcionalidades deben poder integrarse sin modificar la lógica central del sistema.
- **RNF16.1** Integración de nuevas funcionalidades sin modificar la lógica central (RNF16).
- **RNF16.2** Extensibilidad mediante interfaces/servicios bien definidos (RNF16).

#### RNF17 – El sistema debe ser accesible desde los navegadores modernos más utilizados (Chrome, Firefox, Edge, Safari).
- **RNF17.1** Compatibilidad con navegadores modernos (Chrome, Firefox, Edge, Safari) (RNF17).
- **RNF17.2** Evitar dependencias de APIs no soportadas en dichos navegadores (RNF17).

#### RNF18 – El sistema debe poder ejecutarse en cualquier sistema operativo con navegador (Windows, macOS, Linux).
- **RNF18.1** Ejecución en cualquier sistema operativo con navegador (Windows, macOS, Linux) (RNF18).
- **RNF18.2** No requerir instalación de software adicional más allá del navegador (RNF18).

#### RNF19 – El sistema debe validar todos los datos ingresados por el usuario para evitar inconsistencias.
- **RNF19.1** Validar datos ingresados para evitar inconsistencias (RNF19).
- **RNF19.2** Incluir validaciones de formato, rangos y consistencia referencial (RNF19).

#### RNF20 – Ante un corte de sesión o error inesperado, el sistema no debe perder datos críticos ingresados.
- **RNF20.1** No perder datos críticos ante cortes de sesión/errores (RNF20).
- **RNF20.2** Asegurar persistencia transaccional en operaciones críticas (RNF20).

#### RNF21 – Los datos de turnos, historial clínico y observaciones deben persistir y mantenerse íntegros en el tiempo.
- **RNF21.1** Persistencia e integridad de turnos, historial clínico y observaciones en el tiempo (RNF21).
- **RNF21.2** Respaldos y controles de integridad para datos clínicos (RNF21).

## 4. Casos de uso (transcripción del documento)

> Nota: se respeta el texto del documento, incluyendo referencias cruzadas o numeraciones que puedan aparecer inconsistentes.

### CUD01 — Gestionar profesionales
- **Estado:** Activo
- **Descripción:** Caso de uso general que agrupa todas las acciones que puede realizar el asistente sobre los profesionales registrados en el sistema, como registrar, modificar, desactivar y visualizar su listado.
- **Actor principal:** Asistente
- **Actor secundario:** Profesional
- **Pre-condiciones:**
  1. El asistente debe estar autenticado en el sistema.
- **Punto de extensión:**
  - Registrar profesional CUD02
  - Modificar profesional CUD03
  - Desactivar profesional CUD04
  - Ver listado de profesionales CUD05
- **Condición:**
  - Se desea gestionar todo lo relacionado a profesionales desde un módulo centralizado.
- **Escenario principal:**
  1. El asistente accede al módulo “Gestionar profesionales”.
  2. Visualiza el listado y opciones por cada profesional.
  3. Desde ahí puede registrar uno nuevo, editarlo, suspenderlo o consultarlo.
- **Flujos alternativos:**
  - -
- **Post-condiciones:**
  1. Se centraliza la gestión de profesionales de forma eficiente y ordenada.

### CUD02 — Registrar profesional
- **Estado:** Activo
- **Descripción:** Permite al asistente registrar un nuevo profesional en el sistema.
- **Actor principal:** Asistente
- **Actor secundario:** Profesional
- **Pre-condiciones:**
  1. El asistente debe estar autenticado en el sistema.
  2. El profesional no debe estar registrado previamente.
- **Punto de extensión:**
  - -
- **Condición:**
  - El asistente necesita incorporar un nuevo profesional al sistema.
- **Escenario principal:**
  1. El asistente accede al módulo “Gestionar profesionales”.
  2. Selecciona “Registrar profesional”.
  3. Ingresa datos como nombre, apellido, dni, email, especialidad, género, fecha de nacimiento, dirección, número de matrícula, años de experiencia, formación académica, certificaciones, tarifa por sesión, diploma y matrícula profesional.
  4. Asistente confirma el registro.
  5. El sistema valida los datos:
  6. Verifica que todos los campos estén completos.
  7. Confirma que el número de documento y correo no existan en la base de datos.
  8. Valida el formato de correo y teléfono.
  9. El sistema genera automáticamente una contraseña provisional (12 caracteres, con al menos 1 mayúscula, 1 minúscula, 1 número, 1 símbolo).
  10. El sistema crea el perfil del profesional en estado “Pendiente de configuración”.
  11. El sistema muestra un mensaje: "Profesional registrado exitosamente. Se envió un correo con las credenciales."
- **Flujos alternativos:**
  - A5a: Documento o correo ya registrado:
  - El sistema detecta que el número de documento o correo ya existe.
  - Muestra un mensaje: "El documento o correo ya está registrado. Verifique los datos."
  - Permite al asistente corregir los campos y volver al paso 5.
  - A5b: Campos incompletos o inválidos:
  - El sistema detecta campos vacíos o con formato incorrecto (por ejemplo, correo sin "@").
  - Muestra un mensaje: "Complete todos los campos correctamente."
  - Resalta los campos con errores y permite corregirlos, volviendo al paso 3.
- **Post-condiciones:**
  1. El perfil del profesional está creado en la base de datos con estado "Activo".
  2. La contraseña provisional está encriptada y asociada al profesional.
  3. El profesional recibe un correo con su usuario y contraseña provisional (si el correo se envió correctamente).

### CUD03 — Modificar profesional
- **Estado:** Activo
- **Descripción:** El asistente actualiza los datos de un profesional existente, como nombre, contacto o credenciales.
- **Actor principal:** Asistente
- **Actor secundario:** Profesional
- **Pre-condiciones:**
  1. El asistente debe estar autenticado en el sistema.
  2. El profesional está registrado en el sistema.
- **Punto de extensión:**
  - -
- **Condición:**
  - Se requiere actualizar datos incorrectos o desactualizados.
- **Escenario principal:**
  1. Asistente selecciona a profesional de la lista de profesionales o lo busca por dni o nombre.
  2. El sistema muestra un formulario con los datos actuales del profesional.
  3. El asistente modifica los campos necesarios.
  4. El Asistente guarda los cambios.
  5. El sistema muestra un mensaje: "Datos del profesional actualizados exitosamente."
- **Flujos alternativos:**
  - A4: Campos inválidos:
  - El sistema detecta un formato incorrecto (por ejemplo, teléfono no numérico).
  - Muestra un mensaje: "Corrija los campos inválidos."
  - Resalta los errores y permite corregirlos, volviendo al paso 3.
- **Post-condiciones:**
  1. Los datos del profesional están actualizados en la base de datos.

### CUD04 — Desactivar o suspender profesional
- **Estado:** Activo
- **Descripción:** El asistente desactiva el perfil de un profesional, impidiendo que reciba turnos o acceda al sistema.
- **Actor principal:** Asistente
- **Actor secundario:** Profesional
- **Pre-condiciones:**
  1. El asistente debe estar autenticado en el sistema.
- **Punto de extensión:**
  - -
- **Condición:**
  - Se requiere bloquear definitivamente al profesional.
- **Escenario principal:**
  1. Asistente selecciona a profesional de la lista de profesionales o lo busca por dni o nombre.
  2. Sistema muestra datos del profesional.
  3. Asistente selecciona y confirma la desactivación del profesional.
  4. El sistema muestra un mensaje: "Profesional desactivado/suspendido exitosamente."
- **Flujos alternativos:**
  - A3: Turnos pendientes:
  - El sistema detecta turnos futuros asignados al profesional.
  - Muestra un mensaje: "El profesional tiene turnos pendientes. Cancele o reasigne los turnos."
  - Permite al asistente cancelar los turnos o volver al listado.
- **Post-condiciones:**
  1. El profesional está en estado "Suspendido" en la base de datos.
  2. No puede iniciar sesión ni recibir turnos.
  3. Los socios reciben notificaciones si sus turnos fueron cancelados (si aplica).

### CUD05 — Ver listado de profesionales
- **Estado:** Activo
- **Descripción:** El asistente consulta un listado de profesionales registrados, con filtros por especialidad, estado o nombre.
- **Actor principal:** Asistente
- **Actor secundario:** -
- **Pre-condiciones:**
  1. El asistente debe estar autenticado en el sistema.
  2. Existen profesionales registrados en el sistema.
- **Punto de extensión:**
  - CUD03, CUD04
- **Condición:**
  - Se desea consultar el estado, datos o historial de profesionales.
- **Escenario principal:**
  1. Selecciona "Ver listado de profesionales".
  2. El sistema muestra una tabla con columnas: nombre, apellido, especialidad, estado, acciones (editar, desactivar/suspender).
  3. El asistente aplica filtros:
  4. Especialidad: lista desplegable (nutricionista o deportólogo).
  5. Estado: lista desplegable (activo o suspendido).
  6. Nombre: campo de texto para búsqueda parcial.
  7. Asistente hace clic en "Filtrar".
  8. El sistema actualiza la tabla con los resultados filtrados.
  9. El asistente puede hacer clic en "Editar" (CUD03) o "Suspender" (CUD04) para un profesional.
- **Flujos alternativos:**
  - A5: Sin resultados:
  - El sistema no encuentra profesionales que coincidan con los filtros.
  - Muestra un mensaje: "No se encontraron profesionales. Ajuste los filtros."
  - Permite al asistente modificar los filtros y volver al paso 4.
- **Post-condiciones:**
  1. El asistente visualiza el listado de profesionales filtrado.

### CUD06 — Gestionar Agenda
- **Estado:** Activo
- **Descripción:** Este caso de uso general permite al profesional acceder a toda la funcionalidad relacionada con su carga de turnos y atención: visualización diaria y semanal, historial de pacientes, ficha médica, anotaciones y configuración horaria.
- **Actor principal:** Profesional
- **Actor secundario:** -
- **Pre-condiciones:**
  1. El profesional debe estar autenticado en el sistema.
  2. Debe tener una agenda activa o turnos programados.
- **Punto de extensión:**
  - Extiende a CUD-07, CUD-08, CUD-09, CUD-10, CUD-12.
- **Condición:**
  - El profesional quiere consultar, gestionar o registrar información relacionada con su actividad diaria.
- **Escenario principal:**
  1. El profesional accede al panel "Mi Agenda".
  2. Visualiza los turnos del día actual (CUD-07).
  3. Consulta la lista de pacientes que atendió o que tiene asignados (CUD-08).
  4. Revisa la ficha clínica de cada paciente antes o después de un turno (CUD-09).
  5. Puede registrar observaciones y seguimiento.
  6. Tiene acceso a la configuración de horarios (CUD-11).
  7. Puede asignar manualmente turnos a un paciente en circunstancias especiales (CUD-12).
- **Post-condiciones:**
  1. El profesional puede gestionar su agenda integralmente, y todas las acciones quedan registradas en el sistema.

### CUD07 — Ver turnos del día.
- **Estado:** Activo
- **Descripción:** Permite al profesional visualizar en una lista todos los turnos agendados para el día en curso.
- **Actor principal:** Profesional
- **Actor secundario:** -
- **Pre-condiciones:**
  1. El profesional debe estar autenticado en el sistema.
  2. El profesional debe tener turnos programados para hoy.
- **Punto de extensión:**
  - -
- **Condición:**
  - El profesional desea conocer su cronograma diario de atención.
- **Escenario principal:**
  1. El profesional accede a "Mi Agenda".
  2. El sistema muestra automáticamente la vista de turnos del día actual que estén con el estado “CONFIRMADO”.
  3. Cada turno incluye nombre del socio, horario, tipo de consulta y estado.
  4. Desde esta vista, puede acceder a la ficha del paciente o comenzar la atención.
- **Flujos alternativos:**
  - Si no hay turnos asignados para hoy, el sistema muestra el mensaje: “No hay turnos asignados para el día de hoy”.
- **Post-condiciones:**
  1. El profesional conoce en detalle su agenda del día.

### CUD08 — Ver pacientes
- **Estado:** Activo
- **Descripción:** Permite al profesional acceder a una lista de todos los socios que ha atendido o tiene turnos agendados con él.
- **Actor principal:** Profesional
- **Actor secundario:** Socio
- **Pre-condiciones:**
  1. El profesional debe estar autenticado en el sistema.
  2. El profesional debe haber tenido al menos un turno con un socio.
- **Punto de extensión:**
  - CUD10 - Ver ficha de salud del paciente, CUD11 - Ver historial de consultas del paciente, CUD13 - Asignar Turno a Paciente
- **Condición:**
  - El profesional desea revisar su historial de pacientes.
- **Escenario principal:**
  1. El profesional accede a "Pacientes" desde su panel.
  2. El sistema lista los pacientes con los que tuvo turnos.
  3. El sistema muestra botones para acceder a la ficha médica(CUD10 - Ver Ficha de salud del paciente), al historial de consultas(CUD11 - Ver historial de consultas del paciente) o asignar un turno manualmente(CUD13 - Asignar Turno a Paciente).
- **Flujos alternativos:**
  - A2: Si no hay pacientes registrados
  - Se muestra: “Todavía no has atendido pacientes. Cuando lo hagas, aparecerán aquí”.
- **Post-condiciones:**
  1. El profesional accede a su base de pacientes con acceso rápido a su historial.

### CUD09 — Ver ficha de salud del paciente
- **Estado:** Activo
- **Descripción:** Muestra al profesional los datos clínicos básicos provistos por el socio, como peso, altura, nivel de actividad física, alergias, patologías y objetivo.
- **Actor principal:** Profesional
- **Actor secundario:** Socio
- **Pre-condiciones:**
  1. El profesional debe estar autenticado en el sistema.
  2. El profesional debe tener al menos un turno con ese socio.
  3. El socio debe tener cargada la ficha de salud.
- **Punto de extensión:**
  - -
- **Condición:**
  - El profesional quiere conocer el contexto clínico del paciente antes de atenderlo.
- **Escenario principal:**
  1. Desde un turno o desde el historial de un paciente, el profesional hace clic en “Ficha de salud”.
  2. El sistema muestra los datos ingresados por el socio.
- **Flujos alternativos:**
  - -
- **Post-condiciones:**
  1. El profesional accede a la ficha y puede tomar decisiones informadas.

### CUD10 — Ver historial de consultas del paciente
- **Estado:** Activo
- **Descripción:** Permite al profesional visualizar todas las sesiones previas realizadas con un socio en orden cronológico, incluyendo fecha, tipo de consulta, notas y archivos adjuntos.
- **Actor principal:** Profesional
- **Actor secundario:** Socio
- **Pre-condiciones:**
  1. El profesional debe estar autenticado en el sistema.
  2. Debe haber al menos un turno finalizado con el socio.
- **Punto de extensión:**
  - -
- **Condición:**
  - El profesional desea consultar el historial clínico completo de un socio determinado.
- **Escenario principal:**
  1. El profesional accede a la sección “Pacientes”.
  2. Selecciona un socio específico.
  3. Hace clic en “Ver historial de consultas”.
  4. El sistema muestra una lista ordenada cronológicamente de las sesiones anteriores con:
  5. Fecha y hora
  6. Tipo de consulta
  7. Notas del profesional
  8. Archivos adjuntos (PDF, imágenes)
- **Flujos alternativos:**
  - A3: El paciente aún no tiene consultas finalizadas
  - El sistema muestra: “No se registran consultas previas con este paciente.”
- **Post-condiciones:**
  1. El profesional accede al historial clínico y puede realizar seguimiento longitudinal del paciente.

### CUD11 — Configurar Horario de Atención
- **Estado:** Activo
- **Descripción:** Permite al profesional definir sus días y horarios de atención, así como la duración de cada consulta.
- **Actor principal:** Profesional
- **Actor secundario:** -
- **Pre-condiciones:**
  1. El profesional debe estar autenticado en el sistema.
- **Punto de extensión:**
  - -
- **Condición:**
  - El profesional desea establecer o modificar su disponibilidad horaria.
- **Escenario principal:**
  1. El profesional accede a la sección "Configuración de agenda".
  2. Selecciona los días en los que estará disponible.
  3. Define el rango horario para cada día.
  4. Establece la duración estándar por turno (ej.: 30 min).
  5. Guarda los cambios.
  6. Sistema cambia el estado del profesional a “activo”.
- **Flujos alternativos:**
  - A4: No se configuran horarios válidos.
  - El sistema muestra una alerta: “Debe seleccionar al menos un día y un rango horario válido”.
- **Post-condiciones:**
  1. El sistema crea los bloques de turnos disponibles en la agenda.

### CUD12 — Asignar Turno a Paciente
- **Estado:** Activo
- **Descripción:** Permite al profesional agendar un turno manualmente para un socio que no lo solicitó mediante el sistema (ej.: atención especial, casos urgentes).
- **Actor principal:** Profesional
- **Actor secundario:** Socio
- **Pre-condiciones:**
  1. El profesional debe estar autenticado en el sistema.
  2. El socio debe estar registrado en el sistema.
  3. Debe haber disponibilidad horaria.
- **Punto de extensión:**
  - -
- **Condición:**
  - El turno es solicitado o coordinado fuera del sistema (ej: por WhatsApp o presencialmente).
- **Escenario principal:**
  1. El profesional accede a la opción “Asignar turno manual”.
  2. Busca al socio por nombre o dni.
  3. Profesional selecciona una fecha.
  4. Sistema muestra tanto los horarios disponibles como los no disponibles en la fecha seleccionada.
  5. Profesional selecciona horario y confirma la acción.
  6. Sistema agenda el turno, cambia el estado del turno a “PENDIENTE” y notifica al socio.
- **Flujos alternativos:**
  - A3: no hay horarios disponibles.
  - Sistema avisa que no hay horarios disponibles en la fecha seleccionada.
  - Se vuelve al paso 3.
- **Post-condiciones:**
  1. El turno queda reservado y se notifica al socio correspondiente.

### CUD13 — Ver lista de profesionales
- **Estado:** Activo
- **Descripción:** Permite al socio explorar la lista completa de profesionales disponibles y aplicar filtros por especialidad, nombre, horario o tipo de consulta para encontrar fácilmente a quien necesita.
- **Actor principal:** Socio
- **Actor secundario:** Profesional
- **Pre-condiciones:**
  1. El socio debe estar autenticado en el sistema.
- **Punto de extensión:**
  - CUD14 - Solicitar turno con profesional, CUD15 - Ver perfil de profesional
- **Condición:**
  - El socio desea consultar qué profesionales están disponibles para reservar turno.
- **Escenario principal:**
  1. El socio accede a la sección “Buscar profesionales”.
  2. El sistema muestra la lista completa de profesionales activos.
  3. El socio puede filtrar por:
  4. Especialidad (Nutricionista o Deportólogo)
  5. Nombre
  6. En cada resultado de la lista hay dos botones:
  7. Reservar Turno (CUD15 - Solicitar turno con profesional)
  8. Ver Perfil (CUD16 - Ver perfil de profesional)
- **Flujos alternativos:**
  - A2: No hay profesionales activos
  - El sistema muestra: “No hay profesionales disponibles en este momento.”
- **Post-condiciones:**
  1. El socio encuentra al profesional adecuado y puede continuar con la reserva.

### CUD14 — Solicitar turno con profesional
- **Estado:** Activo
- **Descripción:** Permite al socio iniciar la solicitud de turno directamente desde la ficha de un profesional, accediendo a su agenda específica.
- **Actor principal:** Socio
- **Actor secundario:** Profesional
- **Pre-condiciones:**
  1. El socio debe estar autenticado en el sistema.
  2. El profesional debe tener horarios disponibles configurados.
- **Punto de extensión:**
  - CUD17 - Cargar datos de salud
- **Condición:**
  - El socio desea iniciar una consulta con un profesional.
- **Escenario principal:**
  1. El sistema muestra la agenda del profesional.
  2. El socio elige fecha.
  3. El sistema muestra tanto los horarios disponibles como los horarios que ya fueron reservados pero sin poder seleccionarlos.
  4. Si es su primer turno, se solicita completar ficha de salud (CUD17 - Cargar datos de salud).
  5. El socio confirma la reserva.
- **Flujos alternativos:**
  - A2: No hay turnos disponibles
  - El sistema ofrece otros días.
- **Post-condiciones:**
  1. El turno queda registrado y se notifica al profesional y al socio.

### CUD15 — Ver perfil de profesional
- **Estado:** Activo
- **Descripción:** Permite al socio acceder al perfil completo de un profesional seleccionado, incluyendo su experiencia, especialidad, tipo de atención, horarios y opiniones de otros socios.
- **Actor principal:** Socio
- **Actor secundario:** Profesional
- **Pre-condiciones:**
  1. El asistente debe estar autenticado en el sistema.
  2. El profesional debe estar activo.
- **Punto de extensión:**
  - -
- **Condición:**
  - El socio desea conocer más información antes de reservar un turno.
- **Escenario principal:**
  1. El socio, desde la lista de profesionales, hace clic en “Ver perfil”.
  2. El sistema muestra una vista con:
  3. Datos basicos
  4. Especialidad
  5. Breve biografía profesional
  6. Opiniones y calificaciones
- **Flujos alternativos:**
  - -
- **Post-condiciones:**
  1. El socio decide si continuar con la reserva.

### CUD16 — Cargar datos de salud
- **Estado:** Activo
- **Descripción:** Permite al socio ingresar su información personal y médica necesaria antes de reservar su primer turno. Esta información será utilizada por el profesional para brindar una atención personalizada.
- **Actor principal:** Socio
- **Actor secundario:** -
- **Pre-condiciones:**
  1. El socio debe estar autenticado en el sistema.
  2. El socio no debe tener una ficha de salud registrada previamente.
- **Punto de extensión:**
  - -
- **Condición:**
  - El socio intenta agendar su primer turno con un profesional.
- **Escenario principal:**
  1. El socio accede al proceso de reserva de turno por primera vez.
  2. El sistema detecta que no tiene ficha de salud cargada.
  3. Se muestra un formulario con los siguientes campos:
  4. Estatura (cm)
  5. Peso actual (kg)
  6. Nivel de actividad física (sedentario, moderado, intenso)
  7. Alergias conocidas
  8. Patologías o condiciones médicas
  9. Objetivo personal (bajar de peso, aumentar masa, mejorar salud, etc.)
  10. El socio completa los campos requeridos.
  11. Presiona “Guardar”.
  12. El sistema registra la información y continúa con el proceso de reserva.
- **Flujos alternativos:**
  - A4: El socio deja campos obligatorios en blanco.
  - El sistema bloquea el envío y muestra: “Debe completar todos los campos obligatorios para continuar”.
- **Post-condiciones:**
  1. La ficha de salud queda registrada y disponible para los profesionales que atiendan al socio.

### CUD17 — Ver turnos reservados
- **Estado:** Activo
- **Descripción:** El Socio consulta una lista de sus turnos reservados (en estado "Confirmado" o "Pendiente"), con detalles como fecha, hora, profesional, especialidad, y tipo de consulta. Cada turno muestra botones para cancelar o reprogramar.
- **Actor principal:** Socio
- **Actor secundario:** -
- **Pre-condiciones:**
  1. El socio debe estar autenticado en el sistema.
  2. Tiene al menos un turno reservado.
- **Punto de extensión:**
  - CUD13 - Ver lista de profesionales, CUD18 - Reprogramar turno, CUD19 - Cancelar turno
- **Condición:**
  - El socio accede a la sección de sus turnos para revisar o gestionar reservas activas.
- **Escenario principal:**
  1. Navega al menú principal y selecciona "Mis Turnos".
  2. El sistema muestra una tabla con los turnos reservados:
  3. Columnas: Fecha, Hora, Profesional (Nombre y Apellido),
  4. Especialidad (Nutricionista/Deportólogo),
  5. Acciones: Botones "Cancelar reserva" y "Reprogramar reserva" por cada turno.
  6. El Socio puede filtrar la lista:
  7. Por fecha: calendario (rango de fechas).
  8. Por profesional: lista desplegable con nombres.
  9. Por especialidad: lista desplegable (Nutricionista, Deportólogo).
  10. Por estado: lista desplegable (Confirmado, Pendiente).
  11. El Socio selecciona los filtros y hace clic en "Filtrar".
  12. El sistema actualiza la tabla según los filtros aplicados.
  13. El Socio puede hacer clic en:
  14. "Cancelar reserva" para iniciar CUD20 - Cancelar turno.
  15. "Reprogramar reserva" para iniciar CUD19 - Reprogramar turno.
- **Flujos alternativos:**
  - A4: Sin turnos
  - El socio no tiene turnos activos.
  - Muestra: “Sin turnos reservados.”
  - Ofrece “Reservar nuevo turno” y redirige a CUD14 - Ver lista de profesionales.
- **Post-condiciones:**
  1. El socio visualiza correctamente sus turnos y puede tomar acciones sobre ellos (cancelar o reprogramar).

### CUD18 — Reprogramar turno
- **Estado:** Activo
- **Descripción:** Permite al socio modificar la fecha y/u hora de un turno reservado, siempre y cuando el turno esté en estado pendiente y el profesional tenga disponibilidad alternativa.
- **Actor principal:** Socio
- **Actor secundario:** -
- **Pre-condiciones:**
  1. El socio debe estar autenticado en el sistema.
  2. Debe existir al menos un turno reservado en estado pendiente.
  3. El profesional asignado al turno debe contar con horarios disponibles para reprogramación.
- **Punto de extensión:**
  - -
- **Condición:**
  - El socio desea cambiar la fecha u hora de un turno que ya había reservado, por motivos personales u organizativos.
- **Escenario principal:**
  1. El socio accede a “Mis Turnos” (CUD-44).
  2. Selecciona un turno en estado pendiente.
  3. Presiona el botón “Reprogramar Turno”.
  4. El sistema consulta la disponibilidad del profesional.
  5. El sistema muestra un calendario con las fechas y horarios disponibles.
  6. El socio elige una nueva fecha y hora.
  7. Presiona “Confirmar”.
  8. El sistema actualiza el turno con la nueva información y cambia el estado del turno a “REPROGRAMADO”.
  9. Se envía una notificación al profesional con la modificación.
  10. Se muestra al socio una confirmación: “Tu turno fue reprogramado con éxito”.
- **Flujos alternativos:**
  - A4: El profesional no tiene disponibilidad alternativa
  - El sistema muestra: “No hay horarios disponibles para reprogramación con este profesional”.
  - A6: El socio no elige una fecha y hora
  - el sistema bloquea el paso 7 con el mensaje: “Debe seleccionar una nueva fecha y hora para confirmar la reprogramación”.
- **Post-condiciones:**
  1. El turno queda actualizado en la base de datos con su nueva fecha y hora.

### CUD19 — Cancelar turno
- **Estado:** Activo
- **Descripción:** Permite al socio cancelar un turno reservado que aún no fue realizado, liberando el horario para otros usuarios.
- **Actor principal:** Socio
- **Actor secundario:** -
- **Pre-condiciones:**
  1. El socio debe estar autenticado en el sistema.
  2. El turno debe encontrarse en estado “pendiente”.
- **Punto de extensión:**
  - -
- **Condición:**
  - El socio desea cancelar un turno al que no podrá asistir.
- **Escenario principal:**
  1. El socio accede a “Mis Turnos”.
  2. Selecciona el turno que desea cancelar.
  3. Presiona el botón “Cancelar” y confirma la acción en un cuadro de diálogo.
  4. El sistema actualiza el estado del turno como “CANCELADO”.
  5. Se libera el horario en la agenda del profesional.
  6. Se envía una notificación al profesional.
- **Flujos alternativos:**
  - A2: El turno ya está en curso o finalizado
  - El sistema bloquea la opción y muestra: “No es posible cancelar un turno ya realizado o en curso.”
- **Post-condiciones:**
  1. El turno queda cancelado y el horario queda liberado para poder ser reservado nuevamente.

### CUD20 — Confirmar turno
- **Estado:** Activo
- **Descripción:** Permite al socio confirmar su asistencia a un turno reservado el mismo día en que se realiza. Esta acción cambia el estado del turno de “pendiente” a “confirmado” y habilita su realización por parte del profesional.
- **Actor principal:** Socio
- **Actor secundario:** -
- **Pre-condiciones:**
  1. El socio debe estar autenticado en el sistema.
  2. El turno debe encontrarse en estado “pendiente”.
  3. El turno debe ser del día actual
- **Punto de extensión:**
  - -
- **Condición:**
  - El socio desea confirmar que asistirá al turno reservado para el día de hoy.
- **Escenario principal:**
  1. El sistema notifica al socio sobre su turno del día.
  2. El socio accede a la pantalla de confirmación del turno mediante el link notificado.
  3. Visualiza el turno del día con estado “Pendiente”.
  4. Presiona el botón “Confirmar asistencia”.
  5. El sistema actualiza el estado del turno como “CONFIRMADO”.
  6. Se registra la fecha y hora de confirmación.
  7. El turno queda listo para ser atendido por el profesional.
- **Flujos alternativos:**
  - A1: El turno no es del día actual
  - El sistema no permite confirmar turnos cuya fecha sea distinta a hoy y muestra: “Solo podés confirmar asistencia el mismo día del turno.”
  - A2: El turno ya fue cancelado o realizado
  - El sistema bloquea la opción y muestra: “Este turno ya ha sido gestionado. No es posible confirmarlo.”
- **Post-condiciones:**
  1. El turno queda en estado “CONFIRMADO”.
  2. El profesional verá que el socio ha confirmado su presencia.
  3. Se impide la doble confirmación y se guarda un log del evento.

### CUD21 — Registrar asistencia del socio al turno
- **Estado:** Activo
- **Descripción:** Permite al profesional marcar si el socio asistió o no al turno una vez alcanzada la fecha y hora programada. Esta acción cambia el estado del turno a “REALIZADO”o , ”AUSENTE” lo cual impacta directamente en el historial clínico del socio.
- **Actor principal:** Profesional
- **Actor secundario:** -
- **Pre-condiciones:**
  1. El profesional debe estar autenticado en el sistema.
  2. El turno debe encontrarse en estado “CONFIRMADO”.
  3. El turno debe ser del día actual
- **Punto de extensión:**
  - -
- **Condición:**
  - El profesional desea registrar si el socio asistió o no al turno una vez finalizado el mismo.
- **Escenario principal:**
  1. El profesional accede al historial de turnos.
  2. Selecciona un turno que ya ha transcurrido.
  3. Presiona el botón “Registrar asistencia”.
  4. El sistema solicita indicar si el socio asistió o no asistió.
  5. El profesional selecciona una de las opciones.
  6. El sistema actualiza el estado del turno como:
  7. REALIZADO si asistió.
  8. AUSENTE si no asistió.
- **Flujos alternativos:**
  - A2: El turno ya fue cancelado o realizado
  - El sistema bloquea la opción y muestra: “Este turno ya ha sido gestionado. No es posible confirmarlo.”
- **Post-condiciones:**
  1. El turno queda en estado “CONFIRMADO”.
  2. El profesional verá que el socio ha confirmado su presencia.
  3. Se impide la doble confirmación y se guarda un log del evento.
