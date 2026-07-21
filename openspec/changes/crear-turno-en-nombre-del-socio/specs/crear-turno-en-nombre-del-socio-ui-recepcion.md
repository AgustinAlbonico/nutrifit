# Spec: UI para Creación de Turnos (Recepción y Admin)

**Spec ID**: crear-turno-en-nombre-del-socio-ui-recepcion
**Change**: crear-turno-en-nombre-del-socio

## Requisito (Requirement)

Proveer una interfaz de usuario clara y ágil para que los roles `RECEPCIONISTA` y `ADMIN` puedan agendar turnos a favor de los socios del gimnasio.

## Flujo de Usuario

1. **Punto de Entrada**: En el dashboard administrativo o en la vista del calendario general de turnos, debe existir un CTA prominente: "Agendar Turno".
2. **Paso 1: Búsqueda del Socio (Autocomplete)**:
   - Se presenta un input typeahead para buscar socios pertenecientes al gimnasio.
   - El input debe soportar búsqueda por nombre, apellido, DNI o email.
   - Si el socio no tiene la ficha médica completa, el item en la lista desplegable debe mostrar un badge de advertencia (ej. "Ficha Incompleta").
3. **Warning de Ficha Incompleta (RB14 Bypassed)**:
   - Al seleccionar un socio sin ficha completa, se despliega un `Alert` de advertencia indicando que el paciente debe completarla, pero permitiendo continuar.
4. **Paso 2: Selección de Profesional y Especialidad**:
   - Selección del `Nutricionista` (filtrado por los nutricionistas activos del gimnasio).
   - Selección del tipo de consulta (si aplica).
5. **Paso 3: Selección de Fecha y Hora (Calendario)**:
   - Se muestra un calendario de disponibilidad del nutricionista seleccionado.
   - Aplican visualmente las reglas de anticipación (RB27, RB28). Los slots ocupados o pasados deben estar deshabilitados.
6. **Confirmación**:
   - Modal o bottom sheet de resumen.
   - Al confirmar, se dispara el request a `POST /turnos/crear`.
   - Se muestra un toast de éxito: "Turno agendado correctamente".
   - El turno aparece inmediatamente en el calendario general.

## Consideraciones de UI/UX

- **Uso del Teclado**: El flujo de búsqueda del socio y selección de slots debe ser completamente navegable por teclado para no interrumpir el flujo de atención en recepción.
- **Empty States**: Si el gimnasio no tiene socios o nutricionistas cargados, mostrar un state claro con enlace a dar de alta dichas entidades.
- **Error Handling**: Si ocurre un 409 Conflict (ej. el socio mismo tomó ese slot en ese instante desde su app), mostrar un toast de error específico: "El horario ya no está disponible, seleccione otro".