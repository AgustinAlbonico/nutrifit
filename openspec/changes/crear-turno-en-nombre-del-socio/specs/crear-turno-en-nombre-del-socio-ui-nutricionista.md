# Spec: UI para Creación de Turnos (Nutricionista)

**Spec ID**: crear-turno-en-nombre-del-socio-ui-nutricionista
**Change**: crear-turno-en-nombre-del-socio

## Requisito (Requirement)

Los profesionales clínicos (`NUTRICIONISTA`) deben poder agendar turnos de seguimiento o primera consulta directamente desde su propia agenda, siempre y cuando el paciente cumpla con los requisitos clínicos de base (ficha completa).

## Flujo de Usuario

1. **Punto de Entrada**: Dentro de la vista "Mi Agenda", el profesional tiene un botón "Nuevo Turno".
2. **Paso 1: Búsqueda del Paciente (Socio)**:
   - Input de búsqueda de pacientes del gimnasio.
   - En los resultados, se indican los pacientes que no tienen ficha de salud completa.
3. **Bloqueo Estricto de Ficha Incompleta (RB14 enforced)**:
   - Si el profesional selecciona a un socio sin ficha completa, el sistema **deshabilita** el paso siguiente.
   - Se muestra un mensaje de error estilo call-out: *"El paciente {nombre} no ha completado su ficha médica. No es posible agendar una consulta clínica sin este requisito. Pídale al paciente que acceda a su portal para completarla."*
   - No hay opción de saltar esta restricción.
4. **Paso 2: Selección de Fecha y Hora**:
   - Como es su propia agenda, el profesional simplemente elige un slot libre en su calendario.
   - Aplican validaciones visuales de horarios de atención configurados y turnos ya tomados.
5. **Confirmación**:
   - Resumen del turno.
   - Click en "Agendar".
   - Toast de éxito y actualización optimista de "Mi Agenda".

## Consideraciones de UI/UX

- **Flujo más corto**: A diferencia de Recepción, el nutricionista no tiene que "seleccionar profesional", ya que la acción está implícitamente targeteada a su propio `nutricionistaId`. El request omitirá o auto-completará este campo.
- **Acceso rápido**: Poder hacer click en un slot vacío del calendario para abrir el modal de creación ya con la fecha/hora pre-seleccionada.