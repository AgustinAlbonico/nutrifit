# Spec de validacion funcional: Plan de Alimentacion

> **Modulo**: Plan de Alimentacion completo
> **Fecha**: 2026-06-28
> **Objetivo**: servir como contrato para que otra sesion de IA valide el modulo interactuando con la app real mediante Playwright MCP.
> **Fuente de verdad**: navegador, requests de red, consola y estado visible de UI.
> **Prohibido dar por valido solo revisando codigo**.

Este documento define que deberia estar funcionando en el modulo de Plan de Alimentacion, incluyendo flujos principales, variantes, permisos, estados vacios, errores, regeneracion IA, versionado, activacion, vista del socio y regresiones historicas. La sesion verificadora debe entrar al sistema como usuario real y reportar cada discrepancia contra esta spec.

## Contrato De Verificacion

- No iniciar ni reiniciar backend o frontend. Agustin los levanta manualmente.
- Antes de probar, verificar `localhost:3000` y `localhost:5173`. Si alguno no responde, pedirle a Agustin que lo levante y detenerse.
- Leer `CREDENCIALES_SEED.md` para credenciales. No hardcodear emails o passwords fuera de lo leido.
- No confundir DNI con `socioId`. Los IDs reales deben resolverse desde UI, JWT, responses API o listados del sistema.
- No usar mocks de backend, Groq ni fixtures interceptadas para marcar OK. Si se usa mocking para explorar un caso tecnico, debe quedar separado y no cuenta como validacion real.
- No revisar codigo para inferir comportamiento. El codigo puede usarse solo para entender nombres de rutas si esta spec queda ambigua, pero el resultado se decide en browser/red.
- Cada caso debe terminar como `OK`, `ERROR` o `BLOQUEADO`. No saltear con `if (response.ok())` sin reportar el estado real.
- Capturar evidencia minima por flujo: snapshot o screenshot, request relevante con metodo/status/payload parcial, mensaje UI visible y consola del navegador.
- Si Groq esta sin cuota o devuelve error externo, registrar el error real y validar que no se persistan planes corruptos o incompletos.
- Generar datos unicos con timestamp en notas o comentarios para distinguir ejecuciones.

## Resultado Esperado Del Reporte

El reporte final debe guardar discrepancias en `iteracion 1/errores/plan-alimentacion-validacion-playwright.md` y devolver a Agustin solo un resumen corto con conteos.

Formato minimo del reporte:

```markdown
# Plan de Alimentacion: Errores detectados

> **Fuente**: `iteracion 1/specs/plan-alimentacion-validacion-playwright.md`
> **Fecha**: YYYY-MM-DD HH:mm
> **Herramienta**: Playwright MCP
> **Evidencia**: rutas de screenshots y requests relevantes

## Errores funcionales

### 1. Titulo corto del error

- **Spec**: requisito incumplido.
- **Realidad**: comportamiento observado en browser/red.
- **Impacto**: por que importa para el usuario o para seguridad/datos.

## Problemas de UI/UX

### 1. Titulo corto del problema

- **Spec**: expectativa visual o de UX.
- **Realidad**: comportamiento observado.
- **Impacto**: por que afecta la validacion o la experiencia.

## Funcionalidades que SI funcionan

- Item verificado con evidencia concreta.
```

## Alcance Del Modulo

Debe validarse el modulo completo, no solo la generacion IA.

| Area | Pantallas / rutas | APIs principales |
| --- | --- | --- |
| Gestion del nutricionista | `/planes` | `GET /planes-alimentacion/nutricionista/:nutricionistaId` |
| Vista profesional del plan | `/profesional/plan/:socioId` | `GET /planes-alimentacion/socio/:socioId/activo` |
| Editor IA y ficha | `/profesional/plan/:socioId/editar` | `POST /ia/plan-semanal`, `POST /ia/plan-semanal/regenerar`, ficha de salud profesional |
| Versiones | Editor sidebar | `GET /planes-alimentacion/:id/versiones`, `GET /planes-alimentacion/version/:versionId` |
| Feedback | Modal del editor | `POST/PUT /planes-alimentacion/version/:versionId/feedback` |
| Activacion/finalizacion | Editor o acciones de plan | `POST /planes-alimentacion/:id/activar`, `POST /planes-alimentacion/:id/finalizar` |
| Vista del socio | `/mi-plan` y dashboard socio | `GET /planes-alimentacion/socio/:socioId/activo` |
| CRUD legacy/manual | `/planes` y editor legacy si aparece | `POST/PUT/DELETE /planes-alimentacion`, `DELETE /planes-alimentacion/:id/contenido` |

Fuera de alcance para dar OK al modulo:

- Tests unitarios sin navegador.
- Tests Playwright con backend mockeado.
- Validaciones hechas solo por lectura de codigo.
- Re-sembrar la base sin aprobacion de Agustin.

## Actores De Prueba

Usar cuentas reales de `CREDENCIALES_SEED.md`. Preferir Gym Central para el flujo principal.

| Actor | Uso esperado |
| --- | --- |
| `NUTRICIONISTA` de Gym Central | Actor principal para crear, generar, regenerar, votar, activar, finalizar, vaciar y eliminar planes propios. |
| `SOCIO` de Gym Central | Ver su plan activo en `/mi-plan`, sin editar ni votar. |
| `SOCIO` sin plan activo | Validar empty state de `/mi-plan`. |
| `NUTRICIONISTA` de otro gimnasio | Validar aislamiento multi-tenant y que no pueda ver/modificar planes ajenos. |
| `ADMIN` del mismo gimnasio | Validar acceso permitido por rol/permiso donde exista UI o endpoint documentado. |
| `RECEPCIONISTA` | Validar que no acceda a contenido clinico de planes por links directos. |
| `SUPERADMIN` | Validacion API secundaria si los permisos existen; no es el flujo visual principal. |

Si una cuenta no tiene datos suficientes para un caso, resolver otro actor desde UI/API. No usar IDs inventados.

## Modelo Funcional Esperado

### Estados Del Plan

| Estado | Visible para nutricionista | Visible para socio | Reglas |
| --- | --- | --- | --- |
| `BORRADOR` | Si | No | Plan generado o editado, pendiente de activacion. |
| `ACTIVO` | Si | Si | Debe tener exactamente una version activa. |
| `FINALIZADO` | En historial/inactivos | No como activo | No debe poder regenerarse ni activarse sin crear nuevo flujo. |

### Versiones

| Situacion | Version esperada |
| --- | --- |
| Generacion inicial IA | `numeroVersion = 1`, `motivoCambio = creacion_inicial`, `activa = false` hasta activar. |
| Regenerar plan completo | Nueva version con `motivoCambio = regeneracion_completa`. |
| Regenerar un dia | Nueva version con `motivoCambio = regeneracion_dia` y solo cambia ese dia. |
| Regenerar alternativa | Nueva version con `motivoCambio = regeneracion_alternativa` y solo cambia esa alternativa. |
| Edicion manual | Nueva version con `motivoCambio = edicion_manual`; regenerar encima debe pedir confirmacion si se perderian cambios. |
| Activar version | Version elegida `activa = true`; otras versiones del mismo plan `activa = false`. |

### Estructura Del Plan IA

| Campo | Regla esperada |
| --- | --- |
| Dias | Deben coincidir con `diasAGenerar`, por default 7: `LUNES` a `DOMINGO`. |
| Comidas | Deben coincidir con `comidasPorDia`, por default 4. Tipos validos: `DESAYUNO`, `ALMUERZO`, `MERIENDA`, `CENA`, `COLACION`. |
| Alternativas | Deben coincidir con `alternativasPorComida`, por default 3. |
| Alimentos | Cada alternativa debe tener nombre, alimentos, cantidades/unidades y macros. No debe verse contenido vacio o `undefined`. |
| Macros por dia | Cada dia debe mostrar calorias, proteinas, carbohidratos, grasas y banda. |
| Razonamiento | Debe explicar restricciones cumplidas y no cumplidas de forma visible para el nutricionista. |
| Persistencia | Si UI dice exito, el plan y su version deben poder recuperarse por API/historial. |

### Bandas De Macros

| Banda | Comportamiento esperado |
| --- | --- |
| `VERDE` | Puede activarse si no hay errores bloqueantes. |
| `AMARILLO` | Puede persistir como borrador, pero debe advertir y bloquear activacion. |
| `ROJO` | Puede persistir como borrador si el backend lo permite, pero debe advertir fuertemente y bloquear activacion. |

## Matriz De Aceptacion

### PA-00 - Preflight Obligatorio

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-00.1 | Puertos | Verificar backend `3000` y frontend `5173`. | Si ambos responden, continuar. Si no, pedir a Agustin que los levante y detenerse. |
| PA-00.2 | Credenciales | Leer `CREDENCIALES_SEED.md`. | Usar emails/password reales del archivo. |
| PA-00.3 | Consola base | Abrir frontend y login page. | No debe haber errores JS iniciales. Warnings no bloqueantes se documentan si afectan UI. |
| PA-00.4 | Sesion limpia | Iniciar cada rol en contexto limpio o logout real. | No debe filtrarse estado entre usuarios. |

### PA-01 - Acceso Y Navegacion Por Rol

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-01.1 | Sidebar nutricionista | Login como NUTRICIONISTA. | Debe verse acceso a `Planes de Alimentacion` o equivalente que navegue a `/planes`. |
| PA-01.2 | Sidebar socio | Login como SOCIO. | Debe verse acceso a `Mi Plan` que navegue a `/mi-plan`. No debe navegar a `/planes`. |
| PA-01.3 | Recepcionista sin acceso clinico | Login como RECEPCIONISTA y forzar `/planes`, `/mi-plan`, `/profesional/plan/:socioId/editar`. | No debe renderizar informacion clinica ni plan alimentario. Debe mostrar acceso denegado, redireccion o error 403 manejado. |
| PA-01.4 | Nutricionista ajeno | Login como NUT de otro gimnasio e intentar acceder a plan/socio de Gym Central por URL/API. | Debe bloquear con 403/404 manejado. Nunca debe mostrar datos del socio ajeno. |
| PA-01.5 | Socio directo a editor | Login como SOCIO y abrir `/profesional/plan/:socioId/editar`. | No debe permitir generar, regenerar, votar ni ver datos clinicos de otro socio. |

### PA-02 - Gestion De Planes En `/planes`

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-02.1 | Carga inicial | Login NUT y abrir `/planes`. | Header `Planes de Alimentacion`, KPIs/listados o empty state. Request `GET /planes-alimentacion/nutricionista/:personaId` con 200. |
| PA-02.2 | Loading | Recargar pagina. | Debe verse skeleton/loading, no pantalla rota. |
| PA-02.3 | Error de carga | Si la API responde error real, observar UI. | Debe mostrar `Error al cargar los planes. Intenta nuevamente.` o mensaje equivalente sin stack trace. |
| PA-02.4 | Busqueda | Buscar por nombre, apellido, DNI u objetivo. | La lista debe filtrar. Sin resultados debe mostrar empty state claro. |
| PA-02.5 | Activos e inactivos | Inspeccionar secciones. | Debe distinguir planes activos e inactivos/finalizados con badges, fechas y paciente. |
| PA-02.6 | Paginacion inactivos | Si hay suficientes inactivos, cambiar pagina/limite. | La paginacion debe actualizar la lista sin perder filtros. |
| PA-02.7 | Menu contextual | Abrir kebab de un plan. | Deben verse acciones esperadas: editar/ver progreso/vaciar/eliminar u opciones equivalentes. |

### PA-03 - Modal Crear Plan Desde Gestion

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-03.1 | Abrir modal | Click en `Crear Nuevo Plan` o CTA equivalente. | Modal abre con buscador y pacientes disponibles. Request `GET /turnos/profesional/:personaId/pacientes` con 200. |
| PA-03.2 | Deduplicacion | Revisar pacientes listados. | No debe haber duplicados con el mismo `socioId`. Si hay nombres iguales con IDs distintos, deben poder distinguirse por DNI/email/otro dato. |
| PA-03.3 | Paciente con plan activo | Validar que pacientes con plan activo no aparezcan como disponibles. | El modal debe excluirlos o explicar que ya tienen plan activo. |
| PA-03.4 | Sin pacientes | Usar actor sin pacientes si existe. | Debe mostrar `No tienes pacientes registrados` o equivalente. |
| PA-03.5 | Todos con plan | Si todos tienen plan activo. | Debe mostrar `Todos tus pacientes ya tienen un plan de alimentacion activo` o equivalente. |
| PA-03.6 | Seleccionar paciente | Elegir un paciente disponible. | Debe navegar a `/profesional/plan/:socioId/editar`, usando `socioId` real, no `planId`. |

### PA-04 - Editor, Header Y Ficha De Salud

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-04.1 | Header paciente | Abrir `/profesional/plan/:socioId/editar`. | Debe mostrar nombre/avatar del paciente si se resolvio; si no, texto claro `Genera un plan para el socio #ID`. |
| PA-04.2 | Ficha loading | Observar carga de ficha. | Debe verse `Cargando ficha del paciente...` o skeleton. |
| PA-04.3 | Ficha existente | Paciente con ficha cargada. | Card `restricciones-editables-card` debe mostrar objetivo, peso/altura, alergias, patologias, restricciones, medicacion/suplementos si existen. |
| PA-04.4 | Ficha ausente | Paciente sin ficha. | No debe romper. Debe explicar que falta ficha y permitir crear/completar si el NUT tiene permiso. Boton generar debe quedar bloqueado hasta tener ficha valida. |
| PA-04.5 | Sin permiso a ficha | NUT sin turno previo o socio ajeno. | Debe mostrar mensaje de permisos, no datos clinicos. |
| PA-04.6 | Editar ficha | Click `boton-editar-ficha`, modificar un dato permitido y guardar. | Request PUT de ficha con 200/201, toast de exito, nueva version visible o datos actualizados. |
| PA-04.7 | Validacion ficha | Intentar peso/altura/objetivo invalido si la UI lo permite. | Deben aparecer errores inline y no debe enviarse payload invalido. |
| PA-04.8 | Cancelar edicion | Entrar en modo edicion y cancelar. | Deben restaurarse valores originales sin request PUT. |

### PA-05 - Formulario De Generacion IA

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-05.1 | Defaults | Abrir editor con ficha disponible. | Form muestra `Días a generar = 7`, `Comidas por día = 4 comidas (recomendado)`, `Alternativas = 3`, fecha inicio valida. |
| PA-05.2 | Rango dias minimo | Poner `0` o vacio en dias. | Error inline `Debe generar al menos 1 dia` o equivalente. Boton generar deshabilitado. |
| PA-05.3 | Rango dias maximo | Poner `15` en dias. | Error inline `No se pueden generar mas de 14 dias`. |
| PA-05.4 | Comidas por dia | Probar 1, 4 y 5. | Select debe aceptar valores validos y reflejarlos en payload. |
| PA-05.5 | Alternativas minimo/maximo | Probar 0, 1, 5 y 6. | Solo 1..5 validos; errores inline para fuera de rango. |
| PA-05.6 | Notas vacias | Generar sin notas. | Payload no debe enviar texto vacio innecesario o debe enviarlo de forma inocua. |
| PA-05.7 | Notas normales | Escribir nota con timestamp. | Payload debe incluir `notasGeneracion` trimmeada y luego poder auditarse en el plan/version si la UI lo muestra. |
| PA-05.8 | Notas > 1000 | Pegar texto mayor a 1000 caracteres. | Debe bloquear submit con error visible. |
| PA-05.9 | Fecha invalida | Intentar fecha invalida si el input lo permite. | Debe bloquear submit o normalizar a formato `YYYY-MM-DD` sin romper. |
| PA-05.10 | Doble submit | Hacer click rapido varias veces en generar. | Debe emitirse una sola request `POST /ia/plan-semanal`; boton queda busy/deshabilitado. |

### PA-06 - Generacion IA Flujo Feliz

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-06.1 | Generar default | Con ficha disponible, click `Generar plan`. | Request `POST /ia/plan-semanal` con `socioId`, `diasAGenerar=7`, `comidasPorDia=4`, `alternativasPorComida=3`, fecha y notas si aplica. |
| PA-06.2 | Loading generacion | Durante la request. | Boton muestra busy/loader, queda deshabilitado y no permite cambiar datos de forma peligrosa. |
| PA-06.3 | Respuesta exitosa | Si backend responde 201/200. | Toast `Plan generado correctamente`, `planAlimentacionId`, `versionId`, `numeroVersion=1`; UI muestra card `plan-generado-card`. |
| PA-06.4 | Persistencia | Luego de exito, consultar historial/versiones o recargar. | El plan no desaparece. La version creada debe estar en historial. |
| PA-06.5 | Estado inicial | Verificar plan recien generado antes de activar. | Debe quedar `BORRADOR` o candidato. El socio no debe verlo como activo todavia. |
| PA-06.6 | Sin plan corrupto | Si Groq falla, quota o timeout. | UI muestra error claro; no debe aparecer plan parcial como exito ni version corrupta. |

### PA-07 - Grilla Visual Del Plan Generado

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-07.1 | Grid V2 | Luego de generar, ubicar `weekly-plan-grid-v2`. | Debe renderizar dias y comidas sin errores JS. |
| PA-07.2 | 7 dias default | Contar `LUNES` a `DOMINGO`. | Deben estar todos. Si faltan dias, error funcional. |
| PA-07.3 | 4 comidas default | Para cada dia default, verificar 4 slots. | Deben verse 4 comidas por dia, sin slots vacios inesperados. |
| PA-07.4 | 3 alternativas default | Abrir tabs/alternativas de una comida. | Deben existir 3 alternativas navegables. |
| PA-07.5 | Nombres y alimentos | Inspeccionar alternativa. | Debe verse nombre de comida y alimentos legibles. Ver solo `alimento #id` sin nombre es problema UI/UX. |
| PA-07.6 | Cantidades/unidades | Inspeccionar alimentos. | Deben verse cantidades y unidades claras. No debe haber `NaN`, `undefined`, valores negativos o vacios. |
| PA-07.7 | Totales diarios | Revisar macros de cada dia. | Deben mostrarse calorias, proteinas, carbohidratos y grasas con unidades/valores entendibles. |
| PA-07.8 | Mobile | Repetir vista en viewport movil. | La grilla debe transformarse en cards/stack legible, sin overflow horizontal inutil ni controles inaccesibles. |

### PA-08 - Restricciones Clinicas Y Macros

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-08.1 | Restricciones cumplidas | Usar socio con alergias/restricciones si existe. | Panel de razonamiento debe listar restricciones cumplidas. El contenido del plan no debe contradecir alergias/patologias conocidas. |
| PA-08.2 | Restricciones no cumplidas | Si backend reporta `restriccionesNoCumplidas`. | Deben verse advertencias claras; no debe ocultarse como exito perfecto. |
| PA-08.3 | Patologias | Con socio diabetico/celiaco/hipertenso si existe. | El plan debe evitar ingredientes incompatibles o reportar advertencia explicita. |
| PA-08.4 | Banda verde | Generar o localizar plan verde. | Badge verde visible; activacion permitida si otros requisitos pasan. |
| PA-08.5 | Banda amarilla | Localizar o provocar plan amarillo si aparece. | Badge amarillo visible; activacion bloqueada con mensaje claro. |
| PA-08.6 | Banda roja | Localizar o provocar plan rojo si aparece. | Badge rojo visible; activacion bloqueada y advertencia fuerte. |
| PA-08.7 | Dias faltantes | Si la IA devuelve menos dias que los pedidos. | Debe fallar o mostrar error claro `dias faltantes`; no debe mostrar exito parcial. |
| PA-08.8 | Comidas faltantes | Si falta una comida dentro de un dia. | Debe fallar o advertir; no debe renderizar `Sin alternativas` como si fuera plan valido. |

### PA-09 - Historial De Versiones

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-09.1 | Carga historial | Tras generar, revisar sidebar/version history. | Request `GET /planes-alimentacion/:id/versiones` con 200. Debe listar v1. |
| PA-09.2 | Estado loading/error | Recargar editor. | Sidebar debe manejar loading y error sin romper layout. |
| PA-09.3 | Seleccionar version | Click en version listada. | Debe cargar o mostrar claramente la version seleccionada. Si solo cambia highlight/toast y no carga datos, reportar. |
| PA-09.4 | Version activa | Tras activar una version. | Historial debe marcar una sola version activa. |
| PA-09.5 | Orden | Crear v2/v3 por regeneracion. | Historial debe ordenarse de forma entendible, preferentemente version mas reciente primero o con labels claros. |

### PA-10 - Regeneracion IA

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-10.1 | Regenerar plan | Click `regen-plan-button` o CTA equivalente. | Request `POST /ia/plan-semanal/regenerar` con `scope=PLAN`; crea nueva version y actualiza grid. |
| PA-10.2 | Regenerar dia | Click regenerar en un dia, por ejemplo `LUNES`. | Payload `scope=DIA`, `dia=LUNES`; solo ese dia deberia cambiar. |
| PA-10.3 | Regenerar alternativa | Click regenerar alternativa 0 de una comida. | Payload `scope=ALTERNATIVA`, `dia`, `comidaSlot`, `alternativaIndex`; solo esa alternativa deberia cambiar. |
| PA-10.4 | Loader regeneracion | Durante regeneracion. | Debe haber feedback visual del item o global. Si no hay loader y parece que no paso nada, reportar UI/UX. |
| PA-10.5 | Version posterior | Luego de regenerar. | `numeroVersion` incrementa, historial lista nueva version, toast indica version creada. |
| PA-10.6 | Error regeneracion | Si API responde 400/403/409/503. | UI muestra toast/error claro y conserva la version anterior visible. |

### PA-11 - Edicion Manual Y Perdida De Cambios

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-11.1 | Marcar slot editado | Si UI permite editar manualmente un slot, modificarlo. | Slot queda marcado como editado o se crea version `edicion_manual`. |
| PA-11.2 | Regenerar slot editado | Intentar regenerar dia/alternativa editada manualmente. | Debe aparecer dialog `Edicion manual detectada` o equivalente antes de perder cambios. |
| PA-11.3 | Cancelar confirmacion | Cancelar dialog. | No debe emitirse request de regeneracion. Cambios se conservan. |
| PA-11.4 | Confirmar perdida | Confirmar dialog. | Request incluye `confirmarPerdidaEdicionManual=true`; nueva version queda registrada. |

### PA-12 - Feedback Del Nutricionista

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-12.1 | Abrir modal | Click `feedback-floating-button` o CTA equivalente. | Modal abre con opciones positivo/negativo y comentario. |
| PA-12.2 | Crear feedback positivo | Enviar voto `POSITIVO` con comentario timestamp. | Request `POST /planes-alimentacion/version/:versionId/feedback` con 201/200, toast exito, feedback visible o estado guardado. |
| PA-12.3 | Feedback duplicado | Intentar enviar otro POST para misma version si UI lo permite. | Debe responder 409 o UI debe cambiar a edicion. No debe crear duplicados. |
| PA-12.4 | Editar feedback | Cambiar voto/comentario existente. | Request `PUT /planes-alimentacion/version/:versionId/feedback`; actualiza estado. |
| PA-12.5 | Comentario vacio | Enviar voto sin comentario. | Debe aceptarse si voto es valido, o mostrar validacion clara si comentario se volvio requerido. |
| PA-12.6 | Socio no vota | Login SOCIO y buscar feedback. | Socio no debe ver ni poder usar controles de feedback. |
| PA-12.7 | NUT ajeno no vota | NUT de otro gimnasio/otro dueño intenta votar version ajena. | Debe bloquear 403/404, sin cambiar feedback. |

### PA-13 - Activacion De Plan

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-13.1 | Activar plan verde | Con version verde, click activar. | Request `POST /planes-alimentacion/:id/activar` con `{ versionId }`; respuesta estado `ACTIVO`. |
| PA-13.2 | UI post activacion | Observar editor/listado. | Badge/estado activo visible, historial marca version activa. |
| PA-13.3 | Socio ve activo | Login SOCIO dueño y abrir `/mi-plan`. | Debe ver el plan activado. |
| PA-13.4 | Activar amarillo/rojo | Intentar activar version con macros no verdes si existe. | Debe bloquear con mensaje claro. Si se activa, error funcional. |
| PA-13.5 | Activar version ajena | NUT ajeno intenta activar. | Debe bloquear 403/404. |
| PA-13.6 | Permisos de accion | Si NUT dueño recibe 403 por permisos al activar. | Reportar error funcional: el rol principal no puede completar el flujo. |

### PA-14 - Vista Del Socio En `/mi-plan`

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-14.1 | Sin plan activo | Login SOCIO sin plan activo y abrir `/mi-plan`. | Empty state `Tu nutricionista esta preparando tu plan` o equivalente, sin error rojo falso. |
| PA-14.2 | Con plan activo | Login SOCIO con plan activado. | Request `GET /planes-alimentacion/socio/:socioId/activo` responde array. UI muestra una card por plan activo. |
| PA-14.3 | Read-only | Intentar encontrar controles de edicion/regeneracion/feedback. | No deben existir para socio. |
| PA-14.4 | Contenido visible | Revisar dias/comidas/alternativas/macros. | Debe verse el mismo snapshot activo que aprobo el NUT. |
| PA-14.5 | Multiples planes activos | Si socio tiene planes de mas de un nutricionista. | Deben verse N cards, separadas por nutricionista, sin pisarse. |
| PA-14.6 | PDF | Revisar `Descargar PDF`. | Si el boton existe, debe estar habilitado y generar PDF correcto. Si esta deshabilitado sin explicacion o callback, reportar UI/UX. |
| PA-14.7 | Dashboard socio | Desde dashboard socio, click card `Mi Plan`/`Ver plan completo`. | Debe navegar a `/mi-plan`, no a `/planes`. |

### PA-15 - Vista Profesional Del Plan En `/profesional/plan/:socioId`

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-15.1 | Abrir con socioId real | Desde listado o URL, abrir `/profesional/plan/:socioId`. | Debe consultar planes activos del socio y mostrar estado real. |
| PA-15.2 | No confundir planId | Desde `/planes`, usar links `Ver`/`Editar` y observar URL. | La ruta profesional debe recibir `socioId`, no `planId`. Si usa `planId` como `socioId`, error funcional. |
| PA-15.3 | Sin plan | Socio sin plan activo. | Debe mostrar `Plan no configurado` o CTA de crear, no error tecnico. |
| PA-15.4 | Plan activo | Socio con plan activo. | Debe mostrar badge activo, datos del paciente y CTA editar si NUT dueño. |
| PA-15.5 | Finalizar placeholder | Si aparece boton finalizar deshabilitado. | Debe tener tooltip/explicacion. Si la spec funcional exige finalizar, debe existir camino real en PA-16. |

### PA-16 - Finalizacion

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-16.1 | Finalizar plan activo | Como NUT dueño, finalizar plan desde UI si existe o endpoint si UI no existe. | Request `POST /planes-alimentacion/:id/finalizar`; estado `FINALIZADO`, `activo=false`. |
| PA-16.2 | Socio luego de finalizar | Login SOCIO y abrir `/mi-plan`. | El plan finalizado no debe aparecer como activo. Debe verse empty state u otros planes activos. |
| PA-16.3 | Regenerar finalizado | Intentar regenerar una version de plan finalizado. | Debe bloquear con error claro. |
| PA-16.4 | Re-finalizar | Intentar finalizar dos veces. | Debe responder conflicto/mensaje claro, sin cambiar datos inesperadamente. |

### PA-17 - Vaciar, Eliminar Y CRUD Manual Legacy

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-17.1 | Vaciar contenido | En `/planes`, elegir `Vaciar plan` y confirmar. | Dialog de confirmacion, request `DELETE /planes-alimentacion/:id/contenido`, toast exito; plan queda sin comidas o contenido segun regla. |
| PA-17.2 | Cancelar vaciado | Abrir dialog y cancelar. | No debe emitir DELETE. |
| PA-17.3 | Eliminar plan | Elegir `Eliminar plan` y confirmar. | Request `DELETE /planes-alimentacion/:id`, toast exito, desaparece o pasa a inactivo segun implementacion. |
| PA-17.4 | Cancelar eliminacion | Abrir dialog y cancelar. | No debe emitir DELETE. |
| PA-17.5 | Crear manual si UI existe | Si hay editor manual legacy. | Debe crear version inicial y respetar permisos. No debe romper flujo IA. |
| PA-17.6 | Editar manual si UI existe | Modificar alimentos/cantidades. | Debe crear nueva version `edicion_manual` y recalcular totales visibles. |

### PA-18 - Errores Y Estados Vacio/Error

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-18.1 | 401 sin token | Limpiar sesion y abrir ruta protegida. | Redireccion a login o error auth manejado. No debe verse contenido. |
| PA-18.2 | 403 permisos | Actor sin permiso intenta accion clinica. | Toast/pantalla clara, sin stack trace, sin datos filtrados. |
| PA-18.3 | 404 plan/version | Usar ID inexistente en URL/API. | Mensaje `no encontrado` manejado; no pantalla blanca. |
| PA-18.4 | 400 DTO invalido | Enviar payload invalido desde UI si posible. | Errores de validacion visibles. |
| PA-18.5 | 409 conflicto | Duplicado feedback, plan finalizado o edicion manual sin confirmar. | Mensaje explica accion requerida. |
| PA-18.6 | 502/503 IA | Si Groq JSON invalido, timeout o quota. | Mensaje claro; no persistir plan corrupto; boton permite reintentar. |
| PA-18.7 | Network slow | Observar loading en requests largas. | UI debe comunicar progreso y bloquear doble accion. |

### PA-19 - RBAC, Acciones Y Multi-Tenant

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-19.1 | NUT genera propio | NUT dueño genera para socio con vinculo. | Debe poder completar flujo. Si recibe 403 por accion, error funcional. |
| PA-19.2 | NUT genera ajeno | NUT de Gym Norte intenta generar para socio Gym Central. | Debe bloquear. Si genera, error critico de seguridad. |
| PA-19.3 | NUT lista versiones propias | NUT dueño abre historial. | Debe obtener versiones. Si recibe 403 por clave de accion mal configurada, error funcional. |
| PA-19.4 | NUT feedback propio | NUT dueño vota version propia. | Debe permitir. 403 por permiso mal configurado es error funcional. |
| PA-19.5 | NUT activa propio | NUT dueño activa version propia verde. | Debe permitir. 403 por permiso mal configurado es error funcional. |
| PA-19.6 | Recepcionista bloqueado | RECEPCIONISTA intenta endpoints/pantallas clinicas. | Debe bloquear. |
| PA-19.7 | Socio propio | SOCIO consulta su propio plan activo. | Debe permitir read-only. |
| PA-19.8 | Socio ajeno | SOCIO intenta abrir plan de otro socio. | Debe bloquear sin filtrar datos. |

### PA-20 - Regresiones Historicas Obligatorias

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-20.1 | IA no genera 2/7 dias | Generar 7 dias default. | No debe aceptar como exito un plan de 2 dias. Debe tener 7 dias o fallar con error claro. |
| PA-20.2 | `PLAN_ESTRUCTURA_INVALIDA` | Generar default. | No debe fallar por estructura si la IA devuelve estructura valida. Si falla, registrar request/response. |
| PA-20.3 | Ficha salud ausente | Paciente sin ficha. | Debe ser estado funcional manejado, no 404 fatal. |
| PA-20.4 | Duplicados modal | Abrir crear plan. | No duplicar mismo `socioId`; nombres iguales deben distinguirse. |
| PA-20.5 | Boton finalizar | Revisar vista profesional. | Si esta deshabilitado, debe explicar por que. Si existe feature de finalizar, debe funcionar. |
| PA-20.6 | FoodSearchDialog legacy | Si se abre busqueda de alimentos manual. | No debe crashear con `alimentos.map is not a function`. |
| PA-20.7 | Ideas comida legacy | Si existe panel de ideas. | Debe mostrar exactamente las ideas recibidas o error claro; no modal vacio con response 201. |
| PA-20.8 | Endpoint IA estado | Si UI consulta estado IA. | No debe llamar endpoint inexistente `/ia/estado` sin manejarlo. |

### PA-21 - Calidad Visual, Responsive Y Accesibilidad

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| PA-21.1 | Desktop 1440px | Probar `/planes`, editor y `/mi-plan`. | Layout ordenado, sin solapamientos, headers/cards legibles. |
| PA-21.2 | Mobile 390px | Repetir flujos principales. | Controles accesibles, no overflow horizontal roto, dialogs usable. |
| PA-21.3 | Teclado | Navegar formulario y modals con Tab/Escape/Enter. | Focus visible, dialogs atrapan foco, Escape/cancel funciona. |
| PA-21.4 | Labels | Inputs del generador. | Labels asociados y errores legibles por rol/alert. |
| PA-21.5 | Toasts | Generacion/regeneracion/feedback/errores. | Toasts no tapan CTA criticos y tienen texto accionable. |
| PA-21.6 | Consola | Durante flujos. | No debe haber errores JS no controlados. |

### PA-22 - Contratos De Red A Verificar

| ID | Request | Actor | Esperado |
| --- | --- | --- | --- |
| PA-22.1 | `GET /planes-alimentacion/nutricionista/:personaId` | NUT | 200 con array de planes propios. |
| PA-22.2 | `GET /turnos/profesional/:personaId/pacientes` | NUT | 200 con pacientes del profesional. |
| PA-22.3 | `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud` | NUT dueño | 200 con ficha o `null` manejado si no existe. |
| PA-22.4 | `POST /ia/plan-semanal` | NUT dueño | 201/200 con `planAlimentacionId`, `versionId`, `numeroVersion`, `plan`, `validacion`, `macros`, `advertencias`. |
| PA-22.5 | `POST /ia/plan-semanal/regenerar` | NUT dueño | 201/200 con `nuevaVersionId`, `numeroVersion`, `motivoCambio`, `cambios`, `plan`, `validacion`, `macros`. |
| PA-22.6 | `GET /planes-alimentacion/:id/versiones` | NUT dueño | 200 con versiones. |
| PA-22.7 | `GET /planes-alimentacion/version/:versionId` | NUT dueño/SOCIO si activa | 200 solo si tiene permiso. SOCIO solo version activa propia. |
| PA-22.8 | `POST /planes-alimentacion/version/:versionId/feedback` | NUT dueño | 201/200 o 409 si ya existe. |
| PA-22.9 | `PUT /planes-alimentacion/version/:versionId/feedback` | NUT dueño | 200 si existe feedback. |
| PA-22.10 | `POST /planes-alimentacion/:id/activar` | NUT dueño | 201/200 con `estado=ACTIVO` si version es activable. |
| PA-22.11 | `POST /planes-alimentacion/:id/finalizar` | NUT dueño | 201/200 con `estado=FINALIZADO`. |
| PA-22.12 | `GET /planes-alimentacion/socio/:socioId/activo` | SOCIO propio/NUT vinculado | 200 con array, vacio si no hay activos. |

## Variantes De Datos Que Deben Cubrirse

| Dimension | Valores/casos |
| --- | --- |
| Dias | 1, 7 default, 14 maximo. |
| Comidas por dia | 1, 4 default, 5 maximo. |
| Alternativas | 1, 3 default, 5 maximo. |
| Notas | vacias, normales con timestamp, 1000 chars, mayor a 1000 chars. |
| Fecha inicio | default lunes, fecha futura valida, valor invalido si UI lo permite. |
| Restricciones | sin restricciones, vegano/vegetariano si existe, celiaco, diabetico, multi-restriccion, alergias. |
| Macros | verde, amarillo, rojo si se pueden observar sin mocks. |
| Estados | sin plan, borrador, activo, finalizado. |
| Versiones | v1, v2 por plan, v2 por dia, v2 por alternativa, version activa vs no activa. |
| Roles | NUT dueño, NUT ajeno, SOCIO propio, SOCIO ajeno, ADMIN, RECEPCIONISTA. |
| Viewports | desktop y mobile. |

## Selectores Y Textos Utiles

Estos selectores/textos pueden cambiar, pero si existen deben usarse para mejorar estabilidad.

| Selector/texto | Uso |
| --- | --- |
| `plan-editor-layout` | Layout principal del editor. |
| `restricciones-editables-card` | Card de ficha/restricciones editables. |
| `boton-editar-ficha`, `boton-cancelar-edicion`, `boton-guardar-ficha` | Edicion de ficha. |
| `dias-a-generar-input` | Input dias. |
| `comidas-por-dia-select` | Select comidas por dia. |
| `alternativas-por-comida-input` | Input alternativas. |
| `fecha-inicio-input` | Fecha inicio. |
| `notas-generacion-textarea` | Notas de generacion. |
| `reset-form-button` | Reset del formulario. |
| `generar-plan-button` | Submit generacion. |
| `plan-generado-card` | Contenedor resultado IA. |
| `weekly-plan-grid-v2` | Grilla IA. |
| `macros-badge` y `data-banda` | Bandas de macros. |
| `dia-header-LUNES` | Header de dia. |
| `slot-LUNES-DESAYUNO` | Slot de comida. |
| `alt-tab-0` | Alternativa. |
| `regen-plan-button`, `regen-dia-LUNES`, `regen-alt-0` | Regeneracion. |
| `confirm-regen-perder-cambios` | Confirmacion de perdida de cambios. |
| `version-item` | Item de historial. |
| `feedback-floating-button`, `feedback-positivo`, `feedback-negativo` | Feedback. |
| `mi-plan-hero`, `mi-plan-loading`, `mi-plan-error` | Vista socio. |
| `empty-state-plan-en-preparacion` | Empty state socio. |
| `plan-socio-card` | Card del plan del socio. |
| `boton-descargar-pdf` | Exportacion PDF. |

## Criterios De Falla Critica

Si ocurre cualquiera de estos puntos, el modulo no puede considerarse validado.

- El NUT dueño no puede generar un plan real por permisos, estructura invalida o persistencia rota.
- La UI muestra exito pero el plan no se persiste ni aparece en historial.
- Se acepta como valido un plan incompleto para la cantidad de dias/comidas/alternativas solicitadas.
- El socio ve planes borrador/no activados.
- El socio puede editar, regenerar, votar o activar.
- Un NUT ajeno o de otro tenant ve/modifica planes de otro profesional/gimnasio.
- Recepcionista accede a contenido clinico de planes.
- Activacion permite macros amarillo/rojo sin advertencia/bloqueo.
- Versionado no crea nuevas versiones o activa mas de una version a la vez.
- Regeneracion de dia/alternativa modifica partes no solicitadas sin avisar.
- Dashboard socio navega a `/planes` en lugar de `/mi-plan`.
- Hay errores JS no controlados durante flujos principales.

## Priorizacion De Ejecucion

Si el tiempo es limitado, ejecutar en este orden. Los casos P0 son obligatorios para declarar cualquier avance.

| Prioridad | Casos |
| --- | --- |
| P0 | PA-00, PA-01, PA-04, PA-05, PA-06, PA-07, PA-09, PA-13, PA-14, PA-19, PA-20. |
| P1 | PA-02, PA-03, PA-08, PA-10, PA-12, PA-15, PA-18, PA-22. |
| P2 | PA-11, PA-16, PA-17, PA-21 y todas las variantes de datos dificiles de preparar. |

## Notas Para La Sesion Verificadora

- Esta spec describe el comportamiento esperado, aunque el sistema actual pueda no cumplirlo. Si algo falla, no lo arregles en la verificacion: documentalo con evidencia.
- Cuando una pantalla no tenga UI para una accion documentada, validar por API autenticada solo como complemento y registrar la ausencia de UI si afecta al usuario.
- Si un caso requiere datos que no existen en seed, marcar `BLOQUEADO por datos`, explicar que dato falta y no inventar IDs.
- Si la API de IA queda bloqueada por cuota Groq, registrar `BLOQUEADO por proveedor externo` y verificar que el sistema falle de forma segura.
- La validacion visual debe incluir al menos una captura desktop y una mobile del editor o de `/mi-plan`.
