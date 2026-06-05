# 01 — Registrar nutricionista

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-01
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `auth.md`, `notificaciones.md`, `archivos.md`

## Descripción
Permite a recepción o admin crear un nuevo nutricionista en el sistema. Genera contraseña provisional (RB32), envía credenciales por email, y queda en estado ACTIVO con `debe_cambiar_password = true`. La asociación al gimnasio se hace vía `NutricionistaGimnasio` (RB25, multi-tenant).

## Actores
- RECEPCIONISTA
- ADMIN

## Precondiciones
- El actor está autenticado y pertenece al menos a un gimnasio.
- El email del nutricionista no está registrado (RB01).
- La matrícula no está registrada a nivel plataforma (RB01).
- El actor selecciona al menos un gimnasio donde el nutricionista atenderá.

## Postcondiciones
- Nutricionista creado en estado ACTIVO (o INACTIVO si se eligió así).
- Usuario creado con `debe_cambiar_password = true`.
- Asociación a gimnasio(s) creada vía `NutricionistaGimnasio`.
- Email con credenciales enviado al nutricionista y al admin.
- Registro en `auditoria` con metadata completa.

## Camino principal
1. Actor accede a "Nutricionistas" → "Nuevo nutricionista".
2. Completa formulario:
   - **Datos personales**: nombre, apellido, email, DNI (opcional), fecha nacimiento (opcional), género (opcional), teléfono (opcional)
   - **Datos profesionales**: matrícula, duración de turno en minutos (>0)
   - **Datos opcionales**: presentación, formación, certificaciones, tarifa sesión, años experiencia, foto, diploma
   - **Gimnasio(s)** donde atiende (al menos uno, preseleccionado con el del actor)
   - **Estado inicial** (activo/inactivo)
3. Confirma.
4. Sistema valida (en orden):
   - Formato email válido.
   - Email no duplicado (RB01).
   - Matrícula no duplicada (RB01).
   - DNI no duplicado dentro del gimnasio (RB01).
   - Duración > 0.
5. Genera contraseña provisional: 12 chars, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo (RB32).
6. Hashea con bcrypt cost 12 o argon2id.
7. Crea en transacción:
   - `Usuario` con `password_hash` y `debe_cambiar_password=true`.
   - `Nutricionista` con datos profesionales.
   - `NutricionistaGimnasio` (uno o más, según selección).
8. Sube archivos opcionales (foto, diploma) si fueron provistos.
9. Envía email con credenciales (login + contraseña provisional + link a la app).
10. Registra en `log_notificacion`.
11. Registra auditoría con `accion=CREATE, entidad=nutricionista, despues_json` completo.
12. Mensaje al actor: "Nutricionista registrado. Se envió email con credenciales."

## Caminos alternativos
- **A1**: Email ya registrado → "El email ya está registrado en el sistema".
- **A2**: Matrícula ya registrada → "La matrícula profesional ya está registrada".
- **A3**: Formato email inválido → "Formato de email inválido".
- **A4**: Falta matrícula → "La matrícula profesional es obligatoria".
- **A5**: Falta duración de turno → "La duración de turno es obligatoria (>0)".
- **A6**: Carga inicial como INACTIVO → permitido, mismo flujo, no recibe turnos hasta activación.
- **A7**: SMTP falla → nutricionista se crea igual, log de error en `log_notificacion`, admin puede reenviar credenciales.

## Casos borde
- **B1**: Dos registros simultáneos con mismo email → `UNIQUE` constraint rechaza al segundo con 409.
- **B2**: Intento de setear especialidad != "Nutricionista" → bloqueado (validación con valor fijo).
- **B3**: Matrícula repetida en gimnasio distinto → bloqueado (única a nivel plataforma).
- **B4**: Diploma (archivo) inválido o muy grande → ver `archivos.md`. Si diploma es obligatorio y falla, rollback transaccional.
- **B5**: Foto de perfil inválida → advertencia, no bloquea (es opcional).
- **B6**: Nutricionista en 2+ gimnasios → permitido, requiere seleccionar varios en el formulario.
- **B7**: Nutricionista que ya existía en otro gimnasio → se crea nueva asociación `NutricionistaGimnasio`, no se duplica el nutricionista global.
- **B8**: El admin/recepción no pertenece al gimnasio que quiere asignar → error 403.

## Reglas de negocio aplicadas
- **RB01**: Email y matrícula únicos a nivel plataforma.
- **RB25**: Nutricionista puede atender en N gimnasios.
- **RB32**: Contraseña provisional 12 chars con requisitos, forzar cambio en 1er login.
- **RB33**: Auditoría con metadata completa.
- **RB59**: Notificación solo por email (no in-app).

## Eventos disparados
- `NUTRICIONISTA_CREADO` → email al nutricionista con credenciales, email al admin.
- Registro en `log_notificacion` con `evento='NUTRICIONISTA_CREADO'`.

## Auditoría
- `accion='CREATE'`
- `entidad='nutricionista'`
- `entidad_id`: ID del nutricionista creado
- `despues_json`: snapshot completo del nutricionista y sus asociaciones a gimnasio(s)
- `ip`, `user_agent`, `timestamp` del actor

## Criterios de aceptación
- [ ] Recepción puede crear un nutricionista en menos de 2 minutos.
- [ ] Validación de email/matrícula únicos funciona.
- [ ] Email llega con credenciales válidas y formato correcto.
- [ ] Nutricionista puede hacer login con contraseña provisional.
- [ ] Sistema fuerza cambio de contraseña en primer login (ver `auth.md`).
- [ ] Nutricionista aparece en listados como ACTIVO.
- [ ] Auditoría registra la creación con metadata completa.
- [ ] Si SMTP falla, nutricionista se crea igual y log queda registrado.
- [ ] Foto de perfil y diploma se suben correctamente.
- [ ] Test unitario: use-case `crear-nutricionista.use-case.ts` cubre camino principal y alternativos A1-A5.
- [ ] Test e2e manual: recepción crea nutricionista, llega email, login funciona, cambio de password exitoso.

## Endpoints API sugeridos

### `POST /api/nutricionistas`
- **Auth**: RECEPCIONISTA, ADMIN
- **Body**: `CreateNutricionistaDto { nombre, apellido, email, dni?, fechaNacimiento?, genero?, telefono?, matricula, duracionTurnoMin, presentacion?, formacion?, certificaciones?, tarifaSesion?, aniosExperiencia?, fotoBase64?, diplomaBase64?, gimnasioIds: string[], estado: 'ACTIVO'|'INACTIVO' }`
- **Response 201**: `{ id, email, estado }`
- **Errors**: 400 (validación), 409 (email/matrícula/dni duplicado), 403 (gimnasio no accesible), 500 (SMTP o DB)

### `POST /api/nutricionistas/:id/reenviar-credenciales`
- **Auth**: RECEPCIONISTA, ADMIN
- **Body**: vacío
- **Response 200**: `{ ok: true }`
- **Side effect**: genera nueva contraseña provisional, reenvía email.
- **Errors**: 404 (no existe), 403 (gimnasio no accesible), 500 (SMTP)

### `POST /api/nutricionistas/:id/foto`
- **Auth**: RECEPCIONISTA, ADMIN, NUTRICIONISTA (la propia)
- **Body**: multipart/form-data con archivo
- **Response 200**: `{ url }`
- **Errors**: 400 (archivo inválido), 413 (muy grande), 500

## Modelo de datos

### Entidades afectadas
- **Usuario** (nuevo): `id, email, password_hash, rol='NUTRICIONISTA', gimnasio_id_principal, debe_cambiar_password=true, created_at, updated_at`
- **Nutricionista** (nuevo): `id, usuario_id, nombre, apellido, dni, fecha_nacimiento, genero, telefono, matricula, especialidad='Nutricionista' (fija), duracion_turno_min, presentacion, formacion, certificaciones, tarifa_sesion, anios_experiencia, foto_path, diploma_path, created_at, updated_at`
- **NutricionistaGimnasio** (nuevo, 1+): `id, nutricionista_id, gimnasio_id, estado='ACTIVO' (default), created_at`
- **LogNotificacion** (nuevo): registro del email enviado

### Constraints
- `UNIQUE(usuario.email)`
- `UNIQUE(nutricionista.matricula)`
- `UNIQUE(nutricionista_gimnasio.nutricionista_id, gimnasio_id)`

### Índices
- `idx_usuario_email` (lookup de login)
- `idx_nutricionista_matricula`
- `idx_nutricionista_gimnasio_nutri_id`
- `idx_nutricionista_gimnasio_gimnasio_id`

## UI / UX

### Pantalla: Listado de nutricionistas
- Botón "Nuevo nutricionista" visible para RECEPCIONISTA y ADMIN.

### Pantalla: Formulario
- Secciones colapsables: Datos personales, Datos profesionales, Datos opcionales, Gimnasios.
- Validación inline en blur.
- Botón "Guardar" deshabilitado hasta validación OK.
- Mensaje de éxito con toast.
- Si email falla, mostrar "Nutricionista creado. No se pudo enviar el email, contactá al admin para reenviar".

## Tests

### Unitarios (obligatorios)
- `crear-nutricionista.use-case.ts`:
  - Camino principal feliz
  - A1: email duplicado
  - A2: matrícula duplicada
  - A3: email inválido
  - A4: falta matrícula
  - A5: falta duración
  - B1: concurrencia (UNIQUE constraint)
  - B2: especialidad != Nutricionista rechazada
  - B6: múltiples gimnasios permitidos

### E2E (manual checklist)
- [ ] Login como RECEPCIONISTA
- [ ] Crear nutricionista con datos válidos
- [ ] Verificar email recibido
- [ ] Login con credenciales provisorias
- [ ] Cambio de contraseña exitoso
- [ ] Nutricionista visible en listado

## Notas
- La contraseña provisional expira a los **7 días** (ver `auth.md`).
- Si el admin necesita cambiar el gimnasio principal del nutricionista después, debe hacerlo vía edición (`02-editar-nutricionista.md`).
- El nutricionista NO tiene confirmación de email separada: el email con credenciales + primer login exitoso es la confirmación implícita.
