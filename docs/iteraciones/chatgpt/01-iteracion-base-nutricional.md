# Iteración 1 — Base operativa nutricional

> **Objetivo del documento:** listar las funcionalidades esperadas del sistema según la documentación funcional y las decisiones tomadas en la entrevista. No indica qué está implementado actualmente; sirve como mapa para comparar contra el sistema real.

## 1. Alcance de esta iteración

Esta iteración construye la base completa del módulo nutricional para gimnasios. El sistema debe permitir gestionar nutricionistas, socios, fichas de salud, disponibilidad horaria, turnos, asistencia, consultas, mediciones, planes alimentarios básicos y progreso del socio.

### Incluye

- Gestión de nutricionistas.
- Gestión básica de socios.
- Configuración de horarios del nutricionista.
- Excepciones de disponibilidad.
- Visualización de disponibilidad y reserva de turnos.
- Cancelación y reprogramación de turnos.
- Check-in de asistencia.
- Marcado automático y manual de ausentes.
- Ficha de salud obligatoria antes de reservar turno.
- Registro de consultas nutricionales.
- Registro de mediciones físicas.
- Plan alimentario básico por días y comidas.
- Visualización de progreso mediante tablas y gráficos.
- Auditoría simple de acciones relevantes.

### No incluye

- Deportólogos.
- Entrenadores.
- Rutinas de entrenamiento.
- Gestión integral del gimnasio.
- Pagos, facturación o gestión fiscal.
- WhatsApp/SMS.
- Videollamadas o chat en tiempo real.
- Estados propios de consulta nutricional. Esto queda como posible mejora futura.
- IA para sugerir comidas. Eso queda para la iteración 2.

---

## 2. Roles considerados

| Rol | Responsabilidad principal | Restricciones |
|---|---|---|
| Administrador | Gestiona usuarios, configuración general y auditoría. | No realiza tareas operativas de recepción. |
| Recepcionista | Crea socios, crea nutricionistas, asigna turnos, cancela/reprograma turnos y marca asistencia. | No accede a ficha clínica, consultas, mediciones ni planes alimentarios. |
| Nutricionista | Configura sus horarios, atiende consultas, registra mediciones y crea planes. | Solo accede a información nutricional de socios vinculados a su atención. |
| Socio | Completa ficha, reserva turnos, cancela/reprograma y consulta su progreso/plan. | Solo accede a su propia información. |

---

## 3. Reglas funcionales importantes

### 3.1 Nutricionistas

- El sistema trabaja únicamente con **nutricionistas**.
- Un nutricionista puede estar **activo** o **inactivo**.
- Un nutricionista inactivo no aparece disponible para nuevos turnos.
- Si se desactiva un nutricionista con turnos futuros, el sistema debe cancelar esos turnos y notificar a los socios afectados.
- Si no tiene turnos futuros, solo cambia su estado a inactivo.

### 3.2 Disponibilidad y agenda

- Cada nutricionista define la duración única de sus turnos.
- La duración aplica a todos sus días y rangos horarios.
- Para un mismo día semanal puede configurar varios rangos horarios.
- Ejemplo: lunes de 08:00 a 12:00 y de 15:00 a 19:00.
- El sistema calcula los turnos disponibles en base a:
  - rangos horarios semanales;
  - duración del turno;
  - excepciones bloqueadas;
  - turnos ya reservados;
  - estado activo/inactivo del nutricionista.
- Las excepciones solo bloquean horarios. No agregan horarios extra.
- Una excepción puede bloquear un día completo o un rango parcial de una fecha específica.
- No se deben permitir rangos horarios superpuestos.
- No se deben permitir turnos fuera de la agenda configurada.
- No se debe permitir reservar con menos de 2 horas de anticipación.
- No se debe permitir reservar más allá de 60 días hacia adelante.

> Nota de interpretación: se documenta “2 horas” como **anticipación mínima**, para evitar reservas demasiado inmediatas.

### 3.3 Turnos

- El socio puede reservar/solicitar turnos si tiene ficha de salud completa.
- Recepción puede crear turnos en nombre del socio.
- La reprogramación conserva el mismo turno, cambia fecha/hora y registra auditoría.
- La cancelación requiere motivo.
- El socio solo puede cancelar hasta 24 horas antes del turno.
- Recepción puede cancelar o reprogramar turnos como operación administrativa.
- El estado AUSENTE se marca automáticamente si pasan 30 minutos desde el horario del turno sin check-in.
- Recepción también puede marcar ausente manualmente.

### 3.4 Ficha de salud

- La ficha de salud es obligatoria antes de reservar un turno.
- El socio puede editarla aunque ya tenga consultas realizadas.
- Si el socio edita la ficha luego de tener consultas, el nutricionista debería ver una alerta de “Ficha actualizada recientemente”.
- Recepción no puede ver datos clínicos/sensibles de la ficha.
- Todo cambio relevante debe quedar auditado.

### 3.5 Consulta nutricional

- La consulta debe estar asociada a un turno.
- No se define estado propio de consulta en esta versión.
- La consulta puede editarse luego de finalizada.
- Si se edita una consulta ya finalizada, se recomienda pedir motivo y registrar auditoría.
- La consulta puede incluir observaciones, recomendaciones, mediciones y adjuntos.

### 3.6 Mediciones y progreso

- El nutricionista registra mediciones físicas del socio.
- El IMC debe calcularse automáticamente en base a peso y altura.
- El progreso debe visualizarse con tabla e indicadores gráficos.
- Las mediciones históricas deben conservarse para poder comparar evolución.

### 3.7 Plan alimentario básico

- Un socio puede tener un único plan activo.
- Un plan se compone de días y comidas.
- El plan puede tener objetivo y límite calórico diario opcional.
- Al crear un nuevo plan, el anterior pasa a histórico.
- El profesional puede consultar versiones anteriores para trazabilidad.
- El socio ve principalmente el plan activo.
- Editar o eliminar un plan requiere motivo y auditoría.
- Eliminar un plan implica borrado lógico y deja al socio sin plan activo, salvo que el nutricionista active otro manualmente.

---

## 4. Datos mínimos sugeridos

### 4.1 Nutricionista

Obligatorios:

- Nombre.
- Apellido.
- Email.
- Matrícula profesional.
- Estado: activo/inactivo.
- Especialidad fija: Nutricionista.
- Duración de turno.

Opcionales/recomendados:

- Teléfono.
- DNI.
- Foto de perfil.
- Presentación profesional.
- Formación académica.
- Certificaciones.
- Documento de matrícula/diploma.

### 4.2 Socio

Obligatorios:

- Nombre.
- Apellido.
- Email o identificador de acceso.
- Estado: activo/inactivo.

Opcionales/recomendados:

- Teléfono.
- DNI.
- Fecha de nacimiento.
- Observaciones administrativas.

### 4.3 Ficha de salud

Obligatorios mínimos:

- Altura.
- Peso actual.
- Nivel de actividad física.
- Objetivo personal.
- Alergias alimentarias.
- Patologías o condiciones relevantes.
- Restricciones alimentarias.
- Observaciones generales.

Opcionales/recomendados:

- Medicación actual.
- Alimentos que no consume.
- Fumador.
- Consumo de alcohol.
- Horas aproximadas de sueño.
- Antecedentes relevantes declarados por el socio.

### 4.4 Mediciones

Principales:

- Peso.
- Altura.
- IMC calculado.
- Cintura.
- Cadera.
- Pecho.
- Brazo.
- Muslo/pierna.
- Porcentaje de grasa corporal, si el profesional lo mide.
- Porcentaje de masa muscular, si el profesional lo mide.
- Observaciones.

Opcionales si se quiere enriquecer el seguimiento:

- Cuello.
- Grasa visceral.
- Presión arterial.
- Pliegues cutáneos.

---

# 5. Casos de uso

## CU-01 — Registrar nutricionista

**Actor principal:** Recepcionista o Administrador.  
**Objetivo:** crear un nutricionista para que pueda operar en el sistema.

### Camino principal

1. El actor accede al módulo de nutricionistas.
2. Selecciona “Nuevo nutricionista”.
3. Carga datos obligatorios y opcionales.
4. Define estado inicial activo/inactivo.
5. Confirma el alta.
6. El sistema valida datos y crea el perfil.
7. El nutricionista queda disponible para configurar sus horarios.

### Caminos alternativos

- El email ya existe.
- Falta matrícula profesional.
- El formato del email es inválido.
- Se carga inicialmente como inactivo.

### Casos borde

- Dos usuarios intentan registrar el mismo email al mismo tiempo.
- Se intenta registrar un profesional con especialidad distinta a nutricionista.
- Se carga matrícula repetida.
- Se adjunta un archivo inválido como diploma/matrícula.

---

## CU-02 — Editar nutricionista

**Actor principal:** Recepcionista o Administrador.  
**Objetivo:** actualizar datos administrativos o profesionales del nutricionista.

### Camino principal

1. El actor busca al nutricionista.
2. Abre su detalle.
3. Modifica datos permitidos.
4. Guarda los cambios.
5. El sistema valida y registra auditoría.

### Caminos alternativos

- El nutricionista no existe.
- El email nuevo ya está usado.
- El actor no tiene permiso.

### Casos borde

- Se modifica duración de turno con turnos futuros existentes.
- Se modifica matrícula luego de haber atendido consultas.
- Se edita un nutricionista inactivo.

---

## CU-03 — Desactivar nutricionista

**Actor principal:** Recepcionista o Administrador.  
**Objetivo:** impedir que el nutricionista reciba nuevos turnos.

### Camino principal

1. El actor busca al nutricionista.
2. Selecciona “Desactivar”.
3. El sistema verifica turnos futuros.
4. Si existen turnos futuros, muestra advertencia.
5. El actor confirma la desactivación.
6. El sistema cancela turnos futuros, registra motivo y notifica a los socios.
7. El nutricionista queda inactivo.

### Caminos alternativos

- No tiene turnos futuros: solo se desactiva.
- El actor cancela la operación.
- No se pueden enviar notificaciones: se desactiva igual y se registra incidencia.

### Casos borde

- Hay una consulta en curso o turno del día.
- Hay turnos reprogramados asociados.
- Un socio intenta reservar mientras se desactiva el profesional.

---

## CU-04 — Configurar disponibilidad semanal

**Actor principal:** Nutricionista.  
**Objetivo:** definir los días, rangos horarios y duración de turnos.

### Camino principal

1. El nutricionista accede a “Mi agenda”.
2. Define duración única de sus turnos.
3. Selecciona un día de la semana.
4. Carga uno o más rangos horarios.
5. Guarda la configuración.
6. El sistema valida solapamientos y horarios válidos.
7. El sistema calcula slots disponibles para reservas futuras.

### Caminos alternativos

- El rango se superpone con otro rango del mismo día.
- La hora fin es menor o igual a la hora inicio.
- La duración del turno no permite generar ningún slot completo.
- El nutricionista intenta borrar un rango con turnos futuros reservados.

### Casos borde

- Rango 08:00 a 12:10 con duración de 30 minutos: sobra tiempo no reservable.
- Cambio de duración con turnos futuros existentes.
- Horarios que cruzan medianoche.
- Diferentes zonas horarias o cambios de horario del sistema.

### Decisión recomendada

No recalcular ni romper turnos ya reservados cuando cambia la agenda. Los cambios aplican para nuevas reservas. Si un rango con turnos futuros se elimina, el sistema debe advertir y pedir confirmación/cancelación manual.

---

## CU-05 — Cargar excepción de disponibilidad

**Actor principal:** Nutricionista.  
**Objetivo:** bloquear un día completo o un rango horario específico.

### Camino principal

1. El nutricionista accede a excepciones de agenda.
2. Selecciona una fecha.
3. Define si bloquea todo el día o un rango parcial.
4. Ingresa motivo opcional.
5. Guarda la excepción.
6. El sistema bloquea los slots afectados.

### Caminos alternativos

- La excepción afecta turnos ya reservados.
- El rango parcial no coincide con horario de atención.
- La fecha está fuera del límite de 60 días.

### Casos borde

- Bloqueo parcial que corta un turno ya generado.
- Excepción duplicada sobre la misma fecha y rango.
- Bloqueo de una fecha con varios rangos horarios.

### Decisión recomendada

Si la excepción afecta turnos ya reservados, no cancelarlos automáticamente sin confirmación. Mostrar turnos afectados y pedir acción: cancelar/notificar o conservarlos excepcionalmente.

---

## CU-06 — Crear socio

**Actor principal:** Recepcionista o Nutricionista.  
**Objetivo:** registrar un socio para que pueda usar el módulo nutricional.

### Camino principal

1. El actor accede a socios.
2. Selecciona “Nuevo socio”.
3. Carga datos básicos.
4. Confirma creación.
5. El sistema valida duplicados.
6. El socio queda activo.

### Caminos alternativos

- Email/DNI ya registrado.
- Faltan datos obligatorios.
- El socio se crea sin ficha de salud completa.

### Casos borde

- Nutricionista crea socio que luego debe ser atendido por otro profesional.
- Se crea socio duplicado con distinto email pero mismo DNI.
- El socio existe en otro módulo del gimnasio pero no en nutrición.

### Decisión recomendada

Aunque el nutricionista pueda crear socios, el flujo ideal es que lo haga recepción. Si lo crea el nutricionista, queda como socio normal, pero con auditoría de origen.

---

## CU-07 — Desactivar socio

**Actor principal:** Recepcionista.  
**Objetivo:** impedir que el socio reserve nuevos turnos.

### Camino principal

1. Recepción busca al socio.
2. Selecciona “Desactivar”.
3. El sistema verifica turnos futuros.
4. Recepción confirma la operación.
5. El sistema cambia el estado del socio y cancela/requiere resolver turnos futuros.

### Caminos alternativos

- El socio no tiene turnos futuros.
- Recepción cancela la operación.

### Casos borde

- El socio tiene plan alimentario activo.
- El socio tiene consulta reciente sin revisar.
- El socio intenta ingresar mientras se lo desactiva.

---

## CU-08 — Completar ficha de salud

**Actor principal:** Socio.  
**Objetivo:** completar información mínima necesaria antes de reservar turno.

### Camino principal

1. El socio ingresa al módulo nutricional.
2. El sistema detecta que no tiene ficha completa.
3. Muestra formulario de ficha de salud.
4. El socio carga campos obligatorios y opcionales.
5. Guarda la ficha.
6. El sistema valida datos mínimos.
7. La ficha queda marcada como completa.

### Caminos alternativos

- Faltan campos obligatorios.
- Hay valores inválidos, por ejemplo peso o altura fuera de rango.
- El socio abandona el formulario.

### Casos borde

- El socio declara alergias graves.
- El socio carga texto libre con información sensible.
- El socio modifica la ficha minutos antes de la consulta.

---

## CU-09 — Editar ficha de salud

**Actor principal:** Socio.  
**Objetivo:** actualizar información de salud relevante.

### Camino principal

1. El socio accede a su ficha.
2. Modifica campos permitidos.
3. Guarda cambios.
4. El sistema valida datos.
5. El sistema registra auditoría.
6. Si tiene consultas o turnos futuros, marca la ficha como actualizada recientemente.

### Caminos alternativos

- Campos inválidos.
- Error al guardar.
- El socio no tiene permiso sobre esa ficha.

### Casos borde

- Cambio de alergias luego de tener plan activo.
- Cambio de peso que modifica IMC y progreso.
- Nutricionista está viendo la ficha mientras el socio la edita.

### Decisión recomendada

Si cambia una alergia/restricción y existe plan activo, mostrar alerta al nutricionista para revisar el plan.

---

## CU-10 — Ver nutricionistas disponibles

**Actor principal:** Socio.  
**Objetivo:** buscar nutricionistas activos y ver su disponibilidad.

### Camino principal

1. El socio accede a nutricionistas.
2. El sistema muestra profesionales activos.
3. El socio filtra o selecciona un nutricionista.
4. El sistema muestra perfil, presentación y horarios disponibles.

### Caminos alternativos

- No hay nutricionistas activos.
- El nutricionista no tiene horarios disponibles.
- El socio no tiene ficha completa.

### Casos borde

- Disponibilidad cambia mientras el socio mira el calendario.
- Nutricionista se desactiva antes de confirmar turno.
- El socio intenta ver horarios fuera del límite de 60 días.

---

## CU-11 — Reservar turno

**Actor principal:** Socio.  
**Objetivo:** reservar un turno con un nutricionista disponible.

### Camino principal

1. El socio selecciona nutricionista.
2. El sistema verifica ficha de salud completa.
3. El socio elige fecha y hora disponible.
4. Confirma reserva.
5. El sistema valida disponibilidad, anticipación mínima y límite de agenda.
6. El sistema crea el turno en estado PROGRAMADO.
7. El sistema muestra confirmación.

### Caminos alternativos

- Ficha incompleta: redirigir a completar ficha.
- Slot ya reservado por otro socio.
- Reserva con menos de 2 horas de anticipación.
- Reserva a más de 60 días.
- Nutricionista inactivo.
- Fecha bloqueada por excepción.

### Casos borde

- Doble click en confirmar.
- Dos socios reservan el mismo slot al mismo tiempo.
- El socio intenta reservar múltiples turnos cercanos con el mismo nutricionista.
- El sistema debe evitar inconsistencias por concurrencia.

---

## CU-12 — Crear turno en nombre del socio

**Actor principal:** Recepcionista.  
**Objetivo:** asignar un turno a un socio desde recepción.

### Camino principal

1. Recepción busca al socio.
2. Selecciona nutricionista.
3. Consulta disponibilidad.
4. Selecciona fecha y hora.
5. Confirma la reserva.
6. El sistema crea el turno en estado PROGRAMADO.

### Caminos alternativos

- Socio sin ficha completa.
- Socio inactivo.
- Nutricionista sin disponibilidad.
- Slot bloqueado por excepción.

### Casos borde

- Recepción intenta reservar fuera de política.
- Recepción crea turno para socio recién creado sin ficha.
- El socio ya tiene otro turno el mismo día.

### Decisión recomendada

Recepción puede ayudar a crear el turno, pero no debería completar datos clínicos privados salvo que exista una política explícita del gimnasio.

---

## CU-13 — Cancelar turno

**Actor principal:** Socio o Recepcionista.  
**Objetivo:** cancelar un turno programado.

### Camino principal

1. El actor accede al turno.
2. Selecciona “Cancelar”.
3. Ingresa motivo.
4. El sistema valida política de cancelación.
5. El sistema cambia el estado a CANCELADO.
6. Libera el slot.
7. Registra auditoría y notifica al profesional/socio según corresponda.

### Caminos alternativos

- El socio intenta cancelar dentro de las 24 horas previas.
- El turno ya fue cancelado.
- El turno ya está presente, ausente o realizado.
- Recepción cancela por motivo administrativo.

### Casos borde

- Cancelación simultánea desde socio y recepción.
- Fallo de notificación.
- Cancelación de turno reprogramado.

---

## CU-14 — Reprogramar turno

**Actor principal:** Socio o Recepcionista.  
**Objetivo:** cambiar fecha/hora de un turno existente.

### Camino principal

1. El actor selecciona un turno PROGRAMADO.
2. Presiona “Reprogramar”.
3. El sistema muestra disponibilidad del mismo nutricionista.
4. El actor elige nuevo slot.
5. Ingresa motivo.
6. El sistema valida reglas de disponibilidad.
7. El sistema actualiza fecha/hora conservando el mismo turno.
8. Registra auditoría y notifica.

### Caminos alternativos

- No hay disponibilidad alternativa.
- Nuevo horario bloqueado por excepción.
- Turno dentro de ventana no permitida.
- El nutricionista fue desactivado.

### Casos borde

- Reprogramación múltiple del mismo turno.
- Dos personas intentan mover el turno al mismo slot.
- El turno original queda liberado y otro socio intenta tomarlo inmediatamente.

---

## CU-15 — Realizar check-in

**Actor principal:** Recepcionista.  
**Objetivo:** marcar que el socio asistió al turno.

### Camino principal

1. Recepción abre turnos del día.
2. Busca el turno del socio.
3. Selecciona “Marcar presente”.
4. El sistema cambia el estado a PRESENTE.
5. Registra fecha/hora de check-in.

### Caminos alternativos

- El turno no es del día.
- El turno está cancelado.
- El socio llegó tarde y ya fue marcado ausente.

### Casos borde

- Check-in duplicado.
- Check-in manual luego de marcado automático como AUSENTE.
- Recepción marca presente a socio equivocado.

---

## CU-16 — Marcar ausente automáticamente

**Actor principal:** Sistema.  
**Objetivo:** marcar ausencia si no hubo check-in dentro del umbral.

### Camino principal

1. El sistema revisa turnos PROGRAMADOS del día.
2. Detecta turnos con más de 30 minutos desde el horario programado.
3. Verifica que no tengan check-in.
4. Cambia estado a AUSENTE.
5. Registra auditoría automática.

### Caminos alternativos

- Recepción ya marcó presente.
- Recepción marcó ausente manualmente.
- El turno fue cancelado.

### Casos borde

- Proceso automático se ejecuta tarde.
- Diferencia horaria del servidor.
- Turno reprogramado minutos antes del control automático.

---

## CU-17 — Ver agenda del día

**Actor principal:** Nutricionista.  
**Objetivo:** visualizar turnos del día y acceder a datos necesarios.

### Camino principal

1. El nutricionista ingresa a “Mi agenda”.
2. El sistema muestra turnos del día.
3. Permite filtrar por socio, horario u objetivo.
4. El nutricionista abre el detalle de un turno.
5. Puede consultar ficha de salud y registrar consulta/medición.

### Caminos alternativos

- No tiene turnos del día.
- El socio no completó ficha.
- El turno fue cancelado o ausente.

### Casos borde

- Turnos muy próximos entre sí.
- Ficha actualizada recientemente.
- Nutricionista intenta abrir socio no vinculado.

---

## CU-18 — Registrar consulta nutricional

**Actor principal:** Nutricionista.  
**Objetivo:** documentar la atención nutricional realizada.

### Camino principal

1. El nutricionista abre el turno del socio.
2. Accede a ficha de salud.
3. Registra motivo/observaciones/recomendaciones.
4. Registra mediciones si corresponde.
5. Adjunta documentos si corresponde.
6. Guarda la consulta.
7. El sistema registra auditoría.

### Caminos alternativos

- El turno no está presente.
- Faltan datos mínimos de consulta.
- Error al adjuntar documento.

### Casos borde

- El nutricionista edita la consulta luego de guardarla.
- La ficha cambió durante la atención.
- Se cargan valores de medición fuera de rango.

### Decisión recomendada

No bloquear edición por ahora. Si se edita luego de finalizada, solicitar motivo y conservar auditoría.

---

## CU-19 — Registrar mediciones

**Actor principal:** Nutricionista.  
**Objetivo:** registrar datos físicos para seguimiento.

### Camino principal

1. El nutricionista abre la consulta o perfil nutricional del socio.
2. Carga peso y demás mediciones.
3. El sistema calcula IMC automáticamente.
4. Valida rangos razonables.
5. Guarda medición asociada a fecha, socio y nutricionista.

### Caminos alternativos

- Falta altura para calcular IMC.
- Peso o altura inválidos.
- El nutricionista omite mediciones opcionales.

### Casos borde

- Dos mediciones el mismo día.
- Corrección de una medición anterior.
- Cambio de altura que recalcula IMC histórico.

### Decisión recomendada

El IMC histórico debe calcularse con la altura registrada al momento de la medición, no con la altura actual si luego se modifica.

---

## CU-20 — Crear plan alimentario básico

**Actor principal:** Nutricionista.  
**Objetivo:** crear un plan alimentario para el socio.

### Camino principal

1. El nutricionista abre el perfil del socio.
2. Selecciona “Crear plan”.
3. Define objetivo del plan.
4. Define calorías diarias objetivo si corresponde.
5. Carga días y comidas.
6. Agrega alimentos, cantidades, alternativas y observaciones.
7. El sistema valida que exista al menos un día y una comida.
8. El sistema valida alergias/restricciones del socio.
9. Guarda el plan como activo.
10. Si había plan activo anterior, lo pasa a histórico.

### Caminos alternativos

- El plan contiene ingrediente restringido.
- Falta objetivo.
- No se cargó ninguna comida.
- El socio no tiene ficha completa.

### Casos borde

- Cambio de alergias posterior a crear el plan.
- Edición simultánea del mismo plan.
- Nuevo plan creado por error.

---

## CU-21 — Editar plan alimentario

**Actor principal:** Nutricionista.  
**Objetivo:** modificar el plan activo.

### Camino principal

1. El nutricionista abre el plan activo.
2. Modifica días, comidas, alimentos o notas.
3. Ingresa motivo de edición.
4. El sistema valida restricciones alimentarias.
5. Guarda una nueva versión del plan.
6. Registra auditoría.

### Caminos alternativos

- Motivo no informado.
- Ingrediente incompatible con restricciones.
- Plan eliminado o inactivo.

### Casos borde

- Socio está viendo el plan mientras se edita.
- Se elimina una comida obligatoria del día.
- Se crea una versión sin cambios reales.

---

## CU-22 — Eliminar plan alimentario

**Actor principal:** Nutricionista.  
**Objetivo:** quitar el plan activo sin borrar físicamente la información.

### Camino principal

1. El nutricionista abre el plan activo.
2. Selecciona “Eliminar”.
3. Ingresa motivo.
4. Confirma la acción.
5. El sistema aplica borrado lógico.
6. El socio queda sin plan activo.
7. Registra auditoría.

### Caminos alternativos

- El plan ya está eliminado.
- Falta motivo.
- El actor no tiene permiso.

### Casos borde

- Eliminación accidental.
- Hay versiones anteriores del plan.
- El socio intenta abrir el plan eliminado desde una pestaña vieja.

---

## CU-23 — Ver progreso del socio

**Actor principal:** Socio o Nutricionista.  
**Objetivo:** visualizar evolución nutricional.

### Camino principal

1. El actor accede a progreso.
2. Selecciona período.
3. El sistema muestra tabla de mediciones.
4. El sistema muestra gráficos de evolución.
5. Permite revisar consultas/mediciones asociadas según permisos.

### Caminos alternativos

- No hay mediciones cargadas.
- El período no tiene datos.
- El actor no tiene permiso.

### Casos borde

- Valores extremos distorsionan el gráfico.
- Mediciones duplicadas del mismo día.
- Datos corregidos después de mostrarse en reportes.

---

# 6. Checklist para comparar contra el sistema real

| Área | Funcionalidad esperada | Estado real |
|---|---|---|
| Nutricionistas | Alta, edición, listado, desactivación | Pendiente de revisar |
| Socios | Alta, edición, desactivación | Pendiente de revisar |
| Ficha de salud | Obligatoria antes de reservar | Pendiente de revisar |
| Agenda | Rangos múltiples por día | Pendiente de revisar |
| Agenda | Duración única por nutricionista | Pendiente de revisar |
| Agenda | Excepciones de bloqueo | Pendiente de revisar |
| Turnos | Reserva con reglas 2h/60 días | Pendiente de revisar |
| Turnos | Cancelación con motivo y regla 24h | Pendiente de revisar |
| Turnos | Reprogramación conservando turno | Pendiente de revisar |
| Asistencia | Check-in recepción | Pendiente de revisar |
| Asistencia | Ausente automático a los 30 min | Pendiente de revisar |
| Consulta | Registro editable con auditoría | Pendiente de revisar |
| Mediciones | IMC automático y validaciones | Pendiente de revisar |
| Planes | Plan activo + histórico/versiones | Pendiente de revisar |
| Progreso | Tabla + gráficos | Pendiente de revisar |
