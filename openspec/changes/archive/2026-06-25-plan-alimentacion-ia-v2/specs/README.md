# Specs: plan-alimentacion-ia-v2

**Change ID**: plan-alimentacion-ia-v2
**Phase**: spec
**Date**: 2026-06-25
**Persistence**: BOTH (OpenSpec + Engram)

Este directorio contiene los 11 specs detallados del feature, uno por requerimiento funcional principal.

## Índice de specs

| Spec ID | RF cubierto | Nombre | Estado |
|---|---|---|---|
| `ia-generacion` | RF-001 | Generación de plan semanal mejorado | ✅ Escrito |
| `notas-nutricionista` | RF-002 | Notas del nutricionista (2 niveles) | ✅ Escrito |
| `feedback` | RF-003 | Sistema de feedback 👍/👎 | ✅ Escrito |
| `memoria-ia` | RF-004 | Memoria de feedback por nutricionista | ✅ Escrito |
| `validacion-restricciones` | RF-005 | Validación dura de restricciones alimentarias | ✅ Escrito |
| `validacion-macros` | RF-006 | Cobertura del día + cumplimiento de macros | ✅ Escrito |
| `regeneracion-scope` | RF-007 | Regeneración con 3 granularidades | ✅ Escrito |
| `razonamiento` | RF-008 | Razonamiento de cumplimiento de restricciones | ✅ Escrito |
| `versionado` | RF-009 | Versionado completo de planes | ✅ Escrito |
| `permisos-aislamiento` | RF-010 | Permisos, vistas y aislamiento | ✅ Escrito |
| `notificaciones` | RF-011 | Notificaciones in-app | ✅ Escrito |

**Total**: 11 specs escritos en español.

## Convención de cada spec (aplicada)

Cada archivo `.md` sigue la estructura estándar del repo (patrón ficha-salud):

```markdown
# Spec: <nombre>

**Spec ID**: <id>
**Change**: plan-alimentacion-ia-v2
**RBs aplicados**: <lista>
**Related docs**: <RF, secciones del proposal.md>

## Requisito (Requirement)
<descripción concisa del RF>

## Contexto / Estado actual
<qué existe hoy, qué falta>

## Escenarios (Given / When / Then)
<2-5 escenarios: happy path + edge cases + errores>

## Modelo de datos
<entidades, columnas, constraints — solo si el spec introduce cambios>

## Endpoints / contratos
<tabla con: método + path + actor + payload + response + códigos de error>

## Tests requeridos
<separar unit (backend), integration (backend), unit (frontend), e2e>

## Out of scope
<qué NO cubre este spec>

## Acceptance criteria
<checklist binario verificable>
```

## Relación con packets de implementación

| Packet | Specs que implementa |
|---|---|
| Packet 1 — Cimientos | `notas-nutricionista` (endpoints + columnas) |
| Packet 2 — IA mejorada | `ia-generacion`, `validacion-restricciones`, `validacion-macros`, `razonamiento` |
| Packet 3 — Versionado + feedback + memoria | `feedback`, `memoria-ia`, `versionado` (crear/editar) |
| Packet 4 — Regeneración scope + estados | `regeneracion-scope`, `versionado` (activar/finalizar), `notificaciones`, `permisos-aislamiento` (RBAC de los nuevos endpoints) |
| Packet 5 — Frontend editor | (frontend specs no se documentan aquí; van en tasks del packet) |
| Packet 6 — Frontend socio | (frontend specs no se documentan aquí; van en tasks del packet) |
| Packet 7 — E2E | (cubre todos los specs transversalmente) |

## Próximo paso

Proceder con la fase `sdd-design` para escribir el diseño técnico formal en `openspec/changes/plan-alimentacion-ia-v2/design.md`, que mapea los specs a archivos concretos del código, define los contratos de use-cases y builders, y describe los flujos técnicos detallados.