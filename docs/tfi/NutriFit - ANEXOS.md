## **Anexos**

## 1. Arquitectura

**Tipo:** Monorepo con arquitectura limpia (Clean Architecture) + Domain-Driven Design (DDD)
**Gestión de Workspace:** npm workspaces

```
nutrifit/
├── apps/
│   ├── backend/    → NestJS + MySQL + Clean Architecture
│   └── frontend/   → React + Vite + TanStack Router & Query
├── packages/
│   └── shared/     → Tipos y constantes compartidas (@nutrifit/shared)
├── docs/           → Especificaciones y documentación
└── e2e/            → Tests E2E con Playwright
```

## **Backend - Clean Architecture**

## **Stack Tecnológico**

- **Framework:** NestJS 10 (Node.js + TypeScript 5)
- **Base de Datos:** MySQL 8 + TypeORM 0.3
- **Object Storage:** MinIO (para fotos de perfil y reportes adjuntos)
- **Autenticación:** JWT + Passport
- **Validación:** class-validator + class-transformer + Zod (compartidos)
- **Documentación:** Swagger/OpenAPI (en desarrollo, disponible en dev en `/openapi`)
- **Email:** ConsoleEmailProvider (desarrollo) / SMTP (producción)
- **Seguridad:** Helmet, CORS, Throttler (rate limiting)

## **Estructura en Capas**

```
apps/backend/src/
├── domain/                      # ⭐ NÚCLEO - Lógica de Negocio (independiente de frameworks)
│   ├── entities/               # Entidades de dominio (Turno, Socio, Profesional, etc.)
│   ├── value-objects/          # Objetos de valor inmutables
│   ├── enums/                  # Enumeraciones de dominio (EstadoTurno, Rol, etc.)
│   ├── exceptions/             # Excepciones de negocio personalizadas
│   ├── repositories/           # Interfaces/contratos de repositorios
│   └── services/               # Servicios de dominio
│
├── application/                # Casos de Uso (orquestación del negocio)
│   ├── dtos/                   # Data Transfer Objects
│   └── use-cases/              # Casos de uso de aplicación (ej. ReservarTurnoSocio)
│
├── infrastructure/             # Implementaciones técnicas y adaptadores externos
│   ├── persistence/
│   │   └── typeorm/
│   │       ├── entities/       # Entidades ORM para MySQL
│   │       ├── mappers/        # Mapeadores Domain Entity ↔ ORM Entity
│   │       └── repositories/   # Implementaciones concretas de repositorios
│   ├── security/               # Hash de claves, JWT, Passport guards
│   └── services/               # Proveedores de almacenamiento (MinIO), email, etc.
│
├── presentation/               # Capa de entrada/salida (HTTP API)
│   ├── controllers/            # Endpoints HTTP (Express/NestJS)
│   ├── dtos/                   # DTOs de validación de Requests/Responses
│   └── guards/                 # Guards de autorización basados en roles
│
└── shared/                     # Utilidades comunes compartidas en el backend
```

## **Flujo de Datos (Dependency Rule)**

```
HTTP Request 
     ↓
Controller (Presentation)         ← Recibe request HTTP y valida DTOs
     ↓
Use Case (Application)            ← Orquesta el flujo y aplica lógica de negocio
     ↓
Repository Interface (Domain)     ← Contrato de dominio (desacoplado)
     ↓
Repository Impl (Infrastructure)  ← Implementación concreta de persistencia
     ↓
Database (MySQL)
```

---

## **Frontend**

## **Stack Tecnológico**

- **Framework:** React 19 + TypeScript 5
- **Build Tool:** Vite 7 (HMR rápido y compilación optimizada)
- **Routing:** TanStack Router (enrutamiento de tipo seguro en cliente)
- **Estado/Data Fetching:** TanStack Query v5 (React Query)
- **Formularios:** React Hook Form + Zod (validación de esquemas)
- **Estilos:** Tailwind CSS v4
- **Componentes UI:** shadcn/ui + Radix UI + Lucide Icons
- **Notificaciones:** Sonner (mensajería y toasts)
- **Testing:** Vitest + Testing Library + MSW (Mock Service Worker para mocks de API)

## **Estructura del Frontend**

```
apps/frontend/src/
├── api/                # Cliente API unificado y llamadas apiRequest
├── components/         # Componentes reutilizables
│   ├── ui/            # Componentes atómicos (Button, Dialog, Card) basados en Radix
│   └── layout/        # Componentes de estructura (Sidebar, Header, Footer)
├── routes/             # Páginas y vistas organizadas con TanStack Router
├── hooks/              # Custom hooks de React (ej. useAuth, useQueryParams)
├── contexts/           # Proveedores de contexto de estado global (ej. AuthContext)
├── schemas/            # Esquemas de validación Zod compartidos
├── types/              # Declaraciones y extensiones de tipos de TypeScript
└── utils/              # Funciones de formateo y auxiliares comunes
```

## **Patrones del Frontend**

- **Data Fetching & Caching:** TanStack Query para invalidación y sincronización de datos con el servidor de forma transparente.
- **Formularios no controlados:** Integración de React Hook Form con Zod para evitar re-renderizados innecesarios y asegurar tipado estricto en inputs.
- **Filtro de navegación por Rol:** El menú lateral (`Sidebar.tsx`) filtra dinámicamente las opciones disponibles según los roles asignados al usuario en su token JWT (`['ADMIN', 'NUTRICIONISTA', 'SOCIO']`).
- **Manejo de Errores centralizado:** Conversión de códigos de error HTTP a mensajes legibles en español en la capa API, disparando alertas mediante toasts de Sonner.

---

## 2. Patrones de diseño

| **Tipo** | **Patrón** | **Ubicación / Propósito** |
|---|---|---|
| Creacional | Dependency Injection | Provisto de manera nativa por el contenedor de NestJS para desacoplar controladores, servicios y repositorios. |
| Creacional | Factory Method | Utilizado en la instanciación de entidades de dominio complejas que requieren validaciones iniciales de integridad. |
| Estructural | Repository Pattern | Desacopla la lógica de negocio (casos de uso) de la persistencia física (TypeORM/MySQL), permitiendo intercambiar la infraestructura sin afectar el dominio. |
| Estructural | Adapter / Mapper | Traduce entidades del motor ORM (infraestructura) a entidades de dominio puras (e inversamente) para proteger el núcleo del sistema. |
| Comportamiento | Strategy | Implementado en los proveedores de servicios (ej. `EmailProvider` con implementaciones de `ConsoleEmailProvider` en dev y `SmtpEmailProvider` en prod). |
| Comportamiento | State | Estructura la transición y comportamiento de los estados de un Turno (`PROGRAMADO`, `PRESENTE`, `EN_CURSO`, `REALIZADO`, `AUSENTE`, `CANCELADO`), asegurando transiciones válidas. |

---

## 3. Módulo de Seguridad

El sistema implementa un módulo de seguridad multi-tenant. Permite aislar los datos de los diferentes gimnasios y gestionar accesos de manera granular mediante roles y permisos estructurados en grupos de usuarios.

## **3.1. Funcionalidades implementadas**

## **Autenticación y Sesión:**
- **Iniciar sesión:** Generación de token JWT firmado, con validación de credenciales.
- **Cerrar sesión:** Invalida el token localmente en el frontend.
- **Impersonación:** Capacidad especial para que el `SUPERADMIN` adopte temporalmente la identidad de cualquier usuario en cualquier gimnasio (cross-tenant) para soporte técnico y supervisión.

## **Gestión de Usuarios:**
- **Agregar usuario:** Registro de un nuevo usuario asociando su perfil de rol (`ADMIN`, `NUTRICIONISTA`, `SOCIO`).
- **Modificar usuario:** Edición de datos personales, estado activo/inactivo e información específica del perfil.
- **Eliminar usuario:** Baja lógica del sistema (se setea `fechaBaja` para conservar consistencia de turnos históricos).
- **Resetear clave:** Generación de clave temporal o blanqueo por parte de un administrador.

## **Gestión de Grupos y Permisos:**
- **Agregar grupo:** Creación de grupos de permisos (ej. "Staff Recepción", "Nutricionistas Junior").
- **Modificar grupo:** Asignación y remoción de permisos específicos sobre módulos del sistema.
- **Eliminar grupo:** Disolución de grupos verificando previamente que no existan usuarios activos asignados a él.
- **Asignación a usuarios:** Capacidad de asignar uno o más grupos a un usuario, acumulando sus permisos de control de acceso.

## **Administración de credenciales personales:**
- **Cambiar clave:** El usuario activo actualiza su contraseña validando la contraseña anterior.
- **Recuperar clave:** Envío de correo electrónico con enlace seguro de restablecimiento (token con vencimiento corto).

---

## 4. Métricas del Software

## **4.1 Introducción**
En esta sección se presentan las métricas seleccionadas para evaluar la calidad, eficiencia y mantenibilidad del sistema NutriFit Supervisor.

## **4.2 Métricas de Tamaño (Funcionalidad)**
- **MT-01 – Número de Casos de Uso Implementados:** Casos de uso core y de soporte (ej. `ReservarTurnoSocio`, `CancelarTurnoSocio`, `ReprogramarTurnoSocio`, `IniciarConsulta`, `RegistrarAsistencia`, `CargarFichaSalud`).
- **MT-02 – Número de Reglas de Negocio Aplicadas:** Mapea el total de reglas críticas de validación (R01 a R33 en Turnos, Agendas, Bloqueos y Fichas de Salud).
- **MT-03 – Número de Entidades del Modelo de Datos:** Refleja la complejidad estructural física en base de datos (Gimnasio/Tenant, Usuario, Permiso, Grupo, Socio, Nutricionista, Turno, FichaClinica, BloqueoAgenda, Antropometria).
- **MT-04 – Número de Endpoints Implementados:** Endpoints REST expuestos por el backend en `/api` para consumo del frontend.

## **4.3 Métricas de Complejidad**
- **MC-01 – Complejidad Ciclomática:** Aplicada a los casos de uso con múltiples ramificaciones lógicas de decisión, como `ReprogramarTurnoSocioUseCase` (validación de agendas, verificación del límite de 3 reprogramaciones del socio, validación de staff, conflictos horarios).
- **MC-02 – Profundidad de Anidamiento:** Medición en validaciones anidadas del motor de búsqueda de disponibilidad de turnos (`SlotComputationService`).
- **MC-03 – Relaciones entre Entidades (Acoplamiento):** Control de la acoplabilidad del dominio. El núcleo no depende de frameworks ni ORMs, manteniendo un acoplamiento eferente bajo en la capa central.

## **4.4 Métricas de Desempeño**
- **MD-01 – Tiempo de respuesta para la computación de slots libres:** Debe ser inferior a 1.5 segundos para consultas de hasta 30 días de rango de agenda.
- **MD-02 – Tiempo de ejecución de check-in / registro de asistencia:** Inferior a 500 milisegundos en condiciones normales.
- **MD-03 – Tiempo de generación del reporte antropométrico del socio:** Inferior a 1 segundo.

## **4.5 Métricas de Estabilidad y Calidad**
- **ME-01 – Cobertura de Código:** Porcentaje de líneas de código cubiertas por la suite de pruebas unitarias (Jest) e integración en la capa de negocio.
- **ME-02 – Tasa de regresión en E2E:** Fallos detectados al correr la suite automatizada de Playwright sobre la máquina de estados de turnos en `e2e/`.

---

## 5. Gestión de Riesgos

## **5.1 Introducción**
Identificación de los riesgos técnicos y operativos del sistema NutriFit Supervisor, su impacto potencial y las estrategias de mitigación implementadas.

## **5.2 Matriz de Riesgos del Proyecto**

| Código | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| **R-01** | **Fuga de datos entre gimnasios (Cross-tenant data leak)** | Baja | Muy Alta | Uso de un interceptor/middleware a nivel de base de datos que inyecta automáticamente el `tenantId` en cada consulta SQL, impidiendo acceder a datos ajenos. |
| **R-02** | **Conflicto de reservas concurrentes (Overbooking de slots)** | Media | Alta | Bloqueo optimista en base de datos de la entidad `Turno` y transacciones con aislamiento Serializable en el backend para validar duplicidades horarias. |
| **R-03** | **Reprogramación excesiva por parte del socio** | Alta | Media | Implementación estricta de la regla de negocio R13 (límite de 3 reprogramaciones mensuales) controlada mediante contadores en la base de datos para el mes calendario. |
| **R-04** | **Pérdida de imágenes o adjuntos de fichas clínicas** | Baja | Alta | Almacenamiento desacoplado en MinIO (Object Storage) con políticas de backups periódicas configuradas en el servicio. |
| **R-05** | **Agendas de nutricionistas desconfiguradas o inconsistentes** | Media | Media | Interfaz visual en el frontend que valida en tiempo real solapamientos de bloques horarios antes de guardar la agenda del profesional. |

---

## 6. Análisis del Elemento Seleccionado: Turno

El **Turno** (Reserva/Consulta) es el objeto central sobre el que giran las operaciones de NutriFit Supervisor. Conecta al socio, al profesional de la salud y al gimnasio en un espacio-tiempo específico.

## **6.1 Descripción General**
Un Turno representa la reserva de un bloque de tiempo de un nutricionista para atender a un socio. Controla las fases de asistencia, check-in, la atención clínica en sí y el registro de la evolución del paciente.

## **6.2 Atributos Principales**
- **id:** Identificador único autogenerado.
- **fecha / hora:** Fecha y hora programada del turno.
- **estado:** Estado actual del turno (`PROGRAMADO`, `PRESENTE`, `EN_CURSO`, `REALIZADO`, `AUSENTE`, `CANCELADO`).
- **socioId:** Identificador del socio que reserva.
- **nutricionistaId:** Identificador del profesional asignado.
- **gimnasioId (tenantId):** Identificador del gimnasio al que pertenece la reserva.
- **notas:** Observaciones agregadas por el nutricionista o el recepcionista.

## **6.3 Asociaciones Relevantes**
- **Socio:** El socio asociado debe poseer una ficha de salud completada activa antes de poder agendar (Regla R01).
- **Nutricionista:** Profesional activo que ofrece disponibilidad horaria.
- **Ficha Clínica / Antropometría:** Registro generado durante la consulta en estado `EN_CURSO` y vinculado al finalizarse.

## **6.4 Ciclo de Vida (Máquina de Estados)**

```
             [PROGRAMADO] ─── (socio/staff cancela) ───► [CANCELADO]
                  │
          (socio hace check-in)
                  │
                  ▼
              [PRESENTE] ─── (nutricionista inicia consulta) ──► [EN_CURSO]
                  │                                                   │
         (inasistencia/tiempo excedido)                       (consulta finalizada)
                  │                                                   │
                  ▼                                                   ▼
              [AUSENTE]                                          [REALIZADO]
```

## **6.5 Comportamiento General**
- **Validaciones de negocio críticas:** Al crearse o reprogramarse, el caso de uso verifica la agenda del profesional, la inexistencia de turnos duplicados, el estado de la ficha del socio y los límites mensuales de reprogramación.
- **Transición automática de ausentismo:** Un scheduler corre periódicamente para transicionar a `AUSENTE` los turnos `PROGRAMADO` o `PRESENTE` cuyo horario haya expirado (más de N minutos de demora).

---

## 7. Reportes del Sistema

NutriFit Supervisor cuenta con los siguientes reportes clave para asistir a los administradores y profesionales en la toma de decisiones:

## **7.1 Dashboard Principal (KPIs & Ocupación)**
Ofrece una pantalla unificada con las estadísticas de la jornada:
- **Tasa de ausentismo:** Gráfico de torta que resume la proporción de turnos `REALIZADOS` vs. `AUSENTES` del mes.
- **Ocupación de agenda:** Porcentaje de bloques horarios reservados respecto al total disponible.
- **Alertas de agenda:** Indicador de nutricionistas con agendas saturadas o con baja demanda de turnos.

## **7.2 Reporte de Auditoría (Trazabilidad)**
Permite supervisar la actividad operacional del sistema:
- **Trazabilidad de reservas:** Muestra el historial completo de cambios de estados de los turnos, indicando el usuario que realizó la acción, hora, datos originales y modificados.
- **Registro de accesos:** Tabla de auditoría con inicios y cierres de sesión de usuarios, incluyendo alertas de múltiples intentos fallidos.

## **7.3 Reporte de Progreso del Socio (Evolución Antropométrica)**
Orientado al socio y al nutricionista para evaluar el seguimiento:
- **Evolución física:** Gráfico de líneas interactivo que cruza datos antropométricos (Peso, Masa Muscular, Grasa Corporal, Agua) registrados en las distintas consultas a lo largo del tiempo.

---

## 8. Pruebas de software

## **9.1 Estrategia General de Pruebas**
Se implementa una suite combinada de pruebas unitarias (Jest) para la lógica de negocio y casos de uso en el backend, vitest para componentes de frontend, y pruebas de sistema end-to-end (E2E) con Playwright para validar la integración multi-tenant y la máquina de estados.

## **9.2 Prueba Unitaria – ReservarTurnoSocioUseCase**
Verifica la validez de creación de reservas de socios bajo diversas condiciones.

**Casos evaluados:**
| ID | Caso de Prueba | Resultado Esperado |
|---|---|---|
| **UT-01** | Socio con ficha de salud activa, fecha y hora libre en agenda del nutricionista. | Turno creado en estado `PROGRAMADO`. |
| **UT-02** | Socio sin ficha de salud completada en el sistema. | Error: Ficha de salud requerida para reservar (R01). |
| **UT-03** | Solicitud de turno en fecha pasada. | Error: No se puede reservar en fechas pasadas (R03). |
| **UT-04** | Reserva que choca en horario con otra reserva preexistente activa para el mismo nutricionista. | Error: El horario ya se encuentra ocupado (R06). |

## **9.3 Prueba de Caja Blanca – ReprogramarTurnoSocioUseCase (Ruta Básica)**
Valida el algoritmo de reprogramación que aplica límites restrictivos al socio.

**Complejidad Ciclomática:**
V(G) = 5 (basado en bifurcaciones de validación de reprogramaciones mensuales del socio, validación de staff, estado del turno y colisión de agenda).

**Rutas linealmente independientes probadas:**
- **R1:** Socio reprograma su propio turno. Tiene 1 reprogramación realizada en el mes. Operación exitosa.
- **R2:** Socio intenta reprogramar pero ya cuenta con 3 reprogramaciones en el mes calendario. Operación rechazada (R13).
- **R3:** Recepcionista reprograma turno del socio. El socio ya tiene 3 reprogramaciones. Operación exitosa (recepcionista está exento del límite, R14).
- **R4:** Intento de reprogramación de un turno en estado `REALIZADO` o `CANCELADO`. Operación rechazada (R10).
- **R5:** Nueva fecha y hora colisiona con otro turno del nutricionista. Operación rechazada (R16).

## **9.4 Prueba de Caja Negra – Partición de Equivalencia (RegistrarAsistenciaTurnoUseCase)**
Analiza el registro de asistencia en la transición de estados.

**Particiones identificadas:**
- **Estado del Turno:** `PROGRAMADO` (Válido) / `CANCELADO`, `REALIZADO`, `AUSENTE` (Inválidos).
- **Relación temporal con el turno:** Hora actual menor a la programada (Inválido) / Hora actual mayor o igual a la programada (Válido).

**Casos de prueba diseñados:**
| ID | Entrada (Estado, Hora Actual) | Resultado Esperado |
|---|---|---|
| **PE-01** | Turno `PROGRAMADO`, Hora actual posterior a la programada. | Estado cambia a `PRESENTE` / Asistencia registrada (R18). |
| **PE-02** | Turno `CANCELADO`, Hora actual posterior. | Error: Turno inválido para registrar asistencia. |
| **PE-03** | Turno `PROGRAMADO`, Hora actual previa al inicio programado. | Error: No se puede registrar asistencia antes del horario programada (R21). |

## **9.5 Conclusiones**
La suite automatizada asegura la estabilidad del sistema, manteniendo la consistencia operacional del ciclo de vida del Turno y el estricto aislamiento de datos multi-tenant del gimnasio.
