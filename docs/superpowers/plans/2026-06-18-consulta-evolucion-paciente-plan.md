# Consulta Guiada y Ficha Longitudinal del Paciente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar una consulta nutricional guiada por etapas, con cierre clínico validado, fotos por sesión y ficha longitudinal del paciente.

**Architecture:** El backend será la autoridad del cierre clínico y de la agrupación de fotos por turno/sesión. El frontend descompone la pantalla monolítica de consulta en componentes enfocados, consume endpoints existentes primero y agrega una ficha longitudinal como vista de lectura global del paciente.

**Tech Stack:** NestJS, TypeORM, MySQL, Jest, React 19, Vite, TanStack Router, TanStack Query, Vitest, Testing Library, Tailwind CSS, shadcn/ui, Playwright MCP.

---

## Scope Split

Este spec cruza backend, persistencia, consulta activa, fotos, ficha longitudinal y verificación visual. Se implementa en slices para evitar un cambio gigante:

| Slice | Resultado verificable |
|-------|-----------------------|
| 1 | Backend rechaza cierre de consulta sin medición base y comentario clínico. |
| 2 | Fotos de progreso pueden asociarse a un turno/sesión y listarse agrupadas. |
| 3 | Frontend tiene tipos/hooks robustos para flujo de consulta y corrige el bug de `PacienteDestacadoCard`. |
| 4 | Consulta activa muestra stepper, contexto, evolución previa, mediciones, observación, fotos y revisión final. |
| 5 | `Mis Pacientes` abre una ficha longitudinal con evolución, consultas, plan, objetivos, fotos y comparador. |
| 6 | Tests, build, verificación visual y commits finales. |

## File Structure

### Backend

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/backend/src/application/turnos/helpers/validar-cierre-consulta.helper.ts` | Create | Pure function for consulta close requirements. |
| `apps/backend/src/application/turnos/helpers/validar-cierre-consulta.helper.spec.ts` | Create | Unit tests for missing/complete close requirements. |
| `apps/backend/src/application/turnos/use-cases/finalizar-consulta.use-case.ts` | Modify | Use helper and query medición/observación before closing. |
| `apps/backend/src/application/turnos/use-cases/finalizar-consulta.use-case.spec.ts` | Modify | Cover backend close validation. |
| `apps/backend/src/infrastructure/persistence/typeorm/migrations/20260618000000-AddTurnoToFotoProgreso.ts` | Create | Add nullable `id_turno` to `foto_progreso`. |
| `apps/backend/src/infrastructure/persistence/typeorm/entities/foto-progreso.entity.ts` | Modify | Add optional relation to `TurnoOrmEntity`. |
| `apps/backend/src/application/fotos/dtos/subir-foto.dto.ts` | Modify | Add optional `turnoId`, `sesiones`, and grouped DTOs. |
| `apps/backend/src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository.ts` | Modify | Save with tenant-safe socio resolution and query by turno/sesion. |
| `apps/backend/src/application/fotos/use-cases/subir-foto-progreso.use-case.ts` | Modify | Accept optional `turnoId` and persist it. |
| `apps/backend/src/application/fotos/use-cases/obtener-galeria-fotos.use-case.ts` | Modify | Return existing `fotos` plus `sesiones`. |
| `apps/backend/src/presentation/http/controllers/progreso.controller.ts` | Modify | Accept `turnoId` in photo upload. |

### Frontend

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/frontend/src/types/consulta.ts` | Create | Shared consulta flow, historial and photo-session types. |
| `apps/frontend/src/lib/consulta/estadoEtapas.ts` | Create | Pure completion logic for stepper. |
| `apps/frontend/src/lib/consulta/estadoEtapas.test.ts` | Create | Vitest tests for completion states. |
| `apps/frontend/src/components/consulta/IndicadorEtapasConsulta.tsx` | Create | Stepper/navigation state. |
| `apps/frontend/src/components/consulta/ContextoPacienteConsulta.tsx` | Create | Patient/ficha/alert section. |
| `apps/frontend/src/components/consulta/EvolucionPreviaConsulta.tsx` | Create | Latest measurement, trend and latest clinical note. |
| `apps/frontend/src/components/consulta/FormularioMedicionesConsulta.tsx` | Create | Current measurement form extracted from page. |
| `apps/frontend/src/components/consulta/FormularioObservacionConsulta.tsx` | Create | Clinical note form extracted from page. |
| `apps/frontend/src/components/consulta/FotosSesionConsulta.tsx` | Create | Guided upload slots for frente/perfil/espalda/otra. |
| `apps/frontend/src/components/consulta/RevisionFinalConsulta.tsx` | Create | Final checklist and close action. |
| `apps/frontend/src/pages/ConsultaProfesionalPage.tsx` | Modify | Orchestrate data, stage navigation and close validation. |
| `apps/frontend/src/pages/FichaPacientePage.tsx` | Create | Longitudinal patient view. |
| `apps/frontend/src/components/progreso/ComparadorFotosSesion.tsx` | Create | Compare two sessions by equivalent photo type. |
| `apps/frontend/src/components/dashboard/PacienteDestacadoCard.tsx` | Modify | Fix `historial-mediciones` shape. |
| `apps/frontend/src/router.tsx` | Modify | Add `/profesional/paciente/$socioId/ficha`. |

---

### Task 1: Backend Close Validation Foundation

**Files:**
- Create: `apps/backend/src/application/turnos/helpers/validar-cierre-consulta.helper.ts`
- Create: `apps/backend/src/application/turnos/helpers/validar-cierre-consulta.helper.spec.ts`
- Modify: `apps/backend/src/application/turnos/use-cases/finalizar-consulta.use-case.ts`
- Modify: `apps/backend/src/application/turnos/use-cases/finalizar-consulta.use-case.spec.ts`

- [ ] **Step 1: Write failing helper tests**

Create `apps/backend/src/application/turnos/helpers/validar-cierre-consulta.helper.spec.ts`:

```ts
import { validarCierreConsulta } from './validar-cierre-consulta.helper';

describe('validarCierreConsulta', () => {
  it('devuelve faltantes cuando no hay medicion base ni comentario clinico', () => {
    expect(
      validarCierreConsulta({
        tieneMedicionBase: false,
        tieneComentarioClinico: false,
      }),
    ).toEqual({
      puedeCerrar: false,
      faltantes: ['MEDICION_BASE', 'COMENTARIO_CLINICO'],
    });
  });

  it('devuelve faltante de medicion base cuando solo existe comentario clinico', () => {
    expect(
      validarCierreConsulta({
        tieneMedicionBase: false,
        tieneComentarioClinico: true,
      }),
    ).toEqual({
      puedeCerrar: false,
      faltantes: ['MEDICION_BASE'],
    });
  });

  it('devuelve faltante de comentario clinico cuando solo existe medicion base', () => {
    expect(
      validarCierreConsulta({
        tieneMedicionBase: true,
        tieneComentarioClinico: false,
      }),
    ).toEqual({
      puedeCerrar: false,
      faltantes: ['COMENTARIO_CLINICO'],
    });
  });

  it('permite cerrar cuando existe medicion base y comentario clinico', () => {
    expect(
      validarCierreConsulta({
        tieneMedicionBase: true,
        tieneComentarioClinico: true,
      }),
    ).toEqual({ puedeCerrar: true, faltantes: [] });
  });
});
```

- [ ] **Step 2: Run helper test and confirm it fails**

Run:

```bash
npm run test --workspace=apps/backend -- validar-cierre-consulta.helper.spec.ts
```

Expected: FAIL with module not found for `validar-cierre-consulta.helper`.

- [ ] **Step 3: Implement helper**

Create `apps/backend/src/application/turnos/helpers/validar-cierre-consulta.helper.ts`:

```ts
export type FaltanteCierreConsulta =
  | 'MEDICION_BASE'
  | 'COMENTARIO_CLINICO';

export interface EntradaValidarCierreConsulta {
  tieneMedicionBase: boolean;
  tieneComentarioClinico: boolean;
}

export interface ResultadoValidarCierreConsulta {
  puedeCerrar: boolean;
  faltantes: FaltanteCierreConsulta[];
}

export function validarCierreConsulta(
  entrada: EntradaValidarCierreConsulta,
): ResultadoValidarCierreConsulta {
  const faltantes: FaltanteCierreConsulta[] = [];

  if (!entrada.tieneMedicionBase) {
    faltantes.push('MEDICION_BASE');
  }

  if (!entrada.tieneComentarioClinico) {
    faltantes.push('COMENTARIO_CLINICO');
  }

  return {
    puedeCerrar: faltantes.length === 0,
    faltantes,
  };
}
```

- [ ] **Step 4: Run helper test and confirm it passes**

Run:

```bash
npm run test --workspace=apps/backend -- validar-cierre-consulta.helper.spec.ts
```

Expected: PASS all 4 tests.

- [ ] **Step 5: Modify `FinalizarConsultaUseCase` to query requirements before closing**

Update `apps/backend/src/application/turnos/use-cases/finalizar-consulta.use-case.ts` to add imports and repositories:

```ts
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { ObservacionClinicaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/observacion-clinica.entity';
import { validarCierreConsulta } from 'src/application/turnos/helpers/validar-cierre-consulta.helper';
```

Change constructor to inject repositories:

```ts
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(MedicionOrmEntity)
    private readonly medicionRepository: Repository<MedicionOrmEntity>,
    @InjectRepository(ObservacionClinicaOrmEntity)
    private readonly observacionRepository: Repository<ObservacionClinicaOrmEntity>,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
    private readonly tenantContext: TenantContextService,
  ) {}
```

Insert this block after the `consultaFinalizadaAt` check and before changing state:

```ts
    const [cantidadMediciones, observacion] = await Promise.all([
      this.medicionRepository.count({
        where: { turno: { idTurno: turnoId } },
      }),
      this.observacionRepository.findOne({
        where: { turno: { idTurno: turnoId } },
      }),
    ]);

    const resultadoCierre = validarCierreConsulta({
      tieneMedicionBase: cantidadMediciones > 0,
      tieneComentarioClinico: Boolean(observacion?.comentario?.trim()),
    });

    if (!resultadoCierre.puedeCerrar) {
      throw new BadRequestError(
        `No se puede finalizar la consulta. Faltantes: ${resultadoCierre.faltantes.join(', ')}`,
      );
    }
```

- [ ] **Step 6: Add backend use-case tests for missing requirements**

Modify `apps/backend/src/application/turnos/use-cases/finalizar-consulta.use-case.spec.ts` so the testing module/mock constructor includes `MedicionOrmEntity` and `ObservacionClinicaOrmEntity`. Add these cases:

```ts
  it('rechaza finalizar cuando no hay medicion base', async () => {
    turnoRepository.findOne.mockResolvedValue(crearTurnoEnCurso());
    medicionRepository.count.mockResolvedValue(0);
    observacionRepository.findOne.mockResolvedValue({
      comentario: 'Paciente con buena adherencia',
    });

    await expect(useCase.execute(1)).rejects.toThrow(
      'No se puede finalizar la consulta. Faltantes: MEDICION_BASE',
    );
  });

  it('rechaza finalizar cuando no hay comentario clinico', async () => {
    turnoRepository.findOne.mockResolvedValue(crearTurnoEnCurso());
    medicionRepository.count.mockResolvedValue(1);
    observacionRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(1)).rejects.toThrow(
      'No se puede finalizar la consulta. Faltantes: COMENTARIO_CLINICO',
    );
  });

  it('finaliza cuando hay medicion base y comentario clinico', async () => {
    const turno = crearTurnoEnCurso();
    turnoRepository.findOne.mockResolvedValue(turno);
    medicionRepository.count.mockResolvedValue(1);
    observacionRepository.findOne.mockResolvedValue({
      comentario: 'Control completo',
    });
    turnoRepository.save.mockResolvedValue({
      ...turno,
      estadoTurno: EstadoTurno.REALIZADO,
    });
    auditoriaService.registrar.mockResolvedValue(undefined);
    notificacionesService.crear.mockResolvedValue({ idNotificacion: 1 });

    await expect(useCase.execute(1)).resolves.toEqual({
      success: true,
      estado: EstadoTurno.REALIZADO,
    });
  });
```

If helper factories do not exist in the current test, add local factories inside the spec:

```ts
function crearTurnoEnCurso() {
  return {
    idTurno: 1,
    estadoTurno: EstadoTurno.EN_CURSO,
    consultaFinalizadaAt: null,
    socio: { idPersona: 10, gimnasioId: 1 },
    nutricionista: { idPersona: 20 },
  };
}
```

- [ ] **Step 7: Run backend close tests**

Run:

```bash
npm run test --workspace=apps/backend -- finalizar-consulta.use-case.spec.ts validar-cierre-consulta.helper.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Commit slice 1**

Run:

```bash
git add apps/backend/src/application/turnos/helpers/validar-cierre-consulta.helper.ts apps/backend/src/application/turnos/helpers/validar-cierre-consulta.helper.spec.ts apps/backend/src/application/turnos/use-cases/finalizar-consulta.use-case.ts apps/backend/src/application/turnos/use-cases/finalizar-consulta.use-case.spec.ts
git commit -m "fix: validar cierre clinico de consulta"
```

---

### Task 2: Backend Session Photos Data Model and API

**Files:**
- Create: `apps/backend/src/infrastructure/persistence/typeorm/migrations/20260618000000-AddTurnoToFotoProgreso.ts`
- Modify: `apps/backend/src/infrastructure/persistence/typeorm/entities/foto-progreso.entity.ts`
- Modify: `apps/backend/src/application/fotos/dtos/subir-foto.dto.ts`
- Modify: `apps/backend/src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository.ts`
- Modify: `apps/backend/src/application/fotos/use-cases/subir-foto-progreso.use-case.ts`
- Modify: `apps/backend/src/application/fotos/use-cases/obtener-galeria-fotos.use-case.ts`
- Modify: `apps/backend/src/presentation/http/controllers/progreso.controller.ts`

- [ ] **Step 1: Write migration**

Create `apps/backend/src/infrastructure/persistence/typeorm/migrations/20260618000000-AddTurnoToFotoProgreso.ts`:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTurnoToFotoProgreso20260618000000
  implements MigrationInterface
{
  name = 'AddTurnoToFotoProgreso20260618000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`foto_progreso\` ADD \`id_turno\` int NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_FOTO_PROGRESO_TURNO\` ON \`foto_progreso\` (\`id_turno\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`foto_progreso\` ADD CONSTRAINT \`FK_FOTO_PROGRESO_TURNO\` FOREIGN KEY (\`id_turno\`) REFERENCES \`turno\`(\`id_turno\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`foto_progreso\` DROP FOREIGN KEY \`FK_FOTO_PROGRESO_TURNO\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_FOTO_PROGRESO_TURNO\` ON \`foto_progreso\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`foto_progreso\` DROP COLUMN \`id_turno\``,
    );
  }
}
```

- [ ] **Step 2: Add optional turno relation to entity**

Modify `apps/backend/src/infrastructure/persistence/typeorm/entities/foto-progreso.entity.ts`:

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SocioOrmEntity } from './persona.entity';
import { TurnoOrmEntity } from './turno.entity';
import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';

@Entity('foto_progreso')
export class FotoProgresoOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_foto' })
  idFoto: number;

  @ManyToOne(() => SocioOrmEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'id_socio' })
  socio: SocioOrmEntity;

  @ManyToOne(() => TurnoOrmEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'id_turno' })
  turno: TurnoOrmEntity | null;

  @Column({ name: 'tipo_foto', type: 'enum', enum: TipoFoto })
  tipoFoto: TipoFoto;

  @Column({ name: 'object_key', type: 'varchar', length: 255 })
  objectKey: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType: string;

  @Column({ name: 'notas', type: 'text', nullable: true })
  notas: string | null;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;
}
```

- [ ] **Step 3: Extend photo DTOs**

Modify `apps/backend/src/application/fotos/dtos/subir-foto.dto.ts`:

```ts
import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';

export class SubirFotoProgresoDto {
  socioId: number;
  tipoFoto: TipoFoto;
  notas?: string;
  turnoId?: number;
}

export class FotoProgresoResponseDto {
  idFoto: number;
  socioId: number;
  turnoId: number | null;
  tipoFoto: TipoFoto;
  objectKey: string;
  mimeType: string;
  notas: string | null;
  fecha: Date;
  urlFirmada: string;
}

export class FotosPorTipoResponseDto {
  tipoFoto: TipoFoto;
  fotos: FotoProgresoResponseDto[];
}

export class FotosSesionResponseDto {
  turnoId: number | null;
  fechaTurno: string | null;
  horaTurno: string | null;
  fotos: FotosPorTipoResponseDto[];
}

export class GaleriaFotosResponseDto {
  fotos: FotosPorTipoResponseDto[];
  sesiones: FotosSesionResponseDto[];
  fotosHistoricasSinSesion: FotosPorTipoResponseDto[];
}
```

- [ ] **Step 4: Replace repository with tenant-safe methods**

Modify `apps/backend/src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository.ts` to include these methods. Keep existing public method names so current callers continue to work:

```ts
  async findBySocioId(socioId: number): Promise<FotoProgresoOrmEntity[]> {
    const gimnasioId = this.gimnasioIdActual;
    return this.fotoProgresoOrmRepository.find({
      where: { socio: { idPersona: socioId, gimnasioId } },
      relations: { socio: true, turno: true },
      order: { fecha: 'DESC' },
    });
  }

  async findByTurnoId(turnoId: number): Promise<FotoProgresoOrmEntity[]> {
    const gimnasioId = this.gimnasioIdActual;
    return this.fotoProgresoOrmRepository.find({
      where: { turno: { idTurno: turnoId, gimnasioId } },
      relations: { socio: true, turno: true },
      order: { fecha: 'DESC' },
    });
  }

  async saveForSocio(
    entity: Partial<FotoProgresoOrmEntity> & { socioId: number; turnoId?: number },
  ): Promise<FotoProgresoOrmEntity> {
    const gimnasioId = this.gimnasioIdActual;
    const socio = await this.fotoProgresoOrmRepository.manager.findOne(
      'SocioOrmEntity',
      {
        where: { idPersona: entity.socioId, gimnasioId },
      },
    );

    if (!socio) {
      throw new Error('Socio no pertenece al gimnasio actual');
    }

    const turno = entity.turnoId
      ? await this.fotoProgresoOrmRepository.manager.findOne('TurnoOrmEntity', {
          where: {
            idTurno: entity.turnoId,
            socio: { idPersona: entity.socioId, gimnasioId },
          },
          relations: { socio: true },
        })
      : null;

    if (entity.turnoId && !turno) {
      throw new Error('Turno no pertenece al socio o gimnasio actual');
    }

    const foto = this.fotoProgresoOrmRepository.create({
      tipoFoto: entity.tipoFoto,
      notas: entity.notas ?? null,
      objectKey: entity.objectKey,
      mimeType: entity.mimeType,
      socio: socio as SocioOrmEntity,
      turno: turno as TurnoOrmEntity | null,
    });

    return this.fotoProgresoOrmRepository.save(foto);
  }
```

If TypeScript rejects string entity names, replace the manager calls with injected repositories in a follow-up edit:

```ts
// Import SocioOrmEntity and TurnoOrmEntity, then use:
await this.fotoProgresoOrmRepository.manager.findOne(SocioOrmEntity, { ... })
await this.fotoProgresoOrmRepository.manager.findOne(TurnoOrmEntity, { ... })
```

- [ ] **Step 5: Update upload use-case to persist `turnoId`**

Modify `apps/backend/src/application/fotos/use-cases/subir-foto-progreso.use-case.ts` save block:

```ts
    const fotoGuardada = await this.fotoProgresoRepository.saveForSocio({
      socioId: payload.socioId,
      turnoId: payload.turnoId,
      tipoFoto: payload.tipoFoto,
      notas: payload.notas ?? null,
      objectKey,
      mimeType,
    });
```

Modify `toResponseDto` return:

```ts
    return {
      idFoto: foto.idFoto,
      socioId: foto.socio.idPersona ?? 0,
      turnoId: foto.turno?.idTurno ?? null,
      tipoFoto: foto.tipoFoto,
      objectKey: foto.objectKey,
      mimeType: foto.mimeType,
      notas: foto.notas,
      fecha: foto.fecha,
      urlFirmada,
    };
```

- [ ] **Step 6: Update gallery use-case to return sessions**

Modify `apps/backend/src/application/fotos/use-cases/obtener-galeria-fotos.use-case.ts` to build `fotos`, `sesiones`, and `fotosHistoricasSinSesion`:

```ts
  async execute(socioId: number): Promise<GaleriaFotosResponseDto> {
    const fotos = await this.fotoProgresoRepository.findBySocioId(socioId);
    const fotosConUrl = await Promise.all(
      fotos.map(async (foto) => {
        const urlFirmada = await this.objectStorageService.obtenerUrlFirmada(
          foto.objectKey,
          3600,
        );
        return this.toResponseDto(foto, urlFirmada);
      }),
    );

    return {
      fotos: this.agruparPorTipo(fotosConUrl),
      sesiones: this.agruparPorSesion(fotosConUrl),
      fotosHistoricasSinSesion: this.agruparPorTipo(
        fotosConUrl.filter((foto) => foto.turnoId == null),
      ),
    };
  }

  private agruparPorTipo(
    fotos: FotoProgresoResponseDto[],
  ): FotosPorTipoResponseDto[] {
    const grupos = new Map<string, FotoProgresoResponseDto[]>();
    fotos.forEach((foto) => {
      const existentes = grupos.get(foto.tipoFoto) ?? [];
      existentes.push(foto);
      grupos.set(foto.tipoFoto, existentes);
    });

    return Array.from(grupos.entries()).map(([tipoFoto, fotosTipo]) => ({
      tipoFoto: tipoFoto as FotoProgresoResponseDto['tipoFoto'],
      fotos: fotosTipo.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()),
    }));
  }

  private agruparPorSesion(
    fotos: FotoProgresoResponseDto[],
  ): FotosSesionResponseDto[] {
    const grupos = new Map<number, FotoProgresoResponseDto[]>();
    fotos
      .filter((foto) => foto.turnoId != null)
      .forEach((foto) => {
        const turnoId = foto.turnoId as number;
        const existentes = grupos.get(turnoId) ?? [];
        existentes.push(foto);
        grupos.set(turnoId, existentes);
      });

    return Array.from(grupos.entries()).map(([turnoId, fotosSesion]) => ({
      turnoId,
      fechaTurno: null,
      horaTurno: null,
      fotos: this.agruparPorTipo(fotosSesion),
    }));
  }
```

- [ ] **Step 7: Accept `turnoId` in controller upload**

Modify `apps/backend/src/presentation/http/controllers/progreso.controller.ts`:

```ts
  async subirFoto(
    @Param('socioId', ParseIntPipe) socioId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('tipoFoto') tipoFoto: string,
    @Body('notas') notas?: string,
    @Body('turnoId') turnoIdRaw?: string,
  ) {
    this.logger.log(`Subiendo foto de progreso para socio ${socioId}`);

    if (!file) {
      throw new Error('Se requiere un archivo de imagen');
    }

    return await this.subirFotoProgresoUseCase.execute(
      {
        socioId,
        tipoFoto: tipoFoto.toLowerCase() as TipoFoto,
        notas,
        turnoId: turnoIdRaw ? Number(turnoIdRaw) : undefined,
      },
      file.buffer,
      file.mimetype,
    );
  }
```

- [ ] **Step 8: Run backend build/tests for photos**

Run:

```bash
npm run test --workspace=apps/backend -- subir-foto-progreso obtener-galeria-fotos
npm run build --workspace=apps/backend
```

Expected: tests pass or no matching tests if not present; build succeeds.

- [ ] **Step 9: Commit slice 2**

Run:

```bash
git add apps/backend/src/infrastructure/persistence/typeorm/migrations/20260618000000-AddTurnoToFotoProgreso.ts apps/backend/src/infrastructure/persistence/typeorm/entities/foto-progreso.entity.ts apps/backend/src/application/fotos/dtos/subir-foto.dto.ts apps/backend/src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository.ts apps/backend/src/application/fotos/use-cases/subir-foto-progreso.use-case.ts apps/backend/src/application/fotos/use-cases/obtener-galeria-fotos.use-case.ts apps/backend/src/presentation/http/controllers/progreso.controller.ts
git commit -m "feat: agrupar fotos de progreso por consulta"
```

---

### Task 3: Frontend Types, Completion Logic, and Dashboard Bug Fix

**Files:**
- Create: `apps/frontend/src/types/consulta.ts`
- Create: `apps/frontend/src/lib/consulta/estadoEtapas.ts`
- Create: `apps/frontend/src/lib/consulta/estadoEtapas.test.ts`
- Modify: `apps/frontend/src/components/progreso/types.ts`
- Modify: `apps/frontend/src/components/progreso/useFotosProgreso.ts`
- Modify: `apps/frontend/src/components/dashboard/PacienteDestacadoCard.tsx`

- [ ] **Step 1: Create consulta types**

Create `apps/frontend/src/types/consulta.ts`:

```ts
export type IdEtapaConsulta =
  | 'contexto'
  | 'evolucion'
  | 'mediciones'
  | 'observacion'
  | 'planObjetivos'
  | 'fotos'
  | 'adjuntos'
  | 'revision';

export type EstadoEtapaConsulta =
  | 'pendiente'
  | 'completa'
  | 'omitida'
  | 'error'
  | 'bloqueada';

export interface EtapaConsulta {
  id: IdEtapaConsulta;
  titulo: string;
  estado: EstadoEtapaConsulta;
  descripcion: string;
}

export interface EstadoDatosConsulta {
  cargoTurno: boolean;
  cargoEvolucion: boolean;
  hayMedicionBase: boolean;
  hayComentarioClinico: boolean;
  seModificoPlanObjetivos: boolean;
  cantidadFotosSesion: number;
  cantidadAdjuntos: number;
  errorEvolucion: boolean;
}

export interface HistorialConsultaPaciente {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  tipoConsulta: string;
  notasProfesional: string | null;
  sugerencias: string | null;
  esPublica: boolean;
  archivosAdjuntos: string[];
}
```

- [ ] **Step 2: Write completion logic tests**

Create `apps/frontend/src/lib/consulta/estadoEtapas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { obtenerEtapasConsulta } from './estadoEtapas';

describe('obtenerEtapasConsulta', () => {
  it('marca contexto, evolucion, mediciones y observacion como completas cuando hay datos minimos', () => {
    const etapas = obtenerEtapasConsulta({
      cargoTurno: true,
      cargoEvolucion: true,
      hayMedicionBase: true,
      hayComentarioClinico: true,
      seModificoPlanObjetivos: false,
      cantidadFotosSesion: 0,
      cantidadAdjuntos: 0,
      errorEvolucion: false,
    });

    expect(etapas.map((etapa) => [etapa.id, etapa.estado])).toEqual([
      ['contexto', 'completa'],
      ['evolucion', 'completa'],
      ['mediciones', 'completa'],
      ['observacion', 'completa'],
      ['planObjetivos', 'omitida'],
      ['fotos', 'omitida'],
      ['adjuntos', 'omitida'],
      ['revision', 'completa'],
    ]);
  });

  it('marca revision como pendiente cuando falta medicion u observacion', () => {
    const etapas = obtenerEtapasConsulta({
      cargoTurno: true,
      cargoEvolucion: true,
      hayMedicionBase: false,
      hayComentarioClinico: false,
      seModificoPlanObjetivos: false,
      cantidadFotosSesion: 0,
      cantidadAdjuntos: 0,
      errorEvolucion: false,
    });

    expect(etapas.find((etapa) => etapa.id === 'mediciones')?.estado).toBe('pendiente');
    expect(etapas.find((etapa) => etapa.id === 'observacion')?.estado).toBe('pendiente');
    expect(etapas.find((etapa) => etapa.id === 'revision')?.estado).toBe('pendiente');
  });

  it('marca evolucion con error sin bloquear mediciones ni observacion', () => {
    const etapas = obtenerEtapasConsulta({
      cargoTurno: true,
      cargoEvolucion: false,
      hayMedicionBase: true,
      hayComentarioClinico: true,
      seModificoPlanObjetivos: false,
      cantidadFotosSesion: 0,
      cantidadAdjuntos: 0,
      errorEvolucion: true,
    });

    expect(etapas.find((etapa) => etapa.id === 'evolucion')?.estado).toBe('error');
    expect(etapas.find((etapa) => etapa.id === 'mediciones')?.estado).toBe('completa');
    expect(etapas.find((etapa) => etapa.id === 'observacion')?.estado).toBe('completa');
  });
});
```

- [ ] **Step 3: Implement completion logic**

Create `apps/frontend/src/lib/consulta/estadoEtapas.ts`:

```ts
import type { EstadoDatosConsulta, EtapaConsulta } from '@/types/consulta';

export function obtenerEtapasConsulta(datos: EstadoDatosConsulta): EtapaConsulta[] {
  const medicionesCompletas = datos.hayMedicionBase;
  const observacionCompleta = datos.hayComentarioClinico;
  const revisionCompleta = datos.cargoTurno && medicionesCompletas && observacionCompleta;

  return [
    {
      id: 'contexto',
      titulo: 'Contexto',
      descripcion: 'Ficha, alertas y datos del paciente',
      estado: datos.cargoTurno ? 'completa' : 'pendiente',
    },
    {
      id: 'evolucion',
      titulo: 'Evolución',
      descripcion: 'Mediciones y consultas anteriores',
      estado: datos.errorEvolucion
        ? 'error'
        : datos.cargoEvolucion
          ? 'completa'
          : 'pendiente',
    },
    {
      id: 'mediciones',
      titulo: 'Mediciones',
      descripcion: 'Registro antropométrico actual',
      estado: medicionesCompletas ? 'completa' : 'pendiente',
    },
    {
      id: 'observacion',
      titulo: 'Clínica',
      descripcion: 'Comentario, sugerencias y objetivos',
      estado: observacionCompleta ? 'completa' : 'pendiente',
    },
    {
      id: 'planObjetivos',
      titulo: 'Plan',
      descripcion: 'Plan alimentario y objetivos',
      estado: datos.seModificoPlanObjetivos ? 'completa' : 'omitida',
    },
    {
      id: 'fotos',
      titulo: 'Fotos',
      descripcion: 'Frente, perfil, espalda y otra',
      estado: datos.cantidadFotosSesion > 0 ? 'completa' : 'omitida',
    },
    {
      id: 'adjuntos',
      titulo: 'Adjuntos',
      descripcion: 'Estudios y documentos clínicos',
      estado: datos.cantidadAdjuntos > 0 ? 'completa' : 'omitida',
    },
    {
      id: 'revision',
      titulo: 'Revisión',
      descripcion: 'Checklist final antes de cerrar',
      estado: revisionCompleta ? 'completa' : 'pendiente',
    },
  ];
}
```

- [ ] **Step 4: Run frontend logic tests**

Run:

```bash
npm run test --workspace=apps/frontend -- estadoEtapas.test.ts
```

Expected: PASS.

- [ ] **Step 5: Extend progress photo frontend types**

Modify `apps/frontend/src/components/progreso/types.ts` photo section:

```ts
export interface FotoProgreso {
  idFoto: number;
  socioId: number;
  turnoId: number | null;
  tipoFoto: TipoFoto;
  objectKey: string;
  mimeType: string;
  notas: string | null;
  fecha: string;
  urlFirmada: string;
}

export interface FotosPorTipo {
  tipoFoto: TipoFoto;
  fotos: FotoProgreso[];
}

export interface FotosSesion {
  turnoId: number | null;
  fechaTurno: string | null;
  horaTurno: string | null;
  fotos: FotosPorTipo[];
}

export interface GaleriaFotos {
  fotos: FotosPorTipo[];
  sesiones: FotosSesion[];
  fotosHistoricasSinSesion: FotosPorTipo[];
}
```

- [ ] **Step 6: Allow `turnoId` in upload hook**

Modify `apps/frontend/src/components/progreso/useFotosProgreso.ts`:

```ts
interface SubirFotoParams {
  archivo: File;
  tipoFoto: TipoFoto;
  notas?: string;
  turnoId?: number;
}
```

Inside `mutationFn`, append `turnoId`:

```ts
      if (turnoId) {
        formData.append('turnoId', String(turnoId));
      }
```

- [ ] **Step 7: Fix `PacienteDestacadoCard` response shape**

Modify the `Medicion` data model in `apps/frontend/src/components/dashboard/PacienteDestacadoCard.tsx`:

```ts
interface HistorialMedicionesPaciente {
  mediciones: Medicion[];
}
```

Change query response handling:

```ts
      const response = await apiRequest<ApiResponse<HistorialMedicionesPaciente>>(
        `/turnos/profesional/${personaId}/pacientes/${pacienteSeleccionado}/historial-mediciones`,
        { token },
      );
      return response.data?.mediciones ?? [];
```

- [ ] **Step 8: Run frontend tests/typecheck for slice 3**

Run:

```bash
npm run test --workspace=apps/frontend -- estadoEtapas.test.ts
npm run typecheck --workspace=apps/frontend
```

Expected: tests pass and typecheck succeeds.

- [ ] **Step 9: Commit slice 3**

Run:

```bash
git add apps/frontend/src/types/consulta.ts apps/frontend/src/lib/consulta/estadoEtapas.ts apps/frontend/src/lib/consulta/estadoEtapas.test.ts apps/frontend/src/components/progreso/types.ts apps/frontend/src/components/progreso/useFotosProgreso.ts apps/frontend/src/components/dashboard/PacienteDestacadoCard.tsx
git commit -m "feat: preparar flujo de consulta y fotos por sesion"
```

---

### Task 4: Guided Consulta UI Components

**Frontend protocol:** Before this task starts, present Agustín with the exact files to edit and Playwright verification steps, then wait for explicit approval. Do not start or restart dev servers.

**Files:**
- Create: `apps/frontend/src/components/consulta/IndicadorEtapasConsulta.tsx`
- Create: `apps/frontend/src/components/consulta/ContextoPacienteConsulta.tsx`
- Create: `apps/frontend/src/components/consulta/EvolucionPreviaConsulta.tsx`
- Create: `apps/frontend/src/components/consulta/FotosSesionConsulta.tsx`
- Create: `apps/frontend/src/components/consulta/RevisionFinalConsulta.tsx`
- Modify: `apps/frontend/src/pages/ConsultaProfesionalPage.tsx`

- [ ] **Step 1: Create stepper component**

Create `apps/frontend/src/components/consulta/IndicadorEtapasConsulta.tsx`:

```tsx
import { AlertTriangle, Check, Circle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EtapaConsulta, IdEtapaConsulta } from '@/types/consulta';

interface PropiedadesIndicadorEtapasConsulta {
  etapas: EtapaConsulta[];
  etapaActiva: IdEtapaConsulta;
  onSeleccionarEtapa: (etapa: IdEtapaConsulta) => void;
}

const ICONOS_ESTADO = {
  completa: Check,
  omitida: MinusCircle,
  pendiente: Circle,
  error: AlertTriangle,
  bloqueada: Circle,
};

export function IndicadorEtapasConsulta({
  etapas,
  etapaActiva,
  onSeleccionarEtapa,
}: PropiedadesIndicadorEtapasConsulta) {
  return (
    <nav aria-label="Etapas de consulta" className="rounded-2xl border bg-card p-3 shadow-sm">
      <div className="grid gap-2 lg:grid-cols-8">
        {etapas.map((etapa) => {
          const Icono = ICONOS_ESTADO[etapa.estado];
          const activa = etapa.id === etapaActiva;
          return (
            <Button
              key={etapa.id}
              type="button"
              variant={activa ? 'default' : 'ghost'}
              className="h-auto justify-start gap-2 px-3 py-3 text-left lg:flex-col lg:items-start"
              onClick={() => onSeleccionarEtapa(etapa.id)}
              disabled={etapa.estado === 'bloqueada'}
            >
              <Icono className="h-4 w-4 shrink-0" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{etapa.titulo}</span>
                <span className="block truncate text-xs opacity-75">{etapa.descripcion}</span>
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create session photos component**

Create `apps/frontend/src/components/consulta/FotosSesionConsulta.tsx`:

```tsx
import { Camera, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { FotoProgreso, TipoFoto } from '@/components/progreso/types';

interface PropiedadesFotosSesionConsulta {
  fotos: FotoProgreso[];
  cargando: boolean;
  onSubirFoto: (archivo: File, tipoFoto: TipoFoto) => void;
  deshabilitado?: boolean;
}

const TOMAS: Array<{ tipo: TipoFoto; titulo: string; descripcion: string }> = [
  { tipo: 'frente', titulo: 'Frente', descripcion: 'Postura frontal, luz pareja' },
  { tipo: 'perfil', titulo: 'Perfil', descripcion: 'Perfil lateral con postura neutra' },
  { tipo: 'espalda', titulo: 'Espalda', descripcion: 'Vista posterior completa' },
  { tipo: 'otro', titulo: 'Otra', descripcion: 'Detalle adicional opcional' },
];

export function FotosSesionConsulta({
  fotos,
  cargando,
  onSubirFoto,
  deshabilitado = false,
}: PropiedadesFotosSesionConsulta) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-orange-500" />
          Fotos de evolución de esta sesión
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TOMAS.map((toma) => {
          const foto = fotos.find((item) => item.tipoFoto === toma.tipo);
          return (
            <section key={toma.tipo} className="rounded-2xl border bg-muted/20 p-4">
              <div className="mb-3 space-y-1">
                <h3 className="font-semibold">{toma.titulo}</h3>
                <p className="text-xs text-muted-foreground">{toma.descripcion}</p>
              </div>
              {foto ? (
                <img
                  src={foto.urlFirmada}
                  alt={`Foto de ${toma.titulo.toLowerCase()}`}
                  className="aspect-[3/4] w-full rounded-xl object-cover"
                />
              ) : (
                <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-background text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                  <Upload className="mb-2 h-5 w-5" />
                  {cargando ? 'Subiendo...' : 'Cargar foto'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    disabled={deshabilitado || cargando}
                    onChange={(event) => {
                      const archivo = event.target.files?.[0];
                      if (archivo) onSubirFoto(archivo, toma.tipo);
                    }}
                  />
                </label>
              )}
              {!foto && toma.tipo !== 'otro' && (
                <p className="mt-2 text-xs text-muted-foreground">Opcional, no bloquea el cierre.</p>
              )}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create final review component**

Create `apps/frontend/src/components/consulta/RevisionFinalConsulta.tsx`:

```tsx
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EtapaConsulta } from '@/types/consulta';

interface PropiedadesRevisionFinalConsulta {
  etapas: EtapaConsulta[];
  finalizando: boolean;
  onFinalizar: () => void;
}

export function RevisionFinalConsulta({
  etapas,
  finalizando,
  onFinalizar,
}: PropiedadesRevisionFinalConsulta) {
  const faltantes = etapas.filter((etapa) => etapa.estado === 'pendiente' || etapa.estado === 'error');
  const puedeCerrar = faltantes.length === 0;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Revisión final</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {etapas.map((etapa) => {
            const Icono = etapa.estado === 'completa' || etapa.estado === 'omitida' ? CheckCircle2 : CircleAlert;
            return (
              <div key={etapa.id} className="flex items-start gap-3 rounded-xl border p-3">
                <Icono className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-medium">{etapa.titulo}</p>
                  <p className="text-sm text-muted-foreground">{etapa.descripcion}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{etapa.estado}</p>
                </div>
              </div>
            );
          })}
        </div>
        {!puedeCerrar && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Falta completar mediciones u observación clínica antes de cerrar.
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={onFinalizar} disabled={!puedeCerrar || finalizando}>
            {finalizando ? 'Finalizando...' : 'Finalizar consulta'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Integrate components into `ConsultaProfesionalPage`**

Modify `apps/frontend/src/pages/ConsultaProfesionalPage.tsx` incrementally:

```tsx
import { useQuery } from '@tanstack/react-query';
import { IndicadorEtapasConsulta } from '@/components/consulta/IndicadorEtapasConsulta';
import { FotosSesionConsulta } from '@/components/consulta/FotosSesionConsulta';
import { RevisionFinalConsulta } from '@/components/consulta/RevisionFinalConsulta';
import { obtenerEtapasConsulta } from '@/lib/consulta/estadoEtapas';
import type { IdEtapaConsulta, HistorialConsultaPaciente } from '@/types/consulta';
import { useFotosProgreso, useSubirFoto } from '@/components/progreso/useFotosProgreso';
```

Add state:

```tsx
  const [etapaActiva, setEtapaActiva] = useState<IdEtapaConsulta>('contexto');
```

Add queries after `socio` is available. Because `socio` is derived after loading, keep queries enabled with `datosTurno?.socio.idPersona`:

```tsx
  const socioId = datosTurno?.socio.idPersona;

  const historialConsultasQuery = useQuery<HistorialConsultaPaciente[]>({
    queryKey: ['consulta', turnoId, 'historial-consultas', socioId, personaId],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<HistorialConsultaPaciente[]>>(
        `/turnos/profesional/${personaId}/pacientes/${socioId}/historial-consultas`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId && !!socioId,
  });

  const fotosQuery = useFotosProgreso(socioId ?? 0, token);
  const subirFoto = useSubirFoto(socioId ?? 0, token);
```

Compute stages:

```tsx
  const fotosSesion =
    fotosQuery.data?.sesiones
      ?.find((sesion) => sesion.turnoId === Number(turnoId))
      ?.fotos.flatMap((grupo) => grupo.fotos) ?? [];

  const etapas = obtenerEtapasConsulta({
    cargoTurno: Boolean(datosTurno),
    cargoEvolucion: historialConsultasQuery.isSuccess,
    hayMedicionBase: Boolean(mensajeExito || formulario.peso),
    hayComentarioClinico: Boolean(formularioObservaciones.comentario.trim()),
    seModificoPlanObjetivos: false,
    cantidadFotosSesion: fotosSesion.length,
    cantidadAdjuntos: adjuntos.length,
    errorEvolucion: historialConsultasQuery.isError,
  });
```

Replace the existing `Tabs` shell with `IndicadorEtapasConsulta` plus conditional sections:

```tsx
      <IndicadorEtapasConsulta
        etapas={etapas}
        etapaActiva={etapaActiva}
        onSeleccionarEtapa={setEtapaActiva}
      />

      {etapaActiva === 'fotos' && (
        <FotosSesionConsulta
          fotos={fotosSesion}
          cargando={subirFoto.isPending}
          deshabilitado={!consultaEditable}
          onSubirFoto={(archivo, tipoFoto) => {
            void subirFoto.mutateAsync({
              archivo,
              tipoFoto,
              turnoId: Number(turnoId),
            });
          }}
        />
      )}

      {etapaActiva === 'revision' && (
        <RevisionFinalConsulta
          etapas={etapas}
          finalizando={finalizandoConsulta}
          onFinalizar={finalizarConsulta}
        />
      )}
```

Move existing JSX blocks into matching conditional sections before extracting full forms. Keep exact existing form handlers to avoid changing behavior in this slice.

- [ ] **Step 5: Run frontend tests/typecheck**

Run:

```bash
npm run test --workspace=apps/frontend -- consulta-profesional-page.test.tsx estadoEtapas.test.ts
npm run typecheck --workspace=apps/frontend
```

Expected: tests pass and typecheck succeeds.

- [ ] **Step 6: Commit slice 4**

Run:

```bash
git add apps/frontend/src/components/consulta/IndicadorEtapasConsulta.tsx apps/frontend/src/components/consulta/FotosSesionConsulta.tsx apps/frontend/src/components/consulta/RevisionFinalConsulta.tsx apps/frontend/src/pages/ConsultaProfesionalPage.tsx
git commit -m "feat: guiar consulta profesional por etapas"
```

---

### Task 5: Longitudinal Patient Page and Session Photo Comparator

**Frontend protocol:** Before this task starts, present Agustín with the exact files to edit and Playwright verification steps, then wait for explicit approval. Do not start or restart dev servers.

**Files:**
- Create: `apps/frontend/src/pages/FichaPacientePage.tsx`
- Create: `apps/frontend/src/components/progreso/ComparadorFotosSesion.tsx`
- Modify: `apps/frontend/src/pages/PacientesPage.tsx`
- Modify: `apps/frontend/src/router.tsx`

- [ ] **Step 1: Create session comparator**

Create `apps/frontend/src/components/progreso/ComparadorFotosSesion.tsx`:

```tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FotosSesion, TipoFoto } from '@/components/progreso/types';

interface PropiedadesComparadorFotosSesion {
  sesiones: FotosSesion[];
}

const TIPOS: Array<{ tipo: TipoFoto; etiqueta: string }> = [
  { tipo: 'frente', etiqueta: 'Frente' },
  { tipo: 'perfil', etiqueta: 'Perfil' },
  { tipo: 'espalda', etiqueta: 'Espalda' },
];

export function ComparadorFotosSesion({ sesiones }: PropiedadesComparadorFotosSesion) {
  const [sesionAntes, setSesionAntes] = useState<string>('');
  const [sesionDespues, setSesionDespues] = useState<string>('');

  const antes = sesiones.find((sesion) => String(sesion.turnoId) === sesionAntes);
  const despues = sesiones.find((sesion) => String(sesion.turnoId) === sesionDespues);

  const obtenerFoto = (sesion: FotosSesion | undefined, tipo: TipoFoto) =>
    sesion?.fotos.find((grupo) => grupo.tipoFoto === tipo)?.fotos[0];

  if (sesiones.length < 2) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Se necesitan al menos dos sesiones con fotos para comparar.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparar fotos por sesión</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Select value={sesionAntes} onValueChange={setSesionAntes}>
            <SelectTrigger><SelectValue placeholder="Sesión anterior" /></SelectTrigger>
            <SelectContent>
              {sesiones.map((sesion) => (
                <SelectItem key={sesion.turnoId} value={String(sesion.turnoId)}>
                  {sesion.fechaTurno ?? `Turno ${sesion.turnoId}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sesionDespues} onValueChange={setSesionDespues}>
            <SelectTrigger><SelectValue placeholder="Sesión posterior" /></SelectTrigger>
            <SelectContent>
              {sesiones.map((sesion) => (
                <SelectItem key={sesion.turnoId} value={String(sesion.turnoId)}>
                  {sesion.fechaTurno ?? `Turno ${sesion.turnoId}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {TIPOS.map(({ tipo, etiqueta }) => {
            const fotoAntes = obtenerFoto(antes, tipo);
            const fotoDespues = obtenerFoto(despues, tipo);
            return (
              <section key={tipo} className="rounded-2xl border p-4">
                <h3 className="mb-3 font-semibold">{etiqueta}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {fotoAntes ? <img src={fotoAntes.urlFirmada} alt={`${etiqueta} anterior`} className="aspect-[3/4] rounded-xl object-cover" /> : <div className="aspect-[3/4] rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Sin toma anterior</div>}
                  {fotoDespues ? <img src={fotoDespues.urlFirmada} alt={`${etiqueta} posterior`} className="aspect-[3/4] rounded-xl object-cover" /> : <div className="aspect-[3/4] rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Sin toma posterior</div>}
                </div>
              </section>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create `FichaPacientePage`**

Create `apps/frontend/src/pages/FichaPacientePage.tsx`:

```tsx
import { useParams, Link } from '@tanstack/react-router';
import { ArrowLeft, FileText, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { useProgresoData } from '@/components/progreso/useProgresoData';
import { useFotosProgreso } from '@/components/progreso/useFotosProgreso';
import { TarjetasResumenProgreso } from '@/components/progreso/TarjetasResumenProgreso';
import { TablaHistorialMediciones } from '@/components/progreso/TablaHistorialMediciones';
import { ComparadorFotosSesion } from '@/components/progreso/ComparadorFotosSesion';
import type { ApiResponse } from '@/types/api';
import type { HistorialConsultaPaciente } from '@/types/consulta';

export function FichaPacientePage() {
  const { token, personaId } = useAuth();
  const { socioId } = useParams({ from: '/auth/profesional/paciente/$socioId/ficha' });
  const socioIdNumero = Number(socioId);

  const { historial, resumen, isLoading } = useProgresoData({
    socioId: socioIdNumero,
    nutricionistaId: personaId ?? undefined,
    token,
  });
  const fotosQuery = useFotosProgreso(socioIdNumero, token);
  const historialConsultasQuery = useQuery<HistorialConsultaPaciente[]>({
    queryKey: ['ficha-paciente', socioIdNumero, 'historial-consultas', personaId],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<HistorialConsultaPaciente[]>>(
        `/turnos/profesional/${personaId}/pacientes/${socioIdNumero}/historial-consultas`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId && !!socioIdNumero,
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <FileText className="h-8 w-8 text-orange-500" />
            Ficha longitudinal del paciente
          </h1>
          <p className="mt-2 text-muted-foreground">
            Evolución, consultas, fotos y datos clínicos en una sola vista.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/pacientes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <TarjetasResumenProgreso resumen={resumen} isLoading={isLoading} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Historial de mediciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TablaHistorialMediciones historial={historial} isLoading={isLoading} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de consultas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(historialConsultasQuery.data ?? []).map((consulta) => (
            <article key={consulta.idTurno} className="rounded-xl border p-4">
              <p className="font-semibold">{consulta.fechaTurno} · {consulta.horaTurno}</p>
              <p className="mt-2 text-sm text-muted-foreground">{consulta.notasProfesional ?? 'Sin nota clínica registrada.'}</p>
              {consulta.sugerencias && <p className="mt-2 text-sm">{consulta.sugerencias}</p>}
            </article>
          ))}
          {historialConsultasQuery.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay consultas previas registradas.</p>
          )}
        </CardContent>
      </Card>

      <ComparadorFotosSesion sesiones={fotosQuery.data?.sesiones ?? []} />
    </div>
  );
}
```

- [ ] **Step 3: Add route**

Modify `apps/frontend/src/router.tsx`:

```tsx
import { FichaPacientePage } from '@/pages/FichaPacientePage';
```

Add route near `ProgresoPacientePage` route:

```tsx
const fichaPacienteRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/profesional/paciente/$socioId/ficha',
  component: FichaPacientePage,
});
```

Add `fichaPacienteRoute` to the route tree children where other authenticated routes are registered.

- [ ] **Step 4: Link from `PacientesPage`**

Modify `apps/frontend/src/pages/PacientesPage.tsx` primary actions:

```tsx
                    <Link
                      to="/profesional/paciente/$socioId/ficha"
                      params={{ socioId: String(paciente.socioId ?? '') }}
                    >
                      <Button size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        Ficha
                      </Button>
                    </Link>
```

Replace the non-functional dropdown item `Ver ficha de salud` with the same link target.

- [ ] **Step 5: Run frontend tests/typecheck**

Run:

```bash
npm run test --workspace=apps/frontend -- estadoEtapas.test.ts
npm run typecheck --workspace=apps/frontend
```

Expected: tests pass and typecheck succeeds.

- [ ] **Step 6: Commit slice 5**

Run:

```bash
git add apps/frontend/src/pages/FichaPacientePage.tsx apps/frontend/src/components/progreso/ComparadorFotosSesion.tsx apps/frontend/src/pages/PacientesPage.tsx apps/frontend/src/router.tsx
git commit -m "feat: agregar ficha longitudinal del paciente"
```

---

### Task 6: Visual Verification and Final Hardening

**Files:**
- Modify as needed only if verification exposes issues.

- [ ] **Step 1: Verify servers are already running without starting them**

Run:

```powershell
Test-NetConnection localhost -Port 3000
Test-NetConnection localhost -Port 5173
```

Expected: both ports show `TcpTestSucceeded : True`. If either is false, ask Agustín to start the missing server and stop.

- [ ] **Step 2: Run backend and frontend verification**

Run:

```bash
npm run test --workspace=apps/backend -- finalizar-consulta.use-case.spec.ts validar-cierre-consulta.helper.spec.ts
npm run build --workspace=apps/backend
npm run test --workspace=apps/frontend -- estadoEtapas.test.ts consulta-profesional-page.test.tsx
npm run typecheck --workspace=apps/frontend
```

Expected: all commands pass.

- [ ] **Step 3: Visual check consulta activa with Playwright MCP**

Use Playwright MCP only if both servers are already running.

Acceptance contract:

| User request | What should be visible |
|--------------|------------------------|
| Flujo por etapas | Stepper visible on consulta page with Contexto, Evolución, Mediciones, Clínica, Plan, Fotos, Adjuntos, Revisión. |
| Cierre completo | Revisión final shows missing medición/observación before closing. |
| Fotos opcionales | Fotos section shows Frente, Perfil, Espalda, Otra and says optional/not blocking. |
| Ficha longitudinal | `Mis Pacientes` opens a patient ficha with mediciones, consultas and photo comparator. |

Steps:

```text
1. Navigate to /login and authenticate as a seeded nutricionista from CREDENCIALES_SEED.md.
2. Navigate to /turnos-profesional and open an EN_CURSO or PRESENTE consulta.
3. Capture snapshot of the consulta page.
4. Click each step and verify the correct section renders.
5. Open Fotos and verify the four guided slots.
6. Open Revisión and verify checklist state.
7. Navigate to /pacientes and open Ficha for one patient.
8. Capture snapshot of ficha longitudinal and compare against acceptance contract.
```

- [ ] **Step 4: Fix any discrepancy and re-run targeted checks**

If Playwright shows a mismatch, patch the smallest affected file, then re-run the relevant Playwright step and targeted test command.

- [ ] **Step 5: Final status and push**

Run:

```bash
git status --short
git log --oneline -10
git push origin main
```

Expected: only intentional committed changes are pushed. Do not include unrelated pre-existing local modifications unless they are part of this implementation.

---

## Self-Review

### Spec coverage

| Spec requirement | Covered by |
|------------------|------------|
| Consulta por etapas | Task 3, Task 4 |
| Cierre validado UI/backend | Task 1, Task 3, Task 4 |
| Fotos por sesión opcionales | Task 2, Task 3, Task 4, Task 5 |
| Ficha longitudinal | Task 5 |
| Comparador por sesiones | Task 5 |
| `fichaActualizada` visible | Task 4 must include in `ContextoPacienteConsulta`; if not extracted in first pass, add to `ConsultaProfesionalPage` context section before commit. |
| Bug `PacienteDestacadoCard` shape | Task 3 |
| Playwright visual verification | Task 6 |

### Placeholder scan

No `TBD`, `TODO`, or unresolved placeholder steps remain. The only conditional instruction is the required frontend protocol gate before visible UI changes.

### Type consistency

Types introduced in `apps/frontend/src/types/consulta.ts` are reused by stepper and page orchestration. Photo session types extend the existing `GaleriaFotos` shape while keeping old `fotos` available for current gallery consumers.

## Execution Notes

- Do not start or restart backend/frontend dev servers. If ports are down, ask Agustín to start them.
- Work on `main`, commit each slice, and push after completed implementation per repository workflow.
- Before frontend visible changes in Task 4 and Task 5, present Agustín with the files and Playwright checks and wait for explicit approval.
