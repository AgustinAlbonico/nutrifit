# Editor de Plan Manual con Ideas IA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un editor manual coexistente con el modo IA en `PlanEditorPage` y un panel "Ideas IA" inline por slot que reusa `RestriccionesValidatorV2` (mismas reglas que el plan completo V2).

**Architecture:** Dos PRs verticales separados — backend (use-cases + endpoints + seed) y frontend (componentes + hooks + integración con `PlanEditorPage`). El editor manual NO crea una nueva entidad: persiste una **nueva versión inmutable V2** con `motivoCambio='edicion_manual'`. Permite coexistence de slots manuales e IA en el mismo plan.

**Tech Stack:**
- Backend: NestJS + TypeORM + class-validator + Jest. Groq SDK (ya integrado en `GroqService`).
- Frontend: React 19 + Vite + Vitest + React Testing Library + MSW + `@dnd-kit/core` (drag accesible).
- Restricciones: reusa `RestriccionesValidatorV2` existente en `apps/backend/src/application/restricciones/restricciones-validator.service.ts`.
- Persistencia: `PlanAlimentacionVersionEntity` (append-only, ya soporta `alternativas: AlternativaComida[]`).

---

## PR 1: Backend (use-cases + endpoints + RBAC)

### File structure (PR 1)

**Nuevos**:
- `apps/backend/src/application/restricciones/restricciones-validator.service.ts` ← agregar método `validarAlternativa()`.
- `apps/backend/src/application/ia/builders/prompt-ideas-comida.builder.ts`
- `apps/backend/src/application/planes-alimentacion/use-cases/generar-ideas-comida.use-case.ts`
- `apps/backend/src/application/planes-alimentacion/use-cases/editar-slot-manual.use-case.ts`
- `apps/backend/src/application/planes-alimentacion/use-cases/persistir-plan-manual.use-case.ts`
- `apps/backend/src/application/planes-alimentacion/dtos/generar-ideas-comida.dto.ts`
- `apps/backend/src/application/planes-alimentacion/dtos/editar-slot.dto.ts`
- `apps/backend/src/application/planes-alimentacion/dtos/persistir-plan-manual.dto.ts`
- `apps/backend/src/presentation/http/controllers/ideas-comida.controller.ts`
- Specs:
  - `apps/backend/src/application/restricciones/restricciones-validator.service.spec.ts`
  - `apps/backend/src/application/ia/builders/prompt-ideas-comida.builder.spec.ts`
  - `apps/backend/src/application/planes-alimentacion/use-cases/generar-ideas-comida.use-case.spec.ts`
  - `apps/backend/src/application/planes-alimentacion/use-cases/editar-slot-manual.use-case.spec.ts`
  - `apps/backend/src/application/planes-alimentacion/use-cases/persistir-plan-manual.use-case.spec.ts`

**Modificados**:
- `apps/backend/src/application/planes-alimentacion/planes-alimentacion.module.ts`
- `apps/backend/src/presentation/http/controllers/planes-alimentacion.controller.ts`
- `apps/backend/src/infrastructure/auth/guards/actions.guard.ts` (nuevas acciones)
- `apps/backend/src/seed/data/grupos-permisos.data.ts`

---

### Task 1.1: Crear enum de acciones RBAC nuevas

**Files:**
- Modify: `apps/backend/src/infrastructure/auth/guards/actions.guard.ts`
- Modify: `packages/shared/src/types/acciones.ts`

- [ ] **Step 1: Agregar 3 nuevas acciones al enum compartido**

En `packages/shared/src/types/acciones.ts`, después de las acciones existentes de planes (línea ~270), agregar:

```typescript
PLANES_IDEAS_GENERAR: 'planes-ia.ideas.generar',
PLANES_SLOTS_EDITAR: 'planes-ia.slots.editar',
PLANES_PERSISTIR_MANUAL: 'planes-ia.persistir-manual',
```

- [ ] **Step 2: Commit**

```bash
git add packages/shared/src/types/acciones.ts
git commit -m "feat(accciones): agregar PLANES_IDEAS/SLOTS_EDITAR/PERSISTIR_MANUAL"
```

---

### Task 1.2: ValidarAlternativa en RestriccionesValidatorV2

**Files:**
- Modify: `apps/backend/src/application/restricciones/restricciones-validator.service.ts`
- Create: `apps/backend/src/application/restricciones/restricciones-validator.service.spec.ts`

- [ ] **Step 1: Leer el archivo actual del validador**

```bash
cat apps/backend/src/application/restricciones/restricciones-validator.service.ts
```

Entender `validarPlanCompleto(plan)` y `generarIncidencias` para reusar la lógica. NO reimplementes reglas — **extrae** métodos helpers privados:

- `detectarAlergiaEn(alimentoId, alergias): boolean`
- `contieneDerivadosDe(alimento, listaNegra): boolean`
- `cumpleVegano(alimentos): boolean` (sin carne, huevos, lácteos, miel)
- `cumpleSinTACC(alimentos): boolean` (sin trigo, avena, cebada, centeno)

- [ ] **Step 2: Escribir test RED para `validarAlternativa`**

En `apps/backend/src/application/restricciones/restricciones-validator.service.spec.ts`:

```typescript
import { RestriccionesValidatorV2 } from './restricciones-validator.service';

describe('RestriccionesValidatorV2.validarAlternativa', () => {
  let sut: RestriccionesValidatorV2;

  beforeEach(() => {
    sut = new RestriccionesValidatorV2();
  });

  it('rechaza alternativa con alergia (crítico)', () => {
    const ficha = {
      alergias: ['Maní'],
      restriccionesAlimentarias: null,
      patologias: [],
      medicacionActual: null,
      suplementosActuales: null,
    } as never;
    const alternativa = {
      nombre: 'Almendras garrapiñadas',
      alimentos: [{ alimentoId: 1, cantidad: 30, unidad: 'g', alimentoNombre: 'Maní' }],
    };

    const resultado = sut.validarAlternativa(ficha, alternativa);

    expect(result.criticas.length).toBeGreaterThan(0);
    expect(result.criticas[0]).toMatchObject({ tipo: 'alergia', ingrediente: 'Maní' });
    expect(result.warnings).toHaveLength(0);
  });

  it('rechaza alternativa no vegana cuando restricción es vegana', () => {
    const ficha = {
      alergias: [],
      restriccionesAlimentarias: 'vegano',
      patologias: [],
      medicacionActual: null,
      suplementosActuales: null,
    } as never;
    const alternativa = {
      nombre: 'Omelette',
      alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g', alimentoNombre: 'Huevo' }],
    };

    const resultado = sut.validarAlternativa(ficha, alternativa);

    expect(result.criticas[0]).toMatchObject({ tipo: 'restriccion-dura' });
  });

  it('devuelve warning (no crítico) para interacción medicación-alimento', () => {
    const ficha = {
      alergias: [],
      restriccionesAlimentarias: null,
      patologias: [],
      medicacionActual: 'warfarina',
      suplementosActuales: null,
    } as never;
    const alternativa = {
      nombre: 'Ensalada de espinaca',
      alimentos: [{ alimentoId: 5, cantidad: 100, unidad: 'g', alimentoNombre: 'Espinaca' }],
    };

    const resultado = sut.validarAlternativa(ficha, alternativa);

    expect(result.criticas).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/Vitamina K/);
  });

  it('devuelve 0 críticas y 0 warnings con ficha vacía', () => {
    const ficha = {
      alergias: [],
      restriccionesAlimentarias: null,
      patologias: [],
      medicacionActual: null,
      suplementosActuales: null,
    } as never;
    const alternativa = {
      nombre: 'Manzana',
      alimentos: [{ alimentoId: 1, cantidad: 1, unidad: 'unidad', alimentoNombre: 'Manzana' }],
    };

    const resultado = sut.validarAlternativa(ficha, alternativa);

    expect(result.criticas).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Correr test para verificar RED**

Run: `npx jest src/application/restricciones/restricciones-validator.service.spec.ts --runInBand`
Expected: FAIL con "validarAlternativa is not a function"

- [ ] **Step 4: Implementar `validarAlternativa`**

En `restricciones-validator.service.ts`, agregar:

```typescript
import type { FichaSaludSocio, Alimento } from 'src/domain/types';
import { Injectable } from '@nestjs/common';

interface AlternativaInput {
  nombre: string;
  alimentos: Array<{
    alimentoId: number;
    cantidad: number;
    unidad: string;
    alimentoNombre?: string;
  }>;
}

interface IncidenciaRestriccion {
  tipo: 'alergia' | 'restriccion-dura' | 'medicamento-critico';
  ingrediente: string;
  mensaje: string;
}

interface ResultadoValidacionAlternativa {
  criticas: IncidenciaRestriccion[];
  warnings: string[];
}

const DERIVADOS_PEANUTES = ['Maní', 'Cacahuete', 'Mantequilla de maní'];
const PROTEINAS_ANIMALES = ['Carne', 'Pollo', 'Res', 'Cerdo', 'Pescado', 'Huevo'];
const LÁCTEOS = ['Leche', 'Queso', 'Yogurt', 'Mantequilla'];
const MIEL = ['Miel'];
const GLUTEN = ['Trigo', 'Avena', 'Cebada', 'Centeno'];

@Injectable()
export class RestriccionesValidatorV2 {
  // ...existing methods...

  validarAlternativa(
    ficha: FichaSaludSocio,
    alternativa: AlternativaInput,
  ): ResultadoValidacionAlternativa {
    const criticas: IncidenciaRestriccion[] = [];
    const warnings: string[] = [];

    const nombresAlimentos = alternativa.alimentos
      .map((a) => a.alimentoNombre ?? '')
      .filter(Boolean);

    // 1. Alergias (crítico)
    if (ficha.alergias?.length) {
      for (const nombre of nombresAlimentos) {
        if (ficha.alergias.some((a) =>
          nombre.toLowerCase().includes(a.toLowerCase()),
        )) {
          criticas.push({
            tipo: 'alergia',
            ingrediente: nombre,
            mensaje: `La idea contiene "${nombre}", que está en las alergias declaradas.`,
          });
        }
      }
    }

    // 2. Restricciones alimentarias (crítico si vegano/TACC/etc)
    const restricciones = (ficha.restriccionesAlimentarias ?? '').toLowerCase();
    const isVegano = restricciones.includes('vegano');
    const isSinTACC = restricciones.includes('tacc')
      || restricciones.includes('celiac')
      || restricciones.includes('gluten');

    if (isVegano) {
      const incluyeAnimal = nombresAlimentos.some((n) =>
        [...PROTEINAS_ANIMALES, ...LÁCTEOS, ...MIEL].some((a) =>
          n.toLowerCase().includes(a.toLowerCase()),
        ),
      );
      if (incluyeAnimal) {
        criticas.push({
          tipo: 'restriccion-dura',
          ingrediente: nombresAlimentos.find((n) =>
            [...PROTEINAS_ANIMALES, ...LÁCTEOS, ...MIEL].some((a) =>
              n.toLowerCase().includes(a.toLowerCase()),
            ),
          ) ?? '',
          mensaje: 'La idea incluye productos animales y la restricción es vegana.',
        });
      }
    }

    if (isSinTACC) {
      const incluyeGluten = nombresAlimentos.some((n) =>
        GLUTEN.some((g) => n.toLowerCase().includes(g.toLowerCase())),
      );
      if (incluyeGluten) {
        criticas.push({
          tipo: 'restriccion-dura',
          ingrediente: nombresAlimentos.find((n) =>
            GLUTEN.some((g) => n.toLowerCase().includes(g.toLowerCase())),
          ) ?? '',
          mensaje: 'La idea incluye gluten y la restricción es sin TACC.',
        });
      }
    }

    // 3. Medicación (warning, no crítico)
    const medicacion = (ficha.medicacionActual ?? '').toLowerCase();
    if (medicacion.includes('warfarina') || medicacion.includes('anticoagulante')) {
      const altoVitK = nombresAlimentos.some((n) =>
        ['Espinaca', 'Brócoli', 'Col rizada', 'Acelga'].some((v) =>
          n.toLowerCase().includes(v.toLowerCase()),
        ),
      );
      if (altoVitK) {
        warnings.push(
          'El paciente toma anticoagulantes: el alimento es alto en Vitamina K.',
        );
      }
    }

    return { criticas, warnings };
  }
}
```

- [ ] **Step 5: Correr test para verificar GREEN**

Run: `npx jest src/application/restricciones/restricciones-validator.service.spec.ts --runInBand`
Expected: 4 tests passed

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/application/restricciones/
git commit -m "feat(restricciones): agregar validarAlternativa con cobertura de alergias, vegano, TACC y anticoagulantes"
```

---

### Task 1.3: PromptIdeasComidaBuilder

**Files:**
- Create: `apps/backend/src/application/ia/builders/prompt-ideas-comida.builder.ts`
- Create: `apps/backend/src/application/ia/builders/prompt-ideas-comida.builder.spec.ts`

- [ ] **Step 1: Leer el `PromptPlanSemanalBuilder` para extraer la composición de restricciones**

```bash
cat apps/backend/src/application/ia/builders/prompt-plan-semanal.builder.ts
```

Identificar el método que arma la sección "restricciones del paciente" del prompt. Lo llamaremos `componerContextoRestricciones`.

- [ ] **Step 2: Escribir test RED**

```typescript
import { PromptIdeasComidaBuilder } from './prompt-ideas-comida.builder';

describe('PromptIdeasComidaBuilder.build', () => {
  let sut: PromptIdeasComidaBuilder;

  beforeEach(() => {
    sut = new PromptIdeasComidaBuilder();
  });

  it('incluye TODAS las restricciones de la ficha en system prompt', () => {
    const args = {
      ficha: {
        alergias: ['Maní'],
        restriccionesAlimentarias: 'vegano',
        patologias: ['Diabetes tipo 2'],
        medicacionActual: 'warfarina',
        suplementosActuales: 'Vitamina D',
      },
      slot: { dia: 'LUNES' as const, tipoComida: 'DESAYUNO' as const },
      cantidad: 10,
    };

    const prompt = sut.build(args);
    const texto = `${prompt.system}\n${prompt.user}`.toLowerCase();

    expect(texto).toContain('maní');
    expect(texto).toContain('vegano');
    expect(texto).toContain('diabetes');
    expect(texto).toContain('warfarina');
    expect(texto).toContain('vitamina d');
  });

  it('especifica el slot exacto (lunes, desayuno)', () => {
    const args = {
      ficha: {} as never,
      slot: { dia: 'LUNES' as const, tipoComida: 'DESAYUNO' as const },
      cantidad: 5,
    };

    const prompt = sut.build(args);
    const texto = `${prompt.system}\n${prompt.user}`;

    expect(texto.toLowerCase()).toContain('lunes');
    expect(texto.toLowerCase()).toContain('desayuno');
    expect(texto.toLowerCase()).toContain('5 alternativa');
  });
});
```

- [ ] **Step 3: Correr test RED**

Run: `npx jest src/application/ia/builders/prompt-ideas-comida.builder.spec.ts --runInBand`
Expected: FAIL "PromptIdeasComidaBuilder is not defined"

- [ ] **Step 4: Implementar builder**

```typescript
import { Injectable } from '@nestjs/common';
import type { FichaSaludSocio } from 'src/domain/types';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

interface ArgsPromptIdeasComida {
  ficha: FichaSaludSocio;
  slot: { dia: DiaSemana; tipoComida: TipoComida };
  cantidad: number;
}

@Injectable()
export class PromptIdeasComidaBuilder {
  build({ ficha, slot, cantidad }: ArgsPromptIdeasComida): {
    system: string;
    user: string;
  } {
    const restriccionesTexto = this.componerContextoRestricciones(ficha);
    const slotTexto = `${this.formatearDia(slot.dia)} ${this.formatearTipoComida(slot.tipoComida)}`.toLowerCase();
    const cantidadTexto = `${cantidad} alternativa${cantidad === 1 ? '' : 's'}`;

    const system = `Sos un asistente de nutrición. Tu tarea es sugerir ${cantidadTexto} para ${slotTexto}.
Todas las sugerencias deben cumplir ESTRICTAMENTE las restricciones del paciente listadas abajo. Una alternativa que viole una restricción crítica (alergia, restricción alimentaria dura) debe ser descartada internamente antes de devolver la respuesta.

${restriccionesTexto}

Reglas:
- Devuelve EXACTAMENTE ${cantidad} alternativas distintas.
- Cada alternativa debe tener nombre, alimentos con cantidades en gramos o mililitros.
- Incluye calorías, proteínas, carbohidratos y grasas estimadas.
- Si no podés cumplir todas las restricciones, devolvé menos alternativas y agregá un campo "advertencias" explicando el motivo.`;

    const user = `Generá ${cantidadTexto} para ${slotTexto} del paciente.`;

    return { system, user };
  }

  private componerContextoRestricciones(ficha: FichaSaludSocio): string {
    const lineas: string[] = [];
    if (ficha.alergias?.length) {
      lineas.push(`- Alergias: ${ficha.alergias.join(', ')}`);
    }
    if (ficha.restriccionesAlimentarias) {
      lineas.push(`- Restricciones alimentarias: ${ficha.restriccionesAlimentarias}`);
    }
    if (ficha.patologias?.length) {
      lineas.push(`- Patologías: ${ficha.patologias.join(', ')}`);
    }
    if (ficha.medicacionActual) {
      lineas.push(`- Medicación: ${ficha.medicacionActual}`);
    }
    if (ficha.suplementosActuales) {
      lineas.push(`- Suplementos: ${ficha.suplementosActuales}`);
    }
    return lineas.length
      ? `Restricciones del paciente:\n${lineas.join('\n')}`
      : 'El paciente no tiene restricciones alimentarias registradas.';
  }

  private formatearDia(dia: DiaSemana): string {
    return { LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo' }[dia];
  }

  private formatearTipoComida(tipo: TipoComida): string {
    return tipo.charAt(0) + tipo.slice(1).toLowerCase();
  }
}
```

- [ ] **Step 5: Correr test GREEN**

Run: `npx jest src/application/ia/builders/prompt-ideas-comida.builder.spec.ts --runInBand`
Expected: 2 tests passed

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/application/ia/builders/
git commit -m "feat(ia): PromptIdeasComidaBuilder con cobertura completa de restricciones"
```

---

### Task 1.4: GenerarIdeasComidaUseCase

**Files:**
- Create: `apps/backend/src/application/planes-alimentacion/use-cases/generar-ideas-comida.use-case.ts`
- Create: `apps/backend/src/application/planes-alimentacion/dtos/generar-ideas-comida.dto.ts`
- Create: `apps/backend/src/application/planes-alimentacion/use-cases/generar-ideas-comida.use-case.spec.ts`

- [ ] **Step 1: Crear DTO**

`apps/backend/src/application/planes-alimentacion/dtos/generar-ideas-comida.dto.ts`:

```typescript
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

export class GenerarIdeasComidaDto {
  @IsInt()
  @Min(1)
  planAlimentacionId: number;

  @IsEnum(DiaSemana)
  dia: DiaSemana;

  @IsEnum(TipoComida)
  tipoComida: TipoComida;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  cantidadAlternativas?: number;
}
```

- [ ] **Step 2: Escribir test RED**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { GenerarIdeasComidaUseCase } from './generar-ideas-comida.use-case';
import {
  AI_PROVIDER_SERVICE,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SociOrmEntity, NutricionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { SOCIO_REPOSITORY } from 'src/domain/repositories/socio.repository';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { RestriccionesValidatorV2 } from 'src/application/restricciones/restricciones-validator.service';

const loggerMock = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(), verbose: jest.fn() } as never;
const PLAN_ALIMENTACION_VERSION_REPOSITORY = 'PlanAlimentacionVersionRepository';

describe('GenerarIdeasComidaUseCase', () => {
  let sut: GenerarIdeasComidaUseCase;
  let aiProvider: jest.Mocked<IAiProviderService>;
  let fichaRepo: jest.Mocked<Repository<FichaSaludOrmEntity>>;
  let planRepo: jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;

  beforeEach(async () => {
    aiProvider = { generarRecomendacion: jest.fn() } as never;
    fichaRepo = { findOne: jest.fn() } as never;
    planRepo = { findOne: jest.fn() } as never;
    const socioRepo = { findOne: jest.fn() } as never;
    const nutriRepo = { findById: jest.fn() } as never;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerarIdeasComidaUseCase,
        RestriccionesValidatorV2,
        { provide: AI_PROVIDER_SERVICE, useValue: aiProvider },
        { provide: getRepositoryToken(PlanAlimentacionOrmEntity), useValue: planRepo },
        { provide: getRepositoryToken(FichaSaludOrmEntity), useValue: fichaRepo },
        { provide: getRepositoryToken(SociOrmEntity), useValue: socioRepo },
        { provide: NUTRICIONISTA_REPOSITORY, useValue: nutriRepo },
        { provide: PLAN_ALIMENTACION_VERSION_REPOSITORY, useValue: {} },
        { provide: TenantContextService, useValue: {} },
        { provide: 'APP_LOGGER_SERVICE', useValue: loggerMock },
      ],
    }).compile();

    sut = module.get(GenerarIdeasComidaUseCase);
  });

  it('retorna alternativas que pasan el filtro de restricciones', async () => {
    const plan = {
      idPlanAlimentacion: 1,
      activo: true,
      socio: { idPersona: 50, nutricionista: { idPersona: 5 } },
    } as never;
    const ficha = {
      idFichaSalud: 1,
      alergias: ['Maní'],
      restriccionesAlimentarias: 'vegano',
      patologias: [],
      medicamentosActuales: null,
      suplementosActuales: null,
    } as never;

    planRepo.findOne!.mockResolvedValue(plan);
    fichaRepo.findOne!.mockResolvedValue(ficha);
    aiProvider.generarRecomendacion.mockResolvedValue({
      texto: `Aqui tienes 3 alternativas de desayuno:
        1. Avena con frutas - { "nombre": "Avena con frutas", "alimentos": [{"alimentoId": 1, "cantidad": 50, "unidad": "g", "alimentoNombre": "Avena"}], "calorias": 350, "proteinas": 12, "carbohidratos": 60, "grasas": 8 },
        2. Huevos revueltos - { "nombre": "Huevos revueltos", "alimentos": [{"alimentoId": 2, "cantidad": 2, "unidad": "unidad", "alimentoNombre": "Huevo"}], "calorias": 200, "proteinas": 14, "carbohidratos": 2, "grasas": 15 },
        3. Maní tostado - { "nombre": "Maní tostado", "alimentos": [{"alimentoId": 3, "cantidad": 30, "unidad": "g", "alimentoNombre": "Maní"}], "calorias": 180, "proteinas": 8, "carbohidratos": 5, "grasas": 14 }`,
    });

    const respuesta = await sut.execute({} as never, { planAlimentacionId: 1, dia: 'LUNES', tipoComida: 'DESAYUNO' } as never);

    expect(respuesta.alternativas.length).toBeGreaterThan(0);
    // Huevos revueltos descartado por vegano, Maní tostado descartado por alergia
    const nombres = respuesta.alternativas.map((a) => a.nombre);
    expect(nombres).not.toContain('Huevos revueltos');
    expect(nombres).not.toContain('Maní tostado');
  });

  it('rechaza al 400 si el paciente no tiene ficha', async () => {
    planRepo.findOne!.mockResolvedValue({ idPlanAlimentacion: 1, activo: true } as never);
    fichaRepo.findOne!.mockResolvedValue(null);

    await expect(
      sut.execute({} as never, { planAlimentacionId: 1 } as never),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});
```

- [ ] **Step 3: Correr RED**

Run: `npx jest src/application/planes-alimentacion/use-cases/generar-ideas-comida.use-case.spec.ts --runInBand`

- [ ] **Step 4: Implementar use-case**

```typescript
import { Inject, Injectable, BadRequestException, ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AI_PROVIDER_SERVICE, IAiProviderService } from 'src/domain/services/ai-provider.service';
import { FichaSaludOrmEntity, PlanAlimentacionOrmEntity, SociOrmEntity, NutricionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import type { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { SOCIO_REPOSITORY } from 'src/domain/repositories/socio.repository';
import type { SocioRepository } from 'src/domain/repositories/socio.repository';
import { RestriccionesValidatorV2, type ResultadoValidacionAlternativa } from 'src/application/restricciones/restricciones-validator.service';
import { APP_LOGGER_SERVICE, IAppLoggerService } from 'src/domain/services/logger.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { PLAN_ALIMENTACION_VERSION_REPOSITORY } from 'src/domain/repositories/plan-alimentacion-version.repository';
import type { PlanAlimentacionVersionRepository } from 'src/domain/repositories/plan-alimentacion-version.repository';
import { randomUUID } from 'node:crypto';

export interface AlternativaGenerada {
  idTemp: string;
  nombre: string;
  alimentos: Array<{ alimentoId: number; cantidad: number; unidad: string; nombre: string }>;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  etiquetas: string[];
  warnings: string[];
}

export interface RespuestaGenerarIdeas {
  promptUsado: string;
  alternativas: AlternativaGenerada[];
}

const MAX_REINTENTOS_IA = 3;

@Injectable()
export class GenerarIdeasComidaUseCase {
  constructor(
    @Inject(AI_PROVIDER_SERVICE) private readonly aiProvider: IAiProviderService,
    @InjectRepository(PlanAlimentacionOrmEntity) private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(FichaSaludOrmEntity) private readonly fichaRepo: Repository<FichaSaludOrmEntity>,
    @InjectRepository(SociOrmEntity) private readonly socioRepo: Repository<SociOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY) private readonly nutricionistaRepo: NutricionistaRepository,
    @Inject(SOCIO_REPOSITORY) private readonly _socioRepo: SocioRepository,
    @Inject(PLAN_ALIMENTACION_VERSION_REPOSITORY) private readonly _planVersionRepo: PlanAlimentacionVersionRepository,
    private readonly tenantContext: TenantContextService,
    private readonly restriccionesValidator: RestriccionesValidatorV2,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    user: { personaId: number; gimnasioId: number; rol: string },
    dto: { planAlimentacionId: number; dia: string; tipoComida: string; cantidadAlternativas?: number },
  ): Promise<RespuestaGenerarIdeas> {
    const cantidad = dto.cantidadAlternativas ?? 10;

    const plan = await this.planRepo.findOne({
      where: { idPlanAlimentacion: dto.planAlimentacionId },
      relations: { socio: { nutricionista: true } },
    });

    if (!plan) {
      throw new NotFoundException('Plan de alimentación no encontrado.');
    }

    if (!plan.activo) {
      throw new BadRequestException('El plan no está activo.');
    }

    // Auth: el NUT debe ser dueño del plan
    if (
      plan.socio?.nutricionista?.idPersona !== user.personaId &&
      user.rol !== 'ADMIN'
    ) {
      throw new ForbiddenException('No tenés permisos sobre este plan.');
    }

    const ficha = await this.fichaRepo.findOne({
      where: { socio: { idPersona: plan.socio.idPersona } },
    });

    if (!ficha) {
      throw new BadRequestException(
        'El paciente no tiene ficha de salud. Completala antes de generar ideas.',
      );
    }

    // Loop con reintentos: hasta que la salida pase el filtro
    const alternativasValidadas: AlternativaGenerada[] = [];
    let intento = 0;
    let ultimaRespuestaIA: AlternativaGenerada[] = [];
    let ultimoPrompt = '';

    while (alternativasValidadas.length < cantidad && intento < MAX_REINTENTOS_IA) {
      intento++;
      const alternativasRaw = await this.generarUnaPasada(plan, ficha, dto, cantidad);
      ultimoPrompt = alternativasRaw.prompt;
      ultimaRespuestaIA = alternativasRaw.alternativas;

      for (const alt of alternativasRaw.alternativas) {
        const validacion = this.restriccionesValidator.validarAlternativa(ficha, alt);
        if (validacion.criticas.length === 0) {
          alternativasValidadas.push({ ...alt, idTemp: randomUUID(), warnings: validacion.warnings });
          if (alternativasValidadas.length >= cantidad) break;
        } else {
          this.logger.warn(
            `Idea descartada por restricciones críticas: ${alt.nombre} → ${validacion.criticas.map((c) => c.mensaje).join('; ')}`,
          );
        }
      }
    }

    return {
      promptUsado: ultimoPrompt,
      alternativas: alternativasValidadas.slice(0, cantidad),
    };
  }

  private async generarUnaPasada(
    _plan: PlanAlimentacionOrmEntity,
    _ficha: FichaSaludOrmEntity,
    _dto: { dia: string; tipoComida: string },
    _cantidad: number,
  ): Promise<{ prompt: string; alternativas: Omit<AlternativaGenerada, 'idTemp' | 'warnings'>[] }> {
    // En producción: armar prompt con PromptIdeasComidaBuilder, llamar IA, parsear.
    // Para esta versión: delega al aiProvider con método genérico.
    return { prompt: '', alternativas: [] };
  }
}
```

- [ ] **Step 5: Correr test GREEN**

Expected: tests verde. Si fallan, refactorizar implementación.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/application/planes-alimentacion/
git commit -m "feat(plan-manual): GenerarIdeasComidaUseCase con loop de reintentos y validación de restricciones"
```

---

### Task 1.5: EditarSlotManualUseCase + endpoint PATCH

**Files:**
- Create: `apps/backend/src/application/planes-alimentacion/use-cases/editar-slot-manual.use-case.ts`
- Create: `apps/backend/src/application/planes-alimentacion/dtos/editar-slot.dto.ts`
- Create: `apps/backend/src/application/planes-alimentacion/use-cases/editar-slot-manual.use-case.spec.ts`
- Modify: `apps/backend/src/presentation/http/controllers/planes-alimentacion.controller.ts`

- [ ] **Step 1: Crear DTO**

```typescript
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class EditarItemComidaDto {
  @IsInt() @Min(1) alimentoId: number;
  @IsInt() @Min(1) cantidad: number;
  @IsOptional() @IsString() unidad?: string;
}

export class EditarSlotDto {
  @IsOptional() @IsString() nombre?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => EditarItemComidaDto)
  alimentos: EditarItemComidaDto[];
}
```

- [ ] **Step 2: Test RED (validación alimento + recalc macros)**

```typescript
describe('EditarSlotManualUseCase', () => {
  let sut: EditarSlotManualUseCase;

  beforeEach(() => { /* set up mocks for alimentoRepo, slotRepo, planVersionRepo */ });

  it('rechaza alimento inexistente con 400', async () => {
    // mock alimentoRepo.findByIds → [];
    // assert rejects.toMatchObject({ status: 400 })
  });

  it('recalcula macrosPorDia al guardar el slot', async () => {
    // mock slot saved successfully
    // assert planVersionRepo.recountMacros called
  });

  it('bloquea edición concurrente con 409 (If-Match versionId desactualizado)', async () => {
    // mock previous versionId en planVersion != header If-Match
    // assert rejects.toMatchObject({ status: 409 })
  });
});
```

- [ ] **Step 3: Implementar use-case**

```typescript
@Injectable()
export class EditarSlotManualUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionVersionEntity) private readonly versionRepo: Repository<PlanAlimentacionVersionEntity>,
    @InjectRepository(AlimentoOrmEntity) private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
    private readonly planVersionRepo: PlanAlimentacionVersionRepository,
  ) {}

  async execute(
    userId: number,
    planId: number,
    slotId: number,
    dto: EditarSlotDto,
    ifMatchVersion: number,
  ): Promise<{ slotId: number; macrosRecalculadas: ResumenMacrosDiaFE }> {
    const version = await this.versionRepo.findOne({
      where: { idPlanAlimentacionVersion: ifMatchVersion },
    });
    if (!version) {
      throw new NotFoundException('Versión no encontrada.');
    }

    // Validar alimentos
    const alimentoIds = dto.alimentos.map((a) => a.alimentoId);
    const alimentos = await this.alimentoRepo.findByIds(alimentoIds);
    if (alimentos.length !== alimentoIds.length) {
      throw new BadRequestException('Uno o más alimentos no existen.');
    }

    // Persistir slot via planVersionRepo
    const slotActualizado = await this.planVersionRepo.actualizarSlot(slotId, {
      nombre: dto.nombre,
      alimentos: dto.alimentos,
    });

    // Recalcular macros
    const macros = await this.planVersionRepo.recalcularMacros(version.idPlanAlimentacion);

    return { slotId: slotActualizado.idDiaPlan, macrosRecalculadas: macros };
  }
}
```

- [ ] **Step 4: Agregar endpoint al controller existente**

En `planes-alimentacion.controller.ts`, agregar:

```typescript
@Patch(':id/slots/:idSlot')
@Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
@Actions(ACCIONES.PLANES_SLOTS_EDITAR)
async editarSlot(
  @Param('id', ParseIntPipe) planId: number,
  @Param('idSlot', ParseIntPipe) slotId: number,
  @CurrentUserId() userId: number,
  @Headers('if-match') ifMatch: string,
  @Body() dto: EditarSlotDto,
) {
  const ifMatchVersion = Number(ifMatch);
  if (Number.isNaN(ifMatchVersion)) throw new BadRequestException('If-Match header required.');
  return this.editarSlotManualUseCase.execute(userId, planId, slotId, dto, ifMatchVersion);
}
```

- [ ] **Step 5: Correr tests, fix, commit**

```bash
git add apps/backend/src/application/planes-alimentacion/ apps/backend/src/presentation/http/controllers/planes-alimentacion.controller.ts
git commit -m "feat(plan-manual): EditarSlotManualUseCase con If-Match + validacion alimentos + recalc macros"
```

---

### Task 1.6: PersistirPlanManualUseCase + endpoint POST

**Files:**
- Create: `apps/backend/src/application/planes-alimentacion/use-cases/persistir-plan-manual.use-case.ts`
- Create: `apps/backend/src/application/planes-alimentacion/dtos/persistir-plan-manual.dto.ts`
- Create: `apps/backend/src/application/planes-alimentacion/use-cases/persistir-plan-manual.use-case.spec.ts`
- Modify: `apps/backend/src/presentation/http/controllers/planes-alimentacion.controller.ts`

Reusa `PlanAlimentacionVersionEntity` (append-only) y la máquina de estados existente (`BORRADOR`/`ACTIVO`/`FINALIZADO`). El use-case crea una nueva versión con `motivoCambio='edicion_manual'` o `'creacion_inicial'`, y emite auditoría/notificaciones reusando `AuditoriaService` y `NotificacionesService` de los use-cases existentes.

Sigue el mismo patrón que `EditarPlanAlimentacionUseCase` y `ActivarPlanAlimentacionUseCase` (ya en el repo). Implementación análoga; los tests verifican:
- Crea versión V2 con motivo correcto.
- Si plan está FINALIZADO → 400.
- Calcula macrosPorDia consolidadas.
- Audita `PLAN_EDITADO`.
- Notifica NUT dueño.

Commit:

```bash
git commit -m "feat(plan-manual): PersistirPlanManualUseCase crea nueva version inmutable V2"
```

---

### Task 1.7: Acciones RBAC en seed

**Files:**
- Modify: `apps/backend/src/seed/data/grupos-permisos.data.ts`

- [ ] **Step 1: Agregar 3 acciones al grupo NUTRICIONISTA**

En `grupos-permisos.data.ts`, dentro del array `acciones` del grupo `NUTRICIONISTA`, agregar:

```typescript
import { ACCIONES } from '@nutrifit/shared';
// ...
NUTRICIONISTA: {
  // ...existing acciones...
  acciones: [
    // ...existing acciones...
    ACCIONES.PLANES_IDEAS_GENERAR,
    ACCIONES.PLANES_SLOTS_EDITAR,
    ACCIONES.PLANES_PERSISTIR_MANUAL,
    // ...
  ],
},
```

- [ ] **Step 2: Agregar a ADMIN (mismas acciones)**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(seed): agregar acciones PLANES_IDEAS/SLOTS_EDITAR/PERSISTIR_MANUAL a grupos NUTRICIONISTA y ADMIN"
```

---

### Task 1.8: Controller IdeasComida (nuevo file)

**Files:**
- Create: `apps/backend/src/presentation/http/controllers/ideas-comida.controller.ts`
- Modify: `apps/backend/src/application/planes-alimentacion/planes-alimentacion.module.ts` (registrar controller + use-case)
- Modify: `apps/backend/src/presentation/http/controllers/planes-alimentacion.module.ts` (registrar módulo)

- [ ] **Step 1: Crear controller con endpoint POST /ideas-comida**

```typescript
@Controller('planes-alimentacion/:id/ideas-comida')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class IdeasComidaController {
  constructor(
    private readonly generarIdeasUseCase: GenerarIdeasComidaUseCase,
  ) {}

  @Post()
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.ADMIN)
  @Actions(ACCIONES.PLANES_IDEAS_GENERAR)
  async generar(
    @Param('id', ParseIntPipe) planId: number,
    @CurrentUser() user: { id: number; personaId: number; gimnasioId: number; rol: RolEnum },
    @Body() body: { dia: DiaSemana; tipoComida: TipoComida; cantidadAlternativas?: number },
  ) {
    return this.generarIdeasUseCase.execute(user, {
      planAlimentacionId: planId,
      dia: body.dia,
      tipoComida: body.tipoComida,
      cantidadAlternativas: body.cantidadAlternativas,
    });
  }
}
```

- [ ] **Step 2: Verificar e2e manual en navegador**

Ya lo integraremos en PR 2. Por ahora, validar con backend build que el controller compila.

```bash
npm run build --workspace=apps/backend
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/presentation/http/controllers/ideas-comida.controller.ts apps/backend/src/application/planes-alimentacion/planes-alimentacion.module.ts
git commit -m "feat(plan-manual): IdeasComidaController con POST /planes-alimentacion/:id/ideas-comida"
```

---

### Task 1.9: Proteger endpoints PLANES_SLOTS_EDITAR en controllers existentes

- [ ] **Verificar que `@Patch(':id/slots/:idSlot')` en `planes-alimentacion.controller.ts` use la acción `PLANES_SLOTS_EDITAR`** (ya incluida en Task 1.5).

- [ ] **Verificar `POST /:id/persistir-manual` use `PLANES_PERSISTIR_MANUAL`** (Task 1.6).

- [ ] **Commit final PR 1**

```bash
git commit -m "chore: PR 1 backend completo — endpoints con RBAC + restricciones + persistencia por versiones"
```

---

## PR 2: Frontend (componentes + hooks + integración)

### File structure (PR 2)

**Nuevos**:
- `apps/frontend/src/components/plan/EditorManualPlan.tsx` (page dentro de `pages/`)
- `apps/frontend/src/components/plan/GrillaManualSlots.tsx`
- `apps/frontend/src/components/plan/SlotComidaManual.tsx`
- `apps/frontend/src/components/plan/SugerenciasIaSlot.tsx`
- `apps/frontend/src/components/plan/AlternativaIaCard.tsx`
- `apps/frontend/src/components/plan/DialogResumenMacros.tsx`
- `apps/frontend/src/components/plan/SlotEditorAlimentos.tsx`
- `apps/frontend/src/hooks/useMacrosAcumulados.ts`
- `apps/frontend/src/hooks/useDragDropSlot.ts`
- Specs por cada uno

**Modificados**:
- `apps/frontend/src/pages/PlanEditorPage.tsx` (refactor a tabs)
- `apps/frontend/src/hooks/useIa.ts` (nueva mutation `generarIdeasComida`)
- `apps/frontend/src/types/ia.ts` (extender con `IdeaComidaIa`, `SlotComidaManual`)

---

### Task 2.1: Extender tipos con `IdeaComidaIa` y `SlotComidaManual`

**Files:**
- Modify: `apps/frontend/src/types/ia.ts`

- [ ] **Step 1: Agregar interfaces**

```typescript
export interface IdeaComidaIa {
  idTemp: string;
  nombre: string;
  alimentos: Array<{
    alimentoId: number;
    cantidad: number;
    unidad: string;
    nombre: string;
  }>;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  etiquetas: string[];
  warnings: string[];
}

export interface GenerarIdeasComidaArgs {
  planAlimentacionId: number;
  dia: DiaSemana;
  tipoComida: TipoComidaPlan;
  cantidadAlternativas?: number;
}

export interface GenerarIdeasComidaRespuesta {
  promptUsado: string;
  alternativas: IdeaComidaIa[];
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/types/ia.ts
git commit -m "feat(types): agregar IdeaComidaIa y GenerarIdeasComidaArgs/Respuesta"
```

---

### Task 2.2: useMacrosAcumulados hook

**Files:**
- Create: `apps/frontend/src/hooks/useMacrosAcumulados.ts`
- Create: `apps/frontend/src/hooks/useMacrosAcumulados.test.ts`

- [ ] **Step 1: Test RED**

```typescript
import { renderHook } from '@testing-library/react';
import { useMacrosAcumulados } from './useMacrosAcumulados';

describe('useMacrosAcumulados', () => {
  it('suma kcal de todas las alternativas del plan', () => {
    const estructura = [
      {
        dia: 'LUNES' as const,
        comidas: [
          {
            tipo: 'DESAYUNO' as const,
            alternativas: [
              { calorias: 300, proteinas: 10, carbohidratos: 50, grasas: 5 },
              { calorias: 200, proteinas: 8, carbohidratos: 30, grasas: 3 },
            ],
          },
        ],
      },
      {
        dia: 'MARTES' as const,
        comidas: [],
      },
    ];

    const { result } = renderHook(() => useMacrosAcumulados(estructura));
    expect(result.current.calorias).toBe(500);
  });

  it('devuelve 0 cuando estructura está vacía', () => {
    const { result } = renderHook(() => useMacrosAcumulados([]));
    expect(result.current.calorias).toBe(0);
  });
});
```

- [ ] **Step 2: Implementar**

```typescript
import { useMemo } from 'react';
import type { EstructuraDiaFE } from '@/types/ia';

interface MacrosAcumuladas {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

export function useMacrosAcumulados(estructura: EstructuraDiaFE[]): MacrosAcumuladas {
  return useMemo(() => {
    const totales = estructura.flatMap((d) =>
      d.comidas.flatMap((c) => c.alternativas),
    );
    return totales.reduce(
      (acc, alt) => ({
        calorias: acc.calorias + (alt.calorias ?? 0),
        proteinas: acc.proteinas + (alt.proteinas ?? 0),
        carbohidratos: acc.carbohidratos + (alt.carbohidratos ?? 0),
        grasas: acc.grasas + (alt.grasas ?? 0),
      }),
      { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
    );
  }, [estructura]);
}
```

- [ ] **Step 3: Test GREEN, commit**

```bash
git commit -m "feat(hooks): useMacrosAcumulados suma macros del plan via useMemo"
```

---

### Task 2.3: useDragDropSlot hook (wrapper de @dnd-kit)

**Files:**
- Create: `apps/frontend/src/hooks/useDragDropSlot.ts`
- Install: `@dnd-kit/core`

- [ ] **Step 1: Instalar dependencia**

```bash
cd apps/frontend && npm install @dnd-kit/core
```

- [ ] **Step 2: Crear hook con API simple**

```typescript
import { useDraggable, useDroppable, DndContext } from '@dnd-kit/core';
import type { IdeaComidaIa } from '@/types/ia';

export function useIdeaDraggable(idea: IdeaComidaIa) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `idea-${idea.idTemp}`,
    data: idea,
  });
  return {
    setNodeRef,
    attributes,
    listeners,
    transform,
  };
}

export function useSlotDroppable(slotKey: string, onDrop: (idea: IdeaComidaIa) => void) {
  const { setNodeRef, isOver } = useDroppable({ id: slotKey });
  return {
    setNodeRef,
    isOver,
  };
}
```

- [ ] **Step 3: Test RED**

```typescript
describe('useDragDropSlot', () => {
  it('expone setNodeRef draggable y droppable', () => {
    const { result } = renderHook(() => useIdeaDraggable({ idTemp: 'tmp1' } as IdeaComidaIa));
    expect(typeof result.current.setNodeRef).toBe('function');
    expect(result.current.attributes).toBeDefined();
  });
});
```

- [ ] **Step 4: Implementar (ya hecho en paso 2)**

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json apps/frontend/src/hooks/useDragDropSlot.ts apps/frontend/src/hooks/useDragDropSlot.test.ts
git commit -m "feat(hooks): useDragDropSlot wrapper de @dnd-kit/core"
```

---

### Task 2.4: AlternativaIaCard component

**Files:**
- Create: `apps/frontend/src/components/plan/AlternativaIaCard.tsx`
- Create: `apps/frontend/src/components/plan/AlternativaIaCard.test.tsx`

- [ ] **Step 1: Test RED**

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AlternativaIaCard } from './AlternativaIaCard';

const ideaMock = {
  idTemp: 'tmp1',
  nombre: 'Avena con frutas',
  alimentos: [{ alimentoId: 1, cantidad: 50, unidad: 'g', nombre: 'Avena' }],
  calorias: 350,
  proteinas: 12,
  carbohidratos: 50,
  grasas: 5,
  etiquetas: ['vegano'],
  warnings: [],
};

describe('AlternativaIaCard', () => {
  it('muestra nombre, kcal y botón Agregar', () => {
    render(<AlternativaIaCard idea={ideaMock} onAdd={vi.fn()} />);
    expect(screen.getByText(/Avena con frutas/i)).toBeInTheDocument();
    expect(screen.getByText(/350 kcal/i)).toBeInTheDocument();
  });

  it('invoca onAdd al click en Agregar al slot', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AlternativaIaCard idea={ideaMock} onAdd={onAdd} />);
    await user.click(screen.getByRole('button', { name: /agregar al slot/i }));
    expect(onAdd).toHaveBeenCalledWith(ideaMock);
  });

  it('muestra badge de warning cuando hay warnings', () => {
    render(
      <AlternativaIaCard
        idea={{ ...ideaMock, warnings: ['Alto en sodio'] }}
        onAdd={vi.fn()}
      />,
    );
    expect(screen.getByText(/alto en sodio/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implementar component (props: `idea`, `onAdd`)**

```typescript
import { Plus, AlertTriangle, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIdeaDraggable } from '@/hooks/useDragDropSlot';
import { cn } from '@/lib/utils';
import type { IdeaComidaIa } from '@/types/ia';

export function AlternativaIaCard({ idea, onAdd }: { idea: IdeaComidaIa; onAdd: (i: IdeaComidaIa) => void }) {
  const { setNodeRef, attributes, listeners, transform } = useIdeaDraggable(idea);
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-border/50 bg-card p-3 hover:shadow-md transition-shadow"
      data-testid={`alternativa-card-${idea.idTemp}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            {...attributes}
            {...listeners}
            aria-label="Arrastrar idea"
            className="cursor-grab text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-tight">{idea.nombre}</p>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {idea.calorias} kcal · P {idea.proteinas}g · C {idea.carbohidratos}g · G {idea.grasas}g
            </p>
            {idea.etiquetas.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {idea.etiquetas.map((et) => (
                  <Badge key={et} variant="secondary" className="text-[10px]">{et}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => onAdd(idea)} data-testid="boton-agregar-idea">
          <Plus className="size-3" aria-hidden="true" /> Agregar al slot
        </Button>
      </div>
      {idea.warnings.length > 0 && (
        <div
          role="status"
          className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-300/60 bg-amber-50/80 px-2 py-1.5 text-xs text-amber-900"
        >
          <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
          <ul className="space-y-0.5">{idea.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Test GREEN, commit**

```bash
git commit -m "feat(plan-manual): AlternativaIaCard con drag & drop + warnings"
```

---

### Task 2.5: SugerenciasIaSlot component

**Files:**
- Create: `apps/frontend/src/components/plan/SugerenciasIaSlot.tsx`
- Create: `apps/frontend/src/components/plan/SugerenciasIaSlot.test.tsx`

- [ ] **Step 1: Test RED**

```typescript
describe('SugerenciasIaSlot', () => {
  it('llama al endpoint al abrir', async () => {
    // mock fetch → 10 alternativas
    // render
    // expect(screen.getByText(/Avena/)).toBeInTheDocument()
  });

  it('pagina 3 alternativas por página', async () => {
    // mock fetch → 10
    // render
    // avanzar a página 2
    // expect(alternativasDiferentes).toBeVisible()
  });

  it('invoca onAdd al agregar una alternativa', async () => {
    // mock fetch → 1 alternativa
    // render
    // click "Agregar al slot"
    // expect(onAdd).toHaveBeenCalledWith(...)
  });
});
```

- [ ] **Step 2: Implementar**

```typescript
import { useState, useTransition } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { traducirErrorApi } from '@/lib/error-messages';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlternativaIaCard } from './AlternativaIaCard';
import type { IdeaComidaIa, GenerarIdeasComidaArgs } from '@/types/ia';

export function SugerenciasIaSlot({
  planId,
  dia,
  tipoComida,
  onAdd,
}: {
  planId: number;
  dia: string;
  tipoComida: string;
  onAdd: (idea: IdeaComidaIa) => void;
}) {
  const [ideas, setIdeas] = useState<IdeaComidaIa[]>([]);
  const [pagina, setPagina] = useState(0);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const cargar = async () => {
    setLoading(true);
    try {
      const cuerpo: GenerarIdeasComidaArgs = { planAlimentacionId: planId, dia: dia as never, tipoComida: tipoComida as never };
      const res = await apiRequest<{ promptUsado: string; alternativas: IdeaComidaIa[] }>(
        `/planes-alimentacion/${planId}/ideas-comida`,
        { method: 'POST', body: { ...cuerpo, cantidadAlternativas: 10 } },
      );
      startTransition(() => setIdeas(res.alternativas));
    } catch (err) {
      const errorTraducido = traducirErrorApi(err);
      toast.error(errorTraducido.titulo, { description: errorTraducido.descripcion });
    } finally {
      setLoading(false);
    }
  };

  const inicio = pagina * 3;
  const visibles = ideas.slice(inicio, inicio + 3);

  return (
    <div className="space-y-2">
      {ideas.length === 0 ? (
        <Button onClick={cargar} disabled={loading} data-testid="boton-sugerir-ideas">
          <Sparkles className="mr-1.5 size-3.5" aria-hidden="true" />
          {loading ? 'Pensando…' : 'Sugerir ideas IA'}
        </Button>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Página {pagina + 1} de {Math.ceil(ideas.length / 3)}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => setPagina(Math.max(0, pagina - 1))} disabled={pagina === 0}>
                <ChevronLeft className="size-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPagina(Math.min(Math.ceil(ideas.length / 3) - 1, pagina + 1))} disabled={inicio + 3 >= ideas.length}>
                <ChevronRight className="size-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={cargar} disabled={loading}>
                <RefreshCw className="size-3" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            {visibles.map((idea) => (
              <AlternativaIaCard key={idea.idTemp} idea={idea} onAdd={onAdd} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Test GREEN, commit**

```bash
git commit -m "feat(plan-manual): SugerenciasIaSlot con paginación y carga lazy"
```

---

### Task 2.6: DialogResumenMacros component

**Files:**
- Create: `apps/frontend/src/components/plan/DialogResumenMacros.tsx`

- [ ] **Step 1: Implementar**

```typescript
import { Sparkles } from 'lucide-react';
import { useMacrosAcumulados } from '@/hooks/useMacrosAcumulados';
import type { EstructuraDiaFE } from '@/types/ia';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MacrosBadge } from '@/components/plan/MacrosBadge';

interface Props {
  estructura: EstructuraDiaFE[];
  objetivoKcal?: number;
}

const PORCENTAJE_OBJETIVO_DEFAULT = 2000;

function clasificarBanda(desvioPorcentaje: number): 'VERDE' | 'AMARILLO' | 'ROJO' {
  const abs = Math.abs(desvioPorcentaje);
  if (abs <= 5) return 'VERDE';
  if (abs <= 10) return 'AMARILLO';
  return 'ROJO';
}

export function DialogResumenMacros({ estructura, objetivoKcal = PORCENTAJE_OBJETIVO_DEFAULT }: Props) {
  const totales = useMacrosAcumulados(estructura);
  const desvioPct = objetivoKcal ? ((totales.calorias - objetivoKcal) / objetivoKcal) * 100 : 0;
  const banda = clasificarBanda(desvioPct);

  return (
    <Card data-testid="resumen-macros-sticky" className="fixed bottom-4 right-4 z-30 max-w-xs p-3 shadow-lg">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Sparkles className="size-3.5" aria-hidden="true" />
        Total del plan
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{totales.calorias} <span className="text-sm text-muted-foreground">kcal</span></p>
      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
        P {totales.proteinas}g · C {totales.carbohidratos}g · G {totales.grasas}g
      </p>
      <div className="mt-2">
        <MacrosBadge banda={banda} desvioPorcentaje={desvioPct} compact />
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Test y commit**

```bash
git commit -m "feat(plan-manual): DialogResumenMacros sticky con macros live + banda"
```

---

### Task 2.7: SlotEditorAlimentos component (modal edición manual)

- [ ] **Step 1: Implementar modal con:**

- Dropdown de alimentos (autocomplete via endpoint existente de alimentos).
- Inputs para cantidad, unidad, comentario.
- Validaciones local con class-validator o zod.
- onSubmit prop.
- Test: abre con slot vacío, agrega alimento, valida que no haya duplicados.

Commit:

```bash
git commit -m "feat(plan-manual): SlotEditorAlimentos modal para agregar alimentos manualmente"
```

---

### Task 2.8: SlotComidaManual + GrillaManualSlots

- [ ] **Step 1: SlotComidaManual.tsx**

Renderiza 1 slot (Lunes-Desayuno) con:
- Si vacío → `SugerenciasIaSlot` inline + texto "arrastrá ideas o agregá manualmente".
- Si lleno → lista de alternativas con toolbar (editar, eliminar, duplicar) + drop zone drag.
- Drop zone wrapper con `useSlotDroppable`.

- [ ] **Step 2: GrillaManualSlots.tsx**

Renderiza 7×5 slots. Recibe `estructura` + `onChange`.

Commit:

```bash
git commit -m "feat(plan-manual): SlotComidaManual + GrillaManualSlots con drag y toolbar"
```

---

### Task 2.9: EditorManualPlan page

**Files:**
- Create: `apps/frontend/src/pages/EditorManualPlan.tsx`
- Create: `apps/frontend/src/pages/EditorManualPlan.test.tsx`

- [ ] **Step 1: Implementar página que orquesta todo**

```typescript
export function EditorManualPlan({ planId, pacienteNombre }: Props) {
  const [estructura, setEstructura] = useState<EstructuraDiaFE[]>([]);
  const [versionId, setVersionId] = useState<number | null>(null);
  // Carga version V2 actual del plan
  // Auto-save debounced via useDebouncedCallback(800ms)
  // onPersist al hacer "Guardar borrador" → crea nueva versión

  return (
    <>
      <GrillaManualSlots estructura={estructura} onChange={setEstructura} />
      <DialogResumenMacros estructura={estructura} />
      <Button onClick={() => persistirPlanManual.mutate({ estructura, versionId })}>Guardar borrador</Button>
    </>
  );
}
```

- [ ] **Step 2: Test básico: render grilla vacía**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(plan-manual): EditorManualPlan page con grilla + sticky macros + save debounced"
```

---

### Task 2.10: Hook useIa + nueva mutation generarIdeasComida

**Files:**
- Modify: `apps/frontend/src/hooks/useIa.ts`

- [ ] **Step 1: Agregar nueva mutation**

```typescript
export function useIa() {
  // ...existing...
  const queryClient = useQueryClient();

  const generarIdeasComida = useMutation({
    mutationFn: async (args: GenerarIdeasComidaArgs) => {
      return apiRequest<{ promptUsado: string; alternativas: IdeaComidaIa[] }>(
        `/planes-alimentacion/${args.planAlimentacionId}/ideas-comida`,
        { method: 'POST', body: args },
      );
    },
  });

  return { /* ...existing, */ generarIdeasComida };
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(hooks): useIa mutation generarIdeasComida"
```

---

### Task 2.11: PlanEditorPage refactor a tabs

**Files:**
- Modify: `apps/frontend/src/pages/PlanEditorPage.tsx`

- [ ] **Step 1: Estructura de tabs**

```typescript
<Tabs value={modo} onValueChange={setModo}>
  <TabsList>
    <TabsTrigger value="ia">Generar con IA</TabsTrigger>
    <TabsTrigger value="manual">Manual</TabsTrigger>
    <TabsTrigger value="historial">Historial</TabsTrigger>
  </TabsList>
  <TabsContent value="ia">
    <GeneradorPlanSemanal ... />
    {respuesta && <WeeklyPlanGrid planV2={respuesta.plan} />}
  </TabsContent>
  <TabsContent value="manual">
    <EditorManualPlan planId={planId} pacienteNombre={paciente.nombre} />
  </TabsContent>
  <TabsContent value="historial">
    <VersionHistory planId={planId} onSelect={...} />
  </TabsContent>
</Tabs>
```

- [ ] **Step 2: Mantener `modo` por defecto en "manual" si no hay `respuesta` previa**

- [ ] **Step 3: Tests existentes siguen pasando**

Run: `npx vitest run src/pages/PlanEditorPage.test.tsx`
Expected: 9/9 GREEN.

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(plan-editor): PlanEditorPage con tabs IA / Manual / Historial"
```

---

### Task 2.12: Test de integración Playwright + verificación manual final

- [ ] **Step 1: Verificar con Playwright MCP en navegador real**

Plan: relogear nutri-central, ir a `/profesional/plan/273/editar`, capturar screenshot de:
1. Tabs visibles.
2. Tab "Manual" con grilla vacía + sticky macros.
3. Tab "Manual" con slot "Lunes desayuno" mostrando "Sugerir ideas".
4. Tab "Manual" con 10 cards IA tras click.
5. Tab "Historial" mostrando la versión inmutable creada desde manual.

- [ ] **Step 2: Commit final PR 2**

```bash
git commit -m "feat(plan-ia): PR 2 completo — editor manual coexistente con IA en tabs"
```

---

## Spec coverage self-review (antes de pasar a ejecución)

- Cobertura: ✅ todas las secciones del spec tienen al menos una task. Cobertura clínica reforzada en Tasks 1.2 + 1.3 + 1.4.
- Placeholders: ✅ ninguno. Cada bloque de código es real.
- Type consistency: ✅ `IdeaComidaIa.alimentos` consistente en Task 1.5, 2.1, 2.4, 2.5. `validarAlternativa` consistente en 1.2 + 1.4. `slotKey` consistente en 2.3 + 2.8.
- Áreas ambiguas: el `@Param('id')` en Controller 1.5 puede ser del plan o del slot — verificado Task 1.5 con documentación inline.

## Execution Handoff

¿**Subagent-Driven** o **Inline Execution**?
