# Progreso: Multi-Tenant, Admin Global y Permisos Granulares

> **Spec:** [`docs/superpowers/specs/2026-06-01-multi-tenant-admin-permisos-design.md`](specs/2026-06-01-multi-tenant-admin-permisos-design.md)
> **Branch:** `feature/multi-tenant-admin`
> **Worktree:** `.worktrees/multi-tenant-admin/`
> **Última actualización:** 2026-06-01

## Estado General

| # | Plan | Estado | Progreso | Notas |
|---|------|--------|----------|-------|
| 0 | Setup (worktree, baseline) | ✅ Completo | 100% | Commit `1ff8017` |
| 1 | Auth + Login + SUPERADMIN relaxation | 📝 Plan listo, ⏳ ejecución | 0% | Plan: [`docs/superpowers/plans/2026-06-01-multi-tenant-admin-plan-1-auth-superadmin.md`](plans/2026-06-01-multi-tenant-admin-plan-1-auth-superadmin.md) |
| 2 | Seed multi-tenant (3 gyms) | ⏳ Pendiente | 0% | |
| 3 | Aislamiento repos core (Socio/Nut/Asist) | ✅ Mayormente hecho en baseline | 90% | Falta verificar con tests |
| 4 | Aislamiento repos resto (Turno/Plan/Ficha/etc.) | ⏳ Pendiente | 0% | |
| 5 | CRUD Gimnasios + Impersonación | ⏳ Pendiente | 0% | |
| 6 | Frontend: AuthContext + TenantSwitcher | ⏳ Pendiente | 0% | |
| 7 | Frontend: Gestión + Wizard | ⏳ Pendiente | 0% | |
| 8 | E2E + Docs | ⏳ Pendiente | 0% | |

## Baseline (commit `1ff8017`)

68 archivos. WIP foundation. Lo que YA está en disco:

**Domain + shared types**
- `PersonaEntity.gimnasioId`
- `Rol.SUPERADMIN` (backend enum + shared type)
- `JwtPayload.gimnasioId`
- `express.d.ts` con `user.gimnasioId`

**Auth infrastructure (nuevo)**
- `TenantContextService` (REQUEST scope, global)
- `TenantContextInterceptor`
- `TenantContextModule` (Global)
- `JwtStrategy`, `LocalStrategy` (NestJS Passport)
- Guards con `gimnasioId` en `request.user`

**Repository isolation (filtro `where: { gimnasioId }`)**
- ✅ `SocioRepository`
- ✅ `NutricionistaRepository`
- ✅ `AgendaRepository`
- ✅ `ObjetivoRepository`
- ✅ `FotoProgresoRepository`
- ✅ `UsuarioRepository` (expone `persona.gimnasioId`)
- ⏳ `TurnoRepository` — verificar
- ⏳ `PlanAlimentacionRepository` — verificar
- ⏳ `FichaSaludRepository` — verificar
- ⏳ `ObservacionClinicaRepository` — verificar
- ⏳ `SugerenciaIARepository` — verificar

**Auditoría**
- `Auditoria` entity con `gimnasioId`
- Migración `1735689600000-AddGimnasioIdToAuditoria`
- Controller `admin-auditoria`

**Tests escritos (untracked → en baseline)**
- `auth.guard.spec.ts`
- `tenant-context.service.spec.ts`
- `tenant-context.interceptor.spec.ts`
- `socio.repository.spec.ts`
- `nutricionista.repository.spec.ts`
- `agenda.repository.spec.ts`
- `objetivo.repository.spec.ts`
- `foto-progreso.repository.spec.ts`
- `auditoria.service.spec.ts`
- `admin-auditoria.controller.spec.ts`
- `login.use-case.spec.ts` (fechaBaja blocking)

## Decisiones tomadas

1. **Worktree dedicado** `.worktrees/multi-tenant-admin/` para aislamiento del trabajo.
2. **Baseline WIP** preserva fundación multi-tenant del working tree previo. NO es código nuevo mío — es la base sobre la que arranca el spec.
3. **Plan 1 foco:** relajación de seguridad para SUPERADMIN (auth.guard, login.use-case, actions.guard). El spec §6.1/6.3/6.6 lo marca como crítico.
4. **Discarted (preserved in stash)**: módulo `Consentimiento`, features de `IA` (`generar-plan-semanal`, panels), UI de `planes` y `dashboard`, archivos de `seed/*`, `dist/*` build artifacts, docs antiguos.
5. **Slice 1 del spec NO estaba hecho en el working tree**, pese a que el spec §3 lo marca como crítico. La fundación (entities con `gimnasioId`, repos con filtro) sí estaba. Esto es importante para el plan.

## Decisiones pendientes (a resolver durante Plan 1)

- **¿`PersonaEntity.gimnasioId` debe ser `number | null`?**
  Spec dice que SUPERADMIN no tiene persona. Para no romper la abstracción, mejor mantener `PersonaEntity.gimnasioId: number` no-null, y permitir null solo a nivel `JwtPayload.gimnasioId`. **Decisión: mantener no-null en PersonaEntity.**
- **¿`LoginUseCase` debe rechazar no-SUPERADMIN sin gymId, o solo loguear sin gymId?**
  Spec §6.3 dice rechazar. **Decisión: rechazar (es estado inconsistente).**
- **¿`ActionsGuard` mantiene bypass para ADMIN con set explícito de acciones, o lo elimino?**
  Spec §6.6 dice set explícito. Pero no define el set. **Decisión: para v1, denegar ADMIN en todas las acciones `gimnasios.*`. Se puede refinar después con set explícito.**

## Estado de tests

Pendiente correr la suite completa del baseline. Riesgo: el código no commiteado puede tener tests que no pasan. **Verificación antes de Plan 1:** `npm test -w @nutrifit/backend`.

## Riesgos activos

| # | Riesgo | Mitigación |
|---|--------|------------|
| R1 | Tests del baseline no pasan (código sin compilar) | Ejecutar suite antes de Plan 1; reportar failures |
| R2 | Spec desactualizado (repos que dice "sin filtro" ya tienen) | Actualizar spec al final de Plan 1; reflejar realidad |
| R3 | Contexto perdido entre sesiones (compaction) | Plan 1 self-contained; `mem_session_summary` al cerrar; `CONTEXT.md` en worktree |
| R4 | Compilación de dist/ tira a dirty status | `.gitignore` ya tiene `dist/`; restaurar dist/ antes de commit |

## Blockers

- (ninguno)

## Comandos útiles

```bash
# Cambiar al worktree
cd .worktrees/multi-tenant-admin

# Ver commits
git log --oneline

# Correr suite de tests backend
npm test -w @nutrifit/backend

# Typecheck todo
npm run typecheck

# Ver status
git status
```

## Próximos pasos (sesión 2+)

1. Correr `npm test -w @nutrifit/backend` para verificar baseline.
2. Si OK: ejecutar Plan 1 (auth.guard relaxation, login.use-case, actions.guard).
3. Si falla: triage, fix mínimo, commit, re-run.
4. Al cerrar Plan 1: `mem_session_summary` + actualizar este PROGRESS.md.

---
*Generado por: opencode (sesión `multi-tenant-admin-2026-06-01`)*
