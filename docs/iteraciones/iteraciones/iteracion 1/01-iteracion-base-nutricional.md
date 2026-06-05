# Iteración 1 — Base Nutricional (Fuente de Verdad)

> **Estado del documento:** Fuente de verdad para la planificación e implementación de iteración 1.
> **Origen:** refinado a partir de `iteracion-1.md` (estado real del código) + `01-iteracion-base-nutricional.md` (reglas de negocio de la entrevista original). Este documento es el resultado de 9 rondas de preguntas con el product owner.
> **Decisiones cerradas al inicio:**
> - Multi-tenant: por gimnasio (1 nutricionista en N gimnasios; 1 socio en 1 gimnasio).
> - Stack: NestJS + TypeORM + MySQL (backend), React + Vite + Tailwind (frontend).
> - Planes alimentarios: incluidos en iter 1.
> - Fotos de progreso: incluidas.
>
> **Decisiones tomadas en las rondas de Q&A (ver §0.1):**
> - Ficha estándar profesional con historial de versiones, sin campos custom.
> - Consulta nutricional separada del plan, editable con motivo.
> - Mediciones cargadas solo por nutricionista, atadas a turno, visibles al socio al cerrar consulta.
> - Progreso con gráficos, fotos, tabla y export PDF (sin JSON de portabilidad — riesgo compliance aceptado).
> - Plan por día de la semana, comidas configurables, base de alimentos propia, intercambios agrupados.
> - Nutricionistas aislados (sin visibilidad entre agendas, sin derivación).
> - Solo notificaciones por email (sin in-app, sin preferencias).
> - Turno se crea CONFIRMADO directo (sin token público de confirmación).

---

## 0. Resumen ejecutivo

Iteración 1 entrega la **base operativa completa** del módulo nutricional para gimnasios. Cubre el ciclo de vida del nutricionista y del socio, la gestión de disponibilidad con reglas estrictas de anticipación, el flujo de turnos con check-in y ausente automático, la ficha de salud con validaciones y alertas por edición reciente, la consulta nutricional editable, las mediciones físicas cargadas por el nutricionista y visibles al cerrar la consulta, el plan alimentario con alta/edición/baja lógica e histórico, y el progreso con tabla, gráficos, comparativa de fotos y export PDF.

**Objetivos medibles al cierre de iter 1:**
- Recepción puede crear un nutricionista y dejarlo operativo en menos de 5 minutos.
- Un socio con ficha completa puede reservar un turno en menos de 3 clicks desde el listado de profesionales.
- El 100% de las acciones sensibles quedan auditadas con metadata completa.
- El sistema rechaza reservas con menos de 2h de anticipación o a más de 60 días.
- La cancelación del socio fuera de la ventana de 24h queda bloqueada, pero recepción puede hacerlo con motivo.

**Lo que NO se entrega en iter 1** (ver §17): deportólogos, entrenadores, IA, pagos, WhatsApp/SMS, videollamadas, app móvil nativa, multi-gimnasio para socios, reasignación automática entre nutricionistas, notificaciones in-app, confirmación de turno por token, derivación interna, adherencia al plan, feriados, gap entre turnos, campos custom en ficha, preferencias de notificación, export JSON de portabilidad.

### 0.1 Trazabilidad de decisiones (resumen de las 9 rondas de Q&A)

| # | Tema | Decisión | Aplicado en |
|---|---|---|---|
| 1 | Base del doc | Usar el reescrito como base | — |
| 2 | Multi-tenant | Por gimnasio | §1.3, §4.2 |
| 3 | Ficha profundidad | Estándar profesional | §4.3.3, §7 CU-08/09 |
| 4 | Ficha campos extra | Hábitos alimentarios, embarazo/lactancia, intolerancias, historial de peso | §4.3.3, §7 CU-08 |
| 5 | Ficha historial | Con historial de versiones | §6.2, §4.1, RB |
| 6 | Ficha custom | Sin campos custom | §4.1, §17 |
| 7 | Consulta estructura | Mix semiestructurada + cálculos donde posible | §7 CU-18 |
| 8 | Consulta secciones | Anamnesis, diagnóstico, examen físico, plan a seguir | §7 CU-18 |
| 9 | Consulta-plan | Separados | §7 CU-18/20 |
| 10 | Consulta edición | Editable con motivo + auditoría | §7 CU-18, RB |
| 11 | Mediciones quién | Solo el nutricionista | RB, §7 CU-19 |
| 12 | Mediciones qué | Perímetros + composición corporal + fotos de progreso | §4.3.4, §7 CU-19 |
| 13 | Mediciones turno | Siempre atadas a un turno | §7 CU-19, RB |
| 14 | Mediciones visibilidad | Al cerrar la consulta (flag `publicada_at`) | §7 CU-19, RB |
| 15 | Progreso visualizaciones | Gráficos + fotos + tabla | §7 CU-23 |
| 16 | Progreso outliers | Marcados, no filtrados | §7 CU-23 |
| 17 | Progreso export | Solo PDF | §7 CU-23, §11.5 |
| 18 | Notas por medición | Privadas del nutricionista | §7 CU-19 |
| 19 | Plan estructura | Por día de la semana | §7 CU-20 |
| 20 | Plan comidas | Configurable por plan | §4.3.5, §7 CU-20 |
| 21 | Plan base alimentos | Propia con seed inicial | §4.1, §7 CU-20 |
| 22 | Plan intercambios | Múltiples alternativas agrupadas | §4.3.5, §7 CU-20 |
| 23 | Plan validación alergias | Warning + override auditado | RB, §7 CU-20 |
| 24 | Plan versionado | Activo + histórico | §6.3, §7 CU-20 |
| 25 | Plan visibilidad | Socio + creador + nutricionistas con turno previo | §3.2, §7 CU-20 |
| 26 | Plan adherencia | NO en iter 1 | §17 |
| 27 | Especialidad | Fija "Nutricionista" | §1.2, §17 |
| 28 | Feriados | NO se modelan | §17 |
| 29 | Gap turnos | NO hay | §17 |
| 30 | Derivación | NO hay (nutricionistas aislados) | §17 |
| 31 | Notificaciones canal | Solo email | §8, §17 |
| 32 | Notificaciones preferencias | No hay (sistema decide) | §17 |
| 33 | Notificaciones momento | Mixto (inmediato críticos, batch menores) | §8 |
| 34 | Recordatorios | 24h + 1h antes del turno | §8 |
| 35 | Confirmación turno | NO hay token — turno se crea CONFIRMADO | §6.1, §7 CU-11, §17 |
| 36 | Portabilidad JSON | NO (riesgo compliance aceptado) | §11.5, §16 |

---

## 1. Alcance

### 1.1 Incluye

- **Gestión de nutricionistas**: alta, edición, desactivación, reactivación, listado con filtros. Especialidad fija "Nutricionista".
- **Gestión de socios**: alta, edición, desactivación, reactivación, listado.
- **Disponibilidad semanal**: rangos múltiples por día, duración única por nutricionista, validación de solapamiento.
- **Excepciones de disponibilidad**: bloqueo de día completo o rango parcial por fecha específica.
- **Ficha de salud estándar profesional**: alta, edición, validaciones de rango, alerta "actualizada recientemente" al nutricionista, consentimiento expreso, **historial de versiones**.
- **Turnos**: reserva por socio, creación por recepción, reprogramación, cancelación, check-in, ausente automático y manual. **El turno se crea directamente en CONFIRMADO** (no hay paso de confirmación por token).
- **Consulta nutricional**: registro asociado a turno, estructura semiestructurada con cálculos automáticos donde posible, editable con motivo, secciones de anamnesis/diagnóstico/examen físico/plan a seguir.
- **Mediciones físicas**: peso, altura, perímetros (cintura, cadera, pecho, brazo, muslo), composición corporal (% grasa, % músculo, grasa visceral), fotos de progreso (4 fotos por medición). **Cargadas solo por el nutricionista, siempre atadas a un turno, visibles al socio cuando se cierra la consulta**.
- **Plan alimentario**: alta, edición con motivo, baja lógica, **estructura por día de la semana con comidas configurables**, base de alimentos propia con seed, intercambios múltiples agrupados, validación de ingredientes contra alergias (warning + override), versionado activo + histórico.
- **Progreso**: tabla de mediciones, gráficos de evolución, comparativa de fotos antes/después, exportación PDF, manejo de outliers marcados.
- **Notificaciones por email** únicamente: transaccionales críticas (inmediato) y batch para menores. Recordatorios automáticos 24h + 1h antes del turno.
- **Auditoría**: registro inmutable de acciones sensibles con metadata completa.
- **Onboarding del socio**: wizard guiado de primera vez.
- **Compliance Ley 25.326** (parcial — ver §11.5): consentimiento, acceso, rectificación, supresión lógica. **NO incluye derecho de portabilidad JSON** (decisión de producto con riesgo legal documentado).

### 1.2 Excluye (queda para iteración 2+)

- Deportólogos, entrenadores, rutinas de entrenamiento.
- IA para sugerir comidas o planes.
- Videollamadas, chat en tiempo real.
- Pagos, facturación, gestión fiscal.
- Integración WhatsApp / SMS.
- App móvil nativa (web responsive sí).
- Multi-gimnasio para socios (un socio pertenece a un único gimnasio en iter 1).
- Marketplace o catálogo público de planes templates.
- Reasignación automática de turnos a otro nutricionista cuando se desactiva uno.
- Derivación interna entre nutricionistas (cada uno atiende su agenda aislado).
- Visibilidad de agendas entre nutricionistas.
- API pública para integraciones externas.
- Gamificación, logros, rankings.
- Soporte offline / PWA con service worker.
- Recordatorios automáticos de medición.
- Integración con balanzas o dispositivos Bluetooth.
- **Notificaciones in-app** (email únicamente).
- **Notificaciones push**.
- **Preferencias de notificación por usuario** (el sistema decide).
- **Confirmación de turno por token público o código** (el turno se crea CONFIRMADO directo).
- **Adherencia al plan alimentario** (el socio no marca comidas cumplidas).
- **Días no laborables / feriados del gimnasio** (no se modelan).
- **Gap / buffer entre turnos** del mismo nutricionista.
- **Campos custom en ficha de salud** (esquema fijo).
- **Cifrado en reposo de campos clínicos** (cifrado en tránsito sí).
- **WebSockets** (no hay nada que justifique tiempo real en iter 1).
- **Multi-idioma** (español rioplatense únicamente).
- **Export JSON del socio** (portabilidad Ley 25.326 — ver riesgo en §11.5).
- **Hard delete físico de cualquier dato** (soft o conservación).
- **Pliegue cutáneo, presión arterial** y otras mediciones especializadas (no se miden en iter 1).
- **Adherencia al plan con fotos de comida** (socio no sube fotos de comidas).
- **Recordatorios de medición al socio o nutricionista**.

### 1.3 Asunciones explícitas

- **Un gimnasio = un tenant.** Un nutricionista puede estar asociado a N gimnasios con agendas independientes. Un socio pertenece a un único gimnasio en iter 1.
- **"Activo" es el estado por defecto** al alta de cualquier entidad.
- **Auth via JWT** con access token corto + refresh token largo.
- **Storage de archivos en filesystem local** (`apps/backend/uploads/`) en iter 1.
- **Email transaccional**: en dev se loguea a consola o se usa MailHog/Ethereal; en prod SMTP real. Si SMTP cae, la acción NO se aborta; se registra en log de notificaciones fallidas con reintento exponencial.
- **Zona horaria**: la del gimnasio (configurada en `ConfiguracionGimnasio`).
- **Idioma**: español rioplatense para UI y mensajes al usuario.
- **Multi-tenant**: las decisiones de "1 nutricionista en N gimnasios" se modelan con tabla intermedia `nutricionista_gimnasio` con disponibilidad por gimnasio.

---

## 2. Glosario

| Término | Definición |
|---|---|
| Socio | Persona registrada con rol SOCIO. |
| Nutricionista | Persona registrada con rol NUTRICIONISTA. Especialidad fija "Nutricionista" en iter 1. |
| Recepción | Persona con rol RECEPCIONISTA. |
| Administrador | Persona con rol ADMIN. |
| Gimnasio | Tenant. |
| Ficha de salud | Documento clínico del socio. Datos sensibles. Tiene historial de versiones. |
| Disponibilidad semanal | Días y rangos horarios en que un nutricionista atiende. |
| Excepción | Bloqueo de un día o rango específico sobre la disponibilidad base. |
| Turno | Reserva de un slot entre un socio y un nutricionista. Se crea directamente en CONFIRMADO. |
| Consulta | Registro clínico asociado a un turno en estado PRESENTE/EN_CURSO/REALIZADO. |
| Medición | Snapshot de peso y medidas del socio en una fecha. Cargada por el nutricionista, atada a un turno, visible al socio al cerrar la consulta. |
| Plan alimentario | Conjunto de días y comidas asignado a un socio. Por día de la semana, comidas configurables, con intercambios múltiples agrupados. |
| Plan activo | El único plan vigente del socio. |
| Plan histórico | Versión anterior de un plan del socio. |
| Grupo de intercambio | Conjunto de alimentos equivalentes que el socio puede elegir dentro de una comida del plan. |
| Auditoría | Registro inmutable de acciones sensibles. |
| Notificación | Mensaje al usuario por email. Único canal en iter 1. |
| Outlier | Valor de medición estadísticamente atípico. Marcado en gráficos, no filtrado. |

---

## 3. Actores y matriz de permisos

### 3.1 Roles

| Rol | Responsabilidad principal | Restricciones |
|---|---|---|
| **ADMIN** | Gestiona usuarios, configuración del gimnasio, auditoría. | No realiza tareas operativas de recepción. |
| **RECEPCIONISTA** | Crea socios y nutricionistas, asigna turnos, cancela/reprograma turnos, marca asistencia. | No accede a ficha clínica, consultas, mediciones ni planes alimentarios. |
| **NUTRICIONISTA** | Configura su agenda, atiende consultas, registra mediciones, crea/edita/elimina planes. **Aislado**: solo ve su agenda y sus socios vinculados. | No ve agendas de otros nutricionistas. No deriva. |
| **SOCIO** | Completa ficha (con historial), reserva turnos, cancela/reprograma, consulta progreso y plan. | Solo accede a su propia información. |

### 3.2 Matriz de permisos (recurso × acción × rol)

Leyenda: ✅ permitido · ❌ denegado · ⚠️ con restricción

| Recurso | Acción | ADMIN | RECEPCIONISTA | NUTRICIONISTA | SOCIO |
|---|---|---|---|---|---|
| Nutricionista | Crear | ✅ | ✅ | ❌ | ❌ |
| Nutricionista | Editar datos administrativos | ✅ | ✅ | ⚠️ solo lo propio, limitado | ❌ |
| Nutricionista | Desactivar/Reactivar | ✅ | ✅ | ❌ | ❌ |
| Nutricionista | Listar activos (catálogo) | ✅ | ✅ | ✅ | ✅ |
| Nutricionista | Ver detalle | ✅ | ✅ | ✅ | ✅ |
| Nutricionista | Configurar disponibilidad propia | ❌ | ❌ | ✅ | ❌ |
| Nutricionista | Configurar disponibilidad ajena | ✅ | ✅ | ❌ | ❌ |
| Nutricionista | Ver agenda de otros | ❌ | ❌ | ❌ | ❌ |
| Socio | Crear | ✅ | ✅ | ⚠️ con auditoría de origen | ❌ |
| Socio | Editar datos administrativos | ✅ | ✅ | ❌ | ⚠️ solo lo propio |
| Socio | Desactivar/Reactivar | ✅ | ✅ | ❌ | ❌ |
| Ficha de salud | Cargar | ❌ | ❌ | ❌ | ✅ solo la propia |
| Ficha de salud | Editar (nueva versión) | ❌ | ❌ | ❌ | ✅ solo la propia |
| Ficha de salud | Ver versión actual | ❌ | ❌ | ⚠️ solo de socios con turno previo | ❌ |
| Ficha de salud | Ver historial de versiones | ❌ | ❌ | ⚠️ solo de socios con turno previo | ✅ propio |
| Ficha de salud | Ver (la propia, admin/recep) | ✅ si es del gimnasio | ❌ | ❌ | ✅ |
| Disponibilidad | Configurar | ✅ | ✅ (asistiendo al nutricionista) | ✅ solo la propia | ❌ |
| Excepciones | Cargar | ✅ | ✅ | ✅ solo la propia | ❌ |
| Turno | Reservar (socio) | ❌ | ❌ | ❌ | ✅ con ficha completa |
| Turno | Crear en nombre del socio | ✅ | ✅ | ❌ | ❌ |
| Turno | Cancelar | ✅ | ✅ con motivo | ✅ con motivo | ✅ con motivo, 24h mín. |
| Turno | Reprogramar | ✅ | ✅ con motivo | ✅ con motivo | ✅ con motivo, 24h mín. |
| Turno | Check-in | ✅ | ✅ | ❌ | ❌ |
| Turno | Marcar ausente manual | ✅ | ✅ | ❌ | ❌ |
| Consulta | Registrar | ❌ | ❌ | ✅ solo en sus turnos | ❌ |
| Consulta | Editar | ❌ | ❌ | ✅ propia con motivo | ❌ |
| Consulta | Ver (socio) | ❌ | ❌ | ❌ | ✅ solo la propia, cuando nutricionista la cierre |
| Medición | Registrar | ❌ | ❌ | ✅ para sus socios en sus turnos | ❌ |
| Medición | Ver (socio) | ❌ | ❌ | ❌ | ✅ solo la propia, cuando nutricionista la cierre |
| Plan alimentario | Crear | ❌ | ❌ | ✅ para sus socios | ❌ |
| Plan alimentario | Editar | ❌ | ❌ | ✅ propio con motivo | ❌ |
| Plan alimentario | Eliminar (baja lógica) | ❌ | ❌ | ✅ propio con motivo | ❌ |
| Plan alimentario | Ver activo/histórico | ❌ | ❌ | ✅ creador + nutricionistas con turno previo al socio | ✅ propio |
| Progreso | Ver | ❌ | ❌ | ✅ para sus socios | ✅ propio |
| Auditoría | Ver | ✅ (limitado a su gimnasio) | ❌ | ❌ | ❌ |

---

## 4. Modelo de dominio

### 4.1 Entidades principales

- **Gimnasio**: tenant raíz. Configuración (zona horaria, datos de contacto, etc.).
- **Usuario**: entidad base. `email`, `password_hash`, `rol`, `gimnasio_id`, `debe_cambiar_password`.
- **NutricionistaGimnasio**: N:M entre nutricionista y gimnasio. Tiene `disponibilidad_id` por gimnasio.
- **Nutricionista**: usuario NUTRICIONISTA + datos profesionales (matrícula, especialidad fija, presentación, formación, certificaciones, foto, duración de turno).
- **Socio**: usuario SOCIO + datos personales (DNI, fecha nacimiento, teléfono, observaciones administrativas).
- **DisponibilidadSemanal**: (nutricionista_gimnasio_id, dia_semana, hora_inicio, hora_fin). Múltiples rangos por día.
- **ExcepcionDisponibilidad**: (nutricionista_gimnasio_id, fecha, hora_inicio|null, hora_fin|null, motivo).
- **FichaSalud**: versión actual del socio. Apunta a `FichaSaludVersion` actual.
- **FichaSaludVersion**: cada versión histórica de la ficha. (socio_id, version, datos_json completo, created_at, created_by, motivo). Permite ver historial.
- **Turno**: (socio_id, nutricionista_gimnasio_id, fecha_hora, duracion_min, tipo_consulta, estado, motivo, creado_por, created_at, confirmado_at, cancelado_at, ausente_at, presente_at, en_curso_at, realizado_at, reprogramado_de_id, reprogramaciones_count).
- **Consulta**: (turno_id, nutricionista_id, socio_id, motivo_consulta, anamnesis_alimentaria, examen_fisico, diagnostico_nutricional, plan_a_seguir, recomendaciones, completada, cerrada_at, editada_at, motivo_edicion). **No tiene estado propio**.
- **Medicion**: (socio_id, nutricionista_id, turno_id, fecha, peso, altura_al_momento, imc, cintura, cadera, pecho, brazo, muslo, grasa_corporal, masa_muscular, grasa_visceral, notas_privadas_nutricionista, publicada_at, created_at).
- **FotoProgreso**: (medicion_id, tipo, archivo_path, orden). `tipo` ∈ {frente, perfil_izq, perfil_der, espalda}.
- **PlanAlimentario**: (socio_id, nutricionista_id, objetivo, calorias_diarias_objetivo|null, fecha_inicio, fecha_fin|null, activo, deleted_at, motivo_eliminacion).
- **PlanComida**: (plan_id, dia_semana, tipo_comida, orden, observaciones). `tipo_comida` ∈ {DESAYUNO, COLACION, ALMUERZO, MERIENDA, CENA, SNACK}.
- **GrupoIntercambio**: (comida_id, nombre_grupo, orden). Modela "podés comer cualquiera de estos".
- **PlanAlimento**: (grupo_intercambio_id, alimento_id, cantidad_gramos, orden, observaciones).
- **Alimento**: (nombre, calorias_por_100g, proteinas, carbohidratos, grasas, etiquetas_alergenos, etiquetas_intolerancias, activo). Tabla base con seed inicial.
- **Auditoria**: (id, usuario_id, gimnasio_id, accion, entidad, entidad_id, antes_json, despues_json, motivo, motivo_override, ip, user_agent, timestamp). Append-only.
- **LogNotificacion**: (id, gimnasio_id, usuario_id, evento, email_destino, enviado_at, error, reintentos). Tabla de auditoría de emails enviados.
- **ConfiguracionGimnasio**: (gimnasio_id, zona_horaria, datos_contacto, smtp_configurado, logo).

**Entidades eliminadas respecto a iteraciones de diseño previas:**
- ~~Notificacion~~ (in-app): no existe. Solo email.
- ~~TokenConfirmacion~~: no existe. El turno se crea CONFIRMADO directo.
- ~~PreferenciaNotificacion~~: no existe. El sistema decide.
- ~~RegistroAdherencia~~: no existe. El socio no marca comidas.

### 4.2 Multi-tenant

- **Gimnasio** es la raíz de aislamiento. Toda entidad (excepto Gimnasio, Alimento que es global) tiene `gimnasio_id` (directo o transitivo).
- Queries filtran siempre por `gimnasio_id` del usuario autenticado.
- Un nutricionista puede atender en N gimnasios vía `NutricionistaGimnasio` con disponibilidad y agendas separadas.
- Un socio pertenece a un único gimnasio en iter 1 (RB). Migrar a N:M en iter 2.

### 4.3 Datos mínimos por entidad

#### 4.3.1 Nutricionista

Obligatorios: nombre, apellido, email, matrícula profesional, estado (activo/inactivo), duración de turno (minutos, >0), gimnasio(s) donde atiende.
Opcionales: teléfono, DNI, fecha nacimiento, género, foto, presentación profesional, formación, certificaciones, diploma (archivo), tarifa sesión, años experiencia.

#### 4.3.2 Socio

Obligatorios: nombre, apellido, email, estado, gimnasio_id.
Opcionales: teléfono, DNI, fecha nacimiento, observaciones administrativas.

#### 4.3.3 Ficha de salud (estándar profesional)

**Obligatorios:**
- Altura (1.0–2.5 m)
- Peso actual (20–300 kg)
- Nivel de actividad física (enum: SEDENTARIO, LIGERO, MODERADO, INTENSO, MUY_INTENSO)
- Objetivo personal (texto)
- Alergias alimentarias (lista de strings o tags)
- **Intolerancias alimentarias** (lista separada de alergias: lactosa, gluten, fructosa, etc.)
- Patologías o condiciones relevantes (texto libre)
- Restricciones alimentarias (vegetariano, vegano, kosher, halal, celíaco, etc.)
- Observaciones generales (texto)
- **Consentimiento expreso** (checkbox obligatorio — RB)
- **Estado de embarazo/lactancia**: uno de {NO, EMBARAZADA, LACTANDO} + fecha de inicio probable/confirmada si aplica

**Opcionales:**
- Medicación actual
- Alimentos que no consume (gustos, no restricciones)
- Fumador (sí/no/ex)
- Consumo de alcohol (frecuencia/cantidad)
- Horas aproximadas de sueño
- Antecedentes relevantes
- **Historial de peso**: peso habitual, peso máximo alcanzado, peso mínimo reciente, peso objetivo

#### 4.3.4 Medición

**Principales (todas en este set, cargadas por nutricionista):**
- Peso (kg)
- Altura al momento (m, congelada para IMC histórico)
- IMC (calculado: peso / (altura/100)²)
- Cintura (cm)
- Cadera (cm)
- Pecho (cm)
- Brazo (cm)
- Muslo (cm)
- % grasa corporal (opcional, si el nutricionista lo mide)
- % masa muscular (opcional)
- Grasa visceral (opcional)
- **Notas privadas del nutricionista** (texto, NO visible al socio)
- **Visibilidad**: flag `publicada_at`. Se setea al cerrar la consulta.

**Excluidos en iter 1:** pliegues cutáneos, presión arterial, cuello, grasa visceral si no se mide, perímetros adicionales.

**Fotos de progreso (4 por medición):**
- Frente, perfil izquierdo, perfil derecho, espalda
- Formatos: jpg, jpeg, png, webp. Tamaño máx 5MB cada una.

#### 4.3.5 Plan alimentario

**Estructura:**
- Días: lunes a domingo
- Comidas por día: configurable por plan (subset de {DESAYUNO, COLACION, ALMUERZO, MERIENDA, CENA, SNACK})
- Cada comida tiene 1..N grupos de intercambio
- Cada grupo de intercambio tiene 1..N alimentos con cantidad en gramos
- Cada alimento puede tener observaciones

**Campos del plan:**
- Objetivo (texto, obligatorio)
- Calorías diarias objetivo (opcional)
- Notas generales del plan (opcional)

**Modelo de intercambio (múltiples alternativas agrupadas):**
```
PlanComida (lunes, DESAYUNO)
  └─ GrupoIntercambio "Lácteo" (orden 1)
       ├─ PlanAlimento: Yogur natural 200g
       ├─ PlanAlimento: Leche descremada 200ml
       └─ PlanAlimento: Queso cottage 150g
  └─ GrupoIntercambio "Fruta" (orden 2)
       ├─ PlanAlimento: Manzana 1 unidad
       └─ PlanAlimento: Banana 1 unidad
```

El socio elige UN alimento de cada grupo. Esto permite intercambios múltiples dentro de la misma comida.

---

## 5. Reglas de negocio (RB)

| ID | Regla | Aplicación | Verificación |
|---|---|---|---|
| RB01 | Email y matrícula únicos a nivel plataforma para nutricionista. | Alta/edición nutricionista. | `UNIQUE` constraint. |
| RB02 | Email único a nivel plataforma, DNI único dentro del gimnasio para socio. | Alta/edición socio. | `UNIQUE` constraint. |
| RB03 | Duración del turno única por nutricionista, aplica a todos sus rangos. | Configuración disponibilidad. | Validación use-case. Cambio con turnos futuros: advertir. |
| RB04 | No solapamiento de rangos horarios en disponibilidad semanal. | CU-04. | Validación use-case. |
| RB05 | Turnos solo dentro de agenda (disponibilidad + excepciones). | Reserva, creación, reprogramación. | Validación use-case. |
| RB06 | Reserva con ≥2h de anticipación. | CU-11, CU-12. | Validación use-case. |
| RB07 | Reserva con ≤60 días hacia adelante. | CU-11, CU-12. | Validación use-case. |
| RB08 | Reprogramar/cancelar con 24h mínimo (socio). | CU-13, CU-14. | Validación use-case. |
| RB09 | Cancelación y reprogramación requieren motivo. | CU-13, CU-14. | Campo obligatorio en request + auditoría. |
| RB10 | Reprogramación conserva el mismo turno (mismo ID), cambia fecha/hora, registra auditoría con antes/después. | CU-14. | Campo `reprogramado_de_id` para trazabilidad. |
| RB11 | Estado AUSENTE automático si pasaron 30 minutos desde el horario del turno sin check-in. | Job scheduler. | Cron cada 5 min, idempotente, con timezone del gimnasio. |
| RB12 | Recepción/Nutricionista pueden cancelar/reprogramar sin restricción de 24h, pero con motivo. | CU-13, CU-14. | Validación de rol + motivo. |
| RB13 | Nutricionista no atiende socio sin turno previo (en cualquier estado no terminal). | CU-09, CU-17, CU-18, CU-19, CU-20/21/22. | Existe Turno entre ambos con estado ∈ {PRESENTE, EN_CURSO, REALIZADO}. |
| RB14 | Ficha de salud completa (incluye consentimiento) es **obligatoria antes de reservar turno**. | CU-11, CU-12. | Check `ficha.actual.completada = true && consent_at IS NOT NULL`. |
| RB15 | Si el socio edita la ficha tras tener consultas, marca "actualizada recientemente". | CU-09, CU-17, CU-18. | Flag `ficha.actual.actualizada_at > MAX(consulta.created_at)`. Visible en agenda y detalle. |
| RB16 | Recepción NO accede a datos clínicos de la ficha. | Filtro a nivel controller/guard. | Guards + DTOs sin campos clínicos para RECEPCIONISTA. |
| RB17 | Nutricionista inactivo no aparece en listados ni recibe turnos nuevos. | Listado, reserva. | Filtro `estado = 'ACTIVO'`. |
| RB18 | Nutricionista inactivo con turnos futuros: cancelar con motivo "Nutricionista desactivado" y notificar. | CU-03. | Job/acción transaccional al desactivar. |
| RB19 | Excepción solo bloquea horarios, no agrega. | CU-05. | Intersección disponibilidad − excepciones. |
| RB20 | Excepciones que afectan turnos reservados: NO cancelar automático. Mostrar afectados y pedir acción (cancelar con motivo o conservar). | CU-05. | Confirmación obligatoria en UI. |
| RB21 | IMC histórico se calcula con la altura al momento de la medición. | CU-19. | Campo `altura_al_momento` congelado. |
| RB22 | Un socio puede tener un único plan activo; al crear uno nuevo, el anterior pasa a histórico. | CU-20. | Transacción: marcar `activo=false, fecha_fin=now()` al anterior + crear nuevo. |
| RB23 | Editar/eliminar plan requiere motivo y queda auditado. | CU-21, CU-22. | Campo motivo obligatorio. |
| RB24 | Plan con ingrediente incompatible con alergias/restricciones: **warning + override auditado**. | CU-20, CU-21. | Validación pre-guardado: cruzar `alimento.etiquetas` con `ficha.alergias` e `intolerancias`. Si confirma, se guarda + `motivo_override`. |
| RB25 | Nutricionista puede atender en N gimnasios con agendas independientes. | Multi-tenant. | Tabla `nutricionista_gimnasio` con `disponibilidad_id` por gimnasio. |
| RB26 | Socio pertenece a un único gimnasio en iter 1. | Multi-tenant. | `socio.gimnasio_id` NOT NULL. |
| RB27 | Slots únicos por nutricionista. | Concurrencia reserva. | `UNIQUE(nutricionista_gimnasio_id, fecha_hora) WHERE estado IN (CONFIRMADO, PRESENTE, EN_CURSO)`. |
| RB28 | Slots únicos por socio. | Concurrencia reserva. | `UNIQUE(socio_id, fecha_hora)` mismo filtro. |
| RB29 | Edición simultánea de ficha: last-write-wins + alerta visual "Ficha modificada por el socio" al nutricionista. | Concurrencia ficha. | `updated_at` + comparación. |
| RB30 | Edición simultánea de plan: lock optimista. El segundo recibe 409 "Plan modificado por otro usuario". | Concurrencia plan. | Campo `version` + check en update. |
| RB31 | (ELIMINADO) — Token público. El turno se crea CONFIRMADO directo. | — | — |
| RB32 | Contraseña provisional: 12 chars (1 may, 1 min, 1 num, 1 símb). Forzar cambio en 1er login. | Alta nutricionista/socio. | Validación + flag `debe_cambiar_password`. |
| RB33 | Acciones sensibles se registran en auditoría con metadata completa. | §9. | Insert en `auditoria` en transacción con la acción. |
| RB34 | Soft delete en planes (`deleted_at IS NOT NULL`). | CU-22. | Filtro `deleted_at IS NULL` en listados. |
| RB35 | (MODIFICADO) Si email falla, la acción NO se aborta. Se registra en `log_notificacion` con reintento exponencial. | §8.4. | Try/catch + tabla de log. |
| RB36 | (ELIMINADO — RIESGO) Export JSON de portabilidad. NO se implementa. Riesgo compliance Ley 25.326 aceptado. Ver §11.5. | — | — |
| RB37 | Socio puede solicitar supresión lógica de su cuenta. Ficha y datos clínicos → `deleted_at`. Historial de turnos se conserva por obligación legal. | Compliance. | Endpoint de solicitud. |
| RB38 | Primer login con contraseña provisional, DEBE cambiarla antes de operar. | RB32 + flujo. | Redirect forzado. |
| RB39 | Al desactivar nutricionista con turnos futuros, NO hay reasignación. Se cancelan y se notifica al socio con link al listado de activos. | CU-03. | Job al desactivar + notificación. |
| RB40 | Socio no puede tener 2 turnos el mismo día con el mismo nutricionista (salvo reprogramación). | UX. | Validación. |
| RB41 | Reprogramación limitada a 3 veces por turno. | Anti-abuso. | Contador `reprogramaciones_count`. |
| RB42 | Ficha editable aunque haya consultas realizadas. | CU-09. | Sin restricción + alerta "actualizada recientemente". Genera nueva versión. |
| RB43 | Creación de socio por nutricionista auditada con `motivo_origen='CREADO_POR_NUTRICIONISTA'`. | CU-06 alt. | Campo en auditoría. |
| RB44 | `ficha.consent_at` es obligatorio para que la ficha cuente como completa. | RB14. | Check. |
| RB45 | Nutricionista abre ficha → se setea `ficha.revisada_por_nutricionista_at` automáticamente. | Visibilidad. | Trigger en endpoint de lectura por nutricionista. |
| RB46 | Las mediciones solo las carga el nutricionista (no el socio). | CU-19. | Validación de rol en use-case. |
| RB47 | Las mediciones siempre están atadas a un turno. | CU-19. | `medicion.turno_id` NOT NULL. |
| RB48 | Las mediciones son visibles para el socio solo cuando el nutricionista cierra la consulta (`publicada_at IS NOT NULL`). | CU-19. | Filtro en query del socio. |
| RB49 | Las notas por medición son privadas del nutricionista. | CU-19. | Campo separado, no expuesto al socio. |
| RB50 | La ficha tiene historial de versiones. Cada edición genera una nueva `FichaSaludVersion` inmutable. | CU-08, CU-09. | Tabla `ficha_salud_version`. |
| RB51 | El plan tiene estructura por día de la semana con comidas configurables (subset de DESAYUNO/COLACION/ALMUERZO/MERIENDA/CENA/SNACK). | CU-20. | Validación. |
| RB52 | El plan usa grupos de intercambio: cada comida tiene 1..N grupos, cada grupo tiene 1..N alimentos. El socio elige UNO por grupo. | CU-20. | Modelo. |
| RB53 | La visibilidad del plan: socio + nutricionista creador + nutricionistas con turno previo con el socio. | §3.2, CU-20. | Filtro en query. |
| RB54 | El socio NO registra adherencia al plan. Sin foto de comida, sin marcar cumplimiento. | — | — (no implementado) |
| RB55 | El nutricionista NO ve la agenda de otros nutricionistas. | §3.2. | No hay endpoint de "agenda de otro". |
| RB56 | El gimnasio NO modela días no laborables / feriados. | — | — (no implementado) |
| RB57 | El sistema NO impone gap entre turnos del mismo nutricionista. | — | — (no implementado) |
| RB58 | El turno se crea directamente en estado CONFIRMADO (no hay paso de token de confirmación). | CU-11, CU-12. | `turno.estado = 'CONFIRMADO'` en INSERT. |
| RB59 | Las notificaciones son SOLO por email. No hay canal in-app, no hay push, no hay preferencias de notificación. | §8. | No hay entidad `notificacion` in-app. |
| RB60 | Recordatorios automáticos: 24h antes y 1h antes del turno. | §8. | Job scheduler, idempotente. |

---

## 6. Estados y transiciones

### 6.1 Turno

```
                ┌────────────────┐
                │   CONFIRMADO   │ ← estado inicial (reserva del socio o creación de recepción)
                └────────┬───────┘
                         │ check-in (recepción)
                         ▼
                ┌────────────────┐
                │   PRESENTE     │ ← socio llegó
                └────────┬───────┘
                         │ nutricionista inicia consulta
                         ▼
                ┌────────────────┐
                │   EN_CURSO     │ ← consulta en curso
                └────────┬───────┘
                         │ nutricionista finaliza
                         ▼
                ┌────────────────┐
                │   REALIZADO    │ ← consulta completada
                └────────────────┘

  (en cualquier estado pre-REALIZADO)
            │
            ▼
     ┌────────────────┐         ┌────────────────┐
     │  CANCELADO     │         │   AUSENTE      │
     │ (socio, rec.,  │         │ (auto: 30min   │
     │  nutricion.)   │         │  sin check-in  │
     └────────────────┘         │  o manual)     │
                                └────────────────┘
```

**Transiciones válidas:**
- `CONFIRMADO` → `PRESENTE` (check-in) | `CANCELADO` (cualquier actor con motivo) | `AUSENTE` (auto 30 min sin check-in, o manual)
- `PRESENTE` → `EN_CURSO` (nutricionista inicia) | `AUSENTE` (socio se fue sin atender)
- `EN_CURSO` → `REALIZADO` (nutricionista finaliza)
- `AUSENTE` y `CANCELADO` son terminales.
- `REALIZADO` es terminal.

**El estado PROGRAMADO no existe en iter 1.** El turno se crea directamente en CONFIRMADO (RB58).

### 6.2 Ficha de salud

```
FichaSalud (apunta a versión actual)
  └─ FichaSaludVersion v1 (inicial, completada)
  └─ FichaSaludVersion v2 (editada el 15/05)
  └─ FichaSaludVersion v3 (editada el 02/06) ← actual
```

Cada edición del socio genera una nueva `FichaSaludVersion` inmutable. La `FichaSalud` apunta a la versión actual. El historial completo se conserva.

Estados derivados:
- `COMPLETA`: existe versión con todos los campos obligatorios + `consent_at`.
- `ACTUALIZADA_RECIENTEMENTE`: `actualizada_at > MAX(consulta.created_at)` (o sin consultas y `actualizada_at < now() - 7 días`).
- `REVISADA_POR_NUTRICIONSTA`: timestamp en la última apertura por nutricionista.

### 6.3 Plan alimentario

```
  (nuevo plan)
       │
       ▼
   ACTIVO ◄─────────┐
       │             │ crear nuevo plan (transaccional: anterior → HISTORICO)
       ▼             │
  HISTORICO          │
  (activo=false,     │
   fecha_fin!=null)  │
       │             │
       ▼             │
  ELIMINADO          │
  (deleted_at!=null) │
       │             │
       └─────────────┘ (reactivar manualmente: setear activo=true, deleted_at=null)
```

- Un único plan `ACTIVO` por socio (constraint).
- `ELIMINADO` es independiente de `ACTIVO`/`HISTORICO`.

### 6.4 Nutricionista

```
ACTIVO ◄────► INACTIVO
  │                │
  │                └──► al pasar a INACTIVO: cancelar turnos futuros, notificar
  └──── alta (estado por defecto)
```

### 6.5 Socio

```
ACTIVO ◄────► INACTIVO
  │                │
  │                └──► al pasar a INACTIVO: cancelar turnos futuros pendientes
  └──── alta (estado por defecto)
```

### 6.6 Consulta nutricional

No tiene estado propio. Se considera "asociada" al turno en estado PRESENTE/EN_CURSO/REALIZADO. Tiene flag `completada` (boolean) y `cerrada_at` (timestamp). Al cerrar la consulta, se setean `cerrada_at` y `publicada_at` de las mediciones asociadas.

---

## 7. Casos de uso

### CU-01 — Registrar nutricionista

- **Actores**: RECEPCIONISTA, ADMIN.
- **Precondiciones**: autenticado y pertenece al gimnasio.
- **Postcondiciones**: nutricionista creado en estado ACTIVO, contraseña provisional, email enviado, auditoría.
- **Camino principal**:
  1. Accede a "Nutricionistas" → "Nuevo nutricionista".
  2. Completa datos obligatorios + gimnasio(s) donde atiende.
  3. Confirma.
  4. Sistema valida email/matrícula únicos (RB01).
  5. Genera contraseña provisional (RB32).
  6. Crea nutricionista + usuario + asociación a gimnasio(s).
  7. Envía email con credenciales.
  8. Marca `debe_cambiar_password = true`.
  9. Auditoría.
- **Alternativos**: email/matrícula duplicado → error claro; formato email inválido; falta matrícula; carga inicial INACTIVO.
- **Bordes**: dos registros simultáneos → `UNIQUE`; intento con otra especialidad → bloqueado (RB, todos son NUTRICIONISTA en iter 1); archivo diploma inválido (§10); SMTP falla → nutricionista se crea igual, log.
- **RB**: RB01, RB32, RB33, RB59.
- **Eventos**: `NUTRICIONISTA_CREADO` (email).
- **Auditoría**: `CREATE`, nutricionista.

### CU-02 — Editar nutricionista

- **Actores**: RECEPCIONISTA, ADMIN (cualquier campo), NUTRICIONISTA (datos limitados propios).
- **Precondiciones**: existe.
- **Postcondiciones**: actualizado, auditoría.
- **Camino principal**: buscar → detalle → modificar campos permitidos por rol → guardar → validar → auditar.
- **Alternativos**: email nuevo duplicado; matrícula duplicada; cambio de duración con turnos futuros (RB03 — advertir, no bloquear).
- **Bordes**: cambiar matrícula tras haber atendido; editar INACTIVO; cambiar email estando logueado (sesión queda con email viejo).
- **RB**: RB01, RB03, RB33.
- **Eventos**: `NUTRICIONISTA_ACTUALIZADO` (email al nutricionista).
- **Auditoría**: `UPDATE`, nutricionista, antes/después.

### CU-03 — Desactivar nutricionista

- **Actores**: RECEPCIONISTA, ADMIN.
- **Precondiciones**: existe, ACTIVO.
- **Postcondiciones**: INACTIVO, turnos futuros cancelados, socios notificados, auditoría.
- **Camino principal**:
  1. Buscar → "Desactivar".
  2. Sistema cuenta turnos futuros (CONFIRMADO, PRESENTE).
  3. Si hay, advertir "Hay N turnos futuros. Serán cancelados".
  4. Motivo obligatorio.
  5. Confirmar.
  6. Transacción: estado INACTIVO, cancelar turnos futuros con motivo "Nutricionista desactivado", auditoría por cada turno + del nutricionista.
  7. Notificar socios con link al listado de activos (RB39).
- **Alternativos**: sin turnos futuros → solo cambio de estado; cancelación de operación.
- **Bordes**: turno en curso (PRESENTE/EN_CURSO) → warning adicional; socio intenta reservar mientras se desactiva → falla con "ya no disponible".
- **RB**: RB17, RB18, RB33, RB39.
- **Eventos**: `NUTRICIONISTA_DESACTIVADO` (email admin), `TURNO_CANCELADO` (socio, con link).
- **Auditoría**: `DEACTIVATE`, nutricionista + una por turno cancelado.

### CU-04 — Configurar disponibilidad semanal

- **Actores**: NUTRICIONISTA (la propia), ADMIN, RECEPCIONISTA.
- **Precondiciones**: nutricionista ACTIVO.
- **Postcondiciones**: disponibilidad guardada, slots recalculados, auditoría.
- **Camino principal**:
  1. "Mi agenda" → "Configurar disponibilidad".
  2. Duración única del turno.
  3. Por día, agregar rangos (inicio/fin).
  4. Guardar.
  5. Validar: no solapamiento (RB04), duración > 0, fin > inicio.
  6. Calcular slots para 60 días.
  7. Auditoría.
- **Alternativos**: solapamiento (RB04); fin ≤ inicio; duración no genera slot completo; borrar rango con turnos futuros (advertir).
- **Bordes**: rango no múltiplo exacto de duración (se trunca al último slot completo); cambio de duración con turnos futuros (advertir, NO se modifican los reservados); cruza medianoche (no soportado).
- **RB**: RB03, RB04, RB05, RB33, RB57.
- **Eventos**: ninguno.
- **Auditoría**: `UPDATE`, disponibilidad_semanal.

### CU-05 — Cargar excepción de disponibilidad

- **Actores**: NUTRICIONISTA, ADMIN, RECEPCIONISTA.
- **Precondiciones**: existe nutricionista.
- **Postcondiciones**: excepción guardada, slots recalculados.
- **Camino principal**:
  1. "Excepciones de agenda" → fecha → tipo (día completo o rango parcial) → motivo opcional → guardar.
  2. Validar fecha ≤60 días.
- **Alternativos**: afecta turnos reservados → warning con listado, opciones: "Cancelar turnos con motivo" o "Conservar excepcionalmente" (RB20); rango parcial fuera de horario (permitido, puede bloquear slot puntual); fecha >60 días.
- **Bordes**: excepción duplicada (misma fecha y rango); bloqueo parcial que corta turno reservado.
- **RB**: RB19, RB20, RB33.
- **Eventos**: si se cancelan turnos, `TURNO_CANCELADO` por cada uno.
- **Auditoría**: `CREATE`, excepcion_disponibilidad.

### CU-06 — Crear socio

- **Actores**: RECEPCIONISTA, ADMIN, NUTRICIONISTA (con auditoría de origen, RB43).
- **Precondiciones**: autenticado.
- **Postcondiciones**: socio creado en estado ACTIVO, contraseña provisional, email enviado.
- **Camino principal**:
  1. "Socios" → "Nuevo socio" → datos básicos → confirmar.
  2. Validar email único (RB02) y DNI único dentro del gimnasio (RB02).
  3. Generar contraseña provisional.
  4. Crear socio + usuario + asignación a gimnasio.
  5. Email con credenciales.
  6. `debe_cambiar_password = true`.
  7. Auditoría con `motivo_origen`.
- **Alternativos**: email/DNI ya registrado; faltan obligatorios; sin ficha (permitido, recordatorio).
- **Bordes**: nutricionista crea socio (RB43); mismo DNI con email distinto dentro del mismo gimnasio (bloqueado); socio existe en otro gimnasio (permitido, tenant distinto).
- **RB**: RB02, RB26, RB32, RB33, RB43.
- **Eventos**: `SOCIO_CREADO` (email).
- **Auditoría**: `CREATE`, socio, motivo_origen.

### CU-07 — Desactivar socio

- **Actores**: RECEPCIONISTA, ADMIN.
- **Precondiciones**: existe, ACTIVO.
- **Postcondiciones**: INACTIVO, turnos futuros cancelados, auditoría.
- **Camino principal**:
  1. Buscar → "Desactivar" → motivo → confirmar.
  2. Cancelar turnos futuros con motivo "Socio desactivado".
  3. Cambio de estado + auditoría.
- **Alternativos**: sin turnos futuros; cancelación operación.
- **Bordes**: plan activo (warning, se conserva); consulta reciente (warning, no bloquea); socio intenta loguearse durante la desactivación (falla con mensaje claro).
- **RB**: RB33.
- **Eventos**: `SOCIO_DESACTIVADO` (email admin), `TURNO_CANCELADO` (socio + nutricionista).
- **Auditoría**: `DEACTIVATE`, socio.

### CU-08 — Completar ficha de salud

- **Actores**: SOCIO.
- **Precondiciones**: autenticado, sin ficha completa o pendiente de consentimiento.
- **Postcondiciones**: ficha COMPLETA con consentimiento, primera `FichaSaludVersion` creada, auditoría.
- **Camino principal**:
  1. "Mi ficha de salud".
  2. Completar obligatorios: altura, peso, nivel actividad, objetivo, **alergias**, **intolerancias**, **restricciones**, **embarazo/lactancia**, observaciones, **consentimiento** (RB44).
  3. Opcionales: medicación, hábitos alimentarios, fumador, alcohol, sueño, antecedentes, historial de peso.
  4. Guardar.
  5. Validar rangos (peso 20–300, altura 1.0–2.5).
  6. Marcar `completada=true`, `completada_at=now()`, `consent_at=now()`.
  7. Crear `FichaSaludVersion v1`.
  8. Auditoría.
- **Alternativos**: faltan obligatorios; valores fuera de rango; abandono del formulario.
- **Bordes**: declara alergias graves (sin acción especial, se almacena); texto libre con info sensible (aceptado); modifica antes de consulta (permitido, nueva versión).
- **RB**: RB14, RB42, RB44, RB50.
- **Eventos**: `FICHA_COMPLETADA` (email al socio).
- **Auditoría**: `CREATE`, ficha_salud.

### CU-09 — Editar ficha de salud

- **Actores**: SOCIO.
- **Precondiciones**: autenticado, tiene ficha.
- **Postcondiciones**: nueva versión de ficha, `actualizada_at` seteado, auditoría, alerta "actualizada recientemente" si tiene consultas.
- **Camino principal**:
  1. "Mi ficha" → modificar campos → guardar.
  2. Validar rangos.
  3. Crear nueva `FichaSaludVersion` (RB50). La anterior queda inmutable.
  4. Si tiene consultas previas, marcar "actualizada recientemente" (RB15, RB42).
  5. Auditoría con antes/después.
- **Alternativos**: campos inválidos; error al guardar; sin permiso.
- **Bordes**: cambia alergias y tiene plan activo (RB24 aplica en próxima apertura del plan por nutricionista); cambia peso (IMC histórico NO se recalcula, RB21); nutricionista está viendo mientras se edita (last-write-wins, RB29 + alerta).
- **RB**: RB15, RB21, RB29, RB33, RB42, RB50.
- **Eventos**: `FICHA_ACTUALIZADA` (email socio; a nutricionistas vinculados si alerta).
- **Auditoría**: `UPDATE`, ficha_salud, antes/después, motivo_cambio.

### CU-10 — Ver nutricionistas disponibles

- **Actores**: SOCIO.
- **Precondiciones**: autenticado.
- **Postcondiciones**: listado de nutricionistas activos.
- **Camino principal**:
  1. "Nutricionistas" → sistema muestra activos.
  2. Filtros: nombre, disponibilidad.
  3. Click en uno → detalle (CU-15).
- **Alternativos**: sin activos; socio sin ficha (puede ver, no reservar); filtros sin resultados.
- **Bordes**: nutricionista se desactiva durante navegación (siguiente request devuelve actualizado); intenta ver >60 días (no se muestra).
- **RB**: RB17.
- **Eventos**: ninguno.
- **Auditoría**: opcional.

### CU-11 — Reservar turno

- **Actores**: SOCIO.
- **Precondiciones**: ficha COMPLETA (RB14), socio ACTIVO, nutricionista ACTIVO (RB17), slot en agenda (RB05), ≥2h (RB06), ≤60 días (RB07), **no tiene 2 turnos el mismo día con el mismo nutricionista** (RB40).
- **Postcondiciones**: turno en estado **CONFIRMADO** (RB58, no requiere token), notificaciones, auditoría.
- **Camino principal**:
  1. Seleccionar nutricionista y ver disponibilidad (CU-10).
  2. Elegir fecha/hora.
  3. Confirmar.
  4. Validar precondiciones.
  5. Crear turno en CONFIRMADO (RB58).
  6. Email al socio con detalles.
  7. Email al nutricionista.
  8. Auditoría.
- **Alternativos**: ficha incompleta → redirige a CU-08; slot ya reservado (race) → "ese horario ya no está disponible"; <2h (RB06); >60 días (RB07); nutricionista INACTIVO (RB17); fecha bloqueada por excepción; ya tiene turno ese día con mismo nutricionista (RB40).
- **Bordes**: doble click → idempotente; dos socios al mismo slot → RB27 lo rechaza al segundo.
- **RB**: RB05, RB06, RB07, RB14, RB17, RB27, RB28, RB33, RB40, RB58.
- **Eventos**: `TURNO_CONFIRMADO` (email socio + nutricionista), recordatorios 24h+1h antes (RB60).
- **Auditoría**: `CREATE`, turno.

### CU-12 — Crear turno en nombre del socio

- **Actores**: RECEPCIONISTA, ADMIN.
- **Precondiciones**: socio ACTIVO, nutricionista ACTIVO, slot en agenda, ≥2h, ≤60 días, RB40.
- **Postcondiciones**: turno en CONFIRMADO (RB58), notificaciones, auditoría con `creado_por='RECEPCION'`.
- **Camino principal**:
  1. Buscar socio → seleccionar nutricionista → ver disponibilidad → elegir fecha/hora → confirmar.
  2. Validar precondiciones.
  3. Crear turno en CONFIRMADO.
  4. Email informativo al socio.
  5. Email al nutricionista.
  6. Auditoría.
- **Alternativos**: socio sin ficha (warning, no bloquea para recepción); socio INACTIVO (bloqueado); nutricionista sin disponibilidad; slot bloqueado.
- **Bordes**: turno fuera de política; socio recién creado sin ficha (warning); ya tiene turno ese día con mismo nutricionista.
- **RB**: RB05, RB06, RB07, RB17, RB27, RB28, RB33, RB40, RB58.
- **Eventos**: `TURNO_CREADO_POR_RECEPCION` (email socio + nutricionista).
- **Auditoría**: `CREATE`, turno, creado_por.

### CU-13 — Cancelar turno

- **Actores**: SOCIO (≥24h, RB08), RECEPCIONISTA/ADMIN/NUTRICIONISTA (sin restricción horaria, RB12).
- **Precondiciones**: turno en estado ∈ {CONFIRMADO, PRESENTE}.
- **Postcondiciones**: CANCELADO con motivo, slot liberado, notificaciones, auditoría.
- **Camino principal**:
  1. Acceder al turno → "Cancelar" → motivo (RB09) → confirmar.
  2. Validar política según actor.
  3. Cambiar estado a CANCELADO.
  4. Liberar slot.
  5. Notificar al otro actor.
  6. Auditoría.
- **Alternativos**: socio <24h (RB08, botón deshabilitado); ya CANCELADO/REALIZADO/AUSENTE; recepción/nutricionista por motivo administrativo.
- **Bordes**: cancelación simultánea (constraint lo evita); fallo de notificación (RB35); turno reprogramado.
- **RB**: RB08, RB09, RB12, RB33, RB35.
- **Eventos**: `TURNO_CANCELADO` (email al actor opuesto).
- **Auditoría**: `CANCEL`, turno, motivo.

### CU-14 — Reprogramar turno

- **Actores**: SOCIO (≥24h), RECEPCIONISTA/ADMIN/NUTRICIONISTA (sin restricción), todos con motivo.
- **Precondiciones**: turno ∈ {CONFIRMADO, PRESENTE}, `reprogramaciones_count < 3` (RB41).
- **Postcondiciones**: mismo turno con nueva fecha/hora, `reprogramaciones_count++`, motivo, auditoría.
- **Camino principal**:
  1. Seleccionar turno → "Reprogramar" → ver disponibilidad del mismo nutricionista → elegir nuevo slot → motivo → confirmar.
  2. Validar nueva fecha/hora en agenda (RB05), ≥2h (RB06), ≤60 días (RB07), no ocupado (RB27, RB28).
  3. Actualizar fecha/hora + `reprogramaciones_count++` (RB41).
  4. Notificar.
  5. Auditoría con antes/después.
- **Alternativos**: sin disponibilidad; nuevo bloqueado; nutricionista desactivado entre medio; 3 reprogramaciones ya (RB41).
- **Bordes**: múltiples reprogramaciones (RB41); dos actores al mismo slot; slot original queda libre y otro socio lo toma (permitido); cambio de tipo de consulta (no permitido, solo fecha/hora).
- **RB**: RB05, RB06, RB07, RB08, RB09, RB10, RB12, RB27, RB28, RB33, RB41.
- **Eventos**: `TURNO_REPROGRAMADO` (email al actor opuesto).
- **Auditoría**: `UPDATE`, turno, antes/después, motivo.

### CU-15 — Realizar check-in

- **Actores**: RECEPCIONISTA, ADMIN.
- **Precondiciones**: turno del día, estado ∈ {CONFIRMADO}.
- **Postcondiciones**: PRESENTE, `presente_at`, auditoría.
- **Camino principal**:
  1. Abrir turnos del día → buscar → "Marcar presente" → confirmar.
  2. Validar día actual.
  3. Cambiar a PRESENTE, setear `presente_at`.
  4. Auditoría.
- **Alternativos**: no es del día; CANCELADO/AUSENTE/REALIZADO; socio tarde y ya AUSENTE (admin revierte manualmente, auditado).
- **Bordes**: check-in duplicado (idempotente); socio equivocado (admin revierte).
- **RB**: RB33.
- **Eventos**: `TURNO_CHECKIN` (email al nutricionista).
- **Auditoría**: `CHECKIN`, turno.

### CU-16 — Marcar ausente automáticamente

- **Actores**: SISTEMA (cron cada 5 min).
- **Precondiciones**: cron ejecutándose.
- **Postcondiciones**: turnos con `fecha_hora + 30min < now()` y sin `presente_at` → AUSENTE, `ausente_at`, auditoría.
- **Camino principal**:
  1. Job: `SELECT turnos WHERE estado='CONFIRMADO' AND fecha_hora < now() - 30min AND presente_at IS NULL`.
  2. Por cada uno: AUSENTE + `ausente_at=now()` + auditoría.
- **Alternativos**: ya marcado PRESENTE/AUSENTE; CANCELADO (excluido).
- **Bordes**: job tarde (idempotente); timezone del gimnasio; turno reprogramado antes del control.
- **RB**: RB11, RB33.
- **Eventos**: `TURNO_AUSENTE_AUTO` (email socio + nutricionista).
- **Auditoría**: `AUTO_ABSENT`, turno.

### CU-17 — Ver agenda del día

- **Actores**: NUTRICIONISTA (solo su agenda, RB55).
- **Precondiciones**: autenticado.
- **Postcondiciones**: lista de turnos del día.
- **Camino principal**:
  1. "Mi agenda" → ver turnos del día.
  2. Abrir detalle de un turno → ver ficha (con permiso RB13), registrar consulta/medición.
- **Alternativos**: sin turnos del día; socio sin ficha; turno CANCELADO/AUSENTE (visible con badge).
- **Bordes**: turnos muy próximos; ficha actualizada recientemente (alerta); socio no vinculado (403, RB13).
- **RB**: RB13, RB15, RB45, RB55.
- **Eventos**: cada apertura de ficha registra `revisada_por_nutricionista_at` (RB45).
- **Auditoría**: `VIEW_FICHA` opcional.

### CU-18 — Registrar consulta nutricional

- **Actores**: NUTRICIONISTA.
- **Precondiciones**: turno en PRESENTE/EN_CURSO/REALIZADO (RB13), socio vinculado.
- **Postcondiciones**: consulta registrada, asociada al turno, editable con motivo, auditoría.
- **Estructura**: **semiestructurada con cálculos automáticos donde posible** (ej. IMC se calcula al cerrar; calorías estimadas si se cargan alimentos; etc.).
- **Secciones obligatorias/opcionales**:
  - `motivo_consulta` (obligatorio)
  - `anamnesis_alimentaria` (qué come el paciente, texto estructurado)
  - `examen_fisico` (observaciones: piel, cabello, uñas, edema, etc.)
  - `diagnostico_nutricional` (texto del nutricionista)
  - `plan_a_seguir` (texto libre con próximos pasos)
  - `recomendaciones` (texto libre)
- **Camino principal**:
  1. Abrir turno del socio → "Registrar consulta".
  2. Completar secciones.
  3. (Opcional) Cargar mediciones → asociadas a la consulta y turno.
  4. Guardar.
  5. Al cerrar la consulta: `cerrada_at=now()`, `completada=true`, **publicar mediciones asociadas** (`medicion.publicada_at=now()`).
  6. Auditoría.
- **Alternativos**: turno no en estado válido; falta motivo_consulta; error al adjuntar.
- **Bordes**: edita la consulta luego de guardada → permitido, `editada_at` y `motivo_edicion` requeridos; ficha cambió durante atención (diff al guardar); valores de medición fuera de rango.
- **Edición post-cierre**: **permitida con motivo + auditoría**.
- **Separación con el plan**: la consulta y el plan son independientes. La consulta puede mencionar/derivar a un plan, pero no lo crea automáticamente.
- **RB**: RB13, RB33, RB48 (publicar mediciones al cerrar).
- **Eventos**: `CONSULTA_REGISTRADA` (email socio), `MEDICIONES_PUBLICADAS` (email socio si hay mediciones asociadas).
- **Auditoría**: `CREATE` / `UPDATE`, consulta, motivo_edicion.

### CU-19 — Registrar mediciones

- **Actores**: NUTRICIONISTA (único, RB46).
- **Precondiciones**: turno PRESENTE/EN_CURSO/REALIZADO (RB13, RB47 — siempre atada a turno).
- **Postcondiciones**: medición guardada con `turno_id` (RB47), IMC calculado con altura al momento (RB21), `publicada_at` se setea al cerrar la consulta (RB48), notas privadas del nutricionista (RB49), auditoría.
- **Camino principal**:
  1. Dentro de la consulta o desde el turno → "Registrar medición".
  2. Ingresar peso, altura al momento, perímetros (cintura, cadera, pecho, brazo, muslo), composición corporal (% grasa, % músculo, grasa visceral).
  3. Sistema calcula IMC = peso / (altura/100)².
  4. (Opcional) Subir 4 fotos de progreso.
  5. (Opcional) Notas privadas del nutricionista (no las ve el socio).
  6. Guardar.
  7. `publicada_at` se setea cuando se cierra la consulta (no en este momento).
  8. Auditoría.
- **Mediciones excluidas en iter 1**: pliegues cutáneos, presión arterial, cuello.
- **Alternativos**: falta altura (IMC no se calcula); valores fuera de rango; omite opcionales.
- **Bordes**: dos mediciones mismo día (warning); corrige una anterior (permitido, `editada_at` y motivo, IMC histórico NO se recalcula, RB21); cambio de altura (NO recalcula histórico).
- **RB**: RB13, RB21, RB33, RB46, RB47, RB48, RB49.
- **Eventos**: al cerrar la consulta, `MEDICIONES_PUBLICADAS` (email socio, no antes).
- **Auditoría**: `CREATE` / `UPDATE`, medicion, motivo_edicion.

### CU-20 — Crear plan alimentario

- **Actores**: NUTRICIONISTA.
- **Precondiciones**: turno previo con el socio (RB13), ficha completa (RB14).
- **Postcondiciones**: plan creado en ACTIVO, plan activo anterior (si existe) a HISTORICO en la misma transacción (RB22), auditoría.
- **Estructura del plan (RB51, RB52)**:
  - Por cada día de la semana (lunes a domingo):
    - Elegir comidas del set permitido: DESAYUNO, COLACION, ALMUERZO, MERIENDA, CENA, SNACK.
    - Por cada comida, crear 1..N grupos de intercambio.
    - Por cada grupo, 1..N alimentos con cantidad en gramos.
- **Camino principal**:
  1. Abrir perfil del socio → "Crear plan".
  2. Objetivo (obligatorio).
  3. Calorías diarias objetivo (opcional).
  4. Cargar días y comidas (mínimo 1 día con 1 comida, RB51).
  5. Por cada comida, grupos de intercambio con alimentos (RB52).
  6. Validar ingredientes contra alergias/intolerancias (RB24): si hay incompatibilidad, warning con override auditado (`motivo_override`).
  7. Transacción: marcar plan activo anterior como HISTORICO, crear nuevo como ACTIVO.
  8. Auditoría.
- **Alternativos**: ingrediente restringido → warning + override; falta objetivo; no se cargó ninguna comida; socio sin ficha.
- **Bordes**: cambio de alergias posterior a crear plan (alerta en próxima apertura del plan); edición simultánea (lock optimista, RB30); plan creado por error.
- **RB**: RB13, RB14, RB22, RB24, RB30, RB33, RB51, RB52, RB53.
- **Eventos**: `PLAN_CREADO` (email socio).
- **Auditoría**: `CREATE`, plan_alimentario, antes_json del plan anterior si existía.

### CU-21 — Editar plan alimentario

- **Actores**: NUTRICIONISTA.
- **Precondiciones**: plan existe, ACTIVO.
- **Postcondiciones**: actualizado, motivo registrado, auditoría.
- **Camino principal**:
  1. Abrir plan activo → modificar días/comidas/grupos/alimentos.
  2. Motivo de edición (RB23).
  3. Validar restricciones (RB24).
  4. Lock optimista (RB30).
  5. Auditoría.
- **Alternativos**: motivo no informado; ingrediente incompatible (RB24); plan eliminado/inactivo.
- **Bordes**: socio viendo mientras se edita (al recargar ve nueva versión); elimina única comida del día (warning); edición sin cambios reales (warning).
- **RB**: RB23, RB24, RB30, RB33.
- **Eventos**: `PLAN_ACTUALIZADO` (email socio).
- **Auditoría**: `UPDATE`, plan_alimentario, antes/después, motivo.

### CU-22 — Eliminar plan alimentario

- **Actores**: NUTRICIONISTA.
- **Precondiciones**: plan existe.
- **Postcondiciones**: `deleted_at` seteado (RB34), socio sin plan activo, auditoría.
- **Camino principal**:
  1. Abrir plan → "Eliminar" → motivo (RB23) → confirmar.
  2. Baja lógica.
  3. Si era activo, socio sin plan activo.
  4. Auditoría.
- **Alternativos**: ya eliminado; falta motivo; sin permiso.
- **Bordes**: eliminación accidental (reactivable con auditoría); hay históricos (no afectados); socio abre plan eliminado desde caché viejo.
- **RB**: RB23, RB33, RB34.
- **Eventos**: `PLAN_ELIMINADO` (email socio).
- **Auditoría**: `DELETE`, plan_alimentario, motivo.

### CU-23 — Ver progreso del socio

- **Actores**: SOCIO (el propio, con mediciones publicadas), NUTRICIONISTA (socios vinculados, RB13).
- **Precondiciones**: autenticado. Para socio, solo ve mediciones con `publicada_at IS NOT NULL` (RB48).
- **Postcondiciones**: vista de progreso.
- **Camino principal**:
  1. "Progreso" → seleccionar período (mes, 3 meses, 6 meses, año, todo).
  2. **Gráficos de evolución**: peso, IMC, perímetros principales, % grasa. Selector de variable y rango.
  3. **Comparativa de fotos**: slider o grid primera vs última.
  4. **Tabla detallada**: todas las mediciones crudas, filtrable.
  5. **Exportar PDF** del progreso.
- **Excluido en iter 1**: comparación contra objetivo del plan (no implementado).
- **Outliers**: marcados con punto/color distinto y leyenda "valor atípico, posible error de carga". No se filtran automáticamente (el usuario decide si filtrar visualmente).
- **Alternativos**: sin mediciones publicadas → "Aún no hay mediciones para mostrar"; período sin datos; sin permiso.
- **Bordes**: valores extremos distorsionan gráfico (marcados, no filtrados); mediciones duplicadas mismo día (warning, no se ocultan); datos corregidos después (reporte refleja última versión).
- **RB**: RB13, RB48.
- **Eventos**: ninguno.
- **Auditoría**: `VIEW_PROGRESO` opcional para nutricionista.

---

## 8. Eventos y notificaciones

### 8.1 Catálogo de eventos (todos por email — RB59)

| Evento | Destinatarios | Email | Momento |
|---|---|---|---|
| `NUTRICIONISTA_CREADO` | Nutricionista, Admin | ✅ | Inmediato |
| `NUTRICIONISTA_ACTUALIZADO` | Nutricionista, Admin | ✅ | Inmediato |
| `NUTRICIONISTA_DESACTIVADO` | Admin | ✅ | Inmediato |
| `SOCIO_CREADO` | Socio, Admin | ✅ | Inmediato |
| `SOCIO_DESACTIVADO` | Admin | ✅ | Inmediato |
| `FICHA_COMPLETADA` | Socio | ✅ | Inmediato |
| `FICHA_ACTUALIZADA` | Socio (y nutricionistas vinculados si alerta) | ✅ | Inmediato |
| `TURNO_CONFIRMADO` | Socio, Nutricionista | ✅ | Inmediato (es el alta del turno) |
| `TURNO_CREADO_POR_RECEPCION` | Socio, Nutricionista | ✅ | Inmediato |
| `TURNO_REPROGRAMADO` | Actor opuesto | ✅ | Inmediato |
| `TURNO_CANCELADO` | Actor opuesto, Nutricionista/Socio | ✅ | Inmediato |
| `TURNO_CHECKIN` | Nutricionista | ✅ | Inmediato |
| `TURNO_AUSENTE_AUTO` | Socio, Nutricionista | ✅ | Inmediato |
| `RECORDATORIO_TURNO_24H` | Socio, Nutricionista | ✅ | 24h antes del turno (RB60) |
| `RECORDATORIO_TURNO_1H` | Socio | ✅ | 1h antes del turno (RB60) |
| `CONSULTA_REGISTRADA` | Socio, Nutricionista | ✅ | Inmediato |
| `MEDICIONES_PUBLICADAS` | Socio | ✅ | Al cerrar la consulta (RB48) |
| `MEDICION_REGISTRADA` | Nutricionista (interno) | ❌ (es interno, no notifica al socio hasta publicar) | Inmediato |
| `PLAN_CREADO` | Socio | ✅ | Inmediato |
| `PLAN_ACTUALIZADO` | Socio | ✅ | Inmediato |
| `PLAN_ELIMINADO` | Socio | ✅ | Inmediato |

**No hay eventos eliminados**: el evento `TURNO_CONFIRMADO` ahora ocurre al alta del turno (no requiere paso posterior de token).

### 8.2 Canal

- **Único canal en iter 1: email.** SMTP. Variables de entorno. En dev: log a consola o MailHog/Ethereal.
- **No hay in-app** (RB59).
- **No hay push** (RB59).
- **No hay preferencias por usuario** (RB59).

### 8.3 Plantillas

- Estructura: `{ key, asunto, cuerpo_html, cuerpo_texto, variables[] }`.
- Variables tipadas, renderizadas en backend.
- Localización: español rioplatense.
- Versionadas: `template_v1`, `template_v2` (en DB o filesystem).

### 8.4 Fallback

- Si SMTP falla: la acción NO se aborta (RB35). Se registra en `log_notificacion` con `error` y se reintenta con backoff exponencial (1min, 5min, 30min, 2h, 24h). Después se marca como fallida definitivamente.
- Admin puede ver la cola de reintentos en un panel y forzar reenvío manual.

### 8.5 Recordatorios automáticos

- Job scheduler separado, idempotente.
- Corre cada 5 min, busca turnos con `estado='CONFIRMADO'` y `fecha_hora` dentro de las próximas 24h±ventana y próximas 1h±ventana, que no tengan `recordatorio_24h_enviado` / `recordatorio_1h_enviado`.
- Marca el flag correspondiente al enviar.

---

## 9. Auditoría

### 9.1 Qué se audita

Toda acción que modifique estado sensible:

- Crear/editar/desactivar nutricionista.
- Crear/editar/desactivar socio.
- Crear/editar ficha de salud (cada versión).
- Crear/reprogramar/cancelar/checkin/ausente de turno.
- Crear/editar consulta.
- Crear/editar medición.
- Crear/editar/eliminar plan alimentario.
- Login/logout/cambio de contraseña.
- Accesos a ficha de salud por nutricionista (RB45 con timestamp).
- Creación de alimentos nuevos por nutricionista (si se permite en admin).
- Modificación de configuración del gimnasio.

### 9.2 Metadata de auditoría

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK. |
| `usuario_id` | UUID | Quién ejecutó. NULL si fue el sistema. |
| `gimnasio_id` | UUID | Tenant. |
| `accion` | enum | CREATE, UPDATE, DELETE, CANCEL, CHECKIN, AUTO_ABSENT, LOGIN, LOGOUT, VIEW, OVERRIDE, etc. |
| `entidad` | string | nutricionista, socio, ficha_salud, turno, consulta, medicion, plan_alimentario, etc. |
| `entidad_id` | UUID | PK afectada. |
| `antes_json` | json | Estado previo (UPDATE/DELETE). |
| `despues_json` | json | Estado nuevo (CREATE/UPDATE). |
| `motivo` | string | Motivo declarado (cuando aplica). |
| `motivo_override` | string | Para overrides de validaciones (ej. ingrediente con alergia). |
| `ip` | string | IP del cliente. |
| `user_agent` | string | User agent. |
| `timestamp` | timestamp | Cuándo ocurrió. |

### 9.3 Acceso

- Solo ADMIN puede consultar, filtrada por su gimnasio.
- No se puede modificar ni eliminar (inmutabilidad: append-only + DB constraint).
- Vista: tabla con filtros (usuario, acción, entidad, rango de fechas).

### 9.4 Retención

- Indefinida en iter 1.
- Ajustar por regulación específica en iter 2+ si aplica.

---

## 10. Archivos y adjuntos

### 10.1 Storage

- Filesystem local: `apps/backend/uploads/`.
- Estructura: `uploads/{gimnasio_id}/{tipo}/{uuid}.{ext}`.
- `tipo` ∈ {`fotos-perfil`, `diplomas`, `adjuntos-consulta`, `fotos-progreso`, `logos`}.
- Nombre: UUID v4.
- Backup: responsabilidad de operaciones.

### 10.2 Límites y formatos

| Tipo | Formatos | Tamaño máx | Validaciones |
|---|---|---|---|
| Foto de perfil | jpg, jpeg, png, webp | 5 MB | Dimensiones ≤4000×4000. |
| Diploma/matrícula | pdf, jpg, png | 10 MB | PDF: máx 5 páginas. |
| Adjuntos de consulta | pdf, jpg, png, docx | 10 MB | Magic numbers, no solo extensión. |
| Fotos de progreso | jpg, jpeg, png, webp | 5 MB por foto, 4 fotos por medición | Dimensiones ≥640×480. |
| Logo gimnasio | svg, png, jpg | 2 MB | svg saneado. |

### 10.3 Manejo de errores

- Subida falla → acción aborta con mensaje claro.
- Archivo malicioso → rechazo + log.
- Storage lleno → error 500 + alerta admin.
- Creación (nutricionista) con archivo obligatorio y subida que falla → rollback.

---

## 11. Seguridad y compliance

### 11.1 Autenticación

- JWT access (corto, 15min) + refresh (largo, 7 días).
- Refresh rotativo.
- Access en memoria, refresh en httpOnly cookie + secure.
- Contraseñas: bcrypt cost 12 o argon2id.
- Política: mínimo 8 chars, 1 may, 1 min, 1 num. Provisionales: 12 chars con símbolo (RB32).
- Bloqueo: 5 intentos fallidos → 15 min.
- Forzar cambio en primer login (RB38).
- Logout: invalida refresh.

### 11.2 Autorización

- Guards por rol a nivel controller.
- Filtros a nivel use-case que verifican gimnasio_id y ownership.
- Socio solo ve lo propio. Nutricionista solo ve socios con turnos previos (RB13).
- Nutricionista NO ve agenda de otros (RB55).
- Rate limit: 100 req/min por usuario, 10 req/min para login/reset.

### 11.3 Tokens públicos

**No aplica en iter 1** (RB31 eliminado). El turno se crea CONFIRMADO directo (RB58).

### 11.4 Datos sensibles

- Ficha de salud: cifrada en tránsito (TLS). Cifrado en reposo NO en iter 1.
- Logs: NUNCA datos clínicos en claro.
- Backups: cifrados (operaciones).

### 11.5 Compliance Ley 25.326 (Argentina) — CUMPLIMIENTO PARCIAL

| Derecho | Estado en iter 1 | Notas |
|---|---|---|
| Consentimiento expreso | ✅ Implementado | Checkbox obligatorio al completar ficha, registrado en `consent_at` (RB44). |
| Derecho de acceso | ✅ Implementado | El socio ve todos sus datos desde su perfil. |
| Derecho de rectificación | ✅ Implementado | Edición de ficha, datos personales. |
| Derecho de supresión | ✅ Implementado | Endpoint + baja lógica (RB37). |
| **Derecho de portabilidad (JSON)** | ❌ **NO IMPLEMENTADO** | **Riesgo legal alto aceptado por decisión de producto.** Si el socio solicita sus datos en formato estructurado, el sistema solo puede dar PDF, lo que no cumple estrictamente con Ley 25.326 art. 13. **Mitigación**: si se presenta el caso, se exporta el PDF del reporte de progreso + plan activo + ficha, reconociendo que NO es cumplimiento total. |

**Recomendación**: revisar esta decisión antes de salir a producción real con socios. Considerar exportación JSON aunque sea como feature mínima de portabilidad.

---

## 12. Concurrencia y atomicidad

### 12.1 Mecanismos por flujo

| Flujo | Mecanismo | RB |
|---|---|---|
| Reserva de turno | `UNIQUE(nutricionista_gimnasio_id, fecha_hora) WHERE estado IN (CONFIRMADO, PRESENTE, EN_CURSO)` + `UNIQUE(socio_id, fecha_hora)` mismo filtro | RB27, RB28 |
| Reserva | Transacción con `SELECT ... FOR UPDATE` sobre slots | — |
| Reprogramación | `SELECT ... FOR UPDATE` + `reprogramaciones_count++` | RB10, RB41 |
| Cancelación | `SELECT ... FOR UPDATE` + validar estado | — |
| Edición de ficha | last-write-wins + nueva versión (RB50) | RB29 |
| Edición de plan | Lock optimista con `version` | RB30 |
| Desactivación nutricionista | Transacción completa | — |
| Ausente automático | Cron con idempotencia | RB11 |
| Publicación de mediciones | Transaccional con cierre de consulta | RB48 |

### 12.2 Resolución de conflictos

- Doble click en reservar: el backend usa el turno recién creado. Si ya existe, devuelve 200 con el existente.
- Dos requests al mismo slot: `UNIQUE` rechaza al segundo con 409.
- Edición simultánea de plan: el segundo recibe 409. Frontend recarga.

---

## 13. Onboarding y primera vez

### 13.1 Socio

Wizard de 3 pasos:

1. **Bienvenida + cambio de contraseña** (RB38).
2. **Completar ficha de salud** (CU-08). Sin ficha completa, no puede avanzar al paso 3 (RB14).
3. **Explorar profesionales y reservar primer turno** (CU-10 + CU-11).

Una vez completado, no se muestra más.

### 13.2 Nutricionista

1. Cambio de contraseña (RB38).
2. Configurar disponibilidad semanal (CU-04). Sin disponibilidad, no recibe turnos.
3. (Opcional) Foto, presentación, formación.
4. Estado OPERATIVO cuando tiene disponibilidad.

### 13.3 Recepción

Dashboard inicial:
- Turnos del día (cualquier nutricionista del gimnasio).
- Socios nuevos del día.
- (Sin wizard obligatorio, tooltips contextuales.)

---

## 14. Definition of Done

### 14.1 Por módulo

**Nutricionista (CU-01/02/03)**
- [ ] CRUD con RB01, RB32, RB59.
- [ ] Listado con filtros.
- [ ] Desactivación con cancelación de turnos + email (RB17, RB18, RB39).
- [ ] Auditoría.
- [ ] Tests unitarios + e2e.

**Socio (CU-06/07)**
- [ ] CRUD con RB02, RB26.
- [ ] Wizard de onboarding.
- [ ] Desactivación con cancelación.
- [ ] Auditoría.

**Ficha de salud (CU-08/09)**
- [ ] Carga con consentimiento y campos estándar profesional (RB14, RB44).
- [ ] Historial de versiones (RB50).
- [ ] Edición con alerta "actualizada recientemente" (RB15, RB42).
- [ ] Validaciones de rango.
- [ ] Visibilidad nutricionista con turnos previos (RB13).
- [ ] Auditoría + RB45.

**Disponibilidad (CU-04/05)**
- [ ] Configuración semanal con rangos múltiples (RB04).
- [ ] Duración única (RB03).
- [ ] Excepciones con confirmación (RB19, RB20).
- [ ] Auditoría.

**Turnos (CU-11/12/13/14/15/16)**
- [ ] Reserva con todas las validaciones (RB05, RB06, RB07, RB14, RB27, RB28, RB40).
- [ ] Creación por recepción con `creado_por`.
- [ ] **Turno se crea CONFIRMADO directo (RB58, sin token)**.
- [ ] Cancelación con motivo y reglas de anticipación (RB08, RB09, RB12).
- [ ] Reprogramación que conserva ID (RB10) + límite de 3 (RB41).
- [ ] Check-in por recepción.
- [ ] Ausente automático cada 5 min (RB11).
- [ ] **Recordatorios 24h+1h (RB60)**.
- [ ] Auditoría completa.
- [ ] Tests de concurrencia.

**Consulta y Medición (CU-17/18/19)**
- [ ] Agenda del día con filtros.
- [ ] Consulta semiestructurada con secciones (RB estructura).
- [ ] Consulta editable con motivo.
- [ ] Mediciones solo por nutricionista (RB46), atadas a turno (RB47), publicadas al cerrar consulta (RB48).
- [ ] Fotos de progreso con 4 slots.
- [ ] Notas privadas del nutricionista (RB49).
- [ ] Auditoría.

**Plan alimentario (CU-20/21/22)**
- [ ] Alta con anterior a histórico (RB22).
- [ ] Estructura por día de la semana (RB51).
- [ ] Comidas configurables.
- [ ] Grupos de intercambio múltiples (RB52).
- [ ] Validación con warning + override (RB24).
- [ ] Edición con motivo (RB23).
- [ ] Baja lógica (RB34).
- [ ] Lock optimista (RB30).
- [ ] Visibilidad según RB53.
- [ ] **Sin adherencia (RB54)**.
- [ ] Auditoría.

**Progreso (CU-23)**
- [ ] Gráficos de evolución.
- [ ] Comparativa de fotos.
- [ ] Tabla detallada.
- [ ] Outliers marcados (no filtrados).
- [ ] Exportación PDF.
- [ ] **Sin comparación contra objetivo** (excluido).
- [ ] **Sin export JSON** (excluido por riesgo compliance).
- [ ] Visibilidad por rol + filtro `publicada_at` para socio (RB48).

**Notificaciones (§8)**
- [ ] **Solo email (RB59)**. Sin in-app, sin push, sin preferencias.
- [ ] Catálogo de eventos completo.
- [ ] Plantillas versionadas.
- [ ] Fallback con reintento exponencial (RB35).
- [ ] Recordatorios 24h+1h (RB60).

**Cross-cutting**
- [ ] Auditoría append-only con metadata completa.
- [ ] Manejo de archivos con validaciones.
- [ ] Onboarding del socio funcional.
- [ ] Tests e2e de flujos críticos.

### 14.2 DoD global

- [ ] Todos los RB implementados y verificados con test.
- [ ] Auditoría cubre el 100% de acciones sensibles.
- [ ] OpenAPI actualizado.
- [ ] Manual de usuario para recepción y nutricionista.
- [ ] No hay bugs P1/P2 abiertos.
- [ ] Performance: <500ms p95 lectura, <1s p95 escritura.
- [ ] Logs estructurados, sin datos clínicos en claro.
- [ ] Deploy documentado.

---

## 15. Métricas de éxito

| Métrica | Objetivo | Medición |
|---|---|---|
| Nutricionistas activos | ≥1 por gimnasio en producción | COUNT WHERE estado='ACTIVO' |
| Socios con ficha completa | ≥80% de socios registrados | COUNT WHERE ficha.completada=true |
| Turnos reservados por nutricionista/semana | ≥5 | COUNT turnos últimos 7d |
| Planes activos | ≥50% de socios con consulta realizada | COUNT planes WHERE activo=true |
| Tasa de cancelación (socios) | <15% | COUNT CANCELADO BY socio / COUNT CONFIRMADO |
| Tasa de ausente | <10% | COUNT AUSENTE / COUNT CONFIRMADO |
| Tiempo medio check-in | <10 min | AVG(presente_at - fecha_hora) |
| Consultas registradas por turno PRESENTE | ≥90% | COUNT consultas / COUNT PRESENTE |
| Adherencia de emails | ≥95% delivered | log_notificacion error IS NULL |
| Cumplimiento de auditoría | 100% | (registros) / (esperados) |

---

## 16. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| SMTP caído en producción | Media | Alto | Fallback con reintento exponencial (RB35) + panel admin. |
| Zona horaria mal configurada | Media | Alto | Configuración explícita + validación al alta + tests. |
| Carga concurrente en reserva | Media | Alto | `UNIQUE` constraint + tests de concurrencia. |
| Crecimiento de archivos | Baja | Medio | Límite por tipo + compresión. |
| Resistencia del socio a completar ficha | Media | Medio | UI clara, guardar parcial permitido. |
| Sobrecarga de notificaciones | Baja | Medio | Solo transaccionales críticas, sin marketing. |
| Datos clínicos en logs | Baja | Alto | Lint rule + code review + tests. |
| Auditoría creciendo sin límite | Baja | Bajo | Aceptable en iter 1; archivado en iter 2+. |
| Multi-tenant leak | Baja | Crítico | Tests de aislamiento + filtros + code review. |
| Pérdida de contraseña provisional | Media | Bajo | Reenvío desde panel admin con auditoría. |
| **RIESGO COMPLIANCE — Portabilidad JSON no implementada (RB36 eliminado)** | **Media** | **Alto** | **Riesgo legal aceptado por decisión de producto. Mitigación: PDF como alternativa. Acción recomendada: implementar JSON antes de exposición pública real con socios.** |

---

## 17. Apéndice: exclusiones explícitas iter 2+

Lista consolidada de lo que NO se hace en iter 1:

- Deportólogos, entrenadores, rutinas.
- IA para sugerir comidas/planes/entrenamientos.
- Videollamadas, chat en tiempo real.
- Pagos, facturación, fiscal.
- WhatsApp / SMS.
- App móvil nativa.
- Multi-gimnasio para socios.
- Reasignación automática entre nutricionistas.
- Visibilidad de agendas entre nutricionistas / derivación interna (RB55).
- Marketplace de planes templates.
- API pública para integraciones.
- Gamificación, logros, rankings.
- PWA / modo offline.
- Recordatorios automáticos de medición.
- Integración con balanzas o dispositivos Bluetooth.
- WebSockets.
- Push notifications.
- **Notificaciones in-app** (RB59).
- **Preferencias de notificación por usuario** (RB59).
- **Confirmación de turno por token público o código** (RB31 eliminado, RB58).
- **Adherencia al plan alimentario** (RB54, socio no marca comidas).
- **Días no laborables / feriados** (RB56).
- **Gap entre turnos** del mismo nutricionista (RB57).
- **Campos custom en ficha de salud** (esquema fijo).
- **Cifrado en reposo de campos clínicos** (cifrado en tránsito sí).
- **Export JSON de portabilidad** del socio (riesgo compliance Ley 25.326 aceptado, §11.5).
- Hard delete físico de cualquier dato.
- Multi-idioma (español rioplatense únicamente).
- Pliegues cutáneos, presión arterial y otras mediciones especializadas.
- Adherencia al plan con fotos de comida.

---

*Fin del documento fuente de verdad de Iteración 1. Versión consolidada tras 9 rondas de Q&A con el product owner. Listo para dividir en fases/planes de implementación.*
