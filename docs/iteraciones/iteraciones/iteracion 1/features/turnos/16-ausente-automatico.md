# 16 — Marcar ausente automáticamente

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-16
> **Stack**: MySQL 8.0+ (sin `AT TIME ZONE` PostgreSQL)
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `15-check-in.md`, `notificaciones.md`, `multi-tenant.md`

## Descripción
Job scheduler que marca automáticamente como AUSENTE los turnos en estado CONFIRMADO que pasaron **30 minutos** desde su horario programado sin que el socio haya hecho check-in (RB11). Corre cada 5 minutos, idempotente, con lock distribuido para HA. Timezone del gimnasio respetada.

## Actores
- SISTEMA (BullMQ repeatable job)

## Precondiciones
- Job activo.
- Hay turnos en estado CONFIRMADO en el sistema.

## Postcondiciones
- Turnos con `fecha_hora + 30min < now()` (en TZ del gimnasio) y sin `presente_at` → estado AUSENTE.
- `ausente_at=now()`.
- Notificaciones al socio y nutricionista (ver `notificaciones.md`).
- Auditoría `AUTO_ABSENT`.

## Camino principal
1. Job se ejecuta cada 5 minutos.
2. Lock distribuido Redis para evitar doble ejecución en HA.
3. Para cada gimnasio activo:
   - Calcula la ventana: `fecha_hora` entre `now() - 30min - 5min` y `now() - 30min + 5min` (en TZ del gimnasio, convertido a UTC para la query).
   - Query:
     ```sql
     SELECT t.* FROM turno t
     INNER JOIN nutricionista_gimnasio ng ON ng.id = t.nutricionista_gimnasio_id
     WHERE ng.gimnasio_id = :gimnasioId
     AND t.estado = 'CONFIRMADO'
     AND t.presente_at IS NULL
     AND t.fecha_hora BETWEEN :desde AND :hasta
     FOR UPDATE SKIP LOCKED
     ```
   - Para cada turno encontrado: actualiza `estado='AUSENTE'`, `ausente_at=now()`, registra auditoría, encola notificaciones.
4. Commit.

## Caminos alternativos
- **A1**: Turno ya AUSENTE → excluido por `WHERE estado='CONFIRMADO'`.
- **A2**: Turno ya CANCELADO → excluido.
- **A3**: Turno ya PRESENTE → excluido por `presente_at IS NULL`.
- **A4**: Turno reprogramado a futuro después del horario original → si la nueva `fecha_hora` está en el futuro, no se toca. Si la nueva fecha quedó en el pasado, se marca AUSENTE.

## Casos borde
- **B1**: Job se atrasa > 5 min → ventana de tolerancia absorbe la mayoría. Si el atraso es mucho mayor, se pierden algunos turnos (aceptable).
- **B2**: Zona horaria del gimnasio vs servidor → la app convierte la ventana a UTC usando `ConfiguracionGimnasio.zona_horaria`.
- **B3**: Turno reprogramado minutos antes del control → usa la `fecha_hora` post-reprogramación (RB10 + A4).
- **B4**: Múltiples instancias del job (HA) → `Redis SETNX` evita doble procesamiento.
- **B5**: Job falla a mitad (error de DB) → la transacción hace rollback, no se marca ningún turno parcialmente. El job lo intenta de nuevo en la próxima ejecución.
- **B6**: Nutricionista desactivado pero turno aún CONFIRMADO → el job marca AUSENTE igual (decisión: no filtra por estado del nutricionista). El admin puede revertir manualmente.

## Reglas de negocio aplicadas
- **RB11**: 30 minutos desde el horario del turno sin check-in → AUSENTE.
- **RB33**: Auditoría.
- **RB35**: Fallo de notificación no aborta.

## Configuración (env vars)

- `AUSENTE_AUTO_INTERVALO_MINUTOS=5` (default)
- `AUSENTE_AUTO_HABILITADO=true|false` (kill switch)
- `REDIS_URL` (para lock distribuido)
- TZ: por gimnasio via `ConfiguracionGimnasio.zona_horaria`.

## Modelo de datos

### Entidad `Turno` (campo ya existe)
- `ausente_at: DATETIME NULL`
- `estado` cambia a `AUSENTE` cuando se ejecuta el job.

### Constraints
- Ninguna nueva.

## Implementación

### Job BullMQ

```typescript
@Cron(CronExpression.EVERY_5_MINUTES)
async marcarAusentes() {
  if (!this.configService.get('AUSENTE_AUTO_HABILITADO')) return;

  // Lock distribuido para evitar doble ejecución en HA
  const lock = await this.redis.set('lock:ausentes', '1', 'NX', 'EX', 280);
  if (!lock) return;

  try {
    await this.procesarAusentes();
  } finally {
    await this.redis.del('lock:ausentes');
  }
}

private async procesarAusentes() {
  const gimnasios = await this.gimnasioRepo.findAll({ activo: true });

  for (const gimnasio of gimnasios) {
    const tz = gimnasio.zonaHoraria || 'UTC';
    const ahora = moment().tz(tz);
    // Ventana: 25 a 35 minutos atrás (tolerancia de ±5min)
    const desde = ahora.clone().subtract(35, 'minutes').utc().toDate();
    const hasta = ahora.clone().subtract(25, 'minutes').utc().toDate();

    // Query con lock pesimista y skip locked para HA
    const connection = this.dataSource.manager.queryRunner;
    await connection.startTransaction('READ COMMITTED');
    try {
      const turnos = await connection.manager.find(Turno, {
        where: {
          estado: 'CONFIRMADO',
          presenteAt: IsNull(),
          fechaHora: Between(desde, hasta),
        },
        relations: ['nutricionistaGimnasio', 'socio', 'nutricionistaGimnasio.nutricionista'],
        lock: { mode: 'pessimistic_write', tables: ['turno'] },
      });

      for (const turno of turnos) {
        if (turno.nutricionistaGimnasio.gimnasioId !== gimnasio.id) continue;

        turno.estado = 'AUSENTE';
        turno.ausenteAt = new Date();
        await connection.manager.save(Turno, turno);

        // Auditoría
        await this.auditoriaService.registrar({
          usuarioId: null,
          gimnasioId: gimnasio.id,
          accion: 'AUTO_ABSENT',
          entidad: 'turno',
          entidadId: turno.id,
          antesJson: { estado: 'CONFIRMADO', fechaHora: turno.fechaHora },
          despuesJson: { estado: 'AUSENTE', ausenteAt: turno.ausenteAt },
          motivo: 'Ausente automático: 30 min sin check-in',
        });

        // Notificaciones (try/catch por separado, RB35)
        try {
          await this.notificacionesService.enviar('TURNO_AUSENTE_AUTO', {
            destinatario: turno.socio.email,
            variables: {
              nombreSocio: turno.socio.nombre,
              fechaHora: moment(turno.fechaHora).tz(tz).format('DD/MM/YYYY HH:mm'),
            },
          });
        } catch (err) {
          this.logger.error(`Error enviando notificación de ausente a turno ${turno.id}`, err);
          // Continuar
        }

        try {
          await this.notificacionesService.enviar('TURNO_AUSENTE_AUTO', {
            destinatario: turno.nutricionistaGimnasio.nutricionista.email,
            variables: {
              nombreNutri: turno.nutricionistaGimnasio.nutricionista.nombre,
              nombreSocio: turno.socio.nombre,
              fechaHora: moment(turno.fechaHora).tz(tz).format('DD/MM/YYYY HH:mm'),
            },
          });
        } catch (err) {
          this.logger.error(`Error enviando notificación al nutri`, err);
        }
      }

      await connection.commitTransaction();
    } catch (err) {
      await connection.rollbackTransaction();
      this.logger.error('Error procesando ausentes', err);
      throw err;
    } finally {
      await connection.release();
    }
  }
}
```

### Timezone handling
- Todos los timestamps en DB: **UTC**.
- Cálculo de ventana: en TZ del gimnasio, convertido a UTC antes de la query.
- Conversión con `moment-timezone` o `date-fns-tz`.

### Lock distribuido
- Redis `SET key value NX EX 280` (expiración 280s, menor que el intervalo 5min/300s).
- Si Redis no está disponible: el job NO se ejecuta (fail closed).

## Endpoints API

### `GET /api/admin/ausente-auto/stats`
- **Auth**: ADMIN
- **Response 200**:
  ```json
  {
    "ultimaEjecucion": "2026-06-02T14:30:00.000Z",
    "marcadosHoy": 5,
    "erroresHoy": 0
  }
  ```

### `POST /api/admin/ausente-auto/ejecutar-ahora`
- **Auth**: ADMIN
- **Body**: vacío
- **Response 200**: `{ ok: true, marcados: 5 }`
- **Side effect**: ejecuta el job manualmente (útil para testing o emergencia).
- **Errors**: 500

## Eventos disparados
- `TURNO_AUSENTE_AUTO` → email al socio.
- `TURNO_AUSENTE_AUTO` → email al nutricionista.

## Auditoría
- `AUTO_ABSENT` con `usuario_id=NULL` (es el sistema), `motivo='Ausente automático: 30 min sin check-in'`, antes/después.

## Tests

### Unitarios
- Lógica de selección: mockear `now()` y `fecha_hora`, verificar qué turnos se eligen.
- Conversión de TZ: mockear gimnasio con `zona_horaria='America/Los_Angeles'`.
- Idempotencia: ejecutar dos veces, la segunda no procesa nada.
- HA: dos instancias ejecutan, solo una adquiere el lock.

### Integración
- Test de job: insertar turnos en distintos estados, ejecutar el job, verificar cambios.
- Test de lock: simular dos ejecuciones concurrentes, verificar que solo una marca turnos.

## Notas
- El job es **crítico** para la operativa. Si falla, los turnos quedan en CONFIRMADO para siempre.
- El umbral de 30 min es configurable por env var, no por gimnasio en iter 1.
- El nutricionista puede **marcar ausente manualmente** también (ver `agenda/17-ver-agenda-dia.md` §B5 y endpoint `POST /api/turnos/:id/marcar-ausente-manual`).
- **Lock distribuido es crítico** para HA. Sin Redis, el job no corre.
- La TZ se determina por gimnasio, NO por socio. Cada gimnasio tiene su cálculo independiente.
