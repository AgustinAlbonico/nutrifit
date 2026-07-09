# Credenciales Seed de NutriFit

Este archivo detalla todas las credenciales de los usuarios de prueba generados por los distintos seeds del sistema.

> [!IMPORTANT]
> **Contraseña universal para todos los usuarios seed:** `123456`

---

## 1. Seed Principal — [seed-multi-tenant.ts](file:///c:/Users/agust/Desktop/Programacion/Proyectos/NutriFit%20Supervisor%20-%20Software/nutrifit/apps/backend/src/seed-multi-tenant.ts)

Siembra el entorno multi-inquilino base con 3 gimnasios, superadmin, administradores, recepcionistas, nutricionistas (fijos y de demostración), socios (fijos y de demostración), agendas, turnos de prueba, planes alimentarios y el catálogo de alimentos de Argentina.

### 🚀 Comando de Ejecución
```bash
npm run seed:multi-tenant
# (Ejecutar desde el directorio apps/backend)
```

---

### 🏢 Gimnasios Registrados

| Gimnasio | Email | Teléfono | Dirección | Ciudad |
| :--- | :--- | :--- | :--- | :--- |
| **Gym Central** | `central@gym.com` | `341-555-0001` | `Av. Central 1234` | Rosario |
| **Gym Norte** | `norte@gym.com` | `341-555-0002` | `Av. Norte 5678` | Rosario |
| **Gym Sur** | `sur@gym.com` | `341-555-0003` | `Av. Sur 9012` | Rosario |

---

### 👑 Superadministrador (Global)

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **SUPERADMIN** | `superadmin@nutrifit.com` | `123456` |

---

### 💼 Administradores de Gimnasio

| Gimnasio | Nombre | Email |
| :--- | :--- | :--- |
| **Gym Central** | Admin Central | `admin-central@nutrifit.com` |
| **Gym Norte** | Admin Norte | `admin-norte@nutrifit.com` |
| **Gym Sur** | Admin Sur | `admin-sur@nutrifit.com` |

---

### 🛎️ Recepcionistas

| Gimnasio | Nombre | Email |
| :--- | :--- | :--- |
| **Gym Central** | Recepcion Central | `recepcion-central@nutrifit.com` |
| **Gym Norte** | Recepcion Norte | `recepcion-norte@nutrifit.com` |
| **Gym Sur** | Recepcion Sur | `recepcion-sur@nutrifit.com` |

---

### 🥗 Nutricionistas Originales

| Gimnasio | Nombre | Email | Matrícula |
| :--- | :--- | :--- | :--- |
| **Gym Central** | Nutri Central | `nutri-central@nutrifit.com` | `MN-2001` |
| **Gym Norte** | Nutri Norte | `nutri-norte@nutrifit.com` | `MN-2002` |
| **Gym Sur** | Nutri Sur | `nutri-sur@nutrifit.com` | `MN-2003` |

---

### 👥 Nutricionistas Demo (10 por Gimnasio)

| Gimnasio | Email | Matrícula |
| :--- | :--- | :--- |
| **Gym Central** | `nutri.demo.f0@gymcentral.com` a `nutri.demo.m9@gymcentral.com` | `MN-5000` a `MN-5009` |
| **Gym Norte** | `nutri.demo.f10@gymnorte.com` a `nutri.demo.m19@gymnorte.com` | `MN-5010` a `MN-5019` |
| **Gym Sur** | `nutri.demo.f20@gymsur.com` a `nutri.demo.m29@gymsur.com` | `MN-5020` a `MN-5029` |

---

### 🏋️ Socios Originales (3 por Gimnasio)

| Gimnasio | Email | DNI |
| :--- | :--- | :--- |
| **Gym Central** | `socio1-central@nutrifit.com`<br>`socio2-central@nutrifit.com`<br>`socio3-central@nutrifit.com` | `50001001`<br>`50001002`<br>`50001003` |
| **Gym Norte** | `socio1-norte@nutrifit.com`<br>`socio2-norte@nutrifit.com`<br>`socio3-norte@nutrifit.com` | `50002001`<br>`50002002`<br>`50002003` |
| **Gym Sur** | `socio1-sur@nutrifit.com`<br>`socio2-sur@nutrifit.com`<br>`socio3-sur@nutrifit.com` | `50003001`<br>`50003002`<br>`50003003` |

---

### 👥 Socios Demo (10 por Gimnasio)

| Gimnasio | Rango de Emails | Rango de DNIs |
| :--- | :--- | :--- |
| **Gym Central** | `socio.m0@gymcentral.com` a `socio.f9@gymcentral.com` | `51001000` a `51001009` |
| **Gym Norte** | `socio.m10@gymnorte.com` a `socio.f19@gymnorte.com` | `51001010` a `51001019` |
| **Gym Sur** | `socio.m20@gymsur.com` a `socio.f29@gymsur.com` | `51001020` a `51001029` |

---

### 🧪 Socios Especiales / Pruebas E2E (Gym Central)

| Email | DNI | Nota / Propósito |
| :--- | :--- | :--- |
| `agusalbo2024@gmail.com` | `12312312` | Creado manualmente para pruebas de flujo real |
| `test-socio@nutrifit.com` | `41234567` | Socio de pruebas generales |
| `socio-test-e2e@nutrifit.com` | `77777001` | Reservado para pruebas de integración automatizadas (E2E) |

---

### 📈 Entorno Evolutivo de Pruebas (Gym Central)
Ideal para verificar gráficos de progreso histórico, comparadores de fotos, evoluciones antropométricas y cambios de riesgo cardiovascular.

* **Nutricionista:** `nutri-evolucion@nutrifit.com` (Matrícula `MN-3001`)
* **Socio Asociado:** `martin-evolucion@nutrifit.com` (DNI `50004001`)
* **Historial Generado:** 11 turnos en estado `REALIZADO` con mediciones completas (peso, pliegues, perímetros, composición corporal) simulados quincenalmente entre `2026-01-12` y `2026-06-01`.

---

## 2. Seed Independiente — [seed-el-cid.ts](file:///c:/Users/agust/Desktop/Programacion/Proyectos/NutriFit%20Supervisor%20-%20Software/nutrifit/apps/backend/src/seed-el-cid.ts)

Genera los datos específicos para el gimnasio **"El Cid"**. Funciona de manera aislada y permite verificar el flujo de aislamiento multi-tenant del sistema.

### 🚀 Comando de Ejecución
```bash
npm run seed:el-cid
# (Ejecutar desde el directorio apps/backend)
```

> [!NOTE]
> **Idempotencia:** Si se ejecuta varias veces, los nutricionistas y socios se actualizarán (upsert), pero los turnos se acumularán con cada ejecución.

### 🏢 Gimnasio Creado
* **Nombre:** El Cid
* **Dirección:** Av. Pellegrini 1800 (Rosario)
* **Email:** `contacto@elcidgym.com`
* **Teléfono:** `341-555-7000`

---

### 🥗 Nutricionistas

| Nombre | Email | Matrícula | Especialidad / Agenda |
| :--- | :--- | :--- | :--- |
| **Martín Giménez** | `nutri-cid1@nutrifit.com` | `MN-6001` | Dep. / Recomposición. Lu-Vie 9-13hs |
| **Carolina Vega** | `nutri-cid2@nutrifit.com` | `MN-6002` | Clin. / Control Peso. Lu-Mi-Vie 14-19hs |
| **Federico Linares** | `nutri-cid3@nutrifit.com` | `MN-6003` | Salud Digestiva. Ma-Ju 8-12hs, Sáb 9-13hs |

---

### 🏋️ Socios y Planes Alimentarios Activos

| Nutricionista | Socio | Email | DNI | ¿Plan Activo? |
| :--- | :--- | :--- | :--- | :---: |
| **Martín Giménez** | Lucas Mendoza | `socio-cid-a@nutrifit.com` | `60001001` | ✅ Sí |
| | Florencia Rivas | `socio-cid-b@nutrifit.com` | `60001002` | ❌ No |
| | Tomás Sosa | `socio-cid-c@nutrifit.com` | `60001003` | ❌ No |
| **Carolina Vega** | Sofía Peralta | `socio-cid-d@nutrifit.com` | `60002001` | ✅ Sí |
| | Gabriel Álvarez | `socio-cid-e@nutrifit.com` | `60002002` | ❌ No |
| | Valentina Castillo | `socio-cid-f@nutrifit.com` | `60002003` | ❌ No |
| **Federico Linares** | Mateo Delgado | `socio-cid-g@nutrifit.com` | `60003001` | ✅ Sí |
| | Camila Navarro | `socio-cid-h@nutrifit.com` | `60003002` | ❌ No |
| | Sebastián Moreno | `socio-cid-i@nutrifit.com` | `60003003` | ❌ No |

* **Detalle de los turnos:** Cada socio cuenta con **4 turnos en estado `REALIZADO`** (3 pasados y 1 futuro pero marcado como realizado para contar con historial antropométrico completo).

---

## 3. Carga de Fotos — [seed-martin-evolucion-fotos.ts](file:///c:/Users/agust/Desktop/Programacion/Proyectos/NutriFit%20Supervisor%20-%20Software/nutrifit/apps/backend/src/scripts/seed-martin-evolucion-fotos.ts)

Sube las imágenes de demostración para el comparador de fotos de progreso de Martín.

### 🚀 Comando de Ejecución
```bash
npm run seed:martin-fotos
# (Ejecutar desde el directorio apps/backend)
```

> [!WARNING]
> Este script requiere que primero se haya corrido el **Seed Principal** para asociar las imágenes a los turnos reales de `martin-evolucion@nutrifit.com`.

---

## 📋 Resumen de Comandos Rápidos

| Comando (en `apps/backend`) | Propósito |
| :--- | :--- |
| `npm run seed:multi-tenant` | Poblar la base de datos principal |
| `npm run seed:el-cid` | Cargar los datos específicos del gimnasio "El Cid" |
| `npm run seed:martin-fotos` | Cargar las fotos de progreso del socio Martín |
