# 06 — Crear socio

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-06
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `auth.md`, `notificaciones.md`, `multi-tenant.md`, `archivos.md`

## Descripción
Permite a recepción, admin o nutricionista (con auditoría de origen) crear un nuevo socio en el sistema. Genera contraseña provisional, envía credenciales, asigna al gimnasio del actor. Queda en estado ACTIVO.

## Actores
- RECEPCIONISTA
- ADMIN
- NUTRICIONISTA (con `motivo_origen='CREADO_POR_NUTRICIONISTA'` en auditoría, RB43)

## Precondiciones
- El actor está autenticado.
- El email del socio no está registrado a nivel plataforma (RB02).
- El DNI del socio no está duplicado dentro del gimnasio (RB02).
- El gimnasio del actor es válido.

## Postcondiciones
- Socio creado en estado ACTIVO.
- Usuario creado con `debe_cambiar_password = true`.
- Asociación a gimnasio (`socio.gimnasio_id`).
- Email con credenciales enviado.
- Registro en auditoría con `motivo_origen`.

## Camino principal
1. Actor accede a "Socios" → "Nuevo socio".
2. Completa formulario:
   - **Obligatorios**: nombre, apellido, email, estado (default ACTIVO).
   - **Opcionales**: DNI, teléfono, fecha nacimiento, género, observaciones administrativas.
3. Confirma.
4. Sistema valida:
   - Formato email válido.
   - Email no duplicado (RB02).
   - DNI no duplicado dentro del gimnasio (RB02), si fue provisto.
5. Genera contraseña provisional (RB32): 12 chars con requisitos.
6. Hashea.
7. Crea en transacción:
   - `Usuario` con `password_hash`, `rol='SOCIO'`, `debe_cambiar_password=true`.
   - `Socio` con datos personales y `gimnasio_id` del actor.
8. Envía email con credenciales.
9. Registra en `log_notificacion`.
10. Registra auditoría `accion=CREATE, entidad=socio, despues_json`, con `motivo_origen`:
    - RECEPCIONISTA/ADMIN: `motivo_origen='CREADO_POR_RECEPCION'`.
    - NUTRICIONISTA: `motivo_origen='CREADO_POR_NUTRICIONISTA'` (RB43).
11. Mensaje al actor: "Socio registrado. Se envió email con credenciales."

## Caminos alternativos
- **A1**: Email ya registrado → "El email ya está registrado en el sistema".
- **A2**: DNI duplicado dentro del gimnasio → "El DNI ya está registrado para otro socio en este gimnasio".
- **A3**: Formato email inválido → "Formato de email inválido".
- **A4**: Faltan datos obligatorios → "Complete nombre, apellido y email".
- **A5**: SMTP falla → socio se crea igual, log de error, admin puede reenviar credenciales.

## Casos borde
- **B1**: Dos registros simultáneos con mismo email → `UNIQUE` constraint rechaza al segundo con 409.
- **B2**: Mismo DNI pero distinto email dentro del mismo gimnasio → bloqueado (RB02).
- **B3**: Socio existe en otro gimnasio → permitido (es tenant distinto), se crea nuevo socio.
- **B4**: Crear socio como NUTRICIONISTA → flag en auditoría (RB43), y el socio queda asociado al gimnasio del nutricionista.
- **B5**: Nutricionista crea socio y luego lo atiende → permitido, RB13 aplica (el nutricionista tendrá turnos con él, lo que le da visibilidad).
- **B6**: Recepción crea socio recién creado sin ficha de salud → permitido, pero al primer intento de reservar turno, el sistema le提醒á completar la ficha (RB14).

## Reglas de negocio aplicadas
- **RB02**: Email único a nivel plataforma, DNI único dentro del gimnasio.
- **RB26**: Socio pertenece a un único gimnasio (RB, restricción de iter 1).
- **RB32**: Contraseña provisional con requisitos, forzar cambio.
- **RB33**: Auditoría.
- **RB43**: Auditoría de origen si nutricionista crea.
- **RB59**: Solo email.

## Eventos disparados
- `SOCIO_CREADO` → email al socio con credenciales, email al admin (y al nutricionista si fue quien lo creó).

## Auditoría
- `accion='CREATE'`
- `entidad='socio'`
- `despues_json` con datos completos
- `motivo_origen` en metadata o en campo extra de auditoría

## Criterios de aceptación
- [ ] Recepción puede crear un socio.
- [ ] Nutricionista puede crear un socio (con flag de auditoría).
- [ ] Validación de email/DNI únicos.
- [ ] Email llega con credenciales.
- [ ] Socio puede hacer login con contraseña provisional.
- [ ] Socio puede completar ficha de salud.
- [ ] Auditoría registra la creación con `motivo_origen`.
- [ ] Si SMTP falla, socio se crea igual y log queda.
- [ ] Test unitario: use-case `crear-socio.use-case.ts` cubre happy path, A1, A2, RB43.

## Endpoints API

### `POST /api/socios`
- **Auth**: RECEPCIONISTA, ADMIN, NUTRICIONISTA
- **Body**: `CreateSocioDto { nombre, apellido, email, dni?, telefono?, fechaNacimiento?, genero?, observaciones? }`
- **Response 201**: `{ id, email, estado }`
- **Errors**: 400, 409 (email/dni duplicado), 500

### `POST /api/socios/:id/reenviar-credenciales`
- **Auth**: RECEPCIONISTA, ADMIN
- **Response 200**: `{ ok: true }`
- **Side effect**: reenvía email con nueva contraseña provisional.
- **Errors**: 404, 500

## Modelo de datos

### Entidades afectadas
- `Usuario` (nuevo)
- `Socio` (nuevo): `id, usuario_id, nombre, apellido, dni, fecha_nacimiento, genero, telefono, gimnasio_id, observaciones, estado='ACTIVO', created_at, updated_at`
- `LogNotificacion`

### Constraints
- `UNIQUE(usuario.email)`
- `UNIQUE(socio.gimnasio_id, socio.dni)` (DNI único por gimnasio, no a nivel plataforma)

### Índices
- `idx_usuario_email`
- `idx_socio_gimnasio_id`
- `idx_socio_gimnasio_dni` (compuesto para RB02)

## UI / UX

### Pantalla: Listado de socios
- Botón "Nuevo socio".
- Filtros: nombre, email, DNI, estado, fecha de alta.

### Pantalla: Formulario de nuevo socio
- Validación inline.
- Botón "Guardar" deshabilitado hasta validación.
- Mensaje post-guardado: "Socio creado. Se envió email con credenciales."
- Link a "Ver detalle del socio".

## Tests

### Unitarios
- `crear-socio.use-case.ts`:
  - Happy path
  - A1: email duplicado
  - A2: DNI duplicado en gimnasio
  - A3: email inválido
  - B1: concurrencia
  - B4: nutricionista crea → motivo_origen en auditoría
  - B3: socio en otro gimnasio → permitido

## Notas
- El socio creado NO tiene ficha de salud; al primer intento de reservar turno, el sistema valida RB14 y lo redirige a completar ficha.
- La contraseña provisional expira a los 7 días (ver `auth.md`).
- Si el gimnasio del actor es multi-tenant (un admin en varios gimnasios), debe elegir a qué gimnasio asignar al socio.
