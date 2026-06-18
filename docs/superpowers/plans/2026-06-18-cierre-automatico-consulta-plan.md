# Cierre Automático de Consultas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar automáticamente turnos en `EN_CURSO` después de 30 min de inactividad (configurable por gimnasio), notificar 5 min antes al nutricionista, y permitir reabrir la consulta cerrada automáticamente.

**Architecture:** Scheduler (cron `*/5 * * * *`) busca turnos `EN_CURSO` viejos. Si pasaron ≥ 25 min envía pre-aviso; si pasaron ≥ 30 min cierra vía `FinalizarConsultaPorInactividadUseCase` (sin validación clínica dura). Endpoint `POST /turnos/:id/reabrir-cierre-auto` permite al nutri volver a `EN_CURSO`. Frontend muestra banner + botón de reapertura.

**Tech Stack:** NestJS, TypeORM, MySQL, React + Vite, shadcn/ui

---

## Tasks

### Task 1: Domain enums — `MotivoCierreAutomatico` + `TipoNotificacion`

**Files:**
- Create: `apps/backend/src/domain/entities/Turno/motivo-cierre-automatico.enum.ts`
- Modify: `apps/backend/src/domain/entities/Notificacion/tipo-notificacion.enum.ts`

- [ ] **Step 1: Create `MotivoCierreAutomatico` enum**

```typescript
// apps/backend/src/domain/entities/Turno/motivo-cierre-automatico.enum.ts
export enum MotivoCierreAutomatico {
  INACTIVIDAD = 'INACTIVIDAD',
}
```

- [ ] **Step 2: Add notification types to `TipoNotificacion`**

```typescript
// apps/backend/src/domain/entities/Notificacion/tipo-notificacion.enum.ts
// Add after CONSULTA_FINALIZADA = 'CONSULTA_FINALIZADA':
  CONSULTA_PREAVISO_CIERRE_AUTO = 'CONSULTA_PREAVISO_CIERRE_AUTO',
  CONSULTA_CERRADA_AUTO = 'CONSULTA_CERRADA_AUTO',
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/domain/entities/Turno/motivo-cierre-automatico.enum.ts apps/backend/src/domain/entities/Notificacion/tipo-notificacion.enum.ts
git commit -m "feat(domain): add MotivoCierreAutomatico enum and CONSULTA notification types"
```

---

### Task 2: Infrastructure entities — add columns to `TurnoOrmEntity` and `PoliticaOperativaOrmEntity`

**Files:**
- Modify: `apps/backend/src/infrastructure/persistence/typeorm/entities/turno.entity.ts`
- Modify: `apps/backend/src/infrastructure/politicas/politica-operativa.entity.ts`

- [ ] **Step 1: Add cierre automático columns to `TurnoOrmEntity`**

Insert after `consultaFinalizadaAt` (after line 48):

```typescript
  @Column({ name: 'cierre_automatico', type: 'boolean', default: false })
  cierreAutomatico: boolean;

  @Column({
    name: 'motivo_cierre_automatico',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  motivoCierreAutomatico: string | null;

  @Column({
    name: 'cierre_automatico_en',
    type: 'datetime',
    nullable: true,
  })
  cierreAutomaticoEn: Date | null;

  @Column({
    name: 'preaviso_cierre_auto_enviado_en',
    type: 'datetime',
    nullable: true,
  })
  preavisoCierreAutoEnviadoEn: Date | null;

  @Column({
    name: 'reabierta_por_cierre_auto',
    type: 'boolean',
    default: false,
  })
  reabiertaPorCierreAuto: boolean;
```

- [ ] **Step 2: Add política columns to `PoliticaOperativaOrmEntity`**

Insert after `umbralAusenteMinutos` (after line 25):

```typescript
  @Column({
    name: 'umbral_cierre_consulta_min',
    type: 'int',
    nullable: true,
  })
  umbralCierreConsultaMin: number | null;

  @Column({
    name: 'preaviso_cierre_consulta_min',
    type: 'int',
    nullable: true,
  })
  preavisoCierreConsultaMin: number | null;
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/infrastructure/persistence/typeorm/entities/turno.entity.ts apps/backend/src/infrastructure/politicas/politica-operativa.entity.ts
git commit -m "feat(infra): add cierre automatico columns to TurnoOrmEntity and PoliticaOperativaOrmEntity"
```

---

### Task 3: Domain entity + Repository — extend `PoliticaOperativaEntity`, interface, and impl

**Files:**
- Modify: `apps/backend/src/domain/politicas/politica-operativa.entity.ts`
- Modify: `apps/backend/src/application/politicas/politica-operativa.repository.ts`
- Modify: `apps/backend/src/infrastructure/politicas/politica-operativa.repository.impl.ts`

- [ ] **Step 1: Extend `PoliticaOperativaEntity` with new fields**

```typescript
// apps/backend/src/domain/politicas/politica-operativa.entity.ts
// Add fields:
  umbralCierreConsultaMin: number | null;
  preavisoCierreConsultaMin: number | null;

// Constructor signature becomes:
  constructor(
    id: number | null = null,
    gimnasioId: number,
    plazoCancelacionHoras: number = 24,
    plazoReprogramacionHoras: number = 24,
    umbralAusenteMinutos: number = 15,
    umbralCierreConsultaMin: number | null = null,
    preavisoCierreConsultaMin: number | null = null,
  ) {
    this.id = id;
    this.gimnasioId = gimnasioId;
    this.plazoCancelacionHoras = plazoCancelacionHoras;
    this.plazoReprogramacionHoras = plazoReprogramacionHoras;
    this.umbralAusenteMinutos = umbralAusenteMinutos;
    this.umbralCierreConsultaMin = umbralCierreConsultaMin;
    this.preavisoCierreConsultaMin = preavisoCierreConsultaMin;
  }
```

- [ ] **Step 2: Add methods to repository interface**

```typescript
// apps/backend/src/application/politicas/politica-operativa.repository.ts
// Add after getUmbralAusente(gimnasioId: number):
  getUmbralCierreConsultaMin(gimnasioId: number): Promise<number>;
  getPreavisoCierreConsultaMin(gimnasioId: number): Promise<number>;
```

- [ ] **Step 3: Implement new methods in repository impl**

```typescript
// apps/backend/src/infrastructure/politicas/politica-operativa.repository.impl.ts
// Add after DEFAULT_UMBRAL_AUSENTE_MINUTOS = 15:
const DEFAULT_UMBRAL_CIERRE_CONSULTA_MIN = 30;
const DEFAULT_PREAVISO_CIERRE_CONSULTA_MIN = 5;

// Add after getUmbralAusente:
  async getUmbralCierreConsultaMin(gimnasioId: number): Promise<number> {
    const politica = await this.findByGimnasioId(gimnasioId);
    return politica?.umbralCierreConsultaMin ?? DEFAULT_UMBRAL_CIERRE_CONSULTA_MIN;
  }

  async getPreavisoCierreConsultaMin(gimnasioId: number): Promise<number> {
    const politica = await this.findByGimnasioId(gimnasioId);
    return politica?.preavisoCierreConsultaMin ?? DEFAULT_PREAVISO_CIERRE_CONSULTA_MIN;
  }

// Update toDomain:
  private toDomain(orm: PoliticaOperativaOrmEntity): PoliticaOperativaEntity {
    return new PoliticaOperativaEntity(
      orm.id,
      orm.gimnasioId,
      orm.plazoCancelacionHoras,
      orm.plazoReprogramacionHoras,
      orm.umbralAusenteMinutos,
      orm.umbralCierreConsultaMin,
      orm.preavisoCierreConsultaMin,
    );
  }
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/domain/politicas/politica-operativa.entity.ts apps/backend/src/application/politicas/politica-operativa.repository.ts apps/backend/src/infrastructure/politicas/politica-operativa.repository.impl.ts
git commit -m "feat(domain): extend PoliticaOperativa with cierre consulta settings"
```

---

### Task 4: Use case — `FinalizarConsultaPorInactividadUseCase`

**Files:**
- Create: `apps/backend/src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case.ts`
- Create: `apps/backend/src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { MotivoCierreAutomatico } from 'src/domain/entities/Turno/motivo-cierre-automatico.enum';
import { FinalizarConsultaPorInactividadUseCase } from './finalizar-consulta-por-inactividad.use-case';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

function buildMockTurno(overrides: Partial<TurnoOrmEntity> = {}): TurnoOrmEntity {
  return {
    idTurno: 1,
    estadoTurno: EstadoTurno.EN_CURSO,
    consultaIniciadaAt: new Date(),
    cierreAutomatico: false,
    motivoCierreAutomatico: null,
    cierreAutomaticoEn: null,
    preavisoCierreAutoEnviadoEn: null,
    reabiertaPorCierreAuto: false,
    socio: { idPersona: 10 } as any,
    nutricionista: { idPersona: 20 } as any,
    ...overrides,
  } as TurnoOrmEntity;
}

describe('FinalizarConsultaPorInactividadUseCase', () => {
  let useCase: FinalizarConsultaPorInactividadUseCase;
  let turnoRepo: jest.Mocked<Repository<TurnoOrmEntity>>;
  let notificacionesService: jest.Mocked<NotificacionesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinalizarConsultaPorInactividadUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: NotificacionesService,
          useValue: { crear: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(FinalizarConsultaPorInactividadUseCase);
    turnoRepo = module.get(getRepositoryToken(TurnoOrmEntity));
    notificacionesService = module.get(NotificacionesService);
  });

  it('debe cerrar turno EN_CURSO con cierreAutomatico=true', async () => {
    const turno = buildMockTurno();
    turnoRepo.findOne.mockResolvedValue(turno);

    const result = await useCase.execute(1);

    expect(result.estado).toBe(EstadoTurno.REALIZADO);
    expect(turno.cierreAutomatico).toBe(true);
    expect(turno.motivoCierreAutomatico).toBe(MotivoCierreAutomatico.INACTIVIDAD);
    expect(turno.cierreAutomaticoEn).toBeInstanceOf(Date);
    expect(turno.estadoTurno).toBe(EstadoTurno.REALIZADO);
    expect(turnoRepo.save).toHaveBeenCalled();
    expect(notificacionesService.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: TipoNotificacion.CONSULTA_CERRADA_AUTO,
      }),
    );
  });

  it('debe lanzar error si el turno no está EN_CURSO', async () => {
    const turno = buildMockTurno({ estadoTurno: EstadoTurno.REALIZADO });
    turnoRepo.findOne.mockResolvedValue(turno);
    await expect(useCase.execute(1)).rejects.toThrow('debe estar EN_CURSO');
  });

  it('debe lanzar error si el turno no existe', async () => {
    turnoRepo.findOne.mockResolvedValue(null);
    await expect(useCase.execute(999)).rejects.toThrow('no encontrado');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/backend && npx jest --testPathPattern finalizar-consulta-por-inactividad --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/backend/src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { MotivoCierreAutomatico } from 'src/domain/entities/Turno/motivo-cierre-automatico.enum';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

@Injectable()
export class FinalizarConsultaPorInactividadUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async execute(turnoId: number): Promise<{ success: boolean; estado: EstadoTurno }> {
    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
      relations: { socio: true, nutricionista: true },
    });

    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }

    if (turno.estadoTurno !== EstadoTurno.EN_CURSO) {
      throw new BadRequestError(
        `No se puede cerrar por inactividad: el turno debe estar EN_CURSO, actual: ${turno.estadoTurno}`,
      );
    }

    turno.estadoTurno = EstadoTurno.REALIZADO;
    turno.consultaFinalizadaAt = new Date();
    turno.cierreAutomatico = true;
    turno.motivoCierreAutomatico = MotivoCierreAutomatico.INACTIVIDAD;
    turno.cierreAutomaticoEn = new Date();

    await this.turnoRepository.save(turno);

    if (turno.nutricionista?.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: turno.nutricionista.idPersona,
        tipo: TipoNotificacion.CONSULTA_CERRADA_AUTO,
        titulo: 'Consulta cerrada automáticamente',
        mensaje: `La consulta #${turno.idTurno} fue cerrada automáticamente por inactividad. Si necesitás editarla, reabrirla desde la pantalla de consulta.`,
        metadata: { turnoId: turno.idTurno, motivo: 'CIERRE_AUTO_INACTIVIDAD' },
      });
    }

    return { success: true, estado: EstadoTurno.REALIZADO };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/backend && npx jest --testPathPattern finalizar-consulta-por-inactividad --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case.ts apps/backend/src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case.spec.ts
git commit -m "feat(use-case): add FinalizarConsultaPorInactividadUseCase"
```

---

### Task 5: Use case — `ReabrirConsultaCerradaAutoUseCase`

**Files:**
- Create: `apps/backend/src/application/turnos/use-cases/reabrir-consulta-cerrada-auto.use-case.ts`
- Create: `apps/backend/src/application/turnos/use-cases/reabrir-consulta-cerrada-auto.use-case.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/src/application/turnos/use-cases/reabrir-consulta-cerrada-auto.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { ReabrirConsultaCerradaAutoUseCase } from './reabrir-consulta-cerrada-auto.use-case';
import { ConflictError } from 'src/domain/exceptions/custom-exceptions';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { ForbiddenError } from 'src/domain/exceptions/custom-exceptions';

function buildMockTurno(overrides: Partial<TurnoOrmEntity> = {}): TurnoOrmEntity {
  return {
    idTurno: 1,
    estadoTurno: EstadoTurno.REALIZADO,
    cierreAutomatico: true,
    reabiertaPorCierreAuto: false,
    consultaFinalizadaAt: new Date(),
    nutricionista: { idPersona: 20 } as any,
    socio: { idPersona: 10 } as any,
    ...overrides,
  } as TurnoOrmEntity;
}

describe('ReabrirConsultaCerradaAutoUseCase', () => {
  let useCase: ReabrirConsultaCerradaAutoUseCase;
  let turnoRepo: jest.Mocked<Repository<TurnoOrmEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReabrirConsultaCerradaAutoUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(ReabrirConsultaCerradaAutoUseCase);
    turnoRepo = module.get(getRepositoryToken(TurnoOrmEntity));
  });

  it('debe reabrir un turno REALIZADO con cierreAutomatico=true', async () => {
    const turno = buildMockTurno();
    turnoRepo.findOne.mockResolvedValue(turno);

    const result = await useCase.execute(1, 20);

    expect(turno.estadoTurno).toBe(EstadoTurno.EN_CURSO);
    expect(turno.reabiertaPorCierreAuto).toBe(true);
    expect(turno.cierreAutomatico).toBe(true);
    expect(turnoRepo.save).toHaveBeenCalled();
  });

  it('debe lanzar ConflictError si el turno no es REALIZADO', async () => {
    const turno = buildMockTurno({ estadoTurno: EstadoTurno.EN_CURSO });
    turnoRepo.findOne.mockResolvedValue(turno);
    await expect(useCase.execute(1, 20)).rejects.toThrow(ConflictError);
  });

  it('debe lanzar ConflictError si cierreAutomatico es false', async () => {
    const turno = buildMockTurno({ cierreAutomatico: false });
    turnoRepo.findOne.mockResolvedValue(turno);
    await expect(useCase.execute(1, 20)).rejects.toThrow(ConflictError);
  });

  it('debe lanzar ForbiddenError si el nutricionista no es el dueño', async () => {
    const turno = buildMockTurno({ nutricionista: { idPersona: 99 } as any });
    turnoRepo.findOne.mockResolvedValue(turno);
    await expect(useCase.execute(1, 20)).rejects.toThrow(ForbiddenError);
  });

  it('debe lanzar NotFoundError si el turno no existe', async () => {
    turnoRepo.findOne.mockResolvedValue(null);
    await expect(useCase.execute(999, 20)).rejects.toThrow(NotFoundError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/backend && npx jest --testPathPattern reabrir-consulta-cerrada-auto --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/backend/src/application/turnos/use-cases/reabrir-consulta-cerrada-auto.use-case.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { ConflictError } from 'src/domain/exceptions/custom-exceptions';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { ForbiddenError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class ReabrirConsultaCerradaAutoUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
  ) {}

  async execute(turnoId: number, nutricionistaId: number): Promise<{ success: boolean; estado: string }> {
    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
      relations: { nutricionista: true },
    });

    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }

    if (turno.nutricionista.idPersona !== nutricionistaId) {
      throw new ForbiddenError('No tenés permiso para reabrir este turno');
    }

    if (turno.estadoTurno !== EstadoTurno.REALIZADO) {
      throw new ConflictError(
        `No se puede reabrir: el turno debe estar REALIZADO, actual: ${turno.estadoTurno}`,
      );
    }

    if (!turno.cierreAutomatico) {
      throw new ConflictError(
        'No se puede reabrir: el turno no fue cerrado automáticamente',
      );
    }

    turno.estadoTurno = EstadoTurno.EN_CURSO;
    turno.reabiertaPorCierreAuto = true;

    await this.turnoRepository.save(turno);

    return { success: true, estado: EstadoTurno.EN_CURSO };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/backend && npx jest --testPathPattern reabrir-consulta-cerrada-auto --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/application/turnos/use-cases/reabrir-consulta-cerrada-auto.use-case.ts apps/backend/src/application/turnos/use-cases/reabrir-consulta-cerrada-auto.use-case.spec.ts
git commit -m "feat(use-case): add ReabrirConsultaCerradaAutoUseCase"
```

---

### Task 6: Scheduler — `CierreConsultaScheduler`

**Files:**
- Create: `apps/backend/src/infrastructure/schedulers/cierre-consulta.scheduler.ts`
- Create: `apps/backend/src/infrastructure/schedulers/cierre-consulta.scheduler.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/src/infrastructure/schedulers/cierre-consulta.scheduler.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CierreConsultaScheduler } from './cierre-consulta.scheduler';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { FinalizarConsultaPorInactividadUseCase } from 'src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case';
import { POLITICA_OPERATIVA_REPOSITORY, IPoliticaOperativaRepository } from 'src/application/politicas/politica-operativa.repository';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

function buildMockTurno(overrides: Partial<TurnoOrmEntity> = {}): TurnoOrmEntity {
  return {
    idTurno: 1,
    estadoTurno: EstadoTurno.EN_CURSO,
    consultaIniciadaAt: new Date(Date.now() - 31 * 60 * 1000),
    preavisoCierreAutoEnviadoEn: null,
    gimnasio: { idGimnasio: 1 } as any,
    nutricionista: { idPersona: 20, nombre: 'Dr', apellido: 'Test' } as any,
    ...overrides,
  } as TurnoOrmEntity;
}

describe('CierreConsultaScheduler', () => {
  let scheduler: CierreConsultaScheduler;
  let turnoRepo: jest.Mocked<Repository<TurnoOrmEntity>>;
  let politicaRepo: jest.Mocked<IPoliticaOperativaRepository>;
  let finalizarUseCase: jest.Mocked<FinalizarConsultaPorInactividadUseCase>;
  let notifService: jest.Mocked<NotificacionesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CierreConsultaScheduler,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            createQueryBuilder: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: POLITICA_OPERATIVA_REPOSITORY,
          useValue: {
            getUmbralCierreConsultaMin: jest.fn().mockResolvedValue(30),
            getPreavisoCierreConsultaMin: jest.fn().mockResolvedValue(5),
          },
        },
        {
          provide: FinalizarConsultaPorInactividadUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: NotificacionesService,
          useValue: { crear: jest.fn() },
        },
      ],
    }).compile();

    scheduler = module.get(CierreConsultaScheduler);
    turnoRepo = module.get(getRepositoryToken(TurnoOrmEntity));
    politicaRepo = module.get(POLITICA_OPERATIVA_REPOSITORY);
    finalizarUseCase = module.get(FinalizarConsultaPorInactividadUseCase);
    notifService = module.get(NotificacionesService);
  });

  it('debe cerrar turnos que superaron el umbral', async () => {
    const turnoViejo = buildMockTurno({
      consultaIniciadaAt: new Date(Date.now() - 31 * 60 * 1000),
    });
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([turnoViejo]),
    } as any;
    (turnoRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    await scheduler.ejecutarCierreAutomatico();

    expect(finalizarUseCase.execute).toHaveBeenCalledWith(turnoViejo.idTurno);
  });

  it('debe enviar preaviso si está en la ventana', async () => {
    const turnoPreaviso = buildMockTurno({
      consultaIniciadaAt: new Date(Date.now() - 26 * 60 * 1000),
    });
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([turnoPreaviso]),
    } as any;
    (turnoRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    await scheduler.ejecutarCierreAutomatico();

    expect(notifService.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: TipoNotificacion.CONSULTA_PREAVISO_CIERRE_AUTO,
      }),
    );
    expect(turnoRepo.save).toHaveBeenCalled();
  });

  it('no debe enviar preaviso repetido si ya se envió', async () => {
    const turnoPreavisado = buildMockTurno({
      preavisoCierreAutoEnviadoEn: new Date(),
    });
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([turnoPreavisado]),
    } as any;
    (turnoRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    await scheduler.ejecutarCierreAutomatico();

    expect(notifService.crear).not.toHaveBeenCalled();
  });

  it('no debe hacer nada si no hay turnos EN_CURSO', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    } as any;
    (turnoRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    await scheduler.ejecutarCierreAutomatico();

    expect(finalizarUseCase.execute).not.toHaveBeenCalled();
    expect(notifService.crear).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/backend && npx jest --testPathPattern cierre-consulta.scheduler --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/backend/src/infrastructure/schedulers/cierre-consulta.scheduler.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from '../persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  POLITICA_OPERATIVA_REPOSITORY,
  IPoliticaOperativaRepository,
} from 'src/application/politicas/politica-operativa.repository';
import { FinalizarConsultaPorInactividadUseCase } from 'src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

@Injectable()
export class CierreConsultaScheduler {
  private readonly logger = new Logger(CierreConsultaScheduler.name);

  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(POLITICA_OPERATIVA_REPOSITORY)
    private readonly politicaRepository: IPoliticaOperativaRepository,
    private readonly finalizarPorInactividadUseCase: FinalizarConsultaPorInactividadUseCase,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  @Cron('*/5 * * * *')
  async ejecutarCierreAutomatico(): Promise<void> {
    this.logger.log('Ejecutando verificación de cierre automático de consultas...');

    const ahora = new Date();

    const turnos = await this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.nutricionista', 'nutricionista')
      .leftJoinAndSelect('turno.gimnasio', 'gimnasio')
      .where('turno.estadoTurno = :estado', { estado: EstadoTurno.EN_CURSO })
      .andWhere('turno.consultaIniciadaAt IS NOT NULL')
      .getMany();

    for (const turno of turnos) {
      try {
        const gimnasioId = turno.gimnasio?.idGimnasio ?? 1;
        const umbralMin = await this.politicaRepository.getUmbralCierreConsultaMin(gimnasioId);
        const preavisoMin = await this.politicaRepository.getPreavisoCierreConsultaMin(gimnasioId);
        const minutosTranscurridos = (ahora.getTime() - turno.consultaIniciadaAt!.getTime()) / 60_000;

        if (
          minutosTranscurridos >= (umbralMin - preavisoMin) &&
          minutosTranscurridos < umbralMin &&
          !turno.preavisoCierreAutoEnviadoEn
        ) {
          turno.preavisoCierreAutoEnviadoEn = ahora;
          await this.turnoRepository.save(turno);

          if (turno.nutricionista?.idPersona) {
            await this.notificacionesService.crear({
              destinatarioId: turno.nutricionista.idPersona,
              tipo: TipoNotificacion.CONSULTA_PREAVISO_CIERRE_AUTO,
              titulo: 'Cierre automático próximo',
              mensaje: `La consulta #${turno.idTurno} se cerrará automáticamente en ${preavisoMin} min. Finalizala para cargar los datos clínicos.`,
              metadata: { turnoId: turno.idTurno, motivo: 'PREAVISO_CIERRE_AUTO' },
            });
          }
          this.logger.log(`Preaviso enviado para turno ${turno.idTurno}`);
        }

        if (minutosTranscurridos >= umbralMin) {
          await this.finalizarPorInactividadUseCase.execute(turno.idTurno);
          this.logger.log(`Turno ${turno.idTurno} cerrado automáticamente por inactividad`);
        }
      } catch (error) {
        this.logger.error(
          `Error procesando cierre automático del turno ${turno.idTurno}`,
          error as Error,
        );
      }
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/backend && npx jest --testPathPattern cierre-consulta.scheduler --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/infrastructure/schedulers/cierre-consulta.scheduler.ts apps/backend/src/infrastructure/schedulers/cierre-consulta.scheduler.spec.ts
git commit -m "feat(scheduler): add CierreConsultaScheduler for auto-close EN_CURSO"
```

---

### Task 7: Wire — controller endpoint, module registration, barrel exports

**Files:**
- Modify: `apps/backend/src/presentation/http/controllers/turnos.controller.ts`
- Modify: `apps/backend/src/application/turnos/turnos.module.ts`
- Modify: `apps/backend/src/application/turnos/use-cases/index.ts`
- Modify: `apps/backend/src/infrastructure/schedulers/schedulers.module.ts`

- [ ] **Step 1: Add barrel export**

```typescript
// apps/backend/src/application/turnos/use-cases/index.ts
export * from './reabrir-consulta-cerrada-auto.use-case';
```

- [ ] **Step 2: Add endpoint to `TurnosController`**

Add import:
```typescript
  ReabrirConsultaCerradaAutoUseCase,
```

Add to constructor:
```typescript
    private readonly reabrirConsultaCerradaAutoUseCase: ReabrirConsultaCerradaAutoUseCase,
```

Add after `finalizarConsulta` method (after line 702):

```typescript
  @Post(':id/reabrir-cierre-auto')
  @Rol(RolEnum.NUTRICIONISTA)
  @UseGuards(TurnoNutricionistaAccessGuard)
  async reabrirCierreAuto(
    @Param('id', ParseIntPipe) turnoId: number,
    @ResourceAccess() access: ContextoAccesoRecurso,
  ): Promise<{ success: boolean; estado: string }> {
    const nutricionistaId = access.actorPersonaId;

    if (nutricionistaId == null) {
      throw new ForbiddenException('No se pudo resolver el profesional.');
    }

    this.logger.log(
      `Reabriendo cierre automático para turno ${turnoId} por nutri ${nutricionistaId}.`,
    );

    return this.reabrirConsultaCerradaAutoUseCase.execute(turnoId, nutricionistaId);
  }
```

- [ ] **Step 3: Register use cases in `TurnosModule`**

Add imports:
```typescript
import { FinalizarConsultaPorInactividadUseCase } from './use-cases/finalizar-consulta-por-inactividad.use-case';
import { ReabrirConsultaCerradaAutoUseCase } from './use-cases/reabrir-consulta-cerrada-auto.use-case';
```

Add to providers (after `RevertirCheckinTurnoUseCase`):
```typescript
    FinalizarConsultaPorInactividadUseCase,
    ReabrirConsultaCerradaAutoUseCase,
```

Add to exports:
```typescript
    FinalizarConsultaPorInactividadUseCase,
    ReabrirConsultaCerradaAutoUseCase,
```

- [ ] **Step 4: Register scheduler in `SchedulersModule`**

Add imports:
```typescript
import { CierreConsultaScheduler } from './cierre-consulta.scheduler';
import { FinalizarConsultaPorInactividadUseCase } from 'src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case';
```

Add to providers (after `AusenciaTurnoScheduler`):
```typescript
    CierreConsultaScheduler,
    FinalizarConsultaPorInactividadUseCase,
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/presentation/http/controllers/turnos.controller.ts apps/backend/src/application/turnos/turnos.module.ts apps/backend/src/application/turnos/use-cases/index.ts apps/backend/src/infrastructure/schedulers/schedulers.module.ts
git commit -m "feat(wire): add reabrir-cierre-auto endpoint and register scheduler"
```

---

### Task 8: Migration

**Files:**
- Create: `apps/backend/src/infrastructure/persistence/typeorm/migrations/20260618120000-CierreAutomaticoConsulta.ts`

- [ ] **Step 1: Create migration file**

```typescript
// apps/backend/src/infrastructure/persistence/typeorm/migrations/20260618120000-CierreAutomaticoConsulta.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class CierreAutomaticoConsulta20260618120000 implements MigrationInterface {
  name = 'CierreAutomaticoConsulta20260618120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('turno', [
      new TableColumn({
        name: 'cierre_automatico',
        type: 'tinyint',
        default: 0,
      }),
      new TableColumn({
        name: 'motivo_cierre_automatico',
        type: 'varchar(50)',
        isNullable: true,
      }),
      new TableColumn({
        name: 'cierre_automatico_en',
        type: 'datetime',
        isNullable: true,
      }),
      new TableColumn({
        name: 'preaviso_cierre_auto_enviado_en',
        type: 'datetime',
        isNullable: true,
      }),
      new TableColumn({
        name: 'reabierta_por_cierre_auto',
        type: 'tinyint',
        default: 0,
      }),
    ]);

    await queryRunner.addColumns('politica_operativa', [
      new TableColumn({
        name: 'umbral_cierre_consulta_min',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'preaviso_cierre_consulta_min',
        type: 'int',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('turno', [
      'cierre_automatico',
      'motivo_cierre_automatico',
      'cierre_automatico_en',
      'preaviso_cierre_auto_enviado_en',
      'reabierta_por_cierre_auto',
    ]);
    await queryRunner.dropColumns('politica_operativa', [
      'umbral_cierre_consulta_min',
      'preaviso_cierre_consulta_min',
    ]);
  }
}
```

- [ ] **Step 2: Run migration up**

```bash
cd apps/backend && npx typeorm migration:run -d src/infrastructure/persistence/typeorm/config/typeorm.config.ts
```
Expected: Migration executed successfully.

- [ ] **Step 3: Test rollback**

```bash
cd apps/backend && npx typeorm migration:revert -d src/infrastructure/persistence/typeorm/config/typeorm.config.ts && npx typeorm migration:run -d src/infrastructure/persistence/typeorm/config/typeorm.config.ts
```
Expected: Revert works, re-run works.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/infrastructure/persistence/typeorm/migrations/20260618120000-CierreAutomaticoConsulta.ts
git commit -m "feat(db): migration for cierre automatico consulta columns"
```

---

### Task 9: Frontend — hook, extend DatosTurno, banner + botón

**Files:**
- Create: `apps/frontend/src/hooks/usarReabrirConsultaCerradaAuto.ts`
- Modify: `apps/frontend/src/pages/ConsultaProfesionalPage.tsx`

- [ ] **Step 1: Create the reabrir hook**

```typescript
// apps/frontend/src/hooks/usarReabrirConsultaCerradaAuto.ts
import { useState } from 'react';
import { apiRequest } from '@/lib/api';

interface UsarReabrirConsultaResultado {
  reabriendo: boolean;
  reabrir: (turnoId: number, token: string) => Promise<void>;
}

export function usarReabrirConsultaCerradaAuto(
  onExito: () => void,
): UsarReabrirConsultaResultado {
  const [reabriendo, setReabriendo] = useState(false);

  const reabrir = async (turnoId: number, token: string) => {
    setReabriendo(true);
    try {
      await apiRequest(`/turnos/${turnoId}/reabrir-cierre-auto`, {
        method: 'POST',
        token,
      });
      onExito();
    } finally {
      setReabriendo(false);
    }
  };

  return { reabriendo, reabrir };
}
```

- [ ] **Step 2: Extend `DatosTurno` interface**

```typescript
// apps/frontend/src/pages/ConsultaProfesionalPage.tsx — DatosTurno, add after consultaId:
  cierreAutomatico?: boolean;
  motivoCierreAutomatico?: string | null;
  cierreAutomaticoEn?: string | null;
  reabiertaPorCierreAuto?: boolean;
```

- [ ] **Step 3: Add import for the hook**

```typescript
// At the top with other imports:
import { usarReabrirConsultaCerradaAuto } from '@/hooks/usarReabrirConsultaCerradaAuto';
```

- [ ] **Step 4: Use hook inside the component**

Add alongside other hooks, before the `if (!esNutricionista)` check:

```typescript
  const { reabriendo, reabrir } = usarReabrirConsultaCerradaAuto(() => {
    cargarDatosTurno();
    toast.success('Consulta reabierta');
  });
```

- [ ] **Step 5: Add banner + botón before the gradient header**

Insert immediately before line 750 (the gradient header div):

```typescript
      {datosTurno.estadoTurno === 'REALIZADO' && datosTurno.cierreAutomatico && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-amber-800">
              Esta consulta fue cerrada automáticamente por inactividad. Reabrí para editarla o finalizala manualmente.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => reabrir(turnoId!, token!)}
              disabled={reabriendo}
              className="shrink-0"
            >
              {reabriendo ? 'Reabriendo...' : 'Reabrir consulta'}
            </Button>
          </div>
        </div>
      )}
```

- [ ] **Step 6: Build and verify typecheck**

```bash
cd apps/frontend && npm run typecheck
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/hooks/usarReabrirConsultaCerradaAuto.ts apps/frontend/src/pages/ConsultaProfesionalPage.tsx
git commit -m "feat(frontend): add banner and button for cierre automatico reapertura"
```

---

## Self-Review Checklist

- [ ] **Spec coverage**: Every requirement from the spec has a corresponding task. Pre-aviso notification (`Tarea 6`), cierre automático (`Tarea 4`), reapertura (`Tarea 5`), configuración por gimnasio (`Tarea 1, 2, 3`), frontend banner (`Tarea 9`).
- [ ] **Placeholder scan**: No "TBD", "TODO", "implement later" in any step.
- [ ] **Type consistency**: `cierreAutomatico` is `boolean` everywhere. `MotivoCierreAutomatico.INACTIVIDAD` is consistent. `preavisoCierreAutoEnviadoEn` is `Date | null` everywhere. No naming mismatches across tasks.
- [ ] **File paths**: All exact, all confirmed via codebase exploration.
- [ ] **Test commands**: All use the same pattern (`cd apps/backend && npx jest --testPathPattern <name> --no-coverage`) with expected output documented.
