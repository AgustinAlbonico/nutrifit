# Proyecto de Diploma: NutriFit Supervisor

## **Docente:** Pablo Andrés Audoglio  
## **Alumno:** Albónico, Agustín  
## **Legajo:** B00104869-T1  
## **Comisión:** 3-A  
## **Turno:** T  
## **Año:** 2025  

---

## 1. Nombre del Proyecto
**NutriFit Supervisor** (NFS)

---

## 2. Siglas del Proyecto
**NFS**

---

## 3. Descripción del Proyecto
NutriFit Supervisor es una plataforma web SaaS B2B diseñada para modernizar la gestión interdisciplinaria de gimnasios y centros de entrenamiento orientados a la salud en Rosario. El sistema integra en una sola plataforma digital al socio del gimnasio, a los entrenadores y a profesionales de la salud externos (nutricionistas y deportólogos) para proporcionar una experiencia de bienestar coordinada y personalizada. 

El sistema centraliza la reserva de turnos, la configuración de agendas, la consulta de fichas de salud clínicas, el registro de mediciones antropométricas, la carga de planes alimentarios y el seguimiento de evolución del socio a través de indicadores gráficos interactivos. Además, incorpora un motor de inteligencia artificial que asiste a los profesionales de la salud sugiriendo recetas e ideas de comidas basadas en las restricciones, alergias y objetivos del paciente, garantizando siempre la supervisión y edición humana antes de que la información se publique para el socio.

---

## 4. Objetivos del Proyecto

### **Objetivo General**
Desarrollar una plataforma inteligente bajo modelo SaaS B2B para gimnasios que permita la integración digital de servicios profesionales de salud (nutrición y deportología), promoviendo la atención personalizada y el acompañamiento clínico de los socios mediante la coordinación interdisciplinaria y la asistencia de inteligencia artificial.

### **Objetivos Específicos**
1. **Gestión Unificada:** Centralizar en un entorno multi-tenant la administración de profesionales de salud, sus agendas, la reserva de turnos y las fichas de salud de los socios.
2. **Atención Clínica Digital:** Proveer herramientas a los nutricionistas y deportólogos para registrar consultas clínicas, capturar mediciones corporales y estructurar planes alimentarios dinámicos.
3. **Asistente de IA:** Integrar un motor de inteligencia artificial que analice el perfil, objetivos y restricciones del socio para generar recomendaciones de comidas preliminares sujetas a aprobación profesional.
4. **Colaboración Interdisciplinaria:** Facilitar que los entrenadores tengan acceso de lectura a las observaciones generales y planes alimentarios para ajustar rutinas físicas acordes a las indicaciones clínicas.
5. **Seguimiento Gráfico:** Brindar a los socios tableros interactivos para visualizar su evolución física (peso, IMC, medidas corporales) e historial clínico de forma clara y accesible.

---

## 5. Definición de Requerimientos

### **Requerimientos Funcionales (RF)**
- **RF01 a RF06 (Gestión de Profesionales):** Permite al asistente/administrador dar de alta, modificar y suspender profesionales, configurar especialidades y definir agendas horarias de atención.
- **RF07 a RF13 (Gestión de Turnos - Socio):** Habilita al socio a buscar profesionales activos, reservar slots, cancelar y reprogramar turnos con un mínimo de 24 horas de anticipación, requiriendo el autocompletado de la ficha de salud en su primera reserva.
- **RF14 a RF16 (Ficha de Salud):** El socio registra y edita sus datos físicos básicos (estatura, peso, actividad, patologías, alergias) y el profesional accede en tiempo real para el diagnóstico.
- **RF17 a RF19 (Agenda y Turnos - Profesional):** El profesional consulta su grilla diaria de pacientes, accede a los antecedentes y bloquea/desbloquea horarios administrativos.
- **RF20 a RF22 (Atención y Consulta Clínica):** Permite el registro de observaciones en el turno, captura de medidas corporales y finalización de la consulta.
- **RF23 a RF26 (Seguimiento y Progreso):** El socio y el profesional visualizan el historial de evolución física mediante curvas y exportan reportes en formatos PDF/CSV.
- **RF27 a RF30 (Consulta Médica Avanzada):** Inicia consultas solo con turnos en estado `PRESENTE` y bloquea la edición directa tras el cierre, permitiendo solo la adición de anexos auditados.
- **RF31 a RF34 (Plan Alimentario):** Creación de planes por comidas y días, edición auditada con registro de motivos, y soft delete del plan.
- **RF35 (Validación Cruzada):** Bloqueo y emisión de incidencias automáticas si el plan alimentario contiene ingredientes asociados a las alergias registradas por el socio.
- **RF36 a RF38 (Asistencia de IA):** Sugerencia automatizada de comidas a partir de objetivos, restricciones y preferencias; retorna exactamente 2 ideas estructuradas que el profesional añade o descarta.
- **RF39 a RF40 (Notificaciones y Alertas):** Emisión de notificaciones internas y por correo tras la finalización de consultas, creación o modificación de planes alimentarios.

### **Requerimientos No Funcionales (RNF)**
- **RNF01 (Seguridad y Privacidad):** Aislamiento estricto de datos bajo arquitectura multi-tenant. Ningún gimnasio o usuario ajeno puede acceder a registros médicos de otros tenants.
- **RNF02 (Trazabilidad y Auditoría):** Todas las ediciones de planes alimentarios y cancelaciones de turnos deben persistir registrando el usuario autor, la marca de tiempo y el motivo de cambio.
- **RNF03 (Desempeño y Escalabilidad):** El tiempo de cálculo de slots de disponibilidad para agendamiento de turnos debe ser menor a 1.5 segundos.
- **RNF04 (Encriptación):** Almacenamiento seguro de contraseñas bajo hash Argon2id y transmisión mediante tokens firmados JWT.
- **RNF05 (Diseño Responsive):** La interfaz web debe ser responsiva y adaptarse a dispositivos móviles, tablets y computadoras de escritorio de manera fluida.

---

## 6. Alcance del Proyecto

### **Inclusiones**
- Módulo multi-tenant de administración de gimnasios (gimnasio central, norte, sur).
- CRUD y gestión de perfiles de profesionales de la salud (especialidades, agendas).
- Ciclo de vida y máquina de estados del Turno (Reserva, cancelación, reprogramación, check-in, inicio de consulta y ausentismo).
- Registro de ficha de salud de socios e historial antropométrico.
- Módulo de consulta clínica: toma de medidas antropométricas, diagnóstico y adjunto de archivos en MinIO.
- Generación de planes alimentarios con validación automática de alergias.
- Asistente de inteligencia artificial integrado (sugerencia de menús).
- Reportes operativos, auditoría y panel interactivo de progreso físico del socio.

### **Exclusiones**
- Procesamiento y pasarelas de pago directos entre socio y profesional (se realiza externamente).
- Chats interactivos en tiempo real o videollamadas integradas para telemedicina (la consulta es presencial en las cabinas del gimnasio).
- Módulo de facturación fiscal, liquidación de impuestos u honorarios profesionales.
- Gestión completa de rutinas físicas de musculación y entrenamiento (fuera del alcance del módulo core de salud).

---

## 7. Registro de Interesados (Stakeholders)

- **Dueños/Administradores de Gimnasios:** Clientes B2B primarios. Interés alto en retener socios, captar ingresos adicionales y monitorear la ocupación de los profesionales.
- **Socios del Gimnasio:** Usuarios finales. Interés alto en acceder a turnos de forma ágil, consultar sus planes alimentarios y seguir su progreso físico gráficamente.
- **Nutricionistas y Deportólogos:** Usuarios operativos core. Interés alto en optimizar su agenda diaria, registrar mediciones clínicas y agilizar la planificación dietaria con soporte de IA.
- **Entrenadores del Gimnasio:** Usuarios de apoyo. Interés medio en consultar indicaciones médicas y planes nutricionales para programar rutinas físicas coherentes.
- **Superadministrador del Sistema:** Operador técnico. Interés en la estabilidad de la infraestructura, auditoría global e impersonación cross-tenant para resolución de incidencias.

---

## 8. Cronograma de Hitos

- **Hito 1: Análisis de Requisitos y Diseño de Arquitectura** (Meses 1-2)  
  Entregables: Documento de especificación, Modelo de datos conceptual y setup del monorepo con `npm workspaces`.
- **Hito 2: Iteración 1 - Módulo de Gestión y Turnos (Seminario de Aplicación Profesional)** (Meses 3-6)  
  Entregables: CRUD de profesionales, Agendas, Reservas de turnos, Ficha de salud y suite de pruebas unitarias/E2E iniciales.
- **Hito 3: Iteración 2 - Consulta Clínica, Plan Alimentario e IA (Trabajo Final de Ingeniería)** (Meses 7-10)  
  Entregables: Registro de mediciones, Módulo de Planes Alimentarios con validación de alergias, Integración de OpenAI API para sugerencias de comidas, y gráficos antropométricos.
- **Hito 4: Pruebas Globales, Auditoría y Despliegue** (Meses 11-12)  
  Entregables: Manuales de usuario, logs de auditoría completos, reportes finales y despliegue del entorno en producción (Docker / MySQL / MinIO).

---

## 9. Criterios de Aceptación del Producto
- **Aislamiento Multi-tenant:** Validación del 100% de aislamiento en base de datos. Ningún usuario puede ver registros de otra sede sin impersonación autorizada.
- **Validación Médica:** La IA no puede publicar sugerencias directamente en el perfil del socio; requiere obligatoriamente confirmación humana previa.
- **Control de Alergias:** El sistema debe impedir el guardado de planes nutricionales que contengan ingredientes declarados en las alergias del socio.
- **Límite Operativo de Socios:** Control estricto de la regla de no exceder las 3 reprogramaciones de turnos mensuales autogestionadas por el socio.
- **Calidad de Código:** Superar el 85% de aprobación en la suite de pruebas automatizadas y 100% de éxito en escenarios de prueba críticos E2E.

---

## 10. Supuestos del Proyecto
- Los gimnasios cuentan con una infraestructura de red interna estable y dispositivos aptos para la navegación web.
- Los socios declaran con veracidad sus alergias, patologías y peso inicial en su ficha de salud obligatoria.
- Los profesionales que acceden al sistema cuentan con matrículas vigentes habilitadas en la provincia de Santa Fe.
- Las sugerencias brindadas por el motor de IA de OpenAI son tratadas como borradores y no como indicaciones médicas definitivas.

---

## 11. Restricciones del Proyecto
- **Juicio Clínico:** El sistema no provee diagnósticos automáticos ni prescribe tratamientos sin supervisión humana.
- **Anticipación de Reserva:** No se pueden reservar, reprogramar ni cancelar turnos con menos de 24 horas de antelación por el socio.
- **Estado del Turno:** La consulta clínica sólo puede iniciarse si el estado del turno se encuentra previamente marcado como `PRESENTE`.
- **Legislación:** Cumplimiento con las leyes locales de protección de datos personales y confidencialidad de historias clínicas de pacientes.

---

## 12. Iteraciones del Proyecto

### **Iteración 1: Gestión de Profesionales y Reservas (Seminario de Aplicación Profesional)**
Enfocada en resolver el flujo inicial del sistema. Abarca el registro administrativo de profesionales, la configuración de horarios y el módulo de agendamiento para socios.

### **Iteración 2: Consulta Clínica y Plan Nutricional Asistido por IA (Trabajo Final de Ingeniería)**
Enfocada en la atención e interacción clínica. Abarca la toma de medidas corporales, la generación de planes de alimentación con validaciones de alergias y el uso del motor de Inteligencia Artificial como asistente estratégico para recetas.

### **Análisis del Requerimiento "Core": Reserva y Gestión de Turno**

#### **Especificación del Requerimiento Core**
La reserva de turnos permite coordinar la atención del socio. Valida que el socio tenga una ficha de salud completada (R01), que el profesional esté activo (R02), que no haya colisión horaria (R06) y que caiga dentro de los bloques de agenda configurados (R07).

#### **Guion de Interfaz de Usuario (Prototipo)**
1. **Buscar Especialistas:** Tarjetas con foto, nombre, especialidad y botón "Reservar".
2. **Calendario de Slots:** Grilla semanal que muestra los horarios libres en verde y los reservados inhabilitados.
3. **Modal de Confirmación:** Resumen del turno, recordatorio de política de cancelación (24h) y botón de confirmación.
4. **Ficha de Salud Obligatoria:** Formulario paso a paso de datos físicos iniciales en caso de primera cita.

#### **Análisis de Requisitos**

##### **Diagrama de Caso de Uso (Reserva)**
```
  Socio ──► (Buscar Profesionales)
        ──► (Visualizar Disponibilidad)
        ──► (Solicitar Turno) ◄── [include] ──► (Validar Ficha de Salud)
```

##### **Especificación del Caso de Uso (Detallada)**
- **Caso de Uso:** Solicitar Turno (CUD14)
- **Actor:** Socio
- **Precondiciones:** Socio logueado en el sistema con su cuenta activa.
- **Flujo Principal:**
  1. El socio accede a la lista de profesionales.
  2. Selecciona un profesional y visualiza su perfil y agenda.
  3. Selecciona una fecha y un horario disponible.
  4. El sistema verifica si el socio completó la ficha de salud.
  5. El sistema valida que el horario no colisione con otra reserva del socio ni de la agenda.
  6. El sistema crea el turno en estado `PROGRAMADO`.
  7. Se envía un correo de confirmación al socio y profesional.
- **Flujo Alternativo (Ficha incompleta):**
  4a. El sistema detecta que es su primer turno y no tiene ficha de salud.
  4b. Redirige al socio al formulario de Ficha de Salud.
  4c. Una vez completado, retorna al flujo de reserva.

##### **Diagrama de Dominio Conceptual**
```
+--------------+          +------------+          +-------------------+
|   Gimnasio   |1        *|   Socio    |1        *|       Turno       |
|   (Tenant)   +----------+  (Socio)   +----------+ (Estado, Fecha)   |
+-------+------+          +-----+------+          +---------+---------+
        |1                      |1                          |*
        |                       |                           |
        |*                      |1                          |1
+-------+------+          +-----+------+                    |
| Profesional  |1        *|Ficha Salud |                    |
| (Nutri/Deport+----------+            |                    |
+-------+------+          +------------+                    |
        |1                                                  |
        |                                                   |
        |1                                                  |
+-------+------+                                            |
|    Agenda    |1-------------------------------------------+
+--------------+
```

#### **Análisis del Diseño Preliminar y Detallado**

##### **Diagrama de Robustez (Lógica de Reserva)**
```
  [Socio UI] ──► (Turnos Controller) ──► (ReservarTurno UseCase) ──► [Turno Entity]
                       │                         │
                       ▼                         ▼
               (Socio Repository)     (Turno Repository)
```

##### **Diagrama de Secuencia (Reserva de Turno)**
```
Socio UI              Controller            UseCase             Repository            Database
   │                      │                    │                    │                    │
   │─── solicitar(t) ────►│                    │                    │                    │
   │                      │─── reservar(t) ───►│                    │                    │
   │                      │                    │─── validarR01() ──►│                    │
   │                      │                    │                    │─── queryFicha() ──►│
   │                      │                    │                    │◄── [Ficha Ok] ─────│
   │                      │                    │─── validarR06() ──►│                    │
   │                      │                    │                    │─── queryTurno() ──►│
   │                      │                    │                    │◄── [Libre] ────────│
   │                      │                    │─── save(turno) ───►│                    │
   │                      │                    │                    │─── INSERT SQL ────►│
   │                      │                    │                    │◄── [Creado] ───────│
   │                      │◄── [Turno Creado] ─│                    │                    │
   │◄── [Confirmado] ─────│                    │                    │                    │
```

##### **Diagrama de Clases**
```
+--------------------------------------------------+
|                  Turno (Entity)                  |
+--------------------------------------------------+
| - id: number                                     |
| - fecha: Date                                    |
| - hora: string                                   |
| - estado: EstadoTurno                            |
| - socioId: number                                |
| - profesionalId: number                          |
| - gimnasioId: number                             |
+--------------------------------------------------+
| + cambiarEstado(nuevoEstado: EstadoTurno): void  |
| + validarAnticipacion(): boolean                 |
+--------------------------------------------------+
```

#### **Implementación (Persistencia)**

##### **Modelo de Entidad-Relación (Físico)**
```
+-----------------------+        +-----------------------+        +-----------------------+
|       gimnasios       |        |       usuarios        |        |        turnos         |
+-----------------------+        +-----------------------+        +-----------------------+
| PK | id               |        | PK | id               |        | PK | id               |
|    | nombre           |        | FK | gimnasioId       |        | FK | socioId          |
+-----------------------+        |    | email            |        | FK | nutricionistaId  |
           |                     |    | password         |        | FK | gimnasioId       |
           |1                    |    | rol              |        |    | fecha            |
           |                     +-----------------------+        |    | hora             |
           |                                 |1                   |    | estado           |
           |                                 |                    +-----------------------+
           |                                 |                    
           |*                                |*                   
+----------+------------+                    |                    
|  perfiles_profesion.  |◄───────────────────+                    
+-----------------------+                                         
| PK | id               |                                         
| FK | usuarioId        |                                         
|    | matricula        |                                         
+-----------------------+                                         
```

---

## 13. Reportes / Indicadores / Estadísticas

1. **Dashboard Operativo Diario (Staff/Admin):**
   - **Tasa de Ausentismo (No-shows):** Indicador porcentual interactivo que divide la cantidad de turnos en estado `AUSENTE` sobre el total de turnos programados en el mes, con un gráfico de torta dinámico para comparar el rendimiento de los especialistas de salud.
   - **Ocupación Horaria de la Agenda:** Relación entre slots de atención reservados y la cantidad total de slots creados por profesional para optimizar las cabinas.
2. **Reporte Gráfico de Progreso del Socio (Evolución Antropométrica):**
   - **Evolución Física:** Gráfico de líneas temporal que permite seleccionar variables antropométricas (peso corporal, masa muscular y porcentaje de grasa) capturadas durante las consultas clínicas. Asiste al socio a ver su progreso e interactuar con su alimentación.
3. **Trazabilidad de Reservas (Auditoría de Turnos):**
   - **Historial de Cambios:** Reporte para el Administrador que detalla los eventos de reprogramación o cancelación, registrando el usuario autor, hora y motivo detallado de la modificación para auditorías internas.
