 # Diseño: Evolución Longitudinal del Paciente

 > **Fecha**: 2026-06-18
 > **Estado**: Propuesta concreta basada en código existente
 > **Alcance**: rediseño del módulo de evolución/progreso para socio y nutricionista

 ## Objetivo

 Convertir la vista actual de progreso en una experiencia longitudinal clara, agradable a la vista y clínicamente útil, con dos capas de lectura:

 - una capa superior simple para entender rápido cómo viene el paciente
 - una capa inferior analítica para profundizar en métricas, comparaciones y contexto clínico

 ## Qué pidió el usuario vs qué debería verse

 | Qué pidió Agustín | Qué debería verse en pantalla |
 |---|---|
 | Una evolución super completa | Un dashboard longitudinal con resumen, tendencias, comparaciones, tabla clínica y timeline |
 | Algo agradable a la vista | Un layout editorial, con jerarquía visual fuerte, bloques claros y gráficos consistentes |
 | Gráficos de fechas vs peso, pliegues, etc. | Selector de métricas con series temporales para peso, IMC, perímetros, pliegues, composición corporal y signos vitales |
 | Ver cómo evolucionó el paciente en el tiempo | Filtros por rango temporal, deltas contra línea base, hitos por sesión y lectura de tendencia |
 | Tabla con evolución del paciente | Tabla clínica configurable, con columnas relevantes, deltas y expansión por fila |
 | Que sirva para ambos públicos | Una capa de lectura amigable arriba y una capa clínica detallada abajo |

 ## Estado actual verificado

 El proyecto ya tiene una base funcional importante:

 - `DashboardProgreso.tsx` con tabs de `Resumen`, `Fotos`, `Objetivos`, `Gráficos` e `Historial`
 - `useProgresoData.ts` consumiendo historial y resumen desde endpoints existentes
 - gráficos actuales para peso, IMC, perímetros, composición corporal y signos vitales
 - `TablaHistorialMediciones.tsx` con exportación CSV
 - backend con historial de mediciones y resumen de progreso
 - tipos que ya incluyen pliegues, masa magra, porcentaje de grasa y signos vitales

 ## Problemas del estado actual

 1. La experiencia está fragmentada en tabs sin una narrativa longitudinal clara.
 2. Los gráficos existen, pero hoy se sienten genéricos y con poca profundidad clínica.
 3. No hay un gráfico dedicado y fuerte para pliegues, pese a que el dato existe.
 4. La tabla histórica es correcta pero básica: no resalta cambios ni permite lectura comparativa.
 5. La experiencia no separa bien lectura simple para socio y lectura clínica para nutricionista.
 6. La UI actual desperdicia valor del backend porque no traduce la data en insights visuales claros.

 ## Principio rector

 La evolución no debe ser una colección de widgets. Debe contar una historia clínica en el tiempo.

 La pantalla debe responder tres preguntas en este orden:

 1. ¿Cómo viene este paciente hoy?
 2. ¿Qué cambió desde que empezó?
 3. ¿Dónde conviene profundizar ahora?

 ## Propuesta de producto

 ### Enfoque recomendado

 Un **panel longitudinal híbrido** en una sola pantalla.

 - **Capa 1: lectura rápida**
   - pensada para socio y nutricionista
   - resume el estado actual y la dirección general
- **Capa 2: lectura analítica**
   - pensada principalmente para nutricionista
   - permite elegir métricas, comparar sesiones y leer detalles clínicos

 Esto evita dos productos distintos y mantiene una experiencia potente sin duplicar mantenimiento.

 ## Estructura propuesta de la pantalla

 ### 1. Encabezado longitudinal

 Debe reemplazar el header actual por un bloque más informativo.

 **Contenido**:

 - nombre del paciente
 - rol/contexto de la vista (`Mi evolución` o `Evolución de {paciente}`)
 - cantidad de mediciones registradas
 - fecha de primera y última medición
 - filtro temporal global: `30 días`, `90 días`, `6 meses`, `12 meses`, `Todo`
 - acción secundaria para exportar

 **Resultado buscado**:

 en menos de 5 segundos tiene que quedar claro si el paciente viene mejorando, estable o con señales de atención.

 ### 2. Franja de KPIs principales

 Un bloque horizontal de tarjetas con jerarquía visual clara.

 **Tarjetas mínimas**:

 - peso actual + delta desde inicio
 - IMC actual + categoría
 - cintura actual + delta desde inicio
 - porcentaje de grasa actual + delta
 - masa magra actual + delta
 - estado general de tendencia

 **Comportamiento**:

 - mostrar variación absoluta y relativa
 - usar color solo para estados relevantes, no como decoración indiscriminada
 - incorporar microcopy clínico corto: `-4.2 kg desde línea base`, `estable en los últimos 90 días`

 ### 3. Gráfico principal de evolución

 Este es el centro de la pantalla.

 **Componente propuesto**: `GraficoPrincipalEvolucion`

 **Modos**:

 - peso + IMC
 - perímetros
 - pliegues
 - composición corporal
 - signos vitales

 **Capacidades**:

 - cambiar métrica desde un selector de chips
 - elegir una sola serie o múltiples series comparables
 - tooltips ricos por sesión
 - overlay de línea base
 - overlay de rango saludable cuando aplica
 - posibilidad de mostrar `valor absoluto` o `cambio desde inicio`

 ### 4. Sección específica de pliegues

 Este bloque hoy falta y tiene alto valor.

 **Componente propuesto**: `PanelPlieguesEvolucion`

 **Visualización**:

 - líneas separadas para `tríceps`, `abdominal`, `muslo`
 - tarjeta con `suma de pliegues`
 - delta total desde la primera medición
 - estado visual de tendencia

 **Razón**:

 peso solo no alcanza. Los pliegues permiten leer mejor recomposición corporal y adherencia.

 ### 5. Sección de composición corporal

 **Componente propuesto**: `PanelComposicionCorporal`

 **Contenido**:

 - porcentaje de grasa en el tiempo
 - masa magra en el tiempo
 - lectura automática corta:
   - `bajó peso preservando masa magra`
   - `bajó peso con caída de masa magra`
   - `sin datos suficientes`

 **Nota**:

 la lectura automática debe salir de una utilidad simple y testeable, no de lógica enterrada en JSX.

 ### 6. Tabla clínica longitudinal

 **Componente propuesto**: `TablaEvolucionPaciente`

 **Objetivo**:

 que la tabla deje de ser un dump de columnas y se convierta en herramienta de análisis.

 **Características**:

 - una fila por medición/sesión
 - columnas configurables
 - columnas fijas para fecha y peso
 - delta contra sesión anterior
 - delta contra línea base
 - resaltado suave de mejoras/cambios
 - expansión por fila para ver:
   - notas de medición
   - profesional
   - signos vitales
   - métricas menos frecuentes

 **Columnas recomendadas por defecto**:

 - fecha
 - peso
 - IMC
 - cintura
 - cadera
 - porcentaje de grasa
 - masa magra
 - presión arterial
 - frecuencia cardíaca

 **Columnas opcionales**:

 - brazo
 - muslo
 - pecho
 - pliegues
 - notas

 ### 7. Timeline clínico

 **Componente propuesto**: `TimelineEvolucionClinica`

 **Eventos**:

 - medición registrada
 - consulta realizada
 - objetivo creado o completado
 - fotos de progreso cargadas
 - hitos relevantes de cambio

 **Objetivo**:

 vincular números con historia clínica real.

 ### 8. Integración con fotos y objetivos

 Fotos y objetivos no deben quedar como módulos aislados en tabs separadas.

 **Fotos**:

 - mostrar últimas sesiones con miniaturas en el timeline
 - poder saltar desde una fecha del gráfico a la comparación visual de esa sesión

 **Objetivos**:

 - marcar en el gráfico el inicio de un objetivo
 - mostrar progreso de la métrica vinculada cuando exista correspondencia (`PESO`, `CINTURA`, etc.)

 ## Comportamiento por audiencia

 ### Socio

 Debe ver primero:

 - resumen actual
 - tendencia general
 - gráfico principal claro
 - objetivos y fotos

 Debe ver después, por expansión o scroll:

 - tabla más detallada
 - timeline clínico

 ### Nutricionista

 Debe tener visibilidad inmediata de:

 - deltas clínicos
 - métricas disponibles por rango temporal
 - composición corporal
 - pliegues
 - tabla avanzada
 - profesional que registró cada dato

 ## Datos disponibles y reutilización

 Fase 1 puede salir casi completamente con datos actuales de:

 - `HistorialMediciones`
 - `ResumenProgreso`
 - `ListaObjetivos`
 - `GaleriaFotos`

 Reutilización directa:

 - `useProgresoData.ts`
 - `useObjetivos.ts`
 - `useFotosProgreso.ts`

 ## Gaps funcionales detectados

 No bloquean una primera iteración visual fuerte, pero limitan una versión premium.

 1. El resumen de backend no trae comparativas por ventana temporal (`30d`, `90d`, etc.).
 2. No existe un resumen derivado específico para pliegues.
 3. No hay una capa de insights clínicos simples serializada desde backend.
 4. La ruta de progreso hoy sigue muy centrada en tabs y no en una narrativa única.

 ## Fases recomendadas

 ### Fase 1: rediseño fuerte sin depender de backend nuevo

 - rediseñar layout general de `DashboardProgreso`
 - crear filtro temporal en frontend
 - unificar gráficos en un panel principal
 - agregar panel específico de pliegues
 - rehacer tabla clínica
 - integrar objetivos y fotos de forma más longitudinal

 ### Fase 2: enriquecer resumen clínico

 - agregar derivadas y comparativas por período
 - agregar resumen de pliegues y composición corporal
 - serializar insights clínicos simples desde backend

 ### Fase 3: experiencia premium

 - anotaciones clínicas sobre la línea temporal
 - hitos vinculados a plan/objetivos
 - PDF longitudinal de mayor calidad
 - comparaciones avanzadas entre sesiones

 ## Riesgos

 | Riesgo | Mitigación |
 |---|---|
 | Sobrecargar la pantalla | Resolver con jerarquía por capas, no con más tabs |
 | UX genérica de dashboard | Diseñar un layout editorial con foco narrativo |
 | Lógica de filtros dispersa | Centralizar derivación de series en hooks/utilidades puras |
 | Tabla demasiado ancha | Configuración de columnas + sticky columns + detalle expandible |
 | Mezclar audiencias | Mantener lectura rápida arriba y profundidad clínica abajo |

 ## Criterios de aceptación de diseño

 - La pantalla permite entender el estado actual del paciente sin navegar entre múltiples tabs.
 - El usuario puede ver series temporales de peso, IMC, perímetros, pliegues, composición y signos vitales.
 - Existe una visualización dedicada para pliegues.
 - La tabla muestra evolución histórica útil, no solo un listado plano.
 - La vista se siente apta para socio y nutricionista gracias a dos niveles de lectura.
 - Fotos y objetivos quedan conectados con la historia temporal del paciente.

 ## Recomendación final

 No conviene encarar este cambio como "sumar más gráficos".

 Conviene encarar este cambio como una **ficha longitudinal visual y clínica** que reutiliza la base existente, mejora radicalmente la presentación y deja el backend enriquecido solo donde realmente aporte valor.
