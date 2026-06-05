# 08 — Completar ficha de salud

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-08
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `auth.md`, `notificaciones.md`, `compliance.md`

## Descripción
Permite al socio completar su ficha de salud estándar profesional por primera vez. La ficha es OBLIGATORIA antes de reservar turno (RB14). Incluye consentimiento expreso (RB44). Genera la primera `FichaSaludVersion` inmutable (RB50).

## Actores
- SOCIO

## Precondiciones
- El socio está autenticado.
- El socio NO tiene ficha completa (o su ficha está pendiente de consentimiento).

## Postcondiciones
- Ficha creada y marcada como COMPLETA.
- `FichaSaludVersion v1` creada e inmutable.
- `consent_at` registrado (RB44).
- Auditoría `accion=CREATE, entidad=ficha_salud`.

## Camino principal
1. Socio accede a "Mi ficha de salud".
2. Completa formulario con los campos obligatorios y opcionales.
3. Tilda el checkbox de **consentimiento expreso** (RB44).
4. Confirma.
5. Sistema valida en orden:
   - Altura: 1.0–2.5 m.
   - Peso: 20–300 kg.
   - Nivel de actividad ∈ {SEDENTARIO, LIGERO, MODERADO, INTENSO, MUY_INTENSO}.
   - Objetivo personal: no vacío.
   - Alergias, intolerancias, restricciones, observaciones: pueden ser texto libre o tags.
   - Embarazo/lactancia ∈ {NO, EMBARAZADA, LACTANDO}.
   - Consentimiento: true (RB44, obligatorio).
6. Crea en transacción:
   - `FichaSalud` con puntero a la versión actual y `completada=true, completada_at=now(), consent_at=now()`.
   - `FichaSaludVersion v1` con todos los datos.
7. Auditoría.
8. Mensaje: "Ficha de salud completada. Ya podés reservar turnos."

## Campos del formulario

### Obligatorios
| Campo | Tipo | Validación |
|---|---|---|
| Altura | number (m) | 1.0–2.5 |
| Peso actual | number (kg) | 20–300 |
| Nivel de actividad física | enum | SEDENTARIO, LIGERO, MODERADO, INTENSO, MUY_INTENSO |
| Objetivo personal | text | no vacío, max 500 chars |
| Alergias alimentarias | list<string> | puede ser vacío, pero debe estar presente |
| Intolerancias alimentarias | list<string> | puede ser vacío (lactosa, gluten, fructosa) |
| Patologías o condiciones relevantes | text | opcional en UI pero el campo existe |
| Restricciones alimentarias | list<string> | vegetariano, vegano, kosher, halal, celíaco, etc. |
| Observaciones generales | text | no vacío |
| Embarazo/lactancia | enum | NO, EMBARAZADA, LACTANDO |
| Consentimiento expreso | bool | DEBE ser true (RB44) |

### Opcionales
| Campo | Tipo |
|---|---|
| Medicación actual | text |
| Alimentos que no consume | list<string> |
| Fumador | enum {SI, NO, EX} |
| Consumo de alcohol | text (frecuencia/cantidad) |
| Horas de sueño | number |
| Antecedentes relevantes | text |
| Peso habitual | number (kg) |
| Peso máximo alcanzado | number (kg) |
| Peso mínimo reciente | number (kg) |
| Peso objetivo | number (kg) |

## Caminos alternativos
- **A1**: Faltan campos obligatorios → "Complete todos los campos obligatorios" con errores inline.
- **A2**: Valores fuera de rango (peso 20–300, altura 1.0–2.5) → error inline.
- **A3**: Consentimiento no tildado → "Necesitamos tu consentimiento expreso para almacenar tu información de salud".
- **A4**: Socio abandona el formulario → no se guarda nada (auto-guardado opcional, ver §Notas).

## Casos borde
- **B1**: Declara alergias graves → se almacenan sin acción especial; serán validadas al crear/editar plan (`20-crear-plan-alimentario.md`).
- **B2**: Texto libre con info sensible → aceptado, no validado (RB16 solo restringe a RECEPCIONISTA).
- **B3**: Socio carga la ficha minutos antes de una consulta → permitido, pero al abrir la consulta, el nutricionista ve "Ficha completada hace X minutos" (RB15).
- **B4**: Socio con peso habitual distinto al actual → permitido, son campos separados.
- **B5**: Embarazada o lactando → flag se muestra prominentemente en la ficha cuando el nutricionista la ve.

## Reglas de negocio aplicadas
- **RB14**: Ficha completa es obligatoria antes de reservar turno.
- **RB16**: RECEPCIONISTA no accede a datos clínicos.
- **RB42**: Ficha editable (ver `09-editar-ficha-salud.md`).
- **RB44**: Consentimiento obligatorio (`consent_at`).
- **RB50**: Historial de versiones.

## Eventos disparados
- `FICHA_COMPLETADA` → email al socio confirmando que ya puede reservar turnos.

## Auditoría
- `accion='CREATE'`, `entidad='ficha_salud'`, `entidad_id=socio_id`, `despues_json` con datos completos (sin campos clínicos innecesarios, solo confirm de creación).

## Criterios de aceptación
- [ ] Socio puede completar la ficha con todos los campos.
- [ ] Validación de rangos (peso, altura).
- [ ] Consentimiento es obligatorio.
- [ ] Ficha incompleta bloquea reserva de turno.
- [ ] El nutricionista puede ver la ficha de un socio con quien tuvo turno.
- [ ] RECEPCIONISTA no ve datos clínicos (verificable en endpoint).
- [ ] Historial de versiones se crea correctamente.
- [ ] Auditoría registrada.
- [ ] Test unitario: use-case `completar-ficha-salud.use-case.ts` cubre happy path, A1, A2, A3.

## Endpoints API

### `GET /api/socios/me/ficha-salud`
- **Auth**: SOCIO
- **Response 200**: ficha completa con la versión actual
- **Errors**: 404 (no tiene ficha)

### `POST /api/socios/me/ficha-salud`
- **Auth**: SOCIO
- **Body**: `CreateFichaSaludDto` con todos los campos
- **Response 201**: `{ id, version, completada: true }`
- **Errors**: 400 (validación, consentimiento), 500

### `GET /api/socios/:id/ficha-salud`
- **Auth**: NUTRICIONISTA (con RB13: solo si tuvo turno previo)
- **Response 200**: ficha completa
- **Errors**: 403, 404

## Modelo de datos

### Entidad `FichaSalud`
- `id, socio_id (UNIQUE), version_actual_id, completada, completada_at, actualizada_at, consent_at, revisada_por_nutricionista_at, created_at, updated_at`

### Entidad `FichaSaludVersion`
- `id, ficha_salud_id, socio_id, version, datos_json, created_at, created_by, motivo_cambio`
- `datos_json` contiene todos los campos de la ficha en esa versión.
- Inmutable: solo INSERT, no UPDATE ni DELETE.

### Constraints
- `UNIQUE(ficha_salud.socio_id)`
- `UNIQUE(ficha_salud_version.ficha_salud_id, version)`

## UI / UX

### Pantalla: Ficha de salud
- Wizard en una sola página con secciones:
  1. Datos antropométricos (altura, peso, objetivo)
  2. Hábitos (actividad, sueño, fumador, alcohol)
  3. Salud (alergias, intolerancias, patologías, medicación, embarazo/lactancia)
  4. Alimentación (restricciones, alimentos que no consume, hábitos)
  5. Antecedentes y objetivos (peso histórico, antecedentes, observaciones)
  6. Consentimiento
- Indicador de progreso de secciones completadas.
- Guardar parcial permitido (autosave cada X segundos en localStorage).
- Botón "Finalizar" solo habilitado cuando todos los obligatorios estén llenos y consentimiento tildado.

## Tests

### Unitarios
- `completar-ficha-salud.use-case.ts`:
  - Happy path con todos los campos
  - Happy path mínimos (solo obligatorios)
  - A1: falta campo obligatorio
  - A2: peso fuera de rango
  - A2: altura fuera de rango
  - A3: consentimiento false
  - B1: alergias graves (sin acción especial, se almacena)
  - B5: embarazo=lactando
- `consultar-ficha-salud.use-case.ts` (nutricionista):
  - Con turno previo → permite ver
  - Sin turno previo → 403

## Notas
- La ficha NO se auto-guarda en backend. Se auto-guarda en localStorage del browser y se envía completa al confirmar. Decisión: por simplicidad.
- El campo `consent_at` se setea UNA VEZ al completar por primera vez. En ediciones (CU-09) NO se vuelve a pedir consentimiento.
- Cuando el nutricionista abre la ficha, se setea automáticamente `revisada_por_nutricionista_at` (RB45).
