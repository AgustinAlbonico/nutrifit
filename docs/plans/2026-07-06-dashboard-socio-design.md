# Dashboard socio accionable

Mejoraremos el dashboard del socio para que deje de ser un tablero pasivo y funcione como una guía diaria: próximo turno, plan activo, progreso y acciones correctas en un solo lugar.

## Contrato aprobado

| Pedido de Agustín | Resultado esperado |
| --- | --- |
| Corregir cosas que no funcionan | Las acciones rápidas llevan a rutas reales del socio: `/turnos/agendar`, `/mi-plan`, `/mi-progreso`. |
| Hacer el dashboard más interesante | El encabezado presenta “Tu plan de hoy” con siguiente paso claro y CTAs visibles. |
| Mantener claridad de datos | Los KPIs siguen mostrando próximo turno, IMC y distancia al objetivo. |
| Guiar cuando faltan datos | Las tarjetas explican qué falta y qué hacer después. |
| Respetar identidad visual | Se mantiene el sistema naranja/rose existente con tarjetas más pulidas. |

## Alcance

- `DashboardSocio.tsx`: hero más accionable, KPIs con copy corregida y layout más intencional.
- `AccionesRapidasSocioCard.tsx`: rutas reales, descripciones y estados visuales mejores.
- `PlanAlimenticioCard.tsx`: CTA correcto a `/mi-plan` y vacío más útil.
- `GraficoProgresoCard.tsx`, `ObjetivosCard.tsx`, `MensajeMotivacional.tsx`: microcopy más claro y acentuado.

## Verificación visual

Usar los servidores ya levantados por Agustín. No iniciar ni reiniciar backend/frontend.

1. Abrir `/dashboard` como socio.
2. Confirmar que se ve el nuevo encabezado “Tu plan de hoy”.
3. Click en “Reservar Turno” y verificar navegación a `/turnos/agendar`.
4. Click en “Ver Mi Plan” y verificar navegación a `/mi-plan`.
5. Click en “Subir Avance” y verificar navegación a `/mi-progreso`.
6. Revisar consola del navegador sin errores nuevos.
