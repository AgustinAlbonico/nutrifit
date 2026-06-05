# Onboarding del socio

> **Source of truth**: `01-iteracion-base-nutricional.md` §13.1
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `auth.md`, `08-completar-ficha-salud.md`, `10-ver-nutricionistas-disponibles.md`, `11-reservar-turno.md`

## Descripción
Wizard guiado de primera vez para el socio. 3 pasos: bienvenida/cambio de contraseña → completar ficha → explorar profesionales y reservar primer turno. Una vez completado, no se muestra más. El socio puede navegar la app sin completarlo, pero no puede reservar turnos sin ficha completa (RB14).

## Actores
- SOCIO (cursa el wizard)
- ADMIN (puede reiniciar o forzar el wizard)

## Precondiciones
- Socio autenticado.
- Si `debe_cambiar_password=true` (primer login): paso 1 obligatorio antes de avanzar.

## Postcondiciones
- `socio.wizard_completado=true` cuando completa el paso 3.
- Auditoría con cada cambio de paso.

## Camino principal (3 pasos)

### Paso 1: Bienvenida + cambio de contraseña
1. Socio entra por primera vez (después de login con contraseña provisional).
2. Banner prominente: "Por seguridad, cambiá tu contraseña antes de continuar".
3. Formulario: contraseña actual + nueva + confirmación.
4. Validación: nueva cumple política (mínimo 8 chars, 1 may, 1 min, 1 num; para provisionales 12 chars + 1 símbolo).
5. Confirma → backend cambia contraseña (ver `auth.md` §4), setea `debe_cambiar_password=false`, registra auditoría.
6. Marca `wizard_step='ficha'`, avanza.

### Paso 2: Completar ficha de salud
1. Wizard de la ficha (`08-completar-ficha-salud.md`).
2. Sin ficha completa no se puede avanzar (RB14).
3. Botón "Volver" disponible.
4. Al completar la ficha: marca `wizard_step='reserva'`, avanza.

### Paso 3: Explorar profesionales y reservar primer turno
1. Sugerencia: ordenar por mayor disponibilidad o por orden alfabético.
2. Click en profesional → detalle → reservar turno (`11-reservar-turno.md`).
3. Al confirmar la reserva, el wizard se marca como completo.

## Estado del wizard

- Almacenado en DB: `socio.wizard_step` (string: 'password' | 'ficha' | 'reserva' | 'completado') y `socio.wizard_completado` (boolean).
- Si abandona, vuelve al último paso incompleto la próxima vez.
- **Cuándo se evalúa el wizard**: en cada request a endpoints del socio, el backend incluye `wizardStep` y `wizardCompletado` en el response. El frontend decide si muestra el modal/banner.

## Reglas de negocio aplicadas
- **RB14**: Ficha completa antes de reservar.
- **RB38**: Cambio de contraseña en primer login.

## Modelo de datos

### Entidad `Socio` (campos nuevos)
- `wizard_step: enum('PASSWORD','FICHA','RESERVA','COMPLETADO')` (default 'PASSWORD')
- `wizard_completado: boolean` (default false)
- `wizard_started_at: DATETIME NULL` (cuándo vio el wizard por primera vez)

### Constraints
- `CHECK(NOT wizard_completado OR wizard_step = 'COMPLETADO')` (consistencia).

## Endpoints API

### `GET /api/socios/me/wizard-estado`
- **Auth**: SOCIO
- **Response 200**:
  ```json
  {
    "wizardStep": "PASSWORD",
    "wizardCompletado": false,
    "debeCambiarPassword": true,
    "siguienteAccion": "cambiar_password" | "completar_ficha" | "reservar_primer_turno" | null
  }
  ```
- **Errors**: 401, 500

### `POST /api/socios/me/wizard-completar-paso`
- **Auth**: SOCIO
- **Body**: `{ step: 'PASSWORD' | 'FICHA' | 'RESERVA' }`
  - Para `step='PASSWORD'`: requiere `{ currentPassword, newPassword }` (ver `auth.md`).
  - Para `step='FICHA'`: requiere los campos de la ficha (ver `08-completar-ficha-salud.md`).
  - Para `step='RESERVA'`: no requiere body. Se completa al confirmar una reserva.
- **Response 200**:
  ```json
  {
    "ok": true,
    "wizardStep": "FICHA",
    "wizardCompletado": false,
    "siguienteAccion": "completar_ficha"
  }
  ```
- **Errors**: 400 (validación), 401, 500

### `POST /api/socios/me/wizard-saltar-paso`
- **Auth**: SOCIO
- **Body**: `{ step: 'RESERVA' }` (solo reserva es salteable; password y ficha no)
- **Response 200**: `{ ok: true, wizardStep: 'COMPLETADO', wizardCompletado: true }`
- **Side effect**: marca el wizard como completado sin reservar.
- **Errors**: 400 (paso no salteable), 401, 500

### `POST /api/socios/:id/wizard-reiniciar`
- **Auth**: ADMIN
- **Body**: `{ motivo: string }`
- **Response 200**: `{ ok: true, wizardStep: 'PASSWORD', wizardCompletado: false }`
- **Side effect**: socio vuelve a ver el wizard desde el paso 1 en su próximo login.
- **Errors**: 400, 403, 404, 500

### `POST /api/socios/:id/wizard-forzar-completado`
- **Auth**: ADMIN
- **Body**: `{ motivo: string }`
- **Response 200**: `{ ok: true, wizardCompletado: true }`
- **Side effect**: salta el wizard para este socio.
- **Errors**: 400, 403, 404, 500

## Caminos alternativos
- **A1**: Socio creado con `wizard_completado=true` (migración o carga inicial) → el wizard no se muestra.
- **A2**: Socio ya cambió contraseña antes (por error o flujo de admin) → el paso 1 se marca como completado automáticamente.
- **A3**: Socio completa ficha pero no reserva → puede usar la app normalmente; el paso 3 queda pendiente.
- **A4**: Socio con `debe_cambiar_password=false` (cambió en otro momento) → el paso 1 se salta.
- **A5**: Reserva creada por recepción (no por el socio) → el wizard se marca como completo automáticamente (ver §Edge case B1).

## Casos borde

### B1: Reserva creada por recepción
- Si el socio aún no completó el wizard pero tiene una reserva CONFIRMADA (creada por recepción), el sistema marca `wizard_completado=true` automáticamente.
- **Razón**: la reserva ya existe, el wizard perdió su propósito.
- **Decisión de iter 1**: sí, marcar como completo. (Si el admin quiere resetear para que el socio complete, puede usar el endpoint `wizard-reiniciar`.)

### B2: Socio abandona el wizard
- El flag `wizard_step` persiste en el último paso incompleto.
- Al volver a entrar, el wizard retoma desde ese paso.
- La app puede mostrar un banner persistente "Tenés el wizard incompleto" hasta que termine.

### B3: Re-wizard (admin resetea el flag)
- Admin usa endpoint `wizard-reiniciar`.
- El socio vuelve a ver el wizard desde el paso 1.
- Auditoría.

### B4: Cambio de contraseña olvidado después de 7 días
- La contraseña provisional expira (ver `auth.md`).
- El socio no puede loguearse. Admin debe resetear.

### B5: Re-wizard pero el socio ya tiene ficha completa
- El paso 2 se salta automáticamente (`wizard_step='RESERVA'`).

### B6: Wizard completado, pero admin resetea
- `wizard_completado=false`, `wizard_step='PASSWORD'`.
- Próximo login verá el wizard desde el paso 1.

## Eventos disparados
- `WIZARD_COMPLETED` → email al socio con bienvenida, email al admin.

## Auditoría
- `WIZARD_STEP` con `entidad='socio'`, `despues_json` con `wizard_step` nuevo.
- `WIZARD_COMPLETED` con `entidad='socio'`, al completar.
- `WIZARD_RESET` con `entidad='socio'`, cuando admin resetea.
- `WIZARD_FORCED` con `entidad='socio'`, cuando admin fuerza.
- `CHANGE_PASSWORD` (cubierto por `auth.md`).

## UI / UX

### Layout del wizard
- Top: barra de progreso (3 pasos).
- Sidebar: ayuda contextual del paso actual + progreso.
- Footer: botones "Atrás" / "Siguiente" / "Saltar este paso" (donde aplique).
- Header con el nombre del socio.

### Indicadores
- Si wizard incompleto: badge en el sidebar + banner persistente.
- Si wizard completo: el banner desaparece, el socio ve su home directamente.

### Estados visuales
- Paso completado: check verde.
- Paso actual: highlight azul.
- Paso futuro: gris.

## Edge cases (resumidos)

| Caso | Comportamiento |
|---|---|
| Socio abandona en paso 1 | Al volver, retoma desde paso 1 (si no cambió contraseña) o paso 2 |
| Reserva creada por recepción | Wizard se marca completo automáticamente (B1) |
| Re-wizard con ficha completa | Paso 2 se salta |
| Cambio de contraseña expirado | Admin resetea |

## Tests

### Unitarios
- `obtener-estado-wizard-socio.use-case.ts`:
  - Socio nuevo → wizardStep='PASSWORD', debeCambiarPassword=true
  - Socio que cambió pass pero no completó ficha → wizardStep='FICHA'
  - Socio con ficha completa → wizardStep='RESERVA'
  - Socio completo → wizardStep='COMPLETADO'
- `completar-paso-wizard-socio.use-case.ts`:
  - Paso password feliz
  - Paso password con currentPassword incorrecto
  - Paso ficha incompleto → 400
  - Paso reserva sin body
  - Marca wizard_completado=true al completar paso 3
- `saltar-paso-wizard-socio.use-case.ts`:
  - Saltar reserva OK
  - Intentar saltar password → 400
  - Intentar saltar ficha → 400
- `reiniciar-wizard-socio.use-case.ts`:
  - Solo ADMIN
  - Motivo obligatorio
  - Auditoría
- `forzar-completado-socio.use-case.ts`:
  - Solo ADMIN
  - Marca wizard_completado=true
- `evaluar-wizard.use-case.ts` (helper):
  - Si wizard_completado=false y tiene reserva CONFIRMADA → marcar como completo (B1)
  - Si tiene ficha completa y wizard_step='FICHA' → avanzar a 'RESERVA'
  - Llamado en cada request del socio

## Notas
- El wizard es **optativo** en el sentido de que el socio puede navegar la app sin completarlo. La única restricción es RB14 al reservar turno.
- El flag `wizard_completado` se setea automáticamente al:
  1. Completar el paso 3.
  2. **Tener una reserva CONFIRMADA** (B1) — el sistema lo evalúa en cada request.
- Las notificaciones sobre el wizard son in-app + email solo al completar (no spam).
- El admin es el ÚNICO que puede reiniciar o forzar el wizard.
- **Simetría con onboarding-nutricionista.md**: misma estructura de endpoints, mismo patrón.
