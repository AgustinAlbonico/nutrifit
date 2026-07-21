# Spec: Consentimiento RGPD Condicional

**Spec ID**: ficha-salud-rb44-consentimiento
**Change**: ficha-salud
**RBs aplicados**: RB44
**Related docs**: CU-08 §Camino principal, CU-09 §Notas

## Requisito (Requirement)
El consentimiento expreso del socio para almacenar información médica es obligatorio en la creación de la ficha, y se debe persistir la fecha de dicho consentimiento (`consentimientoFecha`).

## Contexto / Estado actual
No se evalúa el consentimiento y el DTO carece de dicho parámetro. Tampoco se persiste un timestamp de la aprobación.

## Escenarios (Given / When / Then)

### Escenario: Falla en creación sin consentimiento (A3)
- **Dado** un socio sin ficha.
- **Cuando** envía payload con todos los campos pero sin el flag de `consentimiento=true`.
- **Entonces** retorna 400 Bad Request indicando que "Se requiere consentimiento expreso para almacenar la ficha".

### Escenario: Creación exitosa con consentimiento
- **Dado** un socio sin ficha que envía el payload incluyendo `consentimiento=true`.
- **Cuando** guarda la ficha.
- **Entonces** el sistema guarda `consent_at = now()` en la entidad FichaSalud.

### Escenario: Edición no requiere consentimiento nuevamente
- **Dado** un socio que ya prestó consentimiento y tiene su ficha.
- **Cuando** edita su ficha sin proveer el campo `consentimiento`.
- **Entonces** se guardan los cambios sin fallar ni modificar `consent_at`.

## Modelo de datos
- Agregado del campo `consentimientoFecha` (`consent_at`) Date nullable en `FichaSalud`.
- DTO: campo `consentimiento` booleano opcional/requerido dependiendo del caso.

## Acceptance criteria
- [ ] El endpoint de creación inicial bloquea requests con `consentimiento=false` o undefined.
- [ ] La fecha de consentimiento queda persistida en base de datos al crearse.