# Proposal: Superadmin Panel (Full Impersonation)

## Intent

Allow SUPERADMIN to seamlessly step into an ADMIN role (impersonate a gym) to troubleshoot or configure the tenant, seeing exactly what the gym admin sees. This requires a full UX transformation and strict backend audit trails to ensure security and traceability.

## Scope

### In Scope
- Move `TenantSwitcher` to a prominent position in the Sidebar/Top bar.
- Introduce `rolEfectivo` in the frontend `AuthContext` to drive conditional rendering.
- Transform Sidebar and Dashboard based on `rolEfectivo`.
- Add a prominent, dismissible (only via "Salir") `ImpersonationIndicator`.
- Add backend audit events: `IMPERSONAR_INICIO` and `IMPERSONAR_FIN`.
- Create `POST /auth/exit-impersonation` endpoint to log exit and calculate duration.
- Fix `expiraEn` calculation to reflect actual JWT expiration instead of hardcoded strings.
- Restrict impersonated sessions from accessing SUPERADMIN-only routes in `RolesGuard`.
- Add "Confirm Exit" modal before ending impersonation.
- E2E testing for the full impersonation lifecycle.

### Out of Scope
- Creating a separate global KPIs dashboard for SUPERADMINs when not impersonating (deferred to P2).
- Rate limiting of impersonations (deferred to P3).
- Shorter TTL for impersonated sessions vs regular sessions (deferred to P3).
- Fixing `RolesGuard` for SUPERADMIN bypass (separate P1 fix, not part of this feature).

## Capabilities

### New Capabilities
- `superadmin-impersonation`: Full impersonation lifecycle including UI transformation and backend audit trailing.

### Modified Capabilities
- None

## Approach

Implement Approach C (Full Impersonation Mode). We will enhance the `AuthContext` to track `rolOriginal` and `rolEfectivo`. The UI (Sidebar, Dashboard) will pivot entirely based on `rolEfectivo`. On the backend, we will add audit hooks to the impersonation entry and a new exit endpoint, ensuring every impersonation session is tracked. We will modify `RolesGuard` to explicitly reject SUPERADMIN routes if the user is currently impersonating (`impersonatedBy` is present).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/frontend/src/contexts/AuthContext.tsx` | Modified | Add `rolOriginal`, `rolEfectivo` logic. |
| `apps/frontend/src/components/layout/Sidebar.tsx` | Modified | Render ADMIN vs SUPERADMIN nav links based on `rolEfectivo`. |
| `apps/frontend/src/components/layout/TenantSwitcher.tsx` | Modified | Relocate to prominent position, always visible to SUPERADMIN. |
| `apps/frontend/src/pages/Dashboard.tsx` | Modified | Render `DashboardAdmin` or SUPERADMIN landing. |
| `apps/frontend/src/components/ImpersonationIndicator.tsx` | New | Fixed top banner for active impersonation. |
| `apps/backend/src/domain/enums/accion-auditoria.enum.ts` | Modified | Add `IMPERSONAR_INICIO`, `IMPERSONAR_FIN`. |
| `apps/backend/src/application/use-cases/auth/impersonate-gym.use-case.ts` | Modified | Log `IMPERSONAR_INICIO`, return real expiration. |
| `apps/backend/src/presentation/controllers/auth.controller.ts` | Modified | Add `POST /exit-impersonation`. |
| `apps/backend/src/infrastructure/guards/roles.guard.ts` | Modified | Block SUPERADMIN routes if `impersonatedBy` exists. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Impersonated user accesses global admin settings | High | Explicit check in `RolesGuard` blocking access if `req.user.impersonatedBy != null`. |
| Session expires without logging `IMPERSONAR_FIN` | Medium | Acceptable risk; audit trails will show entry but not exit. Can be mitigated later with a cron job if needed, but manual exit covers the happy path. |
| UI flicker during state transition | Low | `invalidateQueries` and proper React state management during the switch. |

## Rollback Plan

If critical security bugs are found:
1. Revert the frontend `AuthContext` and `Sidebar` changes to drop the `rolEfectivo` logic.
2. Disable the `ImpersonationIndicator` component.
3. Keep the backend audit events and endpoints (they are additive and safe).
4. Revert `RolesGuard` if the impersonation block causes unintended lockouts.

## Dependencies

- None

## Success Criteria

- [ ] SUPERADMIN can select a gym and the UI transforms completely into the ADMIN view.
- [ ] A prominent yellow/amber banner indicates active impersonation.
- [ ] Clicking "Salir" in the banner prompts for confirmation and restores the SUPERADMIN view.
- [ ] `IMPERSONAR_INICIO` and `IMPERSONAR_FIN` are recorded in the database.
- [ ] Attempting to access a `@RolesDecorator(Rol.SUPERADMIN)` route while impersonating returns 403 Forbidden.