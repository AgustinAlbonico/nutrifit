# Source
Provisto por el usuario en el prompt del 2026-06-12; archivo fuente original no presente en `iteracion 1/`.

# Crear turno en nombre del socio
Dependencias: 11-reservar-turno.md

CU-12 expanded: RECEPCIONISTA, ADMIN, and NUTRICIONISTA can create a turno on behalf of a socio. New requirements beyond the original spec:
- NUTRICIONISTA is now a permitted actor.
- A nutri can only assign turnos to a socio within their own gimnasio (the nutri's gimnasio), and only to socios of that gimnasio. Equivalent scope rule for RECEPCION/ADMIN: their actor's gimnasio. ADMIN can target any gimnasio they administer (need to verify with existing RB; for now assume same as reception).
- `creado_por` enum values now include `'RECEPCION'`, `'NUTRICIONISTA'`, `'ADMIN'` (the latter wasn't in the original spec, derive from RB33 wording "creado_por='RECEPCION'" being specifically for reception; treat ADMIN same as reception unless existing RB says otherwise).
- The original spec's optional `creado_por='RECEPCION'` event `TURNO_CREADO_POR_RECEPCION` should be generalized to `TURNO_CREADO_POR_NUTRICIONISTA` / `TURNO_CREADO_POR_RECEPCION` / `TURNO_CREADO_POR_ADMIN` family, with the existing `TURNO_CONFIRMADO` event being the canonical one all branches emit.
- Re-use the existing `POST /turnos/socio/reservar` flow's validations (RB05/06/07/17/27/28/40/58/59/60) and exempt ficha completa (RB14) when the actor is reception/admin. For NUTRICIONISTA, ficha completa IS required (the nutri is the clinician; cannot create a clinical turn without clinical baseline). The warning is also different: for nutri, if the socio has no ficha, BLOCK the turn (RB14 applies). For reception/admin, show the warning and let them continue.