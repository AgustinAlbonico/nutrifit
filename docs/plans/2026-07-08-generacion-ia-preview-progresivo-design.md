# Generación IA con preview progresivo

NutriFit va a mantener la generación de planes con IA como un job persistido con polling, pero va a mostrar resultados parciales comida por comida mientras el backend sigue trabajando. El plan oficial se guarda recién cuando la generación completa termina, se valida y se persiste como versión final.

## Decisión principal

Implementar un preview progresivo de solo lectura sobre `generacion_plan_ia`, usando progreso persistido y un snapshot parcial del plan. No se introduce WebSocket/SSE, no se cambia a una cola formal y no se permite editar comidas generadas hasta que el job termine.

| Tema | Decisión |
|------|----------|
| Comunicación UI | Mantener React Query polling. |
| Persistencia parcial | Guardar progreso y snapshot parcial en `generacion_plan_ia`. |
| Render frontend | Mostrar comidas completadas y placeholders para pendientes. |
| Edición | Seguir bloqueada mientras el job esté activo. |
| Plan oficial | Persistir `plan_alimentacion` y `plan_alimentacion_version` solo al completar. |
| Transporte excluido | No usar SSE/WebSocket en esta iteración. |
| Cola excluida | No introducir Bull/BullMQ ni worker externo en esta iteración. |

## Alcance funcional

### Lo que pidió Agustín

- Revisar por qué la generación del plan de alimentación con IA se siente lenta y bloqueante.
- Evitar que el usuario tenga que esperar a que el plan completo termine para ver algo útil.
- Evaluar si el plan puede completarse comida por comida.
- Buscar un approach no bloqueante.

### Lo que debe verse

- Al iniciar la generación, el pedido responde rápido como hoy con el job en background.
- El editor muestra el estado de generación sin bloquear la navegación.
- La grilla empieza vacía o con placeholders y se va completando con comidas generadas.
- Cada comida generada aparece como preview de solo lectura.
- Las comidas pendientes muestran un estado de carga claro.
- El badge de generación muestra progreso, por ejemplo `12/28 comidas generadas`.
- Al completar, el preview se reemplaza por el plan oficial persistido.
- Si falla, el sistema informa el error y deja claro que el preview no fue publicado como plan oficial.
- Si se cancela, se descarta el preview como resultado oficial.

## Por qué este enfoque

El backend ya tiene dos piezas importantes: un job persistido (`generacion_plan_ia`) y generación interna por comida en `GenerarPlanSemanalUseCase`. El problema no es que falte asincronía: el problema es que los resultados por comida quedan en memoria hasta terminar todo el plan.

El cambio correcto es publicar ese avance en el job persistido. Así el frontend puede seguir usando el polling existente y renderizar el progreso sin sumar infraestructura nueva.

## Alternativas descartadas

### Solo progreso textual

Mostrar `Generando martes/almuerzo 8 de 28` sería barato, pero no resuelve el dolor principal: Agustín seguiría sin ver el contenido del plan hasta el final.

### Persistencia editable comida por comida

Guardar cada comida directamente en el plan real permitiría edición inmediata, pero mete complejidad innecesaria en esta iteración:

- conflictos con autosave manual;
- versiones incompletas;
- cancelación con datos parcialmente publicados;
- validación nutricional sobre estructuras incompletas;
- resolución de alimentos nuevos antes de tener el plan completo;
- conflictos entre edición humana y slots que la IA todavía no terminó.

Esa opción puede evaluarse más adelante si el preview no alcanza.

## Arquitectura backend

### Estado de generación

Extender `generacion_plan_ia` con campos de progreso y preview parcial.

Campos propuestos:

- `progresoActual`: cantidad de comidas generadas correctamente.
- `progresoTotal`: cantidad total de comidas esperadas.
- `diaActual`: día que se está procesando o último día completado.
- `comidaActual`: tipo de comida que se está procesando o último tipo completado.
- `snapshotParcialJson`: estructura parcial compatible con el editor del plan.

La entidad de dominio, la entidad TypeORM y el repositorio deben exponer estos campos sin cambiar la semántica de estados actual: `PENDIENTE`, `GENERANDO`, `COMPLETADO`, `ERROR`, `CANCELADO`.

### Generación por comida

`generarPlanPorDiasConReintentos` ya arma tareas por `dia` y `tipoComida` y las ejecuta con concurrencia. Ese punto debe emitir progreso después de cada comida generada o después de cada batch completado.

Contrato propuesto para el callback:

```ts
interface ProgresoGeneracionPlanIa {
  dia: string;
  tipoComida: string;
  comidasGeneradas: number;
  comidasTotales: number;
  estructuraParcial: unknown;
}
```

El callback no decide persistencia final. Solo informa avance al worker background.

### Worker background

`EjecutarGeneracionPlanSemanalBackgroundService` pasa a ejecutar el use case con un callback de progreso. En cada actualización:

1. verifica que la generación siga activa;
2. actualiza progreso, mensaje y snapshot parcial;
3. mantiene el estado en `GENERANDO`;
4. no crea ni modifica el plan oficial.

Al final, conserva el comportamiento actual: persistir plan/version mediante el use case, guardar `respuestaJson`, marcar `COMPLETADO` y desbloquear el editor.

### Cancelación y errores

- Si Agustín cancela, el worker no debe publicar el preview como plan oficial.
- Si el proveedor falla después de varias comidas, el job queda en `ERROR` con `snapshotParcialJson` disponible para diagnóstico visual, pero no como plan publicado.
- Si una actualización parcial falla por un error transitorio de base de datos, el worker puede continuar con la generación; lo crítico es no perder la finalización correcta.

## Arquitectura frontend

### Tipos y hook IA

Actualizar los tipos de generación para incluir progreso y snapshot parcial. `useGeneracionPlanIa` y `useGeneracionPlanIaActiva` siguen usando polling; solo consumen más datos del mismo recurso.

Campos esperados en frontend:

- `progresoActual`;
- `progresoTotal`;
- `diaActual`;
- `comidaActual`;
- `snapshotParcialJson`.

### PlanEditorPage

Mientras `planBloqueadoPorIa` sea true y exista `snapshotParcialJson`, el editor debe renderizar un modo preview:

- comidas generadas como cards de solo lectura;
- comidas pendientes como skeleton/placeholders;
- acciones de edición y guardado deshabilitadas como hoy;
- aviso claro de que el plan todavía no está publicado.

Cuando el job pasa a `COMPLETADO`, se usa `respuestaJson` como fuente final y se hidrata el editor igual que ahora.

### Badge de generación

`BadgeGeneracionPlanIa` debe mostrar progreso real cuando exista:

```txt
Generando plan con IA
12/28 comidas generadas
Actual: jueves - merienda
```

Si no hay progreso todavía, mantiene el mensaje actual.

## Contrato de aceptación

- El `POST /ia/plan-semanal/generaciones` responde sin esperar el plan completo.
- El job sigue siendo consultable por ID y por generación activa.
- El frontend ve progreso sin WebSocket/SSE.
- La grilla muestra comidas parciales durante `GENERANDO`.
- El usuario no puede editar el plan mientras la generación está activa.
- El plan oficial solo se guarda cuando la generación completa termina y valida correctamente.
- Cancelar descarta el preview como resultado oficial.
- Un error no deja una versión parcial publicada.

## Verificación visual con Playwright

Ruta principal:

```txt
/profesional/plan/$socioId/editar
```

Estados a verificar:

- generación recién iniciada, sin comidas todavía;
- generación activa con algunas comidas en `snapshotParcialJson`;
- generación completada con `respuestaJson` final;
- generación cancelada;
- generación en error.

Contrato visual:

- el badge muestra progreso cuando existe;
- los slots generados se distinguen de los pendientes;
- los slots pendientes no parecen editables;
- los botones de edición/guardado siguen bloqueados;
- al completar, desaparece el modo preview y queda el plan oficial.

## Fuera de alcance

- Edición de comidas mientras la IA sigue generando.
- Guardar versiones incompletas.
- Reemplazar polling por SSE/WebSocket.
- Introducir Bull/BullMQ o un worker externo.
- Cambiar prompts, macros objetivo o reglas nutricionales.
- Escribir tests automáticos sin pedido explícito de Agustín.

## Riesgos

- El polling puede mostrar avances por batch, no necesariamente en tiempo real por cada request del proveedor.
- El snapshot parcial debe mantenerse chico y compatible con el editor para no duplicar modelos innecesarios.
- La concurrencia actual genera varias comidas en paralelo; el orden visual debe derivarse de día/tipo de comida, no del orden en que terminan las promesas.
- Si el proceso NestJS se cae, el reaper actual debe seguir siendo la defensa contra generaciones activas viejas.

## Próximo paso

Crear el plan de implementación en `docs/superpowers/plans/2026-07-08-generacion-ia-preview-progresivo.md`.
