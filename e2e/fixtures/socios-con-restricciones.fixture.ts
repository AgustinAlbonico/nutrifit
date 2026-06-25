/**
 * Fixture de socios con restricciones alimentarias y patologías.
 *
 * Cada perfil exportado representa la forma de `FichaClinicaParaValidacion`
 * (definida en `apps/backend/src/domain/validators/restricciones-validator-v2.ts`)
 * que el backend necesita para validar el plan generado por IA.
 *
 * Los IDs (`idSocio`) son valores simbólicos del seed — los tests deben
 * resolver el ID real contra la API o usar los datos sembrados por el flujo.
 *
 * Convenciones:
 * - `idSocio` simbólico: cada perfil referencia el socio correspondiente
 *   dentro del gimnasio `Gym Central` definido en `CREDENCIALES_SEED.md`.
 * - `objetivoCalorias` está pensado para que `MacrosValidator` produzca
 *   macros en banda VERDE (±5%) al recibir un plan balanceado.
 * - Las strings de `alergias`/`patologias`/`restriccionesAlimentarias`
 *   coinciden con el léxico del catálogo `CATALOGOS_RESTRICCIONES_DEFAULT`.
 */

export interface FichaClinicaFixture {
  /** Descripción en español para logs y debugging */
  descripcion: string;
  /** ID simbólico del socio (debe existir en la BD sembrada) */
  idSocio: number;
  /** Email del socio (referencia para debugging, NO se usa para login aquí) */
  emailSocio: string;
  /** Alergias explícitas (lista vacía si ninguna) */
  alergias: string[];
  /** Texto libre con restricciones alimentarias (null si no aplica) */
  restriccionesAlimentarias: string | null;
  /** Patologías del socio (lista vacía si ninguna) */
  patologias: string[];
  /** Objetivo nutricional textual (ej: "bajar de peso") */
  objetivoPersonal: string | null;
  /** Objetivo calórico diario (kcal) — usado para validar banda de macros */
  objetivoCalorias: number;
}

/**
 * Socio vegano estricto:
 * - Sin alergias
 * - Restricciones: explícitamente vegano (sin carne, lácteos, huevos, miel)
 * - Sin patologías
 * - Objetivo: 2000 kcal/día para mantenimiento
 */
export const socioVeganoEstricto: FichaClinicaFixture = {
  descripcion: 'Socio vegano estricto sin alergias ni patologías',
  idSocio: 50001001, // socio1-central@nutrifit.com (DNI 50001001)
  emailSocio: 'socio1-central@nutrifit.com',
  alergias: [],
  restriccionesAlimentarias: 'vegano estricto, sin carne, sin lácteos, sin huevos, sin miel',
  patologias: [],
  objetivoPersonal: 'mantenimiento de peso con dieta vegana',
  objetivoCalorias: 2000,
};

/**
 * Socio diabético tipo 2:
 * - Sin alergias explícitas
 * - Restricciones: bajo en azúcar
 * - Patología: DIABETES
 * - Objetivo: 1800 kcal/día bajo en azúcar
 */
export const socioDiabeticoTipo2: FichaClinicaFixture = {
  descripcion: 'Socio con diabetes tipo 2, plan bajo en azúcar',
  idSocio: 50001002, // socio2-central@nutrifit.com (DNI 50001002)
  emailSocio: 'socio2-central@nutrifit.com',
  alergias: [],
  restriccionesAlimentarias: 'bajo en azúcar, sin dulces refinados, bajo índice glucémico',
  patologias: ['DIABETES_TIPO_2'],
  objetivoPersonal: 'control glucémico y pérdida de peso moderada',
  objetivoCalorias: 1800,
};

/**
 * Socio celíaco:
 * - Sin alergias
 * - Restricciones: sin gluten (sin trigo, avena, cebada, centeno)
 * - Patología: CELIAQUIA
 * - Objetivo: 2000 kcal/día
 */
export const socioCeliaco: FichaClinicaFixture = {
  descripcion: 'Socio con celiaquía, plan sin gluten',
  idSocio: 50001003, // socio3-central@nutrifit.com (DNI 50001003)
  emailSocio: 'socio3-central@nutrifit.com',
  alergias: [],
  restriccionesAlimentarias: 'sin gluten, sin trigo, sin avena, sin cebada, sin centeno',
  patologias: ['CELIAQUIA'],
  objetivoPersonal: 'mantenimiento con dieta libre de gluten',
  objetivoCalorias: 2000,
};

/**
 * Socio con múltiples restricciones (caso adverso):
 * - Vegano
 * - Alergia a la soja
 * - Intolerancia a la lactosa
 * - Diabetes tipo 2
 * - Objetivo: 1700 kcal/día
 *
 * Caso de stress test: la IA debe cumplir 4 restricciones simultáneamente.
 */
export const socioMultiRestriccion: FichaClinicaFixture = {
  descripcion: 'Socio vegano + alergia soja + intolerancia lactosa + diabetes tipo 2',
  idSocio: 50001004, // DNI ficticio 50001004 (no existe en seed — para test adverso)
  emailSocio: 'test-multi-restriccion@nutrifit.com',
  alergias: ['SOJA'],
  restriccionesAlimentarias:
    'vegano, sin gluten, sin lactosa, bajo en azúcar, sin soja',
  patologias: ['DIABETES_TIPO_2'],
  objetivoPersonal: 'plan estricto multi-restricción para control metabólico',
  objetivoCalorias: 1700,
};

/**
 * Socio sin restricciones:
 * - Ficha limpia para caso happy path
 * - Objetivo: 2200 kcal/día
 */
export const socioSinRestricciones: FichaClinicaFixture = {
  descripcion: 'Socio sin restricciones, ficha clínica limpia',
  idSocio: 50001005, // DNI ficticio 50001005
  emailSocio: 'test-sin-restricciones@nutrifit.com',
  alergias: [],
  restriccionesAlimentarias: null,
  patologias: [],
  objetivoPersonal: 'mantenimiento con alimentación balanceada',
  objetivoCalorias: 2200,
};

/** Lista iterable para tests parametrizados */
export const TODOS_LOS_PERFILES: FichaClinicaFixture[] = [
  socioVeganoEstricto,
  socioDiabeticoTipo2,
  socioCeliaco,
  socioMultiRestriccion,
  socioSinRestricciones,
];