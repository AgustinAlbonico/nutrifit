# Plan integral de pruebas - Todo lo implementado en esta conversacion

## 1) Objetivo

Validar end-to-end y por API todo lo que implementamos en esta conversacion, asegurando:

- cumplimiento funcional de CUD01-CUD21,
- seguridad por rol/ownership,
- consistencia de estados de turno,
- manejo de fecha y hora en Argentina (GMT-3) para guardar/mostrar.

## 2) Alcance exacto a testear

### Backend

Cobertura implementada y a validar:

- Gestion de profesionales (CUD01-CUD05).
- Agenda profesional y atencion (CUD06-CUD12, CUD21).
- Flujos socio de busqueda/reserva/gestion/confirmacion (CUD13-CUD20).
- Guard de ownership para profesional en rutas con `:nutricionistaId`.
- Normalizacion horaria Argentina en logica y respuestas de turnos.

### Frontend

Cobertura implementada y a validar:

- Pantallas actuales (login, dashboard, nutricionistas, permisos).
- Formateo de fechas en Argentina en vistas donde aplica.
- Consumo correcto de endpoints nuevos cuando se incorporen pantallas faltantes.

## 3) Enfoque de testing (Playwright-first)

Vamos a usar Playwright como orquestador principal con dos tipos de suite:

1. **UI E2E** (cuando hay pantalla implementada).
2. **API E2E con Playwright request context** (para CU sin pantalla aun, pero con endpoint listo).

Esto permite testear todos los CU ahora, sin esperar que toda la UI este terminada.

## 4) Preparacion tecnica

1. Instalar Playwright en frontend y navegadores.
2. Crear `playwright.config.ts` y carpeta `tests/e2e`.
3. Crear fixtures de autenticacion por rol:
   - admin
   - profesional
   - socio
4. Crear helper API para:
   - login
   - alta de profesional/socio
   - configuracion de agenda
   - creacion y mutacion de turnos
5. Definir prefijo unico por corrida para evitar colisiones de datos.

## 5) Matriz de pruebas por CU

| CU | Cobertura Playwright | Casos minimos obligatorios |
|---|---|---|
| CUD01 | UI + API | acceso al modulo + bloqueo por rol no autorizado |
| CUD02 | UI + API | alta valida + duplicado DNI/email |
| CUD03 | UI + API | edicion valida + formato invalido |
| CUD04 | UI + API | suspension valida + bloqueo con turnos futuros |
| CUD05 | UI + API | filtros + sin resultados |
| CUD06 | API | acceso al hub de agenda y navegacion funcional |
| CUD07 | API | listado de turnos del dia + filtros + estado vacio |
| CUD08 | API | listado de pacientes vinculados + sin pacientes |
| CUD09 | API | ficha permitida + denegada por no vinculo |
| CUD10 | API | historial con datos + historial vacio |
| CUD11 | API | configuracion valida + solapamiento/rango invalido |
| CUD12 | API | asignacion manual valida + horario ocupado/fuera de agenda |
| CUD13 | API (UI cuando exista) | listado de profesionales activos + filtros |
| CUD14 | API | reserva valida + sin disponibilidad + duplicado mismo dia |
| CUD15 | API (UI cuando exista) | ver perfil publico con horarios |
| CUD16 | API | alta/modificacion de ficha salud + validaciones |
| CUD17 | API | listado de mis turnos + filtros por estado/fecha/profesional |
| CUD18 | API | reprogramacion valida + regla 24h + sin disponibilidad |
| CUD19 | API | cancelacion valida + regla 24h + estado no permitido |
| CUD20 | API | confirmacion valida en dia del turno + fuera de ventana |
| CUD21 | API | REALIZADO/AUSENTE + bloqueo antes de hora/estado invalido |

## 6) Suite transversal obligatoria

### 6.1 Seguridad y ownership

- Profesional A no puede operar endpoints con `nutricionistaId` de Profesional B.
- Socio A no puede cancelar/reprogramar/confirmar turnos de Socio B.
- Roles incorrectos reciben 403 en rutas protegidas.

### 6.2 Estados de turno

Validar transiciones esperadas:

- `PENDIENTE -> CONFIRMADO`
- `PENDIENTE -> CANCELADO`
- `PENDIENTE -> REPROGRAMADO`
- `CONFIRMADO -> REALIZADO`
- `CONFIRMADO -> AUSENTE`

Bloquear transiciones no validas (doble confirmacion, asistencia antes de hora, etc.).

### 6.3 Fecha/hora Argentina (GMT-3)

Checks obligatorios en todos los CU de turnos:

1. Fecha guardada en backend interpretando input como Argentina.
2. Hora guardada consistente con agenda y reglas de disponibilidad.
3. Respuestas API devuelven fecha/hora en formato Argentina (`YYYY-MM-DD`, `HH:mm`).
4. Casos borde:
   - turno de hoy cerca de medianoche,
   - validacion 24h para cancelar/reprogramar,
   - confirmacion solo el dia del turno.

## 7) Orden de implementacion de tests

1. Setup base Playwright + fixtures auth.
2. Suite Asistente (CUD01-CUD05).
3. Suite Profesional agenda/pacientes (CUD06-CUD12, CUD21).
4. Suite Socio turnos/ficha (CUD13-CUD20).
5. Suites transversales (ownership + timezone + estados).
6. Regresion integral multi-actor.

## 8) Estructura de archivos recomendada

```text
nutrifit-supervisor-frontend/tests/e2e/
  fixtures/
    auth.fixture.ts
    datos.fixture.ts
  helpers/
    api.helper.ts
    fechas.helper.ts
  asistente/
    cud01-05.spec.ts
  profesional/
    cud06-12-21.spec.ts
  socio/
    cud13-20.spec.ts
  transversal/
    ownership.spec.ts
    timezone-gmt-3.spec.ts
    estados-turno.spec.ts
  regresion/
    flujo-completo.spec.ts
```

## 9) Criterios de salida (Definition of Done de testing)

Se considera validado cuando:

1. Todos los CU (01-21) tienen al menos 1 caso principal + 1 alternativo critico ejecutado.
2. Suites transversales (ownership, estados, GMT-3) pasan completas.
3. 0 flaky tests en 3 corridas consecutivas.
4. Reporte HTML de Playwright generado con trazas para fallos.
5. Build backend/frontend en verde antes de cada corrida E2E.

## 10) Comandos de ejecucion objetivo

```bash
# Backend
cd nutrifit-supervisor-backend
npm run build
npm test -- --runInBand --passWithNoTests

# Frontend
cd ../nutrifit-supervisor-frontend
npm run typecheck
npm run lint
npm run build
npm test

# E2E Playwright (cuando este instalado/configurado)
npx playwright test
npx playwright show-report
```

## 11) Entregable esperado

Una suite Playwright trazable por CU, con evidencia automatizada de que todo lo implementado en esta conversacion funciona correctamente y respeta reglas funcionales + horarias de Argentina.
