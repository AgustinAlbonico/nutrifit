# Diseño: Impersonación real de SUPERADMIN (rol ADMIN en gimnasio seleccionado)

**Fecha**: 2026-06-02
**Autor**: brainstorming con Agustín
**Estado**: Aprobado en 4 secciones

## Contexto y problema

El sistema tiene un feature de impersonación de gimnasio para SUPERADMIN ya implementado: SUPERADMIN puede seleccionar un gimnasio desde Configuración > "Contexto de Trabajo" y obtiene un token nuevo. **Pero el rol del token no refleja la realidad de lo que el SUPERADMIN está haciendo**: el backend hardcodea `rol: SUPERADMIN` en el token, y el frontend explícitamente descarta el `rol` que viene en la respuesta.

Resultado: cuando un SUPERADMIN impersona un gimnasio, sigue viendo el panel de SUPERADMIN (links a "Gimnasios", "Permisos"). No actúa como administrador de ese gimnasio. Esto contradice la descripción literal de la página de Configuración que dice:

> "Al impersonar un gimnasio, podrás acceder a todas las secciones del sistema **como si fueras un administrador de ese gimnasio**."

Además, el bloque visual "Impersonando" del sidebar puede pasar desapercibido si el sidebar arranca colapsado.

## Decisión de diseño

Cuando el SUPERADMIN impersona un gimnasio, el sistema lo trata como **ADMIN real** de ese gimnasio:

| Estado | Token: `rol` | Token: `gimnasioId` | Sidebar: links | Sidebar: bloque "Impersonando" |
|---|---|---|---|---|
| SUPERADMIN puro | `SUPERADMIN` | `null` | Dashboard, Auditoría, Gimnasios, Permisos | No |
| Impersonando gimnasio X | `ADMIN` (rol real del admin impersonado) | `X` | Dashboard, Socios, Nutricionistas, Recepcionistas, Turnos, Auditoría | Sí (naranja, con X para salir) |
| Salir de impersonación | `SUPERADMIN` | `null` | (igual a SUPERADMIN puro) | No |

**Cambio de comportamiento crítico**: durante la impersonación, el rol es `ADMIN` y se aplican los permisos reales de ese ADMIN (no bypass). El SUPERADMIN no puede acceder a "Gimnasios" ni "Permisos" mientras impersona. Para volver a SUPERADMIN, toca la X en el sidebar.

## Cambios

### Backend

**`apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts`**

Reemplazar líneas 102-115 (payload del JWT):

```diff
-    // 7. Generate JWT keeping SUPERADMIN rol + all actions so the impersonation
-    // session retains access to system-wide endpoints (e.g. /gimnasios listing)
-    // while the gimnasioId scopes data to the target gym. impersonatedBy is set
-    // for audit. This matches the frontend's "Keep SUPERADMIN rol" contract.
+    // 7. Generate JWT with the impersonated user's REAL rol and acciones.
+    // The frontend treats this as if the SUPERADMIN has become that admin.
+    // impersonatedBy is set for audit so the system can recognize the session.
     const jti = randomUUID();
     const payload: JwtPayload = {
       id: usuario.idUsuario,
       email: usuario.email,
-      rol: Rol.SUPERADMIN,
-      acciones: [...TODAS_LAS_ACCIONES],
+      rol: usuario.rol,
+      acciones: usuario.getAccionesEfectivas(),
       personaId: usuario.persona.idPersona,
       gimnasioId: usuario.persona.gimnasioId,
       jti,
     };
```

**Elimina el import de `TODAS_LAS_ACCIONES`** de `@nutrifit/shared` si queda huérfano.

### Frontend

**`apps/frontend/src/contexts/AuthContext.tsx`**

1. Agregar campo al `AuthState` (línea 29-41):
   ```ts
   rolOriginal: Rol | null;
   ```

2. `readStoredAuth()` (línea 87-121): leer `rolOriginal` del localStorage, con fallback.

3. `login()` (línea 158-220): setear `rolOriginal: response.data.rol` al autenticar (para que al impersonar/restaurar funcione aunque se refresque la página).

4. `impersonarGimnasio()` (línea 240-270):
   ```diff
   -      // Persist the impersonation token. Keep original rol (SUPERADMIN) so
   -      // esSuperadmin stays true and the TenantSwitcher keeps rendering.
   -      const nextAuth: AuthState = {
   -        ...auth,
   -        token: resultado.token,
   -        gimnasioId: resultado.gimnasio.id,
   -        impersonatedBy: auth.personaId ?? 0,
   -        // Keep SUPERADMIN rol so UX controls remain visible
   -      };
   +      // Persist the impersonation token. Use the rol that the backend issued
   +      // (ADMIN of the target gym). Save rolOriginal to restore on exit.
   +      const nextAuth: AuthState = {
   +        ...auth,
   +        token: resultado.token,
   +        rol: resultado.usuario.rol,  // ADMIN
   +        rolOriginal: auth.rol,        // SUPERADMIN (snapshot before)
   +        gimnasioId: resultado.gimnasio.id,
   +        impersonatedBy: auth.personaId ?? 0,
   +      };
   ```

5. `salirDeImpersonacion()` (línea 272-285):
   ```diff
        const nextAuth: AuthState = {
          ...auth,
          token: auth.tokenOriginal,
          gimnasioId: null,
          impersonatedBy: null,
   +      rol: auth.rolOriginal ?? 'SUPERADMIN',
   +      rolOriginal: null,
        };
   ```

6. `estaImpersonando` (línea 307):
   ```diff
   -      estaImpersonando: esSuperadmin && auth?.gimnasioId != null,
   +      // Estás impersonando si tenés gimnasio activo y alguien te impersonó.
   +      // No depende de esSuperadmin: cuando estás impersonado sos ADMIN.
   +      estaImpersonando: auth?.gimnasioId != null && auth?.impersonatedBy != null,
   ```

7. `hasPermission` (línea 313): sin cambios por ahora. La firma actual `esSuperadmin || permissionsSet.has(action)` ya manejará el caso porque `esSuperadmin` será `false` durante impersonación (rol=ADMIN), y los permisos del token son los reales del admin impersonado.

**`apps/frontend/src/components/layout/Sidebar.tsx`** (sin cambios)

El bloque "Impersonando" (líneas 293-350) ya existe y se renderizará correctamente con la nueva lógica de `estaImpersonando`.

**`apps/frontend/src/components/admin/TenantSwitcher.tsx`** (sin cambios)

`if (!esSuperadmin) return null` (línea 39-41) sigue siendo correcto: solo se muestra en SUPERADMIN puro. Se accede a él desde Configuración (SUPERADMIN puro).

**`apps/frontend/src/pages/Configuracion.tsx`** (sin cambios)

Sección "Contexto de Trabajo" (líneas 253-275) sigue siendo solo visible para SUPERADMIN.

## Plan de testing

### Backend (Vitest, ya configurado)

Agregar 1 test a `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.spec.ts`:

```ts
it('debe generar JWT con rol y acciones del usuario impersonado, no SUPERADMIN', async () => {
  // mock usuario con rol: ADMIN, acciones: ['socios.ver', ...]
  // mock gimnasio
  // mock jwtService.sign para capturar el payload
  // assert: payload.rol === 'ADMIN' (no SUPERADMIN)
  // assert: payload.acciones incluye solo las del admin real, no TODAS_LAS_ACCIONES
});
```

### Frontend (Vitest)

Agregar 2 tests a `apps/frontend/src/contexts/__tests__/AuthContext.test.tsx`:

```ts
describe('impersonarGimnasio', () => {
  it('al impersonar, el rol del state pasa a ADMIN del gimnasio seleccionado', async () => {
    // mock login como SUPERADMIN
    // mock impersonarGimnasio retornando { usuario: { rol: 'ADMIN' }, ... }
    // assert: result.current.rol === 'ADMIN'
    // assert: result.current.esSuperadmin === false
    // assert: result.current.estaImpersonando === true
  });

  it('al salir de impersonación, el rol vuelve a SUPERADMIN', async () => {
    // mock login, mock impersonar
    // llamar salirDeImpersonacion
    // assert: result.current.rol === 'SUPERADMIN'
    // assert: result.current.gimnasioId === null
  });
});
```

Los tests existentes del bloque `describe('impersonarGimnasio')` siguen pasando sin cambios (el primero verifica que tira error sin auth, sigue siendo cierto).

### Verificación manual con server vivo (después de implementar)

1. Reiniciar backend y frontend (el usuario lo hace; nodemon + Vite ya están).
2. Login como `superadmin@nutrifit.com` / `123456`.
3. Ir a Configuración → ver sección "Contexto de Trabajo" → seleccionar "Gimnasio Central".
4. **Esperado**:
   - Sidebar muestra bloque naranja "Impersonando: Gimnasio Central" con X.
   - Footer del sidebar dice "ADMIN" (no "SUPERADMIN").
   - Links visibles: Dashboard, Socios, Nutricionistas, Recepcionistas, Turnos, Auditoría. NO "Gimnasios" ni "Permisos".
5. Click en X del sidebar → vuelve a SUPERADMIN puro. El bloque "Impersonando" desaparece.
6. Verificar con curl: `GET /admin/auditoria?gimnasioId=1` con el token del localStorage → 200 OK.
7. Verificar con curl: `GET /admin/gimnasios` con el token impersonado → 403 (no es SUPERADMIN).

## Criterio de éxito

Un SUPERADMIN puede impersonar un gimnasio y usar la app **exactamente igual** que un ADMIN real de ese gimnasio, sin acceso a funciones de SUPERADMIN mientras está impersonado, con una indicación visual clara del gimnasio activo en el sidebar.

## Archivos modificados

- `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts` (cambio crítico)
- `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.spec.ts` (test nuevo)
- `apps/frontend/src/contexts/AuthContext.tsx` (4 cambios puntuales)
- `apps/frontend/src/contexts/__tests__/AuthContext.test.tsx` (2 tests nuevos)

**Sin cambios**: `Sidebar.tsx`, `TenantSwitcher.tsx`, `Configuracion.tsx`, backend controllers.
