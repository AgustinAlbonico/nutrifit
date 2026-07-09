# Credenciales seed de NutriFit

Contraseña universal de todos los usuarios seed: **`123456`**

---

## Seed principal — `seed-multi-tenant.ts`

Creado por `apps/backend/src/seed-multi-tenant.ts`. Siembra 3 gimnasios con superadmin, admins, recepcionistas, nutricionistas (fijos + demo) y socios (fijos + demo), más turnos demo, planes de alimentación y alimentos.

```bash
npm run seed:multi-tenant
# (desde apps/backend/)
```

### Gimnasios

| Gimnasio     | Email                | Teléfono       | Dirección        | Ciudad  |
|---|---|---|---|---|
| Gym Central  | `central@gym.com`    | `341-555-0001` | `Av. Central 1234` | Rosario |
| Gym Norte    | `norte@gym.com`      | `341-555-0002` | `Av. Norte 5678`   | Rosario |
| Gym Sur      | `sur@gym.com`        | `341-555-0003` | `Av. Sur 9012`     | Rosario |

### SUPERADMIN (global)

| Email                       | Contraseña |
|---|---|
| `superadmin@nutrifit.com`   | `123456`   |

### ADMIN

| Gimnasio    | Email                          |
|---|---|
| Gym Central | `admin-central@nutrifit.com`   |
| Gym Norte   | `admin-norte@nutrifit.com`     |
| Gym Sur     | `admin-sur@nutrifit.com`       |

### RECEPCIONISTA

| Gimnasio    | Email                             |
|---|---|
| Gym Central | `recepcion-central@nutrifit.com`  |
| Gym Norte   | `recepcion-norte@nutrifit.com`    |
| Gym Sur     | `recepcion-sur@nutrifit.com`      |

### NUTRICIONISTA originales (1 por gimnasio)

| Gimnasio    | Email                        | Matrícula  |
|---|---|---|
| Gym Central | `nutri-central@nutrifit.com` | `MN-2001`  |
| Gym Norte   | `nutri-norte@nutrifit.com`   | `MN-2002`  |
| Gym Sur     | `nutri-sur@nutrifit.com`     | `MN-2003`  |

### NUTRICIONISTA demo (30 — 10 por gimnasio)

| Gimnasio    | Email                          | Matrícula  |
|---|---|---|
| Gym Central | `nutri.demo.f0@gymcentral.com`  | `MN-5000`  |
| Gym Central | `nutri.demo.m1@gymcentral.com`  | `MN-5001`  |
| Gym Central | `nutri.demo.f2@gymcentral.com`  | `MN-5002`  |
| Gym Central | `nutri.demo.m3@gymcentral.com`  | `MN-5003`  |
| Gym Central | `nutri.demo.f4@gymcentral.com`  | `MN-5004`  |
| Gym Central | `nutri.demo.m5@gymcentral.com`  | `MN-5005`  |
| Gym Central | `nutri.demo.f6@gymcentral.com`  | `MN-5006`  |
| Gym Central | `nutri.demo.m7@gymcentral.com`  | `MN-5007`  |
| Gym Central | `nutri.demo.f8@gymcentral.com`  | `MN-5008`  |
| Gym Central | `nutri.demo.m9@gymcentral.com`  | `MN-5009`  |
| Gym Norte   | `nutri.demo.f10@gymnorte.com`   | `MN-5010`  |
| Gym Norte   | `nutri.demo.m11@gymnorte.com`   | `MN-5011`  |
| Gym Norte   | `nutri.demo.f12@gymnorte.com`   | `MN-5012`  |
| Gym Norte   | `nutri.demo.m13@gymnorte.com`   | `MN-5013`  |
| Gym Norte   | `nutri.demo.f14@gymnorte.com`   | `MN-5014`  |
| Gym Norte   | `nutri.demo.m15@gymnorte.com`   | `MN-5015`  |
| Gym Norte   | `nutri.demo.f16@gymnorte.com`   | `MN-5016`  |
| Gym Norte   | `nutri.demo.m17@gymnorte.com`   | `MN-5017`  |
| Gym Norte   | `nutri.demo.f18@gymnorte.com`   | `MN-5018`  |
| Gym Norte   | `nutri.demo.m19@gymnorte.com`   | `MN-5019`  |
| Gym Sur     | `nutri.demo.f20@gymsur.com`     | `MN-5020`  |
| Gym Sur     | `nutri.demo.m21@gymsur.com`     | `MN-5021`  |
| Gym Sur     | `nutri.demo.f22@gymsur.com`     | `MN-5022`  |
| Gym Sur     | `nutri.demo.m23@gymsur.com`     | `MN-5023`  |
| Gym Sur     | `nutri.demo.f24@gymsur.com`     | `MN-5024`  |
| Gym Sur     | `nutri.demo.m25@gymsur.com`     | `MN-5025`  |
| Gym Sur     | `nutri.demo.f26@gymsur.com`     | `MN-5026`  |
| Gym Sur     | `nutri.demo.m27@gymsur.com`     | `MN-5027`  |
| Gym Sur     | `nutri.demo.f28@gymsur.com`     | `MN-5028`  |
| Gym Sur     | `nutri.demo.m29@gymsur.com`     | `MN-5029`  |

### SOCIOS originales (3 por gimnasio)

| Gimnasio    | Email                          | DNI        |
|---|---|---|
| Gym Central | `socio1-central@nutrifit.com`  | `50001001` |
| Gym Central | `socio2-central@nutrifit.com`  | `50001002` |
| Gym Central | `socio3-central@nutrifit.com`  | `50001003` |
| Gym Norte   | `socio1-norte@nutrifit.com`    | `50002001` |
| Gym Norte   | `socio2-norte@nutrifit.com`    | `50002002` |
| Gym Norte   | `socio3-norte@nutrifit.com`    | `50002003` |
| Gym Sur     | `socio1-sur@nutrifit.com`      | `50003001` |
| Gym Sur     | `socio2-sur@nutrifit.com`      | `50003002` |
| Gym Sur     | `socio3-sur@nutrifit.com`      | `50003003` |

### SOCIOS demo (30 — 10 por gimnasio)

| Gimnasio    | Email                       | DNI        |
|---|---|---|
| Gym Central | `socio.m0@gymcentral.com`   | `51001000` |
| Gym Central | `socio.f1@gymcentral.com`   | `51001001` |
| Gym Central | `socio.m2@gymcentral.com`   | `51001002` |
| Gym Central | `socio.f3@gymcentral.com`   | `51001003` |
| Gym Central | `socio.m4@gymcentral.com`   | `51001004` |
| Gym Central | `socio.f5@gymcentral.com`   | `51001005` |
| Gym Central | `socio.m6@gymcentral.com`   | `51001006` |
| Gym Central | `socio.f7@gymcentral.com`   | `51001007` |
| Gym Central | `socio.m8@gymcentral.com`   | `51001008` |
| Gym Central | `socio.f9@gymcentral.com`   | `51001009` |
| Gym Norte   | `socio.m10@gymnorte.com`    | `51001010` |
| Gym Norte   | `socio.f11@gymnorte.com`    | `51001011` |
| Gym Norte   | `socio.m12@gymnorte.com`    | `51001012` |
| Gym Norte   | `socio.f13@gymnorte.com`    | `51001013` |
| Gym Norte   | `socio.m14@gymnorte.com`    | `51001014` |
| Gym Norte   | `socio.f15@gymnorte.com`    | `51001015` |
| Gym Norte   | `socio.m16@gymnorte.com`    | `51001016` |
| Gym Norte   | `socio.f17@gymnorte.com`    | `51001017` |
| Gym Norte   | `socio.m18@gymnorte.com`    | `51001018` |
| Gym Norte   | `socio.f19@gymnorte.com`    | `51001019` |
| Gym Sur     | `socio.m20@gymsur.com`      | `51001020` |
| Gym Sur     | `socio.f21@gymsur.com`      | `51001021` |
| Gym Sur     | `socio.m22@gymsur.com`      | `51001022` |
| Gym Sur     | `socio.m23@gymsur.com`      | `51001023` |
| Gym Sur     | `socio.f24@gymsur.com`      | `51001024` |
| Gym Sur     | `socio.m25@gymsur.com`      | `51001025` |
| Gym Sur     | `socio.f26@gymsur.com`      | `51001026` |
| Gym Sur     | `socio.f27@gymsur.com`      | `51001027` |
| Gym Sur     | `socio.m28@gymsur.com`      | `51001028` |
| Gym Sur     | `socio.f29@gymsur.com`      | `51001029` |

### SOCIOS adicionales (Gym Central)

| Email                             | DNI         | Nota              |
|---|---|---|
| `agusalbo2024@gmail.com`          | `12312312`  | Creado manualmente |
| `test-socio@nutrifit.com`         | `41234567`  | Para pruebas       |
| `socio-test-e2e@nutrifit.com`     | `77777001`  | Para tests E2E     |

### NUTRICIONISTA con historial evolutivo

| Gimnasio    | Email                           | Matrícula  |
|---|---|---|
| Gym Central | `nutri-evolucion@nutrifit.com`  | `MN-3001`  |

Atiende al socio `martin-evolucion@nutrifit.com` con 11 turnos REALIZADOS con mediciones completas.

### SOCIO con historial evolutivo

| Gimnasio    | Email                          | DNI        | Género     | Altura  |
|---|---|---|---|---|
| Gym Central | `martin-evolucion@nutrifit.com` | `50004001` | MASCULINO  | 175 cm  |

**Datos:** 11 turnos REALIZADOS entre `2026-01-12` y `2026-06-01` (uno cada ~2 semanas) con observaciones clínicas, sugerencias, hábitos y mediciones completas (peso, perímetros de cintura/cadera/brazo/muslo/pecho, pliegues, %grasa, masa magra, tensión arterial, frecuencia cardíaca). Atendido por `nutri-evolucion@nutrifit.com`.

**Ideal para probar:**
- Progreso longitudinal (`/profesional/paciente/:id/progreso`) con curva real de 5 meses, KPIs, deltas y Riesgo Cardiovascular bajando de Moderado a Bajo.
- Gráficos de evolución (peso, perímetros, composición corporal) con datos para todos los puntos del eje X.
- Tabla de evolución con columna Pecho incluida.
- Comparador de fotos de progreso.
- Ficha del paciente (`/profesional/paciente/:id/ficha`) con historial de consultas y galería.

---

## Seed El Cid — `seed-el-cid.ts`

Seed **independiente** para el gimnasio "El Cid". Creado por `apps/backend/src/seed-el-cid.ts`.

No modifica los gimnasios del seed principal. Se puede correr en cualquier momento:

```bash
npm run seed:el-cid
# (desde apps/backend/)
```

> **Idempotencia:** el gimnasio, nutricionistas y socios se upsertan (no duplican si se corre varias veces). Los turnos **sí se acumulan** en cada ejecución.

### Gimnasio

| Nombre | Dirección           | Teléfono        | Email                   | Ciudad  |
|---|---|---|---|---|
| El Cid | `Av. Pellegrini 1800` | `341-555-7000` | `contacto@elcidgym.com` | Rosario |

### Nutricionistas

| # | Nombre       | Apellido  | Email                    | Matrícula   | Especialidad                                                         | Agenda                                  |
|---|---|---|---|---|---|---|
| 1 | **Martín**   | Giménez   | `nutri-cid1@nutrifit.com` | `MN-6001` | Nutrición deportiva, rendimiento y recomposición corporal           | Lu–Vie 09–13 (turnos 60 min)            |
| 2 | **Carolina** | Vega      | `nutri-cid2@nutrifit.com` | `MN-6002` | Nutrición clínica, patologías crónicas y control de peso            | Lu–Mi–Vie 14–19 (turnos 45 min)         |
| 3 | **Federico** | Linares   | `nutri-cid3@nutrifit.com` | `MN-6003` | Salud digestiva, planes personalizados y alimentación deportiva     | Ma–Jue 08–12, Sáb 09–13 (turnos 30 min)|

### Socios por nutricionista

#### Grupo de **Martín Giménez** (nutri-cid1)

| # | Nombre     | Apellido  | Email                     | DNI        | Género     | Teléfono        | Dirección      | ¿Tiene plan? |
|---|---|---|---|---|---|---|---|---|
| A | Lucas      | Mendoza   | `socio-cid-a@nutrifit.com` | `60001001` | MASCULINO | `341-555-7101` | San Juan 850    | ✅ Sí |
| B | Florencia  | Rivas     | `socio-cid-b@nutrifit.com` | `60001002` | FEMENINO  | `341-555-7102` | Córdoba 1234    | ❌ No |
| C | Tomás      | Sosa      | `socio-cid-c@nutrifit.com` | `60001003` | MASCULINO | `341-555-7103` | Mitre 567       | ❌ No |

#### Grupo de **Carolina Vega** (nutri-cid2)

| # | Nombre     | Apellido  | Email                     | DNI        | Género    | Teléfono        | Dirección        | ¿Tiene plan? |
|---|---|---|---|---|---|---|---|---|
| D | Sofía      | Peralta   | `socio-cid-d@nutrifit.com` | `60002001` | FEMENINO | `341-555-7201` | Santa Fe 980      | ✅ Sí |
| E | Gabriel    | Álvarez   | `socio-cid-e@nutrifit.com` | `60002002` | MASCULINO | `341-555-7202` | Rioja 345        | ❌ No |
| F | Valentina  | Castillo  | `socio-cid-f@nutrifit.com` | `60002003` | FEMENINO | `341-555-7203` | Entre Ríos 210   | ❌ No |

#### Grupo de **Federico Linares** (nutri-cid3)

| # | Nombre     | Apellido  | Email                     | DNI        | Género    | Teléfono        | Dirección           | ¿Tiene plan? |
|---|---|---|---|---|---|---|---|---|
| G | Mateo      | Delgado   | `socio-cid-g@nutrifit.com` | `60003001` | MASCULINO | `341-555-7301` | Buenos Aires 1500  | ✅ Sí |
| H | Camila     | Navarro   | `socio-cid-h@nutrifit.com` | `60003002` | FEMENINO | `341-555-7302` | San Martín 780      | ❌ No |
| I | Sebastián  | Moreno    | `socio-cid-i@nutrifit.com` | `60003003` | MASCULINO | `341-555-7303` | Belgrano 420        | ❌ No |

### Turnos por socio

Cada uno de los 9 socios tiene **4 turnos REALIZADOS** con su nutricionista asignado:

| Estado      | Cantidad        | Época                                    |
|---|---|---|
| `REALIZADO` | 3 por socio     | Pasados (~60, ~40, ~20 días antes del seed) |
| `REALIZADO` | 1 por socio     | Futuro próximo (~7–21 días después del seed, pero estado REALIZADO igual) |

**Total:** 36 turnos (todos REALIZADOS). Cada turno REALIZADO incluye observación clínica + mediciones coherentes (peso, IMC, perímetros, pliegues, %grasa, masa magra, tensión arterial).

> ⚠️ El 4° turno tiene fecha futura pero se inserta con estado `REALIZADO` — no es un turno CONFIRMADO. Si necesitás un turno CONFIRMADO real, crearlo manualmente.

### Planes de alimentación (3 total, uno por grupo)

| Nutricionista  | Socio                              | Objetivo del plan                                                                  |
|---|---|---|
| Martín Giménez | Lucas Mendoza (`socio-cid-a`)      | Reducir peso corporal y disminuir porcentaje de grasa manteniendo masa muscular    |
| Carolina Vega  | Sofía Peralta (`socio-cid-d`)      | Plan de recomposición corporal con aumento de proteínas y control de hidratos      |
| Federico Linares | Mateo Delgado (`socio-cid-g`)    | Plan de mantenimiento con enfoque en alimentación intuitiva y hábitos sostenibles  |

Cada plan tiene 7 días (lunes a domingo) con 4 comidas cada día (desayuno, almuerzo, merienda, cena).

### Para qué sirve este seed

- **Módulo de turnos:** probar visualización de historial de turnos REALIZADOS, filtros por estado, cancelación, y creación de nuevos turnos.
- **Módulo de planes de alimentación:** probar visualización de plan activo por socio, estructura de días y comidas, y diferenciación entre socios con plan y sin plan.
- **Multi-gimnasio:** verificar que el aislamiento por gimnasio funciona (un admin de Gym Central no ve datos de El Cid ni viceversa).

---

## Seed fotos de progreso — `seed-martin-evolucion-fotos.ts`

Script auxiliar que corre **sobre los datos ya existentes** del socio `martin-evolucion@nutrifit.com` en Gym Central. Descarga imágenes de Wikimedia Commons y las sube a MinIO asociadas a cada turno del historial evolutivo.

**Requiere:** que `seed-multi-tenant.ts` ya haya corrido (necesita que exista `martin-evolucion@nutrifit.com` con sus turnos).

```bash
npm run seed:martin-fotos
# (desde apps/backend/)
```

---

## Resumen de scripts

| Comando (desde `apps/backend/`)     | Qué hace                                          |
|---|---|
| `npm run seed:multi-tenant`          | Seed principal: 3 gimnasios + todos los usuarios  |
| `npm run seed:el-cid`                | Seed independiente para El Cid                    |
| `npm run seed:martin-fotos`          | Sube fotos de progreso para `martin-evolucion`    |
