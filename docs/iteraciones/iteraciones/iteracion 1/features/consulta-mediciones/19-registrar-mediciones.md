# 19 — Registrar mediciones

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-19
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `18-registrar-consulta.md`, `archivos.md`, `23-ver-progreso-socio.md`

## Descripción
Permite al nutricionista registrar mediciones físicas del socio durante una consulta. Mediciones cargadas SOLO por el nutricionista (RB46), siempre atadas a un turno (RB47), y visibles al socio solo cuando se cierra la consulta (RB48). Notas privadas del nutricionista (RB49). IMC congelado con altura al momento (RB21). Fotos de progreso: 4 fotos por medición.

## Actores
- NUTRICIONISTA (único)

## Precondiciones
- Nutricionista autenticado.
- Turno en PRESENTE/EN_CURSO/REALIZADO (RB13).
- Socio vinculado.

## Postcondiciones
- Medición guardada con `turno_id` (RB47).
- IMC calculado con `altura_al_momento` (RB21).
- `publicada_at IS NULL` (se setea al cerrar consulta, RB48).
- 4 fotos de progreso cargadas (opcional).
- Notas privadas (opcional, RB49).
- Auditoría.

## Camino principal
1. Nutricionista, dentro de una consulta (o desde un turno), click "Registrar medición".
2. Completa formulario:
   - **Peso** (kg, 20–300).
   - **Altura al momento** (m, 1.0–2.5). Se toma de la ficha del socio como default pero se puede ajustar (ej. si el socio creció en un adolescente).
   - **IMC** (calculado automáticamente: peso / (altura/100)²).
   - **Perímetros** (cm, todos opcionales): cintura, cadera, pecho, brazo, muslo.
   - **Composición corporal** (% , todos opcionales): grasa corporal, masa muscular, grasa visceral.
   - **Notas privadas** (texto, opcional, RB49).
   - **Fotos de progreso** (opcional, hasta 4): frente, perfil_izq, perfil_der, espalda.
3. Sistema valida rangos razonables.
4. Guarda con `fecha=now()` (o fecha indicada por el nutricionista).
5. `publicada_at` queda NULL.
6. Al cerrar la consulta, `publicada_at=now()` (RB48).
7. Auditoría.

## Caminos alternativos
- **A1**: Falta altura → IMC no se calcula, warning "Sin altura no se puede calcular IMC".
- **A2**: Peso/altura fuera de rango → error inline.
- **A3**: Omite mediciones opcionales → permitido.
- **A4**: Dos mediciones el mismo día → warning "Ya existe una medición hoy. ¿Reemplazar o crear nueva?".
- **A5**: Foto inválida (muy grande, formato no permitido) → ver `archivos.md`, no se sube la foto individual.

## Casos borde
- **B1**: Corregir una medición anterior → permitido con `editada_at` y motivo. IMC histórico NO se recalcula (RB21).
- **B2**: Cambio de altura que recalcularía IMC histórico → NO sucede, cada medición tiene su `altura_al_momento`.
- **B3**: Subir menos de 4 fotos → permitido (puede subir 1, 2, 3 o 4).
- **B4**: Misma foto subida dos veces (mismo archivo) → se suben ambas con UUIDs distintos.
- **B5**: Foto con información personal identificable (ej. tatuaje, rostro) → aceptado, no se valida automáticamente. Decisión de UX.
- **B6**: Eliminar foto después de subida → permitido, queda en historial de cambios del archivo (no implementado en iter 1, simplemente se borra el path en DB).
- **B7**: Notas privadas que el socio podría ver si el nutricionista las escribe por error → UI marca explícitamente "Notas privadas, no las ve el socio".

## Reglas de negocio aplicadas
- **RB13**: Socio vinculado.
- **RB21**: IMC con `altura_al_momento`.
- **RB33**: Auditoría.
- **RB46**: Solo nutricionista carga.
- **RB47**: Atada a turno (`turno_id` NOT NULL).
- **RB48**: Visible al socio solo al cerrar consulta.
- **RB49**: Notas privadas del nutricionista.

## Endpoints API

### `POST /api/turnos/:turnoId/mediciones`
- **Auth**: NUTRICIONISTA (del turno)
- **Body**: `CreateMedicionDto`
- **Response 201**: `{ id, ... }`
- **Errors**: 400, 403, 404, 500

### `PATCH /api/mediciones/:id`
- **Auth**: NUTRICIONISTA (dueño)
- **Body**: `{ motivoEdicion: string, ...campos }`
- **Response 200**: medición actualizada
- **Errors**: 400, 403, 404, 500

### `POST /api/mediciones/:id/fotos`
- **Auth**: NUTRICIONISTA (dueño)
- **Body**: multipart con archivo + tipo (frente, perfil_izq, perfil_der, espalda)
- **Response 200**: `{ id, url }`
- **Errors**: 400, 413, 500

### `GET /api/mediciones/:id/fotos`
- **Auth**: NUTRICIONISTA, SOCIO (solo si `publicada_at IS NOT NULL`)
- **Response 200**: `[{ id, tipo, url, orden }]`

## Modelo de datos

### Entidad `Medicion`
- `id, socio_id, nutricionista_gimnasio_id, turno_id, fecha, peso, altura_al_momento, imc, cintura, cadera, pecho, brazo, muslo, grasa_corporal, masa_muscular, grasa_visceral, notas_privadas_nutricionista, publicada_at, created_at, updated_at, editada_at, motivo_edicion`

### Entidad `FotoProgreso`
- `id, medicion_id, tipo, archivo_path, orden, created_at`

### Constraints
- `medicion.turno_id NOT NULL` (RB47).
- `foto_progreso.tipo IN ('frente', 'perfil_izq', 'perfil_der', 'espalda')`.

## UI / UX

### Pantalla: Registrar medición (dentro de consulta o desde turno)
- Formulario organizado:
  - **Antropometría**: peso, altura, IMC (calculado).
  - **Perímetros**: cintura, cadera, pecho, brazo, muslo.
  - **Composición**: % grasa, % músculo, grasa visceral.
  - **Notas privadas** (con aviso explícito: "Estas notas no las ve el socio").
  - **Fotos de progreso**: 4 slots con preview.
- Validación inline.
- Botón "Guardar" siempre habilitado si datos mínimos OK.

## Cálculo del IMC

```typescript
function calcularIMC(peso: number, altura: number): number {
  // peso en kg, altura en metros
  const alturaEnCm = altura * 100;
  return peso / Math.pow(alturaEnCm / 100, 2);
  // Equivalente: peso / (altura^2)
}
```

Decimales: 2 dígitos.

## Tests

### Unitarios
- `crear-medicion.use-case.ts`:
  - Happy path
  - A1: falta altura → IMC null
  - A2: peso fuera de rango
  - A4: dos mediciones mismo día → warning
  - B1: corrección con motivo
- `cargar-foto-progreso.use-case.ts`:
  - Subir 4 fotos
  - Subir menos de 4
  - Formato inválido
  - Tamaño >5MB

## Notas
- Las fotos de progreso son archivos físicos en `apps/backend/uploads/{gimnasio_id}/fotos-progreso/{uuid}.{ext}`.
- Las notas privadas son TEXTO PLANO, no se encriptan en iter 1 (RB11.4: cifrado en reposo NO en iter 1).
- Al nutricionista corregir una medición histórica, se le advierte "El IMC se mantiene con la altura original, ¿continuar?".
