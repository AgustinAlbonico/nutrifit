# Recordatorios automáticos

> **Source of truth**: `01-iteracion-base-nutricional.md` §8.5, RB60
> **Stack**: MySQL 8.0+ (sin `AT TIME ZONE`, usar conversiones en app)
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `notificaciones.md`, `turnos/*`, `multi-tenant.md`

## Descripción
Job scheduler que envía recordatorios automáticos **24 horas antes** y **1 hora antes** del turno **solo al socio** (no al nutricionista, decisión de Q&A). Corre cada 5 minutos con ventana de tolerancia de ±5 min. Idempotente. Timezone del gimnasio respetada. Lock distribuido para HA.

## Actores
- SISTEMA (BullMQ repeatable job)

## Funcionalidad

### Job: recordatorio 24h
- Cron: cada 5 minutos.
- Ventana: turnos con `fecha_hora` entre `now() + 23h 55min` y `now() + 24h 05min` (en la TZ del gimnasio).
- Estado del turno: `CONFIRMADO`.
- Flag de control: `recordatorio_24h_enviado_at IS NULL`.
- Para cada turno: envía email `RECORDATORIO_TURNO_24H` al socio, marca `recordatorio_24h_enviado_at=now()`.

### Job: recordatorio 1h
- Cron: cada 5 minutos.
- Ventana: turnos con `fecha_hora` entre `now() + 55min` y `now() + 1h 05min`.
- Mismo patrón.

## Reglas de negocio aplicadas
- **RB60**: Recordatorios 24h+1h solo al socio.
- **RB35**: Fallback de email no aborta.

## Configuración (env vars)

- `RECORDATORIO_INTERVALO_MINUTOS=5`
- `RECORDATORIO_HABILITADO=true|false` (kill switch)
- `REDIS_URL` (para BullMQ lock distribuido)
- TZ: se obtiene de `ConfiguracionGimnasio.zona_horaria` por gimnasio.

## Modelo de datos

### Entidad `Turno` (campos nuevos)
- `recordatorio_24h_enviado_at: DATETIME NULL`
- `recordatorio_1h_enviado_at: DATETIME NULL`

### Constraints
- Ninguna (los flags son nullable y se setean por separado).

## Implementación

### Job BullMQ

```typescript
@Cron(CronExpression.EVERY_5_MINUTES)
async enviarRecordatorios() {
  if (!this.configService.get('RECORDATORIO_HABILITADO')) return;

  // Lock distribuido para evitar doble ejecución en HA
  const lock = await this.redis.set('lock:recordatorios', '1', 'NX', 'EX', 280);
  if (!lock) return;

  try {
    await this.enviarRecordatorios24h();
    await this.enviarRecordatorios1h();
  } finally {
    await this.redis.del('lock:recordatorios');
  }
}

private async enviarRecordatorios24h() {
  const gimnasios = await this.gimnasioRepo.findAll();
  for (const gimnasio of gimnasios) {
    const tz = gimnasio.zonaHoraria || 'UTC';
    const ahora = moment().tz(tz);
    const desde = ahora.clone().add(23, 'hours').add(55, 'minutes');
    const hasta = ahora.clone().add(24, 'hours').add(5, 'minutes');

    // Convertir a UTC para la query (almacenamos todo en UTC)
    const desdeUtc = desde.utc().toDate();
    const hastaUtc = hasta.utc().toDate();

    const turnos = await this.turnoRepo.createQueryBuilder('t')
      .where('t.estado = :estado', { estado: 'CONFIRMADO' })
      .andWhere('t.fecha_hora BETWEEN :desde AND :hasta', { desde: desdeUtc, hasta: hastaUtc })
      .andWhere('t.recordatorio_24h_enviado_at IS NULL')
      .andWhere('t.nutricionista_gimnasio_id IN (SELECT id FROM nutricionista_gimnasio WHERE gimnasio_id = :gimnasioId)', { gimnasioId: gimnasio.id })
      .getMany();

    for (const turno of turnos) {
      try {
        await this.notificacionesService.enviar('RECORDATORIO_TURNO_24H', {
          destinatario: turno.socio.email,
          variables: {
            nombreSocio: turno.socio.nombre,
            nombreNutri: turno.nutricionista.nombre,
            fechaHora: moment(turno.fechaHora).tz(tz).format('DD/MM/YYYY HH:mm'),
            linkReserva: `${this.configService.get('APP_URL')}/turnos/${turno.id}`,
          },
        });
        turno.recordatorio24hEnviadoAt = new Date();
        await this.turnoRepo.save(turno);
        this.logger.log(`Recordatorio 24h enviado a turno ${turno.id}`);
      } catch (err) {
        this.logger.error(`Error enviando recordatorio 24h a turno ${turno.id}`, err);
        // Continuar con el siguiente (RB35: fallo de email no aborta el job)
      }
    }
  }
}
```

### Timezone handling
- Todos los timestamps en DB se almacenan en **UTC**.
- La conversión a la TZ del gimnasio se hace en la app (en `moment` o `date-fns-tz`).
- Query: convierte la ventana de tiempo a UTC antes de consultar.
- Renderizado en email: convierte UTC a la TZ del gimnasio para mostrar "Mañana 14:00" en el texto.

### Configuración por gimnasio
- `ConfiguracionGimnasio.zona_horaria` (default: 'America/Argentina/Buenos_Aires').
- Si el gimnasio no tiene zona configurada, usa la del sistema (o UTC como fallback).

## Edge cases

- **B1**: Turno creado dentro de la ventana de 24h (reserva tardía) → no se envía recordatorio 24h (no aplica). Sí se envía el de 1h si está dentro de la ventana.
- **B2**: Turno cancelado antes del recordatorio → el job usa `WHERE estado='CONFIRMADO'`, no se envía.
- **B3**: Turno reprogramado → el flag de recordatorio **se resetea** (decisión sincronizada con `14-reprogramar-turno.md`):
  - `recordatorio_24h_enviado_at = NULL`.
  - `recordatorio_1h_enviado_at = NULL`.
  - **Razón**: la nueva fecha/hora puede caer en otra ventana, y el socio debe recibir recordatorio para la nueva fecha.
  - **Caso especial**: si la nueva fecha/hora está dentro de 24h, solo se envía el de 1h. Si está dentro de 1h, no se envía ningún recordatorio (muy tarde).
- **B4**: Job se atrasa > 5 min → ventana de tolerancia absorbe la mayoría. Si el atraso es mucho mayor, se pierden algunos turnos (aceptable).
- **B5**: Múltiples instancias del job → `Redis SETNX` con expiración 280s (4min 40s, menor que el intervalo 5min) evita doble ejecución.
- **B6**: Gimnasio con TZ distinta a la del servidor → la app convierte correctamente.
- **B7**: Turno del nutricionista inactivo (desactivado) → `WHERE estado='CONFIRMADO'` y la asociación `NutricionistaGimnasio` puede estar inactiva. **Decisión**: aún así se envía el recordatorio al socio (porque el turno sigue CONFIRMADO y puede que esté en una asociación distinta). El sistema NO filtra por estado del nutricionista.

## Reglas de negocio aplicadas
- **RB60**: Recordatorios 24h+1h solo al socio.

## Endpoints API

### `GET /api/admin/recordatorios/stats`
- **Auth**: ADMIN
- **Response 200**:
  ```json
  {
    "ultimaEjecucion24h": "2026-06-02T14:30:00.000Z",
    "ultimaEjecucion1h": "2026-06-02T14:30:00.000Z",
    "enviados24hHoy": 45,
    "enviados1hHoy": 12,
    "fallidosHoy": 0
  }
  ```

### `POST /api/admin/recordatorios/reenviar`
- **Auth**: ADMIN
- **Body**: `{ turnoId, tipo: '24h'|'1h' }`
- **Response 200**: `{ ok: true }`.
- **Side effect**: resetea el flag y reencola el envío.
- **Errors**: 404, 500

## Eventos disparados
- `RECORDATORIO_TURNO_24H` → email al socio.
- `RECORDATORIO_TURNO_1H` → email al socio.

## Auditoría
- `RECORDATORIO_ENVIADO` cuando se envía correctamente.
- `RECORDATORIO_FALLIDO` cuando falla (con error en `motivo`).

## Tests

### Unitarios
- Lógica de selección de turnos (mockear `now()` y `fecha_hora`).
- Conversión de TZ correcta (mockear `gimnasio.zona_horaria='America/Los_Angeles'`).
- Idempotencia: ejecutar dos veces, la segunda no envía.
- Reprogramación resetea flags.

### Integración
- Test de job: insertar turnos en distintos estados, ejecutar el job, verificar cambios.

## Notas
- La cancelación de un recordatorio se logra cambiando el estado del turno a CANCELADO (no se envía).
- El nutricionista NO recibe recordatorios (decisión de Q&A, RB60). En iter 2+ se puede agregar.
- Si la cancelación/reprogramación ocurre muy cerca del horario, el recordatorio puede llegar igual (no hay manera de cancelarlo en tránsito). Esto es aceptable.
- **El lock distribuido es crítico** para HA. Si Redis no está disponible, el job NO se ejecuta (fail closed).
- La TZ se determina por gimnasio, NO por socio. Si un gimnasio tiene múltiples gimnasios con TZs distintas, cada uno tiene su cálculo independiente.
