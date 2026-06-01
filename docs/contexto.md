# NutriFit Supervisor — Contexto del negocio y sistema a construir

> **Versión:** 1.0  
> **Tipo de documento:** Contexto maestro del negocio y del sistema  
> **Proyecto:** NutriFit Supervisor  
> **Sigla:** NFS  
> **Alcance ajustado:** sistema web B2B para gimnasios, enfocado exclusivamente en servicios nutricionales.  
> **Nota clave de alcance:** no se incluyen entrenadores, rutinas de entrenamiento ni deportólogos/médicos del deporte dentro del sistema a construir en esta versión.

---

## 1. Propósito del documento

Este documento tiene como objetivo dejar un contexto claro, completo y ordenado sobre el negocio y el sistema **NutriFit Supervisor**, para que pueda ser usado como base por desarrolladores, docentes, analistas funcionales, diseñadores, testers o cualquier IA que deba colaborar en el proyecto.

La idea principal es que, leyendo este archivo, se pueda entender:

- Qué negocio se quiere construir.
- Qué problema intenta resolver.
- Quién es el cliente real del sistema.
- Quiénes son los usuarios que lo van a utilizar.
- Qué funcionalidades debe incluir.
- Qué funcionalidades quedan fuera del alcance.
- Cuáles son las reglas principales del negocio.
- Qué módulos son necesarios para construir una primera versión funcional.
- Qué decisiones de alcance se tomaron respecto de los documentos originales.

Este documento **no reemplaza** a los casos de uso detallados, sino que funciona como una capa superior de contexto. Los casos de uso describen el comportamiento funcional caso por caso; este documento explica la visión general del negocio, el alcance del producto y la lógica del sistema.

---

## 2. Resumen ejecutivo

**NutriFit Supervisor** es una plataforma web B2B pensada para gimnasios que quieren profesionalizar su propuesta de valor incorporando servicios nutricionales dentro de su propio ecosistema digital.

El cliente principal del sistema es el **gimnasio**, no el socio individual. El gimnasio contrata la plataforma para ofrecer a sus socios una experiencia más completa, donde puedan acceder a nutricionistas, reservar turnos, completar una ficha de salud/nutricional, consultar planes alimentarios, recibir seguimiento y visualizar su progreso desde un único entorno web.

El sistema busca resolver una problemática habitual en gimnasios pequeños y medianos: muchos centros ofrecen entrenamiento físico, pero no cuentan con herramientas digitales que permitan integrar de forma ordenada el seguimiento nutricional. En la práctica, la comunicación entre socios, profesionales y administración suele estar fragmentada en WhatsApp, planillas, notas manuales o sistemas aislados. Esto genera pérdida de información, baja trazabilidad, poca personalización y dificultad para brindar un servicio realmente profesional.

La solución propuesta centraliza la gestión nutricional en una plataforma web responsive, accesible desde computadoras, tablets y celulares, sin necesidad de instalar una aplicación nativa. El sistema permite registrar nutricionistas, configurar agendas, gestionar turnos, registrar consultas, cargar mediciones, crear planes alimentarios, generar recomendaciones asistidas por IA y notificar eventos importantes.

La inteligencia artificial cumple un rol de **asistente de apoyo**, no de reemplazo profesional. Puede sugerir ideas de comidas, recetas o recomendaciones preliminares en función del objetivo nutricional, restricciones, alergias y datos relevantes del socio, pero toda sugerencia debe ser validada por un nutricionista antes de quedar incorporada al plan del socio.

En esta versión del sistema, el alcance queda ajustado exclusivamente a la parte nutricional. Por decisión del proyecto, **no se incluyen entrenadores, rutinas de entrenamiento, coordinación con entrenamiento ni deportólogos/médicos del deporte**. Cualquier mención a esos actores o funcionalidades en documentos previos debe interpretarse como contexto histórico, alcance descartado o posible extensión futura, pero no como parte del sistema a construir ahora.

---

## 3. Contexto del negocio

### 3.1 Situación actual del mercado

El sector de gimnasios y centros de entrenamiento atraviesa un proceso de digitalización progresiva. Muchos gimnasios ya utilizan alguna herramienta para administrar socios, cuotas, horarios o reservas, pero todavía existe una oportunidad importante en la integración de servicios complementarios de salud y bienestar.

El usuario actual no busca únicamente entrenar. También quiere mejorar su alimentación, controlar su evolución, recibir recomendaciones personalizadas y sentirse acompañado. Esta demanda genera una oportunidad para que los gimnasios amplíen su propuesta y se posicionen como espacios de bienestar integral.

Sin embargo, muchos gimnasios pequeños y medianos no tienen herramientas simples para sumar servicios nutricionales de forma ordenada. Pueden tener profesionales asociados, pero la gestión suele quedar dispersa entre mensajes, agendas personales, archivos sueltos o registros informales. Esto dificulta escalar el servicio, mantener trazabilidad y ofrecer una experiencia consistente.

### 3.2 Problema detectado

El problema principal es que los gimnasios que quieren sumar nutrición como servicio diferencial no suelen contar con un sistema que centralice la operatoria completa.

Los problemas concretos son:

- Falta de una agenda nutricional integrada al gimnasio.
- Dificultad para que el socio encuentre y reserve turnos con nutricionistas.
- Falta de una ficha nutricional única y actualizada por socio.
- Escasa trazabilidad de consultas, observaciones y mediciones.
- Planes alimentarios enviados por canales informales, como PDF, WhatsApp o papel.
- Baja visibilidad del progreso del socio a lo largo del tiempo.
- Poca automatización de recordatorios y notificaciones.
- Ausencia de herramientas de IA que ayuden al nutricionista a acelerar tareas repetitivas.
- Falta de reportes para que el gimnasio entienda el uso real del servicio nutricional.

### 3.3 Oportunidad de negocio

La oportunidad consiste en ofrecer una plataforma que permita a gimnasios incorporar servicios nutricionales sin tener que desarrollar tecnología propia ni contratar soluciones complejas.

NutriFit Supervisor permite que el gimnasio se diferencie frente a otros centros que solo ofrecen entrenamiento o administración básica. El valor no está únicamente en “tener turnos”, sino en ofrecer una experiencia más profesional: socio con ficha, nutricionista con agenda, consulta registrada, plan alimentario vigente, evolución visible y recomendaciones asistidas por IA.

El sistema puede ayudar al gimnasio a:

- Mejorar la retención de socios.
- Aumentar el valor percibido de la membresía.
- Ofrecer servicios adicionales sin desorden operativo.
- Profesionalizar su imagen.
- Generar una experiencia más personalizada.
- Diferenciarse de competidores que solo gestionan socios o cuotas.

### 3.4 Mercado inicial

El mercado inicial recomendado son gimnasios pequeños y medianos de Rosario y zonas cercanas, especialmente aquellos orientados a salud, bienestar, musculación, fitness general o entrenamiento personalizado.

No se apunta inicialmente a grandes cadenas con procesos complejos ni a instituciones médicas. El foco está en gimnasios que tienen cercanía con sus socios, desean profesionalizarse y necesitan una solución fácil de adoptar.

Perfil ideal del gimnasio cliente:

- Gimnasio pequeño o mediano.
- Ubicado en Rosario o zona de influencia.
- Con interés en sumar nutrición como servicio diferencial.
- Con administración simple o parcialmente digitalizada.
- Con necesidad de mejorar la experiencia del socio.
- Con capacidad para trabajar con uno o varios nutricionistas.
- Con apertura a usar herramientas web.
- Sin necesidad de una solución médica compleja.

---

## 4. Descripción del negocio

### 4.1 Nombre del proyecto

**NutriFit Supervisor**.

El nombre comunica la idea de supervisión inteligente del bienestar nutricional dentro del ámbito fitness. La palabra “NutriFit” vincula nutrición y actividad física, mientras que “Supervisor” transmite seguimiento, control y acompañamiento.

### 4.2 Sigla

**NFS**.

### 4.3 Tipo de negocio

NutriFit Supervisor funciona bajo un modelo **B2B**: el gimnasio es quien contrata el sistema para utilizarlo dentro de su operación y ofrecer una mejor experiencia a sus socios.

El socio no compra directamente el software. El socio lo utiliza como usuario final dentro del ecosistema del gimnasio.

### 4.4 Modelo comercial

El modelo comercial recomendado es **SaaS**. El gimnasio paga una suscripción periódica para acceder a la plataforma, recibir soporte, actualizaciones y mantenimiento.

Posibles formas de monetización:

- Suscripción mensual por gimnasio.
- Suscripción por sede.
- Planes diferenciados según cantidad de socios o nutricionistas activos.
- Módulos adicionales en futuras versiones.
- Setup inicial de configuración y capacitación.
- Soporte premium para gimnasios con mayor volumen.

Para esta versión, el sistema no debe incluir cobros internos entre socio y nutricionista. Es decir, el sistema puede gestionar turnos y servicios, pero no procesa pagos de consultas, facturación profesional ni liquidaciones.

### 4.5 Cliente principal

El cliente principal es el **gimnasio**.

El gimnasio busca una herramienta que le permita:

- Digitalizar la gestión nutricional.
- Registrar nutricionistas asociados.
- Centralizar la agenda de atención.
- Permitir que socios reserven turnos.
- Ofrecer planes alimentarios dentro de su plataforma.
- Consultar métricas generales del uso del servicio.
- Mejorar la propuesta de valor.

### 4.6 Usuarios finales

Los usuarios finales del sistema son:

- Administrador del gimnasio.
- Asistente o recepcionista.
- Nutricionista.
- Socio.
- Soporte interno de NutriFit Supervisor.
- Motor de inteligencia artificial.
- Sistema de notificaciones.

No son usuarios del sistema en esta versión:

- Entrenadores.
- Deportólogos.
- Médicos del deporte.
- Profesionales clínicos no nutricionales.
- Pasarelas de pago para consultas internas.

### 4.7 Propuesta de valor

NutriFit Supervisor permite que un gimnasio ofrezca seguimiento nutricional digitalizado sin complejidad operativa.

La propuesta de valor se resume en:

> “Una plataforma web para que gimnasios incorporen nutricionistas, turnos, consultas, planes alimentarios, progreso e IA nutricional en un único sistema simple, seguro y orientado al socio.”

Valor para el gimnasio:

- Diferenciación frente a competidores.
- Mayor profesionalización del servicio.
- Centralización operativa.
- Mejora en la fidelización de socios.
- Métricas sobre uso del servicio nutricional.
- Posibilidad de sumar ingresos indirectos o servicios complementarios.

Valor para el socio:

- Acceso simple a nutricionistas del gimnasio.
- Reserva de turnos desde la web.
- Plan alimentario disponible en su perfil.
- Historial de consultas y evolución.
- Recordatorios y notificaciones.
- Experiencia más ordenada y personalizada.

Valor para el nutricionista:

- Agenda organizada.
- Acceso a ficha nutricional del socio.
- Registro de consultas y mediciones.
- Creación y edición de planes alimentarios.
- Historial centralizado.
- Apoyo de IA para ideas de comidas o recetas.

---

## 5. Visión estratégica

### 5.1 Misión

Brindar a gimnasios una herramienta digital que les permita incorporar y gestionar servicios nutricionales de forma profesional, simple y segura, mejorando la experiencia de sus socios y fortaleciendo su propuesta de bienestar.

### 5.2 Visión

Convertirse en una plataforma de referencia para gimnasios que desean profesionalizar la atención nutricional de sus socios mediante tecnología web, trazabilidad de datos e inteligencia artificial asistiva.

### 5.3 Propósito estratégico

Transformar la forma en que los gimnasios integran la nutrición dentro de su servicio, pasando de una gestión informal y dispersa a una experiencia digital centralizada, medible y personalizada.

### 5.4 Objetivo general del sistema

Desarrollar un sistema web B2B para gimnasios que permita gestionar servicios nutricionales asociados a sus socios, incluyendo administración de nutricionistas, agenda de turnos, ficha nutricional, consultas, planes alimentarios, seguimiento de progreso, notificaciones e inteligencia artificial como herramienta de apoyo profesional.

### 5.5 Objetivos específicos

- Permitir al gimnasio registrar y administrar nutricionistas asociados.
- Permitir al socio visualizar nutricionistas disponibles y reservar turnos.
- Permitir al socio completar y mantener actualizada su ficha de salud/nutricional.
- Permitir al nutricionista consultar la ficha del socio antes y durante la atención.
- Permitir registrar consultas nutricionales, observaciones, mediciones y adjuntos.
- Permitir crear, editar, eliminar y consultar planes alimentarios.
- Permitir validar planes contra alergias, restricciones o contraindicaciones registradas.
- Permitir visualizar el progreso del socio a partir de mediciones registradas.
- Permitir enviar notificaciones automáticas sobre turnos, consultas y planes.
- Incorporar IA para sugerir ideas de comidas o recetas bajo validación profesional.
- Garantizar seguridad, privacidad, auditoría y control de accesos por rol.
- Proveer al gimnasio indicadores básicos de uso del módulo nutricional.

### 5.6 Posicionamiento buscado

NutriFit Supervisor debe posicionarse como una solución simple, moderna y especializada para gimnasios que desean ofrecer nutrición profesional dentro de su servicio, sin transformarse en un sistema médico complejo ni en una plataforma genérica de gestión administrativa.

---

## 6. Alcance ajustado del sistema

### 6.1 Alcance general

El sistema a construir debe centrarse en la **gestión nutricional dentro del gimnasio**.

Esto incluye la relación entre:

- Gimnasio.
- Socio.
- Nutricionista.
- Asistente/recepción.
- Administrador.
- IA asistiva.
- Notificaciones.

El sistema debe permitir que el gimnasio organice la prestación nutricional y que el socio pueda acceder a esa prestación desde una plataforma web.

### 6.2 Incluido en el alcance

El sistema debe incluir:

- Login y autenticación de usuarios.
- Gestión multi-gimnasio o multi-tenant.
- Roles y permisos.
- Administración de nutricionistas.
- Configuración de horarios y disponibilidad de nutricionistas.
- Gestión de socios.
- Ficha de salud/nutricional del socio.
- Reserva, cancelación y reprogramación de turnos nutricionales.
- Agenda diaria del nutricionista.
- Check-in o registro de asistencia del socio.
- Detección de ausencias.
- Inicio y cierre de consulta nutricional.
- Registro de observaciones nutricionales.
- Registro de mediciones físicas relevantes para nutrición.
- Adjuntos asociados a consultas, si corresponde.
- Creación de planes alimentarios.
- Edición de planes alimentarios con auditoría.
- Eliminación lógica de planes alimentarios.
- Validación de planes contra alergias y restricciones.
- Visualización del plan por parte del socio.
- Visualización del historial nutricional por parte del socio.
- Visualización del progreso del socio.
- IA para sugerir ideas de comidas o recetas.
- Notificaciones internas o por email.
- Reportes básicos para administración.
- Auditoría de acciones relevantes.
- Configuración básica del gimnasio.
- Soporte y onboarding operativo.

### 6.3 Excluido del alcance

No debe incluirse en esta versión:

- Entrenadores como usuarios del sistema.
- Gestión de rutinas de entrenamiento.
- Creación de ejercicios.
- Seguimiento de entrenamiento.
- Asignación de entrenadores a socios.
- Coordinación entre entrenamiento y nutrición.
- Deportólogos.
- Médicos del deporte.
- Consultas clínicas médicas no nutricionales.
- Diagnósticos médicos.
- Prescripción médica.
- Historia clínica médica completa.
- Pagos de consultas nutricionales dentro del sistema.
- Facturación, impuestos o liquidaciones profesionales.
- Aplicación móvil nativa.
- Soporte multilingüe.
- Importación masiva de datos externos en la primera versión.
- Mensajería sincrónica tipo chat interno en tiempo real.
- Videollamadas integradas.
- WhatsApp como canal obligatorio en el MVP.
- Marketplace abierto de nutricionistas externo al gimnasio.

### 6.4 Funcionalidades que podrían quedar para futuras versiones

Estas funcionalidades pueden considerarse a futuro, pero no forman parte del alcance inicial:

- Pasarela de pagos para consultas.
- Facturación automática.
- Integración con WhatsApp.
- Aplicación móvil nativa.
- Marketplace de profesionales.
- Integración con wearables.
- Recordatorios avanzados multicanal.
- Reportes comerciales avanzados.
- Analítica predictiva de abandono.
- Módulo de entrenamiento.
- Integración con otros profesionales de salud.
- Teleconsulta o videollamada.

---

## 7. Actores del sistema

### 7.1 Administrador del gimnasio

Representa al dueño, encargado o responsable principal del gimnasio dentro del sistema.

Responsabilidades:

- Configurar datos generales del gimnasio.
- Administrar usuarios internos.
- Administrar nutricionistas.
- Ver reportes generales.
- Configurar parámetros operativos.
- Consultar métricas de uso del módulo nutricional.
- Gestionar permisos generales.

No debe acceder indiscriminadamente a datos nutricionales sensibles salvo que su rol y el marco legal-operativo lo justifiquen. La información sensible debe estar restringida principalmente al nutricionista correspondiente.

### 7.2 Asistente / Recepcionista

Es el usuario operativo del gimnasio que ayuda a administrar la agenda y la atención diaria.

Responsabilidades:

- Crear o actualizar datos básicos de socios, si el gimnasio lo permite.
- Registrar nutricionistas, según permisos asignados.
- Gestionar turnos manuales.
- Reprogramar o cancelar turnos por solicitud del socio.
- Marcar asistencia o ausencia.
- Ver agenda diaria por nutricionista.
- Ayudar al socio ante problemas operativos.

Limitaciones:

- No debe acceder a contenido nutricional sensible.
- No debe modificar planes alimentarios.
- No debe registrar observaciones profesionales.
- No debe usar IA nutricional para generar recomendaciones.

### 7.3 Socio

Es el usuario final que asiste al gimnasio y utiliza el servicio nutricional ofrecido por la institución.

Responsabilidades y capacidades:

- Iniciar sesión con credenciales propias.
- Ver nutricionistas disponibles.
- Consultar perfil y disponibilidad de nutricionistas.
- Reservar turno.
- Cancelar o reprogramar turno, según políticas del gimnasio.
- Completar ficha de salud/nutricional.
- Actualizar datos personales permitidos.
- Ver su plan alimentario vigente.
- Ver historial de planes, si está habilitado.
- Ver observaciones compartidas por el nutricionista.
- Ver evolución de peso, medidas u otros indicadores registrados.
- Recibir notificaciones.
- Confirmar asistencia a turnos, si se implementa.
- Descargar o imprimir su plan alimentario, si está habilitado.

Limitaciones:

- No puede crear ni editar planes alimentarios.
- No puede modificar registros profesionales.
- No puede ver datos de otros socios.
- No puede acceder a métricas administrativas del gimnasio.

### 7.4 Nutricionista

Es el profesional de salud incluido en esta versión del sistema.

Responsabilidades:

- Iniciar sesión con credenciales propias.
- Consultar su agenda.
- Ver turnos asignados.
- Ver ficha nutricional del socio asociado al turno.
- Iniciar una consulta cuando el socio esté presente.
- Registrar observaciones.
- Registrar mediciones.
- Cargar adjuntos si corresponde.
- Finalizar consulta.
- Crear plan alimentario.
- Editar plan alimentario.
- Eliminar plan alimentario con motivo.
- Ver historial del socio.
- Ver progreso del socio.
- Usar IA para sugerir ideas de comidas o recetas.
- Validar o descartar sugerencias de IA.
- Decidir qué información queda visible para el socio.

Limitaciones:

- Solo puede acceder a socios asignados o vinculados por turno.
- No puede ver datos de socios que no le correspondan.
- No puede administrar globalmente el gimnasio salvo que tenga permisos adicionales.
- No puede delegar responsabilidad profesional en la IA.

### 7.5 Soporte NutriFit Supervisor

Representa al equipo proveedor del software.

Responsabilidades:

- Configurar gimnasios nuevos.
- Acompañar el onboarding inicial.
- Resolver problemas técnicos.
- Dar soporte a usuarios autorizados.
- Mantener el sistema operativo.
- Monitorear errores.
- Gestionar actualizaciones.

Debe tener acceso limitado, auditado y justificado a entornos o datos sensibles.

### 7.6 Motor de inteligencia artificial

Es un componente del sistema, no un actor humano.

Responsabilidades:

- Recibir parámetros nutricionales no identificatorios.
- Sugerir ideas de comidas.
- Sugerir recetas a partir de comidas del plan.
- Devolver respuestas estructuradas.
- Evitar usar datos personales innecesarios.
- Respetar restricciones y alergias informadas.

Limitaciones:

- No diagnostica.
- No prescribe tratamientos.
- No reemplaza al nutricionista.
- No debe exponer datos personales del socio.
- No debe publicar recomendaciones directamente al socio sin validación profesional.

### 7.7 Sistema de notificaciones

Componente responsable de emitir avisos automáticos.

Eventos posibles:

- Turno reservado.
- Turno cancelado.
- Turno reprogramado.
- Recordatorio de turno.
- Consulta finalizada.
- Plan alimentario creado.
- Plan alimentario editado.
- Plan alimentario eliminado.
- Ficha incompleta.
- Seguimiento pendiente.

---

## 8. Módulos principales del sistema

### 8.1 Autenticación y acceso

Permite que cada usuario ingrese al sistema de forma segura según su rol.

Debe incluir:

- Login con email y contraseña.
- Contraseñas seguras almacenadas con hash.
- Recuperación de contraseña.
- Control de sesión.
- Cierre de sesión.
- Bloqueo o desactivación de usuarios.
- Validación de permisos por rol.
- Auditoría de accesos relevantes.

Roles mínimos:

- Administrador.
- Asistente/Recepcionista.
- Nutricionista.
- Socio.
- Soporte interno.

### 8.2 Gestión multi-gimnasio / tenant

El sistema debe poder operar para múltiples gimnasios, separando los datos de cada uno.

Cada gimnasio debe tener:

- Datos identificatorios.
- Configuración propia.
- Usuarios propios.
- Socios propios.
- Nutricionistas propios.
- Turnos propios.
- Planes propios.
- Parámetros operativos propios.

Regla central:

> Ningún gimnasio debe poder acceder a información de otro gimnasio.

### 8.3 Gestión de usuarios y roles

Permite administrar las cuentas que participan en el sistema.

Debe incluir:

- Alta de usuarios.
- Edición de datos.
- Activación/desactivación.
- Asignación de rol.
- Gestión de permisos.
- Restricciones por tenant.
- Auditoría de cambios.

### 8.4 Gestión de socios

Permite administrar la información básica del socio.

Datos posibles:

- Nombre y apellido.
- DNI u otro identificador.
- Fecha de nacimiento.
- Edad.
- Sexo/género, si se requiere.
- Teléfono.
- Email.
- Estado del socio.
- Fecha de alta.
- Gimnasio al que pertenece.

El socio debe tener un perfil único dentro del gimnasio. Desde ese perfil puede acceder a turnos, ficha nutricional, planes y progreso.

### 8.5 Ficha de salud/nutricional

Es una pieza central del sistema. Contiene los datos que permiten al nutricionista entender el contexto del socio antes de crear un plan.

Debe incluir como mínimo:

- Altura.
- Peso actual.
- Objetivo personal.
- Nivel de actividad física declarada.
- Alergias.
- Restricciones alimentarias.
- Patologías relevantes informadas.
- Medicación relevante informada, si corresponde.
- Hábitos generales.
- Si fuma.
- Si consume alcohol.
- Observaciones libres.
- Fecha de última actualización.

Reglas importantes:

- El socio debe completar la ficha antes de solicitar o asistir a su primera consulta nutricional, según política definida.
- Las alergias y restricciones deben almacenarse de forma estructurada cuando sea posible.
- Los cambios deben quedar auditados.
- El nutricionista debe poder consultar la ficha durante la atención.
- La ficha no debe ser visible para usuarios no autorizados.

### 8.6 Gestión de nutricionistas

Permite al gimnasio registrar y administrar profesionales de nutrición.

Datos posibles:

- Nombre y apellido.
- Email.
- Teléfono.
- Matrícula o credencial profesional.
- Especialidad: nutrición.
- Presentación profesional.
- Estado: activo/inactivo.
- Horarios de atención.
- Duración predeterminada de turnos.
- Observaciones administrativas.

Funciones:

- Crear nutricionista.
- Editar nutricionista.
- Activar/desactivar nutricionista.
- Configurar agenda.
- Ver disponibilidad.
- Ver cantidad de turnos asignados.

Reglas:

- Un nutricionista inactivo no puede recibir nuevos turnos.
- Todo nutricionista debe pertenecer a un gimnasio/tenant.
- Debe contar con credenciales de acceso.
- Debe tener agenda configurada para recibir reservas.

### 8.7 Agenda y turnos nutricionales

Permite organizar las consultas entre socios y nutricionistas.

Estados posibles del turno:

- Programado.
- Presente.
- En curso.
- Realizado.
- Cancelado.
- Ausente.

Funciones para el socio:

- Ver nutricionistas disponibles.
- Ver horarios disponibles.
- Reservar turno.
- Cancelar turno.
- Reprogramar turno.
- Ver turnos pasados y futuros.
- Recibir recordatorios.

Funciones para asistente/recepción:

- Crear turno manualmente.
- Reprogramar turno.
- Cancelar turno.
- Marcar presente.
- Marcar ausente.
- Ver agenda del día.
- Filtrar por nutricionista, horario o socio.

Funciones para nutricionista:

- Ver agenda propia.
- Ver turnos del día.
- Acceder a ficha del socio asociado.
- Iniciar consulta si el socio está presente.

Reglas:

- No debe permitirse doble reserva en el mismo horario para el mismo nutricionista.
- No debe permitirse que el socio tenga dos turnos iguales con el mismo profesional y horario.
- La política de cancelación/reprogramación debe ser configurable por gimnasio.
- La reprogramación debe quedar auditada.
- La cancelación debe registrar motivo.

### 8.8 Recepción, asistencia y ausencias

Este módulo permite controlar si el socio asistió al turno.

Funciones:

- Ver turnos del día.
- Marcar check-in.
- Registrar hora de llegada.
- Marcar ausencia manualmente.
- Detectar ausencia automática si se supera el umbral definido.

Reglas:

- El check-in cambia el turno a “Presente”.
- Un turno presente habilita al nutricionista a iniciar la consulta.
- Un turno cancelado, ausente o realizado no puede pasar a presente sin una acción administrativa justificada.
- El umbral de ausencia automática puede configurarse, por ejemplo, en 30 minutos.

### 8.9 Consulta nutricional

Es el módulo donde el nutricionista registra la atención del socio.

Flujo básico:

1. El socio reserva un turno.
2. El socio asiste al gimnasio.
3. Recepción marca el check-in.
4. El turno pasa a estado “Presente”.
5. El nutricionista inicia la consulta.
6. El sistema registra el inicio.
7. El nutricionista carga observaciones, mediciones y datos relevantes.
8. El nutricionista puede crear o actualizar el plan alimentario.
9. El nutricionista finaliza la consulta.
10. El turno queda realizado.
11. El sistema notifica al socio si corresponde.

Datos posibles de consulta:

- Fecha y hora.
- Nutricionista.
- Socio.
- Peso.
- Medidas corporales.
- IMC, si se calcula.
- Objetivo trabajado.
- Observaciones nutricionales.
- Recomendaciones.
- Adjuntos.
- Próximos pasos.

Reglas:

- Solo se puede iniciar consulta si el turno está presente.
- Una consulta finalizada no debe poder editarse libremente.
- Se pueden permitir anexos posteriores con auditoría.
- Toda modificación relevante debe registrar usuario, fecha y motivo.

### 8.10 Plan alimentario

El plan alimentario es uno de los módulos centrales del sistema.

Debe permitir:

- Crear plan.
- Editar plan.
- Eliminar plan con borrado lógico.
- Ver plan vigente.
- Ver historial de planes.
- Organizar por días.
- Organizar por comidas.
- Agregar alimentos o ítems.
- Agregar cantidades y unidades.
- Agregar notas.
- Agregar objetivo nutricional.
- Validar contra restricciones.
- Notificar al socio.
- Exportar o imprimir, si se define.

Estructura mínima sugerida:

- Plan alimentario.
- Día del plan.
- Comida del día.
- Ítem/alimento.
- Cantidad.
- Unidad.
- Notas.
- Macros opcionales.

Reglas:

- Un socio debe tener como máximo un plan activo a la vez por gimnasio o por nutricionista, según decisión final de negocio.
- Crear un plan requiere al menos un día y una comida.
- Editar un plan debe registrar auditoría.
- Eliminar un plan no debe borrarlo físicamente; debe aplicarse soft delete.
- Si el plan contiene ingredientes prohibidos por alergias o restricciones, debe bloquearse el guardado o mostrar incidencias críticas.
- El socio solo puede ver el plan; no puede editarlo.

### 8.11 Inteligencia artificial nutricional

La IA debe funcionar como asistente del nutricionista.

Usos principales:

- Sugerir ideas de comidas.
- Generar recetas a partir de comidas del plan.
- Proponer alternativas compatibles con restricciones.
- Ayudar a acelerar la creación de planes.
- Detectar posibles conflictos con restricciones declaradas.

Entrada mínima para sugerir ideas:

- Objetivo nutricional.
- Restricciones o alergias.
- Información extra relevante.

Salida esperada:

- Nombre de la comida.
- Ingredientes.
- Cantidades.
- Unidades.
- Pasos simples.
- Advertencia de que es una sugerencia asistida.

Reglas:

- La IA no debe recibir datos personales identificatorios del socio.
- La IA no debe publicar nada directamente al socio.
- El nutricionista debe aceptar, editar o descartar la sugerencia.
- Si la sugerencia viola restricciones, debe descartarse o marcarse como inválida.
- Los errores de IA no deben impedir que el nutricionista trabaje manualmente.
- La IA debe ser tratada como apoyo, no como autoridad profesional.

### 8.12 Progreso del socio

Permite visualizar la evolución del socio a partir de datos registrados en consultas.

Indicadores posibles:

- Peso.
- Medidas corporales.
- IMC.
- Evolución por fecha.
- Historial de consultas.
- Planes vigentes e históricos.
- Observaciones compartidas.

Visualizaciones posibles:

- Tabla histórica.
- Gráficos de evolución.
- Comparación entre mediciones.
- Exportación CSV/PDF, si se define.

Reglas:

- El progreso debe basarse en datos cargados por el nutricionista.
- El socio solo debe ver sus propios datos.
- El nutricionista solo debe ver los datos de socios asociados.
- El administrador puede ver métricas agregadas, no necesariamente datos sensibles individuales.

### 8.13 Notificaciones

El sistema debe emitir avisos relevantes para mejorar la continuidad del servicio.

Notificaciones mínimas:

- Confirmación de turno reservado.
- Cancelación de turno.
- Reprogramación de turno.
- Recordatorio previo al turno.
- Plan alimentario creado.
- Plan alimentario editado.
- Plan alimentario eliminado.
- Consulta finalizada.
- Ficha de salud incompleta.

Canales posibles:

- Notificación interna en la plataforma.
- Email.
- WhatsApp como extensión futura.

Reglas:

- Las notificaciones deben estar asociadas al gimnasio correspondiente.
- Deben respetar permisos y privacidad.
- No deben exponer información sensible innecesaria.
- Las plantillas deberían ser configurables en futuras versiones.

### 8.14 Reportes y métricas

El sistema debe brindar al gimnasio información útil para evaluar el uso del servicio nutricional.

Métricas básicas:

- Cantidad de turnos por período.
- Turnos realizados.
- Turnos cancelados.
- Ausencias.
- Uso de agenda por nutricionista.
- Socios con plan activo.
- Socios sin ficha completa.
- Consultas realizadas.
- Planes creados.
- Actividad general del módulo.

Importante:

- Los reportes para administración deben priorizar indicadores operativos y agregados.
- Los datos clínicos o nutricionales sensibles no deben exponerse de forma innecesaria al administrador.

### 8.15 Configuración operativa del gimnasio

Cada gimnasio debe poder definir ciertos parámetros.

Parámetros posibles:

- Horarios generales.
- Duración predeterminada de turnos.
- Ventana mínima de cancelación.
- Ventana mínima de reprogramación.
- Umbral de ausencia automática.
- Canales de notificación habilitados.
- Datos de contacto.
- Branding básico.
- Políticas internas visibles para socios.

---

## 9. Flujos principales del negocio

### 9.1 Alta inicial de gimnasio

1. Soporte NutriFit o administrador interno crea el gimnasio en la plataforma.
2. Se configuran datos básicos del gimnasio.
3. Se crea el usuario administrador.
4. Se definen parámetros iniciales.
5. Se habilita el acceso al sistema.
6. Se realiza capacitación inicial.

Resultado esperado:

- El gimnasio queda listo para cargar nutricionistas, socios y comenzar a operar.

### 9.2 Alta de nutricionista

1. Administrador o asistente ingresa al módulo de profesionales.
2. Selecciona crear nutricionista.
3. Carga datos personales y profesionales.
4. Configura credenciales.
5. Define horarios de atención.
6. Guarda el perfil.
7. El sistema habilita al nutricionista si los datos requeridos están completos.

Resultado esperado:

- El nutricionista puede iniciar sesión y recibir turnos.

### 9.3 Registro o alta de socio

1. El socio es creado por el gimnasio o se registra según política definida.
2. Se asocia al tenant/gimnasio correspondiente.
3. Se generan credenciales.
4. El socio ingresa por primera vez.
5. Completa o valida sus datos personales.
6. Completa su ficha de salud/nutricional.

Resultado esperado:

- El socio queda habilitado para solicitar turnos nutricionales.

### 9.4 Reserva de turno nutricional

1. El socio ingresa al sistema.
2. Accede a la sección de nutrición.
3. Visualiza nutricionistas disponibles.
4. Selecciona nutricionista.
5. Consulta horarios disponibles.
6. Selecciona fecha y horario.
7. Confirma la reserva.
8. El sistema valida disponibilidad.
9. El sistema crea el turno.
10. El sistema envía notificación.

Resultado esperado:

- El turno queda programado y visible para socio, nutricionista y recepción.

### 9.5 Check-in del socio

1. El socio llega al gimnasio.
2. Recepción busca el turno del día.
3. Recepción marca asistencia.
4. El turno pasa a estado presente.
5. El nutricionista queda habilitado para iniciar consulta.

Resultado esperado:

- La consulta puede comenzar.

### 9.6 Consulta nutricional

1. El nutricionista abre su agenda.
2. Selecciona el turno presente.
3. Accede a la ficha nutricional del socio.
4. Inicia consulta.
5. Registra observaciones y mediciones.
6. Crea o actualiza plan alimentario.
7. Puede usar IA para sugerir ideas.
8. Valida manualmente toda recomendación.
9. Finaliza consulta.
10. El sistema guarda historial y notifica al socio.

Resultado esperado:

- La atención queda registrada y el socio puede consultar su información habilitada.

### 9.7 Creación de plan alimentario

1. El nutricionista abre el perfil del socio.
2. Consulta ficha, objetivos y restricciones.
3. Crea un nuevo plan.
4. Define objetivo nutricional.
5. Agrega días y comidas.
6. Agrega alimentos, cantidades y notas.
7. Solicita sugerencias de IA si lo desea.
8. Revisa sugerencias.
9. Acepta, edita o descarta propuestas.
10. Guarda el plan.
11. El sistema valida restricciones.
12. El sistema notifica al socio.

Resultado esperado:

- El socio tiene un plan alimentario vigente y visible en su perfil.

### 9.8 Seguimiento de progreso

1. El nutricionista registra mediciones en cada consulta.
2. El sistema almacena mediciones históricas.
3. El socio accede a su sección de progreso.
4. Visualiza evolución en tablas o gráficos.
5. El nutricionista puede consultar histórico para ajustar el plan.

Resultado esperado:

- El seguimiento nutricional tiene trazabilidad y continuidad.

### 9.9 Reprogramación o cancelación de turno

1. El socio o asistente selecciona un turno programado.
2. Solicita cancelación o reprogramación.
3. El sistema valida la política del gimnasio.
4. Si corresponde, permite la acción.
5. Registra motivo y auditoría.
6. Notifica a las partes involucradas.

Resultado esperado:

- La agenda queda actualizada y trazable.

---

## 10. Información que administra el sistema

### 10.1 Datos del gimnasio

- Nombre.
- Sede.
- Dirección.
- Contacto.
- Horarios.
- Configuración operativa.
- Branding.
- Estado del tenant.

### 10.2 Datos de usuarios

- Nombre.
- Email.
- Rol.
- Estado.
- Gimnasio asociado.
- Fecha de creación.
- Último acceso.

### 10.3 Datos de socios

- Datos personales.
- Datos de contacto.
- Estado.
- Ficha nutricional.
- Turnos.
- Consultas.
- Planes.
- Progreso.

### 10.4 Datos de nutricionistas

- Datos personales.
- Datos profesionales.
- Matrícula.
- Agenda.
- Disponibilidad.
- Turnos.
- Socios atendidos.
- Estado.

### 10.5 Datos de turnos

- Socio.
- Nutricionista.
- Fecha.
- Hora.
- Duración.
- Estado.
- Motivo de cancelación.
- Check-in.
- Confirmación.
- Auditoría.

### 10.6 Datos de consultas

- Turno asociado.
- Fecha.
- Nutricionista.
- Observaciones.
- Mediciones.
- Adjuntos.
- Estado.
- Fecha de cierre.
- Auditoría.

### 10.7 Datos de planes alimentarios

- Socio.
- Nutricionista.
- Objetivo.
- Estado.
- Fecha de creación.
- Fecha de actualización.
- Días.
- Comidas.
- Ítems.
- Cantidades.
- Notas.
- Restricciones validadas.
- Historial de cambios.

### 10.8 Datos de IA

- Solicitud realizada.
- Parámetros enviados.
- Respuesta recibida.
- Estado de aceptación, edición o descarte.
- Usuario solicitante.
- Fecha.
- Errores, si existieron.

No deben almacenarse prompts con datos personales innecesarios.

### 10.9 Datos de auditoría

- Usuario.
- Acción.
- Fecha y hora.
- Entidad afectada.
- Valor anterior, cuando corresponda.
- Valor nuevo, cuando corresponda.
- IP o información técnica disponible.
- Motivo, si corresponde.

---

## 11. Reglas de negocio principales

### 11.1 Reglas generales

- El sistema opera por gimnasio/tenant.
- Los datos de cada gimnasio deben estar aislados.
- Toda acción relevante debe registrar auditoría.
- Las funcionalidades se controlan mediante roles y permisos.
- La interfaz debe estar disponible en español.
- El sistema debe ser accesible desde navegadores modernos.

### 11.2 Reglas de roles

- El socio gestiona sus turnos, ficha y visualiza su información.
- El nutricionista gestiona su agenda, consultas y planes de sus socios vinculados.
- La recepción gestiona turnos y asistencia, pero no contenido nutricional sensible.
- El administrador configura el gimnasio y accede a reportes operativos.
- Soporte accede solo cuando sea necesario y con auditoría.

### 11.3 Reglas de nutricionistas

- Para dar de alta un nutricionista se requiere información profesional mínima.
- Un nutricionista inactivo no puede recibir turnos.
- La agenda define disponibilidad.
- No se pueden reservar turnos fuera de agenda.
- El nutricionista solo ve información de socios vinculados.

### 11.4 Reglas de socios

- El socio solo puede ver sus propios datos.
- El socio puede solicitar, cancelar o reprogramar turnos según política del gimnasio.
- El socio debe mantener actualizada su ficha.
- Los cambios de ficha deben quedar auditados.
- El socio puede ver su plan vigente y progreso.

### 11.5 Reglas de ficha nutricional

- La ficha debe incluir altura, peso, alergias/restricciones y objetivos como datos mínimos.
- Las restricciones deben validarse contra planes alimentarios.
- Si existen contraindicaciones relevantes, el sistema debe advertir o bloquear acciones que las contradigan.
- La ficha debe estar protegida por permisos.

### 11.6 Reglas de turnos

- Estados válidos: programado, presente, en curso, realizado, cancelado, ausente.
- La confirmación del socio no debe cambiar necesariamente el estado del turno; puede registrarse como dato adicional.
- No se permiten solapamientos para el mismo nutricionista.
- No se permite doble reserva idéntica.
- La reprogramación mantiene trazabilidad.
- La cancelación requiere motivo.
- La política de cancelación es configurable.

### 11.7 Reglas de consulta

- Solo puede iniciarse una consulta si el turno está presente.
- Al iniciar consulta, el turno puede pasar a en curso.
- Al finalizar consulta, el turno queda realizado.
- Una consulta finalizada queda bloqueada para edición normal.
- Se pueden permitir anexos posteriores con auditoría.

### 11.8 Reglas de plan alimentario

- Un socio puede tener un único plan activo, salvo decisión posterior distinta.
- Crear plan requiere al menos un día y una comida.
- Editar plan requiere auditoría.
- Eliminar plan debe ser borrado lógico.
- El plan debe validarse contra alergias y restricciones.
- El socio no puede editar el plan.
- El nutricionista es responsable profesional del contenido final.

### 11.9 Reglas de IA

- La IA es asistiva.
- Toda propuesta requiere validación del nutricionista.
- La IA no debe recibir datos personales identificatorios.
- La IA debe respetar restricciones informadas.
- Si la IA falla, el sistema debe permitir continuar manualmente.
- Las sugerencias aceptadas deben poder distinguirse o auditarse.

### 11.10 Reglas de notificaciones

- El sistema debe notificar eventos relevantes.
- Las notificaciones no deben exponer datos sensibles innecesarios.
- Los recordatorios deben respetar configuración del gimnasio.
- La creación o modificación de plan debe notificar al socio.

### 11.11 Reglas de visibilidad

- El socio ve solo su información.
- El nutricionista ve solo socios vinculados.
- Recepción ve información operativa.
- Administración ve información operativa y agregada.
- Datos nutricionales sensibles deben protegerse.

---

## 12. Requerimientos funcionales resumidos

### 12.1 Para administrador

- Iniciar sesión.
- Gestionar datos del gimnasio.
- Gestionar usuarios.
- Gestionar roles.
- Gestionar nutricionistas.
- Configurar parámetros de turnos.
- Ver reportes operativos.
- Consultar actividad general.
- Configurar branding básico.

### 12.2 Para asistente/recepción

- Iniciar sesión.
- Ver agenda diaria.
- Buscar socio.
- Crear turno manual.
- Cancelar turno.
- Reprogramar turno.
- Marcar presente.
- Marcar ausente.
- Consultar datos de contacto.
- Ayudar al socio con gestión operativa.

### 12.3 Para socio

- Iniciar sesión.
- Completar ficha nutricional.
- Editar ficha permitida.
- Ver nutricionistas disponibles.
- Ver disponibilidad horaria.
- Reservar turno.
- Cancelar turno.
- Reprogramar turno.
- Ver turnos pasados y futuros.
- Ver plan alimentario vigente.
- Ver historial permitido.
- Ver progreso.
- Recibir notificaciones.

### 12.4 Para nutricionista

- Iniciar sesión.
- Ver agenda.
- Filtrar turnos.
- Ver ficha del socio.
- Iniciar consulta.
- Registrar observaciones.
- Registrar mediciones.
- Cargar adjuntos.
- Finalizar consulta.
- Crear plan.
- Editar plan.
- Eliminar plan.
- Validar restricciones.
- Usar IA para sugerencias.
- Ver progreso.
- Exportar información permitida.

### 12.5 Para IA

- Recibir parámetros nutricionales.
- Generar ideas de comida.
- Generar recetas.
- Responder en formato estructurado.
- Evitar datos personales.
- Manejar errores sin bloquear el sistema.

### 12.6 Para notificaciones

- Enviar avisos de turnos.
- Enviar recordatorios.
- Avisar cambios de turno.
- Avisar plan creado/editado/eliminado.
- Avisar consulta finalizada.
- Registrar estado de envío.

---

## 13. Requerimientos no funcionales

### 13.1 Seguridad

- Autenticación obligatoria.
- Contraseñas con hash y salt.
- HTTPS obligatorio.
- Control de acceso por rol.
- Separación de datos por tenant.
- Auditoría de acciones sensibles.
- Protección de datos nutricionales y de salud.

### 13.2 Privacidad

- Minimización de datos personales.
- Acceso limitado según necesidad.
- No enviar PII a IA.
- No exponer información sensible en notificaciones.
- Historial de accesos a datos sensibles.

### 13.3 Rendimiento

- El sistema debe responder de forma fluida en operaciones comunes.
- Las operaciones principales deberían responder en menos de 2 segundos en condiciones normales.
- Las operaciones de IA pueden tener mayor latencia, pero deben informar estado de carga.
- El sistema debe soportar usuarios concurrentes de gimnasios medianos.

### 13.4 Disponibilidad

- La plataforma debe estar disponible durante horarios operativos del gimnasio.
- Debe tolerar errores parciales sin pérdida de datos críticos.
- Debe contar con mecanismos de respaldo.

### 13.5 Usabilidad

- Interfaz clara y simple.
- Diseño responsive.
- Textos en español.
- Mensajes de error entendibles.
- Acciones principales visibles.
- Flujo simple para usuarios no técnicos.

### 13.6 Escalabilidad

- Arquitectura modular.
- Posibilidad de sumar gimnasios.
- Posibilidad de sumar más nutricionistas.
- Posibilidad de agregar módulos futuros sin reescribir la base.

### 13.7 Mantenibilidad

- Código organizado por módulos.
- Separación de responsabilidades.
- Validaciones centralizadas.
- Logs estructurados.
- Pruebas unitarias e integrales en flujos críticos.
- Documentación técnica mínima.

### 13.8 Integridad de datos

- Validación de entradas.
- Transacciones en operaciones críticas.
- Soft delete para información sensible o histórica.
- Persistencia de turnos, consultas, planes y auditoría.
- Recuperación ante errores.

### 13.9 Compatibilidad

- Navegadores modernos: Chrome, Firefox, Edge, Safari.
- Uso desde desktop, notebook, tablet y celular.
- No requiere app nativa.

---

## 14. Inteligencia artificial: alcance y límites

### 14.1 Rol de la IA

La IA debe ser un asistente de productividad para el nutricionista. Su objetivo es acelerar tareas, sugerir alternativas y ayudar a construir planes más rápido, pero nunca reemplazar el criterio profesional.

### 14.2 Qué puede hacer

- Sugerir ideas de comidas.
- Proponer recetas.
- Adaptar sugerencias a restricciones.
- Generar alternativas para un objetivo nutricional.
- Ayudar a completar un plan.
- Detectar posibles ingredientes incompatibles.

### 14.3 Qué no puede hacer

- Diagnosticar enfermedades.
- Prescribir tratamientos.
- Reemplazar al nutricionista.
- Publicar planes automáticamente.
- Tomar decisiones clínicas autónomas.
- Recibir datos personales innecesarios.
- Prometer resultados de salud.

### 14.4 Supervisión humana obligatoria

Toda sugerencia de IA debe pasar por el nutricionista. El profesional debe poder:

- Revisar.
- Editar.
- Aceptar.
- Descartar.
- Reintentar.

La responsabilidad del plan final corresponde al nutricionista, no al sistema.

### 14.5 Seguridad en prompts

Los prompts enviados a IA deben evitar:

- Nombre del socio.
- DNI.
- Email.
- Teléfono.
- Dirección.
- Información identificatoria innecesaria.

Deben usar datos funcionales mínimos:

- Objetivo.
- Restricciones.
- Preferencias.
- Información nutricional relevante no identificatoria.

---

## 15. Experiencia de usuario esperada

### 15.1 Experiencia del gimnasio

El gimnasio debe sentir que el sistema le permite sumar nutrición de manera ordenada sin complejizar su operación.

La experiencia debe ser:

- Simple.
- Clara.
- Profesional.
- Fácil de enseñar al personal.
- Útil para diferenciarse.
- Con métricas suficientes para entender el uso del servicio.

### 15.2 Experiencia del socio

El socio debe poder resolver todo lo nutricional desde su perfil.

Debe poder:

- Entrar fácil.
- Completar su ficha.
- Reservar turno sin pedir ayuda.
- Ver su plan en cualquier momento.
- Entender su progreso.
- Recibir recordatorios.
- Sentir acompañamiento.

### 15.3 Experiencia del nutricionista

El nutricionista debe trabajar con una herramienta que no le agregue fricción.

Debe poder:

- Ver su agenda rápido.
- Acceder a la ficha del socio.
- Registrar la consulta sin complejidad.
- Crear planes de forma ordenada.
- Usar IA cuando le sirva.
- Mantener historial y trazabilidad.

### 15.4 Experiencia de recepción

Recepción debe tener una vista operativa simple.

Debe poder:

- Ver quién tiene turno hoy.
- Marcar presente.
- Reprogramar.
- Cancelar.
- Ayudar al socio.
- No mezclarse con información nutricional sensible.

---

## 16. Modelo operativo del negocio

### 16.1 Incorporación de un gimnasio

El proceso recomendado:

1. Contacto comercial.
2. Demostración del sistema.
3. Relevamiento básico del gimnasio.
4. Alta del tenant.
5. Configuración inicial.
6. Carga de usuarios clave.
7. Carga de nutricionistas.
8. Capacitación.
9. Puesta en marcha controlada.
10. Soporte inicial.

### 16.2 Capacitación

Debe contemplar capacitación para:

- Administrador.
- Recepción/asistente.
- Nutricionistas.
- Socios, mediante guía simple o instructivo.

Materiales sugeridos:

- Guía rápida en PDF o Markdown.
- Videos cortos.
- Preguntas frecuentes.
- Onboarding dentro del sistema.

### 16.3 Soporte

El soporte debe cubrir:

- Problemas de acceso.
- Errores de agenda.
- Dudas sobre uso.
- Incidentes técnicos.
- Revisión de configuración.
- Acompañamiento inicial.

No debe cubrir:

- Decisiones profesionales nutricionales.
- Diagnósticos.
- Diseño de planes alimentarios por parte del proveedor del software.

---

## 17. Modelo comercial recomendado

### 17.1 Venta B2B

La venta debe enfocarse en gimnasios. El discurso comercial no debe centrarse en “software de nutrición” aislado, sino en “una forma de sumar un servicio nutricional profesional al gimnasio”.

### 17.2 Argumentos de venta

- Diferenciación frente a otros gimnasios.
- Mayor valor percibido por el socio.
- Mejor organización interna.
- Turnos y planes centralizados.
- Profesionalización sin grandes inversiones.
- IA como apoyo para agilizar tareas.
- Sistema web, sin instalación.

### 17.3 Posibles planes

Plan inicial:

- 1 sede.
- Cantidad limitada de nutricionistas.
- Agenda y turnos.
- Ficha nutricional.
- Plan alimentario.
- Notificaciones básicas.

Plan profesional:

- Más nutricionistas.
- IA incluida.
- Reportes avanzados.
- Branding.
- Soporte prioritario.

Plan futuro:

- Multi-sede.
- Integraciones.
- WhatsApp.
- Analítica avanzada.

---

## 18. MVP recomendado

El MVP debe concentrarse en entregar el circuito nutricional completo, aunque sea con funcionalidades simples.

### 18.1 Módulos mínimos

1. Autenticación y roles.
2. Tenant/gimnasio.
3. Gestión de socios.
4. Gestión de nutricionistas.
5. Ficha nutricional.
6. Agenda y turnos.
7. Check-in y ausencias.
8. Consulta nutricional.
9. Plan alimentario.
10. Progreso básico.
11. Notificaciones básicas.
12. IA para ideas de comidas.
13. Reportes operativos mínimos.
14. Auditoría.

### 18.2 Flujo MVP completo

El MVP debe permitir este flujo de punta a punta:

1. El gimnasio se encuentra creado en el sistema.
2. El administrador carga un nutricionista.
3. El nutricionista configura o recibe su agenda configurada.
4. El socio ingresa al sistema.
5. El socio completa su ficha nutricional.
6. El socio reserva un turno.
7. Recepción marca asistencia.
8. El nutricionista inicia consulta.
9. El nutricionista registra mediciones y observaciones.
10. El nutricionista crea un plan alimentario.
11. El nutricionista puede usar IA para sugerencias.
12. El sistema valida restricciones.
13. El plan queda visible para el socio.
14. El socio consulta su plan y progreso.
15. El sistema registra auditoría y notifica los eventos principales.

### 18.3 Lo que no debería entrar al MVP

- App móvil nativa.
- Pagos.
- WhatsApp obligatorio.
- Marketplace de nutricionistas.
- Reportes complejos.
- Integraciones externas.
- Gestión de entrenamiento.
- Deportología.
- Chat en tiempo real.

---

## 19. Criterios de aceptación del producto

### 19.1 Criterios funcionales

El producto puede considerarse aceptable si:

- El administrador puede configurar un gimnasio básico.
- Se pueden crear usuarios con roles correctos.
- Se pueden registrar nutricionistas.
- Se puede configurar disponibilidad.
- El socio puede completar ficha.
- El socio puede reservar, cancelar y reprogramar turnos.
- Recepción puede marcar asistencia.
- El nutricionista puede iniciar y finalizar consulta.
- El nutricionista puede registrar observaciones y mediciones.
- El nutricionista puede crear y editar plan alimentario.
- El socio puede ver su plan vigente.
- El socio puede ver su progreso básico.
- La IA puede sugerir ideas bajo validación profesional.
- Se notifican los eventos principales.
- Se respetan permisos por rol.

### 19.2 Criterios de seguridad

- No hay acceso cruzado entre gimnasios.
- Un socio no puede ver datos de otro socio.
- Un nutricionista no puede ver socios no vinculados.
- Recepción no puede ver contenido nutricional sensible.
- Las acciones críticas quedan auditadas.
- La IA no recibe datos personales identificatorios.

### 19.3 Criterios de usabilidad

- El sistema puede usarse desde celular y computadora.
- Los flujos principales son claros.
- Los errores explican qué debe corregirse.
- El usuario no técnico puede operar funciones básicas sin capacitación extensa.

### 19.4 Criterios de datos

- Los turnos mantienen estados consistentes.
- Las consultas finalizadas no se editan sin auditoría.
- Los planes eliminados quedan como histórico.
- Las restricciones alimentarias se validan antes de guardar planes.
- No se pierden datos críticos ante errores simples de sesión.

---

## 20. Supuestos del proyecto

- El gimnasio cuenta con conexión a Internet.
- Los usuarios tienen acceso a un navegador moderno.
- El gimnasio acepta operar el módulo nutricional desde una plataforma web.
- Los nutricionistas tienen conocimientos digitales básicos.
- El gimnasio puede capacitar mínimamente a su personal.
- Los socios pueden utilizar celular, tablet o computadora.
- El gimnasio define sus políticas de cancelación, reprogramación y ausencia.
- El sistema se usará inicialmente en español.
- La IA estará disponible mediante un proveedor o servicio integrable.
- El equipo de desarrollo tendrá acceso a validación funcional durante el proyecto.

---

## 21. Restricciones del proyecto

- No se desarrollará app móvil nativa en la primera versión.
- No se incluirán entrenadores.
- No se incluirán rutinas.
- No se incluirán deportólogos.
- No se incluirá gestión médica general.
- No se incluirán pagos internos por consulta.
- No se incluirá facturación.
- No se incluirá soporte multilingüe.
- No se incluirá importación masiva en el MVP.
- No se dependerá de WhatsApp como canal obligatorio.
- La IA no reemplaza al nutricionista.
- El sistema se dimensiona inicialmente para gimnasios pequeños y medianos.

---

## 22. Riesgos y mitigaciones

### 22.1 Riesgo: confusión de alcance

Los documentos originales mencionan entrenadores y deportólogos, pero el alcance actual los excluye.

Mitigación:

- Mantener este documento como fuente de alcance actual.
- Marcar explícitamente esas funcionalidades como fuera de alcance.
- Evitar diseñar tablas, pantallas o permisos para esos actores en el MVP.

### 22.2 Riesgo: exposición de datos sensibles

El sistema maneja datos de salud/nutrición.

Mitigación:

- Aplicar RBAC estricto.
- Auditar accesos.
- Minimizar datos enviados a IA.
- No exponer información sensible en notificaciones.

### 22.3 Riesgo: mal uso de IA

La IA puede generar recomendaciones incorrectas.

Mitigación:

- Validación profesional obligatoria.
- Disclaimer claro.
- Bloqueo por restricciones.
- Registro de sugerencias aceptadas.

### 22.4 Riesgo: baja adopción del gimnasio

El personal puede resistirse a usar el sistema.

Mitigación:

- Interfaz simple.
- Capacitación breve.
- Flujos claros.
- Soporte inicial.

### 22.5 Riesgo: datos incompletos del socio

Sin ficha completa, el nutricionista trabaja con poca información.

Mitigación:

- Requerir ficha antes del primer turno.
- Mostrar alertas de ficha incompleta.
- Permitir actualización simple.

---

## 23. Decisiones de alcance tomadas

### 23.1 Decisión: enfoque solo nutricional

El sistema queda enfocado exclusivamente en nutrición. Esto implica que el núcleo funcional gira alrededor de nutricionistas, turnos nutricionales, ficha nutricional, consulta, planes alimentarios, progreso e IA de comidas.

### 23.2 Decisión: entrenadores fuera del sistema

No se deben modelar entrenadores como usuarios activos. Tampoco deben existir pantallas, permisos ni casos de uso para entrenadores en esta versión.

Cualquier necesidad de coordinación con entrenamiento queda fuera del sistema actual.

### 23.3 Decisión: deportólogos fuera del sistema

Aunque aparecen en documentos previos, los deportólogos no se incluyen. El único profesional de salud contemplado es el nutricionista.

### 23.4 Decisión: rutinas fuera del sistema

No se crean, editan, visualizan ni coordinan rutinas de entrenamiento. El sistema no debe convertirse en una plataforma de entrenamiento.

### 23.5 Decisión: IA limitada a nutrición

La IA debe trabajar sobre comidas, recetas, restricciones y apoyo al plan alimentario. No debe sugerir rutinas, cargas de entrenamiento ni indicaciones médicas.

### 23.6 Decisión: pagos fuera del MVP

El sistema puede registrar la existencia de servicios nutricionales y turnos, pero no procesa pagos, cobros, facturación ni liquidaciones.

---

## 24. Glosario del dominio

### Gimnasio

Cliente institucional que contrata y utiliza NutriFit Supervisor para ofrecer servicios nutricionales a sus socios.

### Socio

Persona asociada al gimnasio que utiliza la plataforma para reservar turnos, completar ficha, consultar planes y ver progreso.

### Nutricionista

Profesional que atiende al socio, registra consultas, crea planes alimentarios y valida sugerencias de IA.

### Ficha nutricional

Registro estructurado con información relevante del socio para la atención nutricional.

### Turno nutricional

Reserva de fecha y horario entre un socio y un nutricionista.

### Consulta nutricional

Instancia de atención donde el nutricionista registra observaciones, mediciones y decisiones profesionales.

### Plan alimentario

Plan creado por el nutricionista para el socio, organizado por días, comidas e ítems.

### IA asistiva

Componente que genera sugerencias nutricionales bajo validación humana.

### Progreso

Evolución del socio a partir de mediciones y registros realizados durante consultas.

### Tenant

Unidad de separación de datos correspondiente a un gimnasio dentro del sistema SaaS.

### Auditoría

Registro de acciones relevantes realizadas dentro del sistema.

---

## 25. Conclusión

NutriFit Supervisor debe construirse como una plataforma web B2B para gimnasios que quieren sumar y ordenar servicios nutricionales dentro de su propuesta de valor.

El producto no debe intentar resolver todo el universo del fitness. Su foco inicial debe ser claro: **nutrición dentro del gimnasio**. Ese foco permite reducir complejidad, construir un MVP coherente y entregar valor real más rápido.

La versión actual debe concentrarse en que el gimnasio pueda registrar nutricionistas, que los socios puedan reservar turnos y completar su ficha, que el nutricionista pueda atender, registrar consultas y crear planes alimentarios, y que la IA funcione como apoyo controlado para acelerar la generación de ideas de comidas o recetas.

El éxito del sistema dependerá de mantener una experiencia simple, segura y útil para cada rol. El gimnasio necesita orden y valor comercial; el socio necesita claridad y acompañamiento; el nutricionista necesita herramientas que agilicen su trabajo sin reemplazar su criterio profesional.

La decisión más importante para esta etapa es sostener el alcance: sin entrenadores, sin rutinas y sin deportólogos. Esto convierte a NutriFit Supervisor en una solución más enfocada, más fácil de desarrollar y más consistente con el objetivo de construir primero un módulo nutricional sólido.
