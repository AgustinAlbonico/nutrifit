# Reportes académicos de asistencia y evolución Implementation Plan

> **Para quienes implementen:** aplicar el plan por tareas pequeñas, conservando la arquitectura limpia existente. Este repositorio prohíbe crear o modificar tests salvo pedido explícito de Agustín; por eso las verificaciones indicadas son compilación, diagnóstico y QA manual, no TDD.

**Objetivo:** incorporar dos reportes calculados en backend: uno administrativo de asistencia y rendimiento por nutricionista, y otro clínico de evolución de un paciente para su nutricionista.

**Arquitectura:** ambos reportes serán endpoints read-only con DTOs y casos de uso propios. El controller sólo valida parámetros y delega; los casos de uso concentran reglas, permisos de tenant y consultas TypeORM agregadas o con joins, sin N+1. El frontend consume los JSON listos para visualizar y únicamente formatea etiquetas.

**Tecnologías:** NestJS, TypeScript estricto, TypeORM/MySQL, JWT/RBAC, React, TanStack Query, Recharts y Tailwind/shadcn.

---

## Alcance y decisiones de diseño

### Reporte 1 — Asistencia y rendimiento de nutricionistas

**Actor y decisión:** un `ADMIN` del gimnasio evalúa carga de turnos, asistencia y ausencias para detectar profesionales o períodos que requieren ajustes de agenda. No incluye `SUPERADMIN`: `TenantContextService.gimnasioId` es obligatorio y el requisito no pidió una vista de red.

**Ruta:**

```text
GET /admin/estadisticas/asistencia-profesionales
```

**Filtros:**

```text
fechaInicio=YYYY-MM-DD                 obligatorio
fechaFin=YYYY-MM-DD                    obligatorio
profesionalId=number                   opcional
socioId=number                         opcional
estado=CONFIRMADO|PRESENTE|EN_CURSO|REALIZADO|CANCELADO|AUSENTE  opcional
```

Los filtros se aplican antes de las agregaciones. `fechaInicio` se interpreta al inicio del día y `fechaFin` al final del día en la convención de fechas ya usada por el proyecto. Una fecha inválida, un identificador no entero positivo o `fechaInicio > fechaFin` produce `BadRequestError` con mensaje en español.

**Entidades y campos reales:**

- `TurnoOrmEntity`: `fechaTurno`, `estadoTurno`, `idGimnasio`, `idSocio`, `idNutricionista` y relación `nutricionista`.
- `NutricionistaOrmEntity`: `idPersona`, `nombre`, `apellido`.
- Estados existentes: `CONFIRMADO`, `PRESENTE`, `EN_CURSO`, `REALIZADO`, `CANCELADO`, `AUSENTE`.

**Fórmulas:**

- `turnosProgramados`: todos los turnos agendados en el período, incluidos los que luego fueron cancelados. Es la carga planificada real del período.
- `turnosRealizados`: estado `REALIZADO`.
- `turnosCancelados`: estado `CANCELADO`.
- `ausencias`: estado `AUSENTE`.
- `turnosConResultado`: `turnosRealizados + ausencias`.
- `porcentajeAsistencia`: `turnosRealizados / turnosConResultado * 100`; si el divisor es cero, `0`.
- `porcentajeAusentismo`: `ausencias / turnosConResultado * 100`; si el divisor es cero, `0`.

El sistema no registra franjas de capacidad disponibles, por lo que el reporte hablará de **carga de turnos** y no de “ocupación”. No se debe presentar una tasa de ocupación sin denominador verificable.

**Respuesta exacta propuesta:**

```ts
interface ReporteAsistenciaProfesionalesDto {
  periodo: { fechaInicio: string; fechaFin: string };
  resumen: {
    turnosProgramados: number;
    turnosRealizados: number;
    turnosCancelados: number;
    ausencias: number;
    porcentajeAsistencia: number;
    porcentajeAusentismo: number;
  };
  porNutricionista: Array<{
    nutricionistaId: number;
    nombreNutricionista: string;
    turnosProgramados: number;
    turnosRealizados: number;
    turnosCancelados: number;
    ausencias: number;
    porcentajeAsistencia: number;
    porcentajeAusentismo: number;
  }>;
  grafico: {
    evolucionMensual: Array<{
      mes: string;
      programados: number;
      realizados: number;
      cancelados: number;
      ausencias: number;
    }>;
  };
}
```

**Consulta eficiente:** un `QueryBuilder` sobre `TurnoOrmEntity` filtrado siempre por `turno.id_gimnasio = :gimnasioId`; una agregación agrupada por nutricionista y otra agrupada por mes. Ambas usan `SUM(CASE WHEN ...)`, no cargan turnos completos ni ejecutan consultas por nutricionista. Los meses sin resultados se completan en memoria para permitir una serie continua.

### Reporte 2 — Evolución clínica de un socio

**Actor y decisión:** un `NUTRICIONISTA` revisa la continuidad del tratamiento de uno de sus pacientes para decidir si debe ajustar el plan o solicitar un control.

**Ruta:**

```text
GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/reporte-evolucion
```

**Permisos:** `@Rol(RolEnum.NUTRICIONISTA)`, `NutricionistaOwnershipGuard` y `SocioResourceAccessGuard`. El profesional sólo puede consultar su propio identificador y un paciente que tenga permitido atender. Todas las consultas quedan acotadas al `gimnasioId` del contexto.

**Filtros:**

```text
fechaInicio=YYYY-MM-DD  opcional
fechaFin=YYYY-MM-DD     opcional
```

El reporte clínico usa exclusivamente consultas y mediciones de turnos `REALIZADO`, porque un turno cancelado, ausente o en curso no representa una atención clínica completada. El estado no se expone como filtro: es una regla de integridad del indicador y evita mezclar eventos sin consulta con evolución clínica.

**Entidades y campos reales:**

- `MedicionOrmEntity`: peso, IMC, perímetros, porcentaje de grasa, masa magra y `createdAt`.
- `TurnoOrmEntity`: `estadoTurno`, `consultaFinalizadaAt`, `fechaTurno`, relaciones a socio y nutricionista.
- `ObjetivoOrmEntity`: `tipoMetrica`, `valorInicial`, `valorActual`, `valorObjetivo`, `estado`, `fechaInicio`, `fechaObjetivo`. Los estados válidos son `ACTIVO`, `COMPLETADO` y `ABANDONADO`.
- `PlanAlimentacionOrmEntity`: un plan activo cumple `activo = true` y `estado = 'ACTIVO'`.

**Fórmulas y criterios:**

- Peso/IMC inicial y actual: primera y última medición del período, ordenadas ascendentemente por `createdAt`.
- Diferencia: `actual - inicial`, redondeada a dos decimales.
- Tendencia: misma pendiente lineal de las últimas cinco mediciones ya usada en `GetResumenProgresoUseCase`; con una medición es `estable`.
- Consultas realizadas: cantidad de `TurnoOrmEntity` en `REALIZADO` para el socio y profesional del contexto dentro del período.
- Tiempo de tratamiento: días entre la primera interacción clínica disponible (primera medición o primera consulta realizada, la más antigua) y la fecha actual.
- Última consulta: `consultaFinalizadaAt` de la última consulta realizada; si falta, `fechaTurno`.
- Falta de controles: `sinControles = true` cuando no existe última consulta o transcurrieron más de 30 días desde ella. El umbral se devuelve explícitamente para que sea auditable.
- Plan activo: existe al menos un plan del socio con `activo = true` y `estado = 'ACTIVO'`.
- Progreso hacia objetivo: se toma el objetivo activo de tipo `PESO`, si existe. Se reutiliza la fórmula de `ObjetivoEntity.calcularProgreso()` y se devuelve `null` cuando no hay objetivo activo de peso, evitando inventar una meta clínica.

**Bordes:** sin mediciones devuelve valores clínicos `null`, `totalMediciones = 0` y serie vacía; con una medición, inicial y actual coinciden y la diferencia es `0`; sin objetivo de peso, progreso `null`; sin plan, `planActivo = false`; ningún porcentaje divide por cero.

**Respuesta exacta propuesta:**

```ts
interface ReporteEvolucionPacienteDto {
  socio: { id: number; nombre: string; apellido: string };
  periodo: { fechaInicio: string | null; fechaFin: string | null };
  resumen: {
    totalMediciones: number;
    pesoInicial: number | null;
    pesoActual: number | null;
    diferenciaPeso: number | null;
    tendenciaPeso: 'subiendo' | 'bajando' | 'estable' | null;
    imcInicial: number | null;
    imcActual: number | null;
    diferenciaImc: number | null;
    consultasRealizadas: number;
    diasEnTratamiento: number | null;
    ultimaConsulta: string | null;
    sinControles: boolean;
    diasDesdeUltimoControl: number | null;
    umbralSinControlDias: 30;
    planActivo: boolean;
    objetivoPeso: {
      idObjetivo: number;
      valorObjetivo: number;
      progresoPorcentaje: number;
      fechaObjetivo: string | null;
    } | null;
  };
  grafico: {
    evolucion: Array<{
      fecha: string;
      peso: number;
      imc: number;
      perimetroCintura: number | null;
      porcentajeGrasa: number | null;
      masaMagra: number | null;
    }>;
  };
}
```

**Consulta eficiente:** el caso de uso realiza un conjunto fijo de consultas: una para identificar al socio en el gimnasio, una para mediciones con joins a turno/socio/nutricionista, una agregada para consultas realizadas y última consulta, y búsquedas únicas para objetivo activo de peso y existencia de plan activo. Nunca llama un use case por medición, plan o consulta.

## Estructura de archivos

| Archivo | Cambio |
| --- | --- |
| `apps/backend/src/application/reportes/dtos/reporte-asistencia-profesionales.dto.ts` | Crear contratos de filtros y respuesta del reporte administrativo. |
| `apps/backend/src/application/reportes/use-cases/get-reporte-asistencia-profesionales.use-case.ts` | Crear agregaciones, fórmulas, tenant scope y serie mensual. |
| `apps/backend/src/application/reportes/reportes.module.ts` | Registrar y exportar el nuevo caso de uso. |
| `apps/backend/src/presentation/http/controllers/admin/admin-estadisticas.controller.ts` | Inyectar el caso de uso y publicar la ruta administrativa. |
| `apps/backend/src/application/turnos/dtos/reporte-evolucion-paciente.dto.ts` | Crear contratos de filtros y respuesta del reporte clínico. |
| `apps/backend/src/application/turnos/use-cases/get-reporte-evolucion-paciente.use-case.ts` | Crear joins clínicos, continuidad, objetivo y plan activo. |
| `apps/backend/src/application/turnos/turnos.module.ts` | Registrar el caso de uso clínico. |
| `apps/backend/src/presentation/http/controllers/turnos.controller.ts` | Inyectar y publicar la ruta con guards existentes. |
| `apps/frontend/src/pages/admin/ReportesAdminPage.tsx` | Consumir el endpoint específico y renderizar resumen, gráfico mensual y tabla por profesional. |
| `apps/frontend/src/components/progreso/types.ts` | Añadir tipos de respuesta del reporte clínico. |
| `apps/frontend/src/components/progreso/useReporteEvolucionPaciente.ts` | Crear hook React Query exclusivo para el reporte clínico. |
| `apps/frontend/src/components/progreso/ResumenReporteEvolucionClinica.tsx` | Crear componente presentacional con continuidad, plan, objetivo y alertas de control. |
| `apps/frontend/src/components/progreso/DashboardProgreso.tsx` | Integrar el resumen en la pestaña existente sin reemplazar historial, gráficos u objetivos. |

## Tareas de implementación

### Tarea 1: Contrato y caso de uso del reporte administrativo

- [ ] Crear `reporte-asistencia-profesionales.dto.ts` con tipos estrictos para filtros, resumen, filas por nutricionista y puntos mensuales.
- [ ] Implementar `GetReporteAsistenciaProfesionalesUseCase` usando `Repository<TurnoOrmEntity>` y `TenantContextService`.
- [ ] Validar el intervalo y los filtros numéricos antes de ejecutar consultas.
- [ ] Ejecutar las dos consultas agregadas con `QueryBuilder`, normalizar los resultados numéricos de MySQL y completar meses sin datos.
- [ ] Verificar que el SQL siempre contiene la condición de gimnasio.

### Tarea 2: Exponer el reporte administrativo

- [ ] Registrar/exportar el caso de uso en `ReportesModule`.
- [ ] Inyectarlo en `AdminEstadisticasController`.
- [ ] Publicar `GET asistencia-profesionales` bajo `@Rol(RolEnum.ADMIN)`.
- [ ] Parsear fechas, `profesionalId`, `socioId` y estado con errores explícitos, sin conversiones silenciosas.

### Tarea 3: Contrato y caso de uso de evolución clínica

- [ ] Crear `reporte-evolucion-paciente.dto.ts` con los objetos exactos de la respuesta documentada.
- [ ] Implementar `GetReporteEvolucionPacienteUseCase` con repositorios de medición, turno, socio, objetivo y plan alimentario.
- [ ] Acotar mediciones y consultas a socio, nutricionista, gimnasio y estado `REALIZADO`.
- [ ] Calcular las métricas desde resultados ya obtenidos, sin consultas por fila; reutilizar la regla de tendencia vigente.
- [ ] Recuperar sólo un objetivo activo de peso y verificar existencia de plan activo sin cargar versiones de plan.
- [ ] Aplicar los valores nulos y criterios de falta de controles definidos en este documento.

### Tarea 4: Exponer el reporte clínico

- [ ] Registrar el caso de uso en `TurnosModule`.
- [ ] Inyectarlo en `TurnosController`.
- [ ] Publicar la ruta bajo el grupo profesional/paciente con `NutricionistaOwnershipGuard` y `SocioResourceAccessGuard`.
- [ ] Conservar la firma y comportamiento de `/historial-mediciones` y `/progreso`; el reporte es adicional.

### Tarea 5: Integración visual administrativa

- [ ] Reemplazar la consulta a `kpi-completo` sólo para la sección de asistencia por la nueva ruta, sin alterar los demás KPIs existentes.
- [ ] Mostrar tarjetas con programados, realizados, cancelados, asistencia y ausencias.
- [ ] Mostrar serie mensual de cuatro estados y tabla por nutricionista con porcentajes calculados por backend.
- [ ] Mantener estados de carga, error y vacío existentes.

### Tarea 6: Integración visual clínica

- [ ] Crear el hook `useReporteEvolucionPaciente` para la vista de nutricionista; no duplicar la lógica de `useProgresoData`.
- [ ] Mostrar continuidad de controles, plan activo e indicador de objetivo sólo si el backend devuelve objetivo de peso.
- [ ] Mantener `GraficoPrincipalEvolucion` para la serie detallada existente y usar el nuevo resumen como capa decisional.
- [ ] No mostrar un porcentaje de objetivo cuando la respuesta devuelve `null`.

## Contrato de verificación visual

Antes de modificar frontend se documenta y se ejecuta este contrato con Playwright, utilizando servidores que Agustín ya haya levantado; el agente nunca inicia ni reinicia servidores.

- **Pedido:** filtros y gráficos claros de asistencia por nutricionista. **Debe verse:** período seleccionado, tarjetas de resumen, gráfico mensual con cuatro series y detalle por nutricionista sin porcentajes locales inconsistentes.
- **Pedido:** evolución integral de socio. **Debe verse:** peso y progreso existentes, consultas realizadas, última consulta, alerta de falta de control cuando corresponda, estado de plan y meta de peso sólo si existe.
- **Pedido:** permisos. **Debe verse:** rutas protegidas y ausencia de datos ante actor no autorizado; se comprobará mediante las cuentas de seed autorizadas, sin hardcodear credenciales.

## Verificación final

1. Ejecutar diagnósticos LSP para todos los archivos modificados.
2. Ejecutar `npm run build --workspace=@nutrifit/backend` y `npm run build --workspace=@nutrifit/frontend`.
3. Ejecutar lint disponible en cada workspace si el script existe.
4. Con los servicios ya activos por Agustín, usar Playwright para comprobar los dos contratos visuales y capturar snapshot de estado cargado, vacío y final cuando sea posible.
5. Ejecutar `npx -y react-doctor@latest apps/frontend --verbose --diff` después de los cambios de React si la herramienta está disponible.

No se crearán ni modificarán tests, no se iniciarán servidores y no se hará commit ni push sin pedido explícito de Agustín.
