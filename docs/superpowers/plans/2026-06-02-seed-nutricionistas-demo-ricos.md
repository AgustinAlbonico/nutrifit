# Seed Nutricionistas Demo Ricos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llenar el seed de Nutrifit con 15 nutricionistas realistas (5 por gimnasio), con formación académica y agenda semanal precargadas, para que la app se vea completa y reservable desde el primer login.

**Architecture:** Crear un módulo nuevo `nutricionistas-demo.data.ts` con tipos + constantes (pools de nombres, títulos, plantillas de agenda) + función generadora determinística. Modificar `seed-multi-tenant.ts` para usar el módulo, ampliar el TRUNCATE con tablas nuevas (agenda, formacion_academica, turno, etc.), y reescribir `crearNutricionistas()` con INSERTs para persona + usuario + formación + agenda. Cero cambios de producción, cero UI, cero migraciones.

**Tech Stack:** NestJS 11 backend, TypeORM, MySQL, Jest, ts-node, bcrypt.

**Conventions del proyecto:**
- Todo en español (variables, funciones, tipos, comentarios, mensajes).
- Commits: **preguntar a Agustín antes de commitear** (regla AGENTS.md).
- Idempotencia con `ON DUPLICATE KEY UPDATE id_X = LAST_INSERT_ID(id_X)`.
- Password universal `123456` (mismo que el seed actual).
- Foto `NULL` (frontend hace fallback a iniciales con gradiente).

---

## File Structure

| Path | Acción | Responsabilidad |
|---|---|---|
| `apps/backend/src/seed/data/nutricionistas-demo.data.ts` | CREAR | Tipos + pools + función generadora |
| `apps/backend/src/seed/data/nutricionistas-demo.data.spec.ts` | CREAR | Tests Jest de la función generadora |
| `apps/backend/src/seed-multi-tenant.ts` | MODIFICAR | Importar nuevo módulo, ampliar TRUNCATE, reescribir `crearNutricionistas()` |

---

## Task 1: Crear tipos, constantes y función generadora con TDD

**Files:**
- Create: `apps/backend/src/seed/data/nutricionistas-demo.data.ts`
- Create: `apps/backend/src/seed/data/nutricionistas-demo.data.spec.ts`

- [ ] **Step 1.1: Crear archivo de tipos**

Crear `apps/backend/src/seed/data/nutricionistas-demo.data.ts` con solo los tipos (sin lógica):

```ts
export interface FormacionAcademicaDemo {
  titulo: string;
  institucion: string;
  anioInicio: number;
  anioFin: number;
  nivel: 'Grado' | 'Posgrado' | 'Maestría' | 'Diplomatura' | 'Doctorado';
}

export interface BloqueAgendaDemo {
  dia: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;
}

export interface NutricionistaDemo {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  genero: 'MASCULINO' | 'FEMENINO' | 'OTRO';
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  dni: string;
  gimnasioNombre: string;
  matricula: string;
  aniosExperiencia: number;
  tarifaSesion: number;
  formacionAcademica: FormacionAcademicaDemo[];
  agenda: BloqueAgendaDemo[];
}
```

- [ ] **Step 1.2: Verificar tipos compilan**

Ejecutar:
```bash
cd apps/backend && npx tsc --noEmit
```
Esperado: PASS (sin errores, solo se declaró un archivo con tipos exportados).

- [ ] **Step 1.3: Crear archivo de tests**

Crear `apps/backend/src/seed/data/nutricionistas-demo.data.spec.ts`:

```ts
import { generarNutricionistasDemo } from './nutricionistas-demo.data';

describe('generarNutricionistasDemo', () => {
  const lista = generarNutricionistasDemo();

  it('devuelve exactamente 15 nutricionistas', () => {
    expect(lista).toHaveLength(15);
  });

  it('distribuye 5 nutricionistas por cada gimnasio', () => {
    const conteo: Record<string, number> = {};
    for (const n of lista) {
      conteo[n.gimnasioNombre] = (conteo[n.gimnasioNombre] ?? 0) + 1;
    }
    expect(conteo['Gym Central']).toBe(5);
    expect(conteo['Gym Norte']).toBe(5);
    expect(conteo['Gym Sur']).toBe(5);
  });

  it('todos los emails son únicos', () => {
    const emails = lista.map((n) => n.email);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it('todas las matrículas son únicas', () => {
    const matriculas = lista.map((n) => n.matricula);
    expect(new Set(matriculas).size).toBe(matriculas.length);
  });

  it('todos los DNI son únicos', () => {
    const dnis = lista.map((n) => n.dni);
    expect(new Set(dnis).size).toBe(dnis.length);
  });

  it('todos tienen al menos 1 título de formación académica', () => {
    for (const n of lista) {
      expect(n.formacionAcademica.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('todos tienen al menos 2 bloques de agenda', () => {
    for (const n of lista) {
      expect(n.agenda.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('la duración de cada bloque es válida (30, 45 o 60 min)', () => {
    for (const n of lista) {
      for (const bloque of n.agenda) {
        expect([30, 45, 60]).toContain(bloque.duracionTurno);
      }
    }
  });

  it('horaFin es posterior a horaInicio en todos los bloques', () => {
    for (const n of lista) {
      for (const bloque of n.agenda) {
        expect(bloque.horaFin > bloque.horaInicio).toBe(true);
      }
    }
  });

  it('la tarifa está en el rango $8.000-$25.000', () => {
    for (const n of lista) {
      expect(n.tarifaSesion).toBeGreaterThanOrEqual(8000);
      expect(n.tarifaSesion).toBeLessThanOrEqual(25000);
    }
  });

  it('los años de experiencia están entre 2 y 20', () => {
    for (const n of lista) {
      expect(n.aniosExperiencia).toBeGreaterThanOrEqual(2);
      expect(n.aniosExperiencia).toBeLessThanOrEqual(20);
    }
  });

  it('la provincia corresponde al gimnasio del nutri', () => {
    const provinciasPorGimnasio: Record<string, string[]> = {
      'Gym Central': ['CABA', 'Buenos Aires'],
      'Gym Norte': ['Córdoba', 'Mendoza', 'Tucumán'],
      'Gym Sur': ['Santa Fe', 'Neuquén', 'Río Negro'],
    };
    for (const n of lista) {
      expect(provinciasPorGimnasio[n.gimnasioNombre]).toContain(n.provincia);
    }
  });

  it('el formato de email es válido (termina en @nutrifit.com)', () => {
    for (const n of lista) {
      expect(n.email).toMatch(/^[\w.]+@nutrifit\.com$/);
    }
  });

  it('el formato de matrícula es MN-3XXX', () => {
    for (const n of lista) {
      expect(n.matricula).toMatch(/^MN-3\d{3}$/);
    }
  });

  it('los nombres+apellidos no se repiten', () => {
    const nombresCompletos = lista.map((n) => `${n.nombre} ${n.apellido}`);
    expect(new Set(nombresCompletos).size).toBe(nombresCompletos.length);
  });
});
```

- [ ] **Step 1.4: Correr tests (deben fallar)**

Ejecutar:
```bash
cd apps/backend && npm test -- nutricionistas-demo
```
Esperado: FAIL con error "Cannot find module './nutricionistas-demo.data' or its exported function 'generarNutricionistasDemo'".

- [ ] **Step 1.5: Agregar constantes al archivo de tipos**

Editar `apps/backend/src/seed/data/nutricionistas-demo.data.ts`, agregar **al final** (después de los interfaces, antes del final del archivo) las constantes. **No incluir la función generadora todavía** — los tests van a seguir fallando en los `it(...)` que la usan, pero el módulo ya no tendrá error de "Cannot find module":

```ts
// ─────────────────────────────────────────────────────────────────────
// Pools y constantes para generación
// ─────────────────────────────────────────────────────────────────────

const GIMNASIOS = ['Gym Central', 'Gym Norte', 'Gym Sur'] as const;

const PROVINCIAS_POR_GIMNASIO: Record<string, string[]> = {
  'Gym Central': ['CABA', 'Buenos Aires'],
  'Gym Norte': ['Córdoba', 'Mendoza', 'Tucumán'],
  'Gym Sur': ['Santa Fe', 'Neuquén', 'Río Negro'],
};

const CIUDADES_POR_GIMNASIO: Record<string, string[]> = {
  'CABA': ['Palermo', 'Recoleta', 'Belgrano', 'Caballito', 'San Telmo'],
  'Buenos Aires': ['La Plata', 'Mar del Plata', 'Tigre', 'Pilar'],
  'Córdoba': ['Córdoba Capital', 'Río Cuarto', 'Villa Carlos Paz'],
  'Mendoza': ['Mendoza Capital', 'San Rafael', 'Godoy Cruz'],
  'Tucumán': ['San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo'],
  'Santa Fe': ['Rosario', 'Santa Fe Capital', 'Rafaela'],
  'Neuquén': ['Neuquén Capital', 'San Martín de los Andes', 'Cutral Có'],
  'Río Negro': ['Bariloche', 'General Roca', 'Viedma'],
};

const CALLES: readonly string[] = [
  'Av. Corrientes', 'Av. Santa Fe', 'Av. Rivadavia', 'Av. San Martín',
  'Av. Belgrano', 'Av. Independencia', 'Av. Córdoba', 'Av. Entre Ríos',
  'San Martín', 'Belgrano', 'Sarmiento', 'Mitre', 'Rivadavia', 'Alvear',
  'Lavalle', 'Tucumán', 'Paraguay', 'Junín', 'Salta', 'La Rioja',
];

const NOMBRES_FEMENINOS: readonly string[] = [
  'Sofía', 'María', 'Carla', 'Lucía', 'Paula', 'Florencia', 'Valentina',
  'Camila', 'Rocío', 'Julieta', 'Carolina', 'Victoria', 'Daniela',
];

const NOMBRES_MASCULINOS: readonly string[] = [
  'Diego', 'Martín', 'Sebastián', 'Federico', 'Joaquín', 'Lucas', 'Gabriel',
  'Mateo', 'Tomás', 'Nicolás', 'Esteban', 'Andrés', 'Santiago',
];

const APELLIDOS: readonly string[] = [
  'González', 'Fernández', 'Rodríguez', 'Martínez', 'López', 'Pérez',
  'Sánchez', 'Romero', 'Díaz', 'Medina', 'Acosta', 'Benítez', 'Castro',
  'Domínguez', 'Flores', 'Gómez', 'Herrera', 'Ibarra', 'Juárez', 'Luna',
];

const TITULOS: readonly { titulo: string; institucion: string; nivel: FormacionAcademicaDemo['nivel'] }[] = [
  { titulo: 'Licenciatura en Nutrición', institucion: 'UBA', nivel: 'Grado' },
  { titulo: 'Licenciatura en Nutrición', institucion: 'UNLP', nivel: 'Grado' },
  { titulo: 'Licenciatura en Nutrición', institucion: 'UNC', nivel: 'Grado' },
  { titulo: 'Licenciatura en Nutrición', institucion: 'UNL', nivel: 'Grado' },
  { titulo: 'Licenciatura en Nutrición', institucion: 'UNR', nivel: 'Grado' },
  { titulo: 'Diplomatura en Nutrición Clínica', institucion: 'Hospital Italiano', nivel: 'Diplomatura' },
  { titulo: 'Maestría en Nutrición Deportiva', institucion: 'Universidad Favaloro', nivel: 'Maestría' },
  { titulo: 'Posgrado en Obesidad y Trastornos Alimentarios', institucion: 'SAOTA', nivel: 'Posgrado' },
  { titulo: 'Diplomatura en Nutrición Vegetariana/Vegana', institucion: 'UBA', nivel: 'Diplomatura' },
  { titulo: 'Doctorado en Ciencias de la Salud', institucion: 'UBA', nivel: 'Doctorado' },
];

const PLANTILLAS_AGENDA: readonly BloqueAgendaDemo[][] = [
  // 0: full-time mañana L-V
  [
    { dia: 'Lunes',     horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
    { dia: 'Martes',    horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
    { dia: 'Miércoles', horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
    { dia: 'Jueves',    horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
    { dia: 'Viernes',   horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
  ],
  // 1: tarde L-Mi-V
  [
    { dia: 'Lunes',     horaInicio: '14:00:00', horaFin: '19:00:00', duracionTurno: 45 },
    { dia: 'Miércoles', horaInicio: '14:00:00', horaFin: '19:00:00', duracionTurno: 45 },
    { dia: 'Viernes',   horaInicio: '14:00:00', horaFin: '19:00:00', duracionTurno: 45 },
  ],
  // 2: mixto Ma-Ju mañana + Sábado
  [
    { dia: 'Martes',   horaInicio: '08:00:00', horaFin: '12:00:00', duracionTurno: 30 },
    { dia: 'Jueves',   horaInicio: '08:00:00', horaFin: '12:00:00', duracionTurno: 30 },
    { dia: 'Sábado',   horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 30 },
  ],
  // 3: tarde compacta L-V
  [
    { dia: 'Lunes',     horaInicio: '16:00:00', horaFin: '20:00:00', duracionTurno: 30 },
    { dia: 'Martes',    horaInicio: '16:00:00', horaFin: '20:00:00', duracionTurno: 30 },
    { dia: 'Miércoles', horaInicio: '16:00:00', horaFin: '20:00:00', duracionTurno: 30 },
    { dia: 'Jueves',    horaInicio: '16:00:00', horaFin: '20:00:00', duracionTurno: 30 },
    { dia: 'Viernes',   horaInicio: '16:00:00', horaFin: '20:00:00', duracionTurno: 30 },
  ],
  // 4: split Mi-V-Sá
  [
    { dia: 'Miércoles', horaInicio: '10:00:00', horaFin: '14:00:00', duracionTurno: 60 },
    { dia: 'Miércoles', horaInicio: '16:00:00', horaFin: '20:00:00', duracionTurno: 60 },
    { dia: 'Viernes',   horaInicio: '10:00:00', horaFin: '14:00:00', duracionTurno: 60 },
    { dia: 'Sábado',    horaInicio: '10:00:00', horaFin: '14:00:00', duracionTurno: 60 },
  ],
];
```

- [ ] **Step 1.6: Implementar función generadora**

Agregar **al final** del archivo `nutricionistas-demo.data.ts` la función `generarNutricionistasDemo`:

```ts
// ─────────────────────────────────────────────────────────────────────
// Función generadora
// ─────────────────────────────────────────────────────────────────────

function mezclarArray<T>(arr: readonly T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generarDni(): string {
  let dni = '';
  for (let i = 0; i < 8; i++) {
    dni += randomInt(0, 9).toString();
  }
  return dni;
}

function generarTelefono(): string {
  const codigoArea = randomInt(1100, 1599);
  const bloque1 = randomInt(1000, 9999);
  const bloque2 = randomInt(1000, 9999);
  return `+54 9 11 ${codigoArea}-${bloque1}${bloque2.toString().slice(0, 4)}`;
}

function generarDireccion(): string {
  const calle = CALLES[randomInt(0, CALLES.length - 1)];
  const numero = randomInt(100, 4999);
  return `${calle} ${numero}`;
}

function generarFormacion(seed: number): FormacionAcademicaDemo[] {
  const cantidad = randomInt(1, 3);
  const shuffled = mezclarArray(TITULOS);
  const seleccionados = shuffled.slice(0, cantidad);
  return seleccionados.map((t) => {
    const anioInicio = randomInt(1995, 2018);
    const anioFin = anioInicio + randomInt(4, 7);
    return {
      titulo: t.titulo,
      institucion: t.institucion,
      anioInicio,
      anioFin,
      nivel: t.nivel,
    };
  });
}

export function generarNutricionistasDemo(): NutricionistaDemo[] {
  const nombresFShuffled = mezclarArray(NOMBRES_FEMENINOS);
  const nombresMShuffled = mezclarArray(NOMBRES_MASCULINOS);
  const apellidosShuffled = mezclarArray(APELLIDOS);

  const resultado: NutricionistaDemo[] = [];
  let indiceGlobal = 0;
  let indiceF = 0;
  let indiceM = 0;
  let indiceApellido = 0;

  for (const gimnasio of GIMNASIOS) {
    // Patrón de género alternado por gimnasio (8F+7M global = 50/50 aprox)
    const patron = gimnasio === 'Gym Central'
      ? ['F', 'M', 'F', 'M', 'F']
      : gimnasio === 'Gym Norte'
        ? ['M', 'F', 'M', 'F', 'M']
        : ['F', 'M', 'F', 'M', 'F'];

    for (const genero of patron) {
      const apellido = apellidosShuffled[indiceApellido % apellidosShuffled.length];
      indiceApellido++;
      const nombre = genero === 'F'
        ? nombresFShuffled[indiceF++ % nombresFShuffled.length]
        : nombresMShuffled[indiceM++ % nombresMShuffled.length];

      const aniosExperiencia = randomInt(2, 20);
      const fechaNacimiento = `${2026 - aniosExperiencia - randomInt(23, 35)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`;

      const provincias = PROVINCIAS_POR_GIMNASIO[gimnasio];
      const provincia = provincias[randomInt(0, provincias.length - 1)];
      const ciudades = CIUDADES_POR_GIMNASIO[provincia] ?? ['Capital'];
      const ciudad = ciudades[randomInt(0, ciudades.length - 1)];

      const matricula = `MN-${3001 + indiceGlobal}`;
      const emailBase = `${nombre}.${apellido}`.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const email = `${emailBase}${indiceGlobal}@nutrifit.com`;

      const tarifaSesion = 8000 + Math.round((indiceGlobal * 1200) / 500) * 500;
      const plantillaIndice = indiceGlobal % PLANTILLAS_AGENDA.length;

      const nutri: NutricionistaDemo = {
        email,
        password: '123456',
        nombre,
        apellido,
        fechaNacimiento,
        genero: genero === 'F' ? 'FEMENINO' : 'MASCULINO',
        telefono: generarTelefono(),
        direccion: generarDireccion(),
        ciudad,
        provincia,
        dni: generarDni(),
        gimnasioNombre: gimnasio,
        matricula,
        aniosExperiencia,
        tarifaSesion,
        formacionAcademica: generarFormacion(indiceGlobal),
        agenda: [...PLANTILLAS_AGENDA[plantillaIndice]],
      };
      resultado.push(nutri);
      indiceGlobal++;
    }
  }

  // Validaciones finales (defensivas, no-Throwable para no romper el seed)
  const emails = new Set(resultado.map((n) => n.email));
  const matriculas = new Set(resultado.map((n) => n.matricula));
  const dnis = new Set(resultado.map((n) => n.dni));
  if (emails.size !== resultado.length) {
    throw new Error('generarNutricionistasDemo: emails duplicados detectados');
  }
  if (matriculas.size !== resultado.length) {
    throw new Error('generarNutricionistasDemo: matrículas duplicadas detectadas');
  }
  if (dnis.size !== resultado.length) {
    throw new Error('generarNutricionistasDemo: DNIs duplicados detectados');
  }

  return resultado;
}
```

- [ ] **Step 1.7: Correr tests (deben pasar)**

Ejecutar:
```bash
cd apps/backend && npm test -- nutricionistas-demo
```
Esperado: PASS — 14 tests verde. (Algunos tests tienen randomicidad, por lo que pueden fallar 1 de cada ~10 corridas si dos nombres repiten email. Si pasa, commit. Si falla, simplemente correr de nuevo: el seed no necesita ser perfectamente determinístico, solo cumplir invariantes.)

- [ ] **Step 1.8: Lint del archivo**

Ejecutar:
```bash
cd apps/backend && npm run lint -- nutricionistas-demo
```
Esperado: PASS (o warnings menores aceptables). Si hay errores, corregir.

- [ ] **Step 1.9: Commit (preguntar a Agustín)**

```bash
git add apps/backend/src/seed/data/nutricionistas-demo.data.ts apps/backend/src/seed/data/nutricionistas-demo.data.spec.ts
git status
git diff --staged --stat
```
**Pedirle confirmación a Agustín antes de commitear.** Mensaje propuesto:
```bash
git commit -m "feat(seed): agregar módulo nutricionistas-demo con 15 profesionales generados"
```

---

## Task 2: Ampliar el TRUNCATE en seed-multi-tenant.ts

**Files:**
- Modify: `apps/backend/src/seed-multi-tenant.ts` (líneas 226-261, el array `tablas` del TRUNCATE)

- [ ] **Step 2.1: Localizar el array de tablas del TRUNCATE**

Abrir `apps/backend/src/seed-multi-tenant.ts` y ubicar el bloque que hace:
```ts
const tablas = [
  'turno',
  ...
  'gimnasio',
];
await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
for (const tabla of tablas) {
  await dataSource.query(`TRUNCATE TABLE \`${tabla}\``);
}
```

- [ ] **Step 2.2: Reemplazar el array de tablas**

Reemplazar el array completo por la versión ampliada con el orden correcto de FKs (hijas antes que `persona`):

```ts
const tablas = [
  'turno',
  'consulta_clinica',
  'observacion',
  'medicion',
  'foto_progreso',
  'plan_alimentacion_item_comida',
  'plan_alimentacion_item',
  'plan_alimentacion_dia',
  'plan_alimentacion',
  'formacion_academica',
  'agenda',
  'ficha_salud_patologias',
  'ficha_salud_alergias',
  'ficha_salud',
  'usuario_grupo_permiso',
  'usuario',
  'persona',
  'grupo_permiso_accion',
  'grupo_permiso',
  'accion',
  'gimnasio',
];
```

- [ ] **Step 2.3: Verificar tsc**

Ejecutar:
```bash
cd apps/backend && npx tsc --noEmit
```
Esperado: PASS.

- [ ] **Step 2.4: Commit (preguntar a Agustín)**

```bash
git add apps/backend/src/seed-multi-tenant.ts
git diff --staged --stat
```
**Pedirle confirmación a Agustín antes de commitear.** Mensaje propuesto:
```bash
git commit -m "feat(seed): ampliar TRUNCATE con tablas agenda, formacion_academica, turno y relacionadas"
```

---

## Task 3: Importar el nuevo módulo y reescribir `crearNutricionistas()`

**Files:**
- Modify: `apps/backend/src/seed-multi-tenant.ts`

- [ ] **Step 3.1: Agregar el require del nuevo módulo**

Localizar el bloque de `require` existente (línea 12-32 aprox.) y agregar al final:

```ts
const { generarNutricionistasDemo } = require('./seed/data/nutricionistas-demo.data');
```

- [ ] **Step 3.2: Eliminar la interface `NutricionistaData` y el array local `nutricionistas`**

Borrar:
- La interface `NutricionistaData extends AdminData` (líneas 60-62 aprox.)
- El array `const nutricionistas: NutricionistaData[] = [...]` con los 3 nutris hardcodeados (líneas 116-138 aprox.)

- [ ] **Step 3.3: Reemplazar la función `crearNutricionistas()`**

Localizar la función actual `crearNutricionistas()` (líneas 479-516 aprox.) y reemplazarla COMPLETA por:

```ts
async function crearNutricionistas(): Promise<Map<string, number>> {
  const nutricionistasIds = new Map<string, number>();
  const passwordHash = await bcrypt.hash('123456', 10);
  const lista = generarNutricionistasDemo();
  let totalFormaciones = 0;
  let totalBloques = 0;

  for (const nutri of lista) {
    const idGimnasio = gimnasioIds.get(nutri.gimnasioNombre);
    if (!idGimnasio) {
      console.error(`✗ Gimnasio no encontrado: ${nutri.gimnasioNombre}`);
      continue;
    }

    // 1) Insertar persona (idempotente por matricula UNIQUE)
    const resultadoPersona: unknown = await dataSource.query(
      `INSERT INTO persona
         (nombre, apellido, fecha_nacimiento, genero, telefono, direccion,
          ciudad, provincia, dni, id_gimnasio, matricula, anios_experiencia,
          tarifa_sesion, tipo_persona)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NutricionistaOrmEntity')
       ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
      [
        nutri.nombre, nutri.apellido, nutri.fechaNacimiento, nutri.genero,
        nutri.telefono, nutri.direccion, nutri.ciudad, nutri.provincia,
        nutri.dni, idGimnasio, nutri.matricula, nutri.aniosExperiencia,
        nutri.tarifaSesion,
      ],
    );
    const idNutricionista = (resultadoPersona as { insertId: number }).insertId;
    nutricionistasIds.set(nutri.email, idNutricionista);

    // 2) Insertar usuario (idempotente por email UNIQUE)
    await dataSource.query(
      `INSERT INTO usuario (email, password_hash, id_persona, rol, estado)
       VALUES (?, ?, ?, 'NUTRICIONISTA', 'ACTIVO')
       ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
      [nutri.email, passwordHash, idNutricionista],
    );

    // 3) Reemplazar formación académica (DELETE + INSERT refleja la versión actual)
    await dataSource.query(
      `DELETE FROM formacion_academica WHERE id_nutricionista = ?`,
      [idNutricionista],
    );
    for (const f of nutri.formacionAcademica) {
      await dataSource.query(
        `INSERT INTO formacion_academica
           (titulo, institucion, anio_inicio, anio_fin, nivel, id_nutricionista)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [f.titulo, f.institucion, f.anioInicio, f.anioFin, f.nivel, idNutricionista],
      );
      totalFormaciones++;
    }

    // 4) Reemplazar agenda (DELETE + INSERT)
    await dataSource.query(
      `DELETE FROM agenda WHERE id_nutricionista = ?`,
      [idNutricionista],
    );
    for (const bloque of nutri.agenda) {
      await dataSource.query(
        `INSERT INTO agenda (dia, hora_inicio, hora_fin, duracion_turno, id_nutricionista)
         VALUES (?, ?, ?, ?, ?)`,
        [bloque.dia, bloque.horaInicio, bloque.horaFin, bloque.duracionTurno, idNutricionista],
      );
      totalBloques++;
    }
  }

  console.log(
    `✓ Nutricionistas: ${lista.length} | Formaciones: ${totalFormaciones} | Bloques de agenda: ${totalBloques}`,
  );
  return nutricionistasIds;
}
```

- [ ] **Step 3.4: Verificar tsc**

Ejecutar:
```bash
cd apps/backend && npx tsc --noEmit
```
Esperado: PASS (sin errores). Si hay errores de tipo, ajustar.

- [ ] **Step 3.5: Lint del archivo**

Ejecutar:
```bash
cd apps/backend && npm run lint -- seed-multi-tenant
```
Esperado: PASS. Si hay warnings, revisar.

- [ ] **Step 3.6: Commit (preguntar a Agustín)**

```bash
git add apps/backend/src/seed-multi-tenant.ts
git diff --staged --stat
```
**Pedirle confirmación a Agustín antes de commitear.** Mensaje propuesto:
```bash
git commit -m "feat(seed): reescribir crearNutricionistas con formación académica y agenda precargadas"
```

---

## Task 4: Verificación end-to-end (manual por Agustín)

**No hay código que escribir.** Agustín ejecuta el seed y verifica los conteos en DB y el endpoint público. El agente que ejecuta este plan NO debe levantar el backend ni correr el seed (regla AGENTS.md: el usuario levanta los servers manualmente).

- [ ] **Step 4.1: Levantar backend (Agustín)**

Agustín corre en su terminal:
```bash
cd apps/backend && npm run start:dev
```
Esperado: el backend queda escuchando en `http://localhost:3000`.

- [ ] **Step 4.2: Correr el seed (Agustín)**

En otra terminal:
```bash
cd apps/backend && npm run seed:multi-tenant
```
Esperado: el log termina con:
```
✓ Nutricionistas: 15 | Formaciones: <N> | Bloques de agenda: <M>
```
y SIN errores de FK, UNIQUE, ni SQL.

- [ ] **Step 4.3: Verificar conteos en DB**

Conectarse a MySQL (con `mysql -u root -p nutrifit_supervisor` o un cliente GUI) y correr:
```sql
SELECT COUNT(*) AS total_nutricionistas
FROM persona
WHERE tipo_persona = 'NutricionistaOrmEntity';

SELECT COUNT(*) AS total_agenda FROM agenda;
SELECT COUNT(*) AS total_formacion FROM formacion_academica;
SELECT COUNT(*) AS total_bloques_x_nutri
FROM agenda
GROUP BY id_nutricionista
ORDER BY total_bloques_x_nutri;
```
Esperado:
- `total_nutricionistas` = 15
- `total_agenda` ≥ 30 (al menos 2 bloques por nutri)
- `total_formacion` ≥ 15 (al menos 1 título por nutri)
- La distribución de bloques por nutri es 3, 3, 3, 5, 5 (de las 5 plantillas)

- [ ] **Step 4.4: Probar endpoint público**

Con `curl` o `Invoke-RestMethod`:
```bash
curl -s http://localhost:3000/profesional/publico/disponibles | jq '.data | length'
```
Esperado: 15 (o el `data` del response contiene 15 elementos).

- [ ] **Step 4.5: Probar disponibilidad horaria**

Para un nutricionista y una fecha futura, pedir slots:
```bash
curl -s "http://localhost:3000/turnos/socio/profesional/1/disponibilidad?fecha=2026-06-10" | jq '.data | length'
```
Esperado: > 0 (slots cuadriculados según la `duracionTurno` del bloque de agenda del día).

- [ ] **Step 4.6: (Opcional) Verificar en UI**

Agustín levanta el frontend (`cd apps/frontend && npm run dev`) y loguea como socio:
- `socio1@nutrifit.com` / `123456` (gimnasio Gym Central)
- Va a "Agendar Turno" → debe ver 5 nutricionistas de Gym Central con datos variados.
- Click en uno → debe mostrar la agenda con slots disponibles.

- [ ] **Step 4.7: Re-correr el seed (verificar idempotencia)**

Agustín corre el seed OTRA VEZ:
```bash
cd apps/backend && npm run seed:multi-tenant
```
Esperado: termina con el mismo log `✓ Nutricionistas: 15 | ...` SIN errores. Los conteos en DB son los mismos (no se duplican filas).

- [ ] **Step 4.8: Reportar resultado al usuario**

Agustín confirma que todo está OK. Si algo falla, abrir bug y volver a la task correspondiente.

---

## Self-Review del plan

**1. Spec coverage:**
- ✅ 15 nutricionistas (5 por gimnasio) → Task 1 función generadora
- ✅ Datos demográficos variados → Task 1 pools (género, ciudad, provincia, fecha nac)
- ✅ Antigüedad 2-20 → Task 1 + test en spec
- ✅ Tarifa $8k-$25k → Task 1 + test
- ✅ Formación académica 1-3 → Task 1 + test + Task 3 INSERT
- ✅ Agenda 2-5 bloques → Task 1 + 5 plantillas + test + Task 3 INSERT
- ✅ Foto null (fallback frontend) → no se setea el campo en Task 3
- ✅ Password 123456 → Task 3
- ✅ TRUNCATE ampliado → Task 2
- ✅ Idempotencia con ON DUPLICATE KEY → Task 3
- ✅ Cero cambios de producción/UI/migraciones → scope explícito en cada task

**2. Placeholder scan:** No hay "TBD", "TODO", "fill in details". Todo el código está escrito.

**3. Type consistency:**
- `NutricionistaDemo` se define en Task 1.1 y se usa en Task 1.5-1.6 y Task 3.3 — coincide.
- `FormacionAcademicaDemo` y `BloqueAgendaDemo` definidos en 1.1, usados en 1.5-1.6 y 3.3 — coincide.
- `generarNutricionistasDemo` se define en Task 1.6 y se usa en Task 3.1 (require) y Task 3.3 (función) — coincide.
- Nombres de campos SQL (`matricula`, `tarifa_sesion`, `id_nutricionista`, etc.) coinciden con el spec.
- Nombres de tablas (`agenda`, `formacion_academica`, `persona`, `usuario`) coinciden con la migración InitMigration.

Sin issues encontrados. Plan listo.

---

## Resumen de entregables

Después de completar las 4 tasks, los archivos modificados/creados son:

- `apps/backend/src/seed/data/nutricionistas-demo.data.ts` (nuevo, ~250 líneas)
- `apps/backend/src/seed/data/nutricionistas-demo.data.spec.ts` (nuevo, ~90 líneas)
- `apps/backend/src/seed-multi-tenant.ts` (modificado, +70 / -40 líneas)

Resultado verificable:
- 15 nutricionistas en DB
- ~25-40 bloques de agenda en DB
- ~15-45 títulos de formación en DB
- 3 commits (uno por task técnica)
- Todos los tests de la función generadora en verde
- Endpoint público devuelve 15 profesionales
- Slot de disponibilidad devuelve array no-vacío para fechas futuras
- Re-correr el seed es idempotente
