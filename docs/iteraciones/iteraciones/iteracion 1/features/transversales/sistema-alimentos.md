# Sistema de alimentos

> **Source of truth**: `01-iteracion-base-nutricional.md` §4.1, §4.3.5
> **Stack**: MySQL 8.0+ (etiquetas como tabla relacionada, NO arrays PostgreSQL)
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `auth.md`, `notificaciones.md`, `auditoria.md`

## Descripción
Base de datos de alimentos con la que trabaja el sistema. Seed inicial con ~200 alimentos comunes. Permite **creación on-the-fly** por nutricionistas. Las modificaciones a un alimento afectan a los planes activos que lo referencian (decisión de Q&A: referencia viva, no snapshot). No se permite eliminar un alimento usado en planes (decisión de Q&A).

## Actores
- NUTRICIONISTA (CRUD + creación on-the-fly desde un plan)
- ADMIN (CRUD completo)

## Funcionalidades

### 1. Listar alimentos
- Búsqueda fuzzy por nombre.
- Filtros por alérgenos, intolerancias, kcal/100g, macros.
- Paginación.

### 2. Ver detalle de un alimento
- GET individual con todos los campos y etiquetas.

### 3. Crear alimento
- **On-the-fly** (desde un plan): el nutricionista agrega un alimento nuevo mientras arma un plan. Queda en la base con estado `activo=true` y `creado_por=nutricionista_id`.
- **Formal** (CRUD directo): el nutricionista o admin crea el alimento con todos los campos.
- Validación: nombre único, macros coherentes, alérgenos del catálogo.

### 4. Editar alimento
- Cambio de calorías, macros, alérgenos, intolerancias, nombre.
- **Referencia viva**: los planes activos que referencian este alimento reflejan los nuevos valores automáticamente (decisión de Q&A).
- Auditoría con antes/después.
- **Notificación al socio** si tiene plan activo con este alimento: "El alimento [nombre] fue actualizado por el nutricionista. Verificá que sigue siendo apropiado para vos." (decisión de seguridad).

### 5. Eliminar alimento
- **NO permitido si está en planes activos o históricos** (decisión de Q&A).
- Se puede **desactivar** (`activo=false`) sin eliminar.
- El alimento desactivado NO aparece en búsquedas ni en selectores de planes nuevos.
- Los planes activos que lo referencian lo siguen mostrando con badge "Alimento no disponible".

### 6. Seed inicial
- Script de seed con ~200 alimentos comunes al instalar el sistema.
- Incluye: nombre, calorías/100g, proteínas, carbohidratos, grasas, alérgenos, intolerancias.
- Alérgenos comunes: gluten, lácteos, huevos, soja, frutos secos, pescado, mariscos, sésamo, mostaza, apio.
- Intolerancias comunes: lactosa, gluten, fructosa, sorbitol.

## Reglas de negocio aplicadas
- **RB24**: Validación de ingredientes vs alergias en planes.
- **RB33**: Auditoría.

## Modelo de datos

### Entidad `Alimento`
- `id, nombre, calorias_por_100g, proteinas_g, carbohidratos_g, grasas_g, activo, creado_por, created_at, updated_at`

### Entidad `AlimentoAlergeno` (N:M con `Alergeno`)
- `id, alimento_id, alergeno_id`
- Tabla de catálogo de alérgenos separada (referenciada desde `alimento_alergeno`).

### Entidad `Alergeno` (catálogo)
- `id, nombre, descripcion, activo`
- Seed: gluten, lácteos, huevos, soja, frutos secos, pescado, mariscos, sésamo, mostaza, apio.

### Entidad `AlimentoIntolerancia` (N:M con `Intolerancia`)
- Similar estructura.

### Entidad `Intolerancia` (catálogo)
- `id, nombre, descripcion, activo`
- Seed: lactosa, gluten, fructosa, sorbitol.

### Constraints
- `UNIQUE(alimento.nombre)` (case-insensitive en app, COLLATE utf8mb4_unicode_ci en MySQL).
- `CHECK(alimento.calorias_por_100g >= 0)`.
- `CHECK(alimento.proteinas_g >= 0)`.
- `CHECK(alimento.carbohidratos_g >= 0)`.
- `CHECK(alimento.grasas_g >= 0)`.
- `UNIQUE(alimento_alergeno.alimento_id, alergeno_id)`.
- `UNIQUE(alimento_intolerancia.alimento_id, intolerancia_id)`.

### Índices
- `idx_alimento_nombre` (búsqueda).
- `idx_alimento_activo` (filtro de listados).
- `idx_alimento_alergeno_alimento_id` (join).
- `idx_alimento_intolerancia_alimento_id` (join).

## Endpoints API

### `GET /api/alimentos`
- **Auth**: cualquier usuario autenticado.
- **Query**:
  - `?nombre=...` (búsqueda fuzzy, MySQL `LIKE` con wildcards o full-text)
  - `?alergeno=gluten&alergeno=lacteos` (filtra alimentos SIN esos alérgenos, útil para fichas con alergias)
  - `?intolerancia=lactosa`
  - `?caloriasMin=0&caloriasMax=500`
  - `?activo=true|false` (default: true)
  - `?page=1&limit=20`
  - `?sort=nombre|calorias`
- **Response 200**:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "nombre": "Manzana",
        "caloriasPor100g": 52,
        "proteinasG": 0.3,
        "carbohidratosG": 14,
        "grasasG": 0.2,
        "activo": true,
        "alergenos": [],
        "intolerancias": []
      }
    ],
    "total": 234,
    "page": 1,
    "limit": 20
  }
  ```
- **Errors**: 400, 401, 500

### `GET /api/alimentos/:id`
- **Auth**: cualquier usuario autenticado.
- **Response 200**: detalle completo con etiquetas, fecha de creación, creado_por.
- **Errors**: 404, 500

### `POST /api/alimentos`
- **Auth**: NUTRICIONISTA, ADMIN.
- **Body**:
  ```json
  {
    "nombre": "Manzana Roja",
    "caloriasPor100g": 52,
    "proteinasG": 0.3,
    "carbohidratosG": 14,
    "grasasG": 0.2,
    "alergenoIds": [],
    "intoleranciaIds": []
  }
  ```
- **Response 201**: `{ id, ... }`.
- **Errors**: 400 (validación), 409 (nombre duplicado), 500

### `PATCH /api/alimentos/:id`
- **Auth**: NUTRICIONISTA (si es el creador), ADMIN.
- **Body**: cambios.
- **Side effect**:
  1. Actualiza alimento.
  2. Si cambió calorías/macros o alérgenos: notifica a socios con plan activo que lo referencia.
  3. Auditoría.
- **Response 200**: alimento actualizado.
- **Errors**: 400, 403, 404, 409 (nombre duplicado), 500

### `DELETE /api/alimentos/:id`
- **Auth**: NUTRICIONISTA (si es el creador), ADMIN.
- **Response 200/204`: éxito.
- **Errors**: 409 (usado en planes activos o históricos).

### `POST /api/alimentos/:id/desactivar`
- **Auth**: NUTRICIONISTA (si es el creador), ADMIN.
- **Body**: `{ motivo: string }`.
- **Side effect**: `activo=false`. NO error si está en planes.
- **Response 200**: `{ ok: true, activo: false }`.
- **Errors**: 400, 403, 404, 500

## Seed

Ubicación: `apps/backend/src/infrastructure/database/seeds/alimentos.seed.ts`

```typescript
const alimentosIniciales = [
  {
    nombre: 'Manzana',
    caloriasPor100g: 52,
    proteinasG: 0.3,
    carbohidratosG: 14,
    grasasG: 0.2,
    alergenos: [],
    intolerancias: [],
  },
  {
    nombre: 'Pollo (pechuga)',
    caloriasPor100g: 165,
    proteinasG: 31,
    carbohidratosG: 0,
    grasasG: 3.6,
    alergenos: [],
    intolerancias: [],
  },
  {
    nombre: 'Pan de trigo',
    caloriasPor100g: 265,
    proteinasG: 9,
    carbohidratosG: 49,
    grasasG: 3.2,
    alergenos: ['gluten'],
    intolerancias: ['gluten'],
  },
  // ... ~200 alimentos: carnes, pescados, lácteos, frutas, verduras, cereales, legumbres, etc.
];
```

### Alérgenos del seed
gluten, lácteos, huevos, soja, frutos secos, pescado, mariscos, sésamo, mostaza, apio.

### Intolerancias del seed
lactosa, gluten, fructosa, sorbitol.

## Búsqueda fuzzy

MySQL no tiene búsqueda fuzzy nativa como PostgreSQL `pg_trgm`. Opciones:

### Opción A: LIKE con wildcards (simple)
```sql
WHERE nombre LIKE '%manzan%'
```
- Pros: simple, MySQL 5.7+.
- Contras: no maneja typos, performance degrada con muchos registros.

### Opción B: FULLTEXT index (MySQL 5.6+)
```sql
WHERE MATCH(nombre) AGAINST('manzana*' IN BOOLEAN MODE)
```
- Pros: mejor performance, ranking.
- Contras: requiere configuración de `ft_min_word_len`, no maneja typos.

### Decisión: empezar con Opción A, migrar a FULLTEXT en iter 2+ si el volumen lo justifica.

## UI / UX

### Pantalla: Catálogo de alimentos (admin/nutricionista)
- Tabla con búsqueda y filtros.
- Botón "Nuevo alimento".
- Paginación.

### Búsqueda en plan (UX crítica)
- Al armar un plan, el nutricionista busca un alimento.
- Si no lo encuentra, botón "Crear nuevo alimento" → modal con campos.
- Al confirmar, el alimento se agrega al plan automáticamente (sin salir del flujo de creación del plan).

## Edge cases

- **B1**: Alimento creado on-the-fly usado en múltiples planes → funciona normal, el alimento queda en la base.
- **B2**: Modificación de calorías de alimento base → planes activos muestran nuevas calorías + notificación al socio (decisión de seguridad).
- **B3**: Eliminar alimento usado → rechazado con mensaje claro.
- **B4**: Doble creación on-the-fly simultánea con mismo nombre → UNIQUE constraint rechaza la segunda.
- **B5**: Alimento con etiquetas de alérgenos incompletas → warning al guardar.
- **B6**: Nutricionista A crea alimento, nutricionista B lo usa → permitido, la base es global.
- **B7**: Admin desactiva un alimento usado en planes activos → el alimento se oculta de selectores pero sigue visible en los planes con badge "No disponible".
- **B8**: Eliminar un alérgeno del catálogo (que está usado en alimentos) → cascade SET NULL o restricción. **Decisión**: no permitir eliminar alérgenos del catálogo en iter 1 (soft delete con `activo=false`).

## Reglas de negocio aplicadas
- **RB24**: Validación en planes.
- **RB33**: Auditoría.

## Tests

### Unitarios
- `crear-alimento.use-case.ts`:
  - Happy path
  - Nombre duplicado
  - Validación de campos (negativos, etc.)
- `editar-alimento.use-case.ts`:
  - Cambios afectan a planes activos
  - Notificación al socio si tiene plan con este alimento
  - Auditoría
- `eliminar-alimento.use-case.ts`:
  - Sin uso en planes → permitido
  - Con uso en planes → rechazado
- `desactivar-alimento.use-case.ts`:
  - Marca activo=false
  - NO falla si está en planes
- `listar-alimentos.use-case.ts`:
  - Búsqueda LIKE
  - Filtros por alérgenos/intolerancias
  - Paginación
  - Solo activos por default

## Notas
- La base de alimentos es **GLOBAL**, no por gimnasio. Un nutricionista en Gimnasio A puede ver y usar alimentos creados por un nutricionista de Gimnasio B.
- El nutricionista puede editar solo los alimentos que él creó (si no es admin). Decisión implícita de seguridad.
- En iter 1 no hay integración con API externa de alimentos (USDA, OpenFoodFacts). Se puede agregar en iter 2+.
- **Notificación al socio al editar alimento** es una decisión de seguridad para evitar que cambios silenciosos afecten su plan sin saberlo.
- La búsqueda fuzzy es simple en iter 1. FULLTEXT o trigram en iter 2+.
