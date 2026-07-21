# Spec: Wizard Frontend y Edición Reciente

**Spec ID**: ficha-salud-ui-wizard
**Change**: ficha-salud
**RBs aplicados**: RB42
**Related docs**: CU-08 §UI / UX, CU-09 §UI / UX

## Requisito (Requirement)
La interfaz del socio (`FichaSaludSocio.tsx`) debe gestionar el flujo condicional para la creación (pidiendo consentimiento) y la edición (mostrando bandera de "Última edición" y opción de ver historial).

## Contexto / Estado actual
El componente renderiza los inputs sin diferenciar drásticamente el modo de creación del de edición. No hay modal de versiones y falta el checkbox requerido (RB44) integrado en la vista de carga.

## Escenarios (Given / When / Then)

### Escenario: Vista en modo creación (Ficha sin completar)
- **Dado** que un socio no tiene ficha o su ficha tiene `completada === false`.
- **Cuando** entra a `FichaSaludSocio.tsx`.
- **Entonces** el banner superior omite la fecha de actualización, el modal de historial no se muestra y al final del formulario se exige tildar el checkbox de consentimiento antes de poder hacer submit.

### Escenario: Vista en modo edición (Ficha completada)
- **Dado** un socio con ficha `completada === true` y un `actualizada_at` definido.
- **Cuando** renderiza el form.
- **Entonces** aparece el banner indicando "Última edición: DD/MM/AAAA HH:MM" y un botón para abrir el modal del Historial. El checkbox de consentimiento NO se renderiza o se marca de solo-lectura pre-aceptado.

### Escenario: Consultando historial
- **Dado** un socio en modo edición que hace click en "Ver historial".
- **Cuando** se abre el modal.
- **Entonces** renderiza el listado fetchado desde `/historial` y permite seleccionar una versión de sólo lectura.

## UI / UX
- **Pantalla principal**: `FichaSaludSocio.tsx`
- **Sub-componentes nuevos**: `FichaSaludHistorialModal`
- **Accesibilidad**: Elementos de diálogo usando `Dialog` de shadcn/ui. Banner con `role="status"` o `aria-live="polite"` según aplique. Textos descriptivos en botones de historial.

## Acceptance criteria
- [ ] En modo creación el checkbox bloquea el envío.
- [ ] En modo edición se muestra correctamente la fecha parseada.
- [ ] Modal de historial muestra lista sin bloquear el main thread de forma notoria.