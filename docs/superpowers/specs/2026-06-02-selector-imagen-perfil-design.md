# Selector de Imagen de Perfil

> **Proyecto**: nutrifit-supervisor
> **Tipo**: product (UI/UX) + business (regla de limpieza de huérfanos)
> **Status**: draft
> **Versión**: 1
> **Creado**: 2026-06-02
> **Actualizado**: 2026-06-02

---

## Contexto

NutriFit Supervisor ya tiene la **infraestructura de upload de fotos de perfil a MinIO** funcionando: el `MinioService` sube archivos al bucket único, los controllers de Socio, Profesional y Recepcionista aceptan `multipart/form-data` con la foto, y los endpoints `GET /socio/:id/foto` y `GET /profesional/:id/foto` las sirven.

El frontend tiene **dos patrones distintos** de foto de perfil:
- `Socios.tsx`: `<input type="file">` simple, sin recorte ni drag-and-drop.
- `Nutricionistas.tsx`: input file + `DialogoZoomImagen` (modal con drag/zoom, output 800×800, en español, en producción).
- **No existe** UI de gestión CRUD de recepcionistas en el frontend.

El usuario quiere **un selector de imagen de perfil reutilizable y consistente** (socios, nutricionistas y recepcionistas) con el patrón del repo `club-la-victoria-frontend` (https://github.com/McLovin-00/club-la-victoria-frontend) como referencia visual. Como `DialogoZoomImagen` ya cubre la funcionalidad de crop/zoom y está en producción, lo reusamos en vez de portar `react-easy-crop`.

**Usuario principal**: administrador del gimnasio (crea/edita socios, nutricionistas y recepcionistas).
**Actores secundarios**: ninguno en esta primera versión.
**Situación actual**: UX inconsistente entre roles; no hay forma de borrar la foto anterior de MinIO al reemplazarla (el bucket acumula archivos huérfanos); los recepcionistas no tienen UI de gestión en el frontend.

---

## Alcance

### Incluido en esta versión
- Componente reutilizable `SelectorImagen` (drop-zone + preview circular + botón X) con estado interno, que internamente usa el `DialogoZoomImagen` existente.
- Integración de `SelectorImagen` en los formularios Admin de:
  - `Socios.tsx` (crear/editar) — reemplaza el input file simple.
  - `Nutricionistas.tsx` (crear/editar) — reemplaza el patrón actual que usa `DialogoZoomImagen` directamente, para unificar UX.
  - `Recepcionistas.tsx` (**nueva página CRUD** creada desde cero, siguiendo el patrón de `Nutricionistas.tsx`).
- Modificación de los use-cases de actualización en backend (`actualizarSocio`, `update-nutricionista`, `update-recepcionista`) para **eliminar la foto anterior de MinIO** cuando se sube una nueva o se quita la foto en edición.
- Nuevo endpoint `GET /recepcionistas/:id/foto` (los otros 2 roles ya lo tienen).
- Tests unitarios del componente nuevo y de los use-cases modificados.

### Fuera de alcance (explícito)
- Sección "Mi perfil" para que cada usuario suba su propia foto — se hace en una segunda iteración, requiere endpoints y rutas nuevas.
- Validación de mime/tamaño en backend para fotos de perfil — se hace solo si aparecen problemas reales. Los uploads están detrás de `JwtAuthGuard` + `RolesGuard`, y la salida es una imagen de 800×800 (chica).
- Cambio del bucket único de MinIO a buckets separados por rol — el `MinioService` ya usa un bucket único, los paths tienen prefijo (`perfiles/socios/`, `perfiles/nutricionistas/`, `perfiles/recepcionistas/`).
- Subida de imágenes desde URL externa (Cloudinary, S3 público, etc.) — solo archivos locales.
- Galería de avatares predeterminados para elegir — solo se sube una foto del usuario o se muestra el placeholder actual.

### Features relacionadas o afectadas
- `Socios.tsx` (frontend, modificar) — el `<input type="file">` actual se reemplaza por `SelectorImagen`. Esto le da a los socios ajuste de imagen (zoom/drag), igualando el comportamiento que ya tienen los nutricionistas.
- `Nutricionistas.tsx` (frontend, modificar) — el patrón actual que llama `DialogoZoomImagen` directamente se reemplaza por `SelectorImagen`, que internamente usa el mismo modal. Cambio cosmético, sin cambio de comportamiento para el usuario.
- `Recepcionistas.tsx` (frontend, **crear desde cero**) — nueva página CRUD siguiendo el patrón de `Nutricionistas.tsx` (lista, modal crear, modal editar, modal eliminar). Solo accesible para rol ADMIN.
- `actualizarSocio.use-case.ts` (backend, modificar) — agregar limpieza de foto vieja.
- `update-nutricionista.use-case.ts` (backend, modificar) — idem.
- `update-recepcionista.use-case.ts` (backend, modificar) — idem.
- `recepcionistas.controller.ts` (backend, modificar) — agregar `GET /:id/foto`.

---

## Flujos

### Flujo principal (crear socio/nutricionista/recepcionista con foto)
1. El admin abre el formulario de crear.
2. Ve la drop-zone con icono `Upload` y botón "Seleccionar archivo".
3. Arrastra una imagen a la zona **o** la selecciona con el file picker.
4. Se abre el modal `RecortadorImagen` con la imagen.
5. Ajusta el recorte circular, hace click en "Guardar".
6. El preview circular de 600×600 aparece en la drop-zone.
7. Completa el resto del formulario y hace click en "Guardar socio".
8. El frontend manda `FormData` con todos los campos + `foto` (File PNG).
9. El backend sube a MinIO, guarda `fotoPerfilKey` en DB.
10. El admin ve el listado con la nueva foto.

### Flujo principal (editar con reemplazo de foto)
1. El admin abre el formulario de editar. Ve la foto actual con botón X.
2. Arrastra/selecciona una nueva imagen.
3. Se abre el modal de crop.
4. Ajusta y guarda → preview nuevo (con X).
5. Hace click en "Guardar cambios".
6. El frontend manda `FormData` con los campos editados + `foto` (File PNG nuevo).
7. El backend sube la nueva a MinIO, **elimina la anterior de MinIO** (si existe), actualiza `fotoPerfilKey`.

### Flujo: edición sin tocar la foto
1. El admin edita cualquier campo, no toca la foto.
2. Guarda.
3. El frontend NO manda `foto` en el FormData.
4. El backend conserva el `fotoPerfilKey` existente (lógica ya presente en los use-cases).
5. No se elimina nada de MinIO.

### Flujo: edición con foto removida (click en X)
1. El admin hace click en el botón X del preview.
2. El preview desaparece, la drop-zone vuelve a su estado inicial.
3. El **componente padre** detecta que se removió y marca un flag interno `fotoRemovida = true` (distinto de "no toqué nada").
4. Guarda el formulario.
5. El frontend **sí manda un campo `eliminarFoto: 'true'`** en el FormData (campo nuevo, no en la foto).
6. El backend, en el use-case de actualización: si llega `eliminarFoto === 'true'` Y existía foto previa → elimina el archivo de MinIO y setea `fotoPerfilKey = null`.

**Convención del FormData** (3 estados, inequívocos):
- `foto = File` → reemplazar (sube nueva + elimina vieja).
- `eliminarFoto = 'true'` → remover (elimina la vieja, queda null).
- ninguno de los dos → no se tocó (conserva la previa).

### Flujos de error
**Archivo no es imagen**
- Condición: el usuario arrastra un PDF, TXT, o un archivo sin MIME de imagen.
- Comportamiento: el selector muestra `error: "El archivo debe ser una imagen (jpg, png, etc.)"` inline, no abre el cropper.

**Falla el upload a MinIO**
- Condición: MinIO no responde o el bucket está lleno.
- Comportamiento: el backend responde 500. El frontend muestra toast `error.message` y conserva el form.

**Falla la eliminación de la foto vieja en MinIO**
- Condición: MinIO rechaza `removeObject` después de subir la nueva con éxito.
- Comportamiento: el backend loguea error, **NO** falla el update. La foto nueva queda persistida, la vieja queda huérfana (caso aceptable, no se rompe el flujo).

**Cancelar el crop**
- El usuario cierra el modal con "Cancelar" o la X del Dialog.
- Vuelve al estado anterior (preview previo o drop-zone vacía). No se modifica nada.

---

## Criterios de Éxito

### Criterios de aceptación
- [ ] **Dado** un admin en el formulario de crear socio, **cuando** arrastra una imagen PNG/JPG a la drop-zone, **entonces** se abre el modal de crop con la imagen centrada y recorte circular.
- [ ] **Dado** un admin en el modal de crop, **cuando** ajusta el recorte y hace click en "Guardar", **entonces** el preview circular de 128×128 aparece en el formulario.
- [ ] **Dado** un admin en el formulario de crear socio con foto cargada, **cuando** hace click en "Guardar socio", **entonces** el backend sube el PNG a MinIO bajo `perfiles/socios/{ts}-{rand}.png` y la foto se ve en el listado.
- [ ] **Dado** un admin en el formulario de editar socio con foto previa, **cuando** sube una foto nueva y guarda, **entonces** MinIO contiene la nueva foto Y la foto vieja fue eliminada.
- [ ] **Dado** un admin en el formulario de editar socio con foto previa, **cuando** hace click en la X y guarda, **entonces** MinIO NO contiene la foto vieja y `fotoPerfilKey = null` en DB.
- [ ] **Dado** un admin que sube un PDF en el selector, **cuando** lo arrastra o selecciona, **entonces** aparece el error "El archivo debe ser una imagen" y NO se abre el modal de crop.
- [ ] **Dado** un admin que quiere cancelar el crop, **cuando** cierra el modal, **entonces** el formulario vuelve al estado previo sin cambios.
- [ ] **Dado** un nutricionista o recepcionista, **cuando** el admin usa el mismo componente `SelectorImagen` en su formulario, **entonces** la experiencia es idéntica (drop-zone, crop, X).

### Comportamientos críticos
> Estas cosas deben funcionar sí o sí para que la feature tenga valor:
- El recorte con drag/zoom debe funcionar correctamente (la foto resultante NO debe mostrar esquinas ni zonas vacías).
- La foto nueva debe persistir en MinIO y en la DB.
- La foto vieja debe eliminarse de MinIO al reemplazarla (para no acumular basura).
- El campo de upload del backend (`foto` o `fotoPerfil`) debe ser compatible con el `FormData` que manda el frontend (multipart/form-data).

### Edge cases identificados
- **Usuario sube un HEIC de iPhone**: el frontend tiene `heic2any` instalado pero no se usa en este flujo. El `DialogoZoomImagen` abre con HEIC si el navegador lo soporta, si no, falla. **Decisión**: fuera de alcance para v1, se documenta como mejora futura.
- **Foto >5MB**: sin validación de tamaño, podría tardar o fallar. Mitigado porque el `DialogoZoomImagen` siempre produce una imagen 800×800 JPEG/PNG (~50–300KB).
- **Cache del navegador**: si la URL de la foto no cambia, `<img>` podría mostrar la vieja. **Mitigado**: el backend ya devuelve `fotoPerfilUrl` con `?v={fotoPerfilKey}` (ver `socio-response.dto.ts:83` y `auth.controller.ts:67`).
- **Falla de MinIO al subir**: dejaría la transacción inconsistente. **Mitigado**: el upload de MinIO ocurre antes del `save()` de TypeORM; si MinIO falla, no se persiste en DB.

---

## Contexto Técnico

> Esta sección captura intenciones técnicas de alto nivel como insumo para el plan de implementación. No es un diseño técnico detallado — ese viene en el plan.

**Stack / Tecnologías preferidas**:
- Frontend: React 19 + Vite + TypeScript (existente en el proyecto)
- UI: shadcn/ui + Tailwind v4 (existente)
- Componente de crop: **reusar `DialogoZoomImagen` existente** (`apps/frontend/src/components/media/DialogoZoomImagen.tsx`, ya usado por `Nutricionistas.tsx`, output 800×800, drag/zoom/recentear).
- **No se instalan dependencias nuevas** — el patrón de crop ya está implementado.
- Iconos: `lucide-react` (existente)
- Backend: NestJS + TypeORM + MinIO (existente, sin cambios de stack)

**Integraciones conocidas**:
- MinIO bucket único (`NUTRIFIT_MINIO_BUCKET` o similar via `EnvironmentConfigService.getMinioBucketName()`)
- Endpoints existentes: `POST/PUT /socio`, `POST/PUT /profesional`, `POST/PUT /recepcionistas`
- Endpoints de servicio: `GET /socio/:id/foto`, `GET /profesional/:id/foto`. **Falta verificar**: `GET /recepcionista/:id/foto`.

**Restricciones técnicas**:
- TODO el código en español (variables, funciones, componentes, tipos, copy de UI) — convención del proyecto.
- Path prefix en MinIO: `perfiles/{rol}/{ts}-{rand}.{ext}` (mantener el patrón actual).
- El `use-case` de actualización no debe romper la lógica existente: si llega `fotoPerfilKey` nuevo, setea; si NO llega, conserva el previo (ya implementado).
- No agregar validaciones de mime/tamaño en backend para esta v1.

**Módulos involucrados**:
- Frontend: `components/imagen/` (nuevo), `components/media/DialogoZoomImagen.tsx` (reusado), `components/ui/` (shadcn), `pages/Socios.tsx`, `pages/Nutricionistas.tsx`, `pages/Recepcionistas.tsx` (nuevo)
- Backend: `application/socios/`, `application/profesionales/use-cases/`, `application/recepcionistas/use-cases/`, `presentation/http/controllers/recepcionistas.controller.ts`

**Contrato del componente frontend**:

`SelectorImagen` (reutilizable, estado interno, internamente usa `DialogoZoomImagen`):
```ts
interface PropiedadesSelectorImagen {
  /** URL actual de la foto (en edición) o undefined si no hay */
  valorActual?: string | null;
  /** Callback cuando el usuario confirma una nueva foto (File procesado por DialogoZoomImagen) */
  alCambiarFoto: (archivo: File | null) => void;
  /** Texto del label (ej: "Foto del Socio") */
  etiqueta?: string;
  /** Mensaje de error a mostrar (validación cliente) */
  error?: string | null;
  /** Deshabilita interacción */
  deshabilitado?: boolean;
  /** Tamaño del preview (default 128px) */
  tamanoPreview?: number;
}
```

**Nota**: `DialogoZoomImagen` ya existe y no se modifica. El `SelectorImagen` lo orquesta: abre/cierra el modal, pasa el archivo, recibe el File procesado (800×800, formato original preservado si es PNG, JPEG si no).

**Convención de 3 estados en el padre** (cómo traduce el padre la salida de `SelectorImagen` para el submit):

```ts
// El padre mantiene:
const [foto, setFoto] = useState<string | File | null>(socio.fotoPerfilUrl ?? null);
// "foto === string (URL inicial)" → no se tocó.
// "foto === null Y había URL inicial" → se removió.
// "foto instanceof File" → se reemplazó.

// En el submit:
if (foto instanceof File) {
  formData.append('foto', foto);
} else if (foto === null && socio.fotoPerfilUrl) {
  formData.append('eliminarFoto', 'true');
}
// si no, no se manda nada relacionado a la foto.
```

**Otras notas**:
- `DialogoZoomImagen` ya existe y NO se modifica. El `SelectorImagen` lo orquesta: abre/cierra el modal, pasa el archivo, recibe el File procesado.
- El endpoint `GET /recepcionista/:id/foto` no existe; se crea siguiendo el mismo patrón que `SociosController.obtenerFoto` y `ProfesionalController.obtenerFoto`.
- El hook `usarSelectorImagen` evaluado al inicio se descartó: el estado va interno en `SelectorImagen` para no exponer API innecesaria.
- `Recepcionistas.tsx` se crea desde cero copiando el patrón estructural de `Nutricionistas.tsx` (lista paginada, modal crear, modal editar, modal eliminar), pero usando `SelectorImagen` directamente (sin el manejo manual de `DialogoZoomImagen`).
- **Mejora de UX en `Socios.tsx`**: al reemplazar el input file simple por `SelectorImagen`, los socios también obtienen ajuste de imagen (zoom/drag) — esto unifica la experiencia con nutricionistas.
- **Mejora de UX en `Nutricionistas.tsx`**: el patrón actual que llama `DialogoZoomImagen` directamente se reemplaza por `SelectorImagen`. No cambia comportamiento para el usuario, solo unifica el código.

---

## Notas de Negocio

- Las fotos de perfil son visibles para todos los roles autenticados (el bucket tiene política pública de lectura + el endpoint `GET .../foto` es `@Public()` o accesible según el rol). El cambio no modifica permisos.
- El campo `fotoPerfilKey` está en la entidad base `Persona` (heredada por `Socio`, `Nutricionista`, `Entrenador`, `Recepcionista`). Esto es lo correcto: el modelo de datos ya soporta la feature.
- El equipo de NutriFit está en Argentina → todos los textos de UI deben estar en español rioplatense, mantener consistencia con el resto del sistema.

---

*Generado por brainstorming v1*
