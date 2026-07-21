# Spec: Recepcionista sin Acceso Clínico

**Spec ID**: ficha-salud-rb16-acceso
**Change**: ficha-salud
**RBs aplicados**: RB16
**Related docs**: CU-08 §Reglas de negocio aplicadas

## Requisito (Requirement)
Los roles del sistema con privilegios administrativos menores (RECEPCIONISTA) no deben tener acceso a leer la ficha médica o datos clínicos del socio.

## Contexto / Estado actual
La seguridad en los controladores define quién puede hacer requests a ciertos endpoints. Se debe confirmar o agregar explicitamente el bloqueo de endpoints de ficha médica al rol `RECEPCIONISTA`.

## Escenarios (Given / When / Then)

### Escenario: Intento de acceso de recepcionista
- **Dado** un usuario autenticado como RECEPCIONISTA.
- **Cuando** realiza un GET directo al endpoint de ficha de salud de un socio.
- **Entonces** recibe error 403 Forbidden.

### Escenario: Profesional autorizado
- **Dado** un NUTRICIONISTA (o el propio SOCIO dueño).
- **Cuando** solicita la ficha.
- **Entonces** tiene permisos plenos.

## Acceptance criteria
- [ ] Los endpoints `/api/socios/:id/ficha-salud` o `/turnos/socio/ficha-salud` rechazan 403 para RECEPCIONISTA.
- [ ] Los tests de control de roles incluyen a los controladores de ficha de salud.