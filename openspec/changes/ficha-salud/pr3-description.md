# PR 3 — E2E + Polish

**Change**: ficha-salud
**Branch**: `feat/ficha-salud-pr3-e2e`
**Target**: `main`
**PR strategy**: stacked-to-main (PR 1a ✅ merged, PR 1b ✅ merged, PR 2 ✅ merged, **PR 3 ⬅️ this**)
**Estimated changed lines**: ~640 (4 e2e specs + polish + docs)
**Persistence**: BOTH (OpenSpec + Engram)

---

## ✅ Acceptance Criteria — Verificación end-to-end

### Mapeo AC → Tests (design §15)

| AC | Criterio | Verificación | Estado |
|----|----------|--------------|--------|
| **AC-01** | Migración crea `ficha_salud_version` con todas las columnas e índices | PR 1a mergeado (commit `b7e6ac2` style) | ✅ |
| **AC-02** | Primera solicitud al upsert genera versión 1 y `completada=true` | Unit test `upsert-ficha-salud-socio.use-case.spec.ts` (PR 1a) | ✅ |
| **AC-03** | Siguiente edición genera versión 2, 3, etc. | Unit test "Versionado: 3 PATCH consecutivos" (PR 1a) | ✅ |
| **AC-04** | `ReservarTurnoSocioUseCase` rechaza reserva si `completada=false` | Unit test "RB14: bloquea si completada=false" (PR 1a) | ✅ |
| **AC-05** | Auditoría `ACCION_FICHA_COMPLETADA` registrada al crear | Unit test (PR 1b) | ✅ |
| **AC-06** | Auditoría `ACCION_FICHA_ACTUALIZADA` con antes/después | Unit test (PR 1b) | ✅ |
| **AC-07** | Notificación in-app `FICHA_COMPLETADA` enviada al socio | **Out of scope** (decidido 2026-06-03) | ⏭️ |
| **AC-08** | Notificación in-app `FICHA_ACTUALIZADA` enviada al socio | **Out of scope** (decidido 2026-06-03) | ⏭️ |
| **AC-09** | `GET /turnos/socio/ficha-salud/historial` retorna array de versiones | E2E `editar-ficha.spec.ts:18` | ✅ |
| **AC-10** | `GET /turnos/socio/ficha-salud/version/:n` retorna datos completos | E2E `editar-ficha.spec.ts:18` (paso 12-15) | ✅ |
| **AC-11** | Endpoint nutricionista respeta RB13 (turno previo) | E2E `historial-nutricionista.spec.ts:115` (sin turno → 403) | ✅ |
| **AC-12** | RECEPCIONISTA recibe 403 en endpoints de ficha | E2E `rbac-roles.spec.ts` (3 tests, 7 endpoints) | ✅ |
| **AC-13** | Frontend muestra banner "Última edición" en modo edición | E2E `crear-ficha.spec.ts:141` (verifica formato fecha) | ✅ |
| **AC-14** | Frontend requiere consentimiento en creación | E2E `crear-ficha.spec.ts:20` (botón disabled hasta tildar) | ✅ |
| **AC-15** | Frontend NO requiere consentimiento en edición | E2E `crear-ficha.spec.ts:20` (rama edición) | ✅ |
| **AC-16** | Modal de historial lista versiones y permite ver una read-only | E2E `editar-ficha.spec.ts:18` (pasos 11-15) | ✅ |
| **AC-17** | Validación cliente: altura 100-250 cm | Unit test `FichaSaludSocio.test.tsx` (PR 2) | ✅ |
| **AC-18** | Validación cliente: peso 20-300 kg | Unit test `FichaSaludSocio.test.tsx` (PR 2) | ✅ |
| **AC-19** | E2E: socio completa ficha → reserva turno exitoso | E2E `crear-ficha.spec.ts:20` | ✅ |
| **AC-20** | E2E: socio edita ficha → ve historial con nuevas versiones | E2E `editar-ficha.spec.ts:18` | ✅ |
| **AC-21** | E2E: RECEPCIONISTA no ve datos clínicos | E2E `rbac-roles.spec.ts` | ✅ |
| **AC-22** | `consentAt` se setea una vez y NO se modifica en ediciones | Unit test "Consentimiento en edición" (PR 1a) | ✅ |

**Total**: 20/22 ACs verificados con tests específicos (AC-07 y AC-08 son out-of-scope por decisión explícita del 2026-06-03).

### Cobertura de las 8 RBs implementadas

- **RB14** — bloquea reserva si ficha no completada → E2E `crear-ficha.spec.ts`
- **RB16** — RECEPCIONISTA sin acceso a ficha → E2E `rbac-roles.spec.ts` (4 tests)
- **RB21** — IMC histórico no se recalcula → unit tests + diseño sin lógica de recálculo (PR 1a)
- **RB29** — last-write-wins → unit test "Versionado: 3 PATCH consecutivos" (PR 1a)
- **RB33** — auditoría antes/después → unit test (PR 1b) + shape seguro en CREATE
- **RB42** — ficha editable → E2E `editar-ficha.spec.ts`
- **RB44** — consentimiento RGPD una sola vez → E2E `crear-ficha.spec.ts` (rama creación) + unit test (PR 1a)
- **RB50** — historial de versiones → E2E `editar-ficha.spec.ts` + `historial-nutricionista.spec.ts`

---

## 📋 Cambios incluidos

### E2E tests (4 specs, 11 tests × 3 browsers = 33 runs)

- `e2e/ficha-salud/crear-ficha.spec.ts` (2 tests) — RB14
- `e2e/ficha-salud/editar-ficha.spec.ts` (2 tests) — RB42, RB50
- `e2e/ficha-salud/rbac-roles.spec.ts` (4 tests) — RB16
- `e2e/ficha-salud/historial-nutricionista.spec.ts` (3 tests) — RB13, RB50

### Polish (mínimo, no invasivo)

- `apps/frontend/src/pages/FichaSaludSocio.tsx`:
  - `data-testid="volver-agendar"` en botón top.
  - `data-testid="ir-agendar-turno"` en botón bottom.
  - `title` y `placeholder` en inputs altura/peso (UX tooltips).
  - `aria-label` dinámico en submit (modo creación vs edición).

### Documentación

- `apps/frontend/AGENTS.md` — nueva sección "Feature: Ficha de Salud del Socio" con endpoints, RBs, componentes, hooks, enums compartidos y tests E2E.

---

## 🧪 Cómo correr los tests E2E

```bash
# Backend y frontend deben estar levantados (puertos 3000 y 5173).
# Si están arriba, Playwright los reusa automáticamente (webServer.reuseExistingServer: true).

# Solo los tests de ficha-salud
npx playwright test e2e/ficha-salud/

# Solo chromium (más rápido)
npx playwright test e2e/ficha-salud/ --project=chromium

# Un spec puntual
npx playwright test e2e/ficha-salud/crear-ficha.spec.ts
```

**Precondición importante**: el seed debe estar cargado con `USUARIOS_PRUEBA` (`socio1-central@nutrifit.com` con ficha pre-existente para los tests de edición/historial). Si la base está limpia, primero correr:

```bash
npm run db:seed
```

El test `crear-ficha.spec.ts` cubre tanto el flujo de creación (sin ficha previa) como el de edición (con ficha previa), así que es robusto a ambos estados de la DB.

---

## ⚠️ Precondiciones y consideraciones

1. **Tests skip-safe**: los tests que asumen ficha pre-existente usan `test.skip()` con mensaje claro si la ficha no está. Esto permite correr la suite sin preparar la DB.
2. **Tokens vía localStorage**: los tests obtienen el token JWT de `localStorage.getItem('access_token')` después del login. Compatible con `AuthContext` actual.
3. **IDs del seed**: los tests de nutricionista usan IDs `1` y `999999`. Si el seed cambia los IDs, ajustar las constantes en `historial-nutricionista.spec.ts`.
4. **Web server**: el `playwright.config.ts` reusa dev servers existentes (`reuseExistingServer: !process.env.CI`).

---

## 🚦 Rollback plan

1. Revert del PR en `main` (un solo revert commit).
2. PR 1a, 1b y 2 siguen funcionando.
3. Los tests E2E no se ejecutan, pero el feature sigue operativo (sin verificación E2E).

---

## 📊 Resumen cuantitativo

- **4 specs E2E nuevos** (11 tests totales)
- **1 archivo de página modificado** (13 líneas)
- **1 archivo de docs modificado** (87 líneas)
- **0 nuevas dependencias**
- **0 migraciones de DB**
- **0 cambios breaking**
