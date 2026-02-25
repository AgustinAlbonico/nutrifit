# 🧠 NutriFit Supervisor – Backend

**NutriFit Supervisor** es el backend del proyecto final de tesis de la carrera Ingeniería en Sistemas de Información (UAI Rosario). El sistema está orientado a la digitalización de servicios profesionales de salud dentro de gimnasios de bienestar, facilitando la interacción entre **socios**, **nutricionistas** y **médicos deportólogos** a través de una plataforma web unificada.

Este backend fue desarrollado con **NestJS**, **TypeScript** y **MySQL**, siguiendo los principios de **Clean Architecture**, **SOLID** y buenas prácticas de diseño modular.

---

## 🎯 Objetivo del proyecto

Proveer soporte tecnológico a gimnasios que buscan incorporar atención profesional personalizada en las áreas de **nutrición** y **medicina del deporte**, permitiendo a los **socios**:

- Consultar perfiles de profesionales.
- Solicitar y gestionar turnos.
- Completar fichas de salud y antecedentes clínicos.
- Recibir observaciones médicas y planes alimentarios personalizados.
- Visualizar su progreso físico y nutricional.

Y a los **profesionales**:

- Registrar y consultar historias clínicas.
- Gestionar su agenda y disponibilidad.
- Colaborar con el equipo multidisciplinario del gimnasio.

---

## 🔧 Tecnologías principales

- **NestJS** como framework principal basado en Node.js.
- **TypeScript** para programación fuertemente tipada y mantenible.
- **MySQL** como base de datos relacional.
- **TypeORM** como ORM para el mapeo de entidades del dominio.
- **JWT y Passport.js** para autenticación segura basada en roles (`socio`, `profesional`, `asistente`).
- Estructura basada en **Clean Architecture**: separación clara entre capa de dominio, aplicación, infraestructura y presentación.

---

## 📐 Arquitectura del sistema

El sistema está organizado en **módulos funcionales** que representan claramente las entidades del dominio, tales como:

- `auth`: autenticación, autorización y gestión de sesiones.
- `socios`: administración de usuarios finales (clientes del gimnasio).
- `profesionales`: gestión de perfiles médicos y nutricionales.
- `turnos`: reserva, asignación y control de agendas.
- `fichas`: fichas clínicas y antecedentes de salud.
- `observaciones`: seguimiento clínico y nutricional.
- `notificaciones`: alertas internas, recordatorios y comunicaciones.
- `shared`: utilidades comunes e infraestructura compartida.

La estructura sigue los principios de **Clean Architecture**, con separación de responsabilidades en capas:

- **Domain**: entidades, interfaces y lógica central del negocio.
- **Application**: casos de uso (services), DTOs y validaciones.
- **Infrastructure**: acceso a datos (TypeORM), servicios externos, autenticación.
- **Presentation**: controladores HTTP expuestos por NestJS.

---

## 🔒 Seguridad y buenas prácticas

- Autenticación con JWT y control estricto de acceso por roles.
- Contraseñas encriptadas con **bcrypt**.
- Auditoría de eventos y logs de acceso a datos sensibles.
- Validaciones exhaustivas de entrada mediante DTOs y pipes de NestJS.

---

## ⚙️ Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables para configurar la conexión a la base de datos MySQL:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=nutrifit_supervisor
PORT=3000
NODE_ENV=dev
APP_NAME=NutriFit Supervisor
```

---

## 🌱 Seed de alimentos (Argentina)

Para poblar `alimento` con datos orientados a Argentina se agregó un seed híbrido:

- Base local estilo ARGENFOODS para alimentos genéricos frecuentes.
- Catálogo de productos argentinos desde Open Food Facts (`countries_tags=argentina`).

Ejecutar:

```bash
npm run seed:alimentos:ar
```

Variables opcionales para controlar volumen de importación:

```env
SEED_OFF_MAX_PAGINAS=8
SEED_OFF_PAGE_SIZE=100
SEED_OFF_LIMITE=500
```

Notas:

- El script evita duplicados por nombre normalizado.
- Inserta solo alimentos que no existan previamente en la tabla.
- Si Open Food Facts falla, igual mantiene una base mínima local de alimentos.

---

## 🔄 Sincronización automática de alimentos

Se agregó sincronización para catálogo argentino con Open Food Facts + curación automática.

Configurar en `.env`:

```env
ALIMENTOS_SYNC_HABILITADO=false
ALIMENTOS_SYNC_MAX_PAGINAS=8
ALIMENTOS_SYNC_PAGE_SIZE=100
ALIMENTOS_SYNC_LIMITE_IMPORTACION=500
```

- Cron automático: todos los días `03:30` (solo si `ALIMENTOS_SYNC_HABILITADO=true`).
- Log persistente de sincronizaciones en tabla `alimento_sync_log`.

Endpoints (ADMIN):

- `GET /alimentos/sync/estado` → último estado de sync.
- `POST /alimentos/sync` → sincronización manual inmediata.
- `POST /alimentos/sync/curar` → curación manual (dedupe + limpieza de ruido).
