# Credenciales seed de NutriFit

Este archivo resume las credenciales cargadas por `apps/backend/src/seed-multi-tenant.ts` para que puedas probar autenticación, roles y aislamiento por gimnasio rápido.

## Acceso rápido

1. Levantá backend y frontend.
2. Iniciá sesión con cualquiera de los usuarios de abajo.
3. Verificá rol, permisos y datos por gimnasio según la cuenta usada.

## Regla general

- **Contraseña de todos los usuarios seed:** `123456`
- **Archivo fuente:** `apps/backend/src/seed-multi-tenant.ts`
- **Gimnasios creados:** Gym Central, Gym Norte, Gym Sur
- **Recepcionistas:** 1 por gimnasio.

## Gimnasios seed

| Gimnasio | Email | Teléfono | Dirección |
|---|---|---|---|
| Gym Central | `central@gym.com` | `341-555-0001` | `Av. Central 1234` |
| Gym Norte | `norte@gym.com` | `341-555-0002` | `Av. Norte 5678` |
| Gym Sur | `sur@gym.com` | `341-555-0003` | `Av. Sur 9012` |

## Usuarios seed

### SUPERADMIN

| Rol | Gimnasio | Email | Contraseña |
|---|---|---|---|
| SUPERADMIN | Global | `superadmin@nutrifit.com` | `123456` |

### ADMIN

| Rol | Gimnasio | Email | Contraseña |
|---|---|---|---|
| ADMIN | Gym Central | `admin-central@nutrifit.com` | `123456` |
| ADMIN | Gym Norte | `admin-norte@nutrifit.com` | `123456` |
| ADMIN | Gym Sur | `admin-sur@nutrifit.com` | `123456` |

### RECEPCIONISTA

| Rol | Gimnasio | Email | Contraseña |
|---|---|---|---|
| RECEPCIONISTA | Gym Central | `recepcion-central@nutrifit.com` | `123456` |
| RECEPCIONISTA | Gym Norte | `recepcion-norte@nutrifit.com` | `123456` |
| RECEPCIONISTA | Gym Sur | `recepcion-sur@nutrifit.com` | `123456` |

### NUTRICIONISTA originales

| Gimnasio | Email | Matrícula |
|---|---|---|
| Gym Central | `nutri-central@nutrifit.com` | `MN-2001` |
| Gym Norte | `nutri-norte@nutrifit.com` | `MN-2002` |
| Gym Sur | `nutri-sur@nutrifit.com` | `MN-2003` |

### NUTRICIONISTA demo (30 — 10 por gimnasio)

| Gimnasio | Email | Matrícula |
|---|---|---|
| Gym Central | `nutri.demo.f0@gymcentral.com` | `MN-5000` |
| Gym Central | `nutri.demo.m1@gymcentral.com` | `MN-5001` |
| Gym Central | `nutri.demo.f2@gymcentral.com` | `MN-5002` |
| Gym Central | `nutri.demo.m3@gymcentral.com` | `MN-5003` |
| Gym Central | `nutri.demo.f4@gymcentral.com` | `MN-5004` |
| Gym Central | `nutri.demo.m5@gymcentral.com` | `MN-5005` |
| Gym Central | `nutri.demo.f6@gymcentral.com` | `MN-5006` |
| Gym Central | `nutri.demo.m7@gymcentral.com` | `MN-5007` |
| Gym Central | `nutri.demo.f8@gymcentral.com` | `MN-5008` |
| Gym Central | `nutri.demo.m9@gymcentral.com` | `MN-5009` |
| Gym Norte | `nutri.demo.f10@gymnorte.com` | `MN-5010` |
| Gym Norte | `nutri.demo.m11@gymnorte.com` | `MN-5011` |
| Gym Norte | `nutri.demo.f12@gymnorte.com` | `MN-5012` |
| Gym Norte | `nutri.demo.m13@gymnorte.com` | `MN-5013` |
| Gym Norte | `nutri.demo.f14@gymnorte.com` | `MN-5014` |
| Gym Norte | `nutri.demo.m15@gymnorte.com` | `MN-5015` |
| Gym Norte | `nutri.demo.f16@gymnorte.com` | `MN-5016` |
| Gym Norte | `nutri.demo.m17@gymnorte.com` | `MN-5017` |
| Gym Norte | `nutri.demo.f18@gymnorte.com` | `MN-5018` |
| Gym Norte | `nutri.demo.m19@gymnorte.com` | `MN-5019` |
| Gym Sur | `nutri.demo.f20@gymsur.com` | `MN-5020` |
| Gym Sur | `nutri.demo.m21@gymsur.com` | `MN-5021` |
| Gym Sur | `nutri.demo.f22@gymsur.com` | `MN-5022` |
| Gym Sur | `nutri.demo.m23@gymsur.com` | `MN-5023` |
| Gym Sur | `nutri.demo.f24@gymsur.com` | `MN-5024` |
| Gym Sur | `nutri.demo.m25@gymsur.com` | `MN-5025` |
| Gym Sur | `nutri.demo.f26@gymsur.com` | `MN-5026` |
| Gym Sur | `nutri.demo.m27@gymsur.com` | `MN-5027` |
| Gym Sur | `nutri.demo.f28@gymsur.com` | `MN-5028` |
| Gym Sur | `nutri.demo.m29@gymsur.com` | `MN-5029` |

### SOCIOS originales

| Gimnasio | Email | DNI |
|---|---|---|
| Gym Central | `socio1-central@nutrifit.com` | `50001001` |
| Gym Central | `socio2-central@nutrifit.com` | `50001002` |
| Gym Central | `socio3-central@nutrifit.com` | `50001003` |
| Gym Norte | `socio1-norte@nutrifit.com` | `50002001` |
| Gym Norte | `socio2-norte@nutrifit.com` | `50002002` |
| Gym Norte | `socio3-norte@nutrifit.com` | `50002003` |
| Gym Sur | `socio1-sur@nutrifit.com` | `50003001` |
| Gym Sur | `socio2-sur@nutrifit.com` | `50003002` |
| Gym Sur | `socio3-sur@nutrifit.com` | `50003003` |

### SOCIOS demo (30 — 10 por gimnasio)

| Gimnasio | Email | DNI |
|---|---|---|
| Gym Central | `socio.m0@gymcentral.com` | `51001000` |
| Gym Central | `socio.f1@gymcentral.com` | `51001001` |
| Gym Central | `socio.m2@gymcentral.com` | `51001002` |
| Gym Central | `socio.f3@gymcentral.com` | `51001003` |
| Gym Central | `socio.m4@gymcentral.com` | `51001004` |
| Gym Central | `socio.f5@gymcentral.com` | `51001005` |
| Gym Central | `socio.m6@gymcentral.com` | `51001006` |
| Gym Central | `socio.f7@gymcentral.com` | `51001007` |
| Gym Central | `socio.m8@gymcentral.com` | `51001008` |
| Gym Central | `socio.f9@gymcentral.com` | `51001009` |
| Gym Norte | `socio.m10@gymnorte.com` | `51001010` |
| Gym Norte | `socio.f11@gymnorte.com` | `51001011` |
| Gym Norte | `socio.m12@gymnorte.com` | `51001012` |
| Gym Norte | `socio.f13@gymnorte.com` | `51001013` |
| Gym Norte | `socio.m14@gymnorte.com` | `51001014` |
| Gym Norte | `socio.f15@gymnorte.com` | `51001015` |
| Gym Norte | `socio.m16@gymnorte.com` | `51001016` |
| Gym Norte | `socio.f17@gymnorte.com` | `51001017` |
| Gym Norte | `socio.m18@gymnorte.com` | `51001018` |
| Gym Norte | `socio.f19@gymnorte.com` | `51001019` |
| Gym Sur | `socio.m20@gymsur.com` | `51001020` |
| Gym Sur | `socio.f21@gymsur.com` | `51001021` |
| Gym Sur | `socio.m22@gymsur.com` | `51001022` |
| Gym Sur | `socio.f23@gymsur.com` | `51001023` |
| Gym Sur | `socio.m24@gymsur.com` | `51001024` |
| Gym Sur | `socio.f25@gymsur.com` | `51001025` |
| Gym Sur | `socio.m26@gymsur.com` | `51001026` |
| Gym Sur | `socio.f27@gymsur.com` | `51001027` |
| Gym Sur | `socio.m28@gymsur.com` | `51001028` |
| Gym Sur | `socio.f29@gymsur.com` | `51001029` |

### SOCIOS adicionales (fuera del seed principal)

| Gimnasio | Email | DNI |
|---|---|---|
| Gym Central | `agusalbo2024@gmail.com` | `12312312` |
| Gym Central | `test-socio@nutrifit.com` | `41234567` |
| Gym Central | `socio-test-e2e@nutrifit.com` | `77777001` |


## Qué conviene probar con cada cuenta

| Cuenta | Ideal para probar |
|---|---|
| `superadmin@nutrifit.com` | acceso global, impersonación, multi-tenant |
| `admin-central@nutrifit.com` | administración de Gym Central |
| `admin-norte@nutrifit.com` | administración de Gym Norte |
| `admin-sur@nutrifit.com` | administración de Gym Sur |
| `nutri-*@nutrifit.com` | agenda, turnos, pacientes, clínica |
| `socio-*@nutrifit.com` | catálogo de nutricionistas, reservas, progreso, planes |
| `recepcion-*@nutrifit.com` | gestión de socios, nutricionistas y turnos en el gimnasio |
| `nutri.demo.*@gym*.com` | catalogo nutricionistas con datos variados, agendas, tarifas |

## Siguiente paso

Si querés re-sembrar la base, corré:

```bash
npm run db:seed
```
