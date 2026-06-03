# Diseño: Seed rico de nutricionistas (5 por gimnasio, con agenda, formación y datos completos)

**Fecha**: 2026-06-02
**Autor**: brainstorming con Agustín
**Estado**: Aprobado en 1 ronda

## Contexto y problema

El `seed-multi-tenant.ts` actual (`apps/backend/src/seed-multi-tenant.ts`) crea **3 gimnasios con 1 nutricionista cada uno**, todos con datos idénticos hardcodeados:

- `fecha_nacimiento = '1990-01-01'`
- `genero = 'FEMENINO'`
- `telefono = '0000000000'`
- `direccion = 'Direccion por defecto'`
- `ciudad = 'Rosario'`, `provincia = 'Santa Fe'`
- `anios_experiencia = 5`, `tarifa_sesion = 1500.00`
- `dni = NULL`, `foto_perfil_key = NULL`

**No crea registros en `agenda` ni en `formacion_academica`** (verificado con grep `INSERT INTO` → 0 matches). El socio abre la app, ve 3 profesionales clonados y `GET /turnos/socio/profesional/:id/disponibilidad?fecha=` devuelve array vacío para todos. No se puede reservar nada de entrada.

Resultado: la app se ve "vacía" e inerte en cualquier demo o testing. Cualquier feature nueva de socio/profesional requiere que el nutricionista primero configure su agenda a mano.

## Decisión de diseño

Mejorar el seed para que la app se vea **viva, diversa y completamente funcional** desde el primer login:

- **15 nutricionistas** (5 por gimnasio)
- **Datos demográficos variados** (género, fecha de nacimiento, ciudad, provincia, DNI, teléfono, dirección, email único)
- **Antigüedad escalonada** entre 2 y 20 años
- **Tarifas escalonadas** entre $8.000 y $25.000 ARS
- **Formación académica precargada** (1-3 títulos por nutricionista, con institución, año, nivel)
- **Agenda semanal precargada** (2-5 bloques por nutricionista, mix mañana/tarde, duraciones 30/45/60 min, días L-S variados)
- **Foto placeholder** (`foto_perfil_key = NULL`): el componente `AvatarPaciente` del frontend ya muestra iniciales con gradiente naranja-rosa automáticamente
- **Password universal** `123456` (mantiene el patrón actual)
- **TRUNCATE ampliado** para incluir `agenda`, `formacion_academica`, `turno`, `ficha_salud`, `plan_alimentacion`, etc. (hoy el TRUNCATE no las toca, dejando basura en re-runs)

## Cambios

### Archivos

| Path | Acción |
|---|---|
| `apps/backend/src/seed/data/nutricionistas-demo.data.ts` | **NUEVO** — Define los 15 nutricionistas, su formación y sus agendas |
| `apps/backend/src/seed-multi-tenant.ts` | **MODIFICAR** — Importar el nuevo módulo, ampliar TRUNCATE, reescribir `crearNutricionistas()` |

### Archivo nuevo: `nutricionistas-demo.data.ts`

Estructura interna del archivo:

```ts
// 1. Tipos
interface NutricionistaDemo {
  email: string;
  password: string;                 // siempre '123456'
  nombre: string;
  apellido: string;
  fechaNacimiento: string;          // 'YYYY-MM-DD'
  genero: 'MASCULINO' | 'FEMENINO' | 'OTRO';
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  dni: string;
  gimnasioNombre: string;           // lookup key del map existente
  matricula: string;                // única
  aniosExperiencia: number;
  tarifaSesion: number;             // DECIMAL(10,2)
  formacionAcademica: FormacionAcademicaDemo[];
  agenda: BloqueAgendaDemo[];
}

interface FormacionAcademicaDemo {
  titulo: string;
  institucion: string;
  anioInicio: number;
  anioFin: number;
  nivel: 'Grado' | 'Posgrado' | 'Maestría' | 'Diplomatura' | 'Doctorado';
}

interface BloqueAgendaDemo {
  dia: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  horaInicio: string;               // 'HH:mm:ss'
  horaFin: string;                  // 'HH:mm:ss'
  duracionTurno: number;            // 30 | 45 | 60
}

// 2. Constantes auxiliares
const PROVINCIAS_POR_GIMNASIO: Record<string, string[]> = {
  'Gym Central': ['CABA', 'Buenos Aires'],
  'Gym Norte':   ['Córdoba', 'Mendoza', 'Tucumán'],
  'Gym Sur':     ['Santa Fe', 'Neuquén', 'Río Negro'],
};

const NOMBRES_FEMENINOS = ['Sofía', 'María', 'Carla', 'Lucía', 'Paula', 'Florencia', 'Valentina', 'Camila'];
const NOMBRES_MASCULINOS = ['Diego', 'Martín', 'Sebastián', 'Federico', 'Joaquín', 'Lucas', 'Gabriel', 'Mateo'];
const APELLIDOS = ['González', 'Fernández', 'Rodríguez', 'Martínez', 'López', 'Pérez', 'Sánchez', 'Romero', 'Díaz', 'Medina'];

const TITULOS = [
  { titulo: 'Licenciatura en Nutrición', institucion: 'UBA' },
  { titulo: 'Licenciatura en Nutrición', institucion: 'UNLP' },
  { titulo: 'Licenciatura en Nutrición', institucion: 'UNC' },
  { titulo: 'Licenciatura en Nutrición', institucion: 'UNL' },
  { titulo: 'Licenciatura en Nutrición', institucion: 'UNR' },
  { titulo: 'Diplomatura en Nutrición Clínica', institucion: 'Hospital Italiano' },
  { titulo: 'Maestría en Nutrición Deportiva', institucion: 'Universidad Favaloro' },
  { titulo: 'Posgrado en Obesidad y Trastornos Alimentarios', institucion: 'SAOTA' },
  { titulo: 'Diplomatura en Nutrición Vegetariana/Vegana', institucion: 'UBA' },
];

const PLANTILLAS_AGENDA: BloqueAgendaDemo[][] = [
  // 0: full-time mañana
  [{ dia: 'Lunes',     horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
   { dia: 'Martes',    horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
   { dia: 'Miércoles', horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
   { dia: 'Jueves',    horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
   { dia: 'Viernes',   horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 }],
  // 1: tarde L-Mi-V
  [{ dia: 'Lunes',     horaInicio: '14:00:00', horaFin: '19:00:00', duracionTurno: 45 },
   { dia: 'Miércoles', horaInicio: '14:00:00', horaFin: '19:00:00', duracionTurno: 45 },
   { dia: 'Viernes',   horaInicio: '14:00:00', horaFin: '19:00:00', duracionTurno: 45 }],
  // 2: mixto Ma-Ju mañana + Sábado
  [{ dia: 'Martes',   horaInicio: '08:00:00', horaFin: '12:00:00', duracionTurno: 30 },
   { dia: 'Jueves',   horaInicio: '08:00:00', horaFin: '12:00:00', duracionTurno: 30 },
   { dia: 'Sábado',   horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 30 }],
  // 3: tarde compacta L-V
  [{ dia: 'Lunes',     horaInicio: '16:00:00', horaFin: '20:00:00', duracionTurno: 30 },
   { dia: 'Martes',    horaInicio: '16:00:00', horaFin: '20:00:00', duracionTurno: 30 },
   { dia: 'Miércoles', horaInicio: '16:00:00', horaFin: '20:00:00', duracionTurno: 30 },
   { dia: 'Jueves',    horaInicio: '16:00:00', horaFin: '20:00:00', duracionTurno: 30 },
   { dia: 'Viernes',   horaInicio: '16:00:00', horaFin: '20:00:00', duracionTurno: 30 }],
  // 4: split Mi-V-Sá
  [{ dia: 'Miércoles', horaInicio: '10:00:00', horaFin: '14:00:00', duracionTurno: 60 },
   { dia: 'Miércoles', horaInicio: '16:00:00', horaFin: '20:00:00', duracionTurno: 60 },
   { dia: 'Viernes',   horaInicio: '10:00:00', horaFin: '14:00:00', duracionTurno: 60 },
   { dia: 'Sábado',    horaInicio: '10:00:00', horaFin: '14:00:00', duracionTurno: 60 }],
];

// 3. Función exportada: genera los 15 nutricionistas
// Estructura interna:
//   1. Inicializa array vacío
//   2. Para cada gimnasio (3), genera 5 nutricionistas:
//      - Asigna género (alterna para mantener 50/50 global; ej: gimnasio 1: F,M,F,M,F; gimnasio 2: M,F,M,F,M; gimnasio 3: F,M,F,M,F)
//      - Pickea nombre+apellido únicos del pool (sin repetir entre los 15)
//      - Calcula email único, matrícula MN-3XXX, fechaNacimiento a partir de aniosExperiencia
//      - Genera DNI, teléfono y dirección desde pools + random
//      - Asigna ciudad/provincia de PROVINCIAS_POR_GIMNASIO rotando
//      - Tarifa = 8000 + (indiceGlobal * 1200) (rinde 8000, 9200, 10400, ..., 24800)
//      - Formación académica: shuffle(TITULOS) → slice 1-3, completar años con random 1990-2018 + 4-7
//      - Agenda: PLANTILLAS_AGENDA[indiceGlobal % 5] (cada nutri usa UNA plantilla)
//   3. Valida no-duplicados de email/matricula antes de devolver
//   4. Retorna el array
export function generarNutricionistasDemo(): NutricionistaDemo[] {
  // implementación: ~80 líneas
}
```

**Algoritmo de generación** (en `generarNutricionistasDemo`):
1. Por cada gimnasio (3), asignar 5 slots.
2. **Distribución de género por gimnasio**: 3 Femeninos + 2 Masculinos (o alternar para mantener el 50/50 global).
3. **Generar nombre+apellido** combinando `NOMBRES_FEMENINOS`/`NOMBRES_MASCULINOS` × `APELLIDOS`. Sin repeticiones entre los 15.
4. **Email**: `${nombre.toLowerCase()}.${apellido.toLowerCase()}${index}@nutrifit.com` → ej: `sofia.gonzalez3@nutrifit.com`. El sufijo numérico evita colisiones si el pool se queda corto.
5. **Matrícula**: `MN-${3001 + index}` → rango 3001-3015.
6. **Fecha de nacimiento**: cálculo inverso a `aniosExperiencia` con jitter de ±2 años, entre 1970 y 2002.
7. **DNI**: 8 dígitos aleatorios (sin validación de uniqueness a nivel DB, verificado que el campo no es UNIQUE en `persona`).
8. **Teléfono**: `+54 9 11 ${4XXX}-${XXXX}` (formato argentino estándar).
9. **Ciudad/Provincia**: de `PROVINCIAS_POR_GIMNASIO[gimnasio]` rotando.
10. **Dirección**: `Av. {Calle} {Número}` o `{Calle} {Número}` con pool de calles y números.
11. **Tarifa**: rampa de $8.000 (nutri #1) a $25.000 (nutri #15), paso $1.200 aprox. — algunos redondeados a $500.
12. **Formación académica**: shuffle de `TITULOS` filtrado a 1-3 entradas, asignar `anioInicio` (1990-2018) y `anioFin` (inicio + 4-7).
13. **Agenda**: ciclar entre las 5 `PLANTILLAS_AGENDA` para que los 15 tengan variedad.

### Archivo modificado: `seed-multi-tenant.ts`

#### a) Importar el nuevo módulo

Agregar después de los `require` existentes (línea 32 aprox.):
```ts
const { generarNutricionistasDemo } = require('./seed/data/nutricionistas-demo.data');
```

#### b) Ampliar el TRUNCATE (líneas 226-261)

El TRUNCATE actual deja fuera `agenda`, `formacion_academica`, `turno`, `ficha_salud`, `ficha_salud_patologias`, `ficha_salud_alergias`, `plan_alimentacion`, `plan_alimentacion_dia`, `plan_alimentacion_item`, `plan_alimentacion_item_comida`, `medicion`, `foto_progreso`, `consulta_clinica`, `observacion`. Reordenarlas para respetar el orden de FKs (hijas antes que `persona`):

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

#### c) Reescribir `crearNutricionistas()` (líneas 479-516)

Estructura nueva:

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

    // 1) Insertar persona (idempotente por matricula)
    const resultadoPersona: unknown = await dataSource.query(
      `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion,
                            ciudad, provincia, dni, id_gimnasio, matricula, anios_experiencia,
                            tarifa_sesion, tipo_persona)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NutricionistaOrmEntity')
       ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
      [nutri.nombre, nutri.apellido, nutri.fechaNacimiento, nutri.genero, nutri.telefono,
       nutri.direccion, nutri.ciudad, nutri.provincia, nutri.dni, idGimnasio,
       nutri.matricula, nutri.aniosExperiencia, nutri.tarifaSesion],
    );
    const idNutricionista = (resultadoPersona as { insertId: number }).insertId;
    nutricionistasIds.set(nutri.email, idNutricionista);

    // 2) Insertar usuario (idempotente por email)
    await dataSource.query(
      `INSERT INTO usuario (email, password_hash, id_persona, rol, estado)
       VALUES (?, ?, ?, 'NUTRICIONISTA', 'ACTIVO')
       ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
      [nutri.email, passwordHash, idNutricionista],
    );

    // 3) Reemplazar formación académica (DELETE + INSERT para reflejar versión actual)
    await dataSource.query(`DELETE FROM formacion_academica WHERE id_nutricionista = ?`, [idNutricionista]);
    for (const f of nutri.formacionAcademica) {
      await dataSource.query(
        `INSERT INTO formacion_academica (titulo, institucion, anio_inicio, anio_fin, nivel, id_nutricionista)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [f.titulo, f.institucion, f.anioInicio, f.anioFin, f.nivel, idNutricionista],
      );
      totalFormaciones++;
    }

    // 4) Reemplazar agenda (DELETE + INSERT)
    await dataSource.query(`DELETE FROM agenda WHERE id_nutricionista = ?`, [idNutricionista]);
    for (const bloque of nutri.agenda) {
      await dataSource.query(
        `INSERT INTO agenda (dia, hora_inicio, hora_fin, duracion_turno, id_nutricionista)
         VALUES (?, ?, ?, ?, ?)`,
        [bloque.dia, bloque.horaInicio, bloque.horaFin, bloque.duracionTurno, idNutricionista],
      );
      totalBloques++;
    }
  }

  console.log(`✓ ${lista.length} nutricionistas | ${totalFormaciones} formaciones | ${totalBloques} bloques de agenda`);
  return nutricionistasIds;
}
```

#### d) Eliminar el array local `nutricionistas: NutricionistaData[]` (líneas 116-138) y `NutricionistaData` interface (líneas 60-62)

Ya no se usa — el nuevo módulo lo provee.

## Estrategia de idempotencia

- **persona**: `ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)` (columna `matricula` es UNIQUE).
- **usuario**: `ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)` (columna `email` es UNIQUE).
- **formacion_academica / agenda**: `DELETE WHERE id_nutricionista = ?` + `INSERT` simple (ninguna tiene UNIQUE index que requiera ON DUPLICATE).
- **Re-run del seed**: produce el mismo estado final, sin filas huérfanas.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| TRUNCATE con FKs en orden incorrecto → falla la limpieza | Las tablas hijas se truncan antes que `persona` (orden explícito arriba) |
| Email duplicado entre nutris (pool de 16 nombres × 10 apellidos = 160 combos, suficiente) | Sufijo numérico `${index}` en el email garantiza unicidad |
| DNI no UNIQUE a nivel DB → dos nutris con mismo DNI | Bajo impacto (no es dato de login); aceptable |
| Bloque de agenda con `duracionTurno > (horaFin - horaInicio)` | Plantillas pre-validadas; la use-case de `configure-agenda` rechaza pero en seed directo con SQL crudo pasaría. Mantener las 5 plantillas dentro de la regla |
| Re-correr el seed con admins/socios existentes | El TRUNCATE ampliado borra TODO antes de sembrar (igual que el patrón actual) |
| `nutricionista.repository.ts:38` tiene un bug menor de tipo (`NutricionistaEntity` en vez de `NutricionistaOrmEntity`) | **No se toca en este cambio** — fuera de scope |

## Lo que NO se hace (scope explícito)

- ❌ Nada de código de producción: use-cases, controllers, DTOs, entities
- ❌ Nada de UI / frontend
- ❌ Nada de migraciones
- ❌ No se agrega endpoint, ni servicio, ni página
- ❌ No se crea la entidad `Especialidad` (sigue hardcodeada como `'Nutricionista'` en el use-case público)
- ❌ No se cambia el seed de gimnasios, admins ni socios
- ❌ No se agrega generación de turnos, planes, mediciones ni fichas (solo nutricionistas + agenda + formación)
- ❌ No se sube la foto real a MinIO — `foto_perfil_key = NULL`, el frontend hace fallback a iniciales con gradiente

## Verificación

Después de implementar:
1. Levantar backend (lo hace Agustín) y correr el seed: `npx ts-node src/seed-multi-tenant.ts` o el script npm equivalente.
2. Verificar conteo: `SELECT COUNT(*) FROM persona WHERE tipo_persona='NutricionistaOrmEntity';` → debe dar 15.
3. Verificar agendas: `SELECT COUNT(*) FROM agenda;` → debe dar ≥ 30 (mínimo 2 bloques × 15).
4. Verificar formación: `SELECT COUNT(*) FROM formacion_academica;` → debe dar ≥ 15.
5. Probar endpoint público: `GET /profesional/publico/disponibles` → debe devolver 15 (con los filtros de `!fechaBaja`).
6. Probar disponibilidad: `GET /turnos/socio/profesional/:id/disponibilidad?fecha=YYYY-MM-DD` para un día futuro → debe devolver slots cuadriculados según la `duracionTurno` de cada bloque.
7. Frontend: login como socio → `AgendarTurno` debe mostrar 15 tarjetas de profesionales con datos variados (género visible en avatar fallback, ciudad, provincia, tarifa).
8. Re-correr el seed: debe terminar sin error y dejar la DB en el mismo estado.

## Estimación

- Archivo nuevo `nutricionistas-demo.data.ts`: ~250 líneas (tipos + constantes + función generadora).
- Modificación de `seed-multi-tenant.ts`: ~80 líneas cambiadas (TRUNCATE + crearNutricionistas + eliminar interface/array).
- Total: ~330 líneas modificadas/creadas.
- Tiempo estimado: implementación directa, sin tests automatizados (el seed es un script de un solo uso).
