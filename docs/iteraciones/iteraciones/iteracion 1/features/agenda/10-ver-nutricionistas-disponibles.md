# 10 — Ver nutricionistas disponibles

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-10
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `04-configurar-disponibilidad-semanal.md`, `08-completar-ficha-salud.md`, `11-reservar-turno.md`

## Descripción
Permite al socio ver el catálogo de nutricionistas activos del gimnasio, ver el detalle de cada uno (perfil completo con formación, certificaciones y tarifa — decisión de Q&A: mostrar todo para generar confianza), ver la disponibilidad de slots y acceder a la reserva de turnos (CU-11).

## Actores
- SOCIO

## Precondiciones
- Socio autenticado.
- Pertenece a un gimnasio.

## Postcondiciones
- Listado de nutricionistas activos del gimnasio mostrado.
- (Sin cambios en datos, es solo lectura.)

## Camino principal
1. Socio accede a "Nutricionistas" o "Buscar profesionales".
2. Sistema muestra todos los nutricionistas **activos** del gimnasio del socio (RB17, filtro `estado='ACTIVO'`, `setup_operativo=true` o `wizard_completado=true`).
3. Socio puede filtrar por:
   - **Nombre** (búsqueda parcial, case-insensitive, `LIKE` o full-text).
   - **Disponibilidad** (slots en los próximos X días).
4. **Paginación**: 20 items por página default.
5. Click en un nutricionista → ver detalle (ver `15-ver-perfil-profesional.md`).
6. Desde el detalle, "Reservar turno" → `11-reservar-turno.md`.

## Datos visibles del nutricionista (DECISIÓN: mostrar todo al socio)

**Decisión de Q&A**: el socio ve **toda** la información del nutricionista para generar confianza y transparencia. Esto incluye:
- Foto de perfil
- Nombre, apellido
- Matrícula profesional
- Presentación
- Formación
- Certificaciones
- Tarifa por sesión
- Años de experiencia
- Género (si lo completó)

NO se muestra:
- Email (privado, solo contacto via sistema)
- Teléfono personal (no hay en el modelo)
- Datos administrativos (gimnasios donde atiende, fecha de alta)

## Caminos alternativos
- **A1**: Sin nutricionistas activos en el gimnasio → "No hay nutricionistas disponibles en este momento".
- **A2**: Socio sin ficha completa → puede ver el listado, pero el botón "Reservar" redirige a completar ficha primero (RB14). El catálogo se muestra igual.
- **A3**: Filtros sin resultados → "Ajustá los filtros. No hay coincidencias." con botón "Limpiar filtros".

## Casos borde
- **B1**: Nutricionista se desactiva mientras el socio navega → siguiente request devuelve el listado actualizado.
- **B2**: Socio intenta ver slots fuera del límite de 60 días (RB07) → la UI solo muestra hasta 60 días.
- **B3**: Nutricionista en varios gimnasios → se muestra solo en el gimnasio del socio (multi-tenant).
- **B4**: Filtro por disponibilidad cuando el nutricionista no tiene slots → "Sin horarios disponibles" en su detalle.
- **B5**: Nutricionista con `wizard_completado=false` (no terminó setup) → **NO aparece en el listado** (no tiene disponibilidad, no está operativo).
- **B6**: Paginación con URL modificada manualmente → validar límites server-side (no permitir `page=-1` o `limit=10000`).

## Reglas de negocio aplicadas
- **RB07**: Solo muestra slots hasta 60 días.
- **RB14**: Ficha completa para reservar (no para ver).
- **RB17**: Solo nutricionistas activos.
- **RB25**: Filtrado por gimnasio del socio.

## Endpoints API

### `GET /api/nutricionistas`
- **Auth**: cualquier usuario autenticado (filtros aplicados según rol).
- **Query**:
  - `?gimnasioId=...` (opcional, default: gimnasio del usuario)
  - `?nombre=...` (búsqueda parcial)
  - `?disponible=true` (filtra los que tienen slots en los próximos 7 días)
  - `?page=1&limit=20` (paginación)
  - `?sort=nombre|disponible|recientes` (default: nombre alfabético)
- **Response 200**:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "nombre": "Juan",
        "apellido": "Pérez",
        "matricula": "MN-12345",
        "fotoUrl": "https://...",
        "presentacion": "Nutricionista deportivo con 10 años de experiencia...",
        "duracionTurnoMin": 30,
        "tarifaSesion": 5000,
        "aniosExperiencia": 10,
        "genero": "M",
        "tieneSlotsDisponibles": true,
        "proximosSlotsCount": 12
      }
    ],
    "total": 8,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
  ```
- **Errors**: 400 (page/limit inválidos), 401, 403, 500

### `GET /api/nutricionistas/:id`
- **Auth**: cualquier usuario autenticado (datos públicos del nutri).
- **Response 200**: detalle completo del nutricionista con formación, certificaciones, tarifa, etc.
- **Errors**: 404

### `GET /api/nutricionistas/:id/slots`
- **Auth**: SOCIO autenticado.
- **Query**:
  - `?fechaDesde=...&fechaHasta=...` (default: próximos 60 días desde `now() + 2h`)
  - `?duracionMin=...` (default: la del nutricionista)
- **Response 200**:
  ```json
  {
    "nutricionistaId": "uuid",
    "duracionMin": 30,
    "slots": [
      { "fechaHora": "2026-06-15T14:00:00.000Z", "disponible": true },
      { "fechaHora": "2026-06-15T14:30:00.000Z", "disponible": true }
    ]
  }
  ```
- **Cálculo**: en backend, se calculan slots on-demand (ver `04-configurar-disponibilidad-semanal.md` §Cálculo de slots). NO se persisten.
- **Errores**: 404, 500

## Modelo de datos

### Entidades consultadas
- `Nutricionista` (filtro `estado='ACTIVO'`, gimnasio del socio)
- `NutricionistaGimnasio` (asociación con gimnasio, `estado='ACTIVO'`)
- `DisponibilidadSemanal` (para calcular slots)
- `ExcepcionDisponibilidad` (para excluir slots bloqueados)
- `Turno` (para excluir slots ocupados con `estado IN ('CONFIRMADO', 'PRESENTE', 'EN_CURSO')`)

### Índices necesarios
- `idx_nutricionista_gimnasio_estado (gimnasio_id, estado)`: filtro rápido del catálogo.
- `idx_disponibilidad_nutri (nutricionista_gimnasio_id, dia_semana)`: cálculo de slots.
- `idx_excepcion_nutri_fecha (nutricionista_gimnasio_id, fecha)`: exclusión de slots bloqueados.
- `idx_turno_slot_ocupado (nutricionista_gimnasio_id, fecha_hora, estado)`: exclusión de slots ocupados.

## UI / UX

### Pantalla: Listado de nutricionistas
- Header: título "Nutricionistas" + contador total.
- Filtros arriba:
  - Barra de búsqueda por nombre.
  - Toggle "Con disponibilidad esta semana" (default: ON).
  - Selector de orden (alfabético / con más disponibilidad / recientes).
- Grid de cards (3 columnas desktop, 1 mobile):
  - Foto (circular, 80×80).
  - Nombre + matrícula.
  - Presentación (truncada a 2 líneas).
  - Badge "X slots esta semana" si hay disponibilidad.
  - Botón "Ver perfil".
- Si socio sin ficha: banner amarillo arriba "Completá tu ficha para poder reservar turnos".
- Paginación al final.

### Pantalla: Detalle del nutricionista (link al spec 15)
- Ver `15-ver-perfil-profesional.md`.

## Edge cases

- **B7**: Foto de perfil no subida → placeholder genérico (silueta).
- **B8**: Nutricionista sin slots próximos (ej. acaba de configurar disponibilidad pero para más adelante) → se muestra igual, badge "Sin slots esta semana, próximo en [fecha]".
- **B9**: Gimnasio sin nutricionistas activos → pantalla de "empty state" con ilustración.
- **B10**: Búsqueda con caracteres especiales (ej. "O'Brien") → escape SQL/LIKE.
- **B11**: Límite de gimnasio (gimnasio con 50+ nutricionistas) → paginación obligatoria, no devolver todos.

## Tests

### Unitarios
- `listar-nutricionistas.use-case.ts`:
  - Solo activos
  - Solo del gimnasio del socio
  - Filtro por nombre (case-insensitive)
  - Filtro por disponibilidad
  - Paginación correcta
  - Validación de `page >= 1`, `limit <= 100`
- `obtener-detalle-nutricionista.use-case.ts`:
  - Retorna datos completos
  - Solo del gimnasio del socio
- `obtener-slots-nutricionista.use-case.ts`:
  - Calcula slots correctamente (ver `04`)
  - Excluye slots ocupados
  - Excluye excepciones
  - Filtra por ≥2h de anticipación
  - Filtra por ≤60 días

### Integración
- Flujo end-to-end: socio ve listado → click en nutricionista → ve detalle → ve slots → reserva turno.

## Notas
- La información del nutricionista es **toda pública** para socios del mismo gimnasio (decisión de Q&A).
- El catálogo es solo del gimnasio del socio (multi-tenant).
- El listado NO incluye nutricionistas que aún no terminaron su wizard (B5).
- **Referencia al detalle del perfil**: ver `15-ver-perfil-profesional.md` (feature separada, creada en este spec).
