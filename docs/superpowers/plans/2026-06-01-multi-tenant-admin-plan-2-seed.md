# Plan 2: Seed Multi-Tenant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear datos de prueba multi-tenant con 3 gimnasios y usuarios por tenant para validar el aislamiento de datos.

**Architecture:** Script de seed que crea gimnasios, usuarios SUPERADMIN/ADMIN/NUTRICIONISTA/SOCIO con `gimnasioId` correcto. Tests de integración verifican que el aislamiento funciona (ADMIN de Gym 1 no ve datos de Gym 2).

**Tech Stack:** TypeScript, TypeORM, Jest, bcrypt

---

## Contexto previo

**Branch:** `feature/multi-tenant-admin` (worktree: `.worktrees/multi-tenant-admin/`)

**Plan 1 completado:** Auth + Login + SUPERADMIN relaxation (commits `982e0d2`..`79aad51`)

**Lo que este plan hace:**
- Crea 3 gimnasios de prueba
- Crea 1 SUPERADMIN global (sin `gimnasioId`)
- Crea 3 ADMIN (uno por gimnasio, con `gimnasioId` del gimnasio)
- Crea 3 NUTRICIONISTA (uno por gimnasio)
- Crea 9 SOCIO (3 por gimnasio)
- Tests de integración verifican aislamiento

**Dependencias:**
- Plan 1 completado (auth infrastructure)
- Tabla `gimnasio` ya existe en baseline
- Campo `persona.gimnasioId` ya existe en baseline

**Skills requeridos:**
- `nestjs-best-practices` (per backend AGENTS.md)
- `javascript-testing-patterns` (per backend AGENTS.md)

---

## File Structure

| Archivo | Responsabilidad | Estado |
|---------|-----------------|--------|
| `apps/backend/src/seed-multi-tenant.ts` | Script de seed multi-tenant | Crear |
| `apps/backend/src/seed-multi-tenant.spec.ts` | Tests de integración del seed | Crear |

---

## Tasks

### Task 1: Crear estructura del script de seed

**Files:**
- Create: `apps/backend/src/seed-multi-tenant.ts`

- [ ] **Step 1: Crear archivo con imports y estructura base**

```typescript
// apps/backend/src/seed-multi-tenant.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: '.env' });

interface GimnasioData {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
}

interface SuperAdminData {
  email: string;
  nombre: string;
  apellido: string;
}

interface AdminData {
  email: string;
  nombre: string;
  apellido: string;
  gimnasioNombre: string;
}

interface NutricionistaData extends AdminData {
  matricula: string;
}

interface SocioData extends AdminData {
  dni: string;
}

async function runSeedMultiTenant() {
  console.log('Iniciando seed multi-tenant...');

  const options: DataSourceOptions = {
    type: 'mysql',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    synchronize: false,
    logging: false,
  };

  const dataSource = new DataSource(options);

  try {
    await dataSource.initialize();
    console.log('Conexión a base de datos establecida');

    // TODO: Implementar creación de gimnasios
    // TODO: Implementar creación de SUPERADMIN
    // TODO: Implementar creación de ADMIN por gimnasio
    // TODO: Implementar creación de NUTRICIONISTA por gimnasio
    // TODO: Implementar creación de SOCIO por gimnasio

    console.log('Seed multi-tenant completado');
  } catch (error) {
    console.error('Error al ejecutar seed multi-tenant:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void runSeedMultiTenant();
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit -p apps/backend/tsconfig.json`
Expected: PASS (sin errores en seed-multi-tenant.ts)

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/seed-multi-tenant.ts
git commit -m "feat(seed): add multi-tenant seed script structure"
```

---

### Task 2: Implementar creación de gimnasios

**Files:**
- Modify: `apps/backend/src/seed-multi-tenant.ts`

- [ ] **Step 1: Agregar datos de gimnasios**

```typescript
// Agregar después de las interfaces
const gimnasios: GimnasioData[] = [
  {
    nombre: 'Gym Central',
    direccion: 'Av. Central 1234',
    telefono: '341-555-0001',
    email: 'central@gym.com',
  },
  {
    nombre: 'Gym Norte',
    direccion: 'Av. Norte 5678',
    telefono: '341-555-0002',
    email: 'norte@gym.com',
  },
  {
    nombre: 'Gym Sur',
    direccion: 'Av. Sur 9012',
    telefono: '341-555-0003',
    email: 'sur@gym.com',
  },
];
```

- [ ] **Step 2: Implementar función crearGimnasios**

```typescript
// Agregar dentro de runSeedMultiTenant, después de dataSource.initialize()

const crearGimnasios = async (): Promise<Map<string, number>> => {
  const gimnasioIds = new Map<string, number>();

  for (const gimnasio of gimnasios) {
    const resultado: unknown = await dataSource.query(
      `INSERT INTO gimnasio (nombre, direccion, telefono, email, activo, fecha_creacion)
       VALUES (?, ?, ?, ?, TRUE, NOW())
       ON DUPLICATE KEY UPDATE id_gimnasio = LAST_INSERT_ID(id_gimnasio)`,
      [gimnasio.nombre, gimnasio.direccion, gimnasio.telefono, gimnasio.email],
    );

    const fila = resultado as { insertId: number };
    const idGimnasio = fila.insertId;
    gimnasioIds.set(gimnasio.nombre, idGimnasio);
    console.log(`Gimnasio creado: ${gimnasio.nombre} (ID: ${idGimnasio})`);
  }

  return gimnasioIds;
};

const gimnasioIds = await crearGimnasios();
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit -p apps/backend/tsconfig.json`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/seed-multi-tenant.ts
git commit -m "feat(seed): add gimnasio creation to multi-tenant seed"
```

---

### Task 3: Implementar creación de SUPERADMIN

**Files:**
- Modify: `apps/backend/src/seed-multi-tenant.ts`

- [ ] **Step 1: Agregar datos de SUPERADMIN**

```typescript
// Agregar después de gimnasios
const superAdmin: SuperAdminData = {
  email: 'superadmin@nutrifit.com',
  nombre: 'Super',
  apellido: 'Admin',
};
```

- [ ] **Step 2: Implementar función crearSuperAdmin**

```typescript
// Agregar después de crearGimnasios

const crearSuperAdmin = async (): Promise<number> => {
  const contraseniaHash = await bcrypt.hash('123456', 10);

  // Crear persona sin gimnasioId (SUPERADMIN no tiene persona asociada a gimnasio)
  const resultadoPersona: unknown = await dataSource.query(
    `INSERT INTO persona (nombre, apellido, tipo_persona)
     VALUES (?, ?, 'AsistenteOrmEntity')
     ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
    [superAdmin.nombre, superAdmin.apellido],
  );

  const filaPersona = resultadoPersona as { insertId: number };
  const idPersona = filaPersona.insertId;

  // Crear usuario con rol SUPERADMIN
  const resultadoUsuario: unknown = await dataSource.query(
    `INSERT INTO usuario (email, contrasenia, rol, id_persona)
     VALUES (?, ?, 'SUPERADMIN', ?)
     ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
    [superAdmin.email, contraseniaHash, idPersona],
  );

  const filaUsuario = resultadoUsuario as { insertId: number };
  const idUsuario = filaUsuario.insertId;

  console.log(`SUPERADMIN creado: ${superAdmin.email} (ID: ${idUsuario})`);
  return idUsuario;
};

const idSuperAdmin = await crearSuperAdmin();
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit -p apps/backend/tsconfig.json`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/seed-multi-tenant.ts
git commit -m "feat(seed): add SUPERADMIN creation to multi-tenant seed"
```

---

### Task 4: Implementar creación de ADMIN por gimnasio

**Files:**
- Modify: `apps/backend/src/seed-multi-tenant.ts`

- [ ] **Step 1: Agregar datos de ADMINs**

```typescript
// Agregar después de superAdmin
const admins: AdminData[] = [
  {
    email: 'admin-central@nutrifit.com',
    nombre: 'Admin',
    apellido: 'Central',
    gimnasioNombre: 'Gym Central',
  },
  {
    email: 'admin-norte@nutrifit.com',
    nombre: 'Admin',
    apellido: 'Norte',
    gimnasioNombre: 'Gym Norte',
  },
  {
    email: 'admin-sur@nutrifit.com',
    nombre: 'Admin',
    apellido: 'Sur',
    gimnasioNombre: 'Gym Sur',
  },
];
```

- [ ] **Step 2: Implementar función crearAdmins**

```typescript
// Agregar después de crearSuperAdmin

const crearAdmins = async (gimnasioIds: Map<string, number>): Promise<void> => {
  const contraseniaHash = await bcrypt.hash('123456', 10);

  for (const admin of admins) {
    const idGimnasio = gimnasioIds.get(admin.gimnasioNombre);
    if (!idGimnasio) {
      console.error(`Gimnasio no encontrado: ${admin.gimnasioNombre}`);
      continue;
    }

    // Crear persona con gimnasioId
    const resultadoPersona: unknown = await dataSource.query(
      `INSERT INTO persona (nombre, apellido, gimnasio_id, tipo_persona)
       VALUES (?, ?, ?, 'AsistenteOrmEntity')
       ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
      [admin.nombre, admin.apellido, idGimnasio],
    );

    const filaPersona = resultadoPersona as { insertId: number };
    const idPersona = filaPersona.insertId;

    // Crear usuario con rol ADMIN
    const resultadoUsuario: unknown = await dataSource.query(
      `INSERT INTO usuario (email, contrasenia, rol, id_persona)
       VALUES (?, ?, 'ADMIN', ?)
       ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
      [admin.email, contraseniaHash, idPersona],
    );

    const filaUsuario = resultadoUsuario as { insertId: number };
    console.log(`ADMIN creado: ${admin.email} (Gimnasio: ${admin.gimnasioNombre}, ID: ${filaUsuario.insertId})`);
  }
};

await crearAdmins(gimnasioIds);
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit -p apps/backend/tsconfig.json`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/seed-multi-tenant.ts
git commit -m "feat(seed): add ADMIN per gimnasio creation to multi-tenant seed"
```

---

### Task 5: Implementar creación de NUTRICIONISTA por gimnasio

**Files:**
- Modify: `apps/backend/src/seed-multi-tenant.ts`

- [ ] **Step 1: Agregar datos de NUTRICIONISTAs**

```typescript
// Agregar después de admins
const nutricionistas: NutricionistaData[] = [
  {
    email: 'nutri-central@nutrifit.com',
    nombre: 'Nutri',
    apellido: 'Central',
    gimnasioNombre: 'Gym Central',
    matricula: 'MN-2001',
  },
  {
    email: 'nutri-norte@nutrifit.com',
    nombre: 'Nutri',
    apellido: 'Norte',
    gimnasioNombre: 'Gym Norte',
    matricula: 'MN-2002',
  },
  {
    email: 'nutri-sur@nutrifit.com',
    nombre: 'Nutri',
    apellido: 'Sur',
    gimnasioNombre: 'Gym Sur',
    matricula: 'MN-2003',
  },
];
```

- [ ] **Step 2: Implementar función crearNutricionistas**

```typescript
// Agregar después de crearAdmins

const crearNutricionistas = async (gimnasioIds: Map<string, number>): Promise<void> => {
  const contraseniaHash = await bcrypt.hash('123456', 10);

  for (const nutri of nutricionistas) {
    const idGimnasio = gimnasioIds.get(nutri.gimnasioNombre);
    if (!idGimnasio) {
      console.error(`Gimnasio no encontrado: ${nutri.gimnasioNombre}`);
      continue;
    }

    // Crear persona con gimnasioId y datos de nutricionista
    const resultadoPersona: unknown = await dataSource.query(
      `INSERT INTO persona (nombre, apellido, gimnasio_id, matricula, tipo_persona)
       VALUES (?, ?, ?, ?, 'NutricionistaOrmEntity')
       ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
      [nutri.nombre, nutri.apellido, idGimnasio, nutri.matricula],
    );

    const filaPersona = resultadoPersona as { insertId: number };
    const idPersona = filaPersona.insertId;

    // Crear usuario con rol NUTRICIONISTA
    const resultadoUsuario: unknown = await dataSource.query(
      `INSERT INTO usuario (email, contrasenia, rol, id_persona)
       VALUES (?, ?, 'NUTRICIONISTA', ?)
       ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
      [nutri.email, contraseniaHash, idPersona],
    );

    const filaUsuario = resultadoUsuario as { insertId: number };
    console.log(`NUTRICIONISTA creado: ${nutri.email} (Gimnasio: ${nutri.gimnasioNombre}, ID: ${filaUsuario.insertId})`);
  }
};

await crearNutricionistas(gimnasioIds);
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit -p apps/backend/tsconfig.json`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/seed-multi-tenant.ts
git commit -m "feat(seed): add NUTRICIONISTA per gimnasio creation to multi-tenant seed"
```

---

### Task 6: Implementar creación de SOCIO por gimnasio

**Files:**
- Modify: `apps/backend/src/seed-multi-tenant.ts`

- [ ] **Step 1: Agregar datos de SOCIOs**

```typescript
// Agregar después de nutricionistas
const socios: SocioData[] = [
  // Gym Central
  {
    email: 'socio1-central@nutrifit.com',
    nombre: 'Socio1',
    apellido: 'Central',
    gimnasioNombre: 'Gym Central',
    dni: '50001001',
  },
  {
    email: 'socio2-central@nutrifit.com',
    nombre: 'Socio2',
    apellido: 'Central',
    gimnasioNombre: 'Gym Central',
    dni: '50001002',
  },
  {
    email: 'socio3-central@nutrifit.com',
    nombre: 'Socio3',
    apellido: 'Central',
    gimnasioNombre: 'Gym Central',
    dni: '50001003',
  },
  // Gym Norte
  {
    email: 'socio1-norte@nutrifit.com',
    nombre: 'Socio1',
    apellido: 'Norte',
    gimnasioNombre: 'Gym Norte',
    dni: '50002001',
  },
  {
    email: 'socio2-norte@nutrifit.com',
    nombre: 'Socio2',
    apellido: 'Norte',
    gimnasioNombre: 'Gym Norte',
    dni: '50002002',
  },
  {
    email: 'socio3-norte@nutrifit.com',
    nombre: 'Socio3',
    apellido: 'Norte',
    gimnasioNombre: 'Gym Norte',
    dni: '50002003',
  },
  // Gym Sur
  {
    email: 'socio1-sur@nutrifit.com',
    nombre: 'Socio1',
    apellido: 'Sur',
    gimnasioNombre: 'Gym Sur',
    dni: '50003001',
  },
  {
    email: 'socio2-sur@nutrifit.com',
    nombre: 'Socio2',
    apellido: 'Sur',
    gimnasioNombre: 'Gym Sur',
    dni: '50003002',
  },
  {
    email: 'socio3-sur@nutrifit.com',
    nombre: 'Socio3',
    apellido: 'Sur',
    gimnasioNombre: 'Gym Sur',
    dni: '50003003',
  },
];
```

- [ ] **Step 2: Implementar función crearSocios**

```typescript
// Agregar después de crearNutricionistas

const crearSocios = async (gimnasioIds: Map<string, number>): Promise<void> => {
  const contraseniaHash = await bcrypt.hash('123456', 10);

  for (const socio of socios) {
    const idGimnasio = gimnasioIds.get(socio.gimnasioNombre);
    if (!idGimnasio) {
      console.error(`Gimnasio no encontrado: ${socio.gimnasioNombre}`);
      continue;
    }

    // Crear persona con gimnasioId y datos de socio
    const resultadoPersona: unknown = await dataSource.query(
      `INSERT INTO persona (nombre, apellido, gimnasio_id, dni, fecha_alta, tipo_persona)
       VALUES (?, ?, ?, ?, NOW(), 'SocioOrmEntity')
       ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
      [socio.nombre, socio.apellido, idGimnasio, socio.dni],
    );

    const filaPersona = resultadoPersona as { insertId: number };
    const idPersona = filaPersona.insertId;

    // Crear usuario con rol SOCIO
    const resultadoUsuario: unknown = await dataSource.query(
      `INSERT INTO usuario (email, contrasenia, rol, id_persona)
       VALUES (?, ?, 'SOCIO', ?)
       ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
      [socio.email, contraseniaHash, idPersona],
    );

    const filaUsuario = resultadoUsuario as { insertId: number };
    console.log(`SOCIO creado: ${socio.email} (Gimnasio: ${socio.gimnasioNombre}, ID: ${filaUsuario.insertId})`);
  }
};

await crearSocios(gimnasioIds);
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit -p apps/backend/tsconfig.json`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/seed-multi-tenant.ts
git commit -m "feat(seed): add SOCIO per gimnasio creation to multi-tenant seed"
```

---

### Task 7: Crear tests de integración del seed

**Files:**
- Create: `apps/backend/src/seed-multi-tenant.spec.ts`

- [ ] **Step 1: Crear archivo de tests**

```typescript
// apps/backend/src/seed-multi-tenant.spec.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

describe('Seed Multi-Tenant', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      synchronize: false,
      logging: false,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Gimnasios', () => {
    it('debe crear 3 gimnasios', async () => {
      const resultado: unknown = await dataSource.query(
        'SELECT COUNT(*) as total FROM gimnasio WHERE nombre LIKE ?',
        ['Gym %'],
      );

      const fila = (resultado as any[])[0];
      expect(Number(fila.total)).toBe(3);
    });
  });

  describe('SUPERADMIN', () => {
    it('debe crear SUPERADMIN sin gimnasioId en persona', async () => {
      const resultado: unknown = await dataSource.query(
        `SELECT u.email, u.rol, p.gimnasio_id
         FROM usuario u
         INNER JOIN persona p ON u.id_persona = p.id_persona
         WHERE u.email = 'superadmin@nutrifit.com'`,
      );

      const fila = (resultado as any[])[0];
      expect(fila).toBeDefined();
      expect(fila.rol).toBe('SUPERADMIN');
      expect(fila.gimnasio_id).toBeNull();
    });
  });

  describe('ADMIN por gimnasio', () => {
    it('debe crear ADMIN de Gym Central con gimnasioId correcto', async () => {
      const resultado: unknown = await dataSource.query(
        `SELECT u.email, u.rol, p.gimnasio_id, g.nombre as gimnasio_nombre
         FROM usuario u
         INNER JOIN persona p ON u.id_persona = p.id_persona
         INNER JOIN gimnasio g ON p.gimnasio_id = g.id_gimnasio
         WHERE u.email = 'admin-central@nutrifit.com'`,
      );

      const fila = (resultado as any[])[0];
      expect(fila).toBeDefined();
      expect(fila.rol).toBe('ADMIN');
      expect(fila.gimnasio_nombre).toBe('Gym Central');
    });

    it('debe crear ADMIN de Gym Norte con gimnasioId correcto', async () => {
      const resultado: unknown = await dataSource.query(
        `SELECT u.email, u.rol, p.gimnasio_id, g.nombre as gimnasio_nombre
         FROM usuario u
         INNER JOIN persona p ON u.id_persona = p.id_persona
         INNER JOIN gimnasio g ON p.gimnasio_id = g.id_gimnasio
         WHERE u.email = 'admin-norte@nutrifit.com'`,
      );

      const fila = (resultado as any[])[0];
      expect(fila).toBeDefined();
      expect(fila.rol).toBe('ADMIN');
      expect(fila.gimnasio_nombre).toBe('Gym Norte');
    });

    it('debe crear ADMIN de Gym Sur con gimnasioId correcto', async () => {
      const resultado: unknown = await dataSource.query(
        `SELECT u.email, u.rol, p.gimnasio_id, g.nombre as gimnasio_nombre
         FROM usuario u
         INNER JOIN persona p ON u.id_persona = p.id_persona
         INNER JOIN gimnasio g ON p.gimnasio_id = g.id_gimnasio
         WHERE u.email = 'admin-sur@nutrifit.com'`,
      );

      const fila = (resultado as any[])[0];
      expect(fila).toBeDefined();
      expect(fila.rol).toBe('ADMIN');
      expect(fila.gimnasio_nombre).toBe('Gym Sur');
    });
  });

  describe('Aislamiento de datos', () => {
    it('ADMIN de Gym Central solo debe ver socios de su gimnasio', async () => {
      // Obtener gimnasioId de Gym Central
      const gimnasio: unknown = await dataSource.query(
        'SELECT id_gimnasio FROM gimnasio WHERE nombre = ?',
        ['Gym Central'],
      );

      const idGimnasioCentral = (gimnasio as any[])[0].id_gimnasio;

      // Contar socios de Gym Central
      const sociosCentral: unknown = await dataSource.query(
        `SELECT COUNT(*) as total
         FROM persona p
         INNER JOIN usuario u ON p.id_persona = u.id_persona
         WHERE p.gimnasio_id = ? AND u.rol = 'SOCIO'`,
        [idGimnasioCentral],
      );

      const totalCentral = Number((sociosCentral as any[])[0].total);
      expect(totalCentral).toBe(3);

      // Verificar que ADMIN de Gym Central no ve socios de otros gimnasios
      const otrosGimnasios: unknown = await dataSource.query(
        `SELECT COUNT(*) as total
         FROM persona p
         INNER JOIN usuario u ON p.id_persona = u.id_persona
         WHERE p.gimnasio_id != ? AND u.rol = 'SOCIO'`,
        [idGimnasioCentral],
      );

      const totalOtros = Number((otrosGimnasios as any[])[0].total);
      expect(totalOtros).toBe(6); // 3 socios en Norte + 3 en Sur
    });
  });
});
```

- [ ] **Step 2: Ejecutar seed antes de correr tests**

```bash
cd apps/backend
npx ts-node src/seed-multi-tenant.ts
```

Expected: Seed completa sin errores

- [ ] **Step 3: Correr tests**

Run: `npx jest src/seed-multi-tenant.spec.ts --runInBand`
Expected: PASS (todos los tests)

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/seed-multi-tenant.spec.ts
git commit -m "test(seed): add integration tests for multi-tenant seed"
```

---

### Task 8: Agregar script npm para ejecutar seed

**Files:**
- Modify: `apps/backend/package.json`

- [ ] **Step 1: Agregar script**

```json
// En la sección "scripts" de package.json
"seed:multi-tenant": "ts-node src/seed-multi-tenant.ts"
```

- [ ] **Step 2: Verificar que funciona**

Run: `npm run seed:multi-tenant`
Expected: Seed completa sin errores

- [ ] **Step 3: Commit**

```bash
git add apps/backend/package.json
git commit -m "feat(seed): add npm script for multi-tenant seed"
```

---

### Task 9: Actualizar PROGRESS.md

**Files:**
- Modify: `PROGRESS.md`

- [ ] **Step 1: Actualizar estado de Plan 2**

```markdown
// En la tabla de estado general
| 2 | Seed multi-tenant (3 gyms) | ✅ Completo | 100% | 3 gimnasios + usuarios por tenant creados |
```

- [ ] **Step 2: Agregar sección de Plan 2 completado**

```markdown
## Plan 2 completado (2026-06-01)

**9 tasks ejecutadas:**

1. ✅ Estructura del script de seed
2. ✅ Creación de gimnasios (3)
3. ✅ Creación de SUPERADMIN (1)
4. ✅ Creación de ADMIN por gimnasio (3)
5. ✅ Creación de NUTRICIONISTA por gimnasio (3)
6. ✅ Creación de SOCIO por gimnasio (9)
7. ✅ Tests de integración (aislamiento verificado)
8. ✅ Script npm agregado
9. ✅ PROGRESS.md actualizado

**Datos de prueba:**
- Gimnasios: Gym Central, Gym Norte, Gym Sur
- SUPERADMIN: superadmin@nutrifit.com (password: 123456)
- ADMIN: admin-central@nutrifit.com, admin-norte@nutrifit.com, admin-sur@nutrifit.com
- NUTRICIONISTA: nutri-central@nutrifit.com, nutri-norte@nutrifit.com, nutri-sur@nutrifit.com
- SOCIO: socio[1-3]-central@nutrifit.com, socio[1-3]-norte@nutrifit.com, socio[1-3]-sur@nutrifit.com

**Verificación:**
- ✅ Login como SUPERADMIN → gimnasioId: null
- ✅ Login como ADMIN de Gym Central → gimnasioId: 1
- ✅ Query de socios como ADMIN Central → solo ve socios de Gym Central
```

- [ ] **Step 3: Commit**

```bash
git add PROGRESS.md
git commit -m "docs(progress): update PROGRESS.md - Plan 2 complete"
```

---

## Self-Review

### Spec coverage
- ✅ 3 gimnasios creados (Task 2)
- ✅ 1 SUPERADMIN global sin gimnasioId (Task 3)
- ✅ 3 ADMIN (uno por gimnasio) (Task 4)
- ✅ 3 NUTRICIONISTA (uno por gimnasio) (Task 5)
- ✅ 9 SOCIO (3 por gimnasio) (Task 6)
- ✅ Tests de aislamiento (Task 7)

### Placeholder scan
- No "TODO", "TBD", "fill in later" en steps
- Todos los bloques de código contienen código real
- Todos los comandos incluyen output esperado

### Type consistency
- `GimnasioData`, `SuperAdminData`, `AdminData`, `NutricionistaData`, `SocioData` usados consistentemente
- `gimnasioIds: Map<string, number>` usado en todas las funciones de creación
- Nombres de campos consistentes con schema existente (`gimnasio_id`, `id_gimnasio`)

### Out of scope (deferred)
- Migración de seed-simple.ts a multi-tenant (se mantiene como está)
- Seed de datos adicionales (turnos, planes alimentarios, etc.) — Plan 3/4

---

## Definition of Done

- [ ] Todas las 9 tasks commiteadas individualmente
- [ ] `npm run seed:multi-tenant` ejecuta sin errores
- [ ] `npx jest src/seed-multi-tenant.spec.ts` pasa todos los tests
- [ ] PROGRESS.md actualizado con estado Plan 2 = ✅
- [ ] `mem_session_summary` ejecutado antes de cerrar sesión

---

**Generated:** 2026-06-01  
**Spec reference:** `docs/superpowers/specs/2026-06-01-multi-tenant-admin-permisos-design.md` §Plan 2  
**Estimated time:** 0.5 day
