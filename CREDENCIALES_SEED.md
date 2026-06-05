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
- **Importante:** este seed **no crea recepcionistas**.

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

### NUTRICIONISTA

| Rol | Gimnasio | Email | Contraseña | Matrícula |
|---|---|---|---|---|
| NUTRICIONISTA | Gym Central | `nutri-central@nutrifit.com` | `123456` | `MN-2001` |
| NUTRICIONISTA | Gym Norte | `nutri-norte@nutrifit.com` | `123456` | `MN-2002` |
| NUTRICIONISTA | Gym Sur | `nutri-sur@nutrifit.com` | `123456` | `MN-2003` |

### SOCIOS

| Rol | Gimnasio | Email | Contraseña | DNI |
|---|---|---|---|---|
| SOCIO | Gym Central | `socio1-central@nutrifit.com` | `123456` | `50001001` |
| SOCIO | Gym Central | `socio2-central@nutrifit.com` | `123456` | `50001002` |
| SOCIO | Gym Central | `socio3-central@nutrifit.com` | `123456` | `50001003` |
| SOCIO | Gym Norte | `socio1-norte@nutrifit.com` | `123456` | `50002001` |
| SOCIO | Gym Norte | `socio2-norte@nutrifit.com` | `123456` | `50002002` |
| SOCIO | Gym Norte | `socio3-norte@nutrifit.com` | `123456` | `50002003` |
| SOCIO | Gym Sur | `socio1-sur@nutrifit.com` | `123456` | `50003001` |
| SOCIO | Gym Sur | `socio2-sur@nutrifit.com` | `123456` | `50003002` |
| SOCIO | Gym Sur | `socio3-sur@nutrifit.com` | `123456` | `50003003` |

## Qué conviene probar con cada cuenta

| Cuenta | Ideal para probar |
|---|---|
| `superadmin@nutrifit.com` | acceso global, impersonación, multi-tenant |
| `admin-central@nutrifit.com` | administración de Gym Central |
| `admin-norte@nutrifit.com` | administración de Gym Norte |
| `admin-sur@nutrifit.com` | administración de Gym Sur |
| `nutri-*@nutrifit.com` | agenda, turnos, pacientes, clínica |
| `socio-*@nutrifit.com` | reservas, progreso, planes y acceso restringido a datos propios |

## Checklist de prueba rápida

- [ ] Login con SUPERADMIN
- [ ] Login con un ADMIN
- [ ] Login con un NUTRICIONISTA
- [ ] Login con un SOCIO
- [ ] Validar que cada usuario solo vea datos de su gimnasio
- [ ] Validar que un SOCIO solo pueda acceder a sus propios recursos

## Siguiente paso

Si querés re-sembrar la base, corré:

```bash
npm run db:seed
```
