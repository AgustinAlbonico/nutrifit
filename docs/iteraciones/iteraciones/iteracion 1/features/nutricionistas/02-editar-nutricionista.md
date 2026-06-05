# 02 — Editar nutricionista

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-02
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `01-registrar-nutricionista.md`, `notificaciones.md`, `multi-tenant.md`, `auth.md`

## Descripción
Permite editar los datos de un nutricionista existente. Los permisos de edición varían por rol: ADMIN/RECEPCIONISTA pueden editar todo; el nutricionista solo puede editar sus datos opcionales (presentación, foto, formación, certificaciones, tarifa, años experiencia). Email y matrícula son únicos a nivel plataforma (RB01) y no pueden ser cambiados por el nutricionista. Cambio de gimnasio se gestiona vía `multi-tenant.md` con cancelación de turnos futuros.

## Actores
- RECEPCIONISTA (campos administrativos, sin cambio de email/matrícula).
- ADMIN (cualquier campo, incluyendo asociaciones a gimnasio).
- NUTRICIONISTA (solo campos opcionales propios: presentación, foto, formación, certificaciones, tarifa, años experiencia, género, fecha nacimiento, teléfono).

## Precondiciones
- El nutricionista existe.
- El actor tiene permisos sobre el nutricionista (admin/recep del mismo gimnasio; el propio nutricionista).

## Postcondiciones
- Datos actualizados.
- Auditoría con antes/después.
- Si se cambió la duración del turno: advertencia mostrada, turnos existentes NO se modifican.

## Camino principal
1. Actor busca al nutricionista (por nombre, email, DNI o matrícula).
2. Abre detalle.
3. Modifica campos permitidos según rol (ver §Campos editables por rol).
4. Confirma.
5. Sistema valida:
   - Si cambió email: formato válido y no duplicado (RB01).
   - Si cambió matrícula: no duplicada (RB01).
   - Si cambió DNI: no duplicado dentro del gimnasio.
   - Si cambió duración: advertir si hay turnos futuros reservados (RB03).
6. Actualiza en transacción.
7. Auditoría con antes/después completo.
8. Mensaje: "Datos actualizados".

## Campos editables por rol

### RECEPCIONISTA, ADMIN (excepto email/matrícula si no es admin)
- ✅ nombre, apellido
- ❌ email (NO editable — RB53, decisión de Q&A)
- ❌ matrícula (NO editable — cambiar matrícula es un proceso administrativo, requiere justificación)
- ✅ DNI (con validación de unicidad dentro del gimnasio)
- ✅ fecha nacimiento, género, teléfono
- ✅ duración de turno (con advertencia si hay turnos futuros)
- ✅ presentación, formación, certificaciones, tarifa, años experiencia
- ✅ foto, diploma (archivos)
- ✅ estado (reactivación, solo admin)

### NUTRICIONISTA (la propia)
- ❌ email, DNI, matrícula, duración de turno (NO editables por el propio)
- ✅ nombre, apellido
- ✅ fecha nacimiento, género, teléfono
- ✅ presentación, formación, certificaciones, tarifa, años experiencia
- ✅ foto

### ADMIN (todo, incluyendo email y matrícula con justificación)
- ✅ Todos los campos, incluyendo email y matrícula.
- ⚠️ Cambio de email: requiere proceso especial (ver §Cambio de email admin).
- ⚠️ Cambio de matrícula: requiere justificación en auditoría.

## Caminos alternativos
- **A1**: Email nuevo duplicado → "El nuevo email ya está registrado".
- **A2**: Matrícula nueva duplicada → "La nueva matrícula ya está registrada".
- **A3**: Cambio de duración con turnos futuros reservados → warning: "Hay N turnos futuros con la duración actual. Los nuevos slots se calcularán con la nueva duración. Los turnos existentes NO se modifican. ¿Continuar?".
- **A4**: Intento de cambiar campos no permitidos por rol → 403.
- **A5**: Intento de cambiar email/matrícula siendo el propio nutricionista → 403.

## Casos borde
- **B1**: Cambiar matrícula tras haber atendido consultas → permitido + auditoría. Considerar warning "Vas a cambiar la matrícula de un nutricionista que ya atendió N consultas. Esto es auditable.".
- **B2**: Editar nutricionista INACTIVO → permitido para datos administrativos; para reactivación ver `03-desactivar-nutricionista.md`.
- **B3**: Cambiar email siendo el nutricionista logueado → la sesión actual queda con el email viejo hasta re-login. En próximo login usará el nuevo (si fue por admin).
- **B4**: Cambiar gimnasio(s) del nutricionista → si se elimina la asociación a un gimnasio, hay que cancelar turnos futuros de ese gimnasio. Ver `multi-tenant.md` §Desasociar nutricionista.
- **B5**: Cambiar duración de turno → advertencia fuerte, NO se modifican turnos existentes (RB03). Se actualiza para FUTUROS slots.
- **B6**: Doble edición simultánea → last-write-wins con `updated_at` + auditoría muestra ambas ediciones.
- **B7**: Cambiar tarifa a 0 → interpretamos como "no mostrar tarifa" en el perfil público.
- **B8**: Cambiar tarifa a negativo → error de validación.
- **B9**: Intentar editar nutricionista de OTRO gimnasio → 403.
- **B10**: Cambiar presentación con texto muy largo (ej. 5000 chars) → validar max 2000.

## Cambio de email (admin)

**NO permitido en flujo normal del nutricionista** (RB53). El admin puede cambiarlo pero requiere un proceso especial:

### Camino admin para cambiar email
1. Admin accede al detalle del nutricionista.
2. Click en "Cambiar email" (acción especial, requiere permisos extra).
3. Ingresa nuevo email + motivo (obligatorio, queda en auditoría).
4. Backend valida: email único, formato válido.
5. **Side effect**: el nutricionista debe verificar el nuevo email antes de poder usarlo para login. Se envía email al NUEVO email con link de confirmación.
6. Hasta que confirme, el email viejo sigue funcionando para login.
7. Al confirmar, el email nuevo se activa, el viejo se marca como histórico.

**Endpoint**: `POST /api/admin/nutricionistas/:id/cambiar-email`.

## Reglas de negocio aplicadas
- **RB01**: Email y matrícula únicos.
- **RB03**: Duración única; cambio con turnos futuros advierte.
- **RB25**: Nutricionista en N gimnasios.
- **RB33**: Auditoría.
- **RB53**: Email no editable en flujo normal.

## Endpoints API

### `PATCH /api/nutricionistas/:id`
- **Auth**: RECEPCIONISTA, ADMIN, NUTRICIONISTA (la propia)
- **Body**: `UpdateNutricionistaDto` con campos opcionales (solo los que se quieren cambiar)
- **Response 200**: nutricionista actualizado
- **Errors**: 400, 403, 404, 409 (email/matrícula duplicado), 500

### `GET /api/nutricionistas/:id`
- **Auth**: RECEPCIONISTA, ADMIN, NUTRICIONISTA (la propia), SOCIO (solo campos públicos)
- **Response 200**: detalle del nutricionista
- **Errors**: 403, 404, 500

### `POST /api/nutricionistas/:id/cambiar-gimnasio`
- **Auth**: ADMIN
- **Body**: `{ gimnasioId, accion: 'agregar' | 'quitar' }`
- **Side effect**:
  - Si `agregar`: crea `NutricionistaGimnasio`.
  - Si `quitar`: marca INACTIVO, cancela turnos futuros en ese gimnasio.
- **Response 200**: `{ ok: true, turnosCancelados: number }`
- **Errors**: 400, 403, 404, 409, 500

### `POST /api/admin/nutricionistas/:id/cambiar-email`
- **Auth**: ADMIN
- **Body**: `{ nuevoEmail, motivo }`
- **Side effect**: envía email de confirmación al nuevo email.
- **Response 200**: `{ ok: true, confirmacionRequerida: true }`
- **Errors**: 400, 403, 404, 409, 500

### `GET /api/nutricionistas/:id/cambiar-email/confirmar`
- **Auth**: ninguno (link con token en query)
- **Query**: `?token=...`
- **Response 200**: redirect a UI con mensaje "Email actualizado".
- **Errors**: 400 (token inválido), 500

## Modelo de datos

### Entidades afectadas
- `Usuario` (posible cambio de email)
- `Nutricionista` (todos los campos editables)
- `NutricionistaGimnasio` (cambio de asociación)

### Constraints
- `UNIQUE(usuario.email)` — chequeado en update.
- `UNIQUE(nutricionista.matricula)` — chequeado en update.

## UI / UX

### Pantalla: Detalle del nutricionista
- Campos editables inline o con botón "Editar".
- Si el actor es el propio nutricionista, solo ve los campos opcionales editables.
- Indicador visual de "datos auditados" tras guardar.
- Botón "Cambiar email" (solo admin) con flujo especial.

### Cambio de duración
- Modal con lista de turnos futuros que se verán afectados (duración no se modifica en ellos).
- Confirmación fuerte.

### Cambio de gimnasio
- Modal con lista de turnos futuros si se va a quitar asociación.
- Confirmación fuerte.

## Tests

### Unitarios
- `editar-nutricionista.use-case.ts`:
  - Edición admin feliz
  - Edición nutricionista con campos no permitidos → 403
  - Cambio de email duplicado
  - Cambio de duración con turnos futuros → warning
  - Edición de INACTIVO
  - B5: cambio de duración no modifica turnos existentes
- `cambiar-gimnasio.use-case.ts`:
  - Agregar gimnasio
  - Quitar gimnasio → cancela turnos futuros
  - Validar que solo admin puede
- `cambiar-email-admin.use-case.ts`:
  - Email duplicado → 409
  - Email nuevo se valida formato
  - Token de confirmación

## Notas
- El nutricionista NO puede cambiar email (RB53), DNI, matrícula ni duración de turno.
- El cambio de email por admin requiere confirmación (link al nuevo email).
- La edición de los gimnasios donde atiende se considera parte de esta feature. Ver §Endpoints.
- El nutricionista puede subir una nueva foto en cualquier momento (ver `archivos.md`).
- No hay confirmación de cambios por email al admin (se notifica al nutricionista y al admin recibe el alta de cambios).
- **Inconsistencia previa resuelta**: el spec anterior mencionaba "tarifa" como "datos sensibles" pero la decisión de Q&A final es que se muestra al socio (ver `10-ver-nutricionistas-disponibles.md`).
