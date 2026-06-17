export interface BloqueAgendaSemilla {
  dia: string;
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;
}

export interface NutricionistaSemilla {
  email: string;
  nombre: string;
  apellido: string;
  genero: string;
  matricula: string;
  aniosExperiencia: number;
  tarifaSesion: number;
  presentacion: string;
  certificaciones: string;
  gimnasioNombre: string;
  agenda: BloqueAgendaSemilla[];
}

export interface SocioSemilla {
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  genero: string;
  gimnasioNombre: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
}

export interface TurnoSemilla {
  idSocio: number;
  idNutricionista: number;
  fecha: string;
  hora: string;
  estado: string;
  idGimnasio: number;
}

export interface PlanSemilla {
  idSocio: number;
  idNutricionista: number;
  objetivoNutricional: string;
}

const GIMNASIOS = ['Gym Central', 'Gym Norte', 'Gym Sur'] as const;

const NOMBRES_MASCULINOS = [
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
  'Emiliano',
  'Bruno',
];

const NOMBRES_FEMENINOS = [
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
  'Lara',
  'Agustina',
];

const APELLIDOS = [
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
  'Molina',
  'Navarro',
  'Ortiz',
  'Ramírez',
  'Torres',
];

const PRESENTACIONES = [
  'Nutricionista con foco en planes personalizados, control de peso y educacion alimentaria sostenible.',
  'Nutricionista deportivo orientado a rendimiento, recomposicion corporal y atletas de fuerza y resistencia.',
  'Nutricionista clinica especializada en patologias cronicas no transmisibles y alimentacion familiar.',
  'Nutricionista focalizada en salud digestiva, intolerancias y alimentacion basada en plantas.',
  'Nutricionista orientada a salud femenina, etapas de vida y composicion corporal con enfoque realista.',
  'Nutricionista pediatrico especializado en alimentacion infantil, crecimiento y desarrollo saludable.',
  'Nutricionista con enfoque en alimentacion intuitiva, salud mental y trastornos de la conducta alimentaria.',
  'Nutricionista geriatrico focalizado en adulto mayor, sarcopenia y enfermedades cronicas.',
];

const CERTIFICACIONES = [
  'ISAK Nivel 2, Cert. en Nutricion Vegetariana/Vegana (UBA).',
  'Maestria en Nutricion Deportiva (Universidad Favaloro), Cert. ISSN.',
  'Diplomatura en Nutricion Clinica (Hospital Italiano), Posgrado SAOTA.',
  'Cert. en Diabetes Education (IDF), Diplomatura en Obesidad.',
  'Licenciatura en Nutricion (UBA), Doctorado en Ciencias de la Salud.',
  'Cert. Internacional en Nutricion Pediatrica (ILSI), Diplomatura en Alimentacion Infantil.',
  'Posgrado en Nutricion y Deporte (UNL), Cert. en Antropometria ISAK Nivel 3.',
  'Maestria en Nutricion y Metabolismo (UNR), Cert. en Nutricion Clinica Avanzada.',
];

const PLANTILLAS_AGENDA: BloqueAgendaSemilla[][] = [
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
  [
    {
      dia: 'Lunes',
      horaInicio: '07:00:00',
      horaFin: '11:00:00',
      duracionTurno: 30,
    },
    {
      dia: 'Martes',
      horaInicio: '07:00:00',
      horaFin: '11:00:00',
      duracionTurno: 30,
    },
    {
      dia: 'Miércoles',
      horaInicio: '07:00:00',
      horaFin: '11:00:00',
      duracionTurno: 30,
    },
    {
      dia: 'Jueves',
      horaInicio: '07:00:00',
      horaFin: '11:00:00',
      duracionTurno: 30,
    },
    {
      dia: 'Viernes',
      horaInicio: '07:00:00',
      horaFin: '11:00:00',
      duracionTurno: 30,
    },
  ],
  [
    {
      dia: 'Lunes',
      horaInicio: '14:00:00',
      horaFin: '18:00:00',
      duracionTurno: 60,
    },
    {
      dia: 'Martes',
      horaInicio: '14:00:00',
      horaFin: '18:00:00',
      duracionTurno: 60,
    },
    {
      dia: 'Miércoles',
      horaInicio: '14:00:00',
      horaFin: '18:00:00',
      duracionTurno: 60,
    },
    {
      dia: 'Jueves',
      horaInicio: '14:00:00',
      horaFin: '18:00:00',
      duracionTurno: 60,
    },
    {
      dia: 'Viernes',
      horaInicio: '14:00:00',
      horaFin: '18:00:00',
      duracionTurno: 60,
    },
  ],
  [
    {
      dia: 'Martes',
      horaInicio: '09:00:00',
      horaFin: '13:00:00',
      duracionTurno: 45,
    },
    {
      dia: 'Jueves',
      horaInicio: '09:00:00',
      horaFin: '13:00:00',
      duracionTurno: 45,
    },
    {
      dia: 'Sábado',
      horaInicio: '10:00:00',
      horaFin: '14:00:00',
      duracionTurno: 45,
    },
  ],
];

const OBJETIVOS_PLANES = [
  'Reducir peso corporal y mejorar composicion',
  'Aumentar masa muscular y fuerza',
  'Mejorar rendimiento deportivo',
  'Controlar diabetes tipo 2',
  'Reducir colesterol y trigliceridos',
  'Mejorar digestion y salud intestinal',
  'Plan de alimentacion para embarazo saludable',
  'Alimentacion vegetariana/vegana balanceada',
  'Mejorar habitos alimentarios generales',
  'Control de hipertension arterial',
];

function generarEmail(nombre: string, apellido: string, index: number): string {
  const base = `${nombre}.${apellido}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return `${base}.${index}@nutrifit.com`;
}

function generarDni(index: number): string {
  return String(51001000 + index);
}

export function generarNutricionistasSemilla(
  cantidadPorGimnasio: number,
): NutricionistaSemilla[] {
  const resultado: NutricionistaSemilla[] = [];
  let indiceGlobal = 0;

  for (const gimnasio of GIMNASIOS) {
    for (let i = 0; i < cantidadPorGimnasio; i++) {
      const genero = i % 2 === 0 ? 'FEMENINO' : 'MASCULINO';
      const nombre =
        genero === 'FEMENINO'
          ? NOMBRES_FEMENINOS[i % NOMBRES_FEMENINOS.length]
          : NOMBRES_MASCULINOS[i % NOMBRES_MASCULINOS.length];
      const apellido = APELLIDOS[indiceGlobal % APELLIDOS.length];
      const email = `nutri.demo.${genero === 'FEMENINO' ? 'f' : 'm'}${indiceGlobal}@${gimnasio.toLowerCase().replace(/\s+/g, '')}.com`;
      const matricula = `MN-${5000 + indiceGlobal}`;
      const aniosExperiencia = 3 + (i % 18);
      const tarifaSesion = 5000 + indiceGlobal * 800;
      const presentacion = `${PRESENTACIONES[i % PRESENTACIONES.length]} ${aniosExperiencia} anos de experiencia.`;
      const certificaciones = CERTIFICACIONES[i % CERTIFICACIONES.length];
      const plantillaIndice = indiceGlobal % PLANTILLAS_AGENDA.length;

      resultado.push({
        email,
        nombre,
        apellido,
        genero,
        matricula,
        aniosExperiencia,
        tarifaSesion,
        presentacion,
        certificaciones,
        gimnasioNombre: gimnasio,
        agenda: [...PLANTILLAS_AGENDA[plantillaIndice]],
      });
      indiceGlobal++;
    }
  }

  return resultado;
}

export function generarSociosSemilla(
  cantidadPorGimnasio: number,
): SocioSemilla[] {
  const resultado: SocioSemilla[] = [];
  let indiceGlobal = 0;

  for (const gimnasio of GIMNASIOS) {
    for (let i = 0; i < cantidadPorGimnasio; i++) {
      const genero = i % 2 === 0 ? 'MASCULINO' : 'FEMENINO';
      const nombre =
        genero === 'MASCULINO'
          ? NOMBRES_MASCULINOS[i % NOMBRES_MASCULINOS.length]
          : NOMBRES_FEMENINOS[i % NOMBRES_FEMENINOS.length];
      const apellido = APELLIDOS[indiceGlobal % APELLIDOS.length];
      const email = `socio.${genero === 'MASCULINO' ? 'm' : 'f'}${indiceGlobal}@${gimnasio.toLowerCase().replace(/\s+/g, '')}.com`;

      resultado.push({
        email,
        nombre,
        apellido,
        dni: generarDni(indiceGlobal),
        genero,
        gimnasioNombre: gimnasio,
        telefono: `341-555-${String(1000 + indiceGlobal).padStart(4, '0')}`,
        direccion: `Calle ${100 + indiceGlobal}`,
        ciudad: 'Rosario',
        provincia: 'Santa Fe',
      });
      indiceGlobal++;
    }
  }

  return resultado;
}

function fechaStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function diaSemanaIndex(nombreDia: string): number {
  const dias = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];
  const idx = dias.findIndex(
    (d) => d.toLowerCase() === nombreDia.toLowerCase(),
  );
  if (idx === -1) {
    const corto = nombreDia.slice(0, 3).toLowerCase();
    return dias.findIndex((d) => d.slice(0, 3).toLowerCase() === corto);
  }
  return idx;
}

export function generarTurnosSemilla(
  idsSocios: number[],
  idsNutricionistas: number[],
  gymIds: number[],
  agendas: Map<number, BloqueAgendaSemilla[]>,
): TurnoSemilla[] {
  const turnos: TurnoSemilla[] = [];
  const ocupados = new Map<string, Set<string>>();

  const hoy = new Date(2026, 5, 8);

  for (let i = 0; i < idsSocios.length; i++) {
    const idSocio = idsSocios[i];
    const idNutri = idsNutricionistas[i % idsNutricionistas.length];
    const idGym = gymIds[Math.floor(i / (idsSocios.length / gymIds.length))];

    const bloques = agendas.get(idNutri) ?? [];
    if (bloques.length === 0) continue;

    const bloque = bloques[i % bloques.length];
    const diaIdx = diaSemanaIndex(bloque.dia);
    const fechaTurno = new Date(hoy);
    fechaTurno.setDate(fechaTurno.getDate() - 14 + (diaIdx - hoy.getDay()));
    if (fechaTurno > hoy) fechaTurno.setDate(fechaTurno.getDate() - 7);
    if (fechaTurno.getDay() !== diaIdx) {
      fechaTurno.setDate(
        fechaTurno.getDate() + ((diaIdx - fechaTurno.getDay() + 7) % 7) - 7,
      );
    }

    const [hH, hM] = bloque.horaInicio.split(':').map(Number);
    const [hFinH, hFinM] = bloque.horaFin.split(':').map(Number);
    const minutosTotales = hFinH * 60 + hFinM - (hH * 60 + hM);
    const slotsEnBloque = Math.floor(minutosTotales / bloque.duracionTurno);
    const slotOffset =
      (Math.floor(i / bloques.length) % Math.max(slotsEnBloque, 1)) *
      bloque.duracionTurno;
    const hora = hH + Math.floor(slotOffset / 60);
    const minutos = hM + (slotOffset % 60);
    const horaStr = `${String(hora).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

    const fechaStrVal = fechaStr(fechaTurno);

    const key = `${idNutri}`;
    if (!ocupados.has(key)) ocupados.set(key, new Set());
    const ocupadoSet = ocupados.get(key)!;
    const slotKey = `${fechaStrVal}T${horaStr}`;
    if (ocupadoSet.has(slotKey)) continue;
    ocupadoSet.add(slotKey);

    const esPasado =
      fechaTurno < hoy || (fechaStrVal === fechaStr(hoy) && horaStr < '12:00');

    turnos.push({
      idSocio,
      idNutricionista: idNutri,
      fecha: fechaStrVal,
      hora: horaStr,
      estado: esPasado ? 'REALIZADO' : 'CONFIRMADO',
      idGimnasio: idGym,
    });
  }

  return turnos;
}

export function generarPlanesSemilla(
  idsNutricionistas: number[],
  idsSocios: number[],
): PlanSemilla[] {
  const planes: PlanSemilla[] = [];

  for (let i = 0; i < idsSocios.length; i += 2) {
    const idSocio = idsSocios[i];
    if (!idSocio) continue;
    const idNutri = idsNutricionistas[i % idsNutricionistas.length];
    planes.push({
      idSocio,
      idNutricionista: idNutri,
      objetivoNutricional:
        OBJETIVOS_PLANES[Math.floor(i / 2) % OBJETIVOS_PLANES.length],
    });
  }

  return planes;
}
