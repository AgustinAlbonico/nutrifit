# Spec de validacion funcional: Turnos

> **Modulo**: Turnos completo
> **Fecha**: 2026-06-28
> **Objetivo**: servir como contrato para que otra sesion de IA valide todos los flujos de turnos interactuando con la app real mediante Playwright MCP.
> **Fuente de verdad**: navegador, requests de red, consola y estado visible de UI.
> **Prohibido dar por valido solo revisando codigo**.

Este documento define que deberia estar funcionando en el modulo Turnos, incluyendo reserva por socio, ficha de salud obligatoria, asignacion por staff, gestion de mis turnos, reprogramacion, cancelacion, aviso de llegada tarde, check-in de recepcion, agenda del nutricionista, bloqueos de disponibilidad, consulta profesional, adjuntos clinicos, estados de turno, permisos, multi-tenant y regresiones historicas. La sesion verificadora debe entrar al sistema como usuario real y reportar cada discrepancia contra esta spec.

## Contrato De Verificacion

- No iniciar ni reiniciar backend o frontend. Agustin los levanta manualmente.
- Antes de probar, verificar `localhost:3000` y `localhost:5173`. Si alguno no responde, pedirle a Agustin que lo levante y detenerse.
- Leer `CREDENCIALES_SEED.md` para credenciales. No hardcodear emails o passwords fuera de lo leido.
- No confundir DNI, `user.id`, `personaId`, `socioId`, `nutricionistaId` ni `turnoId`. Los IDs reales deben resolverse desde UI, JWT, responses API o listados del sistema.
- No usar mocks de backend ni fixtures interceptadas para marcar OK. Si se usa mocking para explorar un caso tecnico, debe quedar separado y no cuenta como validacion real.
- No revisar codigo para inferir comportamiento. El resultado se decide en browser, network requests y consola.
- Cada caso debe terminar como `OK`, `ERROR` o `BLOQUEADO`. No saltear con `if (response.ok())` sin reportar el estado real.
- Capturar evidencia minima por flujo: snapshot o screenshot, request relevante con metodo/status/payload parcial, mensaje UI visible y consola del navegador.
- Generar datos unicos con timestamp en motivos, observaciones, notas o comentarios para distinguir ejecuciones.
- Evitar usar datos destructivos sin control. Si se cancela, reprograma, finaliza o marca ausente un turno seed, documentar exactamente cual fue.

## Resultado Esperado Del Reporte

El reporte final debe guardar discrepancias en `iteracion 1/errores/turnos-validacion-playwright.md` y devolver a Agustin solo un resumen corto con conteos.

Formato minimo del reporte:

```markdown
# Turnos: Errores detectados

> **Fuente**: `iteracion 1/specs/turnos-validacion-playwright.md`
> **Fecha**: YYYY-MM-DD HH:mm
> **Herramienta**: Playwright MCP
> **Evidencia**: rutas de screenshots y requests relevantes

## Errores funcionales

### 1. Titulo corto del error

- **Spec**: requisito incumplido.
- **Realidad**: comportamiento observado en browser/red.
- **Impacto**: por que importa para el usuario, operacion, datos clinicos o seguridad.

## Problemas de UI/UX

### 1. Titulo corto del problema

- **Spec**: expectativa visual o de UX.
- **Realidad**: comportamiento observado.
- **Impacto**: por que afecta la validacion o la experiencia.

## Funcionalidades que SI funcionan

- Item verificado con evidencia concreta.
```

## Alcance Del Modulo

Debe validarse el modulo completo, no solo la reserva del socio.

| Area | Pantallas / rutas | APIs principales |
| --- | --- | --- |
| Mis Turnos socio | `/turnos` | `GET /turnos/socio/mis-turnos`, `PATCH /turnos/socio/:turnoId/cancelar`, `PATCH /turnos/socio/:turnoId/reprogramar`, `POST /turnos/socio/:id/aviso-llegada-tarde` |
| Reserva socio | `/turnos/agendar`, `/nutricionistas/catalogo`, `/nutricionistas/:id/perfil` | `GET /profesional/publico/disponibles`, `GET /turnos/socio/profesional/:nutricionistaId/disponibilidad`, `POST /turnos/socio/reservar` |
| Confirmacion reserva | `/turnos/:idTurno/confirmado` | `GET /turnos/socio/turno/:id` |
| Ficha salud socio | `/turnos/ficha-salud` | `GET/PUT /turnos/socio/ficha-salud`, historial/versiones |
| Crear turno staff | `/turnos/nuevo` | `POST /turnos/crear`, `GET /socio/buscar-con-ficha`, `GET /turnos/admin/profesional/:id/disponibilidad` |
| Recepcion check-in | `/recepcion/turnos` | `GET /turnos/recepcion/dia`, `POST /turnos/:id/check-in`, `POST /turnos/:id/revertir-checkin`, `PATCH /turnos/:id/revertir-ausente`, `POST /turnos/:id/notificar-inasistencia` |
| Agenda profesional del dia | `/turnos-profesional` | `GET /turnos/profesional/:nutricionistaId/hoy`, `POST /turnos/:id/iniciar-consulta`, `PATCH /turnos/profesional/:nutricionistaId/:turnoId/asistencia` |
| Configuracion agenda | `/agenda` | `GET/PUT /nutricionistas/:nutricionistaId/disponibilidad`, `GET/POST /nutricionistas/:nutricionistaId/excepciones-disponibilidad`, `POST /turnos/profesional/:id/bloquear`, `PATCH /turnos/profesional/:id/:turnoId/desbloquear` |
| Consulta profesional | `/profesional/consulta/:turnoId` | `GET /turnos/:id`, `POST /turnos/:id/mediciones`, `POST /turnos/:id/observaciones`, `POST /turnos/:id/finalizar-consulta`, adjuntos |
| Token email | links externos o API | `POST /turnos/:id/confirmar?token=...`, `POST /turnos/:id/cancelar?token=...` |

Fuera de alcance para dar OK al modulo:

- Tests unitarios sin navegador.
- Tests Playwright sobre rutas viejas como `/reservar-turno` o `/mis-turnos`.
- Validaciones hechas solo por lectura de codigo.
- Re-sembrar la base sin aprobacion de Agustin.
- Simular emails reales si el ambiente no los expone; solo validar efectos observables o endpoints.

## Actores De Prueba

Usar cuentas reales de `CREDENCIALES_SEED.md`. Preferir Gym Central para el flujo principal.

| Actor | Uso esperado |
| --- | --- |
| `SOCIO` con ficha completa | Reservar, ver mis turnos, reprogramar, cancelar, avisar llegada tarde, ver confirmacion. |
| `SOCIO` sin ficha completa | Validar bloqueo/modal/banner de ficha obligatoria y completar ficha. |
| `NUTRICIONISTA` de Gym Central | Configurar agenda, ver agenda del dia, iniciar/continuar/finalizar consulta, crear turno propio, bloquear disponibilidad. |
| `RECEPCIONISTA` de Gym Central | Crear turno por staff con warning de ficha, check-in, revertir ausente, ver turnos del dia. |
| `ADMIN` de Gym Central | Crear turno por staff, check-in, revertir check-in, validar permisos ampliados. |
| `NUTRICIONISTA` de otro gimnasio | Validar aislamiento multi-tenant y bloqueo de turnos/pacientes ajenos. |
| `SOCIO` de otro gimnasio | Validar que no vea ni modifique turnos ajenos. |
| `SUPERADMIN` | Validacion secundaria si la UI lo permite; no es el flujo principal de turnos. |

Si una cuenta no tiene datos suficientes para un caso, resolver otro actor desde UI/API. No usar IDs inventados.

## Modelo Funcional Esperado

### Estados Del Turno

| Estado | Quien lo ve | Acciones esperadas |
| --- | --- | --- |
| `CONFIRMADO` | Socio, recepcion, nutricionista | Socio puede cancelar/reprogramar/avisar tarde si futuro; recepcion puede check-in; NUT espera check-in. |
| `PRESENTE` | Recepcion, nutricionista | Recepcion/admin ve presente; NUT puede iniciar consulta. |
| `EN_CURSO` | Nutricionista | NUT puede editar mediciones, observaciones, adjuntos y finalizar. |
| `REALIZADO` | Todos segun permisos | Consulta queda read-only; socio ve historial si aplica; NUT puede ver consulta. |
| `CANCELADO` | Socio/staff | No debe permitir check-in, iniciar consulta, reprogramar ni cancelar nuevamente. |
| `AUSENTE` | Recepcion/nutricionista/admin | Puede revertirse con motivo si el rol lo permite; no debe finalizar consulta. |

No debe aparecer `PROGRAMADO` en la UI ni en responses nuevas de reserva si el contrato actual exige alta directa en `CONFIRMADO`.

### Transiciones Principales

| Transicion | Disparador | Resultado esperado |
| --- | --- | --- |
| Crear/reservar | Socio o staff reserva un slot libre | Turno `CONFIRMADO`, visible en listados correctos. |
| Cancelar | Socio o token valido cancela | Turno `CANCELADO`, desaparecen acciones activas. |
| Reprogramar | Socio/staff elige nuevo slot libre | Mismo turno cambia fecha/hora o se refleja segun contrato, sin duplicar activo indebidamente. |
| Aviso tarde | Socio informa minutos tarde | Recepcion ve badge/mensaje `Llega Xm tarde`. |
| Check-in | Recepcion/admin confirma llegada | `CONFIRMADO -> PRESENTE`; idempotencia si ya estaba presente. |
| Revertir check-in | Admin con motivo | `PRESENTE -> CONFIRMADO`. Recepcion no debe poder hacerlo. |
| Marcar ausente | Recepcion/admin/NUT autorizado | `CONFIRMADO -> AUSENTE` con motivo. |
| Revertir ausente | Staff autorizado con motivo | `AUSENTE -> CONFIRMADO` o `PRESENTE` si registra llegada tarde/check-in. |
| Iniciar consulta | NUT sobre turno presente | `PRESENTE -> EN_CURSO`. |
| Finalizar consulta | NUT con datos minimos | `EN_CURSO -> REALIZADO`, campos read-only. |

### Politicas Funcionales

| Politica | Regla esperada |
| --- | --- |
| Ficha salud RB14 socio | El socio no puede reservar si no tiene ficha completa; debe ver modal/banner y CTA a `/turnos/ficha-salud`. |
| Ficha salud RB14 staff | Recepcion/admin pueden crear turno con warning si falta ficha; nutricionista debe bloquear seleccion/creacion para socio sin ficha. |
| Anticipacion | Slots muy cercanos, pasados o fuera de ventana deben estar disabled y explicar motivo. Validar diferencia real entre UI y backend si aparece. |
| Disponibilidad | Solo se puede reservar sobre slots `LIBRE`; `OCUPADO`, bloqueado o fuera de agenda debe bloquear. |
| Conflictos | Doble reserva, turno activo incompatible o race condition deben responder 409 y UI clara. |
| Multi-tenant | Nadie debe ver, crear, modificar, cancelar, check-in o consultar turnos de otro gimnasio. |
| Ownership NUT | Nutricionista solo ve/gestiona sus turnos, pacientes y consultas. |
| Adjuntos | Solo NUT autorizado gestiona adjuntos de su consulta; formatos/tamano invalidos deben fallar con mensaje claro. |

## Matriz De Aceptacion

### TU-00 - Preflight Obligatorio

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-00.1 | Puertos | Verificar backend `3000` y frontend `5173`. | Si ambos responden, continuar. Si no, pedir a Agustin que los levante y detenerse. |
| TU-00.2 | Credenciales | Leer `CREDENCIALES_SEED.md`. | Usar emails/password reales del archivo. |
| TU-00.3 | Login robusto | Login por cada rol usado. | Validar salida de `/login` o presencia del layout autenticado; si queda en login, no seguir como si estuviera autenticado. |
| TU-00.4 | Consola base | Abrir dashboard autenticado. | No debe haber errores JS iniciales. |
| TU-00.5 | Sesion limpia | Usar contexto limpio/logout entre roles. | No debe filtrarse estado entre usuarios. |

### TU-01 - Navegacion Y Acceso Por Rol

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-01.1 | Socio ve Turnos | Login SOCIO. | Sidebar/dashboard debe ofrecer `Mis Turnos` o `Turnos`; ruta real `/turnos`. |
| TU-01.2 | Socio agenda | Login SOCIO y abrir `/turnos/agendar`. | Debe cargar flujo de reserva o bloqueo por ficha. |
| TU-01.3 | Socio no crea staff | Login SOCIO y abrir `/turnos/nuevo`. | Debe mostrar `Acceso denegado` y no el wizard. |
| TU-01.4 | Recepcion ve check-in | Login RECEPCIONISTA y abrir `/recepcion/turnos`. | Debe cargar `Check-in de Turnos`; no datos de otros gyms. |
| TU-01.5 | Recepcion crea turno | Login RECEPCIONISTA y abrir `/turnos/nuevo`. | Debe cargar `Asignar turno a un socio`. No debe ser 404. |
| TU-01.6 | Admin crea/revierte | Login ADMIN. | Debe acceder a `/turnos/nuevo` y ver acciones admin en recepción, incluyendo revertir check-in. |
| TU-01.7 | Nutricionista agenda dia | Login NUTRICIONISTA y abrir `/turnos-profesional`. | Debe mostrar agenda de hoy del profesional. |
| TU-01.8 | Nutricionista configura agenda | Login NUTRICIONISTA y abrir `/agenda`. | Debe mostrar tabs de horarios y bloqueos. |
| TU-01.9 | NUT ajeno bloqueado | NUT de otro gimnasio intenta URL/API de turno ajeno. | Debe bloquear 403/404 sin filtrar datos. |

### TU-02 - Ficha Salud Obligatoria Del Socio

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-02.1 | Socio sin ficha en `/turnos` | Login SOCIO sin ficha y abrir `/turnos`. | Modal `modal-ficha-requerida-socio` o equivalente bloquea/advierte, con CTA a ficha. |
| TU-02.2 | Socio sin ficha en reserva | Abrir `/turnos/agendar`. | Banner `No tenes la ficha de salud cargada...`; boton reservar disabled. |
| TU-02.3 | Completar ficha | Ir a `/turnos/ficha-salud`, completar campos requeridos y consentimiento. | `PUT /turnos/socio/ficha-salud` 200/201, toast exito, link `ir-agendar-turno`/`volver-agendar`. |
| TU-02.4 | Validaciones ficha | Probar altura/peso/objetivo/actividad invalidos. | Errores inline con `role=alert`, no request invalida. |
| TU-02.5 | Historial ficha | Abrir historial. | `GET /turnos/socio/ficha-salud/historial`; modal muestra versiones. |
| TU-02.6 | Version ficha | Abrir una version. | `GET /turnos/socio/ficha-salud/version/:n`; version read-only. |
| TU-02.7 | Recepcion/admin con socio sin ficha | En `/turnos/nuevo`, seleccionar socio sin ficha. | Debe mostrar warning y permitir continuar. |
| TU-02.8 | NUT con socio sin ficha | En `/turnos/nuevo`, buscar socio sin ficha. | Item disabled con `Ficha incompleta: no se puede asignar`; no debe crear turno. |

### TU-03 - Reserva De Turno Por Socio

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-03.1 | Carga profesionales | Abrir `/turnos/agendar` con SOCIO con ficha. | `GET /profesional/publico/disponibles` 200; lista profesionales paginada. |
| TU-03.2 | Busqueda profesional | Buscar por nombre/ciudad/provincia si UI lo permite. | Lista filtra y empty state claro si no hay resultados. |
| TU-03.3 | Profesional sin agenda | Seleccionar o abrir profesional sin agenda. | Debe informar `todavia no configuro su agenda` o bloquear reserva. |
| TU-03.4 | Preseleccion por URL | Abrir `/turnos/agendar?nutricionistaId=ID_REAL_DEL_NUTRICIONISTA`. | Debe seleccionar el profesional si esta en la pagina/lista; si no, debe resolverlo o mostrar mensaje claro. |
| TU-03.5 | Fecha sin slots | Elegir fecha sin agenda. | Debe mostrar `No hay horarios libres para la fecha seleccionada` o equivalente. |
| TU-03.6 | Fecha con slots | Elegir fecha con disponibilidad. | `GET /turnos/socio/profesional/:id/disponibilidad?fecha=YYYY-MM-DD`; muestra slots. |
| TU-03.7 | Slot ocupado | Inspeccionar slot `OCUPADO`. | Debe estar disabled y explicar `Ocupado`. |
| TU-03.8 | Slot pasado/muy pronto | Elegir hoy si hay slots cercanos. | Slots bajo ventana de anticipacion deben estar disabled con `Ya paso`/`Muy pronto`. |
| TU-03.9 | Seleccionar libre | Click slot `LIBRE`. | Muestra horario seleccionado y habilita `Reservar turno`. |
| TU-03.10 | Doble click reservar | Click rapido dos veces. | Debe emitirse una sola request o segunda debe quedar bloqueada/idempotente. |
| TU-03.11 | POST reserva | Confirmar reserva. | `POST /turnos/socio/reservar` con `nutricionistaId`, `fechaTurno`, `horaTurno`; respuesta 201/200. |
| TU-03.12 | Estado creado | Revisar response y pantalla. | Estado debe ser `CONFIRMADO`; si aparece `PROGRAMADO`, error funcional historico. |
| TU-03.13 | Redireccion confirmacion | Tras exito. | Navega a `/turnos/:idTurno/confirmado`. |
| TU-03.14 | Persistencia en Mis Turnos | Volver a `/turnos`. | El turno aparece en listado con fecha/hora/profesional/estado correctos. |

### TU-04 - Confirmacion De Turno

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-04.1 | Abrir confirmacion propia | Como SOCIO dueño, abrir `/turnos/:idTurno/confirmado`. | `GET /turnos/socio/turno/:id` 200; muestra `Turno reservado` y datos. |
| TU-04.2 | Datos visibles | Revisar confirmacion. | Debe mostrar codigo, fecha, hora, profesional, datos del socio y estado entendible. |
| TU-04.3 | Recordatorios | Revisar copy. | Debe mencionar recordatorios si esa promesa existe en el producto; si no aparece, reportar UI/UX. |
| TU-04.4 | Turno ajeno | SOCIO intenta abrir confirmacion de turno ajeno. | Debe bloquear 403/404 o mensaje claro sin datos. |
| TU-04.5 | Rol no socio | Recepcion/NUT abre confirmacion de turno socio. | No debe filtrar datos si no corresponde. |
| TU-04.6 | Volver a turnos | Click `Volver a mis turnos`. | Navega a `/turnos`. |

### TU-05 - Mis Turnos Del Socio

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-05.1 | Carga inicial | Abrir `/turnos`. | `GET /turnos/socio/mis-turnos`; heading `Mis Turnos`, listado o empty. |
| TU-05.2 | Empty state | Socio sin turnos. | `No tenes turnos registrados.` y CTA `Ir a agendar turno`. |
| TU-05.3 | Loading/error | Recargar/forzar error real si ocurre. | Loading `Cargando turnos...`; error visible sin stack trace. |
| TU-05.4 | Filtro busqueda | Buscar profesional/fecha/hora/estado. | Lista filtra. Si sin coincidencias debe mostrar empty de filtros, no lista vieja. |
| TU-05.5 | Filtro estado | Probar `CONFIRMADO`, `CANCELADO`, `REALIZADO`, `AUSENTE` si existen. | Solo muestra estados seleccionados. |
| TU-05.6 | Rango fechas | Probar desde/hasta. | Requests/paginacion reflejan el rango y validan `hasta >= desde`. |
| TU-05.7 | Paginacion | Cambiar pagina/limite. | Lista actualiza sin perder filtros. |
| TU-05.8 | Acciones por estado | Comparar turnos futuros/pasados. | Solo `CONFIRMADO` futuro muestra Reprogramar/Aviso llegada tarde/Cancelar. |
| TU-05.9 | Acceso rol no socio | Abrir `/turnos` como NUT/ADMIN/RECEPCIONISTA. | Debe mostrar acceso denegado o redirigir; no pantalla socio operable. |

### TU-06 - Cancelacion Por Socio

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-06.1 | Cancelar confirmado futuro | En `/turnos`, click `Cancelar turno`. | Debe pedir confirmacion o, si cancela directo, al menos mostrar loading/toast claro. |
| TU-06.2 | Request cancelacion | Confirmar/click. | `PATCH /turnos/socio/:turnoId/cancelar` con motivo si UI lo solicita; status 200. |
| TU-06.3 | Estado posterior | Revisar card/listado. | Estado `CANCELADO`; desaparecen botones activos. |
| TU-06.4 | Cancelar pasado | Intentar cancelar turno pasado si aparece. | Accion no disponible o error claro. |
| TU-06.5 | Cancelar ajeno | SOCIO intenta endpoint/URL de turno ajeno. | Debe bloquear 403/404. |
| TU-06.6 | Cancelar doble | Repetir cancelacion. | Debe responder conflicto/mensaje claro, sin romper UI. |

### TU-07 - Reprogramacion Por Socio

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-07.1 | Abrir modal | Click `Reprogramar` en turno confirmado futuro. | Dialog `Reprogramar turno #ID` con fecha y slots. |
| TU-07.2 | Cargar disponibilidad | Elegir nueva fecha. | `GET /turnos/socio/profesional/:nutricionistaId/disponibilidad`; muestra slots. |
| TU-07.3 | Sin profesionalId | Si turno no trae profesional resoluble. | Toast `No se pudo identificar el profesional del turno.` y no rompe. |
| TU-07.4 | Slot ocupado/no valido | Elegir ocupado/muy pronto si aparece. | Disabled con motivo. |
| TU-07.5 | Reprogramar libre | Elegir slot libre y confirmar. | `PATCH /turnos/socio/:turnoId/reprogramar`; fecha/hora actualizadas en listado. |
| TU-07.6 | Conflicto 409 | Dos usuarios/acciones toman el mismo slot o turno incompatible. | UI muestra conflicto claro y conserva turno anterior. |
| TU-07.7 | Cancelar modal | Abrir y cerrar sin confirmar. | No debe emitir PATCH. |

### TU-08 - Aviso De Llegada Tarde

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-08.1 | Abrir aviso | Click `Aviso llegada tarde`. | Modal/form pide minutos tarde. |
| TU-08.2 | Minutos validos | Enviar 1..30 minutos. | `POST /turnos/socio/:id/aviso-llegada-tarde`; toast exito. |
| TU-08.3 | Minutos invalidos | Probar 0, negativo, >30 o texto. | Error inline o backend 400 manejado. |
| TU-08.4 | Recepcion ve aviso | Login recepcion y abrir `/recepcion/turnos` fecha del turno. | Card/badge indica `Llega Xm tarde`. |
| TU-08.5 | Turno ajeno | SOCIO intenta avisar tarde en turno ajeno. | Debe bloquear. |
| TU-08.6 | Estado no confirmado | Intentar aviso sobre cancelado/realizado/ausente. | Accion no disponible o error claro. |

### TU-09 - Crear Turno Por Staff En `/turnos/nuevo`

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-09.1 | Recepcion carga wizard | Login RECEPCIONISTA y abrir `/turnos/nuevo`. | Heading `Asignar turno a un socio`, `asignar-turno-form`, buscador socio. |
| TU-09.2 | Admin carga wizard | Login ADMIN y abrir `/turnos/nuevo`. | Mismo wizard, con permisos. |
| TU-09.3 | NUT carga wizard | Login NUTRICIONISTA y abrir `/turnos/nuevo`. | Wizard con nutricionista autoasignado, selector oculto o read-only. |
| TU-09.4 | Socio denegado | Login SOCIO y abrir `/turnos/nuevo`. | `acceso-denegado-socio` visible. |
| TU-09.5 | Buscar socio | Usar `input-buscar-socio` por nombre/DNI/email. | Lista socios del mismo gimnasio, no de otro tenant. |
| TU-09.6 | Socio sin ficha recepcion/admin | Seleccionar socio sin ficha. | Warning `Ficha medica incompleta` o `El socio no tiene ficha completa`, pero permite continuar. |
| TU-09.7 | Socio sin ficha NUT | Buscar socio sin ficha como NUT. | `socio-item-ID` disabled y `badge-ficha-bloqueada`/`Ficha incompleta`. |
| TU-09.8 | Selector nutricionista | Recepcion/admin elige NUT. | `select-nutricionista` contiene solo NUTs del gimnasio. |
| TU-09.9 | NUT ajeno en selector | Intentar seleccionar NUT de otro gimnasio si aparece. | No debe aparecer; si se fuerza API, debe bloquear. |
| TU-09.10 | Fecha y slots | Elegir fecha. | `GET /turnos/admin/profesional/:id/disponibilidad`; slots con `data-testid^=slot-`. |
| TU-09.11 | Modal confirmacion | Seleccionar slot libre. | Modal `Confirmar turno`, resumen socio/nutri/fecha/hora/warning ficha si aplica. |
| TU-09.12 | Crear turno | Confirmar modal. | `POST /turnos/crear` con `socioId`, `nutricionistaId`, `fechaHora`, `tipoConsulta?`; respuesta 201. |
| TU-09.13 | Estado creado staff | Revisar resumen. | `resumen-turno-creado`, estado `CONFIRMADO`, warning si correspondia. |
| TU-09.14 | Doble click confirmar | Confirmar rapidamente dos veces. | Una sola creacion o segunda bloqueada con conflicto claro. |
| TU-09.15 | Cross-gym | Forzar socio/nutri de otro gimnasio. | Backend bloquea 403/404; UI no lista datos ajenos. |

### TU-10 - Recepcion Check-In

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-10.1 | Carga recepcion dia | Login RECEPCIONISTA y abrir `/recepcion/turnos`. | `GET /turnos/recepcion/dia`; heading `Check-in de Turnos`. |
| TU-10.2 | Fecha | Cambiar fecha si UI lo permite. | Lista actualiza turnos del dia seleccionado. |
| TU-10.3 | Busqueda | Usar `busqueda-turnos-input` por nombre/DNI/hora. | Filtra o muestra `Ningun turno coincide`. |
| TU-10.4 | Check-in confirmado | Click `boton-checkin`, confirmar. | Modal `Confirmar Check-in`; `POST /turnos/:id/check-in`; estado `PRESENTE`, toast exito. |
| TU-10.5 | Check-in idempotente | Repetir check-in sobre presente. | Mensaje `ya estaba presente` o respuesta idempotente; no error fatal. |
| TU-10.6 | Error check-in | Si backend falla. | `checkin-error-banner` visible dentro del modal. |
| TU-10.7 | Recepcion no revierte check-in | Login RECEPCIONISTA con turno presente. | No debe ver `boton-revertir-checkin`. |
| TU-10.8 | Admin revierte check-in | Login ADMIN, abrir `/recepcion/turnos`, click revertir. | Pide motivo `revertir-checkin-motivo`; `POST /turnos/:id/revertir-checkin`; vuelve `CONFIRMADO`. |
| TU-10.9 | Motivo requerido | Admin intenta revertir sin motivo. | Boton bloqueado o error visible; no request invalida. |
| TU-10.10 | Check-in cancelado/ausente/realizado | Intentar sobre estados no validos. | Accion no disponible o error claro. |

### TU-11 - Ausencias E Inasistencia

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-11.1 | Marcar ausente manual | Si UI existe, marcar turno confirmado como ausente con motivo. | `POST /turnos/profesional/turnos/:id/marcar-ausente-manual`; estado `AUSENTE`. |
| TU-11.2 | Accion no visible | Si `MarcarAusenteManualModal` no esta conectado. | Reportar UI/UX si el caso de negocio exige accion manual desde UI. |
| TU-11.3 | Revertir ausente | Desde recepcion/NUT/admin sobre AUSENTE. | `PATCH /turnos/:id/revertir-ausente` con motivo; estado final correcto. |
| TU-11.4 | Revertir ausente con llegada | Enviar `llegadaTardeMin`. | Puede devolver `hizoCheckIn=true` y estado `PRESENTE`; UI refleja. |
| TU-11.5 | Notificar inasistencia | Recepcion/admin dispara notificacion si UI/API existe. | `POST /turnos/:id/notificar-inasistencia`; success sin duplicar mensajes raros. |
| TU-11.6 | Scheduler ausencia | No ejecutar scheduler. | Solo documentar si ya hay turno auto AUSENTE observable y verificar estado visible. |

### TU-12 - Agenda Del Nutricionista `/turnos-profesional`

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-12.1 | Carga agenda hoy | Login NUT y abrir `/turnos-profesional`. | `GET /turnos/profesional/:nutricionistaId/hoy`; heading `Mi Agenda de Hoy`. |
| TU-12.2 | Sin turnos hoy | Actor/fecha sin turnos. | Empty `Sin turnos para hoy` o equivalente. |
| TU-12.3 | Confirmado | Card `CONFIRMADO`. | Texto `Esperando check-in de recepción`; no iniciar consulta. |
| TU-12.4 | Presente | Card `PRESENTE`. | CTA `Iniciar consulta`. |
| TU-12.5 | En curso | Card `EN_CURSO`. | CTA `Continuar consulta`. |
| TU-12.6 | Realizado | Card `REALIZADO`. | CTA `Ver consulta`, read-only. |
| TU-12.7 | Ausente | Card `AUSENTE`. | Acciones de revertir ausente/ver ficha si corresponden. |
| TU-12.8 | Cancelado | Card `CANCELADO`. | No requiere accion clinica. |
| TU-12.9 | Ver ficha/progreso | Links desde card. | Rutas a ficha/progreso del paciente usan `socioId`, no `turnoId`. |
| TU-12.10 | NUT ajeno | NUT intenta agenda de otro NUT por URL/API. | Bloqueo 403/404. |

### TU-13 - Consulta Profesional

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-13.1 | Abrir confirmado | NUT abre `/profesional/consulta/:turnoId` para `CONFIRMADO`. | Debe indicar que falta check-in o no permitir edicion. |
| TU-13.2 | Abrir presente | NUT abre turno `PRESENTE`. | Auto-start o CTA inicia `POST /turnos/:id/iniciar-consulta`; estado `EN_CURSO`. |
| TU-13.3 | Abrir en curso | NUT abre `EN_CURSO`. | Form editable, etapas visibles. |
| TU-13.4 | Abrir realizado | NUT abre `REALIZADO`. | Modo read-only; no guardar cambios clinicos. |
| TU-13.5 | Datos base | Revisar header/contexto. | Muestra socio, fecha, hora, estado, ficha de salud o estado `sin ficha`. |
| TU-13.6 | Mediciones validas | Guardar peso/altura y opcionales. | `POST /turnos/:id/mediciones`; devuelve IMC; UI muestra exito. |
| TU-13.7 | Mediciones invalidas | Probar valores fuera de rango/texto. | Errores visibles, no persistir invalido. |
| TU-13.8 | Observacion clinica | Guardar comentario/sugerencias/habitos/objetivos. | `POST /turnos/:id/observaciones`; exito. |
| TU-13.9 | Finalizar sin minimos | Intentar finalizar sin medicion base o comentario clinico. | Boton disabled o error claro. |
| TU-13.10 | Finalizar con minimos | Completar minimos y finalizar. | `POST /turnos/:id/finalizar-consulta`; estado `REALIZADO`; UI read-only. |
| TU-13.11 | Reabrir cierre auto | Si turno fue cerrado automaticamente. | `POST /turnos/:id/reabrir-cierre-auto`; solo NUT dueño; estado correcto. |
| TU-13.12 | NUT ajeno | NUT ajeno abre consulta. | Bloqueo sin datos clinicos. |

### TU-14 - Adjuntos Clinicos En Consulta

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-14.1 | Listar adjuntos | Abrir consulta. | `GET /turnos/:id/adjuntos`; lista vacia o adjuntos. |
| TU-14.2 | Subir JPG/PNG/PDF valido | En consulta editable, subir archivo valido menor a 10MB. | `POST /turnos/:id/adjuntos`; aparece en lista. |
| TU-14.3 | Archivo invalido | Subir formato no permitido o >10MB. | Error claro; no queda adjunto corrupto. |
| TU-14.4 | Obtener URL | Abrir/ver adjunto. | `GET /turnos/:id/adjuntos/:adjId/url`; URL firmada o visualizacion. |
| TU-14.5 | Eliminar adjunto NUT | Eliminar adjunto propio. | `DELETE /turnos/:id/adjuntos/:adjId`; desaparece. |
| TU-14.6 | Eliminar adjunto admin | Si admin tiene UI/API autorizada. | Permite solo dentro de reglas y audita si visible. |
| TU-14.7 | Adjuntos post-cierre | En consulta realizada. | Upload debe estar oculto/bloqueado si la regla lo exige; adjuntos existentes read-only. |

### TU-15 - Configuracion De Agenda `/agenda`

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-15.1 | Carga config | Login NUT y abrir `/agenda`. | `GET /nutricionistas/:personaId/disponibilidad`; muestra horarios o bloque inicial. |
| TU-15.2 | Solo NUT | Abrir `/agenda` como SOCIO/RECEPCIONISTA/ADMIN. | Debe bloquear o mostrar pantalla no disponible. |
| TU-15.3 | Guardar horarios validos | Agregar bloque dia/hora inicio/fin/duracion >=5. | `PUT /nutricionistas/:id/disponibilidad`; toast exito, slots proximos 60 dias si UI lo muestra. |
| TU-15.4 | Duracion invalida | Poner duracion <5. | Toast `La duracion minima del turno es 5 minutos.`; no request. |
| TU-15.5 | Hora fin menor/igual inicio | Configurar bloque invalido. | Error/toast claro; no request. |
| TU-15.6 | Bloques superpuestos | Crear dos bloques solapados mismo dia. | Error claro; no persiste solapamiento. |
| TU-15.7 | Eliminar bloque | Quitar bloque y guardar. | Persistencia correcta o confirmacion si afecta turnos. |
| TU-15.8 | Cambios con turnos afectados | Modificar disponibilidad que pisa turnos existentes. | Si backend responde 409/advertencia, UI debe pedir confirmacion y listar impacto. |

### TU-16 - Bloqueos Y Excepciones De Disponibilidad

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-16.1 | Cargar excepciones | Tab `Excepciones y Bloqueos`. | `GET /nutricionistas/:id/excepciones-disponibilidad`; lista o empty. |
| TU-16.2 | Cargar slots dia | Elegir fecha. | `GET /turnos/profesional/:id/disponibilidad?fecha=YYYY-MM-DD`; slots libres/ocupados. |
| TU-16.3 | Bloquear slot libre | Click `Bloquear Horario`. | `POST /turnos/profesional/:id/bloquear`; slot pasa bloqueado/ocupado. |
| TU-16.4 | Habilitar bloqueado | Click `Habilitar Horario`. | `PATCH /turnos/profesional/:id/:turnoId/desbloquear`; slot vuelve libre. |
| TU-16.5 | Bloquear ocupado | Intentar bloquear slot con turno confirmado/presente. | Debe bloquear accion o pedir confirmacion clara si aplica. |
| TU-16.6 | Bloqueo por rango | Crear excepcion rango con motivo timestamp. | `POST /nutricionistas/:id/excepciones-disponibilidad`; aparece en lista. |
| TU-16.7 | Rango invalido | Fecha fin anterior/inicio vacio/motivo invalido. | Error visible; no request invalida. |
| TU-16.8 | Rango con turnos afectados | Crear rango que incluye turnos. | UI debe mostrar confirmacion 409/listado de afectados o bloquear con mensaje claro. |
| TU-16.9 | Socio ve bloqueo | Como socio, consultar fecha bloqueada. | Slots bloqueados no aparecen libres ni reservables. |

### TU-17 - Reprogramacion Staff Y Asignacion Manual Legacy

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-17.1 | Reprogramar staff | Recepcion/admin/NUT autorizado reprograma turno si UI/API existe. | `PATCH /turnos/:turnoId/reprogramar`; respeta permisos y disponibilidad. |
| TU-17.2 | Reprogramar cross-tenant | Staff de otro gimnasio intenta. | Bloqueo 403/404. |
| TU-17.3 | Asignar manual NUT legacy | Si UI usa `/turnos/profesional/:id/asignar-manual`. | Crea turno propio y respeta ficha/disponibilidad. |
| TU-17.4 | Conflicto staff | Reprogramar/crear sobre slot ocupado. | 409 con mensaje claro. |

### TU-18 - Tokens De Confirmacion/Cancelacion

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-18.1 | Confirmar por token valido | Usar link/token real si disponible. | `POST /turnos/:id/confirmar?token=...`; estado confirmado. |
| TU-18.2 | Cancelar por token valido | Usar link/token real si disponible. | `POST /turnos/:id/cancelar?token=...`; estado cancelado. |
| TU-18.3 | Token invalido | Enviar token inventado. | 400/401/404 manejado, sin cambiar estado. |
| TU-18.4 | Sin JWT | Probar endpoint desde contexto no autenticado si corresponde. | Si controller exige JWT global, documentar 401; si producto espera link publico, reportar discrepancia. |
| TU-18.5 | Token expirado/usado | Si existe token expirado/usado. | Error claro e idempotente. |

### TU-19 - Permisos, Seguridad Y Multi-Tenant

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-19.1 | SOCIO propio | Socio consulta/cancela/reprograma sus turnos. | Permitido solo sobre turnos propios. |
| TU-19.2 | SOCIO ajeno | Socio intenta turno de otro socio. | 403/404 sin datos. |
| TU-19.3 | NUT propio | NUT consulta/inicia/finaliza sus turnos. | Permitido. |
| TU-19.4 | NUT ajeno | NUT intenta turno de otro NUT. | Bloqueo. |
| TU-19.5 | Recepcion same gym | Recepcion ve turnos del gimnasio. | Permitido solo mismo gym. |
| TU-19.6 | Recepcion cross gym | Recepcion fuerza turno/socio/nutri de otro gym. | Bloqueo. |
| TU-19.7 | Admin same gym | Admin ve y opera dentro de su gym. | Permitido segun rol. |
| TU-19.8 | Admin cross gym | Admin de otro gym fuerza datos. | Bloqueo. |
| TU-19.9 | Acciones faltantes | Rol correcto recibe 403 por permiso mal seed/sync. | Error funcional si bloquea flujo principal. |
| TU-19.10 | IDOR adjuntos | NUT intenta adjunto de turno ajeno. | Bloqueo sin URL firmada. |

### TU-20 - Regresiones Historicas Obligatorias

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-20.1 | Ruta staff no 404 | Click `Asignar Turno` dashboard recepcion o abrir `/turnos/nuevo`. | No debe mostrar `Not Found`; debe cargar wizard. |
| TU-20.2 | Endpoint staff real | Crear turno por recepcion/admin. | Debe usar `POST /turnos/crear` o endpoint actual documentado; no endpoints inexistentes como `/turnos/por-recepcion`. |
| TU-20.3 | Estado no PROGRAMADO | Reservar/crear turno. | Response y UI deben mostrar `CONFIRMADO`, no `PROGRAMADO`. |
| TU-20.4 | Rutas viejas | Intentar `/reservar-turno` y `/mis-turnos` si enlaces viejos existen. | No deben estar enlazadas desde UI actual; dashboard debe apuntar a `/turnos/agendar` y `/turnos`. |
| TU-20.5 | IDs hardcodeados E2E | Validar flujo sin asumir `socio-item-18` ni `nutricionistaId=5`. | La sesion verificadora resuelve IDs dinamicamente. |
| TU-20.6 | Login helper falso positivo | Despues de login, verificar layout autenticado. | No seguir pruebas si la app sigue en `Iniciar sesion`. |
| TU-20.7 | Dashboard socio quick actions | Click acciones de dashboard socio. | Deben navegar a rutas reales: `/turnos/agendar`, `/turnos`, `/mi-progreso`, `/mi-plan`. |
| TU-20.8 | Empty filtros Mis Turnos | Filtrar sin resultados. | Debe mostrar empty de filtros. Si muestra lista vieja o empty inalcanzable, reportar. |
| TU-20.9 | Anticipacion inconsistente | Comparar reserva, reprogramacion, staff y calendario embebido. | La ventana de anticipacion debe ser coherente o explicada. |
| TU-20.10 | Disponibilidad ignora excepciones | Bloquear fecha/slot y consultar como socio. | El slot bloqueado no debe figurar libre. |

### TU-21 - Calidad Visual, Responsive Y Accesibilidad

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| TU-21.1 | Desktop 1440px | Probar `/turnos`, `/turnos/agendar`, `/turnos/nuevo`, `/recepcion/turnos`, `/agenda`, consulta. | Layout ordenado, sin solapamientos, cards legibles. |
| TU-21.2 | Mobile 390px | Repetir flujos principales. | Controles accesibles, calendario usable, dialogs no se cortan. |
| TU-21.3 | Teclado | Navegar formularios y modals con Tab/Escape/Enter. | Focus visible, dialogs atrapan foco, Escape/cancel funciona. |
| TU-21.4 | Labels | Inputs de fecha, busqueda, motivos, mediciones. | Labels asociados y errores legibles. |
| TU-21.5 | Toasts | Reserva, cancelacion, check-in, agenda, consulta. | Texto accionable, no tapa CTAs criticos. |
| TU-21.6 | Consola | Durante flujos. | No debe haber errores JS no controlados. |
| TU-21.7 | Estados disabled | Slots/acciones bloqueadas. | Siempre explican motivo: ocupado, muy pronto, ficha incompleta, sin permiso, estado invalido. |

### TU-22 - Contratos De Red A Verificar

| ID | Request | Actor | Esperado |
| --- | --- | --- | --- |
| TU-22.1 | `GET /turnos/socio/ficha-salud` | SOCIO | 200 con ficha o `null` manejado. |
| TU-22.2 | `PUT /turnos/socio/ficha-salud` | SOCIO | 200/201 con ficha actualizada. |
| TU-22.3 | `GET /profesional/publico/disponibles` | SOCIO | 200 paginado con profesionales disponibles. |
| TU-22.4 | `GET /turnos/socio/profesional/:id/disponibilidad?fecha=YYYY-MM-DD` | SOCIO | 200 con slots sanitizados `LIBRE`/`OCUPADO`. |
| TU-22.5 | `POST /turnos/socio/reservar` | SOCIO | 201/200 con `idTurno`, fecha/hora, estado `CONFIRMADO`. |
| TU-22.6 | `GET /turnos/socio/mis-turnos` | SOCIO | 200 paginado con turnos propios. |
| TU-22.7 | `PATCH /turnos/socio/:turnoId/cancelar` | SOCIO | 200, estado `CANCELADO`. |
| TU-22.8 | `PATCH /turnos/socio/:turnoId/reprogramar` | SOCIO | 200, nueva fecha/hora o error claro. |
| TU-22.9 | `POST /turnos/socio/:id/aviso-llegada-tarde` | SOCIO | 200 success, recepcion ve aviso. |
| TU-22.10 | `POST /turnos/crear` | RECEPCIONISTA/ADMIN/NUT | 201, estado `CONFIRMADO`, warning ficha segun rol. |
| TU-22.11 | `GET /turnos/admin/profesional/:id/disponibilidad?fecha=YYYY-MM-DD` | ADMIN/RECEPCIONISTA | 200 con slots completos. |
| TU-22.12 | `GET /turnos/recepcion/dia?fecha=YYYY-MM-DD` | RECEPCIONISTA/ADMIN | 200 con turnos del gym. |
| TU-22.13 | `POST /turnos/:id/check-in` | RECEPCIONISTA/ADMIN | 200, estado `PRESENTE`, idempotencia. |
| TU-22.14 | `POST /turnos/:id/revertir-checkin` | ADMIN | 200, estado `CONFIRMADO`; requiere motivo. |
| TU-22.15 | `GET /turnos/profesional/:nutricionistaId/hoy` | NUT | 200 con turnos propios. |
| TU-22.16 | `GET /turnos/:id` | NUT dueño | 200 con datos clinicos del turno. |
| TU-22.17 | `POST /turnos/:id/iniciar-consulta` | NUT dueño | 200, estado `EN_CURSO`. |
| TU-22.18 | `POST /turnos/:id/mediciones` | NUT dueño | 200 con `imc`. |
| TU-22.19 | `POST /turnos/:id/observaciones` | NUT dueño | 200 success. |
| TU-22.20 | `POST /turnos/:id/finalizar-consulta` | NUT dueño | 200, estado `REALIZADO`. |
| TU-22.21 | `GET/PUT /nutricionistas/:id/disponibilidad` | NUT dueño | 200 y persistencia de agenda. |
| TU-22.22 | `GET/POST /nutricionistas/:id/excepciones-disponibilidad` | NUT dueño | 200/201 y excepcion visible. |
| TU-22.23 | `POST /turnos/profesional/:id/bloquear` | NUT dueño | 200/201, slot bloqueado. |
| TU-22.24 | `PATCH /turnos/profesional/:id/:turnoId/desbloquear` | NUT dueño | 200, slot liberado. |
| TU-22.25 | `POST/GET/DELETE /turnos/:id/adjuntos` | NUT dueño | Gestion de adjuntos segun reglas. |

## Variantes De Datos Que Deben Cubrirse

| Dimension | Valores/casos |
| --- | --- |
| Roles | SOCIO propio/ajeno, NUT dueño/ajeno, RECEPCIONISTA, ADMIN, otro gimnasio. |
| Estados | CONFIRMADO, PRESENTE, EN_CURSO, REALIZADO, CANCELADO, AUSENTE. |
| Fechas | Hoy, manana/futuro cercano, >60 dias si UI lo permite, fecha sin agenda, fecha bloqueada, fecha con slots ocupados. |
| Slots | libre, ocupado, bloqueado, muy pronto, pasado, fuera de agenda. |
| Ficha | completa, inexistente/incompleta, editada con version, validaciones invalidas. |
| Reserva | socio, recepcion/admin, nutricionista, doble click, conflicto 409, cross-tenant. |
| Reprogramacion | misma fecha, otra fecha, slot ocupado, sin profesionalId, conflicto concurrente. |
| Cancelacion | futuro, pasado, ya cancelado, turno ajeno, token. |
| Check-in | puntual, llegada tarde avisada, idempotente, revertido, estado invalido. |
| Consulta | confirmado, presente, en curso, realizado, sin ficha, con adjuntos, cierre automatico. |
| Agenda | duracion 5/30/60, hora invalida, solapamiento, cambios con turnos afectados, rango de bloqueo. |
| Adjuntos | jpg/png/pdf valido, formato invalido, >10MB, eliminar, URL firmada. |
| Viewports | desktop y mobile. |

## Selectores Y Textos Utiles

Estos selectores/textos pueden cambiar, pero si existen deben usarse para mejorar estabilidad.

| Selector/texto | Uso |
| --- | --- |
| `modal-ficha-requerida-socio` | Modal ficha obligatoria en `/turnos`. |
| `boton-guardar-ficha` | Guardar ficha salud. |
| `boton-ver-historial` | Historial ficha. |
| `boton-aceptar-consentimiento` | Consentimiento ficha. |
| `fecha-ultima-edicion` | Banner ultima edicion ficha. |
| `detalle-version` | Version read-only de ficha. |
| `input-buscar-socio` | Busqueda socio en `/turnos/nuevo`. |
| `socio-item-ID` | Item de socio en wizard staff. |
| `badge-ficha-bloqueada`, `badge-ficha-advertencia`, `warning-ficha-incompleta` | Estados ficha en staff. |
| `select-nutricionista` | Selector NUT para recepcion/admin. |
| `slot-HH:MM` | Slot horario en staff/agenda. |
| `modal-confirmacion`, `boton-confirmar-modal` | Confirmacion creacion staff. |
| `resumen-turno-creado` | Resultado turno staff. |
| `acceso-denegado-socio` | Socio bloqueado en `/turnos/nuevo`. |
| `busqueda-turnos-input` | Busqueda recepcion. |
| `boton-checkin`, `boton-confirmar-checkin`, `checkin-error-banner` | Check-in. |
| `boton-revertir-checkin`, `revertir-checkin-motivo`, `boton-confirmar-revertir-checkin` | Revertir check-in. |
| Textos `Mis Turnos`, `Agendar turno`, `Asignar turno a un socio` | Navegacion principal. |
| Textos `Check-in de Turnos`, `Mi Agenda de Hoy`, `Mi Agenda` | Recepcion/profesional/agenda. |
| Textos `Reservar turno`, `Reprogramar`, `Aviso llegada tarde`, `Cancelar turno` | Acciones socio. |
| Textos `Iniciar consulta`, `Continuar consulta`, `Finalizar consulta` | Consulta profesional. |
| Textos `Guardar horarios`, `Bloquear Horario`, `Habilitar Horario` | Agenda y bloqueos. |

## Criterios De Falla Critica

Si ocurre cualquiera de estos puntos, el modulo no puede considerarse validado.

- El socio con ficha completa no puede reservar un turno real sobre un slot libre.
- La reserva o creacion staff queda en `PROGRAMADO` en vez de `CONFIRMADO`.
- La UI muestra exito pero el turno no aparece luego en `/turnos`, recepcion o agenda profesional.
- El socio sin ficha puede reservar sin completar ficha.
- El nutricionista puede asignar turno a socio sin ficha cuando RB14 exige bloqueo.
- Recepcion/admin no pueden crear turno por staff o `/turnos/nuevo` muestra 404.
- Un usuario ve o modifica turnos de otro gimnasio o actor ajeno.
- Check-in no transiciona a `PRESENTE` o permite estados invalidos sin mensaje.
- Recepcion puede revertir check-in aunque la regla lo reserva a admin.
- NUT puede iniciar/finalizar consulta de turno ajeno o sin check-in requerido.
- Consulta finaliza sin datos minimos clinicos si la regla los exige.
- Bloqueos/excepciones de agenda no afectan disponibilidad visible para socios.
- Hay errores JS no controlados durante flujos principales.
- Dashboard o sidebar enlaza a rutas obsoletas (`/reservar-turno`, `/mis-turnos`, `/reservar`).

## Priorizacion De Ejecucion

Si el tiempo es limitado, ejecutar en este orden. Los casos P0 son obligatorios para declarar cualquier avance.

| Prioridad | Casos |
| --- | --- |
| P0 | TU-00, TU-01, TU-02, TU-03, TU-04, TU-05, TU-09, TU-10, TU-12, TU-19, TU-20. |
| P1 | TU-06, TU-07, TU-08, TU-13, TU-15, TU-16, TU-22. |
| P2 | TU-11, TU-14, TU-17, TU-18, TU-21 y variantes dificiles de preparar. |

## Notas Para La Sesion Verificadora

- Esta spec describe el comportamiento esperado, aunque el sistema actual pueda no cumplirlo. Si algo falla, no lo arregles en la verificacion: documentalo con evidencia.
- Cuando una pantalla no tenga UI para una accion documentada, validar por API autenticada solo como complemento y registrar la ausencia de UI si afecta al usuario.
- Si un caso requiere datos que no existen en seed, marcar `BLOQUEADO por datos`, explicar que dato falta y no inventar IDs.
- Para no contaminar la base, preferir crear turnos nuevos con timestamp y luego cancelarlos si el caso lo permite.
- La validacion visual debe incluir al menos una captura desktop y una mobile de `/turnos/agendar`, `/turnos/nuevo` o `/recepcion/turnos`.
- No copiar los E2E viejos sin corregir rutas: `/reservar-turno` y `/mis-turnos` no son las rutas actuales del router.
