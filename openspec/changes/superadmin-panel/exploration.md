# Exploration: Superadmin Panel — Impersonation UX

## Current State

The impersonation flow exists but is **functionally incomplete**. The SUPERADMIN can impersonate a gym, but the UI does not adapt to reflect the impersonated context:

| Component | Current Behavior | Issue |
|-----------|-----------------|-------|
| `AuthContext.tsx:240-270` | Stores impersonation token; keeps `rol: SUPERADMIN` in JWT so `esSuperadmin` stays true | Works as designed but drives wrong UX |
| `TenantSwitcher.tsx` | Only mounted in `Configuracion.tsx:270` — buried in settings, not discoverable | UX gap |
| `ImpersonationIndicator.tsx` | Mounted in `MainLayout.tsx:11` — shows banner but is "very subtle" per prompt | UX gap |
| `Sidebar.tsx:59-168` | Filters nav links by `rol` (line 168: `link.roles.includes(rol \|\| '')`) | Does NOT consider `estaImpersonando` — SUPERADMIN sees SUPERADMIN nav, not ADMIN nav |
| `Dashboard.tsx:12-22` | Branch by `rol === 'NUTRICIONISTA'`, `'SOCIO'`, `'RECEPCIONISTA'` | ADMIN and SUPERADMIN both fall through to generic dashboard |
| `roles.guard.ts:34` | `requiredRoles.includes(user?.rol)` — SUPERADMIN in JWT passes any role check | Intentional, but means all role-gated endpoints are accessible while impersonating |
| `auditoria.entity.ts:13-25` | `AccionAuditoria` enum — **no `IMPERSONAR_INICIO` / `IMPERSONAR_FIN`** | Audit gap |
| `impersonar-usuario.use-case.ts:134` | `expiraEn: '2h'` is hardcoded, not actual JWT expiry | Misleading |
| `auth.controller.ts` | **No `POST /auth/exit-impersonation` endpoint** | Backend has no awareness of impersonation session lifecycle |

### Key Architectural Finding

The JWT retains `rol: Rol.SUPERADMIN` during impersonation (use-case line 110). This is deliberate — it keeps `esSuperadmin` true and the `TenantSwitcher` visible. However, this creates a mismatch: the sidebar shows SUPERADMIN navigation while the SUPERADMIN is acting as an ADMIN of a specific gym.

## Affected Areas

- `apps/frontend/src/contexts/AuthContext.tsx` — `estaImpersonando`, `gimnasioActual` computed but `rolEfectivo` not derived
- `apps/frontend/src/components/admin/TenantSwitcher.tsx` — only in Configuracion; not in Sidebar header
- `apps/frontend/src/components/admin/ImpersonationIndicator.tsx` — subtle banner, no navigation adaptation
- `apps/frontend/src/components/layout/Sidebar.tsx:59-168` — filters by `rol`, ignores `estaImpersonando`
- `apps/frontend/src/pages/Dashboard.tsx:9-22` — no `estaImpersonando` branch; no ADMIN-specific dashboard
- `apps/frontend/src/pages/admin/GimnasioDetailPage.tsx:130-138` — `onSuccess` has no navigation post-impersonate
- `apps/frontend/src/components/layout/MainLayout.tsx` — `ImpersonationIndicator` in fixed position
- `apps/frontend/src/router.tsx:77-86` — `requireSuperadmin` only checks `rol !== 'SUPERADMIN'`, doesn't account for impersonation
- `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts:134` — `expiraEn: '2h'` is fake
- `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts:13-25` — missing audit events
- `apps/backend/src/presentation/http/controllers/auth.controller.ts` — no exit endpoint

## Approaches

### Approach A: "Effective Role" Context Extension (Frontend-only)

Introduce `rolEfectivo` in `AuthContext`: when `estaImpersonando`, derive `rolEfectivo = 'ADMIN'` from the impersonated user's actual role (stored separately). Sidebar and Dashboard branch on `rolEfectivo` instead of `rol`.

- **Pros**: Clean separation real rol (SUPERADMIN) vs effective rol (ADMIN); minimal backend changes; preserves SUPERADMIN access to system routes
- **Cons**: Requires changing sidebar filter logic and dashboard branching throughout; `rolEfectivo` must be stored during impersonation (currently the impersonated user's rol is not persisted)
- **Effort**: Medium

### Approach B: SUPERADMIN Sub-shell with `effectiveGimnasioId` (Minimal Change)

Add `effectiveGimnasioId` to `AuthContext` — when impersonating, this holds the gym being impersonated. Keep `rol` as SUPERADMIN everywhere. Sidebar nav stays SUPERADMIN but shows a gym context badge. A dedicated "Vista Admin de [Gym]" dashboard branch shows gym-scoped data.

- **Pros**: Minimal disruption; keeps SUPERADMIN nav always visible; clear visual separation between "system admin" and "gym admin" modes
- **Cons**: The SUPERADMIN still sees SUPERADMIN links (Gimnasios, Auditoría) while impersonating; may confuse about what actions apply where
- **Effort**: Low-Medium

### Approach C: Full Impersonation Mode with UI Transformation

When `estaImpersonando` is true: (1) TenantSwitcher moves to Sidebar header as prominent gym badge, (2) Sidebar shows ADMIN navigation (not SUPERADMIN), (3) Dashboard renders ADMIN dashboard, (4) ImpersonationIndicator becomes a prominent top-of-sidebar element, (5) backend records `IMPERSONAR_INICIO` / `IMPERSONAR_FIN` audit events, (6) a `POST /auth/exit-impersonation` endpoint replaces the pure-client-side `salirDeImpersonacion`.

- **Pros**: Complete UX transformation; the SUPERADMIN truly feels like they're "inside" the gym admin; full audit trail; no confusion about scope
- **Cons**: More extensive; requires backend audit events and exit endpoint; must handle route guards (`requireSuperadmin` would redirect away even when legitimately browsing as ADMIN)
- **Effort**: High

## Recommendation

**Approach C** — Full Impersonation Mode. The current UX is the problem: impersonation "works" but the UI doesn't communicate context change, leaving the SUPERADMIN uncertain about what they're seeing. The sidebar and dashboard must transform to show the gym-scoped view, otherwise the feature is confusing rather than empowering.

Key implementation points:
1. **Backend**: Add `IMPERSONAR_INICIO` / `IMPERSONAR_FIN` to `AccionAuditoria`; create `POST /auth/exit-impersonation` endpoint that validates the session is actually impersonating before clearing
2. **AuthContext**: Store `rolOriginal` (the impersonated user's real rol) during impersonation; expose `rolEfectivo` 
3. **TenantSwitcher**: Move from Configuracion to Sidebar header; render as prominent gym selector
4. **Sidebar**: Filter links by `rolEfectivo` when impersonating (show ADMIN nav), not by `rol`
5. **Dashboard**: Branch on `estaImpersonando` to show the appropriate ADMIN/NUTRICIONISTA dashboard
6. **roles.guard.ts**: Add `impersonatedBy` check so impersonated sessions can't access SUPERADMIN-only routes

## Risks

- Route guards (`requireSuperadmin`) redirect impersonated SUPERADMIN away from gym-scoped pages — needs fix
- `expiraEn: '2h'` is not the actual JWT TTL — fix to read from JWT decoded payload
- `salirDeImpersonacion` is purely client-side with no backend session awareness — impersonation could be "orphaned" server-side
- E2E tests (`impersonar.spec.ts`) use selectors like `[data-testid="tenant-switcher"]` but no such `data-testid` exists in current `TenantSwitcher` — tests will fail

## Ready for Proposal

**Yes** — the impersonation flow foundation exists but the UX adaptation work is a clear, bounded feature. The main open question for the orchestrator: does the user want the full Approach C transformation, or a lighter version that keeps some SUPERADMIN links visible while impersonating?

---

**Status**: success
**Summary**: Explored the SUPERADMIN impersonation UX. Current flow works at auth level but UI does not adapt — sidebar shows SUPERADMIN nav instead of ADMIN nav, TenantSwitcher is buried in Configuracion, Dashboard has no ADMIN branch, and there are no backend audit events or exit endpoint. Recommended Approach C (full transformation) with specific implementation points.
**Artifacts**: `openspec/changes/superadmin-panel/exploration.md` | Engram `sdd/superadmin-panel/explore`
**Next**: sdd-propose
**Risks**: Route guard conflict during impersonation, fake `expiraEn`, purely client-side exit, E2E test selectors mismatch
**Skill Resolution**: paths-injected — 3 skills (vercel-react-best-practices, nestjs-best-practices, tailwind-css-patterns)