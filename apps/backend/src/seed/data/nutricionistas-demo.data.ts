export interface FormacionAcademicaDemo {
  titulo: string;
  institucion: string;
  anioInicio: number;
  anioFin: number;
  nivel: 'Grado' | 'Posgrado' | 'Maestría' | 'Diplomatura' | 'Doctorado';
}

export interface BloqueAgendaDemo {
  dia:
    | 'Lunes'
    | 'Martes'
    | 'Miércoles'
    | 'Jueves'
    | 'Viernes'
    | 'Sábado'
    | 'Domingo';
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
  presentacion: string;
  certificaciones: string;
  formacionAcademica: FormacionAcademicaDemo[];
  agenda: BloqueAgendaDemo[];
}

const GIMNASIOS = ['Gym Central', 'Gym Norte', 'Gym Sur'] as const;

const PATRON_GENERO_POR_GIMNASIO: Record<string, readonly string[]> = {
  'Gym Central': ['F', 'M', 'F', 'M', 'F'],
  'Gym Norte': ['M', 'F', 'M', 'F', 'M'],
  'Gym Sur': ['F', 'M', 'F', 'M', 'F'],
};

const TARIFA_MIN = 8000;
const TARIFA_STEP_PESOS = 500;
const TARIFA_POR_NUTRI_PESOS = 1200;

const PROVINCIAS_POR_GIMNASIO: Record<string, string[]> = {
  'Gym Central': ['CABA', 'Buenos Aires'],
  'Gym Norte': ['Córdoba', 'Mendoza', 'Tucumán'],
  'Gym Sur': ['Santa Fe', 'Neuquén', 'Río Negro'],
};

const CIUDADES_POR_GIMNASIO: Record<string, string[]> = {
  CABA: ['Palermo', 'Recoleta', 'Belgrano', 'Caballito', 'San Telmo'],
  'Buenos Aires': ['La Plata', 'Mar del Plata', 'Tigre', 'Pilar'],
  Córdoba: ['Córdoba Capital', 'Río Cuarto', 'Villa Carlos Paz'],
  Mendoza: ['Mendoza Capital', 'San Rafael', 'Godoy Cruz'],
  Tucumán: ['San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo'],
  'Santa Fe': ['Rosario', 'Santa Fe Capital', 'Rafaela'],
  Neuquén: ['Neuquén Capital', 'San Martín de los Andes', 'Cutral Có'],
  'Río Negro': ['Bariloche', 'General Roca', 'Viedma'],
};

const CALLES: readonly string[] = [
  'Av. Corrientes',
  'Av. Santa Fe',
  'Av. Rivadavia',
  'Av. San Martín',
  'Av. Belgrano',
  'Av. Independencia',
  'Av. Córdoba',
  'Av. Entre Ríos',
  'San Martín',
  'Belgrano',
  'Sarmiento',
  'Mitre',
  'Rivadavia',
  'Alvear',
  'Lavalle',
  'Tucumán',
  'Paraguay',
  'Junín',
  'Salta',
  'La Rioja',
];

const NOMBRES_FEMENINOS: readonly string[] = [
  'Sofía',
  'María',
  'Carla',
  'Lucía',
  'Paula',
  'Florencia',
  'Valentina',
  'Camila',
  'Rocío',
  'Julieta',
  'Carolina',
  'Victoria',
  'Daniela',
];

const NOMBRES_MASCULINOS: readonly string[] = [
  'Diego',
  'Martín',
  'Sebastián',
  'Federico',
  'Joaquín',
  'Lucas',
  'Gabriel',
  'Mateo',
  'Tomás',
  'Nicolás',
  'Esteban',
  'Andrés',
  'Santiago',
];

const APELLIDOS: readonly string[] = [
  'González',
  'Fernández',
  'Rodríguez',
  'Martínez',
  'López',
  'Pérez',
  'Sánchez',
  'Romero',
  'Díaz',
  'Medina',
  'Acosta',
  'Benítez',
  'Castro',
  'Domínguez',
  'Flores',
  'Gómez',
  'Herrera',
  'Ibarra',
  'Juárez',
  'Luna',
];

const TITULOS: readonly {
  titulo: string;
  institucion: string;
  nivel: FormacionAcademicaDemo['nivel'];
}[] = [
  { titulo: 'Licenciatura en Nutrición', institucion: 'UBA', nivel: 'Grado' },
  { titulo: 'Licenciatura en Nutrición', institucion: 'UNLP', nivel: 'Grado' },
  { titulo: 'Licenciatura en Nutrición', institucion: 'UNC', nivel: 'Grado' },
  { titulo: 'Licenciatura en Nutrición', institucion: 'UNL', nivel: 'Grado' },
  { titulo: 'Licenciatura en Nutrición', institucion: 'UNR', nivel: 'Grado' },
  {
    titulo: 'Diplomatura en Nutrición Clínica',
    institucion: 'Hospital Italiano',
    nivel: 'Diplomatura',
  },
  {
    titulo: 'Maestría en Nutrición Deportiva',
    institucion: 'Universidad Favaloro',
    nivel: 'Maestría',
  },
  {
    titulo: 'Posgrado en Obesidad y Trastornos Alimentarios',
    institucion: 'SAOTA',
    nivel: 'Posgrado',
  },
  {
    titulo: 'Diplomatura en Nutrición Vegetariana/Vegana',
    institucion: 'UBA',
    nivel: 'Diplomatura',
  },
  {
    titulo: 'Doctorado en Ciencias de la Salud',
    institucion: 'UBA',
    nivel: 'Doctorado',
  },
];

const PLANTILLAS_AGENDA: readonly BloqueAgendaDemo[][] = [
  [
    {
      dia: 'Lunes',
      horaInicio: '09:00:00',
      horaFin: '13:00:00',
      duracionTurno: 60,
    },
    {
      dia: 'Martes',
      horaInicio: '09:00:00',
      horaFin: '13:00:00',
      duracionTurno: 60,
    },
    {
      dia: 'Miércoles',
      horaInicio: '09:00:00',
      horaFin: '13:00:00',
      duracionTurno: 60,
    },
    {
      dia: 'Jueves',
      horaInicio: '09:00:00',
      horaFin: '13:00:00',
      duracionTurno: 60,
    },
    {
      dia: 'Viernes',
      horaInicio: '09:00:00',
      horaFin: '13:00:00',
      duracionTurno: 60,
    },
  ],
  [
    {
      dia: 'Lunes',
      horaInicio: '14:00:00',
      horaFin: '19:00:00',
      duracionTurno: 45,
    },
    {
      dia: 'Miércoles',
      horaInicio: '14:00:00',
      horaFin: '19:00:00',
      duracionTurno: 45,
    },
    {
      dia: 'Viernes',
      horaInicio: '14:00:00',
      horaFin: '19:00:00',
      duracionTurno: 45,
    },
  ],
  [
    {
      dia: 'Martes',
      horaInicio: '08:00:00',
      horaFin: '12:00:00',
      duracionTurno: 30,
    },
    {
      dia: 'Jueves',
      horaInicio: '08:00:00',
      horaFin: '12:00:00',
      duracionTurno: 30,
    },
    {
      dia: 'Sábado',
      horaInicio: '09:00:00',
      horaFin: '13:00:00',
      duracionTurno: 30,
    },
  ],
  [
    {
      dia: 'Lunes',
      horaInicio: '16:00:00',
      horaFin: '20:00:00',
      duracionTurno: 30,
    },
    {
      dia: 'Martes',
      horaInicio: '16:00:00',
      horaFin: '20:00:00',
      duracionTurno: 30,
    },
    {
      dia: 'Miércoles',
      horaInicio: '16:00:00',
      horaFin: '20:00:00',
      duracionTurno: 30,
    },
    {
      dia: 'Jueves',
      horaInicio: '16:00:00',
      horaFin: '20:00:00',
      duracionTurno: 30,
    },
    {
      dia: 'Viernes',
      horaInicio: '16:00:00',
      horaFin: '20:00:00',
      duracionTurno: 30,
    },
  ],
  [
    {
      dia: 'Miércoles',
      horaInicio: '10:00:00',
      horaFin: '14:00:00',
      duracionTurno: 60,
    },
    {
      dia: 'Miércoles',
      horaInicio: '16:00:00',
      horaFin: '20:00:00',
      duracionTurno: 60,
    },
    {
      dia: 'Viernes',
      horaInicio: '10:00:00',
      horaFin: '14:00:00',
      duracionTurno: 60,
    },
    {
      dia: 'Sábado',
      horaInicio: '10:00:00',
      horaFin: '14:00:00',
      duracionTurno: 60,
    },
  ],
];

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
  const numero = randomInt(1000, 9999);
  return `+54 9 11 ${codigoArea}-${numero}`;
}

function generarDireccion(): string {
  const calle = CALLES[randomInt(0, CALLES.length - 1)];
  const numero = randomInt(100, 4999);
  return `${calle} ${numero}`;
}

function generarFormacion(): FormacionAcademicaDemo[] {
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

const PLANTILLAS_PRESENTACION: readonly string[] = [
  'Nutricionista con foco en planes personalizados, control de peso y educacion alimentaria sostenible.',
  'Nutricionista deportivo orientado a rendimiento, recomposicion corporal y atletas de fuerza y resistencia.',
  'Nutricionista clinica especializada en patologias cronicas no transmisibles y alimentacion familiar.',
  'Nutricionista focalizada en salud digestiva, intolerancias y alimentacion basada en plantas.',
  'Nutricionista orientada a salud femenina, etapas de vida y composicion corporal con enfoque realista.',
];

function generarPresentacion(aniosExperiencia: number): string {
  const base = PLANTILLAS_PRESENTACION[randomInt(0, PLANTILLAS_PRESENTACION.length - 1)];
  return `${base} ${aniosExperiencia} anos de experiencia acompaniando pacientes.`;
}

const PLANTILLAS_CERTIFICACIONES: readonly string[] = [
  'ISAK Nivel 2, Cert. en Nutricion Vegetariana/Vegana (UBA).',
  'Maestria en Nutricion Deportiva (Universidad Favaloro), Cert. ISSN.',
  'Diplomatura en Nutricion Clinica (Hospital Italiano), Posgrado SAOTA.',
  'Cert. en Diabetes Education (IDF), Diplomatura en Obesidad.',
  'Licenciatura en Nutricion (UBA), Doctorado en Ciencias de la Salud.',
];

function generarCertificaciones(): string {
  return PLANTILLAS_CERTIFICACIONES[randomInt(0, PLANTILLAS_CERTIFICACIONES.length - 1)];
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
    const patron = PATRON_GENERO_POR_GIMNASIO[gimnasio];

    for (const genero of patron) {
      const apellido =
        apellidosShuffled[indiceApellido % apellidosShuffled.length];
      indiceApellido++;
      const nombre =
        genero === 'F'
          ? nombresFShuffled[indiceF++ % nombresFShuffled.length]
          : nombresMShuffled[indiceM++ % nombresMShuffled.length];

      const aniosExperiencia = randomInt(2, 20);
      const fechaNacimiento = `${2026 - aniosExperiencia - randomInt(23, 35)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`;

      const provincias = PROVINCIAS_POR_GIMNASIO[gimnasio];
      const provincia = provincias[randomInt(0, provincias.length - 1)];
      const ciudades = CIUDADES_POR_GIMNASIO[provincia] ?? ['Capital'];
      const ciudad = ciudades[randomInt(0, ciudades.length - 1)];

      const matricula = `MN-${3001 + indiceGlobal}`;
      const emailBase = `${nombre}.${apellido}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const email = `${emailBase}${indiceGlobal}@nutrifit.com`;

      const tarifaSesion =
        TARIFA_MIN +
        Math.round(
          (indiceGlobal * TARIFA_POR_NUTRI_PESOS) / TARIFA_STEP_PESOS,
        ) *
          TARIFA_STEP_PESOS;
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
        presentacion: generarPresentacion(aniosExperiencia),
        certificaciones: generarCertificaciones(),
        formacionAcademica: generarFormacion(),
        agenda: [...PLANTILLAS_AGENDA[plantillaIndice]],
      };
      resultado.push(nutri);
      indiceGlobal++;
    }
  }

  const emails = new Set(resultado.map((n) => n.email));
  const matriculas = new Set(resultado.map((n) => n.matricula));
  const dnis = new Set(resultado.map((n) => n.dni));
  if (emails.size !== resultado.length) {
    throw new Error('generarNutricionistasDemo: emails duplicados detectados');
  }
  if (matriculas.size !== resultado.length) {
    throw new Error(
      'generarNutricionistasDemo: matrículas duplicadas detectadas',
    );
  }
  if (dnis.size !== resultado.length) {
    throw new Error('generarNutricionistasDemo: DNIs duplicados detectados');
  }

  return resultado;
}
