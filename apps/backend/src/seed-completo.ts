import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import * as Minio from 'minio';

// Cargar variables de entorno
dotenv.config({ path: '.env' });

// ============================================================================
// TIPOS Y CONSTANTES
// ============================================================================

type Genero = 'MASCULINO' | 'FEMENINO' | 'OTRO';
type NivelActividad = 'Sedentario' | 'Moderado' | 'Intenso';
type FrecuenciaComidas =
  | '1-2 comidas'
  | '3 comidas'
  | '4-5 comidas'
  | '6 o más comidas';
type ConsumoAlcohol = 'Nunca' | 'Ocasional' | 'Moderado' | 'Frecuente';
type EstadoTurno =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'PRESENTE'
  | 'EN_CURSO'
  | 'CANCELADO'
  | 'REALIZADO'
  | 'AUSENTE'
  | 'REPROGRAMADO'
  | 'BLOQUEADO';
type DiaSemana =
  | 'Lunes'
  | 'Martes'
  | 'Miércoles'
  | 'Jueves'
  | 'Viernes'
  | 'Sábado'
  | 'Domingo';
type TipoComida = 'DESAYUNO' | 'ALMUERZO' | 'MERIENDA' | 'CENA' | 'COLACION';

interface AdminData {
  email: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  genero: Genero;
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  dni: string;
}

interface NutricionistaData extends AdminData {
  matricula: string;
  aniosExperiencia: number;
  tarifaSesion: number;
  fotoPerfilKey: string;
}

interface SocioData extends AdminData {
  fechaAlta: string;
  fotoPerfilKey: string;
}

interface FichaSaludData {
  altura: number;
  peso: number;
  objetivoPersonal: string;
  nivelActividadFisica: NivelActividad;
  medicacionActual: string | null;
  suplementosActuales: string | null;
  cirugiasPrevias: string | null;
  antecedentesFamiliares: string | null;
  frecuenciaComidas: FrecuenciaComidas;
  consumoAguaDiario: number;
  restriccionesAlimentarias: string | null;
  consumoAlcohol: ConsumoAlcohol;
  fumaTabaco: boolean;
  horasSueno: number;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
  patologias: string[];
  alergias: string[];
}

interface MedicionData {
  fecha: string;
  peso: number;
  altura: number;
  imc: number;
  perimetroCintura: number | null;
  perimetroCadera: number | null;
  perimetroBrazo: number | null;
  perimetroMuslo: number | null;
  perimetroPecho: number | null;
  pliegueTriceps: number | null;
  pliegueAbdominal: number | null;
  pliegueMuslo: number | null;
  porcentajeGrasa: number | null;
  masaMagra: number | null;
  frecuenciaCardiaca: number | null;
  tensionSistolica: number | null;
  tensionDiastolica: number | null;
  notasMedicion: string | null;
}

interface AgendaData {
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;
}

interface TurnoData {
  fecha: string;
  hora: string;
  estado: EstadoTurno;
  socioEmail: string;
  nutricionistaEmail: string;
}

interface PlanAlimentacionData {
  objetivoNutricional: string;
  socioEmail: string;
  nutricionistaEmail: string;
  dias: {
    dia: DiaSemana;
    orden: number;
    comidas: {
      tipoComida: TipoComida;
      comentarios: string | null;
      alimentos: string[];
    }[];
  }[];
}

// ============================================================================
// DATOS DE SEMILLA
// ============================================================================

const PATOLOGIAS = [
  { nombre: 'Hipotiroidismo' },
  { nombre: 'Hipertiroidismo' },
  { nombre: 'Diabetes Tipo 1' },
  { nombre: 'Diabetes Tipo 2' },
  { nombre: 'Hipertensión arterial' },
  { nombre: 'Celiaquía' },
  { nombre: 'Síndrome de ovario poliquístico' },
  { nombre: 'Anemia' },
  { nombre: 'Gastritis' },
  { nombre: 'Reflujo gastroesofágico' },
  { nombre: 'Hipercolesterolemia' },
  { nombre: 'Obesidad' },
  { nombre: 'Insuficiencia renal' },
  { nombre: 'Enfermedad de Crohn' },
  { nombre: 'Colitis ulcerosa' },
];

const ALERGIAS = [
  { nombre: 'Lactosa' },
  { nombre: 'Gluten' },
  { nombre: 'Maní' },
  { nombre: 'Mariscos' },
  { nombre: 'Huevo' },
  { nombre: 'Soja' },
  { nombre: 'Frutos secos' },
  { nombre: 'Pescado' },
  { nombre: 'Apio' },
  { nombre: 'Mostaza' },
  { nombre: 'Sésamo' },
  { nombre: 'Sulfitos' },
];

const ACCIONES_PROFESIONAL = [
  {
    clave: 'turnos.ver',
    nombre: 'Ver turnos',
    descripcion: 'Permite ver la lista de turnos',
  },
  {
    clave: 'turnos.crear',
    nombre: 'Crear turnos',
    descripcion: 'Permite crear nuevos turnos',
  },
  {
    clave: 'turnos.editar',
    nombre: 'Editar turnos',
    descripcion: 'Permite editar turnos existentes',
  },
  {
    clave: 'turnos.eliminar',
    nombre: 'Eliminar turnos',
    descripcion: 'Permite eliminar turnos',
  },
  {
    clave: 'socios.ver',
    nombre: 'Ver socios',
    descripcion: 'Permite ver la lista de socios',
  },
  {
    clave: 'socios.leer',
    nombre: 'Leer socios',
    descripcion: 'Permite leer datos de socios',
  },
  {
    clave: 'socios.registrar',
    nombre: 'Registrar socios',
    descripcion: 'Permite registrar nuevos socios',
  },
  {
    clave: 'agenda.ver',
    nombre: 'Ver agenda',
    descripcion: 'Permite ver la agenda',
  },
  {
    clave: 'plan.crear',
    nombre: 'Crear planes',
    descripcion: 'Permite crear planes de alimentación',
  },
];

const ACCIONES_ADMIN = [
  {
    clave: 'profesionales.ver',
    nombre: 'Ver profesionales',
    descripcion: 'Permite ver la lista de profesionales',
  },
  {
    clave: 'profesionales.crear',
    nombre: 'Crear profesionales',
    descripcion: 'Permite crear nuevos profesionales',
  },
  {
    clave: 'profesionales.editar',
    nombre: 'Editar profesionales',
    descripcion: 'Permite editar profesionales existentes',
  },
  {
    clave: 'profesionales.eliminar',
    nombre: 'Eliminar profesionales',
    descripcion: 'Permite eliminar profesionales',
  },
  {
    clave: 'usuarios.ver',
    nombre: 'Ver usuarios',
    descripcion: 'Permite ver la lista de usuarios',
  },
  {
    clave: 'permisos.gestionar',
    nombre: 'Gestionar permisos',
    descripcion: 'Permite gestionar permisos y grupos',
  },
];

const ADMINS: AdminData[] = [
  {
    email: 'admin@nutrifit.com',
    nombre: 'Agustin',
    apellido: 'Suarez',
    fechaNacimiento: '1988-03-10',
    genero: 'MASCULINO',
    telefono: '3417011001',
    direccion: 'San Martin 1234',
    ciudad: 'Rosario',
    provincia: 'Santa Fe',
    dni: '27111222',
  },
  {
    email: 'admin2@nutrifit.com',
    nombre: 'Paula',
    apellido: 'Roldan',
    fechaNacimiento: '1990-07-22',
    genero: 'FEMENINO',
    telefono: '3417011002',
    direccion: 'Cordoba 845',
    ciudad: 'Rosario',
    provincia: 'Santa Fe',
    dni: '28122333',
  },
];

const NUTRICIONISTAS: NutricionistaData[] = [
  {
    email: 'nutri@nutrifit.com',
    nombre: 'Lucia',
    apellido: 'Bianchi',
    fechaNacimiento: '1990-01-15',
    genero: 'FEMENINO',
    dni: '30111222',
    matricula: 'MN-1201',
    telefono: '3415011001',
    direccion: 'Mitre 1450',
    ciudad: 'Rosario',
    provincia: 'Santa Fe',
    aniosExperiencia: 6,
    tarifaSesion: 15000,
    fotoPerfilKey: 'defaults/nutricionista-lucia.png',
  },
  {
    email: 'nutri2@nutrifit.com',
    nombre: 'Martin',
    apellido: 'Lopez',
    fechaNacimiento: '1987-05-14',
    genero: 'MASCULINO',
    dni: '30222333',
    matricula: 'MN-1202',
    telefono: '3415011002',
    direccion: 'Italia 530',
    ciudad: 'Rosario',
    provincia: 'Santa Fe',
    aniosExperiencia: 9,
    tarifaSesion: 17000,
    fotoPerfilKey: 'defaults/nutricionista-martin.png',
  },
  {
    email: 'nutri3@nutrifit.com',
    nombre: 'Carla',
    apellido: 'Mendez',
    fechaNacimiento: '1992-09-02',
    genero: 'FEMENINO',
    dni: '30333444',
    matricula: 'MN-1203',
    telefono: '3415011003',
    direccion: 'Belgrano 901',
    ciudad: 'Funes',
    provincia: 'Santa Fe',
    aniosExperiencia: 5,
    tarifaSesion: 14500,
    fotoPerfilKey: 'defaults/nutricionista-carla.png',
  },
];

const SOCIOS: SocioData[] = [
  {
    email: 'socio@nutrifit.com',
    nombre: 'Juan',
    apellido: 'Perez',
    fechaNacimiento: '1995-01-01',
    genero: 'MASCULINO',
    dni: '40111222',
    telefono: '3416011001',
    direccion: 'Oroño 455',
    ciudad: 'Rosario',
    provincia: 'Santa Fe',
    fechaAlta: '2025-01-10',
    fotoPerfilKey: 'defaults/socio-juan.png',
  },
  {
    email: 'socio2@nutrifit.com',
    nombre: 'Maria',
    apellido: 'Gomez',
    fechaNacimiento: '1998-04-18',
    genero: 'FEMENINO',
    dni: '40222333',
    telefono: '3416011002',
    direccion: 'Paraguay 1320',
    ciudad: 'Rosario',
    provincia: 'Santa Fe',
    fechaAlta: '2025-02-03',
    fotoPerfilKey: 'defaults/socio-maria.png',
  },
  {
    email: 'socio3@nutrifit.com',
    nombre: 'Diego',
    apellido: 'Ramirez',
    fechaNacimiento: '1993-12-07',
    genero: 'MASCULINO',
    dni: '40333444',
    telefono: '3416011003',
    direccion: 'Juan B Justo 755',
    ciudad: 'Villa Gobernador Galvez',
    provincia: 'Santa Fe',
    fechaAlta: '2025-02-20',
    fotoPerfilKey: 'defaults/socio-diego.png',
  },
  {
    email: 'socio4@nutrifit.com',
    nombre: 'Ana',
    apellido: 'Fernandez',
    fechaNacimiento: '2000-08-25',
    genero: 'FEMENINO',
    dni: '40444555',
    telefono: '3416011004',
    direccion: 'Pellegrini 890',
    ciudad: 'Rosario',
    provincia: 'Santa Fe',
    fechaAlta: '2025-03-01',
    fotoPerfilKey: 'defaults/socio-ana.png',
  },
  {
    email: 'socio5@nutrifit.com',
    nombre: 'Carlos',
    apellido: 'Rodriguez',
    fechaNacimiento: '1985-06-12',
    genero: 'MASCULINO',
    dni: '25111222',
    telefono: '3416011005',
    direccion: 'Bv Oroño 2100',
    ciudad: 'Rosario',
    provincia: 'Santa Fe',
    fechaAlta: '2025-01-15',
    fotoPerfilKey: 'defaults/socio-carlos.png',
  },
];

const FICHAS_SALUD: Record<string, FichaSaludData> = {
  'socio@nutrifit.com': {
    altura: 176,
    peso: 85,
    objetivoPersonal: 'Perder peso y mejorar composición corporal',
    nivelActividadFisica: 'Moderado',
    medicacionActual: 'Levotiroxina 50mcg',
    suplementosActuales: 'Vitamina D 2000UI',
    cirugiasPrevias: 'Apendicectomía en 2018',
    antecedentesFamiliares:
      'Padre con diabetes tipo 2, madre con hipotiroidismo',
    frecuenciaComidas: '3 comidas',
    consumoAguaDiario: 2.0,
    restriccionesAlimentarias: 'No consume cerdo por preferencia',
    consumoAlcohol: 'Ocasional',
    fumaTabaco: false,
    horasSueno: 7,
    contactoEmergenciaNombre: 'Laura Perez',
    contactoEmergenciaTelefono: '3417001001',
    patologias: ['Hipotiroidismo'],
    alergias: ['Lactosa'],
  },
  'socio2@nutrifit.com': {
    altura: 162,
    peso: 58,
    objetivoPersonal: 'Tonificar y ganar masa muscular',
    nivelActividadFisica: 'Intenso',
    medicacionActual: null,
    suplementosActuales: 'Proteína de suero, Creatina',
    cirugiasPrevias: null,
    antecedentesFamiliares: 'Abuela con hipertensión',
    frecuenciaComidas: '4-5 comidas',
    consumoAguaDiario: 2.5,
    restriccionesAlimentarias: null,
    consumoAlcohol: 'Nunca',
    fumaTabaco: false,
    horasSueno: 8,
    contactoEmergenciaNombre: 'Pedro Gomez',
    contactoEmergenciaTelefono: '3417002002',
    patologias: [],
    alergias: [],
  },
  'socio3@nutrifit.com': {
    altura: 180,
    peso: 110,
    objetivoPersonal: 'Reducir peso por salud, bajar al menos 15kg',
    nivelActividadFisica: 'Sedentario',
    medicacionActual: 'Metformina 850mg, Losartán 50mg',
    suplementosActuales: null,
    cirugiasPrevias: null,
    antecedentesFamiliares:
      'Padre y hermano con obesidad, madre con hipertensión',
    frecuenciaComidas: '1-2 comidas',
    consumoAguaDiario: 1.0,
    restriccionesAlimentarias: null,
    consumoAlcohol: 'Frecuente',
    fumaTabaco: true,
    horasSueno: 5,
    contactoEmergenciaNombre: 'Marta Ramirez',
    contactoEmergenciaTelefono: '3417003003',
    patologias: ['Diabetes Tipo 2', 'Hipertensión arterial', 'Obesidad'],
    alergias: [],
  },
  'socio4@nutrifit.com': {
    altura: 165,
    peso: 52,
    objetivoPersonal: 'Mantener peso y mejorar hábitos alimentarios',
    nivelActividadFisica: 'Moderado',
    medicacionActual: null,
    suplementosActuales: 'Hierro 80mg',
    cirugiasPrevias: null,
    antecedentesFamiliares: null,
    frecuenciaComidas: '3 comidas',
    consumoAguaDiario: 1.5,
    restriccionesAlimentarias: 'Vegetariana',
    consumoAlcohol: 'Ocasional',
    fumaTabaco: false,
    horasSueno: 7,
    contactoEmergenciaNombre: 'Rosa Fernandez',
    contactoEmergenciaTelefono: '3417004004',
    patologias: ['Anemia'],
    alergias: ['Maní', 'Mariscos'],
  },
  'socio5@nutrifit.com': {
    altura: 172,
    peso: 95,
    objetivoPersonal: 'Bajar colesterol y perder peso',
    nivelActividadFisica: 'Moderado',
    medicacionActual: 'Atorvastatina 20mg',
    suplementosActuales: 'Omega 3',
    cirugiasPrevias: 'Colecistectomía en 2020',
    antecedentesFamiliares:
      'Padre con cardiopatía, madre con hipercolesterolemia',
    frecuenciaComidas: '3 comidas',
    consumoAguaDiario: 2.0,
    restriccionesAlimentarias: 'Intolerancia a alimentos muy grasos',
    consumoAlcohol: 'Moderado',
    fumaTabaco: false,
    horasSueno: 6,
    contactoEmergenciaNombre: 'Silvia Rodriguez',
    contactoEmergenciaTelefono: '3417005005',
    patologias: ['Hipercolesterolemia', 'Gastritis'],
    alergias: ['Gluten'],
  },
};

// Mediciones con evolución temporal (cada socio tiene 8 mediciones distribuidas en 2 meses)
const MEDICIONES_POR_SOCIO: Record<string, MedicionData[]> = {
  'socio@nutrifit.com': [
    // Juan - Evolución: bajó de peso, mejoró IMC
    {
      fecha: '2025-12-01',
      peso: 88.0,
      altura: 176,
      imc: 28.41,
      perimetroCintura: 98,
      perimetroCadera: 108,
      perimetroBrazo: 35,
      perimetroMuslo: 58,
      perimetroPecho: 105,
      pliegueTriceps: 18,
      pliegueAbdominal: 25,
      pliegueMuslo: 22,
      porcentajeGrasa: 26,
      masaMagra: 65.1,
      frecuenciaCardiaca: 78,
      tensionSistolica: 125,
      tensionDiastolica: 82,
      notasMedicion: 'Primera consulta - inicio de plan',
    },
    {
      fecha: '2025-12-08',
      peso: 87.2,
      altura: 176,
      imc: 28.15,
      perimetroCintura: 96,
      perimetroCadera: 107,
      perimetroBrazo: 35,
      perimetroMuslo: 58,
      perimetroPecho: 104,
      pliegueTriceps: 17,
      pliegueAbdominal: 24,
      pliegueMuslo: 21,
      porcentajeGrasa: 25,
      masaMagra: 65.4,
      frecuenciaCardiaca: 76,
      tensionSistolica: 122,
      tensionDiastolica: 80,
      notasMedicion: 'Buena adherencia al plan',
    },
    {
      fecha: '2025-12-15',
      peso: 86.5,
      altura: 176,
      imc: 27.92,
      perimetroCintura: 95,
      perimetroCadera: 106,
      perimetroBrazo: 35,
      perimetroMuslo: 57,
      perimetroPecho: 103,
      pliegueTriceps: 16,
      pliegueAbdominal: 23,
      pliegueMuslo: 20,
      porcentajeGrasa: 24,
      masaMagra: 65.7,
      frecuenciaCardiaca: 75,
      tensionSistolica: 120,
      tensionDiastolica: 80,
      notasMedicion: 'Continúa progreso',
    },
    {
      fecha: '2025-12-22',
      peso: 85.8,
      altura: 176,
      imc: 27.69,
      perimetroCintura: 93,
      perimetroCadera: 105,
      perimetroBrazo: 34,
      perimetroMuslo: 57,
      perimetroPecho: 102,
      pliegueTriceps: 16,
      pliegueAbdominal: 22,
      pliegueMuslo: 20,
      porcentajeGrasa: 23.5,
      masaMagra: 65.6,
      frecuenciaCardiaca: 74,
      tensionSistolica: 118,
      tensionDiastolica: 78,
      notasMedicion: 'Excelente evolución',
    },
    {
      fecha: '2026-01-05',
      peso: 85.0,
      altura: 176,
      imc: 27.44,
      perimetroCintura: 92,
      perimetroCadera: 104,
      perimetroBrazo: 34,
      perimetroMuslo: 56,
      perimetroPecho: 101,
      pliegueTriceps: 15,
      pliegueAbdominal: 21,
      pliegueMuslo: 19,
      porcentajeGrasa: 23,
      masaMagra: 65.5,
      frecuenciaCardiaca: 72,
      tensionSistolica: 118,
      tensionDiastolica: 78,
      notasMedicion: 'Post fiestas - mantuvo peso',
    },
    {
      fecha: '2026-01-12',
      peso: 84.2,
      altura: 176,
      imc: 27.18,
      perimetroCintura: 90,
      perimetroCadera: 103,
      perimetroBrazo: 34,
      perimetroMuslo: 56,
      perimetroPecho: 100,
      pliegueTriceps: 14,
      pliegueAbdominal: 20,
      pliegueMuslo: 18,
      porcentajeGrasa: 22,
      masaMagra: 65.7,
      frecuenciaCardiaca: 70,
      tensionSistolica: 115,
      tensionDiastolica: 76,
      notasMedicion: 'Muy buen progreso',
    },
    {
      fecha: '2026-01-26',
      peso: 83.0,
      altura: 176,
      imc: 26.79,
      perimetroCintura: 88,
      perimetroCadera: 102,
      perimetroBrazo: 33,
      perimetroMuslo: 55,
      perimetroPecho: 99,
      pliegueTriceps: 14,
      pliegueAbdominal: 19,
      pliegueMuslo: 17,
      porcentajeGrasa: 21,
      masaMagra: 65.6,
      frecuenciaCardiaca: 68,
      tensionSistolica: 115,
      tensionDiastolica: 75,
      notasMedicion: 'Sobrepeso limítrofe',
    },
    {
      fecha: '2026-02-16',
      peso: 82.5,
      altura: 176,
      imc: 26.63,
      perimetroCintura: 87,
      perimetroCadera: 101,
      perimetroBrazo: 33,
      perimetroMuslo: 55,
      perimetroPecho: 98,
      pliegueTriceps: 13,
      pliegueAbdominal: 18,
      pliegueMuslo: 17,
      porcentajeGrasa: 20,
      masaMagra: 66.0,
      frecuenciaCardiaca: 68,
      tensionSistolica: 112,
      tensionDiastolica: 74,
      notasMedicion: 'Casi llega al peso saludable',
    },
  ],
  'socio2@nutrifit.com': [
    // Maria - Evolución: ganó masa muscular
    {
      fecha: '2025-12-03',
      peso: 56.0,
      altura: 162,
      imc: 21.34,
      perimetroCintura: 68,
      perimetroCadera: 94,
      perimetroBrazo: 28,
      perimetroMuslo: 52,
      perimetroPecho: 88,
      pliegueTriceps: 14,
      pliegueAbdominal: 12,
      pliegueMuslo: 18,
      porcentajeGrasa: 20,
      masaMagra: 44.8,
      frecuenciaCardiaca: 62,
      tensionSistolica: 110,
      tensionDiastolica: 70,
      notasMedicion: 'Inicio plan de ganancia muscular',
    },
    {
      fecha: '2025-12-10',
      peso: 56.5,
      altura: 162,
      imc: 21.53,
      perimetroCintura: 68,
      perimetroCadera: 94,
      perimetroBrazo: 28.5,
      perimetroMuslo: 53,
      perimetroPecho: 89,
      pliegueTriceps: 14,
      pliegueAbdominal: 12,
      pliegueMuslo: 18,
      porcentajeGrasa: 19.5,
      masaMagra: 45.5,
      frecuenciaCardiaca: 62,
      tensionSistolica: 110,
      tensionDiastolica: 70,
      notasMedicion: 'Leve aumento de masa magra',
    },
    {
      fecha: '2025-12-17',
      peso: 57.0,
      altura: 162,
      imc: 21.72,
      perimetroCintura: 67,
      perimetroCadera: 94,
      perimetroBrazo: 29,
      perimetroMuslo: 54,
      perimetroPecho: 90,
      pliegueTriceps: 13,
      pliegueAbdominal: 11,
      pliegueMuslo: 17,
      porcentajeGrasa: 19,
      masaMagra: 46.2,
      frecuenciaCardiaca: 60,
      tensionSistolica: 108,
      tensionDiastolica: 68,
      notasMedicion: 'Buen progreso en brazos',
    },
    {
      fecha: '2025-12-24',
      peso: 57.2,
      altura: 162,
      imc: 21.8,
      perimetroCintura: 67,
      perimetroCadera: 94,
      perimetroBrazo: 29,
      perimetroMuslo: 54,
      perimetroPecho: 90,
      pliegueTriceps: 13,
      pliegueAbdominal: 11,
      pliegueMuslo: 17,
      porcentajeGrasa: 18.5,
      masaMagra: 46.6,
      frecuenciaCardiaca: 60,
      tensionSistolica: 108,
      tensionDiastolica: 68,
      notasMedicion: 'Estable en fiestas',
    },
    {
      fecha: '2026-01-07',
      peso: 57.5,
      altura: 162,
      imc: 21.91,
      perimetroCintura: 67,
      perimetroCadera: 95,
      perimetroBrazo: 29.5,
      perimetroMuslo: 55,
      perimetroPecho: 91,
      pliegueTriceps: 12,
      pliegueAbdominal: 10,
      pliegueMuslo: 16,
      porcentajeGrasa: 18,
      masaMagra: 47.2,
      frecuenciaCardiaca: 58,
      tensionSistolica: 105,
      tensionDiastolica: 68,
      notasMedicion: 'Aumento de masa muscular',
    },
    {
      fecha: '2026-01-14',
      peso: 57.8,
      altura: 162,
      imc: 22.03,
      perimetroCintura: 66,
      perimetroCadera: 95,
      perimetroBrazo: 30,
      perimetroMuslo: 55,
      perimetroPecho: 92,
      pliegueTriceps: 12,
      pliegueAbdominal: 10,
      pliegueMuslo: 16,
      porcentajeGrasa: 17.5,
      masaMagra: 47.7,
      frecuenciaCardiaca: 58,
      tensionSistolica: 105,
      tensionDiastolica: 68,
      notasMedicion: 'Excelente composición',
    },
    {
      fecha: '2026-01-28',
      peso: 58.0,
      altura: 162,
      imc: 22.1,
      perimetroCintura: 66,
      perimetroCadera: 95,
      perimetroBrazo: 30,
      perimetroMuslo: 56,
      perimetroPecho: 92,
      pliegueTriceps: 11,
      pliegueAbdominal: 10,
      pliegueMuslo: 15,
      porcentajeGrasa: 17,
      masaMagra: 48.1,
      frecuenciaCardiaca: 56,
      tensionSistolica: 102,
      tensionDiastolica: 66,
      notasMedicion: 'Muy buena evolución',
    },
    {
      fecha: '2026-02-18',
      peso: 58.5,
      altura: 162,
      imc: 22.29,
      perimetroCintura: 66,
      perimetroCadera: 95,
      perimetroBrazo: 30.5,
      perimetroMuslo: 56,
      perimetroPecho: 93,
      pliegueTriceps: 11,
      pliegueAbdominal: 9,
      pliegueMuslo: 15,
      porcentajeGrasa: 16.5,
      masaMagra: 48.9,
      frecuenciaCardiaca: 55,
      tensionSistolica: 100,
      tensionDiastolica: 65,
      notasMedicion: 'Atleta en formación',
    },
  ],
  'socio3@nutrifit.com': [
    // Diego - Evolución: lenta pero constante (caso difícil)
    {
      fecha: '2025-12-02',
      peso: 112.0,
      altura: 180,
      imc: 34.57,
      perimetroCintura: 118,
      perimetroCadera: 122,
      perimetroBrazo: 40,
      perimetroMuslo: 68,
      perimetroPecho: 120,
      pliegueTriceps: 28,
      pliegueAbdominal: 38,
      pliegueMuslo: 32,
      porcentajeGrasa: 35,
      masaMagra: 72.8,
      frecuenciaCardiaca: 88,
      tensionSistolica: 145,
      tensionDiastolica: 95,
      notasMedicion: 'Inicio - Obesidad grado II',
    },
    {
      fecha: '2025-12-09',
      peso: 111.5,
      altura: 180,
      imc: 34.41,
      perimetroCintura: 117,
      perimetroCadera: 121,
      perimetroBrazo: 40,
      perimetroMuslo: 67,
      perimetroPecho: 119,
      pliegueTriceps: 27,
      pliegueAbdominal: 37,
      pliegueMuslo: 31,
      porcentajeGrasa: 34.5,
      masaMagra: 73.0,
      frecuenciaCardiaca: 86,
      tensionSistolica: 142,
      tensionDiastolica: 92,
      notasMedicion: 'Cambio gradual',
    },
    {
      fecha: '2025-12-16',
      peso: 111.0,
      altura: 180,
      imc: 34.26,
      perimetroCintura: 116,
      perimetroCadera: 120,
      perimetroBrazo: 39,
      perimetroMuslo: 67,
      perimetroPecho: 118,
      pliegueTriceps: 27,
      pliegueAbdominal: 36,
      pliegueMuslo: 31,
      porcentajeGrasa: 34,
      masaMagra: 73.3,
      frecuenciaCardiaca: 85,
      tensionSistolica: 140,
      tensionDiastolica: 90,
      notasMedicion: 'Dificultades con la adherencia',
    },
    {
      fecha: '2025-12-23',
      peso: 110.5,
      altura: 180,
      imc: 34.1,
      perimetroCintura: 115,
      perimetroCadera: 119,
      perimetroBrazo: 39,
      perimetroMuslo: 66,
      perimetroPecho: 117,
      pliegueTriceps: 26,
      pliegueAbdominal: 35,
      pliegueMuslo: 30,
      porcentajeGrasa: 33.5,
      masaMagra: 73.5,
      frecuenciaCardiaca: 84,
      tensionSistolica: 138,
      tensionDiastolica: 88,
      notasMedicion: 'Mejora en presión arterial',
    },
    {
      fecha: '2026-01-06',
      peso: 109.5,
      altura: 180,
      imc: 33.8,
      perimetroCintura: 114,
      perimetroCadera: 118,
      perimetroBrazo: 39,
      perimetroMuslo: 66,
      perimetroPecho: 116,
      pliegueTriceps: 25,
      pliegueAbdominal: 34,
      pliegueMuslo: 29,
      porcentajeGrasa: 32.5,
      masaMagra: 73.9,
      frecuenciaCardiaca: 82,
      tensionSistolica: 135,
      tensionDiastolica: 86,
      notasMedicion: 'Reinicio motivado',
    },
    {
      fecha: '2026-01-13',
      peso: 108.5,
      altura: 180,
      imc: 33.49,
      perimetroCintura: 112,
      perimetroCadera: 117,
      perimetroBrazo: 38,
      perimetroMuslo: 65,
      perimetroPecho: 115,
      pliegueTriceps: 24,
      pliegueAbdominal: 33,
      pliegueMuslo: 28,
      porcentajeGrasa: 31.5,
      masaMagra: 74.3,
      frecuenciaCardiaca: 80,
      tensionSistolica: 132,
      tensionDiastolica: 85,
      notasMedicion: 'Buen progreso este mes',
    },
    {
      fecha: '2026-01-27',
      peso: 107.0,
      altura: 180,
      imc: 33.02,
      perimetroCintura: 110,
      perimetroCadera: 115,
      perimetroBrazo: 38,
      perimetroMuslo: 64,
      perimetroPecho: 114,
      pliegueTriceps: 23,
      pliegueAbdominal: 31,
      pliegueMuslo: 27,
      porcentajeGrasa: 30,
      masaMagra: 74.9,
      frecuenciaCardiaca: 78,
      tensionSistolica: 130,
      tensionDiastolica: 84,
      notasMedicion: 'Obesidad grado I ahora',
    },
    {
      fecha: '2026-02-17',
      peso: 105.5,
      altura: 180,
      imc: 32.56,
      perimetroCintura: 108,
      perimetroCadera: 114,
      perimetroBrazo: 37,
      perimetroMuslo: 63,
      perimetroPecho: 112,
      pliegueTriceps: 22,
      pliegueAbdominal: 29,
      pliegueMuslo: 26,
      porcentajeGrasa: 28.5,
      masaMagra: 75.4,
      frecuenciaCardiaca: 76,
      tensionSistolica: 128,
      tensionDiastolica: 82,
      notasMedicion: '6.5kg perdidos - sigue adelante',
    },
  ],
  'socio4@nutrifit.com': [
    // Ana - Evolución: estable, mejorando hábitos
    {
      fecha: '2025-12-04',
      peso: 51.0,
      altura: 165,
      imc: 18.73,
      perimetroCintura: 62,
      perimetroCadera: 88,
      perimetroBrazo: 25,
      perimetroMuslo: 48,
      perimetroPecho: 82,
      pliegueTriceps: 12,
      pliegueAbdominal: 10,
      pliegueMuslo: 15,
      porcentajeGrasa: 18,
      masaMagra: 41.8,
      frecuenciaCardiaca: 68,
      tensionSistolica: 100,
      tensionDiastolica: 65,
      notasMedicion: 'Peso bajo normal - mejorar hábitos',
    },
    {
      fecha: '2025-12-11',
      peso: 51.2,
      altura: 165,
      imc: 18.8,
      perimetroCintura: 62,
      perimetroCadera: 88,
      perimetroBrazo: 25,
      perimetroMuslo: 48,
      perimetroPecho: 82,
      pliegueTriceps: 12,
      pliegueAbdominal: 10,
      pliegueMuslo: 15,
      porcentajeGrasa: 18,
      masaMagra: 42.0,
      frecuenciaCardiaca: 68,
      tensionSistolica: 100,
      tensionDiastolica: 65,
      notasMedicion: 'Mejorando frecuencia de comidas',
    },
    {
      fecha: '2025-12-18',
      peso: 51.5,
      altura: 165,
      imc: 18.91,
      perimetroCintura: 62,
      perimetroCadera: 89,
      perimetroBrazo: 25.5,
      perimetroMuslo: 48,
      perimetroPecho: 83,
      pliegueTriceps: 12,
      pliegueAbdominal: 10,
      pliegueMuslo: 15,
      porcentajeGrasa: 18,
      masaMagra: 42.2,
      frecuenciaCardiaca: 67,
      tensionSistolica: 100,
      tensionDiastolica: 65,
      notasMedicion: 'Estable',
    },
    {
      fecha: '2025-12-26',
      peso: 51.8,
      altura: 165,
      imc: 19.02,
      perimetroCintura: 63,
      perimetroCadera: 89,
      perimetroBrazo: 25.5,
      perimetroMuslo: 49,
      perimetroPecho: 83,
      pliegueTriceps: 12,
      pliegueAbdominal: 10,
      pliegueMuslo: 15,
      porcentajeGrasa: 18,
      masaMagra: 42.5,
      frecuenciaCardiaca: 66,
      tensionSistolica: 100,
      tensionDiastolica: 64,
      notasMedicion: 'Leve aumento saludable',
    },
    {
      fecha: '2026-01-08',
      peso: 51.8,
      altura: 165,
      imc: 19.02,
      perimetroCintura: 63,
      perimetroCadera: 89,
      perimetroBrazo: 25.5,
      perimetroMuslo: 49,
      perimetroPecho: 83,
      pliegueTriceps: 11,
      pliegueAbdominal: 10,
      pliegueMuslo: 14,
      porcentajeGrasa: 17.5,
      masaMagra: 42.7,
      frecuenciaCardiaca: 66,
      tensionSistolica: 98,
      tensionDiastolica: 64,
      notasMedicion: 'Mejor hierro - más energía',
    },
    {
      fecha: '2026-01-15',
      peso: 52.0,
      altura: 165,
      imc: 19.1,
      perimetroCintura: 63,
      perimetroCadera: 89,
      perimetroBrazo: 26,
      perimetroMuslo: 49,
      perimetroPecho: 84,
      pliegueTriceps: 11,
      pliegueAbdominal: 9,
      pliegueMuslo: 14,
      porcentajeGrasa: 17,
      masaMagra: 43.2,
      frecuenciaCardiaca: 65,
      tensionSistolica: 98,
      tensionDiastolica: 62,
      notasMedicion: 'Normalizando anemia',
    },
    {
      fecha: '2026-01-29',
      peso: 52.2,
      altura: 165,
      imc: 19.17,
      perimetroCintura: 63,
      perimetroCadera: 90,
      perimetroBrazo: 26,
      perimetroMuslo: 49,
      perimetroPecho: 84,
      pliegueTriceps: 11,
      pliegueAbdominal: 9,
      pliegueMuslo: 14,
      porcentajeGrasa: 17,
      masaMagra: 43.3,
      frecuenciaCardiaca: 64,
      tensionSistolica: 98,
      tensionDiastolica: 62,
      notasMedicion: 'Estable y saludable',
    },
    {
      fecha: '2026-02-19',
      peso: 52.0,
      altura: 165,
      imc: 19.1,
      perimetroCintura: 62,
      perimetroCadera: 90,
      perimetroBrazo: 26,
      perimetroMuslo: 50,
      perimetroPecho: 84,
      pliegueTriceps: 10,
      pliegueAbdominal: 9,
      pliegueMuslo: 14,
      porcentajeGrasa: 16.5,
      masaMagra: 43.4,
      frecuenciaCardiaca: 62,
      tensionSistolica: 95,
      tensionDiastolica: 60,
      notasMedicion: 'Excelente estado general',
    },
  ],
  'socio5@nutrifit.com': [
    // Carlos - Evolución: bajó colesterol, perdió peso
    {
      fecha: '2025-12-05',
      peso: 97.0,
      altura: 172,
      imc: 32.79,
      perimetroCintura: 108,
      perimetroCadera: 112,
      perimetroBrazo: 38,
      perimetroMuslo: 62,
      perimetroPecho: 112,
      pliegueTriceps: 24,
      pliegueAbdominal: 32,
      pliegueMuslo: 26,
      porcentajeGrasa: 30,
      masaMagra: 67.9,
      frecuenciaCardiaca: 80,
      tensionSistolica: 138,
      tensionDiastolica: 88,
      notasMedicion: 'Inicio - Obesidad grado I',
    },
    {
      fecha: '2025-12-12',
      peso: 96.0,
      altura: 172,
      imc: 32.45,
      perimetroCintura: 106,
      perimetroCadera: 111,
      perimetroBrazo: 38,
      perimetroMuslo: 61,
      perimetroPecho: 111,
      pliegueTriceps: 23,
      pliegueAbdominal: 31,
      pliegueMuslo: 25,
      porcentajeGrasa: 29,
      masaMagra: 68.2,
      frecuenciaCardiaca: 78,
      tensionSistolica: 135,
      tensionDiastolica: 86,
      notasMedicion: 'Dieta baja en grasas',
    },
    {
      fecha: '2025-12-19',
      peso: 95.0,
      altura: 172,
      imc: 32.11,
      perimetroCintura: 105,
      perimetroCadera: 110,
      perimetroBrazo: 37,
      perimetroMuslo: 61,
      perimetroPecho: 110,
      pliegueTriceps: 22,
      pliegueAbdominal: 30,
      pliegueMuslo: 24,
      porcentajeGrasa: 28,
      masaMagra: 68.4,
      frecuenciaCardiaca: 76,
      tensionSistolica: 132,
      tensionDiastolica: 85,
      notasMedicion: 'Buen progreso',
    },
    {
      fecha: '2025-12-26',
      peso: 94.5,
      altura: 172,
      imc: 31.94,
      perimetroCintura: 104,
      perimetroCadera: 109,
      perimetroBrazo: 37,
      perimetroMuslo: 60,
      perimetroPecho: 109,
      pliegueTriceps: 22,
      pliegueAbdominal: 29,
      pliegueMuslo: 24,
      porcentajeGrasa: 27.5,
      masaMagra: 68.5,
      frecuenciaCardiaca: 75,
      tensionSistolica: 130,
      tensionDiastolica: 84,
      notasMedicion: 'Control en fiestas',
    },
    {
      fecha: '2026-01-09',
      peso: 93.5,
      altura: 172,
      imc: 31.6,
      perimetroCintura: 102,
      perimetroCadera: 108,
      perimetroBrazo: 36,
      perimetroMuslo: 60,
      perimetroPecho: 108,
      pliegueTriceps: 21,
      pliegueAbdominal: 28,
      pliegueMuslo: 23,
      porcentajeGrasa: 26.5,
      masaMagra: 68.7,
      frecuenciaCardiaca: 74,
      tensionSistolica: 128,
      tensionDiastolica: 82,
      notasMedicion: 'Mejora colesterol',
    },
    {
      fecha: '2026-01-16',
      peso: 92.5,
      altura: 172,
      imc: 31.27,
      perimetroCintura: 100,
      perimetroCadera: 107,
      perimetroBrazo: 36,
      perimetroMuslo: 59,
      perimetroPecho: 107,
      pliegueTriceps: 20,
      pliegueAbdominal: 27,
      pliegueMuslo: 22,
      porcentajeGrasa: 25.5,
      masaMagra: 68.9,
      frecuenciaCardiaca: 72,
      tensionSistolica: 125,
      tensionDiastolica: 80,
      notasMedicion: 'Excelente adherencia',
    },
    {
      fecha: '2026-01-30',
      peso: 91.0,
      altura: 172,
      imc: 30.76,
      perimetroCintura: 98,
      perimetroCadera: 105,
      perimetroBrazo: 35,
      perimetroMuslo: 58,
      perimetroPecho: 106,
      pliegueTriceps: 19,
      pliegueAbdominal: 25,
      pliegueMuslo: 21,
      porcentajeGrasa: 24,
      masaMagra: 69.2,
      frecuenciaCardiaca: 70,
      tensionSistolica: 122,
      tensionDiastolica: 78,
      notasMedicion: 'Casi sale de obesidad',
    },
    {
      fecha: '2026-02-20',
      peso: 89.5,
      altura: 172,
      imc: 30.25,
      perimetroCintura: 96,
      perimetroCadera: 104,
      perimetroBrazo: 35,
      perimetroMuslo: 57,
      perimetroPecho: 104,
      pliegueTriceps: 18,
      pliegueAbdominal: 24,
      pliegueMuslo: 20,
      porcentajeGrasa: 23,
      masaMagra: 68.9,
      frecuenciaCardiaca: 68,
      tensionSistolica: 120,
      tensionDiastolica: 76,
      notasMedicion: 'Colesterol normal - gran logro',
    },
  ],
};

const AGENDA_POR_NUTRICIONISTA: Record<string, AgendaData[]> = {
  'nutri@nutrifit.com': [
    { dia: 'Lunes', horaInicio: '09:00', horaFin: '13:00', duracionTurno: 30 },
    { dia: 'Lunes', horaInicio: '16:00', horaFin: '20:00', duracionTurno: 30 },
    {
      dia: 'Miércoles',
      horaInicio: '09:00',
      horaFin: '13:00',
      duracionTurno: 30,
    },
    {
      dia: 'Miércoles',
      horaInicio: '16:00',
      horaFin: '20:00',
      duracionTurno: 30,
    },
    {
      dia: 'Viernes',
      horaInicio: '09:00',
      horaFin: '14:00',
      duracionTurno: 30,
    },
  ],
  'nutri2@nutrifit.com': [
    { dia: 'Martes', horaInicio: '08:00', horaFin: '12:00', duracionTurno: 30 },
    { dia: 'Martes', horaInicio: '15:00', horaFin: '19:00', duracionTurno: 30 },
    { dia: 'Jueves', horaInicio: '08:00', horaFin: '12:00', duracionTurno: 30 },
    { dia: 'Jueves', horaInicio: '15:00', horaFin: '19:00', duracionTurno: 30 },
    { dia: 'Sábado', horaInicio: '09:00', horaFin: '12:00', duracionTurno: 30 },
  ],
  'nutri3@nutrifit.com': [
    { dia: 'Lunes', horaInicio: '14:00', horaFin: '18:00', duracionTurno: 30 },
    { dia: 'Martes', horaInicio: '14:00', horaFin: '18:00', duracionTurno: 30 },
    {
      dia: 'Miércoles',
      horaInicio: '14:00',
      horaFin: '18:00',
      duracionTurno: 30,
    },
    { dia: 'Jueves', horaInicio: '14:00', horaFin: '18:00', duracionTurno: 30 },
  ],
};

// Turnos para los próximos 7 días y algunos históricos
const TURNOS: TurnoData[] = [
  // Turnos históricos (ya realizados o ausentes)
  {
    fecha: '2025-12-01',
    hora: '09:00',
    estado: 'REALIZADO',
    socioEmail: 'socio@nutrifit.com',
    nutricionistaEmail: 'nutri@nutrifit.com',
  },
  {
    fecha: '2025-12-03',
    hora: '10:00',
    estado: 'REALIZADO',
    socioEmail: 'socio2@nutrifit.com',
    nutricionistaEmail: 'nutri2@nutrifit.com',
  },
  {
    fecha: '2025-12-05',
    hora: '16:00',
    estado: 'REALIZADO',
    socioEmail: 'socio5@nutrifit.com',
    nutricionistaEmail: 'nutri@nutrifit.com',
  },
  {
    fecha: '2026-01-15',
    hora: '09:30',
    estado: 'AUSENTE',
    socioEmail: 'socio3@nutrifit.com',
    nutricionistaEmail: 'nutri@nutrifit.com',
  },
  {
    fecha: '2026-02-10',
    hora: '10:00',
    estado: 'REALIZADO',
    socioEmail: 'socio4@nutrifit.com',
    nutricionistaEmail: 'nutri3@nutrifit.com',
  },
  {
    fecha: '2026-02-12',
    hora: '16:30',
    estado: 'CANCELADO',
    socioEmail: 'socio2@nutrifit.com',
    nutricionistaEmail: 'nutri@nutrifit.com',
  },

  // Turnos de hoy (20/02/2026)
  {
    fecha: '2026-02-20',
    hora: '09:00',
    estado: 'PENDIENTE',
    socioEmail: 'socio@nutrifit.com',
    nutricionistaEmail: 'nutri@nutrifit.com',
  },
  {
    fecha: '2026-02-20',
    hora: '10:00',
    estado: 'CONFIRMADO',
    socioEmail: 'socio3@nutrifit.com',
    nutricionistaEmail: 'nutri@nutrifit.com',
  },
  {
    fecha: '2026-02-20',
    hora: '11:30',
    estado: 'CONFIRMADO',
    socioEmail: 'socio4@nutrifit.com',
    nutricionistaEmail: 'nutri2@nutrifit.com',
  },
  {
    fecha: '2026-02-20',
    hora: '16:00',
    estado: 'PENDIENTE',
    socioEmail: 'socio5@nutrifit.com',
    nutricionistaEmail: 'nutri@nutrifit.com',
  },
  {
    fecha: '2026-02-20',
    hora: '17:30',
    estado: 'CONFIRMADO',
    socioEmail: 'socio2@nutrifit.com',
    nutricionistaEmail: 'nutri2@nutrifit.com',
  },

  // Turnos de mañana y días siguientes
  {
    fecha: '2026-02-21',
    hora: '09:30',
    estado: 'CONFIRMADO',
    socioEmail: 'socio@nutrifit.com',
    nutricionistaEmail: 'nutri@nutrifit.com',
  },
  {
    fecha: '2026-02-21',
    hora: '10:00',
    estado: 'PENDIENTE',
    socioEmail: 'socio5@nutrifit.com',
    nutricionistaEmail: 'nutri3@nutrifit.com',
  },
  {
    fecha: '2026-02-21',
    hora: '15:00',
    estado: 'PENDIENTE',
    socioEmail: 'socio3@nutrifit.com',
    nutricionistaEmail: 'nutri2@nutrifit.com',
  },
  {
    fecha: '2026-02-24',
    hora: '09:00',
    estado: 'PENDIENTE',
    socioEmail: 'socio2@nutrifit.com',
    nutricionistaEmail: 'nutri@nutrifit.com',
  },
  {
    fecha: '2026-02-24',
    hora: '11:00',
    estado: 'PENDIENTE',
    socioEmail: 'socio4@nutrifit.com',
    nutricionistaEmail: 'nutri@nutrifit.com',
  },
  {
    fecha: '2026-02-25',
    hora: '16:00',
    estado: 'PENDIENTE',
    socioEmail: 'socio@nutrifit.com',
    nutricionistaEmail: 'nutri2@nutrifit.com',
  },
  {
    fecha: '2026-02-26',
    hora: '09:30',
    estado: 'PENDIENTE',
    socioEmail: 'socio5@nutrifit.com',
    nutricionistaEmail: 'nutri@nutrifit.com',
  },
  {
    fecha: '2026-02-26',
    hora: '10:30',
    estado: 'PENDIENTE',
    socioEmail: 'socio3@nutrifit.com',
    nutricionistaEmail: 'nutri@nutrifit.com',
  },
];

const PLANES_ALIMENTACION: PlanAlimentacionData[] = [
  {
    objetivoNutricional: 'Pérdida de peso gradual con mejoría metabólica',
    socioEmail: 'socio@nutrifit.com',
    nutricionistaEmail: 'nutri@nutrifit.com',
    dias: [
      {
        dia: 'Lunes',
        orden: 1,
        comidas: [
          {
            tipoComida: 'DESAYUNO',
            comentarios: 'Incluir proteína en cada desayuno',
            alimentos: [
              'Huevo revuelto',
              'Tostadas integrales',
              'Fruta fresca',
            ],
          },
          {
            tipoComida: 'ALMUERZO',
            comentarios: null,
            alimentos: [
              'Pechuga de pollo grillada',
              'Arroz integral',
              'Ensalada mixta',
              'Aceite de oliva',
            ],
          },
          {
            tipoComida: 'MERIENDA',
            comentarios: 'Aumentar ingesta de lácteos',
            alimentos: ['Yogur descremado', 'Frutos secos (5 unidades)'],
          },
          {
            tipoComida: 'CENA',
            comentarios: 'Cena ligera',
            alimentos: ['Pescado al horno', 'Vegetales al vapor', 'Quinoa'],
          },
        ],
      },
      {
        dia: 'Martes',
        orden: 2,
        comidas: [
          {
            tipoComida: 'DESAYUNO',
            comentarios: null,
            alimentos: ['Avena con leche descremada', 'Banana', 'Miel'],
          },
          {
            tipoComida: 'ALMUERZO',
            comentarios: null,
            alimentos: [
              'Carne magra',
              'Puré de calabaza',
              'Zanahorias glaseadas',
            ],
          },
          {
            tipoComida: 'MERIENDA',
            comentarios: null,
            alimentos: ['Queso fresco', 'Tostadas de centeno', 'Tomate'],
          },
          {
            tipoComida: 'CENA',
            comentarios: null,
            alimentos: ['Omelette de espinaca', 'Ensalada verde'],
          },
        ],
      },
      {
        dia: 'Miércoles',
        orden: 3,
        comidas: [
          {
            tipoComida: 'DESAYUNO',
            comentarios: null,
            alimentos: [
              'Licuado de frutas',
              'Granola sin azúcar',
              'Leche descremada',
            ],
          },
          {
            tipoComida: 'ALMUERZO',
            comentarios: 'Día de legumbres',
            alimentos: [
              'Lentejas guisadas',
              'Arroz integral',
              'Ensalada de tomate',
            ],
          },
          {
            tipoComida: 'MERIENDA',
            comentarios: null,
            alimentos: ['Yogur griego', 'Semillas de chía'],
          },
          {
            tipoComida: 'CENA',
            comentarios: null,
            alimentos: ['Pollo al limón', 'Brocolí al vapor', 'Papa hervida'],
          },
        ],
      },
      {
        dia: 'Jueves',
        orden: 4,
        comidas: [
          {
            tipoComida: 'DESAYUNO',
            comentarios: null,
            alimentos: ['Tostadas francesas integrales', 'Frutas del bosque'],
          },
          {
            tipoComida: 'ALMUERZO',
            comentarios: null,
            alimentos: [
              'Merluza al horno',
              'Puré de papas',
              'Ensalada de zanahoria',
            ],
          },
          {
            tipoComida: 'MERIENDA',
            comentarios: null,
            alimentos: ['Batido de proteínas vegetales', 'Almendras'],
          },
          {
            tipoComida: 'CENA',
            comentarios: null,
            alimentos: ['Wrap integral de pollo', 'Vegetales crudos'],
          },
        ],
      },
      {
        dia: 'Viernes',
        orden: 5,
        comidas: [
          {
            tipoComida: 'DESAYUNO',
            comentarios: null,
            alimentos: ['Huevos pochados', 'Palta', 'Pan de molde integral'],
          },
          {
            tipoComida: 'ALMUERZO',
            comentarios: null,
            alimentos: [
              'Bowl de quinoa',
              'Pollo desmenuzado',
              'Vegetales asados',
            ],
          },
          {
            tipoComida: 'MERIENDA',
            comentarios: 'Para los antojos dulces',
            alimentos: ['Chocolate amargo (2 cuadraditos)', 'Nueces'],
          },
          {
            tipoComida: 'CENA',
            comentarios: 'Cena de viernes',
            alimentos: ['Pizza casera integral', 'Ensalada grande'],
          },
        ],
      },
      {
        dia: 'Sábado',
        orden: 6,
        comidas: [
          {
            tipoComida: 'DESAYUNO',
            comentarios: 'Desayuno de fin de semana',
            alimentos: ['Pancakes de avena', 'Miel', 'Frutas'],
          },
          {
            tipoComida: 'ALMUERZO',
            comentarios: null,
            alimentos: [
              'Asado de tira (porción moderada)',
              'Ensalada mixta',
              'Papas al horno',
            ],
          },
          {
            tipoComida: 'MERIENDA',
            comentarios: null,
            alimentos: ['Helado de agua', 'Fruta fresca'],
          },
          {
            tipoComida: 'CENA',
            comentarios: null,
            alimentos: ['Ensalada César con pollo', 'Pan de ajo integral'],
          },
        ],
      },
      {
        dia: 'Domingo',
        orden: 7,
        comidas: [
          {
            tipoComida: 'DESAYUNO',
            comentarios: null,
            alimentos: ['Mediterráneo: queso, aceitunas, tomate, pan'],
          },
          {
            tipoComida: 'ALMUERZO',
            comentarios: 'Almuerzo familiar',
            alimentos: [
              'Pasta integral',
              'Salsa boloñesa ligera',
              'Ensalada verde',
            ],
          },
          {
            tipoComida: 'MERIENDA',
            comentarios: null,
            alimentos: ['Té con tostadas', 'Mermelada sin azúcar'],
          },
          {
            tipoComida: 'CENA',
            comentarios: 'Preparar semana',
            alimentos: ['Sopa de verduras', 'Pollo desmenuzado'],
          },
          {
            tipoComida: 'COLACION',
            comentarios: 'Opcional si hay hambre',
            alimentos: ['Yogur natural', 'Fruta'],
          },
        ],
      },
    ],
  },
  {
    objetivoNutricional: 'Ganancia de masa muscular con entrenamiento',
    socioEmail: 'socio2@nutrifit.com',
    nutricionistaEmail: 'nutri2@nutrifit.com',
    dias: [
      {
        dia: 'Lunes',
        orden: 1,
        comidas: [
          {
            tipoComida: 'DESAYUNO',
            comentarios: 'Alto en proteínas',
            alimentos: [
              '4 claras de huevo',
              '2 huevos enteros',
              'Avena',
              'Banana',
            ],
          },
          {
            tipoComida: 'COLACION',
            comentarios: 'Pre-entreno',
            alimentos: ['Batido de proteínas', 'Tostada con miel'],
          },
          {
            tipoComida: 'ALMUERZO',
            comentarios: null,
            alimentos: ['200g pechuga de pollo', 'Arroz blanco', 'Vegetales'],
          },
          {
            tipoComida: 'MERIENDA',
            comentarios: 'Post-entreno',
            alimentos: ['Batido de proteínas', 'Creatina 5g', 'Fruta'],
          },
          {
            tipoComida: 'CENA',
            comentarios: null,
            alimentos: ['Salmón', 'Papa dulce', 'Espárragos'],
          },
        ],
      },
      {
        dia: 'Martes',
        orden: 2,
        comidas: [
          {
            tipoComida: 'DESAYUNO',
            comentarios: null,
            alimentos: ['Tostadas francesas proteicas', 'Miel', 'Frutos rojos'],
          },
          {
            tipoComida: 'COLACION',
            comentarios: null,
            alimentos: ['Yogur griego', 'Granola'],
          },
          {
            tipoComida: 'ALMUERZO',
            comentarios: null,
            alimentos: [
              'Carne magra 200g',
              'Pasta integral',
              'Salsa de tomate',
            ],
          },
          {
            tipoComida: 'MERIENDA',
            comentarios: null,
            alimentos: ['Batido de proteínas', 'Avena'],
          },
          {
            tipoComida: 'CENA',
            comentarios: null,
            alimentos: ['Atún fresco', 'Quinoa', 'Ensalada verde'],
          },
        ],
      },
    ],
  },
];

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

const obtenerInsertId = (resultado: unknown): number | null => {
  if (typeof resultado !== 'object' || resultado === null) return null;
  const registro = resultado as Record<string, unknown>;
  return typeof registro.insertId === 'number' ? registro.insertId : null;
};

const parsearNumero = (valor: unknown): number | null => {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  if (typeof valor === 'string' && valor.trim() !== '') {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  }
  return null;
};

const obtenerPrimeraFila = (
  resultado: unknown,
): Record<string, unknown> | null => {
  if (!Array.isArray(resultado) || resultado.length === 0) return null;
  const fila = (resultado as unknown[])[0];
  return typeof fila === 'object' && fila !== null
    ? (fila as Record<string, unknown>)
    : null;
};

const generarImagenAvatar = (
  nombre: string,
  apellido: string,
  genero: Genero,
): Buffer => {
  const iniciales = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  const colores: Record<string, string> = {
    MASCULINO: '#3B82F6',
    FEMENINO: '#EC4899',
    OTRO: '#8B5CF6',
  };
  const colorFondo = colores[genero] || colores.OTRO;
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="${colorFondo}"/>
      <text x="100" y="100" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${iniciales}</text>
    </svg>
  `;
  return Buffer.from(svg);
};

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function runSeed() {
  console.log('🚀 Iniciando seed completo de NutriFit Supervisor...\n');

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
  const contraseniaHash = await bcrypt.hash('123456', 10);

  // Mapas para almacenar IDs
  const personaIds: Record<string, number> = {};
  const usuarioIds: Record<string, number> = {};
  const fichaSaludIds: Record<string, number> = {};
  const patologiaIds: Record<string, number> = {};
  const alergiaIds: Record<string, number> = {};

  try {
    await dataSource.initialize();
    console.log('✅ Conexión a base de datos establecida\n');

    // Inicializar MinIO
    const minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: Number(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    });
    const bucketName = process.env.MINIO_BUCKET_NAME || 'nutrifit-fotos-perfil';
    const bucketExiste = await minioClient.bucketExists(bucketName);
    if (!bucketExiste) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`📦 Bucket '${bucketName}' creado\n`);
    }

    // =========================================================================
    // 1. CREAR GRUPOS Y ACCIONES DE PERMISOS
    // =========================================================================
    console.log('📝 Configurando permisos...');

    await dataSource.query(
      `INSERT INTO grupo_permiso (clave, nombre, descripcion)
       SELECT 'PROFESIONAL', 'Profesional', 'Grupo de permisos para nutricionistas'
       WHERE NOT EXISTS (SELECT 1 FROM grupo_permiso WHERE clave = 'PROFESIONAL')`,
    );
    await dataSource.query(
      `INSERT INTO grupo_permiso (clave, nombre, descripcion)
       SELECT 'ADMIN', 'Administrador', 'Grupo de permisos para administradores'
       WHERE NOT EXISTS (SELECT 1 FROM grupo_permiso WHERE clave = 'ADMIN')`,
    );

    for (const accion of [...ACCIONES_PROFESIONAL, ...ACCIONES_ADMIN]) {
      await dataSource.query(
        `INSERT INTO accion (clave, nombre, descripcion)
         SELECT ?, ?, ?
         WHERE NOT EXISTS (SELECT 1 FROM accion WHERE clave = ?)`,
        [accion.clave, accion.nombre, accion.descripcion, accion.clave],
      );
    }

    for (const accion of ACCIONES_PROFESIONAL) {
      await dataSource.query(
        `INSERT IGNORE INTO grupo_permiso_accion (id_grupo_permiso, id_accion)
         SELECT gp.id_grupo_permiso, a.id_accion
         FROM grupo_permiso gp INNER JOIN accion a ON a.clave = ?
         WHERE gp.clave = 'PROFESIONAL'`,
        [accion.clave],
      );
    }
    for (const accion of ACCIONES_ADMIN) {
      await dataSource.query(
        `INSERT IGNORE INTO grupo_permiso_accion (id_grupo_permiso, id_accion)
         SELECT gp.id_grupo_permiso, a.id_accion
         FROM grupo_permiso gp INNER JOIN accion a ON a.clave = ?
         WHERE gp.clave = 'ADMIN'`,
        [accion.clave],
      );
    }
    console.log('   ✅ Permisos configurados\n');

    // =========================================================================
    // 2. CREAR PATOLOGÍAS Y ALERGIAS
    // =========================================================================
    console.log('📝 Creando patologías y alergias...');

    for (const patologia of PATOLOGIAS) {
      const result = await dataSource.query(
        `INSERT INTO patologia (nombre) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM patologia WHERE nombre = ?)`,
        [patologia.nombre, patologia.nombre],
      );
      const existing = await dataSource.query(
        `SELECT id_patologia FROM patologia WHERE nombre = ?`,
        [patologia.nombre],
      );
      const fila = obtenerPrimeraFila(existing);
      if (fila) {
        patologiaIds[patologia.nombre] = parsearNumero(fila.id_patologia) ?? 0;
      }
    }

    for (const alergia of ALERGIAS) {
      const result = await dataSource.query(
        `INSERT INTO alergia (nombre) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM alergia WHERE nombre = ?)`,
        [alergia.nombre, alergia.nombre],
      );
      const existing = await dataSource.query(
        `SELECT id_alergia FROM alergia WHERE nombre = ?`,
        [alergia.nombre],
      );
      const fila = obtenerPrimeraFila(existing);
      if (fila) {
        alergiaIds[alergia.nombre] = parsearNumero(fila.id_alergia) ?? 0;
      }
    }
    console.log(
      `   ✅ ${PATOLOGIAS.length} patologías y ${ALERGIAS.length} alergias\n`,
    );

    // =========================================================================
    // 3. CREAR PERSONAS Y USUARIOS
    // =========================================================================
    console.log('📝 Creando usuarios y personas...');

    const vincularUsuarioAGrupo = async (
      idUsuario: number,
      claveGrupo: 'ADMIN' | 'PROFESIONAL',
    ) => {
      await dataSource.query(
        `INSERT IGNORE INTO usuario_grupo_permiso (id_usuario, id_grupo_permiso)
         SELECT ?, gp.id_grupo_permiso FROM grupo_permiso gp WHERE gp.clave = ?`,
        [idUsuario, claveGrupo],
      );
    };

    // Crear Admins
    for (const admin of ADMINS) {
      const existente = await dataSource.query(
        'SELECT id_usuario, id_persona FROM usuario WHERE email = ?',
        [admin.email],
      );
      const fila = obtenerPrimeraFila(existente[0]);
      let idPersona: number;
      let idUsuario: number;

      if (fila?.id_persona) {
        idPersona = parsearNumero(fila.id_persona) ?? 0;
        await dataSource.query(
          `UPDATE persona SET nombre = ?, apellido = ?, fecha_nacimiento = ?, genero = ?,
           telefono = ?, direccion = ?, ciudad = ?, provincia = ?, dni = ?, tipo_persona = 'AsistenteOrmEntity'
           WHERE id_persona = ?`,
          [
            admin.nombre,
            admin.apellido,
            admin.fechaNacimiento,
            admin.genero,
            admin.telefono,
            admin.direccion,
            admin.ciudad,
            admin.provincia,
            admin.dni,
            idPersona,
          ],
        );
        idUsuario = parsearNumero(fila.id_usuario) ?? 0;
      } else {
        const resultPersona = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, dni, tipo_persona)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AsistenteOrmEntity')`,
          [
            admin.nombre,
            admin.apellido,
            admin.fechaNacimiento,
            admin.genero,
            admin.telefono,
            admin.direccion,
            admin.ciudad,
            admin.provincia,
            admin.dni,
          ],
        );
        idPersona = obtenerInsertId(resultPersona) ?? 0;

        const resultUsuario = await dataSource.query(
          `INSERT INTO usuario (email, contrasenia, rol, id_persona) VALUES (?, ?, 'ADMIN', ?)`,
          [admin.email, contraseniaHash, idPersona],
        );
        idUsuario = obtenerInsertId(resultUsuario) ?? 0;
      }

      await dataSource.query(
        `UPDATE usuario SET rol = 'ADMIN' WHERE id_usuario = ?`,
        [idUsuario],
      );
      await vincularUsuarioAGrupo(idUsuario, 'ADMIN');
      personaIds[admin.email] = idPersona;
      usuarioIds[admin.email] = idUsuario;
    }
    console.log(`   ✅ ${ADMINS.length} administradores\n`);

    // Crear Nutricionistas
    for (const nutri of NUTRICIONISTAS) {
      const existente = await dataSource.query(
        'SELECT id_usuario, id_persona FROM usuario WHERE email = ?',
        [nutri.email],
      );
      const fila = obtenerPrimeraFila(existente[0]);
      let idPersona: number;
      let idUsuario: number;

      if (fila?.id_persona) {
        idPersona = parsearNumero(fila.id_persona) ?? 0;
        await dataSource.query(
          `UPDATE persona SET nombre = ?, apellido = ?, fecha_nacimiento = ?, genero = ?,
           telefono = ?, direccion = ?, ciudad = ?, provincia = ?, dni = ?,
           matricula = ?, anios_experiencia = ?, tarifa_sesion = ?, foto_perfil_key = ?, tipo_persona = 'NutricionistaOrmEntity'
           WHERE id_persona = ?`,
          [
            nutri.nombre,
            nutri.apellido,
            nutri.fechaNacimiento,
            nutri.genero,
            nutri.telefono,
            nutri.direccion,
            nutri.ciudad,
            nutri.provincia,
            nutri.dni,
            nutri.matricula,
            nutri.aniosExperiencia,
            nutri.tarifaSesion,
            nutri.fotoPerfilKey,
            idPersona,
          ],
        );
        idUsuario = parsearNumero(fila.id_usuario) ?? 0;
      } else {
        const resultPersona = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, dni,
           matricula, anios_experiencia, tarifa_sesion, foto_perfil_key, tipo_persona)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NutricionistaOrmEntity')`,
          [
            nutri.nombre,
            nutri.apellido,
            nutri.fechaNacimiento,
            nutri.genero,
            nutri.telefono,
            nutri.direccion,
            nutri.ciudad,
            nutri.provincia,
            nutri.dni,
            nutri.matricula,
            nutri.aniosExperiencia,
            nutri.tarifaSesion,
            nutri.fotoPerfilKey,
          ],
        );
        idPersona = obtenerInsertId(resultPersona) ?? 0;

        const resultUsuario = await dataSource.query(
          `INSERT INTO usuario (email, contrasenia, rol, id_persona) VALUES (?, ?, 'NUTRICIONISTA', ?)`,
          [nutri.email, contraseniaHash, idPersona],
        );
        idUsuario = obtenerInsertId(resultUsuario) ?? 0;

        // Subir imagen de perfil
        const imagenBuffer = generarImagenAvatar(
          nutri.nombre,
          nutri.apellido,
          nutri.genero,
        );
        await minioClient.putObject(
          bucketName,
          nutri.fotoPerfilKey,
          imagenBuffer,
          imagenBuffer.length,
          { 'Content-Type': 'image/svg+xml' },
        );
      }

      await dataSource.query(
        `UPDATE usuario SET rol = 'NUTRICIONISTA' WHERE id_usuario = ?`,
        [idUsuario],
      );
      await vincularUsuarioAGrupo(idUsuario, 'PROFESIONAL');
      personaIds[nutri.email] = idPersona;
      usuarioIds[nutri.email] = idUsuario;
    }
    console.log(`   ✅ ${NUTRICIONISTAS.length} nutricionistas\n`);

    // Crear Socios
    for (const socio of SOCIOS) {
      const existente = await dataSource.query(
        'SELECT id_usuario, id_persona FROM usuario WHERE email = ?',
        [socio.email],
      );
      const fila = obtenerPrimeraFila(existente[0]);
      let idPersona: number;
      let idUsuario: number;

      if (fila?.id_persona) {
        idPersona = parsearNumero(fila.id_persona) ?? 0;
        await dataSource.query(
          `UPDATE persona SET nombre = ?, apellido = ?, fecha_nacimiento = ?, genero = ?,
           telefono = ?, direccion = ?, ciudad = ?, provincia = ?, dni = ?,
           fecha_alta = ?, foto_perfil_key = ?, tipo_persona = 'SocioOrmEntity'
           WHERE id_persona = ?`,
          [
            socio.nombre,
            socio.apellido,
            socio.fechaNacimiento,
            socio.genero,
            socio.telefono,
            socio.direccion,
            socio.ciudad,
            socio.provincia,
            socio.dni,
            socio.fechaAlta,
            socio.fotoPerfilKey,
            idPersona,
          ],
        );
        idUsuario = parsearNumero(fila.id_usuario) ?? 0;
      } else {
        const resultPersona = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, dni,
           fecha_alta, foto_perfil_key, tipo_persona)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SocioOrmEntity')`,
          [
            socio.nombre,
            socio.apellido,
            socio.fechaNacimiento,
            socio.genero,
            socio.telefono,
            socio.direccion,
            socio.ciudad,
            socio.provincia,
            socio.dni,
            socio.fechaAlta,
            socio.fotoPerfilKey,
          ],
        );
        idPersona = obtenerInsertId(resultPersona) ?? 0;

        const resultUsuario = await dataSource.query(
          `INSERT INTO usuario (email, contrasenia, rol, id_persona) VALUES (?, ?, 'SOCIO', ?)`,
          [socio.email, contraseniaHash, idPersona],
        );
        idUsuario = obtenerInsertId(resultUsuario) ?? 0;

        // Subir imagen de perfil
        const imagenBuffer = generarImagenAvatar(
          socio.nombre,
          socio.apellido,
          socio.genero,
        );
        await minioClient.putObject(
          bucketName,
          socio.fotoPerfilKey,
          imagenBuffer,
          imagenBuffer.length,
          { 'Content-Type': 'image/svg+xml' },
        );
      }

      await dataSource.query(
        `UPDATE usuario SET rol = 'SOCIO' WHERE id_usuario = ?`,
        [idUsuario],
      );
      personaIds[socio.email] = idPersona;
      usuarioIds[socio.email] = idUsuario;
    }
    console.log(`   ✅ ${SOCIOS.length} socios\n`);

    // =========================================================================
    // 4. CREAR FICHAS DE SALUD
    // =========================================================================
    console.log('📝 Creando fichas de salud...');

    for (const [email, ficha] of Object.entries(FICHAS_SALUD)) {
      const idPersona = personaIds[email];
      if (!idPersona) continue;

      // Verificar si ya existe ficha
      const existente = await dataSource.query(
        'SELECT id_ficha_salud FROM ficha_salud WHERE id_persona = (SELECT id_persona FROM persona WHERE id_persona = ?)',
        [idPersona],
      );

      let idFichaSalud: number;
      const fila = obtenerPrimeraFila(
        Array.isArray(existente[0]) ? existente[0] : existente,
      );

      if (fila?.id_ficha_salud) {
        idFichaSalud = parsearNumero(fila.id_ficha_salud) ?? 0;
        await dataSource.query(
          `UPDATE ficha_salud SET altura = ?, peso = ?, objetivo_personal = ?, nivel_actividad_fisica = ?,
           medicacion_actual = ?, suplementos_actuales = ?, cirugias_previas = ?, antecedentes_familiares = ?,
           frecuencia_comidas = ?, consumo_agua_diario = ?, restricciones_alimentarias = ?, consumo_alcohol = ?,
           fuma_tabaco = ?, horas_sueno = ?, contacto_emergencia_nombre = ?, contacto_emergencia_telefono = ?
           WHERE id_ficha_salud = ?`,
          [
            ficha.altura,
            ficha.peso,
            ficha.objetivoPersonal,
            ficha.nivelActividadFisica,
            ficha.medicacionActual,
            ficha.suplementosActuales,
            ficha.cirugiasPrevias,
            ficha.antecedentesFamiliares,
            ficha.frecuenciaComidas,
            ficha.consumoAguaDiario,
            ficha.restriccionesAlimentarias,
            ficha.consumoAlcohol,
            ficha.fumaTabaco,
            ficha.horasSueno,
            ficha.contactoEmergenciaNombre,
            ficha.contactoEmergenciaTelefono,
            idFichaSalud,
          ],
        );
        // Limpiar relaciones anteriores
        await dataSource.query(
          'DELETE FROM ficha_salud_patologias WHERE id_ficha_salud = ?',
          [idFichaSalud],
        );
        await dataSource.query(
          'DELETE FROM ficha_salud_alergias WHERE id_ficha_salud = ?',
          [idFichaSalud],
        );
      } else {
        const result = await dataSource.query(
          `INSERT INTO ficha_salud (altura, peso, objetivo_personal, nivel_actividad_fisica,
           medicacion_actual, suplementos_actuales, cirugias_previas, antecedentes_familiares,
           frecuencia_comidas, consumo_agua_diario, restricciones_alimentarias, consumo_alcohol,
           fuma_tabaco, horas_sueno, contacto_emergencia_nombre, contacto_emergencia_telefono)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ficha.altura,
            ficha.peso,
            ficha.objetivoPersonal,
            ficha.nivelActividadFisica,
            ficha.medicacionActual,
            ficha.suplementosActuales,
            ficha.cirugiasPrevias,
            ficha.antecedentesFamiliares,
            ficha.frecuenciaComidas,
            ficha.consumoAguaDiario,
            ficha.restriccionesAlimentarias,
            ficha.consumoAlcohol,
            ficha.fumaTabaco,
            ficha.horasSueno,
            ficha.contactoEmergenciaNombre,
            ficha.contactoEmergenciaTelefono,
          ],
        );
        idFichaSalud = obtenerInsertId(result) ?? 0;
      }

      // Vincular patologías
      for (const patologiaNombre of ficha.patologias) {
        const idPatologia = patologiaIds[patologiaNombre];
        if (idPatologia) {
          await dataSource.query(
            'INSERT IGNORE INTO ficha_salud_patologias (id_ficha_salud, id_patologia) VALUES (?, ?)',
            [idFichaSalud, idPatologia],
          );
        }
      }

      // Vincular alergias
      for (const alergiaNombre of ficha.alergias) {
        const idAlergia = alergiaIds[alergiaNombre];
        if (idAlergia) {
          await dataSource.query(
            'INSERT IGNORE INTO ficha_salud_alergias (id_ficha_salud, id_alergia) VALUES (?, ?)',
            [idFichaSalud, idAlergia],
          );
        }
      }

      fichaSaludIds[email] = idFichaSalud;
    }
    console.log(`   ✅ ${Object.keys(FICHAS_SALUD).length} fichas de salud\n`);

    // =========================================================================
    // 5. CREAR AGENDAS
    // =========================================================================
    console.log('📝 Creando agendas...');

    let agendasCreadas = 0;
    for (const [nutriEmail, agendas] of Object.entries(
      AGENDA_POR_NUTRICIONISTA,
    )) {
      const idNutricionista = personaIds[nutriEmail];
      if (!idNutricionista) continue;

      for (const agenda of agendas) {
        await dataSource.query(
          `INSERT INTO agenda (dia, hora_inicio, hora_fin, duracion_turno, id_nutricionista)
           SELECT ?, ?, ?, ?, ?
           WHERE NOT EXISTS (
             SELECT 1 FROM agenda WHERE id_nutricionista = ? AND dia = ? AND hora_inicio = ?
           )`,
          [
            agenda.dia,
            agenda.horaInicio,
            agenda.horaFin,
            agenda.duracionTurno,
            idNutricionista,
            idNutricionista,
            agenda.dia,
            agenda.horaInicio,
          ],
        );
        agendasCreadas++;
      }
    }
    console.log(`   ✅ ${agendasCreadas} horarios de agenda\n`);

    // =========================================================================
    // 6. CREAR TURNOS
    // =========================================================================
    console.log('📝 Creando turnos...');

    let turnosCreados = 0;
    for (const turno of TURNOS) {
      const idSocio = personaIds[turno.socioEmail];
      const idNutricionista = personaIds[turno.nutricionistaEmail];
      if (!idSocio || !idNutricionista) continue;

      await dataSource.query(
        `INSERT INTO turno (fecha, hora_turno, estado, id_socio, id_nutricionista)
         SELECT ?, ?, ?, ?, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM turno WHERE id_socio = ? AND id_nutricionista = ? AND fecha = ? AND hora_turno = ?
         )`,
        [
          turno.fecha,
          turno.hora,
          turno.estado,
          idSocio,
          idNutricionista,
          idSocio,
          idNutricionista,
          turno.fecha,
          turno.hora,
        ],
      );
      turnosCreados++;
    }
    console.log(`   ✅ ${turnosCreados} turnos\n`);

    // =========================================================================
    // 7. CREAR MEDICIONES
    // =========================================================================
    console.log('📝 Creando mediciones de progreso...');

    let medicionesCreadas = 0;
    for (const [socioEmail, mediciones] of Object.entries(
      MEDICIONES_POR_SOCIO,
    )) {
      const idSocio = personaIds[socioEmail];
      if (!idSocio) continue;

      // Obtener turnos de este socio
      const turnosSocio = await dataSource.query(
        `SELECT id_turno, fecha FROM turno WHERE id_socio = ? ORDER BY fecha`,
        [idSocio],
      );

      for (let i = 0; i < mediciones.length; i++) {
        const medicion = mediciones[i];

        // Buscar un turno existente para esta fecha o crear uno
        const turnoEncontrado = turnosSocio.find((t: any) => {
          const fechaTurno = new Date(t.fecha).toISOString().split('T')[0];
          return fechaTurno === medicion.fecha;
        });

        let idTurno: number;

        if (!turnoEncontrado) {
          // Crear un turno ficticio para la medición
          const nutricionistaAsignado =
            socioEmail === 'socio2@nutrifit.com'
              ? personaIds['nutri2@nutrifit.com']
              : socioEmail === 'socio4@nutrifit.com'
                ? personaIds['nutri3@nutrifit.com']
                : personaIds['nutri@nutrifit.com'];

          const resultTurno = await dataSource.query(
            `INSERT INTO turno (fecha, hora_turno, estado, id_socio, id_nutricionista)
             VALUES (?, '10:00', 'REALIZADO', ?, ?)`,
            [medicion.fecha, idSocio, nutricionistaAsignado],
          );
          idTurno = obtenerInsertId(resultTurno) ?? 0;
        } else {
          idTurno = parsearNumero(turnoEncontrado.id_turno) ?? 0;
        }

        // Verificar si ya existe medición para este turno
        const existente = await dataSource.query(
          'SELECT id_medicion FROM medicion WHERE id_turno = ?',
          [idTurno],
        );

        if (existente[0]?.length > 0) continue;

        await dataSource.query(
          `INSERT INTO medicion (peso, altura, imc, perimetro_cintura, perimetro_cadera, perimetro_brazo,
           perimetro_muslo, perimetro_pecho, pliegue_triceps, pliegue_abdominal, pliegue_muslo,
           porcentaje_grasa, masa_magra, frecuencia_cardiaca, tension_sistolica, tension_diastolica,
           notas_medicion, created_at, id_turno)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            medicion.peso,
            medicion.altura,
            medicion.imc,
            medicion.perimetroCintura,
            medicion.perimetroCadera,
            medicion.perimetroBrazo,
            medicion.perimetroMuslo,
            medicion.perimetroPecho,
            medicion.pliegueTriceps,
            medicion.pliegueAbdominal,
            medicion.pliegueMuslo,
            medicion.porcentajeGrasa,
            medicion.masaMagra,
            medicion.frecuenciaCardiaca,
            medicion.tensionSistolica,
            medicion.tensionDiastolica,
            medicion.notasMedicion,
            medicion.fecha,
            idTurno,
          ],
        );
        medicionesCreadas++;
      }
    }
    console.log(`   ✅ ${medicionesCreadas} mediciones\n`);

    // =========================================================================
    // 8. CREAR PLANES DE ALIMENTACIÓN
    // =========================================================================
    console.log('📝 Creando planes de alimentación...');

    let planesCreados = 0;
    for (const plan of PLANES_ALIMENTACION) {
      const idSocio = personaIds[plan.socioEmail];
      const idNutricionista = personaIds[plan.nutricionistaEmail];
      if (!idSocio || !idNutricionista) continue;

      // Verificar si ya existe plan activo
      const existente = await dataSource.query(
        'SELECT id_plan_alimentacion FROM plan_alimentacion WHERE id_socio = ? AND activo = 1',
        [idSocio],
      );
      if (existente[0]?.length > 0) continue;

      const resultPlan = await dataSource.query(
        `INSERT INTO plan_alimentacion (fechaCreacion, objetivo_nutricional, id_socio, id_nutricionista, activo)
         VALUES (CURDATE(), ?, ?, ?, 1)`,
        [plan.objetivoNutricional, idSocio, idNutricionista],
      );
      const idPlan = obtenerInsertId(resultPlan) ?? 0;

      for (const diaPlan of plan.dias) {
        const resultDia = await dataSource.query(
          `INSERT INTO dia_plan (dia, orden, id_plan_alimentacion) VALUES (?, ?, ?)`,
          [diaPlan.dia, diaPlan.orden, idPlan],
        );
        const idDiaPlan = obtenerInsertId(resultDia) ?? 0;

        for (const comida of diaPlan.comidas) {
          const resultOpcion = await dataSource.query(
            `INSERT INTO opcion_comida (comentarios, tipo_comida, id_dia_plan) VALUES (?, ?, ?)`,
            [comida.comentarios, comida.tipoComida, idDiaPlan],
          );
          const idOpcionComida = obtenerInsertId(resultOpcion) ?? 0;

          // Nota: Los alimentos se agregarían si existe la tabla de alimentos poblada
          // Por ahora solo creamos la estructura del plan
        }
      }
      planesCreados++;
    }
    console.log(`   ✅ ${planesCreados} planes de alimentación\n`);

    // =========================================================================
    // RESUMEN FINAL
    // =========================================================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ SEED COMPLETO FINALIZADO EXITOSAMENTE');
    console.log(
      '═══════════════════════════════════════════════════════════\n',
    );
    console.log('📊 Resumen de datos creados:');
    console.log(`   👤 Administradores:     ${ADMINS.length}`);
    console.log(`   👩‍⚕️ Nutricionistas:      ${NUTRICIONISTAS.length}`);
    console.log(`   🧑 Socios:              ${SOCIOS.length}`);
    console.log(
      `   📋 Fichas de salud:     ${Object.keys(FICHAS_SALUD).length}`,
    );
    console.log(`   📅 Horarios de agenda:  ${agendasCreadas}`);
    console.log(`   📆 Turnos:              ${turnosCreados}`);
    console.log(`   📈 Mediciones:          ${medicionesCreadas}`);
    console.log(`   🍎 Planes alimentación: ${planesCreados}`);
    console.log(`   🏥 Patologías:          ${PATOLOGIAS.length}`);
    console.log(`   ⚠️  Alergias:            ${ALERGIAS.length}`);
    console.log('\n🔑 Credenciales de acceso:');
    console.log('   Todos los usuarios usan la contraseña: 123456');
    console.log('\n   Admins:');
    ADMINS.forEach((a) => console.log(`     - ${a.email}`));
    console.log('\n   Nutricionistas:');
    NUTRICIONISTAS.forEach((n) => console.log(`     - ${n.email}`));
    console.log('\n   Socios:');
    SOCIOS.forEach((s) => console.log(`     - ${s.email}`));
    console.log(
      '\n═══════════════════════════════════════════════════════════\n',
    );
  } catch (error) {
    console.error('❌ Error al ejecutar el seed:', error);
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

void runSeed();
