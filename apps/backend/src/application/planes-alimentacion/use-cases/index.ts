export * from './crear-plan-alimentacion.use-case';
export * from './editar-plan-alimentacion.use-case';
export * from './eliminar-plan-alimentacion.use-case';
// Hotfix Packet 8: el endpoint /socio/:id/activo ahora devuelve
// `PlanSocioActivoDTO[]` (uno por nutricionista). El use-case legacy
// `ObtenerPlanActivoSocioUseCase` ya no se usa en el controller;
// queda como referencia para iteraciones futuras pero NO se exporta
// desde el barrel ni se registra como provider.
export * from './listar-planes-activos-socio.use-case';
export * from './obtener-plan-por-id.use-case';
export * from './listar-planes-socio.use-case';
export * from './listar-planes-nutricionista.use-case';
export * from './vaciar-contenido-plan.use-case';
export * from './plan-alimentacion.mapper';
export * from './listar-versiones-plan.use-case';
export * from './obtener-version-plan.use-case';
export * from './crear-feedback-plan.use-case';
export * from './editar-feedback-plan.use-case';
export * from './activar-plan-alimentacion.use-case';
export * from './finalizar-plan-alimentacion.use-case';
export * from './generar-ideas-comida.use-case';
export * from './persistir-plan-manual.use-case';
export * from './crear-plan-manual-vacio.use-case';
export * from './guardar-version-plan.use-case';
