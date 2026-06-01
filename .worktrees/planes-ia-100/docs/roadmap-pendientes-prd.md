# Roadmap de Pendientes Contra PRD - NutriFit Supervisor

**Fuente funcional:** `docs/PRD_NutriFit_Supervisor.md`  
**Fecha de revision:** 2026-05-01  
**Objetivo:** identificar que falta implementar o modificar para que el sistema quede alineado al 100% con el PRD consolidado.

---

## Resumen Ejecutivo

El sistema ya tiene implementado un MVP avanzado para nutricionistas y socios: autenticacion, RBAC parcial, gestion de nutricionistas y socios, agenda, reserva/reprogramacion/cancelacion de turnos, ficha de salud, check-in, consulta, mediciones, planes alimentarios, progreso, fotos, objetivos, exportacion PDF/CSV parcial, alimentos e IA nutricional parcial.

Para llegar al 100% del PRD todavia faltan bloques importantes:

- Notificaciones internas/email y recordatorios.
- Auditoria transversal de acciones criticas.
- Modelo multi-gimnasio/tenant y configuracion operativa por gimnasio.
- Rol Entrenador y visibilidad parcial de planes/observaciones.
- Rol Asistente o ajuste formal del rol Recepcionista para gestionar profesionales segun PRD.
- Especialidades reales para profesionales: nutricionista, deportologo, medico deportivo, etc.
- Adjuntos/documentos clinicos en consultas.
- Alineacion del modelo de estados de turno con PRD.
- IA ajustada al contrato exacto del PRD: 2 propuestas, ingredientes con cantidades/unidades y pasos.
- Reportes/KPI administrativos por rango de fechas.
- Auditoria y bloqueo real de edicion tras finalizar consulta.
- Endurecimiento de control de acceso en progreso/fotos/objetivos y algunos flujos profesionales.
- Correccion del flujo de migraciones para que la base no dependa de tablas creadas manualmente.

---

## Estado Actual Detectado

### Implementado o Parcialmente Implementado

| Area | Estado actual |
|---|---|
| Auth | Login JWT, perfil, permisos efectivos. |
| Roles | `ADMIN`, `NUTRICIONISTA`, `RECEPCIONISTA`, `SOCIO`. |
| Permisos | Acciones y grupos con asignacion a usuarios; ADMIN bypass. |
| Profesionales | CRUD de nutricionistas, foto, matricula, baja/reactivacion. |
| Socios | CRUD de socios, foto, baja/reactivacion. |
| Agenda | Configuracion por nutricionista con dias, rangos y duracion. |
| Turnos socio | Reserva, listado, cancelacion, reprogramacion, confirmacion. |
| Recepcion | Listado del dia y check-in. |
| Ausentes | Scheduler marca ausentes segun umbral configurable por env. |
| Consulta | Inicio, finalizacion, mediciones y observaciones. |
| Planes | Crear, editar, eliminar por soft delete, listar, plan activo unico. |
| Alimentos | CRUD, grupos, sincronizacion y curacion. |
| IA | Recomendaciones, plan semanal, sustitucion, analisis nutricional e ideas-comida (RF36-RF38). |
| Progreso | Resumen, historial, graficos, fotos, objetivos, PDF y CSV de mediciones. |
| Frontend | Dashboards por admin/nutricionista/socio/recepcionista, paginas principales y sidebar por rol. |

### Brechas Criticas

| Brecha | Impacto |
|---|---|
| No hay notificaciones reales | RF40, RF26 historico, RB-NOT y criterios de aceptacion quedan incompletos. |
| No hay auditoria transversal | RF44, RB-GEN-02, RNF09/RNF-I2-08 quedan incompletos. |
| No hay tenant/gimnasio | RB-GEN-01 y configuracion B2B por gimnasio quedan fuera. |
| No existe Entrenador | RB-ROL-05, RF34 y pantallas del entrenador no se cumplen. |
| Solo existe Nutricionista como profesional | Falta deportologo/medico deportivo y especialidades multiples. |
| No hay adjuntos clinicos | RF28, RF25, RB-CON-02, RB-DAT-01 incompletos. |
| Consulta finalizada no bloquea registros posteriores | RB-CON-03 y RNF-I2-09 incompletos. |
| IA no cumple contrato exacto PRD | RF36-RF38 implementados (2026-05-08); restan notificaciones y reportes IA. |
| Estados de turno difieren del PRD | RB-TUR-01/RB-TUR-02 requieren ajuste. |
| Migraciones no estan confiables | Riesgo operativo: tablas faltantes y ausencia de tabla `migrations`. |

---

## Matriz de Cobertura PRD

| ID | Requerimiento PRD | Estado | Pendiente o modificacion necesaria |
|---|---|---|---|
| RF01 | Registrar profesionales | Parcial | Hoy lo hace ADMIN y solo nutricionistas. Falta Asistente/Recepcionista segun PRD, especialidades, credenciales/documentos y password provisional. |
| RF02 | Modificar profesional | Parcial | Implementado para ADMIN. Falta rol Asistente/Recepcionista si se mantiene PRD y especialidades multiples. |
| RF03 | Desactivar/eliminar profesional | Parcial | Existe baja logica y bloqueo si hay turnos futuros. Falta impedir login del profesional inactivo y notificar socios afectados. |
| RF04 | Listar profesionales | Parcial | Existe listado admin y publico. Falta filtros completos por especialidad/estado/disponibilidad en backend y UI segun PRD. |
| RF05 | Asignar especialidades | No implementado | Solo hay texto fijo `Nutricionista`. Falta entidad/catalogo de especialidades y soporte a multiples tipos profesionales. |
| RF06 | Configurar horarios | Parcial | Existe agenda por nutricionista. Falta estado pendiente/activo por configuracion y apertura/cierre de cupos mas formal. |
| RF07 | Socio ve perfil/disponibilidad | Parcial | Existe perfil y disponibilidad. Falta deportologos/medicos, reviews/referencias si se decide incluirlas. |
| RF08 | Socio solicita turno | Implementado parcial | Reserva funciona con ficha obligatoria, agenda y conflictos. Falta notificacion y sugerencia de dias alternativos. |
| RF09 | Socio cancela turno | Parcial | Cancela con regla 24h. Falta motivo/fecha de cancelacion persistidos y politica configurable por gimnasio. |
| RF10 | Socio reprograma turno | Parcial | Reprograma con regla 24h. Falta auditoria y definir si el estado `REPROGRAMADO` debe existir o mantener `PROGRAMADO` con historial. |
| RF11 | Socio ve turnos | Implementado parcial | Listado existe. Verificar filtros completos por fecha/profesional/especialidad/estado. |
| RF12 | Detalle profesional antes de reservar | Parcial | Perfil existe. Falta biografia real, especialidades multiples, opiniones/calificaciones si quedan en alcance. |
| RF13 | Ficha obligatoria primera reserva | Implementado | Reserva bloquea si no hay ficha. |
| RF14 | Completar ficha salud | Implementado parcial | Campos principales y ampliados existen. Falta auditoria de cambios. |
| RF15 | Modificar ficha salud | Implementado parcial | Upsert existe. Falta historial/auditoria de modificaciones. |
| RF16 | Profesional ve ficha salud | Implementado parcial | Valida vinculo por turno. Falta auditoria de acceso a datos sensibles. |
| RF17 | Profesional ve turnos del dia | Implementado | Endpoint y pantalla existen. |
| RF18 | Filtrar turnos por socio/horario/objetivo | Parcial | Hay query DTO, pero revisar UI/backend para cubrir objetivo y filtros completos. |
| RF19 | Acceso a ficha antes de sesion | Implementado parcial | Existe desde flujo profesional. Falta auditoria de acceso. |
| RF20 | Registrar observaciones | Parcial | Existe texto/sugerencias/habitos/objetivos. Falta visibilidad publica/privada y adjuntos. |
| RF21 | Registrar mediciones | Parcial | Peso, IMC, perimetros, composicion y signos vitales existen. Falta validacion de rango robusta y bloqueo por estado de consulta. |
| RF22 | Historial turnos/observaciones | Parcial | Historial existe. Falta adjuntos y control de edicion tras cierre. |
| RF23 | Socio ve historial de turnos | Implementado parcial | Mis turnos existe. Falta observaciones/documentos asociadas segun detalle de turno. |
| RF24 | Graficos de evolucion | Implementado | Hay peso, IMC, perimetros, composicion, signos vitales. |
| RF25 | Ver documentos/recomendaciones | Parcial | Recomendaciones/observaciones parciales; documentos clinicos no implementados. |
| RF26 | Ausente por demora >30 min | Implementado parcial | Scheduler existe con umbral por env. Falta configuracion por gimnasio y auditoria/notificacion. |
| RF27 | Iniciar consulta solo PRESENTE | Implementado | `IniciarConsultaUseCase` exige `PRESENTE`. |
| RF28 | Observaciones y adjuntos | Parcial | Observaciones si; adjuntos no. |
| RF29 | Mediciones con validacion rango | Parcial | Mediciones si; validacion de rango insuficiente. |
| RF30 | Finalizar consulta y bloquear edicion | Parcial | Finaliza a `REALIZADO`; no bloquea mediciones/observaciones posteriores y no permite anexos auditados. |
| RF31 | Crear plan activo unico | Implementado parcial | Plan activo unico y objetivo existen. Falta validar comida con items reales y mejorar cantidades/unidades por item. |
| RF32 | Editar plan con motivo/auditoria | Parcial | Motivo opcional y sin auditoria transversal. Debe ser obligatorio y auditable. |
| RF33 | Eliminar plan soft delete con motivo | Parcial | Soft delete existe. Falta auditoria y notificacion. |
| RF34 | Ver plan por profesional/socio/entrenador | Parcial | Profesional y socio si; entrenador no existe. |
| RF35 | Validar alergias/restricciones | Implementado | Heuristicas normalizadas con equivalencias, negaciones, aliases y bloqueo con incidencias detalladas (Sprint 5). |
| RF36 | Accion Sugerir con IA | Implementado | Ver seccion 4.4 para detalle completo. |
| RF37 | IA devuelve exactamente 2 propuestas | Implementado | Ver seccion 4.4. |
| RF38 | Descartar propuestas prohibidas y reintentar | Implementado | Ver seccion 4.4. |
| RF39 | Progreso por periodo y export CSV/PDF | Parcial | PDF y CSV de mediciones existen. Falta filtros/rangos de periodo consistentes en UI/API. |
| RF40 | Notificar plan/consulta | No implementado | Solo hay logs pendientes. Falta modulo completo de notificaciones. |
| RF41 | Admin metricas generales | No implementado | Dashboard admin solo muestra rol/permisos. Faltan metricas del establecimiento. |
| RF42 | Parametros operativos por gimnasio | No implementado | No hay configuracion de recordatorios, check-in, ausente automatico ni cancelacion por gimnasio. |
| RF43 | Branding basico por gimnasio | No implementado | `Configuracion` esta en construccion. |
| RF44 | Auditoria acciones relevantes | No implementado | No hay entidad/servicio de auditoria. |
| RF45 | Exportar historial/progreso | Parcial | Progreso exporta PDF/CSV; historial de consultas no exporta. |
| RF46 | Admin KPI asistencia/no-shows/utilizacion | No implementado | Falta modulo de reportes administrativos por rango. |
| RF47 | IA para FAQ gimnasio | Futuro | No implementado; PRD lo marca como vision futura. |
| RF48 | Recomendaciones cruzadas rutina/alimentacion | Futuro | No implementado; depende de modulo rutinas. |

---

## Roadmap Priorizado

## Fase 0 - Estabilizacion Tecnica Obligatoria

Objetivo: dejar el sistema ejecutable y migrable sin intervenciones manuales.

### 0.1 Corregir migraciones y tracking de base de datos

**Estado actual:** la base local no tenia tabla `migrations` y faltaban tablas de permisos creadas por la migracion `1766750000000-AddPermissionsModel.ts`. Algunas tablas se crearon manualmente para levantar el backend.

**Pendiente:**

- Arreglar script `migration:run` para monorepo npm workspaces. Actualmente apunta a `./node_modules/typeorm/cli.js` dentro de `apps/backend`, pero TypeORM esta hoisteado en `node_modules` raiz.
- Crear o recuperar tabla `migrations` y registrar migraciones ya aplicadas.
- Validar que todas las tablas de permisos existan con FK e indices correctos: `usuario_accion`, `usuario_grupo_permiso`, `grupo_permiso_accion`, `grupo_permiso_hijo`.
- Documentar comando oficial de migraciones desde raiz.

**Resultado esperado:** cualquier entorno nuevo puede levantar DB ejecutando migraciones, sin SQL manual.

### 0.2 Validar consistencia de seeds y permisos

**Estado actual:** existen acciones como `profesionales.ver`, `profesionales.editar` en seeds, pero controladores usan `profesionales.listar`, `profesionales.actualizar`, `auth.permissions.read/write/assign`, `progreso.editar`.

**Pendiente:**

- Unificar catalogo de acciones con los nombres usados por decoradores `@Actions`.
- Agregar acciones faltantes a seed y migracion/seed idempotente.
- Definir grupos base: `ADMIN`, `PROFESIONAL`, `RECEPCIONISTA`, `SOCIO`, `ENTRENADOR` si se implementa.
- Revisar que permisos no dependan del bypass de ADMIN para funcionar.

---

## Fase 1 - Roles, Profesionales y Tenant

Objetivo: alinear el modelo de usuarios/profesionales con el PRD B2B.

### 1.1 Implementar modelo de gimnasio/tenant

**PRD:** RB-GEN-01, RF41-RF43, arquitectura seccion 19/20.

**Estado actual:** no hay entidad `Gimnasio`, `Sede`, `Tenant` ni aislamiento por gimnasio.

**Pendiente:**

- Crear entidad `gimnasio` o `tenant` con configuracion basica.
- Relacionar usuarios, socios, profesionales, turnos, agenda, planes y alimentos al tenant.
- Agregar filtros obligatorios por tenant en repositorios/use-cases.
- Preparar configuracion por gimnasio: recordatorios, check-in, umbral ausente, politicas de cancelacion, branding.
- Migrar datos actuales a un tenant default.

### 1.2 Soportar profesionales de salud genericos y especialidades

**PRD:** RF01-RF06, RF07-RF12, modelo conceptual Especialidad/Profesional.

**Estado actual:** el sistema solo modela `Nutricionista`. La especialidad se devuelve hardcodeada como `Nutricionista`.

**Pendiente:**

- Definir si se refactoriza `Nutricionista` a `ProfesionalSalud` o si se agrega una abstraccion sobre la tabla actual.
- Crear catalogo de especialidades: `Nutricionista`, `Deportologo`, `Medico deportivo`, etc.
- Permitir una o mas especialidades por profesional.
- Agregar filtros reales por especialidad en listados admin/publicos.
- Actualizar UI `Nutricionistas` a `Profesionales` si el PRD queda generalizado.
- Ajustar textos, rutas y DTOs para no asumir solo nutricionistas.

### 1.3 Implementar rol Asistente o ajustar Recepcionista

**PRD:** Asistente/Recepcionista registra/modifica/desactiva profesionales y opera turnos diarios.

**Estado actual:** `RECEPCIONISTA` solo puede ver turnos del dia y hacer check-in; CRUD de profesionales esta en ADMIN.

**Pendiente:**

- Decidir si el rol se llama `ASISTENTE`, `RECEPCIONISTA` o ambos.
- Habilitar permisos de gestion de profesionales segun decision del PRD.
- Dar acceso frontend a gestion de profesionales para ese rol si corresponde.
- Mantener restriccion de no acceso a ficha clinica para recepcion.

### 1.4 Implementar rol Entrenador

**PRD:** RB-ROL-05, RF34, pantallas 22.6.

**Estado actual:** no existe `ENTRENADOR` en enum, rutas, sidebar ni control de acceso.

**Pendiente:**

- Agregar rol `ENTRENADOR` y grupo/permisos asociados.
- Crear vistas de lectura de plan alimentario del socio.
- Crear vistas de observaciones publicas autorizadas.
- Impedir acceso a ficha clinica, mediciones sensibles y edicion de planes.
- Definir vinculacion entrenador-socio dentro del tenant/gimnasio.

### 1.5 Bloquear login de usuarios inactivos

**PRD:** profesional inactivo no puede recibir turnos ni acceder.

**Estado actual:** baja logica de profesional/socio existe, pero `LoginUseCase` no valida `fechaBaja` o estado activo.

**Pendiente:**

- Agregar estado activo/inactivo al usuario o validar `persona.fechaBaja` segun tipo.
- Impedir login de profesionales/socios dados de baja.
- Invalidar o rechazar operaciones con usuarios inactivos.

---

## Fase 2 - Turnos, Agenda y Recepcion

Objetivo: cerrar reglas de negocio de turnos, asistencia y politicas operativas.

### 2.1 Alinear estados de turno con PRD

**PRD:** estados `PROGRAMADO`, `PRESENTE`, `EN_CURSO`, `REALIZADO`, `CANCELADO`, `AUSENTE`; confirmacion por `confirmedAt`.

**Estado actual:** enum incluye `PENDIENTE`, `CONFIRMADO`, `REPROGRAMADO`, `BLOQUEADO`, `PRESENTE`, `EN_CURSO`, `REALIZADO`, `CANCELADO`, `AUSENTE`.

**Pendiente:**

- Definir estado canonico: usar `PROGRAMADO` o mantener `PENDIENTE/CONFIRMADO` actualizando PRD.
- Si se respeta PRD, migrar `PENDIENTE/CONFIRMADO/REPROGRAMADO` a `PROGRAMADO` + columnas `confirmedAt`, `reprogramadoAt`, historial/auditoria.
- Mantener `BLOQUEADO` como entidad/bloqueo de agenda o justificarlo como extension fuera de estados de turno.
- Actualizar frontend y tests.

### 2.2 Persistir motivos y auditoria de cancelacion/reprogramacion

**Estado actual:** cancelacion no recibe motivo; reprogramacion no guarda historial de cambios.

**Pendiente:**

- Agregar `motivoCancelacion`, `canceladoAt`, `canceladoPor`.
- Agregar tabla o entidad de eventos de turno para reprogramaciones.
- Auditar cambio anterior/nuevo de fecha/hora.
- Mostrar historial en detalle de turno.

### 2.3 Parametrizar politicas por gimnasio

**Estado actual:** cancelacion/reprogramacion usan regla hardcodeada de 24h; reserva exige 1h; ausente automatico usa env.

**Pendiente:**

- Mover politicas a configuracion de gimnasio: plazo cancelacion, plazo reprogramacion, antelacion minima de reserva, umbral ausente.
- Crear UI admin para editar estos parametros.
- Aplicar parametros en use-cases y scheduler.

### 2.4 Completar recepcion y asignacion manual

**Estado actual:** recepcion solo check-in/listado. Asignacion manual esta bajo ruta de nutricionista.

**Pendiente:**

- Permitir a recepcion/asistente asignar turnos manuales si el PRD lo mantiene.
- Permitir cancelar/reprogramar turnos desde recepcion segun permisos.
- Ver agenda por profesional sin datos clinicos.
- Notificar al socio/profesional ante asignacion o cambios.

### 2.5 Revisar acceso Admin a turnos profesionales

**Estado actual:** frontend `TurnosProfesional` permite ADMIN, pero varios endpoints backend solo aceptan `NUTRICIONISTA` y usan ownership guard.

**Pendiente:**

- O quitar acceso admin en UI, o crear endpoints admin/operativos compatibles.
- Definir si ADMIN puede ver turnos de cualquier profesional para reportes/operacion.

---

## Fase 3 - Consulta Clinica, Adjuntos y Auditoria

Objetivo: cumplir la segunda iteracion clinica completa.

### 3.1 Agregar adjuntos clinicos

**PRD:** RF25, RF28, RB-CON-02, RB-DAT-01.

**Estado actual:** solo se suben fotos de perfil y fotos de progreso; no hay adjuntos de consulta.

**Pendiente:**

- Crear entidad `adjunto_clinico` con tipo, mime, size, storage key, usuario, turno/consulta.
- Subir PDF/imagenes a MinIO con limite de peso.
- Exponer endpoints para cargar, listar, descargar y eliminar/anexar segun permisos.
- Mostrar adjuntos en consulta e historial del paciente.
- Permitir anexos post-finalizacion solo con auditoria.

### 3.2 Bloquear edicion tras finalizar consulta

**Estado actual:** `finalizar-consulta` cambia a `REALIZADO`, pero `guardar-mediciones` y `guardar-observaciones` no validan estado `EN_CURSO` ni bloquean post-cierre.

**Pendiente:**

- Validar que mediciones/observaciones solo se registren en `EN_CURSO`.
- Bloquear edicion en `REALIZADO`.
- Permitir solo anexos auditados si se decide implementar esa excepcion.
- Encapsular cierre de consulta + datos en transaccion cuando aplique.

### 3.3 Robustecer mediciones y observaciones

**Estado actual:** mediciones calculan IMC y guardan muchos campos, pero falta validacion de rangos. Observacion requiere medicion previa.

**Pendiente:**

- Validar rangos razonables: peso, altura, IMC, perimetros, pliegues, presion, frecuencia cardiaca.
- Separar observaciones publicas/privadas para entrenador/socio.
- Permitir recomendaciones visibles al socio si corresponde.
- Corregir entidad `observacion_clinica`: tiene decorador duplicado `@Column({ name: '' ... })` antes de `sugerencias`.

### 3.4 Implementar auditoria transversal

**PRD:** RF44, RB-GEN-02, RNF09, RNF-I2-08.

**Estado actual:** hay logs de aplicacion, pero no auditoria persistente consultable.

**Pendiente:**

- Crear entidad `auditoria` con usuario, accion, entidad, entidadId, timestamp, origen/IP/user-agent y metadata.
- Auditar: login fallido/exitoso, acceso a ficha, crear/editar/eliminar plan, finalizar consulta, adjuntos, cambios de turno, cambios de permisos.
- Agregar interceptor/servicio de auditoria reutilizable.
- Crear vista admin para consulta basica de auditoria.

---

## Fase 4 - Plan Alimentario e IA Segun Contrato PRD

Objetivo: que planes e IA cumplan exactamente RF31-RF38.

### 4.1 Completar modelo de items de comida

**Estado actual:** `opcion_comida` relaciona alimentos por many-to-many, sin cantidad/unidad/notas/macros por item de plan. La cantidad viene del alimento del catalogo.

**Pendiente:**

- Reemplazar many-to-many por entidad `item_comida` o tabla intermedia enriquecida.
- Guardar cantidad, unidad, notas, calorias/macros calculados o snapshot nutricional por item.
- Permitir editar cantidades desde frontend y persistirlas realmente.
- Validar que un plan tenga al menos una comida con al menos un item real.

### 4.2 Hacer obligatorios motivo y auditoria al editar/eliminar

**Estado actual:** `motivoEdicion` es opcional; eliminacion guarda motivo pero no auditoria.

**Pendiente:**

- Requerir `motivoEdicion` en modificaciones relevantes.
- Requerir `motivoEliminacion` no vacio.
- Auditar cambios de estructura de plan.
- Mantener historico de plan eliminado/reemplazado para profesionales/admin.

### 4.3 Mejorar validacion contra restricciones

**Estado actual:** solo se compara nombre de alimento contra alergias por substring.

**Pendiente:**

- Incluir restricciones alimentarias de texto normalizadas o catalogadas.
- Considerar patologias/contraindicaciones si tienen alimentos prohibidos asociados.
- Devolver incidencias detalladas por dia/comida/item.
- Evitar falsos positivos/falsos negativos por substring simple.

### 4.4 Ajustar IA a RF36-RF38

**Estado actual:** IMPLEMENTADO (2026-05-08).

**Lo implementado:**
- Endpoint `POST /ia/ideas-comida` con contrato PRD exacto:
  - Entrada: `objetivo` obligatorio, `restricciones` opcionales, `infoExtra` obligatoria, `socioId` para registro.
  - Salida: exactamente 2 propuestas con nombre, ingredientes con cantidades/unidades y pasos 1-5.
- UI `IdeasComidaPanel` con acciones: agregar al plan, descartar individual, reintentar.
- Integración en `PlanEditorPage` con selector de día/comida destino.
- Registro de estado en `SugerenciaIAOrmEntity`: `GENERADA` (éxito) o `ERROR` (no se pudieron generar 2 válidas).
- Filtrado automático de propuestas que violen restricciones via `RestriccionesValidator`.
- Disclaimer `Sugerido por IA` en propuestas.
- El proveedor IA no recibe PII ni datos clínicos del socio.

**Pendiente:** Ninguno (Sprint 6 IA cerrado).

### 4.5 Receta con IA desde comida del plan

**PRD:** opcional/futuro dentro de IA.

**Estado actual:** no implementado como receta desde una comida del plan.

**Pendiente:**

- Agregar accion opcional en `MiPlanPage` o vista profesional para generar receta.
- Incluir disclaimer `Sugerido por IA`.
- No modificar plan sin validacion humana si aplica.

---

## Fase 5 - Notificaciones

Objetivo: cumplir RF40, RB-NOT y criterios de aceptacion.

### 5.1 Crear modulo de notificaciones internas

**Estado actual:** no existe entidad ni backend/frontend de notificaciones; algunos use-cases solo loguean `Notificacion interna pendiente`.

**Pendiente:**

- Crear entidad `notificacion` con destinatario, tipo, titulo, mensaje, estado, metadata, leidaEn.
- Crear endpoints: listar propias, marcar leida, marcar todas, admin/operador si corresponde.
- Crear componente frontend: campana, centro de notificaciones, badges.
- Eventos minimos: turno reservado, cancelado, reprogramado, check-in, plan creado/editado/eliminado, consulta finalizada.

### 5.2 Recordatorios de turnos 24/48 h

**Pendiente:**

- Scheduler de recordatorios segun configuracion de gimnasio.
- Guardar `confirmedAt` cuando el socio confirma desde notificacion.
- Enlaces seguros para confirmar/cancelar/reprogramar.
- Evitar duplicados con tabla de eventos enviados.

### 5.3 Email parametrizable

**Pendiente:**

- Servicio email con proveedor configurable.
- Plantillas por gimnasio.
- No exponer datos clinicos sensibles.
- Preparar WhatsApp como canal futuro parametrizable, sin mensajeria sincronica.

---

## Fase 6 - Reportes, KPI y Admin

Objetivo: cubrir RF41, RF46 y pantallas administrativas.

### 6.1 Dashboard admin real

**Estado actual:** dashboard admin solo muestra rol y permisos.

**Pendiente:**

- KPI por rango: turnos programados, presentes, ausentes/no-show, cancelados, reprogramados.
- Utilizacion de agenda por profesional.
- Profesionales activos/inactivos.
- Socios con ficha completa.
- Socios con plan activo.
- Uso de IA por profesional.

### 6.2 Reportes exportables

**Estado actual:** progreso tiene PDF y CSV de mediciones. Historial de consultas no tiene exportacion dedicada.

**Pendiente:**

- Exportar historial de consultas por paciente/profesional.
- Exportar KPI admin a CSV/PDF.
- Agregar filtros por periodo/profesional/estado.

### 6.3 Configuracion y branding

**Estado actual:** `Configuracion.tsx` esta en construccion.

**Pendiente:**

- Pantalla de configuracion de tenant/gimnasio.
- Logo/nombre/colores basicos si se mantiene RF43.
- Politicas operativas editables.
- Plantillas/canales de notificacion.

---

## Fase 7 - Seguridad, Visibilidad y Calidad

Objetivo: cerrar RNF y control de acceso sensible.

### 7.1 Endurecer control de acceso por relacion

**Estado actual:** planes tienen `PlanSocioAccessGuard`; ficha de paciente valida vinculo por turno. Progreso/fotos/objetivos aceptan `socioId` con roles amplios y no se ve guard de propiedad/vinculo equivalente.

**Pendiente:**

- Crear guard reutilizable `SocioResourceAccessGuard`.
- SOCIO solo puede operar sobre su propio `socioId`.
- NUTRICIONISTA solo puede ver/editar progreso de socios vinculados por turno/asignacion.
- RECEPCIONISTA sin acceso a contenido clinico.
- ENTRENADOR solo lectura limitada cuando exista.

### 7.2 HTTPS y configuracion de despliegue

**Pendiente:**

- Documentar despliegue con HTTPS obligatorio.
- Variables seguras para JWT, DB, MinIO, IA y email.
- Revisar CORS y cookies/tokens segun deployment final.

### 7.3 Pruebas core y rendimiento

**PRD:** RNF-I2-11, RNF01-RNF04.

**Pendiente:**

- Tests unitarios/e2e para flujos core: reserva, cancelacion, reprogramacion, check-in, consulta, plan, IA, permisos.
- Pruebas de autorizacion por rol.
- Medicion p95 para plan/progreso e IA.
- Validar 100 usuarios concurrentes si se requiere evidencia academica/comercial.

---

## Fase 8 - Futuro Fuera del MVP Actual

Estas funcionalidades aparecen en la vision global o roadmap posterior, pero no bloquean el MVP academico si se decide mantenerlas fuera de alcance.

| Funcionalidad | Dependencia |
|---|---|
| Rutinas de entrenamiento completas | Modulo rutinas/entrenador. |
| Recomendaciones cruzadas rutina-alimentacion | Rutinas + IA avanzada. |
| FAQ/asistente informativo del gimnasio | Modulo IA conversacional. |
| Marketplace de profesionales | Modelo comercial futuro. |
| Pagos/facturacion | Fuera del alcance MVP. |
| App movil nativa | Fuera del alcance MVP. |
| Wearables/balanzas inteligentes | Integraciones futuras. |
| Multi-sede/cadenas avanzado | Requiere tenant primero. |

---

## Orden Recomendado de Implementacion

1. Corregir migraciones y semillas de permisos.
2. Definir decisiones de producto: roles `ASISTENTE/RECEPCIONISTA`, `ENTRENADOR`, profesionales genericos y estados de turno canonicos.
3. Implementar tenant/configuracion operativa base.
4. Alinear turnos: estados, motivos, auditoria y politicas por gimnasio.
5. Implementar auditoria transversal.
6. Completar consulta clinica: adjuntos, bloqueo post-cierre y validaciones.
7. Completar plan alimentario: items con cantidad/unidad, restricciones e historico auditable.
8. Ajustar IA al contrato exacto del PRD.
9. Implementar notificaciones internas y email/recordatorios.
10. Implementar entrenador y visibilidad parcial.
11. Completar dashboard admin, KPI y reportes.
12. Endurecer seguridad, tests e indicadores RNF.

---

## Plan de Cierre de Parciales

Objetivo: cerrar lo que hoy ya existe pero todavia no puede considerarse terminado de punta a punta.

### Criterio de cierre por sprint

Una funcionalidad deja de estar `Parcial` solo si cumple todo esto:

- Backend funcionando.
- Frontend usable.
- Permisos y roles correctos.
- Tests minimos del flujo.
- Documentacion actualizada.

### Sprint 1 - Normalizacion de estados y recepcion

- [x] Alinear frontend de recepcion con estados canonicos: `PROGRAMADO`, `PRESENTE`, `EN_CURSO`, `REALIZADO`, `CANCELADO`, `AUSENTE`.
- [x] Corregir `RecepcionTurnosPage`, `DashboardRecepcionista` y `TurnosTablaCard` para dejar de usar estados viejos (`CONFIRMADO`, `ASISTIO`).
- [x] Corregir vistas que todavia interpretan estados viejos en agenda, turnos del profesional y turnos del socio.
- [x] Verificar que el caso de "turno bloqueado" se muestre correctamente aunque el backend lo represente como `PROGRAMADO` sin socio.
- [x] Dejar frontend y backend hablando el mismo modelo de estados.

### Sprint 2 - Cierre clinico

- [x] Exigir estados correctos para guardar mediciones y observaciones.
- [x] Completar bloqueo post-cierre en consulta.
- [x] Completar validaciones de rangos clinicos.
- [x] Cerrar visibilidad publica/privada de observaciones.

### Sprint 3 - Turnos, historial y auditoria

- [x] Persistir motivo de cancelacion.
- [x] Persistir historial de reprogramacion.
- [x] Auditar cancelacion, reprogramacion, finalizacion y adjuntos.
- [x] Completar notificaciones faltantes del flujo de turnos.

### Sprint 4 - Recordatorios y email

- [x] Reemplazar proveedor consola por email real.
- [x] Activar recordatorios 24/48 h con plantillas minimas.
- [x] Habilitar links reales de confirmar/cancelar desde recordatorios.
- [x] Mantener no-duplicacion y trazabilidad de envios.

### Sprint 5 - Planes alimentarios

- [x] Usar `item_comida` real en crear/editar.
- [x] Persistir cantidades, unidades y notas por item.
- [x] Mejorar validacion de restricciones.
- [x] Validar consistencia en PDF y vista socio.

### Sprint 6 - IA

- [ ] Pasar contexto real de socio/profesional a IA.
- [ ] Eliminar el flujo dummy `execute(0, dto)`.
- [ ] Integrar propuestas al editor del plan.
- [ ] Persistir estados de sugerencia: generada, descartada, incorporada, error.

### Sprint 7 - Configuracion y gimnasio

- [ ] Terminar `Configuracion.tsx`.
- [ ] Exponer branding y politicas operativas en UI.
- [ ] Aplicar configuracion real de gimnasio en reservas, cancelaciones, reprogramaciones y ausentes.
- [ ] Revisar propagacion real de `gimnasioId`.

### Sprint 8 - Entrenador y admin/reportes

- [ ] Crear vistas reales para `ENTRENADOR`.
- [ ] Restringir correctamente accesos del entrenador.
- [ ] Corregir KPIs y reportes admin.
- [ ] Completar exportes admin a CSV/PDF.

---

## Definicion de 100% Funcional Contra PRD

El sistema puede considerarse completo contra el PRD cuando:

- Todos los RF01-RF46 esten implementados o explicitamente marcados como fuera de alcance por decision documentada.
- RB-GEN-01/RB-GEN-02/RB-GEN-03 esten cubiertas con tenant, auditoria y RBAC real.
- Recepcion, profesional, socio, admin y entrenador tengan acceso solo a lo que corresponde.
- Todo evento critico tenga auditoria persistente.
- Los eventos definidos generen notificaciones.
- Consulta finalizada no permita edicion salvo anexos auditados.
- Planes respeten restricciones/alergias y mantengan historico.
- IA cumpla exactamente formato, cantidad de propuestas y guardrails definidos.
- Admin tenga reportes/KPI operativos por rango.
- Migraciones/seeds permitan reproducir la base desde cero.
- Los flujos core tengan pruebas automatizadas y validacion de permisos.
