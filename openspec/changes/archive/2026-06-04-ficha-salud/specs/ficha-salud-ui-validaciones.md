# Spec: Validaciones UI e Integración de Enums

**Spec ID**: ficha-salud-ui-validaciones
**Change**: ficha-salud
**RBs aplicados**: N/A
**Related docs**: CU-08 §Camino principal

## Requisito (Requirement)
El frontend debe realizar verificaciones estrictas (peso, altura) y usar los enums unificados (de `@nutrifit/shared`) en lugar de hardcodear opciones de selects y comboboxes.

## Contexto / Estado actual
El schema de Zod dentro del frontend tiene un par de comprobaciones básicas pero no respeta exhaustivamente las reglas dictadas y los labels en la UI están desacoplados del enum backend.

## Escenarios (Given / When / Then)

### Escenario: Rellenar altura incorrecta
- **Dado** que un socio en el frontend ingresa altura "0.5".
- **Cuando** el schema Zod corre validación (onBlur o onSubmit).
- **Entonces** arroja error en español: "La altura debe ser entre 1.0 y 2.5 metros".

### Escenario: Rellenar peso incorrecto
- **Dado** un socio ingresando peso "15" o "400".
- **Cuando** valida en frontend.
- **Entonces** indica error: "El peso debe estar entre 20 y 300 kg".

### Escenario: Selección de nivel de actividad
- **Dado** el Select de "Nivel de Actividad".
- **Cuando** el usuario lo despliega.
- **Entonces** renderiza las opciones consumidas directamente del enum compartido, garantizando mapeo exacto a las requests y evitando validaciones cruzadas.

## UI / UX
- **Validaciones en cliente**: Mejorar `zod.schema` con métodos `.min()`, `.max()`, y custom errors de TypeScript.
- **Accesibilidad**: Errores vinculados a cada input a través de `aria-describedby` u `aria-errormessage`.

## Acceptance criteria
- [ ] Schema Zod sincronizado a los rangos de CU-08.
- [ ] Componentes Select / Dropdown iteran sobre el enum importado de `shared`.