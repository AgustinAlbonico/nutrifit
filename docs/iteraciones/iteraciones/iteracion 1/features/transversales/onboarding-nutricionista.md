# Onboarding del nutricionista

> **Source of truth**: `01-iteracion-base-nutricional.md` §13.2, RB03, RB04, RB38
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `auth.md`, `01-registrar-nutricionista.md`, `04-configurar-disponibilidad-semanal.md`, `notificaciones.md`

## Descripción
Wizard de setup post-registro del nutricionista. Cambio de contraseña (forzado en primer login) → completar perfil (foto, presentación opcional) → configurar disponibilidad semanal. Sin disponibilidad, el nutricionista es **invisible en el catálogo público del socio** y no recibe turnos. El admin puede forzar `wizard_completado=true` para saltar el wizard (caso de migración o carga inicial).

## Actores
- NUTRICIONISTA (cursa el wizard)
- ADMIN (puede forzar o reiniciar el wizard)

## Precondiciones
- Nutricionista autenticado.
- Nutricionista con `rol='NUTRICIONISTA'`.
- Si `debe_cambiar_password=true` (primer login): paso 1 obligatorio antes de avanzar.

## Postcondiciones
- `nutricionista.wizard_completado=true` cuando completa el paso 3.
- `nutricionista.setup_operativo=true` cuando tiene disponibilidad configurada (≥1 día con ≥1 rango válido).
- Auditoría con cada cambio de paso.

## Camino principal (3 pasos)

### Paso 1: Cambio de contraseña
1. Nutricionista entra por primera vez (después de login con contraseña provisional).
2. Banner prominente: "Por seguridad, cambiá tu contraseña antes de continuar".
3. Formulario: contraseña actual + nueva + confirmación.
4. Validación: nueva cumple política (RB32: 12 chars, 1 may, 1 min, 1 num, 1 símb).
5. Confirma → backend cambia contraseña (ver `auth.md` §4), setea `debe_cambiar_password=false`, registra auditoría.
6. Marca `wizard_step='perfil'`, avanza.

### Paso 2: Completar perfil (opcional pero recomendado)
1. Formulario: foto de perfil, presentación profesional, formación, certificaciones, tarifa sesión, años experiencia, género, fecha nacimiento, teléfono.
2. Todos los campos son opcionales. Si no quiere completar, puede saltar.
3. Confirmar → backend persiste cambios, registra auditoría.
4. Marca `wizard_step='disponibilidad'`, avanza.

### Paso 3: Configurar disponibilidad semanal
1. Redirige a `04-configurar-disponibilidad-semanal.md`.
2. Nutricionista define duración única de turno (minutos, >0) y rangos por día.
3. Validaciones: RB03 (duración única), RB04 (no solapamiento), fin > inicio.
4. Backend persiste disponibilidad.
5. Si al guardar hay ≥1 rango válido → `setup_operativo=true`.
6. Marca `wizard_completado=true`, `wizard_step='completado'`.
7. Mensaje: "¡Listo! Ya estás operativo. Empezarás a recibir turnos."

## Caminos alternativos

### A1: Nutricionista creado con `wizard_completado=true` (migración o carga inicial)
- El wizard no se muestra.
- Si admin lo resetea (endpoint), el wizard vuelve a aparecer desde el paso 1.

### A2: Nutricionista ya cambió contraseña antes (por error o flujo de admin)
- El paso 1 se marca como completado automáticamente, salta al paso 2.

### A3: Nutricionista con disponibilidad preexistente (migración)
- El paso 3 se marca como completado, salta al paso final.
- `setup_operativo=true` se setea en la migración.

### A4: Nutricionista con `debe_cambiar_password=false` (cambió en otro momento)
- El paso 1 se salta.

## Casos borde

### B1: Nutricionista abandona el wizard
- El flag `wizard_step` persiste en el último paso incompleto.
- Al volver a entrar, el wizard retoma desde ese paso.
- La app puede mostrar un banner persistente "Tenés el wizard incompleto" hasta que termine.

### B2: Nutricionista con 0 rangos configurados (no terminó paso 3)
- `setup_operativo=false`.
- **Crítico**: el nutricionista NO aparece en el catálogo público del socio (RB17 + este spec).
- La app le muestra un warning "Configurá tu disponibilidad para empezar a recibir turnos".
- Puede seguir editando su perfil, pero no recibe turnos.

### B3: Re-wizard (admin resetea el flag)
- Admin usa endpoint `POST /api/nutricionistas/:id/wizard-reiniciar`.
- El nutricionista vuelve a ver el wizard desde el paso 1.
- Auditoría registra el reinicio.

### B4: Cambio de contraseña olvidado después de 7 días de emitida la provisional
- La contraseña provisional expira (ver `auth.md`).
- El nutricionista no puede loguearse. Admin debe resetear contraseña desde panel.

### B5: Nutricionista con 0 turnos históricos al completar el wizard
- No aplica restricción. Cualquier nutricionista puede completar el wizard.

### B6: Admin edita el nutricionista y resetea el wizard
- `wizard_completado=false`, `wizard_step='password'`.
- Próximo login del nutricionista verá el wizard desde el paso 1.

## Reglas de negocio aplicadas
- **RB03**: Duración única por nutricionista.
- **RB04**: No solapamiento de rangos.
- **RB17**: Nutricionista inactivo no aparece en listados.
- **RB32**: Contraseña provisional 12 chars.
- **RB38**: Forzar cambio en primer login.

## Eventos disparados
- `NUTRICIONISTA_WIZARD_COMPLETADO` → email al nutricionista con bienvenida, email al admin.
- `NUTRICIONISTA_WIZARD_PASO_COMPLETADO` → in-app, sin email (interno).

## Auditoría
- `accion='WIZARD_STEP'`, `entidad='nutricionista'`, `despues_json` con `wizard_step` nuevo.
- `accion='WIZARD_COMPLETED'`, `entidad='nutricionista'`, al completar.
- `accion='WIZARD_RESET'`, `entidad='nutricionista'`, cuando admin resetea.
- `accion='CHANGE_PASSWORD'` (cubierto por `auth.md`).

## Criterios de aceptación
- [ ] Nutricionista es forzado a cambiar contraseña en primer login.
- [ ] Puede completar perfil opcional (todos los campos son opcionales).
- [ ] Configurar disponibilidad valida RB03 y RB04.
- [ ] Sin disponibilidad, NO aparece en catálogo público del socio.
- [ ] Banner persistente muestra "wizard incompleto" hasta terminar.
- [ ] Admin puede forzar `wizard_completado=true` o reiniciar.
- [ ] Auditoría de cada paso y del reset.
- [ ] Test unitario: use-cases `obtener-estado-wizard-nutri`, `completar-paso-wizard-nutri`, `reiniciar-wizard-nutri`.

## Endpoints API

### `GET /api/nutricionistas/me/wizard-estado`
- **Auth**: NUTRICIONISTA
- **Response 200**:
  ```json
  {
    "wizardStep": "password" | "perfil" | "disponibilidad" | "completado",
    "wizardCompletado": false,
    "debeCambiarPassword": true,
    "setupOperativo": false,
    "siguienteAccion": "cambiar_password" | "completar_perfil" | "configurar_disponibilidad" | null
  }
  ```
- **Errors**: 401, 500

### `POST /api/nutricionistas/me/wizard-completar-paso`
- **Auth**: NUTRICIONISTA
- **Body**: `{ step: 'password' | 'perfil' | 'disponibilidad' }`
  - Para `step='password'`: requiere `{ currentPassword, newPassword }` (ver `auth.md`).
  - Para `step='perfil'`: requiere `{ foto?, presentacion?, formacion?, certificaciones?, tarifaSesion?, aniosExperiencia?, genero?, fechaNacimiento?, telefono? }`.
  - Para `step='disponibilidad'`: requiere `{ duracionTurnoMin, rangos: [...] }` (ver `04-configurar-disponibilidad-semanal.md`).
- **Response 200**:
  ```json
  {
    "ok": true,
    "wizardStep": "perfil",
    "wizardCompletado": false,
    "siguienteAccion": "completar_perfil"
  }
  ```
- **Errors**: 400 (validación), 401, 500

### `POST /api/nutricionistas/me/wizard-saltar-paso`
- **Auth**: NUTRICIONISTA
- **Body**: `{ step: 'perfil' }` (solo perfil es salteable; password y disponibilidad no)
- **Response 200**: `{ ok: true, wizardStep }`
- **Errors**: 400 (paso no salteable), 401, 500

### `POST /api/nutricionistas/:id/wizard-reiniciar`
- **Auth**: ADMIN
- **Body**: `{ motivo: string }`
- **Response 200**: `{ ok: true, wizardStep: 'password', wizardCompletado: false }`
- **Side effect**: nutricionista vuelve a ver el wizard desde el paso 1 en su próximo login.
- **Errors**: 400, 403, 404, 500

### `POST /api/nutricionistas/:id/wizard-forzar-completado`
- **Auth**: ADMIN
- **Body**: `{ motivo: string }`
- **Response 200**: `{ ok: true, wizardCompletado: true }`
- **Side effect**: salta el wizard para este nutricionista (caso de migración o carga inicial).
- **Errors**: 400, 403, 404, 500

## Modelo de datos

### Entidad `Nutricionista` (campos nuevos)
- `wizard_step: enum('PASSWORD','PERFIL','DISPONIBILIDAD','COMPLETADO')` (default 'PASSWORD')
- `wizard_completado: boolean` (default false)
- `setup_operativo: boolean` (default false, se setea true cuando tiene ≥1 rango en disponibilidad)

### Constraints
- `CHECK(NOT wizard_completado OR wizard_step = 'COMPLETADO')` (consistencia)

### Cálculo de `setup_operativo`
- Se recalcula en cada cambio de disponibilidad:
  - `setup_operativo = (count(DisponibilidadSemanal WHERE nutricionista_gimnasio_id = X) >= 1)`.
- Trigger o use-case que actualiza este flag.

## UI / UX

### Layout del wizard
- Top: barra de progreso (3 pasos).
- Sidebar: ayuda contextual del paso actual + progreso.
- Footer: botones "Atrás" / "Siguiente" / "Saltar este paso" (donde aplique).
- Header con el nombre del nutricionista.

### Indicadores
- Si wizard incompleto: badge en el sidebar + banner persistente.
- Si wizard completo: el banner desaparece, el nutricionista ve su agenda directamente.

### Estados visuales
- Paso completado: check verde.
- Paso actual: highlight azul.
- Paso futuro: gris.

## Edge cases (resumidos)

| Caso | Comportamiento |
|---|---|
| Nutricionista nunca terminó paso 1 | No puede avanzar, no recibe turnos |
| Nutricionista terminó paso 1 y 2 pero no 3 | Puede usar la app pero no recibe turnos (setup_operativo=false) |
| Admin reinicia el wizard | Próximo login ve el wizard desde paso 1 |
| Nutricionista cambia de gimnasio | El wizard NO se reinicia (es por nutricionista, no por asociación a gimnasio) |

## Tests

### Unitarios
- `obtener-estado-wizard-nutri.use-case.ts`:
  - Nutricionista nuevo → wizardStep='PASSWORD', debeCambiarPassword=true
  - Nutricionista que cambió pass pero no completó perfil → wizardStep='PERFIL'
  - Nutricionista completo → wizardStep='COMPLETADO', wizardCompletado=true
  - Nutricionista sin disponibilidad → setupOperativo=false
- `completar-paso-wizard-nutri.use-case.ts`:
  - Paso password feliz
  - Paso password con currentPassword incorrecto
  - Paso perfil salteado
  - Paso disponibilidad con validación RB04 (solapamiento)
  - Marca wizard_completado=true al completar paso 3
- `saltar-paso-w nutri.use-case.ts`:
  - Saltar perfil OK
  - Intentar saltar password → 400
  - Intentar saltar disponibilidad → 400
- `reiniciar-wizard-nutri.use-case.ts`:
  - Solo ADMIN
  - Motivo obligatorio
  - Auditoría
- `forzar-completado-nutri.use-case.ts`:
  - Solo ADMIN
  - Motivo obligatorio
  - Marca wizard_completado=true, setup_operativo=true (asume admin ya configuró disponibilidad por su cuenta)

## Notas
- El wizard es OPTATIVO en el sentido de que el nutricionista puede navegar la app sin terminarlo, pero no recibe turnos.
- El admin es el ÚNICO que puede saltar pasos no permitidos para el nutricionista (password, disponibilidad).
- Si el nutricionista completa el wizard y luego el admin le desasocia un gimnasio, NO se reinicia el wizard. La asociación a gimnasios es ortogonal.
- Las notificaciones sobre el wizard son in-app + email solo al completar (no spam).
