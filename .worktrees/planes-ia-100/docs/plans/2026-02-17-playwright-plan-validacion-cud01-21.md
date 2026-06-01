# Planificacion Playwright - Validacion integral de CUD01-CUD21

## 1) Objetivo

Definir un plan ejecutable para validar con Playwright que todos los casos de uso (CUD01 a CUD21) funcionen correctamente en flujo real de sistema (frontend + backend).

## 2) Alcance

Incluye:

- Pruebas E2E por actor (Asistente, Profesional, Socio).
- Flujo principal y alternativos criticos por cada CU.
- Verificacion de reglas de negocio (roles, estados, 24h, disponibilidad, ownership).

No incluye:

- Performance testing de carga.
- Pentesting profundo.

## 3) Estado actual base para pruebas

Estado del backend luego de implementacion:

- CUD01-CUD05: gestion de profesionales (admin).
- CUD06-CUD12 + CUD21: agenda profesional, pacientes, ficha/historial, asignacion manual, asistencia.
- CUD13-CUD20: discovery/reserva/gestion/confirmacion de turnos para socio.

Nota:

- Actualmente no existe infraestructura Playwright en el frontend. Este plan incluye el bootstrap tecnico para instalarla.

## 4) Preparacion tecnica (fase de setup)

Paso 1 - Instalar Playwright en frontend:

```bash
cd nutrifit-supervisor-frontend
npm i -D @playwright/test
npx playwright install
```

Paso 2 - Crear archivos base:

- `nutrifit-supervisor-frontend/playwright.config.ts`
- `nutrifit-supervisor-frontend/tests/e2e/`
- `nutrifit-supervisor-frontend/tests/e2e/fixtures/`
- `nutrifit-supervisor-frontend/tests/e2e/helpers/`

Paso 3 - Agregar scripts npm:

- `test:e2e`
- `test:e2e:ui`
- `test:e2e:headed`
- `test:e2e:report`

Paso 4 - Configurar entorno de test:

- Frontend base URL (ej: `http://localhost:5173`).
- Backend API URL (ej: `http://localhost:3000`).
- Credenciales seed para roles: `ADMIN`, `NUTRICIONISTA`, `SOCIO`.

Paso 5 - Estado por rol reutilizable:

- `storageState.admin.json`
- `storageState.profesional.json`
- `storageState.socio.json`

## 5) Estrategia de ejecucion

Orden recomendado de suites:

1. Suite Asistente (CUD01-CUD05).
2. Suite Profesional (CUD06-CUD12 + CUD21).
3. Suite Socio (CUD13-CUD20).
4. Suite de regresion cruzada (escenarios end-to-end completos).

Politica de datos:

- Cada spec crea sus datos base por API helper (siempre que sea posible).
- Cada spec limpia lo generado (teardown) o usa prefijos unicos por corrida.

## 6) Matriz de pruebas por caso de uso

## 6.1 Asistente

- **CUD01 - Gestionar profesionales**
  - Flujo principal: entra al modulo y navega a alta/edicion/suspension/listado.
  - Alternativo: intenta acceso con rol no autorizado y verifica bloqueo.

- **CUD02 - Registrar profesional**
  - Principal: alta valida completa.
  - Alternativos: email duplicado, DNI duplicado, campos invalidos.

- **CUD03 - Modificar profesional**
  - Principal: modifica datos y persiste.
  - Alternativo: validacion de formato invalido.

- **CUD04 - Suspender profesional**
  - Principal: suspension sin turnos futuros.
  - Alternativo: bloqueo de suspension con turnos futuros.

- **CUD05 - Ver listado de profesionales**
  - Principal: filtro por nombre/estado/especialidad.
  - Alternativo: sin resultados.

## 6.2 Profesional

- **CUD06 - Gestionar agenda (hub)**
  - Principal: acceso al panel y navegacion a submodulos.

- **CUD07 - Ver turnos del dia**
  - Principal: listado de hoy con filtros.
  - Alternativo: sin turnos.

- **CUD08 - Ver pacientes**
  - Principal: listado de pacientes vinculados.
  - Alternativo: profesional sin pacientes.

- **CUD09 - Ver ficha de salud**
  - Principal: acceso permitido a paciente vinculado.
  - Alternativo: acceso denegado a paciente no vinculado.

- **CUD10 - Ver historial de consultas**
  - Principal: historial con datos en orden cronologico.
  - Alternativo: historial vacio.

- **CUD11 - Configurar horario de atencion**
  - Principal: configura agenda valida.
  - Alternativos: rango invalido, solapamiento.

- **CUD12 - Asignar turno manual**
  - Principal: asignacion valida con notificacion interna esperada.
  - Alternativos: horario ocupado, fecha pasada, fuera de agenda.

- **CUD21 - Registrar asistencia**
  - Principal: marca REALIZADO / AUSENTE.
  - Alternativos: intento antes de horario, estado no confirmado.

## 6.3 Socio

- **CUD13 - Ver lista de profesionales**
  - Principal: solo activos, filtros por nombre/especialidad.

- **CUD14 - Solicitar turno**
  - Principal: reserva valida.
  - Alternativos: horario no disponible, fecha pasada, duplicado mismo dia.

- **CUD15 - Ver perfil profesional**
  - Principal: visualiza perfil y horarios.

- **CUD16 - Cargar ficha de salud**
  - Principal: alta de ficha y continuidad al flujo de reserva.
  - Alternativo: validaciones de campos.

- **CUD17 - Ver mis turnos**
  - Principal: listado con filtros y estados.

- **CUD18 - Reprogramar turno**
  - Principal: reprograma turno pendiente.
  - Alternativos: regla 24h, sin disponibilidad.

- **CUD19 - Cancelar turno**
  - Principal: cancela turno pendiente.
  - Alternativos: regla 24h, estado no permitido.

- **CUD20 - Confirmar turno**
  - Principal: confirma turno del dia antes de hora.
  - Alternativos: fuera de dia, fuera de ventana horaria.

## 7) Casos transversales obligatorios

1. Control de rol: cada ruta protegida valida autorizacion.
2. Ownership:
   - Profesional no puede operar con `nutricionistaId` de otro profesional.
   - Socio no puede operar turnos de otro socio.
3. Integridad de estados de turno:
   - PENDIENTE -> CONFIRMADO -> REALIZADO/AUSENTE
   - PENDIENTE -> CANCELADO
   - PENDIENTE -> REPROGRAMADO
4. Regla 24h en cancelacion/reprogramacion.

## 8) Arquitectura de testing recomendada

## 8.1 Estructura de specs

```text
tests/e2e/
  asistente/
    cud01-05.spec.ts
  profesional/
    cud06-12-21.spec.ts
  socio/
    cud13-20.spec.ts
  regresion/
    flujo-integral.spec.ts
```

## 8.2 Fixtures

- Fixture de autenticacion por rol (login API + storage state).
- Fixture de datos base (profesionales, socios, agendas, turnos).
- Fixture de limpieza por prefijo de corrida.

## 8.3 Helpers API

- `crearProfesional()`
- `configurarAgenda()`
- `crearSocio()`
- `crearFichaSaludSocio()`
- `crearTurno()`
- `cambiarEstadoTurno()`

## 9) Criterios de aceptacion de la validacion E2E

Se considera validado cuando:

1. 100% de specs CUD corren en CI sin fallos.
2. Cada CU tiene al menos 1 escenario principal y 1 alternativo critico.
3. No hay flaky tests en 3 corridas consecutivas.
4. Se genera reporte HTML y artefactos (video/screenshot/trace) para fallas.

## 10) Plan de ejecucion por fases

Fase 1 (base tecnica):

- Setup Playwright + fixtures + login por rol.

Fase 2 (alto riesgo funcional):

- CUD11, CUD12, CUD14, CUD18, CUD19, CUD21.

Fase 3 (cobertura total):

- Completar CUD01-CUD10 y CUD13-CUD20 restantes.

Fase 4 (regresion y estabilidad):

- Flujo integral multi-actor y corrida repetida anti-flaky.

## 11) Comando objetivo final

```bash
cd nutrifit-supervisor-frontend
npm run test:e2e
```

## 12) Resultado esperado

Al finalizar esta planificacion, vas a tener una suite E2E trazable por CU que permite confirmar objetivamente que el sistema cumple CUD01-CUD21 con evidencia automatizada.
