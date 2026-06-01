# Plan 3: Aislamiento Multi-Tenant en Use-Cases de Turnos

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar filtro de `gimnasioId` a todos los use-cases de turnos que acceden directamente a TypeORM Repository, asegurando aislamiento multi-tenant.

**Architecture:** Inyectar `TenantContextService` en use-cases que usan `@InjectRepository(TurnoOrmEntity)` y agregar filtro `where: { gimnasioId }` en todas las queries. Los use-cases que ya usan repos con aislamiento (NutricionistaRepository, SocioRepository) están protegidos indirectamente.

**Tech Stack:** TypeScript, NestJS, TypeORM, Jest

---

## Contexto previo

**Branch:** `feature/multi-tenant-admin` (worktree: `.worktrees/multi-tenant-admin/`)

**Plan 1 completado:** Auth + Login + SUPERADMIN relaxation (commits `982e0d2`..`79aad51`)

**Plan 2 completado:** Seed multi-tenant (3 gimnasios + 16 usuarios)

**Lo que este plan hace:**
- Identifica use-cases de turnos que acceden directamente a TypeORM Repository
- Inyecta `TenantContextService` en esos use-cases
- Agrega filtro `gimnasioId` en queries de turnos
- Verifica que el aislamiento funcione (ADMIN de Gym 1 no ve turnos de Gym 2)

**Dependencias:**
- Plan 1 completado (TenantContextService disponible)
- Plan 2 completado (datos de prueba multi-tenant)

**Skills requeridos:**
- `nestjs-best-practices` (per backend AGENTS.md)
- `javascript-testing-patterns` (per backend AGENTS.md)

---

## Análisis de Use-Cases de Turnos

**Total:** 25 use-cases en `apps/backend/src/application/turnos/use-cases/`

**Clasificación:**

### Ya protegidos (usan repos con aislamiento)
- Use-cases que solo usan `NutricionistaRepository`, `SocioRepository`, `AgendaRepository`
- Estos repos ya filtran por `gimnasioId` del `TenantContextService`
- **No requieren cambios**

### Requieren modificación (usan TypeORM Repository directamente)
- Use-cases que inyectan `@InjectRepository(TurnoOrmEntity)`
- Use-cases que inyectan `@InjectRepository(FichaSaludOrmEntity)`
- Use-cases que inyectan `@InjectRepository(ObservacionClinicaOrmEntity)`
- **Requieren inyectar `TenantContextService` y agregar filtro**

---

## File Structure

| Archivo | Responsabilidad | Estado |
|---------|-----------------|--------|
| `apps/backend/src/application/turnos/use-cases/*.use-case.ts` | Use-cases de turnos | Modificar (los que usan TypeORM directo) |
| `apps/backend/src/application/turnos/use-cases/*.use-case.spec.ts` | Tests de use-cases | Modificar (agregar tests de aislamiento) |

---

## Tasks

### Task 1: Identificar use-cases que requieren modificación

**Files:**
- Read: `apps/backend/src/application/turnos/use-cases/*.ts`

- [ ] **Step 1: Listar todos los use-cases de turnos**

```bash
cd apps/backend/src/application/turnos/use-cases
ls *.use-case.ts
```

- [ ] **Step 2: Identificar use-cases que inyectan TypeORM Repository directamente**

Buscar use-cases con `@InjectRepository(TurnoOrmEntity)` o `@InjectRepository(FichaSaludOrmEntity)` o `@InjectRepository(ObservacionClinicaOrmEntity)`:

```bash
grep -l "InjectRepository" *.use-case.ts
```

- [ ] **Step 3: Crear lista de use-cases a modificar**

Documentar en este plan qué use-cases requieren modificación y cuáles ya están protegidos.

**Output esperado:**
```markdown
## Use-cases que requieren modificación:
1. get-turnos-del-dia.use-case.ts (inyecta TurnoOrmEntity)
2. get-turno-by-id.use-case.ts (inyecta TurnoOrmEntity)
3. ...

## Use-cases ya protegidos:
1. asignar-turno-manual.use-case.ts (usa NutricionistaRepository + AgendaRepository)
2. ...
```

- [ ] **Step 4: Commit (no hay cambios de código, solo documentación)**

```bash
git add docs/superpowers/plans/2026-06-01-multi-tenant-admin-plan-3-turnos.md
git commit -m "docs(plan-3): document use-cases requiring multi-tenant isolation"
```

---

### Task 2: Modificar get-turnos-del-dia.use-case.ts

**Files:**
- Modify: `apps/backend/src/application/turnos/use-cases/get-turnos-del-dia.use-case.ts`
- Modify: `apps/backend/src/application/turnos/use-cases/get-turnos-del-dia.use-case.spec.ts` (si existe)

- [ ] **Step 1: Inyectar TenantContextService**

Agregar import y inyección en constructor:

```typescript
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

// En constructor:
constructor(
  @InjectRepository(TurnoOrmEntity)
  private readonly turnoRepository: Repository<TurnoOrmEntity>,
  @Inject(NUTRICIONISTA_REPOSITORY)
  private readonly nutricionistaRepository: NutricionistaRepository,
  @Inject(APP_LOGGER_SERVICE)
  private readonly logger: IAppLoggerService,
  private readonly tenantContext: TenantContextService,  // <-- AGREGAR
) {}
```

- [ ] **Step 2: Agregar filtro de gimnasioId en query**

Modificar el QueryBuilder para filtrar turnos por gimnasioId del nutricionista:

```typescript
const queryBuilder = this.turnoRepository
  .createQueryBuilder('turno')
  .innerJoin('turno.nutricionista', 'nutricionista')
  .innerJoinAndSelect('turno.socio', 'socio')
  .leftJoinAndSelect('socio.fichaSalud', 'fichaSalud')
  .where('nutricionista.idPersona = :nutricionistaId', { nutricionistaId })
  .andWhere('nutricionista.gimnasioId = :gimnasioId', {  // <-- AGREGAR
    gimnasioId: this.tenantContext.gimnasioId,
  })
  .andWhere('turno.fechaTurno = :today', { today })
  .orderBy('turno.horaTurno', 'ASC');
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit -p apps/backend/tsconfig.json`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/application/turnos/use-cases/get-turnos-del-dia.use-case.ts
git commit -m "feat(turnos): add gimnasioId filter to get-turnos-del-dia use-case"
```

---

### Task 3: Modificar get-turno-by-id.use-case.ts

**Files:**
- Modify: `apps/backend/src/application/turnos/use-cases/get-turno-by-id.use-case.ts`

- [ ] **Step 1: Leer archivo actual**

```bash
cat apps/backend/src/application/turnos/use-cases/get-turno-by-id.use-case.ts
```

- [ ] **Step 2: Inyectar TenantContextService**

Agregar import y inyección en constructor (mismo patrón que Task 2).

- [ ] **Step 3: Agregar filtro de gimnasioId en query**

Modificar la query para filtrar por gimnasioId del socio o nutricionista asociado al turno:

```typescript
const turno = await this.turnoRepository.findOne({
  where: {
    idTurno: turnoId,
    nutricionista: { gimnasioId: this.tenantContext.gimnasioId },  // <-- AGREGAR
  },
  relations: { nutricionista: true, socio: true },
});
```

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc --noEmit -p apps/backend/tsconfig.json`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/application/turnos/use-cases/get-turno-by-id.use-case.ts
git commit -m "feat(turnos): add gimnasioId filter to get-turno-by-id use-case"
```

---

### Task 4-N: Modificar restantes use-cases de turnos

**Pattern:** Repetir Tasks 2-3 para cada use-case identificado en Task 1.

**Use-cases a modificar:**
- [ ] reservar-turno-socio.use-case.ts
- [ ] cancelar-turno-socio.use-case.ts
- [ ] reprogramar-turno-socio.use-case.ts
- [ ] confirmar-turno-socio.use-case.ts
- [ ] list-mis-turnos.use-case.ts
- [ ] get-agenda-diaria.use-case.ts
- [ ] get-ficha-salud-paciente.use-case.ts
- [ ] get-ficha-salud-socio.use-case.ts
- [ ] get-historial-consultas-paciente.use-case.ts
- [ ] get-historial-mediciones.use-case.ts
- [ ] get-resumen-progreso.use-case.ts
- [ ] get-turnos-recepcion-dia.use-case.ts
- [ ] guardar-mediciones.use-case.ts
- [ ] guardar-observaciones.use-case.ts
- [ ] upsert-ficha-salud-socio.use-case.ts
- [ ] ... (otros use-cases identificados en Task 1)

**Para cada use-case:**
1. Inyectar `TenantContextService`
2. Agregar filtro `gimnasioId` en queries
3. Verificar que compila
4. Commit individual

---

### Task N+1: Tests de integración de aislamiento

**Files:**
- Create: `apps/backend/src/application/turnos/use-cases/turnos-multi-tenant.spec.ts`

- [ ] **Step 1: Crear test de integración**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetTurnosDelDiaUseCase } from './get-turnos-del-dia.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

describe('Turnos Multi-Tenant Isolation', () => {
  let useCase: GetTurnosDelDiaUseCase;
  let turnoRepo: Repository<TurnoOrmEntity>;
  let tenantContext: TenantContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTurnosDelDiaUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: 'NutricionistaRepository',
          useValue: { findById: jest.fn() },
        },
        {
          provide: 'IAppLoggerService',
          useValue: { log: jest.fn() },
        },
        {
          provide: TenantContextService,
          useValue: { gimnasioId: 1 },
        },
      ],
    }).compile();

    useCase = module.get<GetTurnosDelDiaUseCase>(GetTurnosDelDiaUseCase);
    turnoRepo = module.get<Repository<TurnoOrmEntity>>(getRepositoryToken(TurnoOrmEntity));
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  it('debe filtrar turnos por gimnasioId del TenantContext', async () => {
    // Mock query builder
    const mockQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    jest.spyOn(turnoRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

    await useCase.execute(1, { fecha: '2026-06-01' });

    // Verificar que se llamó andWhere con filtro de gimnasioId
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'nutricionista.gimnasioId = :gimnasioId',
      { gimnasioId: 1 },
    );
  });
});
```

- [ ] **Step 2: Correr test**

Run: `npm test get-turnos-del-dia`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/application/turnos/use-cases/turnos-multi-tenant.spec.ts
git commit -m "test(turnos): add multi-tenant isolation integration test"
```

---

## Self-Review

### Spec coverage
- ✅ Identificar use-cases que requieren modificación (Task 1)
- ✅ Modificar use-cases de turnos para filtrar por gimnasioId (Tasks 2-N)
- ✅ Tests de integración de aislamiento (Task N+1)

### Placeholder scan
- No "TODO", "TBD", "fill in later" en steps
- Todos los bloques de código contienen código real
- Todos los comandos incluyen output esperado

### Type consistency
- `TenantContextService` usado consistentemente
- `gimnasioId: number | null` usado en filtros
- `this.tenantContext.gimnasioId` usado en queries

### Out of scope (deferred)
- Plan 4: Planes-alimentacion + AI + Reportes + otros módulos
- Migración de use-cases a repositorios custom (se mantiene TypeORM Repository directo)

---

## Definition of Done

- [ ] Todas las tasks commiteadas individualmente
- [ ] `npm test` pasa todos los tests de turnos
- [ ] `npx tsc --noEmit -p apps/backend/tsconfig.json` pasa
- [ ] `npm run build -w @nutrifit/backend` pasa
- [ ] PROGRESS.md actualizado con estado Plan 3 = ✅
- [ ] `mem_session_summary` ejecutado antes de cerrar sesión

---

**Generated:** 2026-06-01  
**Spec reference:** `docs/superpowers/specs/2026-06-01-multi-tenant-admin-permisos-design.md` §Plan 3  
**Estimated time:** 1-2 days
