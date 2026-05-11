# PRD - NutriFit Supervisor

**Producto:** NutriFit Supervisor  
**Sigla:** NFS  
**Tipo de documento:** Product Requirements Document (PRD) consolidado  
**Versión:** 1.0  
**Autor del proyecto fuente:** Agustín Albónico  
**Contexto académico:** Trabajo Final de Ingeniería / Seminario de Trabajo Final de Ingeniería  
**Fecha de consolidación:** 2026-05-01  

---

## 0. Nota de consolidación

Este PRD consolida dos documentos fuente:

1. **Plan integral de negocio y estrategia de NutriFit Supervisor**, que contiene descripción general, contexto, competencia, FODA, segmentación, marketing, operaciones y plan financiero-económico.
2. **Evaluación Parcial I - TFI**, que contiene alcance funcional del módulo, objetivos, requerimientos, reglas de negocio, criterios de aceptación, supuestos, restricciones, iteraciones, pantallas, casos de uso y artefactos técnicos.

Para evitar contradicciones, el PRD separa claramente:

- **Visión de producto global:** NutriFit Supervisor como plataforma integral SaaS B2B para gimnasios con gestión operativa, rutinas, socios, profesionales de salud, IA, turnos, seguimiento y métricas.
- **Alcance MVP / módulo académico:** gestión de profesionales de salud, turnos, ficha de salud, consulta clínica, plan nutricional y asistencia de IA. Este alcance deja fuera, en la etapa actual, gestión contable, pagos, app móvil nativa, mensajería externa integrada, gestión completa del gimnasio y gestión completa de rutinas.

Cuando los documentos fuente presentan diferencias numéricas o funcionales, se registran como **observaciones de consistencia** para que el equipo decida cuál valor o definición usar como fuente final.

---

## 1. Resumen ejecutivo

NutriFit Supervisor es una plataforma web SaaS B2B orientada a gimnasios y centros de entrenamiento enfocados en salud, bienestar y acompañamiento personalizado. Su objetivo es transformar al gimnasio en un nodo digital de bienestar integral, conectando socios, entrenadores, nutricionistas, deportólogos y administradores dentro de un mismo ecosistema.

El problema central detectado es que muchos gimnasios todavía operan con planillas, agendas manuales, WhatsApp o sistemas administrativos genéricos. Estas herramientas suelen cubrir pagos, turnos o asistencia, pero no resuelven la coordinación interdisciplinaria entre entrenamiento, nutrición y seguimiento clínico. Como consecuencia, el socio no recibe una experiencia integral, el gimnasio pierde valor percibido y los profesionales trabajan con información fragmentada.

NutriFit Supervisor propone una solución moderna, responsive y accesible desde navegador, sin instalación de app nativa. El sistema permite que el socio gestione turnos con profesionales de salud, complete su ficha de salud, consulte planes alimentarios, visualice progreso y reciba acompañamiento personalizado. Los profesionales pueden gestionar agenda, consultar fichas, iniciar consultas clínicas, cargar observaciones, registrar mediciones, crear planes alimentarios y apoyarse en IA para generar ideas de comidas bajo validación humana.

La inteligencia artificial funciona como asistente estratégico, no como reemplazo profesional. Puede analizar objetivos, restricciones, historial y preferencias para sugerir recomendaciones, alertas o ideas de comidas. Toda sugerencia debe ser revisada, aceptada, editada o descartada por un profesional humano antes de impactar en el plan del socio.

El producto busca posicionarse inicialmente en Rosario y su zona de influencia, con foco en gimnasios pequeños y medianos que quieran diferenciarse mediante servicios de salud integrados sin ampliar infraestructura física ni contratar todo el equipo profesional de forma permanente.

---

## 2. Identidad del producto

| Campo | Definición |
|---|---|
| Nombre | NutriFit Supervisor |
| Sigla | NFS |
| Tipo | Plataforma web SaaS B2B |
| Cliente comprador | Gimnasios, centros de entrenamiento y centros de bienestar |
| Usuario final | Socios del gimnasio |
| Usuarios operativos | Administrador, asistente/recepcionista, entrenador, nutricionista, deportólogo/médico deportivo |
| Mercado inicial | Rosario y área metropolitana |
| Expansión proyectada | Funes, Granadero Baigorria, Villa Gobernador Gálvez, región centro del país y otros mercados de gimnasios saludables |
| Modalidad de acceso | Web responsive desde navegador moderno |
| Diferencial central | Gestión interdisciplinaria + contratación de profesionales de salud + IA asistiva contextual |
| Modelo de negocio | Suscripción mensual por sede, fee de instalación, servicios adicionales y capacitación |

---

## 3. Problema a resolver

### 3.1 Problemas del gimnasio

- Opera con herramientas fragmentadas: planillas, agendas físicas, WhatsApp, sistemas aislados o software administrativo básico.
- No cuenta con una forma ordenada de integrar nutricionistas, deportólogos o médicos deportivos al servicio del gimnasio.
- Tiene dificultades para diferenciarse sin aumentar su estructura fija.
- Necesita mejorar retención y percepción de valor del socio.
- Le cuesta coordinar información entre entrenadores y profesionales externos.
- En muchos casos, no tiene cultura digital avanzada ni tiempo para implementar sistemas complejos.

### 3.2 Problemas del socio

- Debe buscar profesionales de salud por fuera del gimnasio.
- No siempre tiene una rutina alineada con su alimentación, restricciones o antecedentes.
- Pierde información de progreso, mediciones, observaciones o historial.
- No cuenta con una vista simple de sus turnos, planes y evolución.
- Puede recibir indicaciones contradictorias entre entrenador, nutricionista y otros profesionales.

### 3.3 Problemas del profesional de salud

- Trabaja con información incompleta del socio.
- No tiene visibilidad suficiente de rutina, objetivos y evolución física.
- Debe gestionar turnos, observaciones y planes por canales dispersos.
- Tiene poca coordinación con entrenadores.
- Necesita herramientas simples para registrar consultas, mediciones, adjuntos y planes.

### 3.4 Problemas del entrenador

- No siempre conoce restricciones alimentarias, clínicas o recomendaciones del profesional de salud.
- Debe ajustar entrenamiento sin información centralizada.
- Necesita una vista de lectura de planes y observaciones públicas sin acceder a datos clínicos sensibles.

---

## 4. Oportunidad de negocio

El sector fitness evoluciona hacia experiencias más completas, personalizadas e interdisciplinarias. El usuario actual no busca únicamente entrenar: también quiere alimentarse mejor, prevenir lesiones, medir su progreso, recibir acompañamiento profesional y sentirse guiado.

Los gimnasios pequeños y medianos tienen una oportunidad concreta: ofrecer servicios premium de salud y bienestar sin convertirse en clínicas, sin ampliar su infraestructura física y sin sumar gran carga operativa. NutriFit Supervisor cubre esa brecha mediante un ecosistema digital donde el gimnasio centraliza servicios, profesionales y seguimiento.

La oportunidad se apoya en:

- Digitalización post-pandemia del consumo y de los servicios.
- Mayor familiaridad del usuario con plataformas online.
- Interés creciente en bienestar integral.
- Baja adopción de herramientas interdisciplinarias en gimnasios locales.
- Necesidad de diferenciación frente a sistemas genéricos de gestión.
- Posibilidad de generar nuevos ingresos para gimnasios y profesionales independientes.
- Falta de soluciones locales adaptadas al contexto argentino y rosarino.

---

## 5. Misión, visión y propósito estratégico

### 5.1 Misión

Ofrecer a gimnasios y centros de entrenamiento enfocados en la salud una plataforma digital integral, inteligente y accesible, que permita brindar una experiencia personalizada, profesional e interdisciplinaria a cada socio, conectando tecnología, prevención, nutrición y bienestar en un solo sistema.

### 5.2 Visión

Convertirse en el sistema de gestión y seguimiento físico de referencia en Rosario y su región, posicionando a los gimnasios orientados a la salud como centros de bienestar integral que combinan entrenamiento, alimentación y medicina deportiva mediante herramientas simples, innovadoras y efectivas.

### 5.3 Propósito estratégico

Transformar la manera en que los gimnasios orientados al bienestar gestionan la experiencia de sus socios, profesionalizando sus servicios mediante digitalización, vinculación con profesionales externos e inteligencia artificial aplicada a la personalización del acompañamiento.

---

## 6. Objetivos del producto

### 6.1 Objetivo general

Desarrollar un módulo inteligente dentro de un sistema web B2B orientado a gimnasios, que permita a cada socio acceder y contratar profesionales de la salud como nutricionistas o deportólogos, promoviendo un enfoque interdisciplinario y personalizado en el acompañamiento físico, nutricional y clínico, con apoyo de inteligencia artificial como asistente estratégico.

### 6.2 Objetivos específicos

- Diseñar una interfaz accesible y clara para que los socios visualicen, seleccionen y contraten turnos con nutricionistas y deportólogos registrados.
- Habilitar a profesionales de salud para cargar planes alimentarios, observaciones clínicas, mediciones y seguimiento.
- Desarrollar un motor de IA que analice perfil, preferencias, historial y restricciones del socio para sugerir recomendaciones nutricionales y acciones personalizadas.
- Facilitar la colaboración interdisciplinaria entre entrenadores y profesionales externos.
- Brindar al gimnasio un diferencial comercial basado en salud personalizada.
- Garantizar trazabilidad, disponibilidad y confidencialidad de información médica/nutricional.
- Centralizar gestión de perfiles profesionales, agenda, turnos, fichas de salud, consultas clínicas y planes.
- Reducir carga operativa del gimnasio mediante automatización y flujos claros.
- Generar métricas de uso, asistencia, no-shows y utilización de agenda.

---

## 7. Propuesta de valor

### 7.1 Para gimnasios

- Permite ofrecer servicios premium de nutrición, deportología y salud sin aumentar proporcionalmente la estructura operativa.
- Diferencia al gimnasio como centro de bienestar integral.
- Centraliza la gestión de profesionales, turnos y seguimiento.
- Mejora la fidelización mediante experiencias personalizadas.
- Acompaña la adopción digital con una interfaz simple y capacitación.
- Reduce tareas manuales y dispersión de información.
- Permite generar nuevos canales de ingreso o valor agregado.

### 7.2 Para socios

- Acceso directo a profesionales desde el perfil del gimnasio.
- Turnos, planes, observaciones y progreso en un único lugar.
- Planes alimentarios y recomendaciones alineadas con objetivos y restricciones.
- Experiencia guiada, simple y accesible desde cualquier dispositivo.
- Mayor claridad sobre evolución física, mediciones y recomendaciones.

### 7.3 Para profesionales de salud

- Agenda digital y listado de pacientes asignados.
- Acceso a ficha de salud del socio.
- Registro de consultas, mediciones, observaciones, documentos y planes.
- Herramientas de IA para generar ideas de comidas o recomendaciones preliminares.
- Posibilidad de trabajar con gimnasios sin depender de procesos manuales.

### 7.4 Para entrenadores

- Visualización parcial de planes y observaciones públicas.
- Mayor coordinación con nutricionistas/deportólogos.
- Mejor contexto para ajustar rutinas.
- Menos dependencia de mensajes informales o datos incompletos.

---

## 8. Diferenciadores del producto

1. **Integración interdisciplinaria real:** conecta gimnasio, socios, entrenadores y profesionales externos en una única plataforma.
2. **Modelo B2B adaptado al gimnasio:** el gimnasio compra la herramienta y la utiliza para fortalecer su propuesta de valor.
3. **Contratación/reserva de turnos con profesionales de salud:** el socio puede acceder a nutricionistas y deportólogos desde su perfil.
4. **IA aplicada a salud y bienestar:** recomendaciones y sugerencias orientadas a decisiones profesionales, no solo marketing o retención.
5. **Web responsive sin instalación:** accesible desde computadora, tablet o celular.
6. **Enfoque local:** diseñado para gimnasios de Rosario y Argentina, con costos y adopción realistas.
7. **Bajo costo operativo:** permite sumar servicios premium sin ampliar infraestructura física.
8. **Roles diferenciados:** cada perfil tiene acceso a lo que necesita, protegiendo datos sensibles.
9. **Acompañamiento y capacitación:** onboarding práctico para gimnasios tradicionales.

---

## 9. Mercado, contexto y competencia

### 9.1 Contexto local y sectorial

Argentina y Rosario atraviesan un proceso de digitalización gradual. En fitness y salud se observa una demanda creciente de servicios integrales que combinen entrenamiento, nutrición, prevención y seguimiento. Muchos gimnasios todavía están poco digitalizados, lo que representa una oportunidad para una solución simple, cercana y escalable.

Factores relevantes:

- **Económicos:** inflación, poder adquisitivo, costos dolarizados de tecnología, necesidad de precios flexibles en pesos, acceso limitado a crédito.
- **Impositivos:** marco argentino complejo, pero con oportunidades para servicios digitales y pymes.
- **Tecnológicos:** mayor uso de smartphones, comercio electrónico, soluciones web y sistemas responsive.
- **Políticos/jurídicos:** necesidad de respetar confidencialidad de datos personales y clínicos, habilitaciones profesionales e incumbencias.
- **Culturales:** usuarios más conscientes del bienestar, pero gimnasios todavía acostumbrados a procesos manuales.

### 9.2 Competidores relevados

#### Competidores internacionales

| Competidor | Enfoque principal | Limitación frente a NFS |
|---|---|---|
| GymMaster | Gestión administrativa, pagos, reservas, asistencia | No integra profesionales externos de salud ni colaboración interdisciplinaria profunda |
| Wodify | Boxes CrossFit, clases, rendimiento | Foco en performance deportiva; no en salud integral con nutricionistas/deportólogos |
| Zen Planner | Gestión de membresías, clases y reservas | Orientación operativa; baja integración clínica/nutricional |
| Glofox | Gestión fitness y marketing | IA más comercial/operativa que asistiva en salud |
| My PT Hub / TrueCoach | Entrenadores personales y coaching online | No centraliza gimnasio como nodo B2B interdisciplinario |
| VirtuaGym | Gestión fitness, app, nutrición básica | Nutrición y entrenamiento no integran profesionales externos de forma colaborativa |
| NutritioApp | Nutrición, planes, calorías, hábitos | No integra gestión del gimnasio ni entrenamiento físico institucional |

#### Competidores nacionales / regionales

| Competidor | Enfoque principal | Limitación frente a NFS |
|---|---|---|
| FIIT | Gestión local de gimnasios, turnos, rutinas, pagos, nutrición simple | Sin IA ni integración profunda entre entrenadores y nutricionistas |
| SportClub App / Trainingym | Ecosistema cerrado para SportClub, reservas, fidelización, nutrición básica | Cerrado a una cadena; no aplicable a gimnasios independientes |
| Fitco | Gestión administrativa de gimnasios y estudios | Foco operativo, no interdisciplinario clínico/nutricional |
| AgendaPro | Agenda y gestión de turnos para servicios | No conecta entrenamiento, salud y nutrición en un ecosistema gimnasio |
| Wellhub | Bienestar corporativo | Orientado a empresas/corporativo, no a gestión interna del gimnasio |
| SigueFit | Gestión operativa | Sin enfoque fuerte en salud interdisciplinaria e IA asistiva |
| Hexfit | Seguimiento fitness/salud | Puede competir en seguimiento, pero no necesariamente desde el modelo B2B local propuesto |

### 9.3 Factores críticos de éxito

- Integrar entrenadores, nutricionistas, deportólogos y socios en un flujo realmente colaborativo.
- Lograr una IA útil, clara, controlada y validada por profesionales.
- Diseñar una experiencia simple para gimnasios con baja madurez digital.
- Implementar pilotos reales en Rosario.
- Construir casos de éxito medibles.
- Ofrecer soporte y capacitación cercana.
- Mantener precio accesible y previsible.
- Garantizar privacidad y control de acceso a información sensible.
- Permitir escalamiento gradual a más sedes y profesionales.

---

## 10. Análisis FODA consolidado

### 10.1 Fortalezas

- Integración directa entre gimnasio, socio y profesionales externos en una sola plataforma.
- Modelo B2B que permite ofrecer servicios premium sin aumentar estructura operativa.
- Interfaz moderna, responsive y segmentada por rol.
- IA aplicada a recomendaciones y asistencia interdisciplinaria.
- Enfoque local adaptado a Rosario y Argentina.
- Bajo requerimiento técnico para implementación.
- Capacidad de funcionar como plataforma modular y escalable.
- Acompañamiento postventa y capacitación.

### 10.2 Oportunidades

- Tendencia creciente hacia bienestar integral.
- Digitalización post-pandemia del sector fitness.
- Gimnasios independientes buscando diferenciarse.
- Posibilidad de alianzas con redes de gimnasios y profesionales independientes.
- Mercado local con baja adopción de herramientas interdisciplinarias.
- Potencial de expansión regional.

### 10.3 Debilidades

- Producto en fase inicial sin casos reales consolidados.
- Requiere acuerdos con profesionales externos.
- Necesita capacitación inicial en gimnasios tradicionales.
- Depende de conectividad estable.
- Puede requerir cambio cultural en la forma de trabajar entre roles.
- Costos tecnológicos potencialmente dolarizados.

### 10.4 Amenazas

- Competencia de plataformas internacionales con mayor inversión.
- Resistencia al cambio de gimnasios y usuarios.
- Inestabilidad económica e inflación.
- Dificultad para comunicar el valor sin que parezca un costo extra.
- Problemas urbanos o de seguridad que afecten asistencia al gimnasio.
- Dificultad de asegurar disponibilidad suficiente de profesionales.

### 10.5 Estrategias FODA cruzado

| Cruce | Estrategia |
|---|---|
| Fortalezas + Oportunidades | Posicionar NFS como solución local, interdisciplinaria y escalable para gimnasios que buscan bienestar integral. |
| Debilidades + Oportunidades | Usar capacitaciones, plantillas y onboarding para transformar baja digitalización en adopción gradual. |
| Fortalezas + Amenazas | Diferenciarse de plataformas globales por cercanía, adaptación local e IA con foco profesional. |
| Debilidades + Amenazas | Precios en moneda local, proveedores nacionales cuando sea posible, soporte personalizado y pilotos controlados. |

---

## 11. Segmentación

### 11.1 Segmentación geográfica

- Rosario como mercado inicial.
- Área metropolitana: Funes, Granadero Baigorria, Villa Gobernador Gálvez y localidades cercanas.
- Zonas céntricas y comerciales con gimnasios de mayor estructura.
- Barrios residenciales de clase media/media-alta con estudios pequeños orientados a atención personalizada.
- Expansión futura a otras ciudades argentinas.

### 11.2 Segmentación demográfica

#### Cliente B2B

- Gimnasios pequeños y medianos.
- Centros de entrenamiento funcional.
- Estudios fitness/boutique.
- Centros con enfoque en bienestar, salud y acompañamiento personalizado.

#### Usuario final

- Adultos jóvenes y de mediana edad, principalmente 21 a 50 años.
- Usuarios activos, con acceso a tecnología.
- Personas que valoran personalización, eficiencia y seguimiento.
- También puede incluir adultos mayores que buscan control profesional y jóvenes familiarizados con herramientas digitales.

### 11.3 Segmentación psicográfica

- Gimnasios que desean diferenciarse por calidad y cuidado.
- Dueños con apertura a innovación práctica, no necesariamente técnica.
- Socios que buscan sentirse acompañados, evitar lesiones y mejorar hábitos.
- Profesionales que quieren trabajar con información ordenada y trazable.

### 11.4 Segmentación conductual

- Gimnasios que ya usan planillas, WhatsApp o apps sueltas y sienten sus límites.
- Centros que necesitan modernizarse sin reinventar toda su operación.
- Socios que esperan una experiencia rápida, simple y clara.
- Profesionales que necesitan agendas, historiales y planes centralizados.

---

## 12. Stakeholders e interesados

| Rol | Expectativas principales | Influencia | Fase de mayor interés | Clasificación |
|---|---|---:|---|---|
| Dueño del gimnasio | Incorporar profesionales de salud, mejorar propuesta comercial, fidelizar socios | Alta | Inicio y puesta en marcha | Interno / Apoyo |
| Administrador | Gestionar parámetros, roles, branding, profesionales y métricas | Alta | Implementación y operación | Interno / Apoyo |
| Asistente administrativa / Recepcionista | Registrar profesionales, gestionar agenda, check-in, no-shows, reprogramaciones | Media | Implementación y operación | Interno / Apoyo |
| Nutricionista | Cargar planes, hacer seguimiento, acceder a historial y mediciones | Media | Implementación y operación | Externo / Apoyo |
| Deportólogo / médico deportivo | Registrar observaciones clínicas y colaborar con entrenadores | Media | Implementación y operación | Externo / Apoyo |
| Entrenador | Visualizar planes/observaciones públicas para coordinar entrenamiento | Baja/Media | Operación | Interno / Apoyo |
| Socio | Reservar turnos, ver planes, progreso y observaciones | Alta | Operación | Externo / Apoyo |
| Motor de IA | Generar sugerencias útiles sin reemplazar al profesional | Media | Diseño y operación | Componente interno |
| Equipo fundador | Construcción, validación, comercialización y soporte | Alta | Todas | Interno / Apoyo |

---

## 13. Personas principales

### 13.1 Dueño/Administrador del gimnasio

**Objetivo:** mejorar propuesta de valor, retener socios y profesionalizar servicios.  
**Dolores:** procesos manuales, baja diferenciación, falta de seguimiento integrado.  
**Necesita:** métricas, gestión de profesionales, control por roles, soporte, pilotos y precio accesible.

### 13.2 Socio

**Objetivo:** entrenar, alimentarse mejor, prevenir lesiones y ver progreso.  
**Dolores:** planes dispersos, falta de seguimiento, dificultad para encontrar profesionales.  
**Necesita:** turnos, ficha de salud, planes, progreso, recomendaciones y experiencia simple.

### 13.3 Profesional de salud

**Objetivo:** atender pacientes del gimnasio con contexto y seguimiento.  
**Dolores:** información incompleta, agenda dispersa, planes sin trazabilidad.  
**Necesita:** agenda, ficha, consulta, mediciones, adjuntos, plan alimentario, IA asistiva y auditoría.

### 13.4 Entrenador

**Objetivo:** adaptar entrenamiento con información útil del socio.  
**Dolores:** desconocimiento de restricciones, objetivos o recomendaciones nutricionales.  
**Necesita:** acceso de lectura a observaciones públicas y planes relevantes.

### 13.5 Asistente/Recepcionista

**Objetivo:** operar agenda y gestión diaria.  
**Dolores:** reprogramaciones manuales, ausencias, consultas repetitivas.  
**Necesita:** agenda por profesional, turnos del día, check-in, no-show, gestión básica de profesionales.

---

## 14. Alcance del producto

### 14.1 Alcance de producto global

La visión completa de NutriFit Supervisor contempla:

- Gestión de gimnasios y sedes.
- Gestión de socios.
- Gestión de entrenadores.
- Gestión de rutinas diferenciadas por día/tipo.
- Gestión de profesionales de salud.
- Agenda y turnos.
- Ficha de salud.
- Consulta clínica.
- Plan alimentario.
- Seguimiento y progreso.
- IA asistiva para recomendaciones, planes, comidas y consultas frecuentes.
- Notificaciones.
- Métricas y reportes.
- Administración de cuotas, permisos y acceso en una visión futura o módulo separado.

### 14.2 Alcance MVP / módulo actual

El alcance funcional inmediato se concentra en:

1. Gestión de profesionales de salud.
2. Visualización y reserva de turnos por parte del socio.
3. Cancelación y reprogramación de turnos.
4. Ficha de salud del socio.
5. Agenda y turnos del profesional.
6. Check-in y ausencias por recepción.
7. Consulta clínica.
8. Observaciones, mediciones y adjuntos.
9. Plan de alimentación del socio.
10. Visualización del plan por profesional, socio y entrenador en modo lectura.
11. IA para ideas de comidas y eventualmente recetas.
12. Notificaciones internas y recordatorios.
13. Reportes básicos de progreso e indicadores operativos.

### 14.3 Inclusiones del módulo

| Categoría | Inclusión |
|---|---|
| Gestión de profesionales | Alta, modificación, desactivación/eliminación lógica, especialidades, horarios, credenciales |
| Turnos | Solicitar, reservar, cancelar, reprogramar, consultar histórico y detalles |
| Ficha de salud | Carga inicial, actualización, objetivos, peso, altura, alergias, patologías, hábitos, observaciones |
| Agenda | Disponibilidad por profesional, cupos, solapamientos, asignación manual |
| Recepción | Check-in, ausente automático, listado del día |
| Consulta clínica | Iniciar, registrar datos, cargar adjuntos, finalizar y bloquear edición |
| Plan alimentario | Crear, editar, eliminar con soft delete, ver por días/comidas |
| IA | Sugerir ideas de comidas, validar contra restricciones, no enviar PII |
| Notificaciones | Recordatorios, cambios de plan, consulta finalizada, eventos de turno |
| Reportes | Progreso de socio, historial, exportaciones, KPI básicos |

### 14.4 Exclusiones actuales

- App móvil nativa.
- Procesamiento de pagos entre socio y profesional.
- Facturación, contabilidad o impuestos de servicios contratados.
- Mensajería sincrónica integrada tipo WhatsApp/SMS/chat clínico.
- Soporte multilingüe.
- Importación masiva automatizada de datos externos.
- Personalización avanzada de interfaz por usuario.
- Gestión completa del gimnasio dentro del módulo actual: máquinas, ejercicios, equipamiento, empleados, planes, cupos generales.
- Gestión completa de rutinas dentro del módulo actual. Se considera parte de la visión global o de otro módulo.
- Reemplazo de criterio profesional por IA.

### 14.5 Dependencias externas/internas

- La lógica específica de vinculación formal entre socio y profesional, disponibilidad, validaciones de cupo y asignación puede depender de un módulo paralelo.
- El módulo de rutinas puede existir o desarrollarse por separado.
- La integración con pagos o facturación queda fuera del alcance inicial.
- El uso de WhatsApp como canal parametrizable aparece en reglas de notificación, pero no implica mensajería sincrónica completa.

---

## 15. Roles y permisos

| Rol | Permisos principales |
|---|---|
| Socio | Gestionar turnos propios, cargar/editar ficha de salud, ver plan vigente, progreso e historial propio |
| Profesional | Gestionar agenda, ver socios asignados, ver ficha de salud, iniciar consulta, registrar observaciones/mediciones, crear/editar/eliminar planes |
| Recepcionista/Asistente | Asignar, reprogramar y cancelar turnos; registrar check-in/no-show; ver agenda del día por profesional; gestionar profesionales si corresponde |
| Administrador | Gestionar profesionales, roles, parámetros operativos, branding, reportes/KPI y configuración general |
| Entrenador | Ver plan y observaciones públicas habilitadas; no editar ficha clínica ni plan |
| IA | Asistir mediante sugerencias bajo control humano; no toma decisiones autónomas ni accede a PII innecesaria |

---

## 16. Requerimientos funcionales consolidados

### 16.1 Gestión de profesionales

| ID | Requerimiento |
|---|---|
| RF01 | El sistema debe permitir al asistente registrar nuevos profesionales. |
| RF02 | El sistema debe permitir modificar los datos de un profesional existente. |
| RF03 | El sistema debe permitir desactivar o eliminar un profesional. |
| RF04 | El sistema debe mostrar un listado de todos los profesionales registrados. |
| RF05 | El sistema debe permitir asignar una o más especialidades a cada profesional, por ejemplo nutricionista o deportólogo. |
| RF06 | El sistema debe permitir configurar los horarios de atención de cada profesional. |

### 16.2 Gestión de turnos por socio

| ID | Requerimiento |
|---|---|
| RF07 | El sistema debe permitir al socio visualizar perfil y disponibilidad de profesionales. |
| RF08 | El sistema debe permitir al socio solicitar un turno con el profesional seleccionado. |
| RF09 | El sistema debe permitir al socio cancelar un turno reservado. |
| RF10 | El sistema debe permitir al socio reprogramar un turno previamente reservado. |
| RF11 | El sistema debe mostrar al socio el listado de turnos reservados, pasados y futuros. |
| RF12 | El sistema debe mostrar detalles del profesional antes de reservar: nombre, especialidad, presentación y horarios. |
| RF13 | El sistema debe requerir que el socio complete su ficha de salud la primera vez que solicita un turno con especialista. |

### 16.3 Ficha de salud

| ID | Requerimiento |
|---|---|
| RF14 | El sistema debe permitir al socio completar ficha de salud con estatura, peso actual, nivel de actividad física, alergias/patologías, objetivo personal, fumador, consumo de alcohol y observaciones. |
| RF15 | El sistema debe permitir al socio modificar su ficha de salud luego de completarla. |
| RF16 | El sistema debe mostrar al profesional la ficha de salud del socio en cada turno. |

### 16.4 Gestión de turnos del día por profesional

| ID | Requerimiento |
|---|---|
| RF17 | El sistema debe permitir al profesional visualizar todos sus turnos del día. |
| RF18 | El sistema debe permitir al profesional filtrar turnos por socio, horario u objetivo. |
| RF19 | El sistema debe permitir al profesional acceder a la ficha de salud del socio antes de la sesión. |

### 16.5 Atención y seguimiento profesional

| ID | Requerimiento |
|---|---|
| RF20 | El sistema debe permitir al profesional registrar observaciones sobre el turno realizado. |
| RF21 | El sistema debe permitir registrar indicadores físicos del socio: peso, IMC, medidas u otros. |
| RF22 | El sistema debe guardar historial de turnos y observaciones del profesional por socio. |

### 16.6 Visualización del progreso por socio

| ID | Requerimiento |
|---|---|
| RF23 | El sistema debe mostrar al socio su historial de turnos con cada profesional. |
| RF24 | El sistema debe mostrar gráficamente evolución física: peso, IMC u otros datos registrados. |
| RF25 | El sistema debe permitir visualizar documentos o recomendaciones cargadas por el profesional. |
| RF26 | Un turno se considera ausente si el socio no se presenta o se presenta luego de media hora del horario del turno. |

### 16.7 Consulta clínica - segunda iteración

| ID | Requerimiento |
|---|---|
| RF27 | Iniciar consulta únicamente si el turno está PRESENTE. |
| RF28 | Registrar observaciones clínicas en texto y adjuntos en la consulta. |
| RF29 | Registrar mediciones como peso, perímetros u otras, con validación de rango. |
| RF30 | Finalizar consulta dejando el turno como REALIZADO/TERMINADO y bloqueando edición, permitiendo anexos con auditoría. |

### 16.8 Plan de alimentación

| ID | Requerimiento |
|---|---|
| RF31 | Crear plan de alimentación del socio, con un solo plan activo por socio/profesional, mínimo 1 día, 1 comida y objetivo nutricional informado. **Observación:** en el documento fuente el identificador RF31 aparece sin descripción; se completa por consistencia con alcance y reglas RB-PLA. |
| RF32 | Editar plan agregando/quitando comidas o ítems, cambiando notas/macros, con motivo y auditoría. |
| RF33 | Eliminar plan mediante soft delete con motivo; el socio queda sin plan activo. |
| RF34 | Ver plan por día/comidas para Profesional, Socio y Entrenador en modo lectura. |
| RF35 | Validar que el plan no incluya ingredientes presentes en alergias/restricciones del socio; bloquear con incidencias. |

### 16.9 IA para ideas de comidas

| ID | Requerimiento |
|---|---|
| RF36 | En crear/editar plan, permitir acción “Sugerir con IA” con Objetivo obligatorio, Restricciones opcional e Info extra obligatoria. |
| RF37 | La IA debe devolver exactamente 2 propuestas con nombre, ingredientes con cantidades/unidades y pasos de preparación de 1 a 5 pasos. **Observación:** en el documento fuente el identificador RF37 aparece sin descripción; se completa por consistencia con RB-IA-04. |
| RF38 | Si una propuesta contiene ingredientes prohibidos, descartarla automáticamente y permitir reintento. |

### 16.10 Progreso, historial y notificaciones

| ID | Requerimiento |
|---|---|
| RF39 | Ver progreso del socio mediante curvas/tablas por período usando datos de consulta; exportar CSV/PDF. |
| RF40 | Notificar al socio al crear, editar o eliminar plan y al finalizar consulta. |

### 16.11 Requerimientos funcionales adicionales derivados del negocio

| ID | Requerimiento |
|---|---|
| RF41 | El sistema debe permitir al administrador consultar métricas generales del establecimiento. |
| RF42 | El sistema debe permitir configurar parámetros operativos por gimnasio: recordatorios, check-in, ausente automático y políticas de cancelación. |
| RF43 | El sistema debe permitir branding básico por gimnasio en futuras versiones o configuración administrativa. |
| RF44 | El sistema debe permitir registrar auditoría de acciones relevantes: usuario, acción, fecha/hora y origen. |
| RF45 | El sistema debe permitir al profesional exportar historial de consultas o progreso cuando corresponda. |
| RF46 | El sistema debe permitir al administrador consultar KPI básicos: asistencia, no-shows y utilización de agenda por rango de fechas. |
| RF47 | El sistema debe permitir responder consultas frecuentes del gimnasio mediante IA o asistente informativo en visión futura. |
| RF48 | El sistema debe contemplar futuras recomendaciones integradas entre rutina, alimentación, preferencias y observaciones. |

---

## 17. Reglas de negocio

### 17.1 Generales

| ID | Regla |
|---|---|
| RB-GEN-01 | El sistema opera por gimnasio/tenant; los datos se aíslan por gimnasio. |
| RB-GEN-02 | Toda acción relevante registra auditoría: quién, qué, cuándo y desde dónde. |
| RB-GEN-03 | Las funciones se controlan por roles y permisos RBAC. |

### 17.2 Roles y permisos mínimos

| ID | Regla |
|---|---|
| RB-ROL-01 | Socio: autogestiona turnos propios, carga ficha de salud, ve plan y progreso. |
| RB-ROL-02 | Profesional: gestiona agenda, consulta clínica, planes de alimentación de socios asignados y puede ver ficha de salud. |
| RB-ROL-03 | Recepcionista/Asistente: asigna, reprograma y cancela turnos; registra check-in/no-show; ve agenda del día por profesional. |
| RB-ROL-04 | Administrador: gestiona profesionales, roles, parámetros operativos y branding. |
| RB-ROL-05 | Entrenador: solo lectura de plan y observaciones habilitadas; no edita ficha ni plan. |

### 17.3 Profesional

| ID | Regla |
|---|---|
| RB-PRO-01 | Para dar de alta un profesional se requiere matrícula/credencial y especialidad. |
| RB-PRO-02 | Un profesional inactivo no puede recibir turnos. |
| RB-PRO-03 | La agenda del profesional define días/horarios disponibles; fuera de agenda no se asignan turnos. |

### 17.4 Socio

| ID | Regla |
|---|---|
| RB-SOC-01 | El socio puede solicitar, reprogramar o cancelar turnos propios según política del centro. |
| RB-SOC-02 | El socio debe mantener ficha de salud actualizada; los cambios quedan auditados. |
| RB-SOC-03 | El socio puede ver su plan vigente y progreso. |

### 17.5 Ficha de salud

| ID | Regla |
|---|---|
| RB-FIS-01 | La ficha incluye como mínimo altura, peso, alergias/restricciones y objetivos. |
| RB-FIS-02 | Las alergias/restricciones deben almacenarse normalizadas mediante catálogo + relación. |
| RB-FIS-03 | Si hay contraindicaciones, deben bloquearse asignaciones de plan o acciones que las violen. |

### 17.6 Turnos

| ID | Regla |
|---|---|
| RB-TUR-01 | Estados válidos: PROGRAMADO, PRESENTE, EN_CURSO, REALIZADO, CANCELADO, AUSENTE. |
| RB-TUR-02 | La confirmación del socio es un dato `confirmedAt`, no un estado. |
| RB-TUR-03 | No se permite doble reserva del mismo socio con el mismo profesional y hora. |
| RB-TUR-04 | La reprogramación mantiene el mismo turno pero cambia fecha/hora y queda auditada. |
| RB-TUR-05 | La cancelación indica motivo y fecha; no puede revertirse. |
| RB-TUR-06 | El plazo mínimo de cancelación/reprogramación es parametrizable por gimnasio. |

### 17.7 Recepción y ausencias

| ID | Regla |
|---|---|
| RB-REC-01 | El check-in lo realiza recepción desde listado de turnos del día. |
| RB-REC-02 | Al hacer check-in, el turno pasa a PRESENTE y se registra `checkInAt`. |
| RB-REC-03 | Si pasan más de 30 minutos desde la hora programada sin check-in, el sistema cambia el turno a AUSENTE automáticamente. |
| RB-REC-04 | Solo un turno PRESENTE habilita al profesional a iniciar consulta. |
| RB-REC-05 | No se puede registrar check-in para turnos CANCELADOS, REALIZADOS o AUSENTES. |

### 17.8 Consulta clínica

| ID | Regla |
|---|---|
| RB-CON-01 | Solo se puede iniciar consulta si el turno está PRESENTE. |
| RB-CON-02 | Durante la consulta se registran observaciones, peso/medidas, adjuntos y recomendaciones. |
| RB-CON-03 | Al finalizar, el turno pasa a REALIZADO y se bloquea edición, permitiendo anexos con auditoría. |
| RB-CON-04 | Si no hubo check-in y se vence el día, la consulta no puede iniciarse y el turno queda AUSENTE. |

### 17.9 Plan de alimentación

| ID | Regla |
|---|---|
| RB-PLA-01 | Un socio puede tener un único plan activo a la vez. |
| RB-PLA-02 | Crear plan requiere mínimo 1 día, 1 comida y objetivo nutricional. |
| RB-PLA-03 | Editar plan requiere motivo y deja auditoría de cambios. |
| RB-PLA-04 | Eliminar plan realiza borrado lógico e indica motivo. |
| RB-PLA-05 | Solo Profesional o Administrador puede crear/editar/eliminar plan; Socio y Entrenador solo lectura. |
| RB-PLA-06 | Si el plan incluye ingredientes presentes en alergias/restricciones, el sistema bloquea y muestra incidencias. |
| RB-PLA-07 | Al crear/editar/eliminar plan, se notifica al socio. |

### 17.10 IA

| ID | Regla |
|---|---|
| RB-IA-01 | La IA opera como asistente; toda propuesta requiere validación del Profesional. |
| RB-IA-02 | Entrada mínima para ideas de comida: Objetivo obligatorio, Restricciones opcional e Info extra obligatoria. |
| RB-IA-03 | La IA no recibe datos personales del socio; solo parámetros nutricionales y restricciones. |
| RB-IA-04 | Cada solicitud devuelve exactamente 2 propuestas con nombre, ingredientes con cantidades/unidades y pasos máximos de 5. |
| RB-IA-05 | Si una propuesta contiene ingrediente prohibido, se descarta automáticamente. |
| RB-IA-06 | Si se habilita receta, genera pasos y tiempos desde una comida del plan con disclaimer “Sugerido por IA”. |
| RB-IA-07 | Errores de IA, timeout o formato inválido no bloquean la edición manual. |

### 17.11 Notificaciones

| ID | Regla |
|---|---|
| RB-NOT-01 | El sistema envía recordatorios de turno 24/48 h antes con enlace para reprogramar/cancelar. |
| RB-NOT-02 | Si el socio confirma desde recordatorio, se guarda `confirmedAt` y no cambia estado. |
| RB-NOT-03 | Al marcar PRESENTE, el sistema puede notificar al profesional de forma configurable. |
| RB-NOT-04 | Al crear/editar/eliminar plan, se notifica al socio. |
| RB-NOT-05 | Plantillas y canales como email/WhatsApp son parametrizables por gimnasio. |

### 17.12 Agenda

| ID | Regla |
|---|---|
| RB-AGE-01 | La asignación respeta disponibilidad de agenda por profesional. |
| RB-AGE-02 | Recepcionista/Asistente puede asignar turnos manuales a pedido del socio. |
| RB-AGE-03 | El Profesional puede abrir/cerrar cupos; cerrar cupo bloquea nuevas asignaciones. |
| RB-AGE-04 | El sistema impide solapamientos de turnos del mismo profesional. |

### 17.13 Visibilidad

| ID | Regla |
|---|---|
| RB-VIS-01 | El Profesional solo ve fichas y planes de socios asignados o por derivación. |
| RB-VIS-02 | El Entrenador ve plan y observaciones públicas habilitadas; no datos clínicos sensibles. |
| RB-VIS-03 | Recepción no accede a contenido clínico; solo datos operativos de turnos y contacto. |

### 17.14 Reportes, datos y políticas

| ID | Regla |
|---|---|
| RB-REP-01 | El progreso se calcula con consultas, peso/medidas y adherencia si se habilita. |
| RB-REP-02 | El Profesional puede ver historial de consultas y descargar/exportar. |
| RB-REP-03 | El Administrador accede a KPI básicos por rango de fechas. |
| RB-DAT-01 | Adjuntos clínicos aceptados: imágenes/PDF hasta tamaño máximo definido. |
| RB-DAT-02 | Planes eliminados quedan ocultos para socio pero disponibles en histórico con auditoría. |
| RB-DAT-03 | No se permite editar consulta finalizada; solo anexos con auditoría. |
| RB-POL-01 | Ventanas de recordatorio y check-in son configurables por gimnasio. |
| RB-POL-02 | Umbral de AUSENTE automático por defecto +30 min, configurable. |
| RB-POL-03 | Políticas de cancelación, plazo y penalidades son configurables. |

---

## 18. Requerimientos no funcionales

### 18.1 Rendimiento y disponibilidad

| ID | Requerimiento |
|---|---|
| RNF01 | Disponibilidad mínima del 99%. |
| RNF02 | Soportar al menos 100 usuarios concurrentes sin degradar experiencia. |
| RNF03 | Tiempo de respuesta menor a 2 segundos en el 95% de operaciones. |
| RNF04 | Escalabilidad horizontal para soportar más gimnasios y profesionales. |
| RNF-I2-07 | p95 menor a 250 ms para ver plan/progreso y p95 menor a 700 ms para sugerir con IA. |

### 18.2 Seguridad y privacidad

| ID | Requerimiento |
|---|---|
| RNF05 | Autenticación mediante correo electrónico y contraseña segura. |
| RNF06 | Contraseñas almacenadas con hash + salt. |
| RNF07 | Control de acceso basado en roles: Administrador, Profesional, Socio y roles operativos. |
| RNF08 | Profesional solo accede a fichas de socios con turno/asignación. |
| RNF09 | Logs de acceso a datos sensibles para auditoría. |
| RNF10 | Transmisión cifrada mediante HTTPS. |
| RNF-I2-08 | No enviar PII del socio en prompts de IA; auditar crear/editar/eliminar plan y finalizar consulta. |
| RNF-I2-12 | Visibilidad por rol: Entrenador solo plan/observaciones públicas; Recepción sin datos clínicos. |

### 18.3 Usabilidad

| ID | Requerimiento |
|---|---|
| RNF11 | Interfaz intuitiva, clara y accesible para usuarios sin conocimientos técnicos. |
| RNF12 | Diseño responsive para desktop y mobile. |
| RNF13 | Mensajes de error claros con sugerencias de acción. |
| RNF-I2-10 | Acciones Agregar/Descartar claras en tarjetas de IA; errores no técnicos. |

### 18.4 Mantenibilidad y escalabilidad

| ID | Requerimiento |
|---|---|
| RNF14 | Arquitectura modular para futuros módulos. |
| RNF15 | Código documentado y entendible. |
| RNF16 | Nuevas funcionalidades integrables sin modificar lógica central. |
| RNF-I2-11 | Endpoints REST con DTOs validados, logs estructurados, pruebas unitarias y e2e de flujos core. |

### 18.5 Portabilidad y compatibilidad

| ID | Requerimiento |
|---|---|
| RNF17 | Accesible desde Chrome, Firefox, Edge y Safari. |
| RNF18 | Ejecutable en cualquier sistema operativo con navegador: Windows, macOS, Linux. |

### 18.6 Integridad de datos

| ID | Requerimiento |
|---|---|
| RNF19 | Validar todos los datos ingresados para evitar inconsistencias. |
| RNF20 | Ante corte de sesión/error inesperado, no perder datos críticos ingresados. |
| RNF21 | Turnos, historial clínico y observaciones deben persistir íntegros en el tiempo. |
| RNF-I2-09 | Edición de plan y cierre de consulta en transacción; soft delete coherente. |

---

## 19. Arquitectura y tecnología

### 19.1 Stack definido en documentos fuente

| Capa | Tecnología |
|---|---|
| Frontend | React.js + TypeScript |
| Backend | C# + ASP.NET Core |
| Base de datos | Microsoft SQL Server |
| Acceso | Web responsive desde navegador |
| Arquitectura lógica | Controladores, servicios, repositorios, DTOs validados |
| Seguridad | HTTPS, RBAC, hash + salt, auditoría |
| IA | Servicio asistivo integrado al flujo profesional, sin PII en prompts |

### 19.2 Principios técnicos

- Modularidad por dominios: profesionales, turnos, ficha, consulta, plan, IA, notificaciones, reportes.
- Separación por tenant/gimnasio.
- RBAC estricto.
- Auditoría transversal.
- Soft delete para datos clínicos/planes cuando corresponda.
- Validaciones de dominio en backend.
- UI clara con flujos guiados.
- Logs estructurados.
- Pruebas unitarias y e2e en flujos core.

### 19.3 Componentes principales

1. **Módulo de autenticación y roles.**
2. **Módulo de gimnasios/tenant.**
3. **Módulo de profesionales.**
4. **Módulo de socios.**
5. **Módulo de ficha de salud.**
6. **Módulo de agenda y turnos.**
7. **Módulo de recepción/check-in.**
8. **Módulo de consulta clínica.**
9. **Módulo de plan alimentario.**
10. **Módulo de IA asistiva.**
11. **Módulo de notificaciones.**
12. **Módulo de progreso/reportes.**
13. **Módulo de auditoría.**
14. **Módulo de configuración operativa.**

---

## 20. Modelo conceptual de dominio

### 20.1 Entidades principales

| Entidad | Descripción |
|---|---|
| Gimnasio/Tenant | Cliente institucional que contiene usuarios, profesionales, socios y configuración. |
| Usuario | Cuenta de acceso con credenciales y rol. |
| Rol/Permiso | Define capacidades por perfil. |
| Socio | Usuario final del gimnasio. |
| Profesional | Nutricionista, deportólogo o médico deportivo vinculado al gimnasio. |
| Especialidad | Tipo profesional asociado: nutrición, deportología, medicina deportiva, etc. |
| AgendaProfesional | Días, horarios, cupos y disponibilidad. |
| Turno | Reserva entre socio y profesional. |
| FichaSalud | Datos físicos, hábitos, objetivos y restricciones. |
| Restricción/Alergia | Catálogo normalizado asociado a ficha. |
| ConsultaClinica | Sesión profesional asociada a turno presente. |
| Medición | Peso, perímetros, IMC u otros indicadores. |
| ObservaciónClinica | Texto profesional público o privado según visibilidad. |
| AdjuntoClinico | PDF o imagen asociada a consulta. |
| PlanAlimentario | Plan activo o histórico asociado al socio. |
| DíaPlan | Día dentro del plan. |
| Comida | Desayuno, almuerzo, merienda, cena u otras. |
| ItemComida | Ingrediente/ítem con cantidad, unidad, notas/macros. |
| SugerenciaIA | Resultado generado por IA pendiente de aceptación/descartado/agregado. |
| Notificación | Evento enviado al usuario según reglas. |
| Auditoría | Registro transversal de acciones relevantes. |

### 20.2 Relaciones clave

- Un Gimnasio tiene muchos Usuarios, Socios, Profesionales y Configuraciones.
- Un Usuario tiene uno o más Roles.
- Un Profesional tiene una o más Especialidades.
- Un Profesional tiene una Agenda.
- Un Socio puede tener muchos Turnos.
- Un Profesional puede tener muchos Turnos.
- Un Turno puede derivar en una ConsultaClínica si está PRESENTE.
- Una ConsultaClínica puede tener Observaciones, Mediciones y Adjuntos.
- Un Socio tiene una FichaSalud.
- Una FichaSalud tiene Restricciones/Alergias normalizadas.
- Un Socio puede tener un único PlanAlimentario activo.
- Un PlanAlimentario contiene Días, Comidas e Ítems.
- Una SugerenciaIA puede incorporarse a un Plan solo si el Profesional la valida.
- Las acciones críticas generan Auditoría.

---

## 21. Estados y flujos

### 21.1 Estados de turno

| Estado | Descripción |
|---|---|
| PROGRAMADO | Turno reservado para fecha/hora futura o pendiente de asistencia. |
| PRESENTE | Recepción registró check-in del socio. Habilita iniciar consulta. |
| EN_CURSO | Profesional inició consulta clínica. |
| REALIZADO / TERMINADO | Consulta finalizada; edición bloqueada salvo anexos auditados. |
| CANCELADO | Turno cancelado por socio o centro con motivo. No reversible. |
| AUSENTE | Socio no asistió o llegó luego del umbral configurado. |

### 21.2 Transiciones de turno

| Desde | Hacia | Disparador | Regla |
|---|---|---|---|
| PROGRAMADO | PRESENTE | Check-in por recepción | Solo si no está cancelado, realizado o ausente. |
| PROGRAMADO | CANCELADO | Cancelación socio/centro | Debe registrar motivo y fecha. |
| PROGRAMADO | PROGRAMADO | Reprogramación | Cambia fecha/hora y mantiene identidad del turno. |
| PROGRAMADO | AUSENTE | Umbral +30 min sin check-in | Parametrizable por gimnasio. |
| PRESENTE | EN_CURSO | Profesional inicia consulta | Solo si turno está PRESENTE. |
| EN_CURSO | REALIZADO | Profesional finaliza consulta | Bloquea edición tardía; permite anexos con auditoría. |

### 21.3 Estados sugeridos de ficha de salud

| Estado | Descripción |
|---|---|
| PENDIENTE | Socio aún no completó ficha requerida. |
| COMPLETA | Ficha cargada con campos mínimos. |
| ACTUALIZADA | Ficha modificada luego de su primera carga. |
| CON_ALERTA | Ficha contiene alergias, restricciones o contraindicaciones que bloquean acciones incompatibles. |

### 21.4 Estados de plan alimentario

| Estado | Descripción |
|---|---|
| ACTIVO | Plan vigente visible para socio y roles habilitados. |
| HISTÓRICO | Plan reemplazado o eliminado lógicamente. |
| ELIMINADO_LOGICO | Oculto para socio, disponible en histórico con auditoría. |

### 21.5 Estados de sugerencia IA

| Estado | Descripción |
|---|---|
| GENERADA | IA devolvió propuesta válida. |
| DESCARTADA | Profesional la descartó o sistema la eliminó por ingrediente prohibido. |
| INCORPORADA | Profesional agregó la sugerencia al plan. |
| ERROR | Timeout, formato inválido o error de proveedor. No bloquea edición manual. |

---

## 22. Experiencia de usuario y pantallas

### 22.1 Login general

- Inicio de sesión común para Socio, Profesional y Asistente.
- Autenticación con credenciales.
- Redirección al dashboard según rol.
- Mensajes claros ante credenciales inválidas.

### 22.2 Pantallas del Socio

| Pantalla | Propósito |
|---|---|
| Inicio | Resumen de turnos, plan vigente, progreso y accesos rápidos. |
| Profesionales | Listado de nutricionistas/deportólogos disponibles. |
| Perfil de profesional | Datos del profesional, especialidad, presentación y horarios. |
| Reseñas de profesional | Visualizar valoraciones o referencias, si se habilita. |
| Sacar turno | Seleccionar profesional, fecha/hora y confirmar reserva. |
| Carga de datos de salud | Completar ficha antes del primer turno con especialista. |
| Confirmación de turno | Mostrar resumen y estado de reserva. |
| Turnos activos | Ver próximos turnos y acciones disponibles. |
| Histórico de turnos | Ver turnos anteriores y observaciones asociadas. |
| Detalle de turno | Ver profesional, fecha, hora, estado y observaciones. |
| Plan alimentario | Ver plan vigente por días/comidas, descargar o imprimir. |
| Progreso | Ver evolución de peso/medidas y reportes. |

### 22.3 Pantallas del Profesional

| Pantalla | Propósito |
|---|---|
| Inicio | Dashboard de agenda, próximos turnos y tareas. |
| Turnos del día | Listado operativo de turnos diarios. |
| Turnos de la semana | Vista semanal de agenda. |
| Pacientes | Listado de socios asignados. |
| Ficha de salud de paciente | Ver datos relevantes y restricciones. |
| Mediciones del paciente | Registrar/consultar peso, perímetros, IMC y otros. |
| Configuración de horarios | Abrir/cerrar disponibilidad y cupos. |
| Ficha de paciente | Vista integral del socio. |
| Anotaciones a paciente | Registrar observaciones públicas/privadas según permisos. |
| Documentos del paciente | Cargar imágenes/PDF clínicos. |
| Consulta del paciente | Iniciar, registrar y finalizar consulta. |
| Asignar turno | Asignar manualmente turno si rol lo permite. |
| Plan alimentario | Crear, editar, eliminar y visualizar plan. |
| Sugerir con IA | Generar ideas de comidas durante creación/edición. |
| Progreso | Ver gráficos/tablas y exportar. |

### 22.4 Pantallas del Asistente/Recepción

| Pantalla | Propósito |
|---|---|
| Inicio | Resumen operativo del día. |
| Registro de profesional | Alta de profesional con datos, especialidad y credenciales. |
| Confirmación de profesional registrado | Confirmación posterior al alta. |
| Profesionales | Listado, filtros, modificación y desactivación. |
| Especialidades | Gestión de catálogo de especialidades. |
| Carga de especialidad | Alta o edición de especialidad. |
| Agenda del día | Ver turnos por profesional. |
| Check-in | Marcar PRESENTE. |
| Ausentes | Marcar o revisar ausencias automáticas. |

### 22.5 Pantallas del Administrador

- Configuración del gimnasio/tenant.
- Parámetros operativos: recordatorios, check-in, políticas de cancelación.
- Gestión de roles y permisos.
- Branding básico.
- KPI y reportes operativos.
- Gestión avanzada de profesionales.

### 22.6 Pantallas del Entrenador

- Ver plan alimentario del socio en modo lectura.
- Ver observaciones públicas autorizadas.
- Consultar restricciones relevantes para coordinación de entrenamiento.
- No puede editar ficha, plan ni datos clínicos.

---

## 23. IA asistiva

### 23.1 Principios de IA

- La IA es asistente, no reemplazo profesional.
- El profesional siempre valida antes de incorporar una sugerencia.
- No se envía información personal identificable del socio.
- La IA debe operar con datos mínimos necesarios.
- Los errores de IA no bloquean el flujo manual.
- Las respuestas deben ser claras, estructuradas y accionables.

### 23.2 Casos de uso de IA del MVP

1. Sugerir ideas de comidas durante creación/edición de plan.
2. Validar formato de sugerencia recibida.
3. Descartar automáticamente propuestas con ingredientes prohibidos.
4. Opcional: generar receta desde una comida del plan con disclaimer.

### 23.3 Casos de uso de IA futuros

- Sugerencias de ajustes entre rutina y alimentación.
- Alertas por estancamiento de progreso.
- Resúmenes automáticos para profesionales.
- Respuestas a consultas frecuentes del gimnasio.
- Recomendaciones de horarios o adherencia.
- Detección de inconsistencias entre objetivos, rutina y plan.

### 23.4 Entrada para “Sugerir con IA”

| Campo | Obligatorio | Descripción |
|---|---|---|
| Objetivo | Sí | Ejemplo: bajar grasa, ganar masa muscular, mejorar rendimiento. |
| Restricciones | No | Alergias, alimentos prohibidos, patologías o preferencias. |
| Info extra | Sí | Contexto nutricional o preferencia del profesional. |

### 23.5 Salida esperada

Cada solicitud debe devolver exactamente 2 propuestas. Cada propuesta debe incluir:

- Nombre de comida.
- Ingredientes con cantidades y unidades.
- Pasos de preparación, entre 1 y 5.

### 23.6 Guardrails

- No generar diagnósticos médicos autónomos.
- No indicar tratamientos clínicos.
- No ignorar alergias/restricciones.
- No enviar PII al proveedor de IA.
- Marcar contenido generado como “Sugerido por IA” cuando corresponda.
- Permitir edición manual completa por el profesional.

---

## 24. Notificaciones

### 24.1 Eventos que disparan notificaciones

| Evento | Destinatario | Canal esperado |
|---|---|---|
| Recordatorio de turno 24/48 h antes | Socio | Email / WhatsApp parametrizable |
| Confirmación desde recordatorio | Sistema | Guarda `confirmedAt` |
| Check-in marcado PRESENTE | Profesional | Interna / configurable |
| Plan creado | Socio | Interna / email |
| Plan editado | Socio | Interna / email |
| Plan eliminado | Socio | Interna / email |
| Consulta finalizada | Socio | Interna / email |
| Seguimiento pendiente | Profesional | Interna |
| Sugerencia IA disponible | Profesional | Interna |

### 24.2 Reglas

- Las plantillas deben ser parametrizables por gimnasio.
- Los canales pueden evolucionar, pero el MVP debe priorizar notificaciones internas y correo.
- WhatsApp se considera canal parametrizable, no mensajería sincrónica completa.
- Las notificaciones no deben exponer datos clínicos sensibles innecesarios.

---

## 25. Reportes y métricas

### 25.1 Métricas operativas

- Turnos programados por período.
- Turnos presentes.
- Turnos ausentes/no-show.
- Turnos cancelados.
- Turnos reprogramados.
- Utilización de agenda por profesional.
- Profesionales activos/inactivos.
- Socios con ficha completa.
- Socios con plan activo.

### 25.2 Métricas de progreso del socio

- Peso por fecha.
- IMC si hay altura y peso.
- Perímetros/medidas.
- Evolución por período.
- Historial de consultas.
- Documentos/recomendaciones disponibles.
- Adherencia, si se habilita en futuras versiones.

### 25.3 KPI comerciales/estratégicos

- Gimnasios activos.
- Nuevas altas por semestre.
- Churn de gimnasios.
- Ingresos por suscripción.
- Ingresos por instalación.
- Tiempo de onboarding.
- Satisfacción de gimnasio/profesionales/socios.
- Uso de IA por profesional.
- Tasa de adopción de planes alimentarios.
- Retención de socios del gimnasio, si se integra con datos correspondientes.

---

## 26. Criterios de aceptación

### 26.1 Funcionales mínimos

El producto se considera aceptable si permite:

- Registrar, modificar y desactivar/eliminar profesionales.
- Asignar especialidades y horarios.
- Login de profesional con acceso a agenda y socios vinculados.
- Visualización de profesionales por parte del socio.
- Solicitud, cancelación y reprogramación de turnos.
- Carga inicial y edición de ficha de salud.
- Check-in por recepción.
- Ausente automático configurable.
- Inicio de consulta solo con turno PRESENTE.
- Registro de observaciones, mediciones y adjuntos.
- Finalización de consulta con bloqueo de edición.
- Crear, editar, eliminar y visualizar plan alimentario.
- Validar plan contra alergias/restricciones.
- Sugerir comidas con IA sin enviar PII.
- Notificar eventos relevantes.
- Ver progreso del socio y exportarlo.
- Respetar permisos por rol.

### 26.2 Rendimiento

- 99% de disponibilidad objetivo.
- 100 usuarios concurrentes como base inicial.
- 95% de operaciones debajo de 2 segundos.
- Ver plan/progreso p95 menor a 250 ms.
- Sugerir con IA p95 menor a 700 ms, sujeto a proveedor/modelo; si no se cumple, UI debe manejar carga y fallback sin bloquear edición manual.

### 26.3 Seguridad

- HTTPS obligatorio.
- Hash + salt para contraseñas.
- RBAC funcional.
- Auditoría en datos sensibles.
- Sin PII en prompts de IA.
- Recepción y entrenador sin acceso a datos clínicos sensibles.

### 26.4 Usabilidad

- UI responsive.
- Mensajes de error claros.
- Flujos simples para usuarios no técnicos.
- Acciones de IA claramente identificadas: agregar, descartar, reintentar.
- El sistema no debe exigir instalación.

### 26.5 Integridad

- Las transacciones de cierre de consulta y edición de plan deben ser consistentes.
- Los datos críticos no deben perderse ante fallos comunes.
- El soft delete debe mantener histórico auditable.

---

## 27. Supuestos

- El gimnasio y profesionales estarán disponibles para validar funcionalidades.
- El gimnasio tendrá conexión a Internet estable.
- Profesionales y socios tienen acceso a dispositivos con navegador.
- Profesionales poseen conocimientos digitales básicos o recibirán capacitación.
- Existe presupuesto para desarrollo, integración, mantenimiento e IA.
- El gimnasio operará conforme a normativa de protección de datos y confidencialidad.
- El servidor local o cloud tendrá capacidad suficiente.
- Habrá soporte técnico post-implementación.
- Entrenadores podrán ver datos en modo lectura cuando el enfoque interdisciplinario lo requiera.

---

## 28. Restricciones

- Solo navegadores modernos; no app móvil nativa en esta etapa.
- Versión inicial adaptada a gimnasios de musculación/bienestar de Rosario.
- No incluye gestión contable, fiscal ni financiera.
- No incluye pagos/facturación entre socio y profesional.
- Escala inicial pensada para gimnasios medianos; escalamiento futuro.
- Carga y actualización responsabilidad de asistente/profesional.
- No hay carga masiva ni importación automatizada inicial.
- Interfaz solo en español.
- IA no sustituye juicio profesional humano.
- Configuración por usuario limitada a parámetros del sistema.
- Dependencia de conectividad y servicios cloud.

---

## 29. Roadmap e iteraciones

### 29.1 Iteración 1 - Gestión de Profesionales de la Salud

**Objetivo:** implementar la base operativa para registrar profesionales, configurar disponibilidad, permitir reservas y preparar el sistema para atención clínica posterior.

#### Alcance por rol

**Asistente**

- Registrar profesionales con datos personales, especialidad, horarios y credenciales.
- Consultar, modificar o eliminar/desactivar profesionales.
- Visualizar listado filtrado por especialidad, estado o disponibilidad.

**Profesional**

- Acceder con usuario y contraseña.
- Ver perfil configurado.
- Consultar socios asignados con datos generales: nombre, edad, sexo y objetivos básicos.
- En esta iteración no carga planes ni observaciones profundas si se respeta la nota del documento fuente; sin embargo, RF20-RF22 ya preparan seguimiento.

**Socio**

- Ver profesionales disponibles.
- Reservar turno.
- Ver, modificar o cancelar turnos.
- Completar ficha de salud cuando corresponda.

#### Entregables técnicos

- Diagrama de transición de estados: Turno y Ficha de salud.
- Requerimientos core RF01-RF26.
- Prototipos de pantallas.
- Casos de uso por Asistente, Profesional, Socio y Recepcionista.
- Modelo de dominio conceptual.
- Diagrama de dominio actualizado.
- Diagramas de secuencia.
- Diagrama de clases.
- Diagrama entidad-relación.

### 29.2 Iteración 2 - Consulta clínica y plan nutricional asistido por IA

**Objetivo:** habilitar circuito completo de atención clínica y plan nutricional, incorporando IA para sugerir ideas de comidas durante la creación/edición del plan.

#### Alcance por rol

**Profesional**

- Iniciar consulta de turno confirmado/presente.
- Registrar peso, medidas, signos, notas y adjuntos.
- Finalizar consulta y bloquear edición tardía.
- Crear plan de alimentación con mínimo 1 día y 1 comida.
- Editar plan con auditoría.
- Eliminar plan con soft delete y motivo.
- Ver plan por días/comidas.
- Sugerir ideas con IA.
- Ver progreso con gráficas/tablas y exportación.

**Socio**

- Ver plan vigente por día y comida.
- Descargar o imprimir plan.
- Ver progreso.
- Opcional: generar receta con IA desde una comida del plan.

**Entrenador**

- Ver plan y observaciones públicas en modo lectura.
- Coordinar entrenamiento sin modificar información clínica.

#### Entregables técnicos

- Requerimiento core: atención clínica y plan nutricional con IA.
- RF27-RF40.
- RNF complementarios.
- Casos de uso profesional y socio.
- Diagramas de dominio actualizados.
- Artefactos de diseño preliminar.

### 29.3 Roadmap posterior sugerido

| Fase | Funcionalidades |
|---|---|
| 3 | Gestión avanzada de rutinas, integración completa entrenador-nutricionista, recomendaciones cruzadas. |
| 4 | Pagos, facturación, suscripciones internas y monetización de servicios profesionales. |
| 5 | App móvil nativa o PWA avanzada. |
| 6 | Marketplace de profesionales externos. |
| 7 | IA avanzada: alertas, resúmenes, adherencia, predicción de abandono, recomendaciones de intervención. |
| 8 | Integración con wearables, balanzas inteligentes o sistemas externos. |
| 9 | Multi-sede, cadenas, franquicias y dashboards ejecutivos. |

---

## 30. Cronograma de hitos fuente

| Hito | Fecha |
|---|---|
| Evaluación diagnóstica | 16/04/2025 11:00 |
| TP1 Propuesta de proyecto | 23/04/2025 22:00 |
| Entrega 1 | 04/06/2025 22:00 |
| Entrega 2 | 09/07/2025 22:00 |
| Entrega 3 | 16/07/2025 23:00 |
| Entrega 4 | 01/10/2025 22:00 |
| Entrega 5 | 29/10/2025 13:00 |

### 30.1 Contenido de Entrega 1

- Nombre.
- Siglas.
- Descripción.
- Objetivos.
- Alcance.
- Registro de interesados.
- Cronograma.
- Criterios de aceptación.
- Supuestos.
- Restricciones.
- Definición de requerimientos.
- Iteraciones con diagramas, requerimientos core, prototipos, casos de uso y dominio.
- Hoja de seguimiento.

### 30.2 Contenido de Entrega 2

- Diagrama de secuencia.
- Diagrama de clases.
- Código.
- Modelo de datos / DER con claves y cardinalidades.

---

## 31. Estrategia de producto, go-to-market y marketing

### 31.1 Estrategia genérica

La estrategia adoptada es **diferenciación enfocada a un segmento**: gimnasios pequeños y medianos orientados a salud/bienestar que necesitan modernizar su propuesta sin adoptar herramientas complejas o impersonales.

### 31.2 Inserción inicial

- Pilotos en gimnasios de Rosario.
- Implementación sin costo o con beneficio mutuo a cambio de feedback.
- Validación con datos reales de uso.
- Construcción de casos de éxito.
- Promotores internos: entrenadores, nutricionistas y deportólogos.
- Alianzas con cámaras, redes locales o instituciones deportivas.

### 31.3 Comunicación integrada de marketing

- Publicidad digital en redes sociales.
- Contenido orgánico sobre salud, entrenamiento y nutrición.
- Demostraciones en gimnasios piloto.
- Testimonios de profesionales y socios.
- Métricas de eficiencia operativa y satisfacción.
- Landing web con propuesta clara.

### 31.4 Sitio web y 7C

| C | Aplicación en NFS |
|---|---|
| Comunidad | Construir comunidad de gimnasios, profesionales y socios enfocados en bienestar. |
| Contexto | Diseño simple, profesional y adaptado a usuarios no técnicos. |
| Contenido | Explicaciones, beneficios, demos, casos de éxito y material educativo. |
| Conversión | Solicitud de demo, contacto comercial, prueba piloto. |
| Comunicación | Canales directos de soporte, onboarding y feedback. |
| Conexión | Integraciones futuras con marketplaces, directorios o servicios externos. |
| Comercio | Suscripción SaaS y fee de instalación. |

### 31.5 Distribución

- Canal directo digital.
- Plataforma web sin puntos de venta físicos.
- Suscripción mensual por sede.
- Soporte y capacitación remota.
- Implementación rápida.
- Escalabilidad sin barreras geográficas.
- Futuras alianzas con marketplaces/directorios de software fitness/salud.

---

## 32. Operaciones y organización

### 32.1 Organización funcional prevista

| Área | Responsabilidad |
|---|---|
| Founder / Entrepreneur | Visión, dirección, producto, validación comercial y coordinación general. |
| COO - Operaciones & Clientes | Implementación, soporte, onboarding y relación con gimnasios. |
| CTO - Tecnología & Calidad | Arquitectura, desarrollo, QA, seguridad y escalabilidad. |
| Growth Lead / CMO | Marketing, alianzas, adquisición y posicionamiento. |
| Finance Lead / CFO | Control económico, presupuestos, indicadores y precios. |
| Lead Data/ML | IA asistiva, analítica y recomendaciones. |

### 32.2 Filosofía de trabajo

- Interdisciplinariedad.
- Innovación aplicada.
- Empatía profesional.
- Confiabilidad.
- Mejora continua.
- Acompañamiento cercano.
- Diseño centrado en usuario.

### 32.3 Mecanismos operativos sugeridos

- Onboarding por gimnasio.
- Capacitación por rol.
- Reuniones de feedback con gimnasios piloto.
- Revisión de métricas de uso.
- Soporte inicial intensivo.
- Ajustes funcionales según adopción real.
- Documentación de buenas prácticas.

---

## 33. Modelo de ingresos y financiero

### 33.1 Modelo de ingresos

| Fuente | Descripción |
|---|---|
| Suscripción mensual | Fee SaaS por sede activa. Fuente base indica US$150/mes. |
| Instalación inicial | Fee one-off por gimnasio nuevo. Fuente menciona US$350 en modelo de ingresos y US$320 en escenarios/base posterior. |
| Servicios profesionales | Personalización, soporte avanzado y capacitaciones a demanda. |
| Futuro marketplace | Potencial comisión o monetización por servicios profesionales, no incluido en MVP. |

### 33.2 Proyección comercial base del plan

| Semestre | Gimnasios nuevos | Gimnasios acumulados | Ingresos totales estimados |
|---|---:|---:|---:|
| S1 | 3 | 3 | US$ 3.750 |
| S2 | 3 | 6 | US$ 6.450 |
| S3 | 3 | 9 | US$ 9.150 |
| S4 | 0 | 9 | US$ 8.100 |
| S5 | 3 | 12 | US$ 11.850 |
| S6 | 0 | 12 | US$ 10.800 |

### 33.3 Inversión inicial

El documento presenta dos valores de referencia:

| Fuente interna | Valor |
|---|---:|
| Resumen ejecutivo / modelo inicial | US$ 12.000 |
| Modelo de inversión detallado | US$ 13.286 |

**Recomendación PRD:** para estimaciones de producto y viabilidad usar el modelo detallado de US$13.286, dejando US$12.000 como estimación ejecutiva inicial.

#### Distribución de inversión inicial ejecutiva

| Rubro | Monto |
|---|---:|
| Equipamiento y mobiliario | US$ 1.600 |
| Inscripciones y registros | US$ 600 |
| Insumos y material de demos | US$ 700 |
| Coworking y servicios 6 meses | US$ 1.200 |
| Sueldos etapa desarrollo | US$ 7.100 |
| Capital de trabajo inicial | US$ 800 |
| Total | US$ 12.000 |

#### Modelo detallado

| Categoría | Monto |
|---|---:|
| Activos fijos | US$ 1.400 |
| Activos diferidos | US$ 400 |
| Capital de trabajo | US$ 11.486 |
| Total inversión detallada | US$ 13.286 |

### 33.4 Costos operativos base

| Rubro | Monto semestral |
|---|---:|
| Costos fijos | US$ 3.950 |
| Costos variables | US$ 400 |
| Egresos totales por semestre | US$ 4.350 |
| Equivalente mensual | ~US$ 725 |

### 33.5 Impuestos e indicadores

- Ingresos Brutos: 3,5% en el modelo.
- Ganancias: 30% anual con D&A en el modelo.
- Tasa de corte: 4% anual.
- VAN detallado: US$ 768,11.
- TIR semestral: 3,30%.
- TIR anual: 6,71%.
- Payback detallado: inicio de S6 / 36 meses.

**Observación:** el resumen ejecutivo menciona VAN US$9.099,83, TIR 80% y recuperación en un año, mientras que el modelo financiero posterior muestra valores más conservadores. Esta discrepancia debe resolverse antes de presentar el PRD como versión final de negocio.

### 33.6 Escenarios de riesgo

| Escenario | Supuestos | Lectura |
|---|---|---|
| Pesimista | Menos altas, churn, suscripción -10%, instalación -20%, costos +10/+15% | VAN cercano a cero o negativo; payback más allá de S6. |
| Base | Altas [3,3,3,0,3,0], sin churn, US$150/mes, instalación US$320/350 | Viabilidad moderada, payback en S6. |
| Optimista | Altas [4,4,4,1,4,1], sin churn, variables -10% | Payback S4-S5, mayor VAN y TIR anual 10-12%. |

### 33.7 Plan de contingencia

- Reducir gastos no esenciales.
- Pausar contrataciones.
- Negociar proveedores.
- Ofrecer pago anual adelantado.
- Programa de referidos.
- Soporte prioritario/reportes personalizados como upsell.
- Débito automático y recordatorios de pago.
- Mantener mantenimiento, seguridad y usabilidad como prioridades.
- Revisar caja cada 15 días.
- Mantener al menos 6 meses de dinero operativo.
- Recuperar equilibrio financiero en 3 meses ante desvíos.

---

## 34. Riesgos del producto y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---:|---|
| Baja adopción por gimnasios tradicionales | Alto | Onboarding simple, capacitación, pilotos y soporte cercano. |
| Falta de profesionales disponibles | Alto | Alianzas con nutricionistas/deportólogos y red de prestadores. |
| IA genera sugerencias incorrectas | Alto | Validación humana obligatoria, guardrails, descarte por restricciones. |
| Exposición de datos sensibles | Alto | RBAC, HTTPS, auditoría, no PII en prompts. |
| Costos cloud dolarizados | Medio | Proveedores locales cuando sea posible, monitoreo de costos y precios flexibles. |
| Competencia internacional | Medio/Alto | Diferenciación local, soporte humano, adaptación al contexto argentino. |
| Socio percibe costo adicional | Medio | Comunicación clara del valor y beneficios tangibles. |
| Inestabilidad económica | Alto | Precios escalonados, contratos anuales, control de gastos. |
| Conectividad débil | Medio | UI liviana, tolerancia a errores, persistencia de datos críticos. |
| Falta de casos de éxito | Medio | Pilotos iniciales con métricas y testimonios. |

---

## 35. Artefactos técnicos y enlaces registrados

Los documentos fuente mencionan los siguientes artefactos, que deben mantenerse como anexos o referencias del proyecto:

| Artefacto | Referencia |
|---|---|
| Diagrama de dominio conceptual | https://drive.google.com/file/d/1bi3mWmygshECK5A9iabt42fqWmyIvVMB/view?usp=drive_link |
| Diagrama de dominio actualizado | https://drive.google.com/file/d/1kbxdC_834rMXdK4Q1Ki4Ng2QTdkUY4bg/view?usp=drive_link |
| Secuencia módulo profesional | https://drive.google.com/file/d/1L6qQqHmzlwmU5CWelVdMvA8Ut1FVwudV/view?usp=drive_link |
| Secuencia socio - solicitar turno | https://drive.google.com/file/d/1g5nY1_hdOzKeW9OAKzqrFFyWJMk1npc9/view?usp=drive_link |
| Secuencia socio - cargar datos de salud | https://drive.google.com/file/d/1fWw7LrdhAjmXstiXQ_FxRLjjmpJHpxHv/view?usp=drive_link |
| Diagrama de clases | https://drive.google.com/file/d/1fR-5_y-KH6kJjEI5p6gWSyai-Qc38WHp/view?usp=drive_link |
| Casos de uso segunda iteración - profesional | https://drive.google.com/open?id=1nMlnVyaaoyZRptLxCAGs_geqe2EJD7Ju&authuser=1 |
| Carpeta dominio actualizado / segunda iteración | https://drive.google.com/drive/u/1/folders/1IMS26QfRP6KPgpUdU0RqcUpqpq21bFWm |

---

## 36. Trazabilidad de cobertura de documentos fuente

### 36.1 Documento de negocio / estrategia

| Sección fuente | Ubicación en este PRD |
|---|---|
| Resumen ejecutivo | 1 |
| Descripción básica del negocio | 2, 3, 4, 7, 14 |
| Situación actual del negocio | 9 |
| Diferencial del negocio | 8 |
| Factores de éxito | 9.3, 34 |
| Misión, visión y propósito | 5 |
| Oportunidad de negocio | 4 |
| Capacidades centrales | 7, 8, 14, 23 |
| Propuesta de valor | 7 |
| Valores nucleares | 32.2 |
| Enfoque e iniciativas estratégicas | 31 |
| Áreas clave de resultados | 25, 31, 32, 33 |
| Ingreso al sector | 31.2 |
| Análisis de contexto | 9.1 |
| Competencia | 9.2 |
| FODA | 10 |
| Segmentación | 11 |
| Plan de acción | 29, 30, 31 |
| Plan de marketing | 31 |
| Distribución | 31.5 |
| Operaciones | 32 |
| Plan financiero-económico | 33 |
| Escenarios de riesgo | 33.6, 34 |
| Plan de contingencia | 33.7 |
| Bibliografía | 38 |

### 36.2 Documento de Evaluación Parcial / TFI

| Sección fuente | Ubicación en este PRD |
|---|---|
| Nombre y siglas | 2 |
| Descripción del proyecto | 1, 2, 14 |
| Objetivos | 6 |
| Definición de requerimientos | 16, 17, 18 |
| Alcance | 14 |
| Inclusiones | 14.3 |
| Exclusiones | 14.4 |
| Registro de interesados | 12 |
| Cronograma | 30 |
| Criterios de aceptación | 26 |
| Supuestos | 27 |
| Restricciones | 28 |
| Reglas de negocio | 17 |
| Iteración 1 | 29.1 |
| Iteración 2 | 29.2 |
| Requerimientos core | 16 |
| Guión de interfaz | 22 |
| Casos de uso | 22, 29, 35 |
| Modelo de dominio | 20, 35 |
| Diseño preliminar | 19, 20, 35 |
| Diagramas de secuencia/clases/DER | 35 |
| Hoja de seguimiento | 37 |

---

## 37. Hoja de seguimiento propuesta

| Fecha | Autor | Cambio |
|---|---|---|
| 2026-05-01 | ChatGPT | Consolidación inicial de documentos fuente en PRD organizado por categorías. |
| Pendiente | Equipo NFS | Resolver discrepancia de inversión inicial: US$12.000 vs US$13.286. |
| Pendiente | Equipo NFS | Resolver discrepancia de indicadores financieros: VAN/TIR ejecutivo vs modelo detallado. |
| Pendiente | Equipo NFS | Confirmar estado final de turno: usar REALIZADO como estándar y TERMINADO como alias, o elegir uno. |
| Pendiente | Equipo NFS | Completar oficialmente RF31 y RF37 en documentación académica/final. |
| Pendiente | Equipo NFS | Confirmar si WhatsApp será solo canal de notificación parametrizable o integración formal. |
| Pendiente | Equipo NFS | Confirmar alcance exacto del módulo de asignación formal de profesional al socio. |

---

## 38. Bibliografía y referencias mencionadas en documentos fuente

- GymMaster - Software de gestión para gimnasios: https://www.gymmaster.com/es/
- Wodify - Gym Management Software: https://www.wodify.com/
- Zen Planner - Fitness Business Software: https://zenplanner.com/
- Glofox - Fitness Business Management Software: https://www.glofox.com/
- My PT Hub - Online personal training software: https://www.mypthub.net/
- AgendaPro - Software para gimnasios: https://agendapro.com/ar/gimnasio/software-para-gimnasio
- Fitco - Software de gestión para gimnasios y estudios: https://www.fitcolatam.com/
- SportClub Argentina: https://www.sportclub.com.ar/
- Trainingym: https://trainingym.com/
- Wellhub: https://wellhub.com/
- Porter, M. E. (1982). Estrategia competitiva.
- Kotler y Armstrong (2013). Fundamentos de marketing.
- INDEC (2025). Índice de precios al consumidor.
- Statista (2025). Producto interior bruto de Argentina.

---

## 39. Observaciones finales

Este PRD queda preparado como base para:

- Convertir requisitos a historias de usuario.
- Armar backlog por épicas.
- Crear criterios de aceptación por ticket.
- Diseñar modelo de datos.
- Generar casos de uso detallados.
- Planificar MVP técnico.
- Preparar presentación académica o comercial.
- Definir arquitectura e implementación.

La versión actual no elimina contenido de los documentos fuente: lo reorganiza en categorías de producto, negocio, usuarios, alcance, requisitos, reglas, UX, arquitectura, roadmap, operaciones, marketing, finanzas, riesgos y trazabilidad.
