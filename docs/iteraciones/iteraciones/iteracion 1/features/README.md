# Features — Iteración 1

Este directorio contiene las **especificaciones de cada feature** de la iteración 1, derivadas del documento fuente de verdad `01-iteracion-base-nutricional.md`.

## Estructura

```
features/
├── nutricionistas/         # 3 features: alta, edición, desactivación
├── socios/                 # 2 features: alta, desactivación
├── disponibilidad/         # 2 features: semanal, excepciones
├── ficha-salud/            # 2 features: completar, editar
├── turnos/                 # 6 features: reservar, crear por recepción, cancelar, reprogramar, check-in, ausente automático
├── agenda/                 # 2 features: ver catálogo, ver agenda del día
├── consulta-mediciones/    # 2 features: consulta, mediciones
├── plan-alimentario/       # 3 features: crear, editar, eliminar
├── progreso/               # 1 feature: ver progreso del socio
└── transversales/          # 11 features: auth, onboarding, cierre cuenta, alimentos, notificaciones, recordatorios, auditoría, archivos, multi-tenant, compliance
```

## Convención de nombres

- **Funcionales (CU)**: `NN-nombre-kebab-case.md` donde NN es el número del CU (01-23).
- **Transversales**: `nombre-descriptivo.md` sin prefijo numérico.

## Template de cada feature

Cada .md sigue esta estructura:

1. **Header**: ID, nombre, referencia al doc maestro, estado, prioridad, dependencias.
2. **Descripción**: qué hace la feature.
3. **Actores**: roles involucrados.
4. **Precondiciones / Postcondiciones**.
5. **Camino principal**: pasos numerados.
6. **Caminos alternativos** (A1, A2, ...): casos de error o variantes.
7. **Casos borde** (B1, B2, ...): situaciones raras con outcome definido.
8. **Reglas de negocio aplicadas** (RB): referencia a las RB del doc maestro.
9. **Eventos disparados**.
10. **Auditoría**: qué se registra.
11. **Criterios de aceptación**: checklist verificable.
12. **Endpoints API**: rutas, auth, body, response, errors.
13. **Modelo de datos**: entidades, constraints, índices.
14. **UI / UX**: notas de pantallas y comportamiento.
15. **Tests**: unitarios, integración, e2e manual.
16. **Notas**: cualquier decisión, riesgo o apunte adicional.

## Cómo usar estos specs

1. **Para implementación**: tomar un feature .md como input. Contiene todo lo necesario para implementar (modelo, endpoints, validaciones, tests, criterios de aceptación).
2. **Para revisión**: leer el .md y verificar que el comportamiento descrito coincide con lo esperado.
3. **Para dividir en fases**: agrupar features por dependencias y complejidad.

## Siguiente paso sugerido

- Revisar cada .md contra el código actual (gap analysis).
- Marcar features como "Implementado" / "Pendiente" / "En progreso".
- Dividir en fases de implementación (sugerido: Fase 0 = entidades base + auth, Fase 1 = ficha + turnos, etc.).
