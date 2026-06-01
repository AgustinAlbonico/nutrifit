import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const TIMEZONE = 'America/Argentina/Buenos_Aires';

const db = await mysql.createConnection({
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER ?? 'root',
  password: process.env.DATABASE_PASSWORD ?? 'root',
  database: process.env.DATABASE_NAME ?? 'nutrifit_supervisor',
});

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function is2xx(status) {
  return status >= 200 && status < 300;
}

function formatDateAR(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function formatTimeAR(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;

  return `${hour}:${minute}`;
}

function addDaysAR(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateAR(date);
}

function addMinutesAR(minutes) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return formatTimeAR(date);
}

function normalizeHHmm(value) {
  const [hours = '00', minutes = '00'] = value.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

function weekdayFromDateAR(dateValue) {
  const date = new Date(`${dateValue}T12:00:00-03:00`);
  const weekday = new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    weekday: 'long',
  }).format(date);

  const normalized = weekday.toLowerCase();
  const map = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    'miércoles': 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    'sábado': 'Sábado',
    domingo: 'Domingo',
  };

  return map[normalized] ?? 'Lunes';
}

async function apiRequest({ method, route, token, body }) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let parsed = null;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  return {
    status: response.status,
    body: parsed,
  };
}

function unwrapData(result) {
  return result?.body?.data ?? result?.body;
}

async function login(email, contraseña = '123456') {
  const result = await apiRequest({
    method: 'POST',
    route: '/auth/login',
    body: { email, contraseña },
  });

  assert(is2xx(result.status), `Login fallido para ${email}: ${result.status}`);

  const data = unwrapData(result);
  assert(data?.token, `Respuesta de login sin token para ${email}`);

  return data.token;
}

async function getPersonaIdByEmail(email) {
  const [rows] = await db.query(
    'SELECT id_persona FROM usuario WHERE email = ? LIMIT 1',
    [email],
  );

  return rows[0]?.id_persona ?? null;
}

async function insertObservacion({ comentario }) {
  const [result] = await db.query(
    `INSERT INTO observacion_clinica
      (comentario, peso, altura, imc, sugerencias, habitos_socio, objetivos_socio)
     VALUES (?, ?, ?, ?, ?, ?, ?)` ,
    [comentario, 75, 175, 24.49, 'Seguir plan', 'Dormir 8h', 'Definicion'],
  );

  return result.insertId;
}

async function insertTurno({
  socioId,
  nutricionistaId,
  fecha,
  hora,
  estado,
  observacionId = null,
}) {
  const [result] = await db.query(
    `INSERT INTO turno (fecha, hora_turno, estado, id_observacion, id_socio, id_nutricionista)
     VALUES (?, ?, ?, ?, ?, ?)` ,
    [fecha, normalizeHHmm(hora), estado, observacionId, socioId, nutricionistaId],
  );

  return result.insertId;
}

async function createProfesional(adminToken, suffix) {
  const payload = {
    email: `qa.${suffix}@nutrifit.com`,
    contraseña: 'Qa#123456',
    nombre: `QA${suffix}`,
    apellido: 'Profesional',
    fechaNacimiento: '1990-01-15',
    telefono: '3415551234',
    genero: 'MASCULINO',
    direccion: 'Calle QA 123',
    ciudad: 'Rosario',
    provincia: 'Santa Fe',
    dni: String(50000000 + Number(suffix.slice(-3))).padStart(8, '0'),
    matricula: `QAMAT-${suffix}`,
    tarifaSesion: 1500,
    añosExperiencia: 5,
  };

  const result = await apiRequest({
    method: 'POST',
    route: '/profesional',
    token: adminToken,
    body: payload,
  });

  return { result, payload };
}

async function configurarAgenda(token, profesionalId, agendas) {
  return apiRequest({
    method: 'PUT',
    route: `/agenda/${profesionalId}/configuracion`,
    token,
    body: { agendas },
  });
}

function agendaSemanalEstandar() {
  return [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ].map((dia) => ({
    dia,
    horaInicio: '09:00',
    horaFin: '18:00',
    duracionTurno: 30,
  }));
}

const checklist = {
  CUD01: {
    exito: [
      'Autenticar como administrador.',
      'Consultar listado de profesionales.',
      'Verificar respuesta exitosa y estructura de datos.',
    ],
    alternativo: [
      'Autenticar como administrador.',
      'Consultar detalle de un profesional existente.',
      'Verificar respuesta exitosa del detalle.',
    ],
    fracaso: [
      'Autenticar como socio.',
      'Intentar listar profesionales del modulo admin.',
      'Verificar bloqueo por autorizacion.',
    ],
  },
  CUD02: {
    exito: ['Autenticar admin.', 'Crear profesional valido.', 'Verificar alta exitosa.'],
    alternativo: ['Crear segundo profesional valido.', 'Verificar alta.', 'Persistencia correcta.'],
    fracaso: ['Intentar alta con email duplicado.', 'Enviar request.', 'Verificar error de duplicado.'],
  },
  CUD03: {
    exito: ['Actualizar telefono de profesional.', 'Guardar cambios.', 'Verificar actualizacion.'],
    alternativo: ['Actualizar provincia.', 'Guardar cambios.', 'Verificar datos editados.'],
    fracaso: ['Editar profesional inexistente.', 'Enviar update.', 'Verificar not found.'],
  },
  CUD04: {
    exito: ['Suspender profesional sin bloqueos.', 'Consultar detalle.', 'Verificar fecha de baja.'],
    alternativo: ['Reactivar profesional suspendido.', 'Consultar detalle.', 'Verificar activo.'],
    fracaso: ['Generar turno futuro del profesional.', 'Intentar suspender.', 'Verificar bloqueo esperado.'],
  },
  CUD05: {
    exito: ['Listar profesionales como admin.', 'Obtener resultados.', 'Verificar respuesta 200.'],
    alternativo: ['Listar profesionales publicos para socio.', 'Aplicar filtro de nombre.', 'Verificar filtrado.'],
    fracaso: ['Consultar profesional inexistente.', 'Enviar request detalle.', 'Verificar 404.'],
  },
  CUD06: {
    exito: ['Profesional consulta su agenda.', 'Recibe datos.', 'Verificar acceso permitido.'],
    alternativo: ['Profesional consulta sus turnos del dia.', 'Recibe listado.', 'Verificar acceso correcto.'],
    fracaso: ['Profesional consulta agenda de otro profesional.', 'Enviar request.', 'Verificar bloqueo ownership.'],
  },
  CUD07: {
    exito: ['Crear turno de hoy.', 'Consultar /hoy.', 'Verificar turno en respuesta.'],
    alternativo: ['Consultar /hoy con filtro socio.', 'Verificar respuesta filtrada.', 'Mantener estado OK.'],
    fracaso: ['Consultar /hoy con rango horario invalido.', 'Enviar filtro horaDesde>horaHasta.', 'Verificar 400.'],
  },
  CUD08: {
    exito: ['Consultar pacientes vinculados.', 'Recibir listado.', 'Verificar socio esperado.'],
    alternativo: ['Consultar pacientes con filtro objetivo.', 'Recibir listado.', 'Verificar filtrado.'],
    fracaso: ['Consultar pacientes de otro profesional.', 'Enviar request.', 'Verificar 403 por ownership.'],
  },
  CUD09: {
    exito: ['Consultar ficha de socio vinculado.', 'Recibir ficha.', 'Verificar campos clave.'],
    alternativo: ['Consultar nuevamente ficha actualizada.', 'Recibir datos.', 'Verificar persistencia.'],
    fracaso: ['Consultar ficha de socio no vinculado.', 'Enviar request.', 'Verificar 403.'],
  },
  CUD10: {
    exito: ['Crear turno historico realizado.', 'Consultar historial.', 'Verificar item presente.'],
    alternativo: ['Crear turno historico ausente.', 'Consultar historial.', 'Verificar estado AUSENTE.'],
    fracaso: ['Consultar historial de socio no vinculado.', 'Enviar request.', 'Verificar 403.'],
  },
  CUD11: {
    exito: ['Configurar agenda valida semanal.', 'Guardar.', 'Verificar bloques creados.'],
    alternativo: ['Reconfigurar agenda valida.', 'Guardar.', 'Verificar persistencia.'],
    fracaso: ['Configurar bloques superpuestos.', 'Guardar.', 'Verificar error de validacion.'],
  },
  CUD12: {
    exito: ['Asignar turno manual valido.', 'Guardar turno.', 'Verificar estado pendiente.'],
    alternativo: ['Asignar otro turno en slot libre.', 'Guardar.', 'Verificar alta exitosa.'],
    fracaso: ['Asignar turno en slot ocupado.', 'Enviar request.', 'Verificar conflicto/disponibilidad.'],
  },
  CUD13: {
    exito: ['Socio lista profesionales activos.', 'Recibe listado.', 'Verificar status 200.'],
    alternativo: ['Aplicar filtro por nombre.', 'Recibir lista filtrada.', 'Verificar coincidencias.'],
    fracaso: ['Consultar listado sin token.', 'Enviar request.', 'Verificar 401.'],
  },
  CUD14: {
    exito: ['Socio reserva turno valido.', 'Registrar turno.', 'Verificar estado pendiente.'],
    alternativo: ['Reservar segundo turno en otro dia.', 'Registrar.', 'Verificar alta.'],
    fracaso: ['Reservar mismo profesional mismo dia.', 'Enviar request.', 'Verificar bloqueo de regla.'],
  },
  CUD15: {
    exito: ['Socio consulta perfil publico.', 'Recibir perfil.', 'Verificar campos y horarios.'],
    alternativo: ['Consultar perfil con agenda.', 'Recibir horarios.', 'Verificar no vacio.'],
    fracaso: ['Consultar perfil inexistente.', 'Enviar request.', 'Verificar 404.'],
  },
  CUD16: {
    exito: ['Socio guarda ficha de salud.', 'Persistir datos.', 'Verificar respuesta.'],
    alternativo: ['Socio actualiza ficha existente.', 'Persistir.', 'Verificar cambios.'],
    fracaso: ['Enviar ficha invalida.', 'Guardar.', 'Verificar error 400.'],
  },
  CUD17: {
    exito: ['Socio consulta mis turnos.', 'Recibe listado.', 'Verificar datos.'],
    alternativo: ['Filtrar mis turnos por estado.', 'Recibe resultado.', 'Verificar filtro.'],
    fracaso: ['Consultar mis turnos sin token.', 'Enviar request.', 'Verificar 401.'],
  },
  CUD18: {
    exito: ['Reprogramar turno pendiente >24h.', 'Guardar nueva fecha/hora.', 'Verificar estado REPROGRAMADO.'],
    alternativo: ['Reprogramar otro turno elegible.', 'Persistir.', 'Verificar response.'],
    fracaso: ['Reprogramar turno con <24h.', 'Enviar request.', 'Verificar bloqueo regla 24h.'],
  },
  CUD19: {
    exito: ['Cancelar turno pendiente >24h.', 'Persistir estado.', 'Verificar CANCELADO.'],
    alternativo: ['Cancelar otro turno elegible.', 'Persistir.', 'Verificar respuesta.'],
    fracaso: ['Cancelar turno con <24h.', 'Enviar request.', 'Verificar bloqueo regla 24h.'],
  },
  CUD20: {
    exito: ['Confirmar turno del dia antes de hora.', 'Persistir confirmacion.', 'Verificar CONFIRMADO.'],
    alternativo: ['Confirmar turno REPROGRAMADO del dia.', 'Persistir.', 'Verificar CONFIRMADO.'],
    fracaso: ['Confirmar turno fuera del dia.', 'Enviar request.', 'Verificar rechazo.'],
  },
  CUD21: {
    exito: ['Registrar asistencia asistio=true en confirmado pasado.', 'Persistir.', 'Verificar REALIZADO.'],
    alternativo: ['Registrar asistencia asistio=false.', 'Persistir.', 'Verificar AUSENTE.'],
    fracaso: ['Registrar asistencia en turno no confirmado.', 'Enviar request.', 'Verificar bloqueo.'],
  },
};

const resultados = {};

for (const cud of Object.keys(checklist)) {
  resultados[cud] = {
    exito: { ok: false, detalle: 'No ejecutado' },
    alternativo: { ok: false, detalle: 'No ejecutado' },
    fracaso: { ok: false, detalle: 'No ejecutado' },
    listo: false,
  };
}

async function runPath(cud, tipo, fn) {
  try {
    const detalle = await fn();
    resultados[cud][tipo] = {
      ok: true,
      detalle,
    };
  } catch (error) {
    resultados[cud][tipo] = {
      ok: false,
      detalle: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

const ctx = {
  runId: String(Date.now()),
  adminToken: '',
  socioToken: '',
  nutriToken: '',
  adminPersonaId: null,
  socioPersonaId: null,
  nutriPersonaId: null,
  extraSocioId: null,
  extraSocioEmail: '',
  proA: null,
  proB: null,
  proAToken: '',
  proBToken: '',
  turnos: {},
};

async function bootstrap() {
  ctx.adminToken = await login('admin@nutrifit.com');
  ctx.socioToken = await login('socio@nutrifit.com');
  ctx.nutriToken = await login('nutri@nutrifit.com');

  ctx.adminPersonaId = await getPersonaIdByEmail('admin@nutrifit.com');
  ctx.socioPersonaId = await getPersonaIdByEmail('socio@nutrifit.com');
  ctx.nutriPersonaId = await getPersonaIdByEmail('nutri@nutrifit.com');

  const socioEmail = `qa.socio.${ctx.runId}@nutrifit.com`;
  const registroSocio = await apiRequest({
    method: 'POST',
    route: '/socio/registrar',
    token: ctx.adminToken,
    body: {
      email: socioEmail,
      contraseña: 'Qa#123456',
      nombre: 'Socio',
      apellido: 'QA',
      fechaNacimiento: '1998-05-20',
      telefono: '3415559911',
      genero: 'FEMENINO',
      direccion: 'Calle QA 456',
      ciudad: 'Rosario',
      provincia: 'Santa Fe',
    },
  });

  assert(
    is2xx(registroSocio.status),
    `No se pudo crear socio de prueba: ${registroSocio.status}`,
  );

  ctx.extraSocioEmail = socioEmail;
  ctx.extraSocioId = await getPersonaIdByEmail(socioEmail);

  const fichaInicial = await apiRequest({
    method: 'PUT',
    route: '/turnos/socio/ficha-salud',
    token: ctx.socioToken,
    body: {
      altura: 175,
      peso: 78,
      nivelActividadFisica: 'Moderado',
      alergias: ['Gluten'],
      patologias: ['Hipertension'],
      objetivoPersonal: 'Ganar masa muscular',
    },
  });

  assert(is2xx(fichaInicial.status), 'No se pudo preparar ficha de salud base');
}

await bootstrap();

await runPath('CUD01', 'exito', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: '/profesional',
    token: ctx.adminToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Admin pudo listar profesionales.';
});

await runPath('CUD01', 'alternativo', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/profesional/${ctx.nutriPersonaId}`,
    token: ctx.adminToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Admin pudo ver detalle de profesional existente.';
});

await runPath('CUD01', 'fracaso', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: '/profesional',
    token: ctx.socioToken,
  });
  assert(response.status === 403, `Se esperaba 403 y llego ${response.status}`);
  return 'Socio bloqueado correctamente en modulo admin.';
});

await runPath('CUD02', 'exito', async () => {
  const suffix = `${ctx.runId.slice(-6)}01`;
  const { result, payload } = await createProfesional(ctx.adminToken, suffix);
  assert(is2xx(result.status), `Status inesperado: ${result.status}`);
  const data = unwrapData(result);
  const idPersona = data?.idPersona;
  assert(idPersona, 'No se obtuvo idPersona en alta profesional A');
  ctx.proA = { idPersona, email: payload.email, contraseña: payload.contraseña };
  return `Profesional A creado con id ${idPersona}.`;
});

await runPath('CUD02', 'alternativo', async () => {
  const suffix = `${ctx.runId.slice(-6)}02`;
  const { result, payload } = await createProfesional(ctx.adminToken, suffix);
  assert(is2xx(result.status), `Status inesperado: ${result.status}`);
  const data = unwrapData(result);
  const idPersona = data?.idPersona;
  assert(idPersona, 'No se obtuvo idPersona en alta profesional B');
  ctx.proB = { idPersona, email: payload.email, contraseña: payload.contraseña };
  return `Profesional B creado con id ${idPersona}.`;
});

await runPath('CUD02', 'fracaso', async () => {
  assert(ctx.proA, 'Precondicion faltante: profesional A');
  const { result } = await createProfesional(ctx.adminToken, `${ctx.runId.slice(-6)}99`);
  const duplicateResponse = await apiRequest({
    method: 'POST',
    route: '/profesional',
    token: ctx.adminToken,
    body: {
      email: ctx.proA.email,
      contraseña: 'Qa#123456',
      nombre: 'Duplicado',
      apellido: 'Email',
      fechaNacimiento: '1992-03-10',
      telefono: '3415000000',
      genero: 'MASCULINO',
      direccion: 'Dir',
      ciudad: 'Rosario',
      provincia: 'Santa Fe',
      dni: String(59900000 + Number(ctx.runId.slice(-2))).padStart(8, '0'),
      matricula: `QAMAT-DUP-${ctx.runId.slice(-4)}`,
      tarifaSesion: 1800,
      añosExperiencia: 6,
    },
  });

  assert(is2xx(result.status), `No se pudo crear profesional auxiliar: ${result.status}`);
  assert(
    duplicateResponse.status >= 400,
    `Se esperaba error por duplicado y llego ${duplicateResponse.status}`,
  );
  return 'Duplicado de email rechazado correctamente.';
});

ctx.proAToken = await login(ctx.proA.email, ctx.proA.contraseña);
ctx.proBToken = await login(ctx.proB.email, ctx.proB.contraseña);

await runPath('CUD03', 'exito', async () => {
  const response = await apiRequest({
    method: 'PUT',
    route: `/profesional/${ctx.proA.idPersona}`,
    token: ctx.adminToken,
    body: {
      telefono: '3415111222',
    },
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Actualizacion de telefono realizada.';
});

await runPath('CUD03', 'alternativo', async () => {
  const response = await apiRequest({
    method: 'PUT',
    route: `/profesional/${ctx.proA.idPersona}`,
    token: ctx.adminToken,
    body: {
      provincia: 'Cordoba',
    },
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Actualizacion alternativa aplicada.';
});

await runPath('CUD03', 'fracaso', async () => {
  const response = await apiRequest({
    method: 'PUT',
    route: '/profesional/999999',
    token: ctx.adminToken,
    body: {
      telefono: '3415000000',
    },
  });
  assert(response.status === 404, `Se esperaba 404 y llego ${response.status}`);
  return 'Update de inexistente rechazado.';
});

await runPath('CUD04', 'exito', async () => {
  const deleteResponse = await apiRequest({
    method: 'DELETE',
    route: `/profesional/${ctx.proB.idPersona}`,
    token: ctx.adminToken,
  });
  assert(is2xx(deleteResponse.status), `Status inesperado: ${deleteResponse.status}`);

  const detalle = await apiRequest({
    method: 'GET',
    route: `/profesional/${ctx.proB.idPersona}`,
    token: ctx.adminToken,
  });

  assert(is2xx(detalle.status), `Detalle no disponible: ${detalle.status}`);
  const data = unwrapData(detalle);
  assert(data?.activo === false, 'No quedo suspendido luego de la baja');
  return 'Baja de profesional aplicada.';
});

await runPath('CUD04', 'alternativo', async () => {
  const response = await apiRequest({
    method: 'POST',
    route: `/profesional/${ctx.proB.idPersona}/reactivar`,
    token: ctx.adminToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);

  const detalle = await apiRequest({
    method: 'GET',
    route: `/profesional/${ctx.proB.idPersona}`,
    token: ctx.adminToken,
  });
  const data = unwrapData(detalle);
  assert(data?.activo === true, 'No quedo reactivado');
  return 'Reactivacion validada.';
});

await runPath('CUD04', 'fracaso', async () => {
  const fechaFutura = addDaysAR(3);
  const diaFuturo = weekdayFromDateAR(fechaFutura);

  const agendaResp = await configurarAgenda(ctx.proBToken, ctx.proB.idPersona, [
    {
      dia: diaFuturo,
      horaInicio: '09:00',
      horaFin: '18:00',
      duracionTurno: 30,
    },
  ]);
  assert(is2xx(agendaResp.status), `No se pudo configurar agenda B: ${agendaResp.status}`);

  const turnoResp = await apiRequest({
    method: 'POST',
    route: `/turnos/profesional/${ctx.proB.idPersona}/asignar-manual`,
    token: ctx.proBToken,
    body: {
      socioId: ctx.socioPersonaId,
      fechaTurno: fechaFutura,
      horaTurno: '10:00',
    },
  });
  assert(is2xx(turnoResp.status), `No se pudo crear turno futuro B: ${turnoResp.status}`);

  const deleteResponse = await apiRequest({
    method: 'DELETE',
    route: `/profesional/${ctx.proB.idPersona}`,
    token: ctx.adminToken,
  });

  assert(
    deleteResponse.status >= 400,
    `Se esperaba bloqueo por turnos futuros y llego ${deleteResponse.status}`,
  );
  return 'Suspension con turnos futuros bloqueada.';
});

await runPath('CUD05', 'exito', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: '/profesional',
    token: ctx.adminToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Listado admin disponible.';
});

await runPath('CUD05', 'alternativo', async () => {
  const nombre = encodeURIComponent(`QA${ctx.runId.slice(-6)}01`);
  const response = await apiRequest({
    method: 'GET',
    route: `/profesional/publico/disponibles?nombre=${nombre}`,
    token: ctx.socioToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  assert(Array.isArray(data), 'La respuesta no devolvio lista');
  return 'Listado publico filtrado operativo.';
});

await runPath('CUD05', 'fracaso', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: '/profesional/999999',
    token: ctx.adminToken,
  });
  assert(response.status === 404, `Se esperaba 404 y llego ${response.status}`);
  return 'Detalle inexistente rechazado.';
});

await runPath('CUD11', 'exito', async () => {
  const response = await configurarAgenda(
    ctx.proAToken,
    ctx.proA.idPersona,
    agendaSemanalEstandar(),
  );
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Agenda semanal configurada.';
});

await runPath('CUD11', 'alternativo', async () => {
  const response = await configurarAgenda(
    ctx.proAToken,
    ctx.proA.idPersona,
    agendaSemanalEstandar(),
  );
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Reconfiguracion valida aplicada.';
});

await runPath('CUD11', 'fracaso', async () => {
  const response = await configurarAgenda(ctx.proAToken, ctx.proA.idPersona, [
    { dia: 'Lunes', horaInicio: '09:00', horaFin: '12:00', duracionTurno: 30 },
    { dia: 'Lunes', horaInicio: '11:30', horaFin: '13:00', duracionTurno: 30 },
  ]);
  assert(response.status >= 400, `Se esperaba error y llego ${response.status}`);
  return 'Superposicion rechazada correctamente.';
});

await runPath('CUD06', 'exito', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/agenda/${ctx.proA.idPersona}`,
    token: ctx.proAToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Profesional accedio a su agenda.';
});

await runPath('CUD06', 'alternativo', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/turnos/profesional/${ctx.proA.idPersona}/hoy`,
    token: ctx.proAToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Profesional accedio a turnos del dia.';
});

await runPath('CUD06', 'fracaso', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/agenda/${ctx.proB.idPersona}`,
    token: ctx.proAToken,
  });
  assert(response.status === 403, `Se esperaba 403 y llego ${response.status}`);
  return 'Ownership bloquea acceso a agenda ajena.';
});

await runPath('CUD07', 'exito', async () => {
  const fechaHoy = addDaysAR(0);
  const diaHoy = weekdayFromDateAR(fechaHoy);
  await configurarAgenda(ctx.proAToken, ctx.proA.idPersona, [
    { dia: diaHoy, horaInicio: '08:00', horaFin: '20:00', duracionTurno: 30 },
  ]);

  const altaTurno = await apiRequest({
    method: 'POST',
    route: `/turnos/profesional/${ctx.proA.idPersona}/asignar-manual`,
    token: ctx.proAToken,
    body: {
      socioId: ctx.socioPersonaId,
      fechaTurno: fechaHoy,
      horaTurno: '10:00',
    },
  });
  assert(is2xx(altaTurno.status), `No se creo turno de hoy: ${altaTurno.status}`);

  const turno = unwrapData(altaTurno);
  ctx.turnos.turnoHoy = turno.idTurno;

  const response = await apiRequest({
    method: 'GET',
    route: `/turnos/profesional/${ctx.proA.idPersona}/hoy`,
    token: ctx.proAToken,
  });

  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  assert(
    Array.isArray(data) && data.some((item) => item.idTurno === ctx.turnos.turnoHoy),
    'No se encontro turno del dia en la respuesta',
  );
  return `Turno ${ctx.turnos.turnoHoy} visible en agenda del dia.`;
});

await runPath('CUD07', 'alternativo', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/turnos/profesional/${ctx.proA.idPersona}/hoy?socio=Maria`,
    token: ctx.proAToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Filtro por socio aplicado sin errores.';
});

await runPath('CUD07', 'fracaso', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/turnos/profesional/${ctx.proA.idPersona}/hoy?horaDesde=18:00&horaHasta=09:00`,
    token: ctx.proAToken,
  });
  assert(response.status === 400, `Se esperaba 400 y llego ${response.status}`);
  return 'Rango horario invalido rechazado.';
});

await runPath('CUD08', 'exito', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/turnos/profesional/${ctx.proA.idPersona}/pacientes`,
    token: ctx.proAToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  assert(
    Array.isArray(data) && data.some((item) => item.socioId === ctx.socioPersonaId),
    'No aparece socio vinculado en pacientes',
  );
  return 'Listado de pacientes vinculado correcto.';
});

await runPath('CUD08', 'alternativo', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/turnos/profesional/${ctx.proA.idPersona}/pacientes?objetivo=masa`,
    token: ctx.proAToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Filtro por objetivo aplicado correctamente.';
});

await runPath('CUD08', 'fracaso', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/turnos/profesional/${ctx.proB.idPersona}/pacientes`,
    token: ctx.proAToken,
  });
  assert(response.status === 403, `Se esperaba 403 y llego ${response.status}`);
  return 'Ownership bloquea pacientes de otro profesional.';
});

await runPath('CUD09', 'exito', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/turnos/profesional/${ctx.proA.idPersona}/pacientes/${ctx.socioPersonaId}/ficha-salud`,
    token: ctx.proAToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  assert(data?.socioId === ctx.socioPersonaId, 'Ficha devuelta para socio incorrecto');
  return 'Ficha de salud visible para socio vinculado.';
});

await runPath('CUD09', 'alternativo', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/turnos/profesional/${ctx.proA.idPersona}/pacientes/${ctx.socioPersonaId}/ficha-salud`,
    token: ctx.proAToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Reconsulta de ficha mantiene consistencia.';
});

await runPath('CUD09', 'fracaso', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/turnos/profesional/${ctx.proA.idPersona}/pacientes/${ctx.extraSocioId}/ficha-salud`,
    token: ctx.proAToken,
  });
  assert(response.status === 403, `Se esperaba 403 y llego ${response.status}`);
  return 'Ficha no vinculada bloqueada correctamente.';
});

await runPath('CUD10', 'exito', async () => {
  const obsId = await insertObservacion({ comentario: 'Control semanal OK' });
  const turnoId = await insertTurno({
    socioId: ctx.socioPersonaId,
    nutricionistaId: ctx.proA.idPersona,
    fecha: addDaysAR(-2),
    hora: '10:00',
    estado: 'REALIZADO',
    observacionId: obsId,
  });

  const response = await apiRequest({
    method: 'GET',
    route: `/turnos/profesional/${ctx.proA.idPersona}/pacientes/${ctx.socioPersonaId}/historial-consultas`,
    token: ctx.proAToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  assert(
    Array.isArray(data) && data.some((item) => item.idTurno === turnoId),
    'No se encontro turno realizado en historial',
  );
  return `Historial incluye turno ${turnoId}.`;
});

await runPath('CUD10', 'alternativo', async () => {
  const turnoId = await insertTurno({
    socioId: ctx.socioPersonaId,
    nutricionistaId: ctx.proA.idPersona,
    fecha: addDaysAR(-1),
    hora: '11:00',
    estado: 'AUSENTE',
  });

  const response = await apiRequest({
    method: 'GET',
    route: `/turnos/profesional/${ctx.proA.idPersona}/pacientes/${ctx.socioPersonaId}/historial-consultas`,
    token: ctx.proAToken,
  });

  const data = unwrapData(response);
  assert(
    Array.isArray(data) && data.some((item) => item.idTurno === turnoId),
    'No se encontro turno AUSENTE en historial',
  );
  return `Historial incluye turno AUSENTE ${turnoId}.`;
});

await runPath('CUD10', 'fracaso', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/turnos/profesional/${ctx.proA.idPersona}/pacientes/${ctx.extraSocioId}/historial-consultas`,
    token: ctx.proAToken,
  });
  assert(response.status === 403, `Se esperaba 403 y llego ${response.status}`);
  return 'Historial no vinculado bloqueado.';
});

await runPath('CUD12', 'exito', async () => {
  const fecha = addDaysAR(3);
  const dia = weekdayFromDateAR(fecha);
  await configurarAgenda(ctx.proAToken, ctx.proA.idPersona, [
    { dia, horaInicio: '09:00', horaFin: '18:00', duracionTurno: 30 },
  ]);

  const response = await apiRequest({
    method: 'POST',
    route: `/turnos/profesional/${ctx.proA.idPersona}/asignar-manual`,
    token: ctx.proAToken,
    body: {
      socioId: ctx.socioPersonaId,
      fechaTurno: fecha,
      horaTurno: '14:00',
    },
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  ctx.turnos.manualA = data.idTurno;
  return `Turno manual ${data.idTurno} creado.`;
});

await runPath('CUD12', 'alternativo', async () => {
  const fecha = addDaysAR(3);
  const response = await apiRequest({
    method: 'POST',
    route: `/turnos/profesional/${ctx.proA.idPersona}/asignar-manual`,
    token: ctx.proAToken,
    body: {
      socioId: ctx.socioPersonaId,
      fechaTurno: fecha,
      horaTurno: '14:30',
    },
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  ctx.turnos.manualB = data.idTurno;
  return `Turno manual alternativo ${data.idTurno} creado.`;
});

await runPath('CUD12', 'fracaso', async () => {
  const fecha = addDaysAR(3);
  const response = await apiRequest({
    method: 'POST',
    route: `/turnos/profesional/${ctx.proA.idPersona}/asignar-manual`,
    token: ctx.proAToken,
    body: {
      socioId: ctx.socioPersonaId,
      fechaTurno: fecha,
      horaTurno: '14:00',
    },
  });
  assert(response.status >= 400, `Se esperaba conflicto y llego ${response.status}`);
  return 'Asignacion en slot ocupado rechazada.';
});

await runPath('CUD13', 'exito', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: '/profesional/publico/disponibles',
    token: ctx.socioToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  assert(Array.isArray(data), 'Listado publico invalido');
  return 'Socio puede ver profesionales activos.';
});

await runPath('CUD13', 'alternativo', async () => {
  const nombre = encodeURIComponent(ctx.proA.email.split('@')[0]);
  const response = await apiRequest({
    method: 'GET',
    route: `/profesional/publico/disponibles?nombre=${nombre}`,
    token: ctx.socioToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Filtro de profesionales publicos sin errores.';
});

await runPath('CUD13', 'fracaso', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: '/profesional/publico/disponibles',
  });
  assert(response.status === 401, `Se esperaba 401 y llego ${response.status}`);
  return 'Sin token queda correctamente bloqueado.';
});

await runPath('CUD14', 'exito', async () => {
  const fecha = addDaysAR(4);
  const dia = weekdayFromDateAR(fecha);
  await configurarAgenda(ctx.proAToken, ctx.proA.idPersona, [
    { dia, horaInicio: '09:00', horaFin: '18:00', duracionTurno: 30 },
  ]);

  const response = await apiRequest({
    method: 'POST',
    route: '/turnos/socio/reservar',
    token: ctx.socioToken,
    body: {
      nutricionistaId: ctx.proA.idPersona,
      fechaTurno: fecha,
      horaTurno: '16:00',
    },
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  ctx.turnos.reservaA = data.idTurno;
  return `Reserva creada con id ${data.idTurno}.`;
});

await runPath('CUD14', 'alternativo', async () => {
  const fecha = addDaysAR(5);
  const dia = weekdayFromDateAR(fecha);
  await configurarAgenda(ctx.proAToken, ctx.proA.idPersona, [
    { dia, horaInicio: '09:00', horaFin: '18:00', duracionTurno: 30 },
  ]);

  const response = await apiRequest({
    method: 'POST',
    route: '/turnos/socio/reservar',
    token: ctx.socioToken,
    body: {
      nutricionistaId: ctx.proA.idPersona,
      fechaTurno: fecha,
      horaTurno: '16:30',
    },
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  ctx.turnos.reservaB = data.idTurno;
  return `Reserva alternativa creada con id ${data.idTurno}.`;
});

await runPath('CUD14', 'fracaso', async () => {
  const fecha = addDaysAR(4);
  const response = await apiRequest({
    method: 'POST',
    route: '/turnos/socio/reservar',
    token: ctx.socioToken,
    body: {
      nutricionistaId: ctx.proA.idPersona,
      fechaTurno: fecha,
      horaTurno: '17:00',
    },
  });
  assert(response.status >= 400, `Se esperaba bloqueo y llego ${response.status}`);
  return 'Bloqueo por mas de un turno mismo dia validado.';
});

await runPath('CUD15', 'exito', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/profesional/publico/${ctx.proA.idPersona}/perfil`,
    token: ctx.socioToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  assert(data?.idPersona === ctx.proA.idPersona, 'Perfil de profesional incorrecto');
  return 'Perfil publico consultado con exito.';
});

await runPath('CUD15', 'alternativo', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: `/profesional/publico/${ctx.proA.idPersona}/perfil`,
    token: ctx.socioToken,
  });
  const data = unwrapData(response);
  assert(Array.isArray(data?.horarios), 'Horarios no presentes en perfil');
  return 'Perfil incluye horarios publicos.';
});

await runPath('CUD15', 'fracaso', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: '/profesional/publico/999999/perfil',
    token: ctx.socioToken,
  });
  assert(response.status === 404, `Se esperaba 404 y llego ${response.status}`);
  return 'Perfil inexistente responde not found.';
});

await runPath('CUD16', 'exito', async () => {
  const response = await apiRequest({
    method: 'PUT',
    route: '/turnos/socio/ficha-salud',
    token: ctx.socioToken,
    body: {
      altura: 176,
      peso: 77,
      nivelActividadFisica: 'Intenso',
      alergias: ['Lactosa'],
      patologias: ['Hipotiroidismo'],
      objetivoPersonal: 'Definir',
    },
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Ficha de salud guardada correctamente.';
});

await runPath('CUD16', 'alternativo', async () => {
  const response = await apiRequest({
    method: 'PUT',
    route: '/turnos/socio/ficha-salud',
    token: ctx.socioToken,
    body: {
      altura: 176,
      peso: 76,
      nivelActividadFisica: 'Moderado',
      alergias: ['Lactosa'],
      patologias: ['Hipotiroidismo'],
      objetivoPersonal: 'Mantenimiento',
    },
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Actualizacion de ficha de salud aplicada.';
});

await runPath('CUD16', 'fracaso', async () => {
  const response = await apiRequest({
    method: 'PUT',
    route: '/turnos/socio/ficha-salud',
    token: ctx.socioToken,
    body: {
      altura: 50,
      peso: 76,
      nivelActividadFisica: 'Moderado',
      objetivoPersonal: 'Mantenimiento',
    },
  });
  assert(response.status === 400, `Se esperaba 400 y llego ${response.status}`);
  return 'Validacion de ficha invalida funcionando.';
});

await runPath('CUD17', 'exito', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: '/turnos/socio/mis-turnos',
    token: ctx.socioToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  assert(Array.isArray(data), 'Mis turnos no devolvio arreglo');
  return 'Listado de mis turnos disponible.';
});

await runPath('CUD17', 'alternativo', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: '/turnos/socio/mis-turnos?estado=PENDIENTE',
    token: ctx.socioToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return 'Filtro por estado aplicado en mis turnos.';
});

await runPath('CUD17', 'fracaso', async () => {
  const response = await apiRequest({
    method: 'GET',
    route: '/turnos/socio/mis-turnos',
  });
  assert(response.status === 401, `Se esperaba 401 y llego ${response.status}`);
  return 'Mis turnos protegido por autenticacion.';
});

await runPath('CUD18', 'exito', async () => {
  const fechaNueva = addDaysAR(6);
  const diaNuevo = weekdayFromDateAR(fechaNueva);
  await configurarAgenda(ctx.proAToken, ctx.proA.idPersona, [
    { dia: diaNuevo, horaInicio: '09:00', horaFin: '18:00', duracionTurno: 30 },
  ]);

  const response = await apiRequest({
    method: 'PATCH',
    route: `/turnos/socio/${ctx.turnos.reservaA}/reprogramar`,
    token: ctx.socioToken,
    body: {
      fechaTurno: fechaNueva,
      horaTurno: '17:00',
    },
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  assert(data?.estadoTurno === 'REPROGRAMADO', 'No quedo en estado REPROGRAMADO');
  return `Turno ${ctx.turnos.reservaA} reprogramado.`;
});

await runPath('CUD18', 'alternativo', async () => {
  const fecha = addDaysAR(7);
  const dia = weekdayFromDateAR(fecha);
  await configurarAgenda(ctx.proAToken, ctx.proA.idPersona, [
    { dia, horaInicio: '09:00', horaFin: '18:00', duracionTurno: 30 },
  ]);

  const reserva = await apiRequest({
    method: 'POST',
    route: '/turnos/socio/reservar',
    token: ctx.socioToken,
    body: {
      nutricionistaId: ctx.proA.idPersona,
      fechaTurno: fecha,
      horaTurno: '15:30',
    },
  });
  assert(is2xx(reserva.status), `No se pudo crear turno alternativo: ${reserva.status}`);
  const turnoId = unwrapData(reserva).idTurno;

  const reprogramado = await apiRequest({
    method: 'PATCH',
    route: `/turnos/socio/${turnoId}/reprogramar`,
    token: ctx.socioToken,
    body: {
      fechaTurno: fecha,
      horaTurno: '16:00',
    },
  });

  assert(is2xx(reprogramado.status), `Status inesperado: ${reprogramado.status}`);
  return `Turno ${turnoId} reprogramado en camino alternativo.`;
});

await runPath('CUD18', 'fracaso', async () => {
  const fechaHoy = addDaysAR(0);
  const hora = addMinutesAR(120);
  const turnoId = await insertTurno({
    socioId: ctx.socioPersonaId,
    nutricionistaId: ctx.proA.idPersona,
    fecha: fechaHoy,
    hora,
    estado: 'PENDIENTE',
  });

  const response = await apiRequest({
    method: 'PATCH',
    route: `/turnos/socio/${turnoId}/reprogramar`,
    token: ctx.socioToken,
    body: {
      fechaTurno: addDaysAR(1),
      horaTurno: '12:00',
    },
  });

  assert(response.status === 400, `Se esperaba 400 y llego ${response.status}`);
  return 'Reprogramacion con menos de 24h correctamente bloqueada.';
});

await runPath('CUD19', 'exito', async () => {
  const turnoId = await insertTurno({
    socioId: ctx.socioPersonaId,
    nutricionistaId: ctx.proA.idPersona,
    fecha: addDaysAR(9),
    hora: '10:00',
    estado: 'PENDIENTE',
  });

  const response = await apiRequest({
    method: 'PATCH',
    route: `/turnos/socio/${turnoId}/cancelar`,
    token: ctx.socioToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  assert(data?.estadoTurno === 'CANCELADO', 'No quedo en estado CANCELADO');
  return `Turno ${turnoId} cancelado correctamente.`;
});

await runPath('CUD19', 'alternativo', async () => {
  const turnoId = await insertTurno({
    socioId: ctx.socioPersonaId,
    nutricionistaId: ctx.proA.idPersona,
    fecha: addDaysAR(10),
    hora: '10:30',
    estado: 'PENDIENTE',
  });

  const response = await apiRequest({
    method: 'PATCH',
    route: `/turnos/socio/${turnoId}/cancelar`,
    token: ctx.socioToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return `Cancelacion alternativa sobre turno ${turnoId} exitosa.`;
});

await runPath('CUD19', 'fracaso', async () => {
  const turnoId = await insertTurno({
    socioId: ctx.socioPersonaId,
    nutricionistaId: ctx.proA.idPersona,
    fecha: addDaysAR(0),
    hora: addMinutesAR(180),
    estado: 'PENDIENTE',
  });

  const response = await apiRequest({
    method: 'PATCH',
    route: `/turnos/socio/${turnoId}/cancelar`,
    token: ctx.socioToken,
  });
  assert(response.status === 400, `Se esperaba 400 y llego ${response.status}`);
  return 'Cancelacion con menos de 24h correctamente rechazada.';
});

await runPath('CUD20', 'exito', async () => {
  const turnoId = await insertTurno({
    socioId: ctx.socioPersonaId,
    nutricionistaId: ctx.proA.idPersona,
    fecha: addDaysAR(0),
    hora: addMinutesAR(240),
    estado: 'PENDIENTE',
  });

  const response = await apiRequest({
    method: 'PATCH',
    route: `/turnos/socio/${turnoId}/confirmar`,
    token: ctx.socioToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  assert(data?.estadoTurno === 'CONFIRMADO', 'No quedo en estado CONFIRMADO');
  return `Turno ${turnoId} confirmado exitosamente.`;
});

await runPath('CUD20', 'alternativo', async () => {
  const turnoId = await insertTurno({
    socioId: ctx.socioPersonaId,
    nutricionistaId: ctx.proA.idPersona,
    fecha: addDaysAR(0),
    hora: addMinutesAR(300),
    estado: 'REPROGRAMADO',
  });

  const response = await apiRequest({
    method: 'PATCH',
    route: `/turnos/socio/${turnoId}/confirmar`,
    token: ctx.socioToken,
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  return `Turno reprogramado ${turnoId} confirmado.`;
});

await runPath('CUD20', 'fracaso', async () => {
  const turnoId = await insertTurno({
    socioId: ctx.socioPersonaId,
    nutricionistaId: ctx.proA.idPersona,
    fecha: addDaysAR(1),
    hora: '10:00',
    estado: 'PENDIENTE',
  });

  const response = await apiRequest({
    method: 'PATCH',
    route: `/turnos/socio/${turnoId}/confirmar`,
    token: ctx.socioToken,
  });
  assert(response.status === 400, `Se esperaba 400 y llego ${response.status}`);
  return 'Confirmacion fuera del dia rechazada.';
});

await runPath('CUD21', 'exito', async () => {
  const turnoId = await insertTurno({
    socioId: ctx.socioPersonaId,
    nutricionistaId: ctx.proA.idPersona,
    fecha: addDaysAR(-1),
    hora: '10:00',
    estado: 'CONFIRMADO',
  });

  const response = await apiRequest({
    method: 'PATCH',
    route: `/turnos/profesional/${ctx.proA.idPersona}/${turnoId}/asistencia`,
    token: ctx.proAToken,
    body: { asistio: true },
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  assert(data?.estadoTurno === 'REALIZADO', 'No quedo en estado REALIZADO');
  return `Asistencia REALIZADO registrada para turno ${turnoId}.`;
});

await runPath('CUD21', 'alternativo', async () => {
  const turnoId = await insertTurno({
    socioId: ctx.socioPersonaId,
    nutricionistaId: ctx.proA.idPersona,
    fecha: addDaysAR(-1),
    hora: '11:00',
    estado: 'CONFIRMADO',
  });

  const response = await apiRequest({
    method: 'PATCH',
    route: `/turnos/profesional/${ctx.proA.idPersona}/${turnoId}/asistencia`,
    token: ctx.proAToken,
    body: { asistio: false },
  });
  assert(is2xx(response.status), `Status inesperado: ${response.status}`);
  const data = unwrapData(response);
  assert(data?.estadoTurno === 'AUSENTE', 'No quedo en estado AUSENTE');
  return `Asistencia AUSENTE registrada para turno ${turnoId}.`;
});

await runPath('CUD21', 'fracaso', async () => {
  const turnoId = await insertTurno({
    socioId: ctx.socioPersonaId,
    nutricionistaId: ctx.proA.idPersona,
    fecha: addDaysAR(-1),
    hora: '12:00',
    estado: 'PENDIENTE',
  });

  const response = await apiRequest({
    method: 'PATCH',
    route: `/turnos/profesional/${ctx.proA.idPersona}/${turnoId}/asistencia`,
    token: ctx.proAToken,
    body: { asistio: true },
  });
  assert(response.status === 400, `Se esperaba 400 y llego ${response.status}`);
  return 'Asistencia en estado invalido correctamente bloqueada.';
});

for (const cud of Object.keys(resultados)) {
  const registro = resultados[cud];
  registro.listo = registro.exito.ok && registro.alternativo.ok && registro.fracaso.ok;
}

function renderEstado(ok) {
  return ok ? 'OK' : 'FALLA';
}

let markdown = '# Checklist por CU + ejecucion real\n\n';
markdown += `Fecha de ejecucion: ${new Date().toISOString()}\n\n`;
markdown += '| CU | Exito | Alternativo | Fracaso | Listo |\n';
markdown += '|---|---|---|---|---|\n';

for (const cud of Object.keys(checklist)) {
  const r = resultados[cud];
  markdown += `| ${cud} | ${renderEstado(r.exito.ok)} | ${renderEstado(r.alternativo.ok)} | ${renderEstado(r.fracaso.ok)} | ${r.listo ? 'SI' : 'NO'} |\n`;
}

markdown += '\n---\n';

for (const cud of Object.keys(checklist)) {
  const def = checklist[cud];
  const r = resultados[cud];

  markdown += `\n## ${cud} - ${r.listo ? 'LISTO' : 'NO LISTO'}\n\n`;
  markdown += '### Caso de exito\n';
  for (const step of def.exito) {
    markdown += `- ${step}\n`;
  }
  markdown += `- Resultado ejecucion: ${renderEstado(r.exito.ok)}\n`;
  markdown += `- Evidencia: ${r.exito.detalle}\n\n`;

  markdown += '### Camino alternativo\n';
  for (const step of def.alternativo) {
    markdown += `- ${step}\n`;
  }
  markdown += `- Resultado ejecucion: ${renderEstado(r.alternativo.ok)}\n`;
  markdown += `- Evidencia: ${r.alternativo.detalle}\n\n`;

  markdown += '### Camino de fracaso\n';
  for (const step of def.fracaso) {
    markdown += `- ${step}\n`;
  }
  markdown += `- Resultado ejecucion: ${renderEstado(r.fracaso.ok)}\n`;
  markdown += `- Evidencia: ${r.fracaso.detalle}\n`;
}

const outputPath = path.resolve(
  '..',
  'docs',
  'plans',
  '2026-02-17-checklist-ejecucion-cud01-21.md',
);

await fs.writeFile(outputPath, markdown, 'utf8');

console.log(`Checklist generado en: ${outputPath}`);
console.log(JSON.stringify(resultados, null, 2));

await db.end();
