# Notificaciones

> **Source of truth**: `01-iteracion-base-nutricional.md` §8, RB35, RB59
> **Estado**: Por implementar
> **Prioridad**: Crítica
> **Dependencias**: `auth.md`, `auditoria.md`, `multi-tenant.md`, `recordatorios.md`, `archivos.md`

## Descripción
Sistema de notificaciones transaccionales por **email únicamente** (RB59). Sin canal in-app, sin push, sin preferencias por usuario. Catálogo de eventos sincronizado con `auditoria.md`. Fallback con reintento exponencial (RB35). Timezone del gimnasio respetada.

## Actores
- SISTEMA (envío automático desde use-cases)
- ADMIN (visualización de log, reenvío manual)

## Catálogo de eventos (sincronizado con `auditoria.md`)

| Evento | Destinatarios | Canal email | Plantilla | Momento | Cuándo se dispara |
|---|---|---|---|---|---|
| `NUTRICIONISTA_CREADO` | Nutricionista, Admin | ✅ | `nutricionista-creado` | Inmediato | `01-registrar-nutricionista.md` §C8 |
| `NUTRICIONISTA_ACTUALIZADO` | Nutricionista, Admin | ✅ | `nutricionista-actualizado` | Inmediato | `02-editar-nutricionista.md` |
| `NUTRICIONISTA_DESACTIVADO` | Admin | ✅ | `nutricionista-desactivado` | Inmediato | `03-desactivar-nutricionista.md` |
| `NUTRICIONISTA_REACTIVADO` | Nutricionista, Admin | ✅ | `nutricionista-reactivado` | Inmediato | `03-desactivar-nutricionista.md` §Reactivación |
| `SOCIO_CREADO` | Socio, Admin | ✅ | `socio-creado` | Inmediato | `06-crear-socio.md` |
| `SOCIO_DESACTIVADO` | Admin | ✅ | `socio-desactivado` | Inmediato | `07-desactivar-socio.md` |
| `FICHA_COMPLETADA` | Socio | ✅ | `ficha-completada` | Inmediato | `08-completar-ficha-salud.md` |
| `FICHA_ACTUALIZADA` | Socio (y nutricionistas vinculados si alerta) | ✅ | `ficha-actualizada` | Inmediato | `09-editar-ficha-salud.md` |
| `TURNO_CONFIRMADO` | Socio (con link confirmación), Nutricionista | ✅ | `turno-confirmado` | Inmediato | `11-reservar-turno.md` |
| `TURNO_CREADO_POR_RECEPCION` | Socio, Nutricionista | ✅ | `turno-creado-recepcion` | Inmediato | `12-crear-turno-nombre-socio.md` |
| `TURNO_REPROGRAMADO` | Actor opuesto | ✅ | `turno-reprogramado` | Inmediato | `14-reprogramar-turno.md` |
| `TURNO_CANCELADO` | Actor opuesto, Nutricionista/Socio | ✅ | `turno-cancelado` | Inmediato | `13-cancelar-turno.md` |
| `TURNO_CHECKIN` | Nutricionista | ✅ | `turno-checkin` | Inmediato | `15-check-in.md` |
| `TURNO_AUSENTE_AUTO` | Socio, Nutricionista | ✅ | `turno-ausente-auto` | Inmediato | `16-ausente-automatico.md` |
| `TURNO_AUSENTE_MANUAL` | Socio | ✅ | `turno-ausente-manual` | Inmediato | `17-ver-agenda-dia.md` §Marcar ausente manual |
| `TURNO_INICIADO` | Socio | ✅ | `turno-iniciado` | Inmediato | `17-ver-agenda-dia.md` §Iniciar consulta |
| `TURNO_FINALIZADO` | Socio | ✅ | `turno-finalizado` | Inmediato | `17-ver-agenda-dia.md` §Finalizar consulta |
| `RECORDATORIO_TURNO_24H` | Socio | ✅ | `recordatorio-24h` | 24h antes (job) | `recordatorios.md` |
| `RECORDATORIO_TURNO_1H` | Socio | ✅ | `recordatorio-1h` | 1h antes (job) | `recordatorios.md` |
| `CONSULTA_REGISTRADA` | Socio, Nutricionista | ✅ | `consulta-registrada` | Al cerrar consulta | `18-registrar-consulta.md` |
| `MEDICIONES_PUBLICADAS` | Socio | ✅ | `mediciones-publicadas` | Al cerrar consulta | `19-registrar-mediciones.md` |
| `MEDICION_REGISTRADA` | Nutricionista (interno) | ❌ (interno) | — | Inmediato | `19-registrar-mediciones.md` |
| `PLAN_CREADO` | Socio | ✅ | `plan-creado` | Inmediato | `20-crear-plan-alimentario.md` |
| `PLAN_ACTUALIZADO` | Socio | ✅ | `plan-actualizado` | Inmediato | `21-editar-plan-alimentario.md` |
| `PLAN_ELIMINADO` | Socio | ✅ | `plan-eliminado` | Inmediato | `22-eliminar-plan-alimentario.md` |
| `PLAN_INGREDIENTE_ALERGENO` | Socio (si tiene plan con ese alimento) | ✅ | `plan-ingrediente-alergeno` | Al editar alimento en uso | `sistema-alimentos.md` |
| `WIZARD_COMPLETED` | Socio, Admin | ✅ | `wizard-completado` | Inmediato | `onboarding-socio.md`, `onboarding-nutricionista.md` |
| `CHANGE_PASSWORD` | Usuario | ✅ | `password-changed` | Inmediato | `auth.md` |
| `PASSWORD_RESET_REQUESTED` | Usuario | ✅ (genérico, no revela email) | `password-reset-requested` | Inmediato | `auth.md` |
| `PASSWORD_RESET_COMPLETED` | Usuario | ✅ | `password-reset-completed` | Inmediato | `auth.md` |
| `SUPRESSION_REQUESTED` | Admin, Recepción | ✅ | `supresion-requested` | Inmediato | `compliance.md` |
| `SUPRESSION_PROCESSED` | Socio (al email real antes de ofuscar) | ✅ | `supresion-processed` | Inmediato | `cierre-cuenta-socio.md` |
| `SUPRESSION_REJECTED` | Socio | ✅ | `supresion-rejected` | Inmediato | `compliance.md` |
| `SUPRESSION_SLA_WARNING` | Admin | ✅ | `supresion-sla-warning` | 2 días antes del plazo (job) | `compliance.md` |
| `SUPRESSION_SLA_BREACHED` | Admin + CC nutricionista | ✅ | `supresion-sla-breached` | Cuando vence (job) | `compliance.md` |
| `ALIMENTO_EDITADO_EN_USO` | Socios con plan activo que lo referencia | ✅ | `alimento-editado-en-uso` | Inmediato | `sistema-alimentos.md` |

## Canal

- **Único canal en iter 1: email** vía SMTP. Variables de entorno.
- En dev: log a consola o MailHog/Ethereal.
- **NO hay in-app** (RB59).
- **NO hay push** (RB59).
- **NO hay preferencias** (RB59, el sistema decide).

## Plantillas

### Estructura
```typescript
interface Plantilla {
  key: string;          // ej. 'turno-confirmado'
  version: number;      // ej. 1
  asunto: string;       // ej. 'Tu turno está confirmado'
  cuerpoHtml: string;   // HTML con placeholders {{variable}}
  cuerpoTexto: string;  // Plain text alternativo
  variables: string[];  // nombres de variables esperadas
  idioma: string;       // 'es-AR'
}
```

### Ejemplo
```typescript
{
  key: 'turno-confirmado',
  version: 1,
  asunto: 'Tu turno con {{nutricionistaNombre}} está confirmado',
  cuerpoHtml: `
    <h1>Hola, {{socioNombre}}</h1>
    <p>Tu turno ha sido confirmado para el {{fechaHora}}.</p>
    <p>Con: {{nutricionistaNombre}}</p>
    <p>Recibirás un recordatorio 24 horas antes.</p>
  `,
  cuerpoTexto: 'Tu turno con {{nutricionistaNombre}} está confirmado para el {{fechaHora}}.',
  variables: ['socioNombre', 'nutricionistaNombre', 'fechaHora'],
  idioma: 'es-AR',
}
```

### Almacenamiento y versionado
- En DB o filesystem (decisión: filesystem en `apps/backend/src/infrastructure/email/templates/`).
- Versionadas: `template_v1`, `template_v2` cuando cambia el copy.
- El `LogNotificacion` guarda la `version` de plantilla usada al momento de envío (no se cambia retroactivamente).

## Configuración (env vars)

- `MAIL_HOST`: SMTP server.
- `MAIL_PORT`: default 587.
- `MAIL_USER`: usuario SMTP.
- `MAIL_PASSWORD`: password SMTP.
- `MAIL_FROM`: default 'no-reply@nutrifit.com'.
- `MAIL_SECURE`: `true|false` (TLS).
- `MAIL_RETRY_BACKOFF`: en segundos, default `[60, 300, 1800, 7200, 86400]` (1min, 5min, 30min, 2h, 24h).
- `APP_URL`: URL base para links en emails (ej. `https://app.nutrifit.com`).
- `APP_NAME`: default 'NutriFit'.

## Timing de envío

- **Inmediato** para todos los eventos transaccionales.
- **Batch**: NO implementado en iter 1 (todos son inmediatos).
- **Jobs**: `recordatorios.md` y `16-ausente-automatico.md` corren en cron separado.

## Timezone handling

- **Regla**: las fechas en los emails se muestran en la **TZ del gimnasio** del destinatario.
- **Lógica**:
  - Al renderizar plantilla, las fechas UTC se convierten a `gimnasio.zona_horaria` (default 'America/Argentina/Buenos_Aires').
  - Helper: `formatFechaEnGimnasio(fechaUtc, gimnasioId, formato)`.
- Ejemplo: en un email se muestra "Mañana 14:00" (no "Mañana 17:00 UTC").

## Fallback y reintentos

### Si SMTP falla al enviar
- La acción NO se aborta (RB35).
- Se registra en `LogNotificacion` con `error` y se encola para reintento.
- **Backoff exponencial**: `[60s, 300s, 1800s, 7200s, 86400s]` = 1min, 5min, 30min, 2h, 24h.
- Después del último reintento: se marca como `FALLIDO` definitivamente.

### Worker de reintentos (BullMQ)
- Repeatable job, corre cada 5 minutos.
- Query: `SELECT * FROM log_notificacion WHERE estado IN ('PENDIENTE', 'REINTENTANDO') AND proximo_intento_at <= now()`.
- Para cada uno: intenta enviar, si falla incrementa `reintentos` y programa próximo intento.
- Si llega a 5 reintentos: marca `FALLIDO`.

### Estados del LogNotificacion
- `PENDIENTE`: creado pero no enviado aún.
- `ENVIADO`: enviado correctamente.
- `REINTENTANDO`: falló y se reintentará.
- `FALLIDO`: 5 reintentos agotados.

## Reglas de negocio aplicadas
- **RB35**: Fallback con reintento.
- **RB59**: Solo email.

## Modelo de datos

### Entidad `LogNotificacion`
- `id (CHAR(36) UUID), gimnasio_id (CHAR(36)), usuario_id (CHAR(36) NULL), evento (VARCHAR(100) NOT NULL), email_destino (VARCHAR(255) NOT NULL), asunto (VARCHAR(500) NOT NULL), payload_json (JSON), plantilla_key (VARCHAR(100)), plantilla_version (INT), enviado_at (DATETIME NULL), error (TEXT NULL), reintentos (INT default 0), proximo_intento_at (DATETIME NULL), estado (enum), metadata_json (JSON), created_at`

### Constraints
- `CHECK(estado IN ('PENDIENTE','ENVIADO','REINTENTANDO','FALLIDO'))`.
- `CHECK(reintentos >= 0 AND reintentos <= 5)`.
- Índice: `idx_log_notif_estado_proximo (estado, proximo_intento_at)` para el worker de reintentos.

## Endpoints API

### `GET /api/admin/log-notificaciones`
- **Auth**: ADMIN
- **Query**: `?evento=...&estado=...&fechaDesde=...&fechaHasta=...&page=1&limit=50`
- **Response 200**: lista paginada.
- **Errors**: 401, 403, 500

### `GET /api/admin/log-notificaciones/:id`
- **Auth**: ADMIN
- **Response 200**: detalle con `payload_json`, errores, metadata.
- **Errors**: 404, 500

### `POST /api/admin/log-notificaciones/:id/reenviar`
- **Auth**: ADMIN
- **Body**: vacío
- **Side effect**: reencola el email para envío inmediato (resetea `reintentos=0`, `estado='PENDIENTE'`, `proximo_intento_at=now()`).
- **Response 200**: `{ ok: true }`
- **Errors**: 404, 500

### `GET /api/admin/log-notificaciones/stats`
- **Auth**: ADMIN
- **Response 200**:
  ```json
  {
    "totalEnviadosHoy": 234,
    "totalPendientes": 5,
    "totalReintentando": 2,
    "totalFallidos": 0,
    "porEvento": { "TURNO_CONFIRMADO": 50, "RECORDATORIO_24H": 30, ... }
  }
  ```

## Implementación

### Servicio de email (wrapper sobre nodemailer)
```typescript
class NotificacionesService {
  async enviar(
    evento: string,
    params: {
      gimnasioId: string;
      destinatarioEmail: string;
      destinatarioUsuarioId?: string;
      variables: Record<string, any>;
    }
  ): Promise<void> {
    // 1. Cargar plantilla del filesystem
    const plantilla = await this.cargarPlantilla(evento);
    
    // 2. Renderizar asunto y cuerpo
    const asunto = this.render(plantilla.asunto, params.variables);
    const cuerpoHtml = this.render(plantilla.cuerpoHtml, params.variables);
    const cuerpoTexto = this.render(plantilla.cuerpoTexto, params.variables);
    
    // 3. Crear LogNotificacion
    const log = await this.logRepo.create({
      gimnasioId: params.gimnasioId,
      usuarioId: params.destinatarioUsuarioId,
      evento,
      emailDestino: params.destinatarioEmail,
      asunto,
      payloadJson: { variables: params.variables, html: cuerpoHtml, texto: cuerpoTexto },
      plantillaKey: plantilla.key,
      plantillaVersion: plantilla.version,
      estado: 'PENDIENTE',
    });
    
    // 4. Encolar para envío
    await this.emailQueue.add('enviar', { logId: log.id });
  }
}
```

### Worker de envío
```typescript
@Processor('email')
class EmailProcessor {
  @Process('enviar')
  async enviar(job: Job) {
    const log = await this.logRepo.findById(job.data.logId);
    if (log.estado !== 'PENDIENTE' && log.estado !== 'REINTENTANDO') return;
    
    try {
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM'),
        to: log.emailDestino,
        subject: log.asunto,
        html: log.payloadJson.html,
        text: log.payloadJson.texto,
      });
      log.estado = 'ENVIADO';
      log.enviadoAt = new Date();
      log.error = null;
      await this.logRepo.save(log);
    } catch (err) {
      log.reintentos += 1;
      log.error = err.message;
      if (log.reintentos >= 5) {
        log.estado = 'FALLIDO';
      } else {
        log.estado = 'REINTENTANDO';
        log.proximoIntentoAt = this.calcularProximoIntento(log.reintentos);
      }
      await this.logRepo.save(log);
    }
  }
  
  private calcularProximoIntento(reintentos: number): Date {
    const backoff = [60, 300, 1800, 7200, 86400];
    return new Date(Date.now() + backoff[reintentos - 1] * 1000);
  }
}
```

## Edge cases

- **B1**: SMTP totalmente caído → todos los emails quedan en cola con backoff. UI muestra stats.
- **B2**: Email destinatario bounced (dirección inválida) → SMTP devuelve error, se registra en log, FALLIDO después de 5 reintentos.
- **B3**: Socio dado de baja entre el envío y la entrega → el email igual se envía (no verificamos estado al enviar, fire and log). Aceptable.
- **B4**: Cambio de plantilla mientras hay emails en cola → se usa la versión de plantilla al momento de crear el log (snapshot en `payload_json`).
- **B5**: Email de socio suprimido (ofuscado) → se envía al email real antes de la ofuscación, el log guarda el email original.
- **B6**: Link de recuperación de contraseña en el email → expiración 1h (ver `auth.md`).
- **B7**: Destinatario de admin cuando hay varios admins → se envía al admin principal del gimnasio, no a todos.

## Auditoría
- `EMAIL_ENVIADO` cuando se envía.
- `EMAIL_FALLIDO` cuando se agota el retry.
- Ver `auditoria.md` para el formato.

## Tests

### Unitarios
- `enviar-notificacion.use-case.ts`:
  - Happy path
  - SMTP falla → encola reintento
  - Variables de plantilla mal formadas
  - Plantilla no encontrada
- `reenviar-notificacion.use-case.ts` (admin):
  - Solo permite reenviar fallidos o enviados (no pendientes)
  - Resetea contadores
- `worker-envio`:
  - Envío exitoso
  - SMTP falla → reintento programado
  - 5 reintentos → FALLIDO
  - Backoff exponencial correcto

## Notas
- El sistema NO hace email marketing ni newsletters. Solo transaccionales.
- Las plantillas son en **español rioplatense** (voseo, "sos", "tenés", "querés").
- En iter 2+ se puede agregar in-app, push, y preferencias por usuario.
- **Copy neutra para compliance**: ver `compliance.md` §B1. No admitir incumplimiento explícito.
- **TZ del gimnasio en emails**: "Mañana 14:00" no "Mañana 17:00 UTC".
- La cola de emails es persistente (BullMQ + Redis), sobrevive a reinicios del backend.
