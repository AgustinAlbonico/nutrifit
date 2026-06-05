# Manejo de archivos y adjuntos

> **Source of truth**: `01-iteracion-base-nutricional.md` §10
> **Stack**: MySQL 8.0+ (sin jsonb)
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `auth.md`, `multi-tenant.md`, `auditoria.md`

## Descripción
Sistema de upload, storage, validación y entrega de archivos: foto de perfil, diploma, adjuntos de consulta, fotos de progreso, logo del gimnasio. Storage en filesystem local en iter 1. Validación con magic numbers + ClamAV. Headers de seguridad HTTP. Manejo de archivos huérfanos. Decisión sobre endpoint genérico vs específicos: **se usa el endpoint específico por dominio** (más trazable, mejor RBAC).

## Decisión arquitectónica: endpoint específico, NO genérico

**Decisión**: cada feature tiene su propio endpoint de upload específico (ej. `POST /api/nutricionistas/:id/foto-perfil`). NO se usa un endpoint genérico `POST /api/archivos/upload`.

**Razones**:
- **RBAC más claro**: el controller ya valida el rol y ownership de la entidad dueña.
- **Trazabilidad**: el archivo se asocia a la entidad en la misma transacción.
- **Validación contextual**: el controller puede aplicar validaciones adicionales según el tipo (ej. dimensiones mínimas para foto de progreso).

El servicio `ArchivoService.upload()` interno es **genérico y reutilizable** (recibe `tipo`, `archivo`, `metadata`), pero los endpoints HTTP son específicos.

## Tipos de archivos soportados

| Tipo | Formatos | Tamaño máx | Dimensiones | Endpoints específicos |
|---|---|---|---|---|
| Foto de perfil nutri | jpg, jpeg, png, webp | 5 MB | ≤4000×4000, ≥200×200 | `POST /api/nutricionistas/:id/foto-perfil` |
| Foto de perfil socio | jpg, jpeg, png, webp | 5 MB | ≤4000×4000, ≥200×200 | `POST /api/socios/:id/foto-perfil` |
| Diploma/matrícula | pdf, jpg, png | 10 MB | PDF ≤5 páginas, img ≤4000×4000 | `POST /api/nutricionistas/:id/diploma` |
| Adjuntos de consulta | pdf, jpg, png, docx | 10 MB | — | `POST /api/consultas/:id/adjuntos` |
| Fotos de progreso | jpg, jpeg, png, webp | 5 MB c/u | ≥640×480, ≤4000×4000 | `POST /api/mediciones/:id/fotos` (hasta 4) |
| Logo gimnasio | svg, png, jpg | 2 MB | svg saneado, img ≤2000×2000 | `PATCH /api/gimnasios/me/logo` |
| Archivos de supresión | (soft delete) | — | — | no aplica |

## Actores
- NUTRICIONISTA, SOCIO, ADMIN, RECEPCIONISTA (según endpoint específico)

## Funcionalidades

### 1. Upload (por endpoint específico)
- Recibe `multipart/form-data` con el archivo.
- Validación en orden:
  1. **Magic numbers** (NO solo extensión): usar `file-type` para verificar que el MIME real coincide con la extensión declarada.
  2. **Tamaño**: rechazar si excede el límite del tipo.
  3. **Antivirus (ClamAV)**: escaneo del archivo antes de almacenar.
  4. **Validación específica del tipo**:
     - Imágenes: usar `sharp` para validar dimensiones (mín/máx).
     - PDFs: usar `pdf-lib` o `pdf-parse` para contar páginas.
     - SVG: usar `DOMPurify` para sanear y eliminar `<script>`.
- Storage en `apps/backend/uploads/{gimnasio_id}/{tipo}/{uuid}.{ext}`.
- Nombre: UUID v4 (NUNCA el nombre original).
- Headers HTTP en la respuesta de download: `Content-Disposition: attachment; filename="..."` + `X-Content-Type-Options: nosniff`.
- Auditoría `CREATE` o `UPDATE` con la entidad dueña.

### 2. Download
- Endpoint: `GET /api/archivos/:id` (genérico para download, autorización contextual).
- Auth varía según tipo (ver §Matriz de autorización).
- Headers: `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'`.
- Para fotos de perfil y logos: se sirven con cache HTTP (1 día).
- Para otros: sin cache.

### 3. Eliminación (soft delete)
- Endpoint: `DELETE /api/archivos/:id`.
- Marca `deleted_at=now()` en la tabla `archivo`.
- El archivo físico NO se borra inmediatamente (decisión de compliance).
- Job cleanup (futuro, iter 2+): borra físicamente archivos con `deleted_at < now() - INTERVAL '2 years'`.

### 4. Cleanup de archivos huérfanos
- **Problema**: si un archivo se sube a storage temporal durante una transacción, pero la transacción falla (ej. crear nutricionista falla por matrícula duplicada), el archivo queda en disco sin asociación en DB.
- **Solución**:
  1. Upload a staging: `apps/backend/uploads/staging/{uuid}.{ext}` (NO al path final).
  2. Si la transacción principal COMMITE exitosamente: el controller mueve el archivo al path final.
  3. Si la transacción ROLLBACK: el controller elimina el archivo de staging.
  4. Job diario (cron a las 3 AM): elimina archivos en staging con más de 24h sin mover (huérfanos confirmados).

### 5. Listado de archivos por gimnasio (admin)
- Endpoint: `GET /api/archivos?gimnasioId=...&tipo=...&entidadId=...&page=...`.
- Solo ADMIN.
- Paginación, filtros.
- Útil para compliance y auditorías.

## Reglas de negocio aplicadas
- **RB33**: Auditoría de upload/delete.

## Modelo de datos

### Entidad `Archivo`
- `id (CHAR(36) UUID), gimnasio_id (CHAR(36) NOT NULL), tipo (VARCHAR(50) NOT NULL), entidad (VARCHAR(50) NULL, ej. 'nutricionista'), entidad_id (CHAR(36) NULL), nombre_original (VARCHAR(255) NOT NULL), archivo_path (VARCHAR(500) NOT NULL), mime_type (VARCHAR(100) NOT NULL), size_bytes (BIGINT NOT NULL), dimensiones (JSON NULL, ej. `{"width": 800, "height": 600}`), hash_sha256 (CHAR(64) NOT NULL, para detectar duplicados), subido_por (CHAR(36) NOT NULL), deleted_at (DATETIME NULL), created_at (DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`

### Constraints
- `CHECK(tipo IN (...))` enum en app.
- `CHECK(size_bytes > 0 AND size_bytes <= 10485760)` (10MB hard cap, validación en app).
- Índice: `idx_archivo_gimnasio_tipo (gimnasio_id, tipo)`, `idx_archivo_entidad (entidad, entidad_id)`.

### Deduplicación
- Campo `hash_sha256` permite detectar duplicados exactos.
- Si dos archivos tienen el mismo hash, pueden compartir el path físico (referencias múltiples) o rechazarse (decisión configurable por tipo). **Default iter 1**: rechazar duplicados para evitar consumo de storage innecesario.
- Endpoint de upload verifica antes de almacenar:
  ```sql
  SELECT id FROM archivo WHERE hash_sha256 = ? AND deleted_at IS NULL LIMIT 1
  ```

## Endpoints API

### Genéricos (autorización contextual)

#### `GET /api/archivos/:id`
- **Auth**: varía según tipo (ver matriz).
- **Response**: archivo binario con headers de seguridad.
- **Errors**: 403 (sin permiso), 404

#### `DELETE /api/archivos/:id`
- **Auth**: dueño o ADMIN.
- **Response 200**: `{ ok: true }`.
- **Errors**: 403, 404

#### `GET /api/archivos`
- **Auth**: ADMIN.
- **Query**: `?gimnasioId=...&tipo=...&entidadId=...&page=1&limit=50`.
- **Response 200**: lista paginada.
- **Errors**: 403, 500

### Específicos (cada feature)

#### `POST /api/nutricionistas/:id/foto-perfil`
- **Auth**: RECEPCIONISTA, ADMIN, NUTRICIONISTA (la propia).
- **Body**: `multipart/form-data` con archivo.
- **Response 200**: `{ archivoId, url }`.
- **Errors**: 400, 403, 404, 413 (muy grande), 500

#### `POST /api/socios/:id/foto-perfil`
- **Auth**: RECEPCIONISTA, ADMIN, SOCIO (el propio).
- **Body**: `multipart/form-data`.
- **Response 200**: `{ archivoId, url }`.

#### `POST /api/nutricionistas/:id/diploma`
- **Auth**: RECEPCIONISTA, ADMIN.
- **Body**: `multipart/form-data`.
- **Response 200**: `{ archivoId, url }`.

#### `POST /api/consultas/:id/adjuntos`
- **Auth**: NUTRICIONISTA (de la consulta).
- **Body**: `multipart/form-data`.
- **Response 200**: `{ archivoId, url }`.

#### `POST /api/mediciones/:id/fotos`
- **Auth**: NUTRICIONISTA.
- **Body**: `multipart/form-data` con `tipo` ∈ {frente, perfil_izq, perfil_der, espalda}.
- **Response 200**: `{ archivoId, url }`.
- **Validación adicional**: máximo 4 fotos por medición.

#### `PATCH /api/gimnasios/me/logo`
- **Auth**: ADMIN.
- **Body**: `multipart/form-data`.
- **Response 200**: `{ archivoId, url }`.

## Matriz de autorización para download

| Tipo de archivo | SOCIO | NUTRICIONISTA | RECEPCIONISTA | ADMIN |
|---|---|---|---|---|
| Foto de perfil nutri | ✅ (público) | ✅ (el propio) | ✅ | ✅ |
| Foto de perfil socio | ❌ | ⚠️ (con RB13 turno previo) | ❌ | ✅ |
| Diploma | ❌ | ❌ | ⚠️ (mismo gimnasio) | ✅ |
| Adjuntos de consulta | ⚠️ (la propia, con `publicada_at`) | ✅ (el dueño) | ❌ | ✅ |
| Fotos de progreso | ⚠️ (la propia, con `publicada_at`) | ✅ (con RB13) | ❌ | ✅ |
| Logo gimnasio | ✅ (público) | ✅ | ✅ | ✅ |

## Implementación

### Servicio `ArchivoService` (interno, reutilizable)

```typescript
class ArchivoService {
  async upload(params: {
    gimnasioId: string;
    tipo: TipoArchivo;
    entidad?: string;
    entidadId?: string;
    archivo: Buffer;
    nombreOriginal: string;
    subidoPor: string;
  }): Promise<Archivo> {
    // 1. Validar magic numbers
    const mimeReal = await fileTypeFromBuffer(params.archivo);
    if (!mimeReal || !this.esMimeValido(params.tipo, mimeReal.mime)) {
      throw new BadRequestError('Tipo de archivo no permitido');
    }
    // 2. Validar tamaño
    if (params.archivo.length > this.getLimiteTipo(params.tipo)) {
      throw new BadRequestError('Archivo excede el tamaño máximo');
    }
    // 3. Calcular hash
    const hash = sha256(params.archivo);
    // 4. Verificar duplicado
    const existente = await this.archivoRepo.findByHash(hash, params.gimnasioId);
    if (existente) {
      throw new ConflictError('Archivo duplicado');
    }
    // 5. Escanear con ClamAV
    const scanResult = await this.clamav.scan(params.archivo);
    if (scanResult.isInfected) {
      throw new BadRequestError('Archivo infectado');
    }
    // 6. Validación específica del tipo
    await this.validarEspecifico(params.tipo, params.archivo);
    // 7. Guardar en staging
    const stagingPath = `uploads/staging/${randomUUID()}.${mimeReal.ext}`;
    await fs.writeFile(stagingPath, params.archivo);
    // 8. Mover al path final (asumiendo que la transacción commitea)
    const finalPath = `uploads/${params.gimnasioId}/${params.tipo}/${randomUUID()}.${mimeReal.ext}`;
    await fs.rename(stagingPath, finalPath);
    // 9. Crear registro en DB
    const archivo = await this.archivoRepo.create({
      gimnasioId: params.gimnasioId,
      tipo: params.tipo,
      entidad: params.entidad,
      entidadId: params.entidadId,
      nombreOriginal: params.nombreOriginal,
      archivoPath: finalPath,
      mimeType: mimeReal.mime,
      sizeBytes: params.archivo.length,
      hashSha256: hash,
      subidoPor: params.subidoPor,
    });
    return archivo;
  }
}
```

### ClamAV
- Servicio `clamav-daemon` corriendo en el backend o sidecar.
- Cliente: `clamav.js` o `clamscan` binary.
- Si ClamAV no está disponible: rechazar uploads (fail closed, NO fail open).

### Validación específica

| Tipo | Validación |
|---|---|
| Foto de perfil | `sharp.metadata()` → width, height. Validar rango. |
| Diploma PDF | `pdf-lib` → contar páginas. Máximo 5. |
| Foto de progreso | `sharp.metadata()` → dimensiones 640×480 a 4000×4000. |
| Logo SVG | `DOMPurify` con config `USE_PROFILES: { svg: true }` para eliminar scripts. |

## Edge cases

- **B1**: Archivo malicioso (ejecutable renombrado como imagen) → magic numbers lo detecta, ClamAV refuerza, rechazo.
- **B2**: SVG con `<script>` → DOMPurify lo elimina.
- **B3**: Archivo muy pesado dentro del límite → OK.
- **B4**: Subida a la mitad (cliente desconecta) → cleanup del staging. El job de huérfanos es backup.
- **B5**: Storage lleno → error 500 con log crítico + alerta admin (vía `notificaciones.md` interno).
- **B6**: Subir archivo con nombre que incluye emoji o caracteres especiales → usar solo UUID.
- **B7**: Archivo duplicado exacto → 409 con el ID del archivo existente.
- **B8**: Re-upload de la misma foto tras soft delete → permitido, crea nuevo registro.
- **B9**: Gimnasio eliminado (soft delete) → sus archivos quedan con `deleted_at` en cascada. Cleanup físico en iter 2+.
- **B10**: ClamAV caído → fail closed. El sistema NO acepta uploads si el antivirus no responde.

## Tests

### Unitarios
- `archivo.service.ts`:
  - Validación magic numbers
  - Validación tamaño
  - Detección de duplicados
  - ClamAV detecta infectado
  - SVG malicioso saneado
  - Foto con dimensiones fuera de rango rechazada
- `cleanup-huerfanos.job.ts`:
  - Elimina archivos en staging > 24h
  - No elimina archivos con `deleted_at` reciente

### Integración
- Flujo end-to-end: crear nutricionista con foto → verificar que se subió a storage y se asoció correctamente.

## Notas
- En iter 1, NO hay cifrado en reposo. En iter 2+ considerar S3 con cifrado server-side.
- En producción, los archivos deben estar en un disco con backup (responsabilidad de DevOps).
- El tamaño máximo por archivo es generoso (5-10MB). Considerar comprimir imágenes en backend antes de almacenar (iter 2+).
- Los archivos soft-deleted se conservan por compliance. Cleanup físico es job de iter 2+ con ventana de 2 años.
- **ClamAV es crítico para seguridad**. Si no se puede instalar, mejor no ofrecer upload de archivos.
