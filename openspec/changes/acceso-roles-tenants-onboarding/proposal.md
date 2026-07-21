# Proposal: Acceso, Roles, Tenants y Onboarding

## Intent

Secure the multi-tenant architecture and achieve full compliance with data privacy regulations. Currently, the system lacks query-level tenant isolation, consent verification, and essential authentication flows (password recovery, idle timeout), posing critical security and legal risks for multi-gym operations.

## Scope

### In Scope
- **Slice 1: JWT Tenant Injection & Repository Isolation** (CRITICAL)
- **Slice 2: Legal Consent & Privacy Preferences** (HIGH RISK)
- **Slice 3: Password Reset Flow**
- **Slice 4: Session Control & Idle Timeout**
- **Slice 5: Help & Onboarding Content**

### Out of Scope
- SaaS self-service provisioning (UC-001) - Gym creation remains an admin-only manual process for now.
- Mobile application development.

## Capabilities

### New Capabilities
- `tenant-isolation`: Enforcement of multi-tenant data boundaries at the query level.
- `legal-consent`: Management of user agreements and privacy preferences.
- `auth-recovery`: Password reset and account recovery flows.
- `session-control`: Idle timeouts and secure JWT revocation.
- `user-onboarding`: Role-based help and support content.

### Modified Capabilities
- None

## Approach

Implement a chained-slice delivery, prioritizing security and legal compliance.
1. **Slice 1 (Security-First):** Introduce `gimnasioId` to the `JwtPayload` and create a `TenantInterceptor` using `nestjs-cls` to enforce `Where({ gimnasioId: ... })` globally in all repositories. This must precede any production data handling.
2. **Slice 2:** Add `TerminoConsentimientoOrmEntity` and a `ConsentimientoGuard` for sensitive endpoints (health records, AI suggestions). Add consent UI on login.
3. **Slice 3 & 4:** Implement `PasswordResetToken`, email integration, session blacklisting, and frontend idle timeouts.
4. **Slice 5:** Build static, role-aware `/ayuda` content.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/application/auth/login.use-case.ts` | Modified | Inject `gimnasioId` into JWT. |
| `src/infrastructure/auth/` | Modified | Update JWT interfaces and validation. |
| `src/infrastructure/persistence/` | Modified | Add `TenantInterceptor` and update all repositories to filter by `gimnasioId`. |
| `src/infrastructure/persistence/.../auditoria.entity.ts` | Modified | Add `gimnasioId` column. |
| `src/pages/Login.tsx` | Modified | Add consent modal and "forgot password" link. |
| `src/contexts/AuthContext.tsx` | Modified | Add idle timer and handle logout revocation. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cross-tenant data leakage | High | Slice 1 implements centralized `TenantInterceptor` and rigorous repository filters before multi-gym rollout. |
| Legal non-compliance (PHI) | High | Slice 2 enforces mandatory consent acceptance via guards for all health-related endpoints. |
| Locked accounts support burden | Medium | Slice 3 introduces self-service password recovery via email. |

## Rollback Plan

- Revert `JwtPayload` and `TenantInterceptor` changes if isolation causes access issues.
- Maintain legacy token compatibility during rollout (tokens without `gimnasioId` fallback safely if needed).
- Disable `ConsentimientoGuard` via feature flag if legal terms block critical workflows.

## Dependencies

- SMTP provider configuration for password reset emails.

## Success Criteria

- [ ] Users can only access data belonging to their assigned `gimnasioId`.
- [ ] Users must explicitly accept terms before accessing health records or AI features.
- [ ] Users can recover passwords via email without admin intervention.
- [ ] Sessions expire automatically after a configured period of inactivity.
