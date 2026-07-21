# Pasarela de Pagos Simulada — Design Doc

**Fecha**: 2026-07-09
**Estado**: Aprobado

## Resumen

Implementar un simulador de pagos para el registro público de gimnasios con suscripción mensual. Sin integración real con PayPal, Stripe, etc. El admin se registra, completa datos del gimnasio, es redirigido a una pantalla de pago ficticio con dos botones (Aprobar/Rechazar), y si aprueba, la suscripción queda activa.

## Arquitectura

### Backend — Módulo `suscripciones` (nuevo)

**Entidades:**

- `SuscripcionGimnasioEntity` (tabla `suscripcion_gimnasio`)
  - `id: number` PK auto
  - `gimnasioId: number` FK → gimnasio
  - `estado: 'PENDIENTE' | 'ACTIVA' | 'VENCIDA' | 'CANCELADA'`
  - `monto: number` (por si cambia en el futuro)
  - `fechaInicio: Date | null`
  - `fechaProximoPago: Date | null`
  - `createdAt`, `updatedAt` (automaticas)

- `PagoSimuladoEntity` (tabla `pago_simulado`)
  - `id: number` PK auto
  - `suscripcionId: number` FK → suscripcion_gimnasio
  - `monto: number`
  - `estado: 'APROBADO' | 'RECHAZADO'`
  - `fecha: Date`
  - `createdAt`

**Endpoints:**

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/suscripciones/registro` | `{ gimnasio: CrearGimnasioDto, admin: CrearAdminDto }` | `{ suscripcionId, monto }` |
| `POST` | `/suscripciones/:id/pagar` | `{ accion: 'aprobar' \| 'rechazar' }` | `{ success, redirectUrl }` |
| `GET` | `/suscripciones/:gimnasioId/estado` | — | `{ estado, fechaProximoPago, monto }` |

**Flujo `POST /suscripciones/registro`:**
1. Crea Gimnasio con `CrearGimnasioUseCase`
2. Crea Admin con `CrearAdminGimnasioUseCase`
3. Crea `SuscripcionGimnasioEntity` con estado `PENDIENTE`
4. Devuelve `{ suscripcionId, monto }`

**Flujo `POST /suscripciones/:id/pagar`:**
1. Busca suscripción por id. Si no está `PENDIENTE`, error.
2. Crea `PagoSimuladoEntity` con fecha actual
3. Si `accion = 'aprobar'`: suscripción → `ACTIVA`, fechaInicio = hoy, fechaProximoPago = hoy + 1 mes
4. Si `accion = 'rechazar'`: suscripción → `CANCELADA`
5. Devuelve `{ success: true/false, redirectUrl: '/login' }`

### Frontend — Página pública de registro + pago (nuevas)

**Ruta `/registro`:**
- Formulario público
- Paso 1: datos del gimnasio (nombre, dirección, teléfono, etc.)
- Paso 2: datos del admin (nombre, email, password)
- Submit → `POST /suscripciones/registro` → redirige a `/suscripcion/{id}/pago`

**Ruta `/suscripcion/{id}/pago`:**
- Resumen del plan ($250/mes por defecto)
- Datos del gimnasio registrado
- Dos botones: "Aprobar Pago" / "Rechazar"
- Aprobar → `POST /suscripciones/{id}/pagar { accion: 'aprobar' }` → redirige a `/login?registro=exitoso`
- Rechazar → mismo endpoint con `rechazar` → muestra mensaje de error con opción de reintentar (vuelve a `/registro`)

**En dashboard del admin:**
- Componente `SuscripcionStatus` que muestra estado, fecha de próximo pago
- Consume `GET /suscripciones/:gimnasioId/estado`

### Lo que NO se toca

- El GimnasioWizardPage (sigue siendo solo para superadmins)
- Los módulos existentes de auth, gimnasios, etc.
- Guards de suscripción (se agregan cuando haya más rutas que proteger)

## Commits esperados

1. `feat(backend): add SuscripcionGimnasio and PagoSimulado entities`
2. `feat(backend): add registro and pagar endpoints for suscripciones`
3. `feat(frontend): add public registro page with gym and admin form`
4. `feat(frontend): add simulated payment page with approve/reject`
5. `feat(frontend): show subscription status in admin dashboard`
