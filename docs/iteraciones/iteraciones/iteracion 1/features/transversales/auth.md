# Auth — Autenticación y sesión

> **Source of truth**: `01-iteracion-base-nutricional.md` §11.1, RB32, RB38, RB53, RB59
> **Estado**: Por implementar
> **Prioridad**: Crítica
> **Dependencias**: `notificaciones.md`, `multi-tenant.md`

## Descripción
Sistema de autenticación con JWT (access + refresh). Login, refresh, logout, cambio de contraseña (forzado en primer login), recuperación de contraseña por email con link temporal, cambio de email **NO permitido** (decisión de Q&A, RB53). Sesión bloqueada por intentos fallidos. Blacklist de refresh tokens al cambiar contraseña o logout.

## Actores
- SOCIO, NUTRICIONISTA, RECEPCIONISTA, ADMIN

## Funcionalidades cubiertas

### 1. Login
- Endpoint: `POST /api/auth/login`.
- Body: `{ email, password }`.
- Validación:
  - Formato email.
  - Credenciales correctas (verifica `password_hash` con bcrypt).
  - Usuario no está bloqueado (`bloqueado_hasta IS NULL OR bloqueado_hasta < now()`).
  - Usuario no eliminado (`deleted_at IS NULL`).
- Si credenciales incorrectas: incrementa `intentos_fallidos`, si llega a 5, bloquea por 15 min.
- Si login exitoso: resetea `intentos_fallidos=0`, genera access + refresh tokens.
- Si `debe_cambiar_password=true`: marca flag en el response para que UI redirija a cambio de contraseña.
- Auditoría: `LOGIN` o `LOGIN_FAILED`.

### 2. Refresh token (rotativo)
- Endpoint: `POST /api/auth/refresh`.
- Body: refreshToken (cookie httpOnly).
- Validación: token no expirado, no revocado, usuario activo.
- **Rotativo**: cada uso emite nuevos tokens (access + refresh). El token usado se marca `revoked_at=now()` y `replaced_by_id=nuevo_id`.
- Esto previene replay attacks.
- Auditoría.

### 3. Logout
- Endpoint: `POST /api/auth/logout`.
- Revoca el refresh token actual (`revoked_at=now()`).
- Auditoría `LOGOUT`.
- Side effect: la sesión queda invalidada, el cliente debe limpiar el access token de memoria.

### 4. Cambio de contraseña (forzado en primer login)
- Endpoint: `POST /api/auth/change-password`.
- Auth: autenticado.
- Body: `{ currentPassword, newPassword }`.
- Validación: `currentPassword` correcta, `newPassword` cumple política (RB32 para provisionales, política normal después).
- Setea `debe_cambiar_password=false`, `password_changed_at=now()`.
- **Blacklist**: revoca TODOS los refresh tokens del usuario (por seguridad).
- Auditoría `CHANGE_PASSWORD`.

### 5. Cambio de contraseña (sin requerir la actual, post-token)
- Endpoint: `POST /api/auth/set-password`.
- Auth: con token temporal (de recuperación o activación).
- Body: `{ token, newPassword }`.
- Usado cuando se completa el flujo de recuperación o activación inicial de nutricionista/socio.
- Valida token no usado ni expirado.
- Mismo efecto que §4 (incluye blacklist).

### 6. Recuperación de contraseña
- Endpoint: `POST /api/auth/forgot-password`.
- Body: `{ email }`.
- Genera token firmado con expiración 1h, lo guarda hasheado en DB, envía email con link.
- **Response genérico**: `{ ok: true }` (NO revela si el email existe — prevención de enumeración).
- **Rate limit**: 5 requests/hora por IP, 3 requests/hora por email (prevenir enumeración).
- Auditoría `PASSWORD_RESET_REQUESTED`.

- Endpoint: `POST /api/auth/reset-password`.
- Body: `{ token, newPassword }`.
- Valida token (no expirado, no usado), cambia contraseña, marca token como usado, **blacklist todos los refresh tokens**, envía email de confirmación.
- Auditoría `PASSWORD_RESET_COMPLETED`.

### 7. Validación de bloqueo por intentos
- 5 intentos fallidos → bloqueo 15 min.
- Contador por email.
- Lock en DB (columna `intentos_fallidos`, `bloqueado_hasta`).
- **HA**: en implementación multi-instancia, considerar usar Redis para contador compartido. **Decisión iter 1**: usar DB (lock pesimista al incrementar).

### 8. Cambio de email
- **NO PERMITIDO** en iter 1 (decisión de Q&A, RB53).
- Si el socio quiere cambiar email, debe pedir a admin que lo haga manualmente.
- Admin endpoint: `POST /api/admin/usuarios/:id/cambiar-email` (fuera de scope de este spec, va en admin general).

## Reglas de negocio aplicadas
- **RB32**: Contraseña provisional 12 chars (1 may, 1 min, 1 num, 1 símb).
- **RB38**: Forzar cambio en primer login.
- **RB53**: Email no se puede cambiar.
- **RB59**: Notificación solo por email (recuperación se envía por email).

## Configuración (env vars)

- `JWT_SECRET`: clave para firmar access tokens.
- `JWT_REFRESH_SECRET`: clave para refresh tokens (diferente a access).
- `JWT_ACCESS_TTL`: default 900 (15 min).
- `JWT_REFRESH_TTL`: default 604800 (7 días).
- `BCRYPT_COST`: default 12.
- `INTENTOS_MAX`: default 5.
- `BLOQUEO_MINUTOS`: default 15.
- `RESET_TOKEN_TTL_MINUTOS`: default 60 (1h).
- `PROVISIONAL_PASSWORD_TTL_DAYS`: default 7.
- `RATE_LIMIT_FORGOT_PASSWORD_PER_IP`: default 5/hora.
- `RATE_LIMIT_FORGOT_PASSWORD_PER_EMAIL`: default 3/hora.

## Política de contraseñas

### Contraseñas normales
- Mínimo **8 caracteres**.
- Al menos 1 mayúscula, 1 minúscula, 1 número.
- **Justificación**: NIST 2024 recomienda ≥8 chars. Las reglas de composición son soft (se incentiva pero no se fuerza). En iter 1 seguimos el estándar del proyecto.

### Contraseñas provisionales (generadas)
- **12 caracteres** (RB32).
- Al menos 1 mayúscula, 1 minúscula, 1 número, 1 símbolo.
- Generadas con `crypto.randomBytes` + charset.
- **Expiración**: 7 días (decisión de Q&A, `PROVISIONAL_PASSWORD_TTL_DAYS`).
- Después de 7 días: el admin debe resetear la contraseña.

### Validación
- Implementada con `zod` o `class-validator` en backend.
- Mensaje de error claro: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número".

## Modelo de datos

### Entidad `Usuario`
- `id, email, password_hash, rol, gimnasio_id_principal, debe_cambiar_password, password_changed_at, intentos_fallidos (default 0), bloqueado_hasta (NULL), deleted_at, created_at, updated_at`

### Entidad `RefreshToken`
- `id, usuario_id, token_hash, expires_at, revoked_at, replaced_by_id (NULL si activo), created_at, ip, user_agent`

### Entidad `PasswordResetToken`
- `id, usuario_id, token_hash, expires_at, used_at, ip, created_at`

### Constraints
- `UNIQUE(usuario.email)`.
- `CHECK(usuario.intentos_fallidos >= 0 AND intentos_fallidos <= 10)`.
- `CHECK(refresh_token.expires_at > created_at)`.

### Índices
- `idx_usuario_email`.
- `idx_refresh_token_usuario_id` (para blacklist).
- `idx_reset_token_usuario_id` (para blacklist).

## Mapeo snake_case ↔ camelCase

- **DB**: snake_case (`debe_cambiar_password`, `intentos_fallidos`).
- **API**: camelCase (`debeCambiarPassword`, `intentosFallidos`).
- Mapeo: librería de transformación (class-transformer) o manual en cada DTO.
- El JWT también usa camelCase.

## Endpoints API

### `POST /api/auth/login`
- **Auth**: ninguno
- **Body**: `{ email: string, password: string }`
- **Response 200**:
  ```json
  {
    "accessToken": "...",
    "refreshToken": "...",
    "usuario": {
      "id": "uuid",
      "email": "...",
      "rol": "SOCIO",
      "gimnasioId": "uuid",
      "debeCambiarPassword": false
    }
  }
  ```
- **Response 401**: credenciales inválidas.
- **Response 423**: cuenta bloqueada (intentos excedidos).
- **Headers**: `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh`.

### `POST /api/auth/refresh`
- **Auth**: refreshToken en cookie httpOnly
- **Body**: vacío
- **Response 200**: nuevos tokens (rotativo).
- **Response 401**: refresh inválido o expirado.

### `POST /api/auth/logout`
- **Auth**: autenticado
- **Body**: vacío
- **Response 200**: `{ ok: true }`
- **Side effect**: revoca refresh token, limpia cookie.

### `POST /api/auth/change-password`
- **Auth**: autenticado
- **Body**: `{ currentPassword: string, newPassword: string }`
- **Response 200**: `{ ok: true }`
- **Response 400**: validación de política.
- **Response 401**: currentPassword incorrecta.
- **Side effect**: cambia hash, revoca TODOS los refresh tokens del usuario (blacklist).

### `POST /api/auth/set-password`
- **Auth**: con token temporal en body
- **Body**: `{ token: string, newPassword: string }`
- **Response 200**: `{ ok: true }`
- **Response 400**: token inválido/expirado/usado, validación de política.

### `POST /api/auth/forgot-password`
- **Auth**: ninguno
- **Body**: `{ email: string }`
- **Response 200**: `{ ok: true }` (genérico, no revela si email existe).
- **Rate limit**: 5/hora por IP, 3/hora por email.

### `POST /api/auth/reset-password`
- **Auth**: con token temporal en body
- **Body**: `{ token: string, newPassword: string }`
- **Response 200**: `{ ok: true }`
- **Response 400**: token inválido/expirado/usado, validación de política.
- **Side effect**: cambia hash, blacklist refresh tokens, email de confirmación.

## UI / UX

### Pantalla: Login
- Email + password.
- Link "¿Olvidaste tu contraseña?".
- Mensaje de error genérico: "Credenciales inválidas" (no revela si email existe).

### Pantalla: Forzar cambio de contraseña (post-primer-login)
- Modal/pantalla bloqueante: "Por seguridad, cambiá tu contraseña antes de continuar".
- Campo contraseña actual (si no es primer login).
- Campo nueva contraseña + confirmación.
- Indicador de fuerza (opcional, UX).
- Botón "Cambiar contraseña" deshabilitado hasta cumplir política.

### Pantalla: Recuperar contraseña
- Campo email.
- Mensaje genérico post-envío: "Si el email está registrado, recibirás un link de recuperación".

### Pantalla: Resetear contraseña (link del email)
- Campo nueva contraseña + confirmación.
- Indicador de fuerza.

## Blacklist de refresh tokens

- Al cambiar contraseña: se revoca TODOS los refresh tokens del usuario.
- Al logout: se revoca el refresh token actual.
- Al detectar uso de un token revocado: 401 + auditoría `LOGIN_FAILED`.
- **Almacenamiento**: tabla `refresh_token` con `revoked_at` (soft revoke). El `token_hash` se compara en cada refresh.
- **Cleanup**: job diario elimina `refresh_token` con `revoked_at < now() - INTERVAL '30 days'`.

## Auditoría
- `LOGIN` exitoso.
- `LOGIN_FAILED` con motivo (credenciales inválidas, cuenta bloqueada, etc.).
- `LOGOUT`.
- `CHANGE_PASSWORD`.
- `PASSWORD_RESET_REQUESTED`.
- `PASSWORD_RESET_COMPLETED`.

## Tests

### Unitarios
- `login.use-case.ts`:
  - Happy path
  - Credenciales inválidas (incrementa contador)
  - 5 intentos fallidos → bloquea 15 min
  - Cuenta bloqueada → 423
  - Cuenta con `debe_cambiar_password=true` → marca flag en response
  - Cuenta eliminada (soft) → 401
- `refresh-token.use-case.ts`:
  - Refresh válido → emite nuevos tokens
  - Refresh expirado → 401
  - Refresh revocado → 401
  - Refresh reutilizado (rotativo) → 401
- `cambiar-password.use-case.ts`:
  - Con contraseña actual
  - Política no cumplida → 400
  - Blacklist de tokens al cambiar
- `forgot-password.use-case.ts`:
  - Email existe → envía link
  - Email no existe → respuesta genérica
  - Rate limit por email
- `reset-password.use-case.ts`:
  - Token válido
  - Token expirado
  - Token usado
  - Blacklist de tokens

## Edge cases
- **B1**: Usuario cambia de gimnasio → NO se invalidan sus tokens actuales. Próximo refresh usa el nuevo `gimnasioId` del JWT (re-login puede ser necesario).
- **B2**: Cuenta eliminada (soft) → login falla con 401 genérico.
- **B3**: Múltiples dispositivos logueados → cambiar contraseña invalida TODOS los refresh tokens (todos los dispositivos deben re-loguearse).
- **B4**: Token de recuperación reenviado varias veces → cada request genera un nuevo token, los anteriores siguen siendo válidos hasta su expiración. **Mejora futura**: invalidar tokens anteriores al generar uno nuevo.
- **B5**: Bloqueo durante un login exitoso (race) → la transacción del login se completa antes que el intento de bloqueo, pero si hay race real, el siguiente intento puede estar bloqueado.
- **B6**: Expiración de contraseña provisional a los 7 días → si el usuario no cambió la contraseña, no puede hacer login. Admin debe resetear.
- **B7**: Cambio de email no permitido → el usuario debe contactar admin. En el form de edición de perfil, el campo email es read-only.

## Notas
- **Crítico**: el cambio de email NO está permitido en iter 1 (RB53). Si el usuario necesita cambiar email, admin debe hacerlo manualmente vía panel admin.
- La contraseña provisional expira a los 7 días (decisión de Q&A).
- El bloqueo por intentos se aplica por email, no por IP (decisión de Q&A).
- Los refresh tokens son **rotativos** (cada uso emite uno nuevo). Esto es una práctica de seguridad estándar.
- La blacklist al cambiar contraseña es CRÍTICA: si un atacante robó la contraseña anterior y tiene un token activo, queda invalidado.
- En iter 2+ se puede agregar autenticación de 2 factores (2FA) con TOTP.
