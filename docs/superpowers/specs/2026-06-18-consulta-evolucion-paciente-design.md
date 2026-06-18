# Spec: Consulta Guiada y Ficha Longitudinal del Paciente

> **Fecha**: 2026-06-18
> **Estado**: Diseño aprobado por el usuario, pendiente de revisión del spec
> **Alcance**: experiencia completa de consulta, medición, evolución, fotos por sesión y ficha longitudinal

## Decisión

La experiencia del nutricionista se rediseñará con dos vistas conectadas: una **consulta guiada por etapas** para atender el turno actual y una **ficha longitudinal del paciente** para revisar la historia clínica/nutricional fuera de una consulta activa.

El objetivo es que el nutricionista tenga contexto, mediciones, evolución, observaciones, plan, objetivos, adjuntos y fotos disponibles sin saltar entre pantallas desconectadas.

## Hallazgos del código actual

| Área | Hallazgo | Impacto |
|------|----------|---------|
| Consulta activa | `ConsultaProfesionalPage.tsx` ya concentra turno, ficha, mediciones, observaciones y adjuntos, pero supera las 1500 líneas. | Seguir agregando lógica ahí vuelve riesgoso cualquier cambio. |
| Evolución | La pestaña `Evolución` de la consulta solo enlaza al panel externo de progreso. | Durante la consulta el nutricionista no ve evolución real en contexto. |
| Historial de consultas | El backend expone `/turnos/profesional/:nutricionistaId/pacientes/:socioId/historial-consultas`, pero la consulta activa no lo consume. | Se pierde contexto clínico previo. |
| Ficha actualizada | `DatosTurnoResponseDto` devuelve `fichaActualizada` y `consultaId`, pero el tipo local y la UI no los usan. | El nutricionista no recibe alerta si el socio cambió su ficha desde la última consulta. |
| Fotos | Las fotos de progreso existen por socio y tipo, no por consulta/sesión. | La comparación actual funciona como galería por tipo, pero no como set clínico por sesión. |
| Dashboard | `PacienteDestacadoCard` trata `historial-mediciones` como array, pero el endpoint devuelve objeto con `mediciones`. | El gráfico puede romper o quedar vacío. |

## Objetivos

- Convertir `/profesional/consulta/:turnoId` en un flujo clínico por etapas.
- Permitir navegación libre durante la consulta, pero validar el cierre en UI y backend.
- Exigir cierre completo del recorrido clínico sin forzar datos que no aplican.
- Incorporar evolución previa dentro de la consulta activa.
- Incorporar fotos de progreso por sesión: frente, perfil, espalda y otra opcional.
- Crear una ficha longitudinal accesible desde `Mis Pacientes`.
- Evitar que `ConsultaProfesionalPage.tsx` siga creciendo como archivo monolítico.

## No objetivos

- No convertir las fotos en requisito obligatorio de cierre.
- No reemplazar el editor completo de plan alimentario dentro de la consulta.
- No rediseñar todos los dashboards del sistema en este cambio.
- No crear una historia clínica médica general fuera del dominio nutricional actual.

## Experiencia: consulta activa

### Principio

La consulta activa debe funcionar como un recorrido clínico. El nutricionista puede moverse libremente entre etapas, pero `Finalizar consulta` valida que los mínimos reales estén completos.

### Etapas

| Etapa | Propósito | Cierre |
|-------|-----------|--------|
| Contexto del paciente | Datos del socio, ficha salud, alergias, patologías, objetivo personal y alerta `fichaActualizada`. | Se completa al cargar correctamente el turno base. |
| Evolución previa | Últimas mediciones, tendencia, última consulta y acceso a ficha longitudinal. | Se completa al revisar la etapa; si no hay datos previos, queda como primera consulta/medición. |
| Mediciones | Peso, altura, IMC, perímetros, pliegues, composición, signos vitales y notas. | Requiere medición base como mínimo. |
| Observación clínica | Comentario clínico, sugerencias, hábitos y objetivos para próxima consulta. | Requiere comentario clínico. |
| Plan y objetivos | Resumen del plan actual, objetivos activos y acceso al editor. | Si no se modifica nada, se omite automáticamente. |
| Fotos de evolución | Captura guiada de fotos de frente, perfil, espalda y otra opcional. | No bloquea cierre; si no hay fotos, se omite automáticamente. |
| Adjuntos y revisión final | Adjuntos clínicos, checklist final y resumen antes de cerrar. | Adjuntos no bloquean; revisión final sí debe mostrar faltantes si existen. |

### Comportamiento de navegación

- El stepper muestra estados: pendiente, completo, omitido automático, con error y bloqueado.
- El nutricionista puede saltar entre etapas durante la atención.
- El cierre se bloquea si falta medición base u observación clínica.
- Las etapas opcionales sin datos se consideran omitidas automáticamente.

## Experiencia: ficha longitudinal

### Principio

La ficha longitudinal explica la historia del paciente. No reemplaza la consulta activa; la complementa.

### Acceso

Desde `Mis Pacientes`, cada paciente tendrá una acción principal para abrir su ficha longitudinal.

### Contenido

| Sección | Contenido |
|---------|-----------|
| Resumen clínico | Datos del paciente, objetivo, ficha salud, últimas alertas y estado del plan. |
| Evolución | Resumen de peso, IMC, perímetros, composición y signos vitales. |
| Historial de consultas | Lista cronológica con notas clínicas, sugerencias y estado del turno. |
| Plan y objetivos | Plan alimentario actual, objetivos activos y completados. |
| Fotos por sesión | Sets de fotos agrupadas por consulta/sesión. |
| Comparador | Comparación entre sesiones por tipo de toma: frente con frente, perfil con perfil, espalda con espalda. |
| Adjuntos | Documentos clínicos asociados a consultas. |

## Fotos de evolución por sesión

### Problema actual

El módulo actual permite subir fotos por socio y tipo (`frente`, `perfil`, `espalda`, `otro`), pero no las agrupa por turno o sesión. Eso impide comparar una consulta completa contra otra de forma ordenada.

### Diseño propuesto

Cada consulta puede tener un set de fotos asociado al turno:

- Frente.
- Perfil.
- Espalda.
- Otra, opcional.

Las fotos no son obligatorias. Si el nutricionista no carga fotos en una consulta, la etapa se omite automáticamente.

### Comparación

La ficha longitudinal permite elegir dos sesiones y comparar sus fotos por tipo:

| Sesión A | Sesión B |
|----------|----------|
| Frente | Frente |
| Perfil | Perfil |
| Espalda | Espalda |

Si una sesión no tiene una toma, la UI debe mostrar el espacio faltante con un estado vacío claro.

### Datos necesarios

La entidad `foto_progreso` necesita asociarse a la consulta o a una sesión clínica. La opción preferida es relacionarla con `turno` porque la consulta ya existe como unidad temporal del sistema.

Campo nuevo requerido:

| Campo | Motivo |
|-------|--------|
| `id_turno` | Agrupa fotos por consulta real. |

El orden de sesiones se deriva de `turno.fechaTurno` + `turno.horaTurno`. No se agrega un campo `orden_sesion` porque duplicaría información del turno.

El campo `id_socio` se mantiene para consultas longitudinales rápidas por paciente.

## Backend

### Contrato de cierre

`POST /turnos/:id/finalizar-consulta` debe validar mínimos clínicos en backend:

- Existe medición base para el turno.
- Existe observación clínica con comentario.

Si falta algo, responde con error claro y lista de faltantes. La UI usa esa lista para marcar etapas incompletas.

### Resumen clínico para consulta

La consulta activa necesita datos de varias fuentes. Puede implementarse en dos fases:

| Fase | Decisión |
|------|----------|
| Inicial | Reusar endpoints existentes desde la UI: turno, progreso, historial de mediciones, historial de consultas, adjuntos y fotos. |
| Consolidación | Crear un endpoint agregado de contexto clínico si la coordinación de requests se vuelve frágil o lenta. |

Endpoints existentes relevantes:

- `GET /turnos/:id`.
- `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/historial-mediciones`.
- `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/progreso`.
- `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/historial-consultas`.
- `GET /turnos/:id/adjuntos`.
- `GET /progreso/:socioId/fotos`.

### Fotos por sesión

Se debe extender el módulo de fotos para soportar asociación con turno:

- Subir foto de progreso para un turno/sesión.
- Listar fotos de una consulta.
- Listar fotos agrupadas por sesión para un socio.
- Mantener lectura de fotos existentes sin `id_turno`, mostrándolas en una sección separada llamada "Fotos históricas sin sesión". No se migran automáticamente salvo que una tarea posterior pueda asociarlas a un turno de forma inequívoca.

## Frontend

### Separación de componentes

`ConsultaProfesionalPage` debe quedar como orquestador. Las responsabilidades visuales se separan en componentes:

| Componente | Responsabilidad |
|------------|-----------------|
| `ConsultaStepper` | Navegación y estado de etapas. |
| `ConsultaContextoPaciente` | Datos personales, ficha salud y alertas. |
| `ConsultaEvolucionPrevia` | Últimas mediciones, tendencia y última consulta. |
| `ConsultaMedicionesForm` | Form de mediciones y comparación contra última medición. |
| `ConsultaObservacionForm` | Comentario clínico, sugerencias, hábitos y objetivos. |
| `ConsultaPlanObjetivos` | Plan actual, objetivos y acceso al editor. |
| `ConsultaFotosSesion` | Captura guiada de fotos por sesión. |
| `ConsultaAdjuntos` | Upload/listado de adjuntos clínicos. |
| `ConsultaRevisionFinal` | Checklist de cierre y resumen. |
| `FichaPacientePage` | Vista longitudinal del paciente. |
| `ComparadorFotosSesion` | Comparación por sesión y tipo de toma. |

### Estado de completitud

La UI debe calcular completitud local para feedback inmediato, pero no confiar solo en eso para cerrar.

Estados mínimos:

- `contexto`: completo si cargó el turno.
- `evolucion`: completo si cargó o si no hay historial previo.
- `mediciones`: completo si hay medición base guardada para el turno.
- `observacion`: completo si hay comentario clínico guardado.
- `planObjetivos`: omitido automático si no se modifica.
- `fotos`: omitido automático si no se cargan fotos.
- `adjuntos`: omitido automático si no se cargan adjuntos.

### Estados de error

- Error al cargar turno base: bloquea la consulta.
- Error al cargar evolución, historial, fotos o adjuntos: se muestra solo en esa etapa y no bloquea mediciones/observaciones.
- Error de cierre: marca etapas faltantes con el mensaje devuelto por backend.

## Criterios de aceptación

- El nutricionista puede abrir una consulta activa y ver un stepper con etapas clínicas.
- La consulta muestra ficha salud, alertas y evolución previa sin salir de la pantalla.
- El sistema permite navegar libremente entre etapas.
- `Finalizar consulta` queda bloqueado o falla con mensaje claro si falta medición base u observación clínica.
- Plan, objetivos, fotos y adjuntos no bloquean cierre si no se usan.
- Las fotos se cargan en una estructura por sesión: frente, perfil, espalda y otra opcional.
- La ficha longitudinal permite revisar historial, evolución, plan, objetivos, adjuntos y fotos por sesión.
- El comparador permite elegir dos sesiones y comparar tomas equivalentes.
- `fichaActualizada` aparece como alerta visible cuando corresponde.
- `PacienteDestacadoCard` deja de tratar `historial-mediciones` como array directo.

## Verificación

### Backend

- Unit tests para `FinalizarConsultaUseCase`: permite cerrar con medición base + observación, rechaza faltantes con lista clara.
- Unit tests para fotos por sesión: subida asociada a turno, listado por turno y agrupado por socio.
- Tests de permisos: solo nutricionista autorizado accede a fotos/consulta del paciente.

### Frontend

- Tests unitarios para cálculo de completitud del recorrido.
- Tests de render para `ConsultaStepper`, `ConsultaFotosSesion` y `ConsultaRevisionFinal`.
- Tests para la ficha longitudinal con estados vacíos.
- Test para corregir el shape de `PacienteDestacadoCard`.

### Visual / E2E

- Verificar con Playwright MCP la consulta activa en desktop y mobile.
- Verificar carga opcional de fotos por sesión.
- Verificar comparación de dos sesiones en ficha longitudinal.
- Verificar cierre bloqueado cuando faltan mínimos y cierre exitoso cuando están completos.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Scope grande | Implementar por slices: cierre clínico, stepper, evolución, fotos por sesión, ficha longitudinal. |
| Consulta con demasiada información | Usar stepper y resumen contextual, no una sola pantalla infinita. |
| Fotos existentes sin sesión | Mostrarlas como históricas sin sesión o migrarlas de forma no destructiva si se puede inferir turno. |
| Validación duplicada UI/backend | La UI guía; el backend es autoridad. Mantener reglas mínimas en una función testeable. |
| Performance por muchos requests | Empezar con endpoints existentes y consolidar en endpoint agregado si la experiencia se degrada. |

## Preguntas cerradas por decisión del usuario

- El principio rector será flujo por etapas.
- La navegación será mixta: libre durante la consulta, validada al cerrar.
- El cierre exige completar el recorrido, pero las etapas opcionales se omiten automáticamente.
- Las reglas de cierre deben vivir en UI y backend.
- Desde `Mis Pacientes` se abrirá una ficha longitudinal.
- Las fotos serán opcionales, estructuradas por sesión y comparables después.

## Próximo paso

Tras revisar y aprobar este spec, se debe crear el plan de implementación detallado con `writing-plans`.
