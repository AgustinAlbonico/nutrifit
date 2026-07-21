# Spec: Completar ficha inicial

**Spec ID**: ficha-salud-completar
**Change**: ficha-salud
**RBs aplicados**: RB50
**Related docs**: CU-08 §Camino principal

## Requisito (Requirement)
El backend debe procesar la carga inicial de la ficha, asegurar validaciones mínimas y marcar la ficha como `completada=true`.

## Contexto / Estado actual
El caso de uso `UpsertFichaSaludSocioUseCase` carece del manejo del estado "completada" y su fecha correspondiente.

## Escenarios (Given / When / Then)

### Escenario: Ficha guardada correctamente (Happy Path)
- **Dado** que la validación de entrada es correcta y el socio no tenía ficha.
- **Cuando** llama al endpoint de upsert para crearla.
- **Entonces** se marca `completada=true` y `completada_at=now()` y se genera la versión inicial.

### Escenario: Faltan campos requeridos (A1)
- **Dado** que el payload carece de campos obligatorios (peso, altura, etc.).
- **Cuando** llama al endpoint.
- **Entonces** el sistema retorna 400 Bad Request por validación del DTO.

### Escenario: Valores fuera de rango (A2)
- **Dado** que peso es menor a 20 o altura menor a 1.0.
- **Cuando** llama al endpoint.
- **Entonces** retorna 400 Bad Request validado mediante `class-validator` en el DTO.

### Escenario: Casos borde de texto y alergias (B1, B2, B5)
- **Dado** que se incluye texto libre sensible, embarazo o alergias graves.
- **Cuando** se crea la ficha.
- **Entonces** se almacena y se incluye en la versión JSON inmutable sin fallos.

## Endpoints
- **POST/PUT** `/api/socios/me/ficha-salud` (o el equivalente del módulo `turnos`).
- Body: `CreateFichaSaludDto` (con rangos y consentimientos validados).
- Response 201: Contiene `id`, `version`, `completada`.

## Tests requeridos
- Unit tests para el use-case contemplando flujos A1, A2, B1, B5.

## Acceptance criteria
- [ ] El endpoint valida campos obligatorios estrictamente antes de guardar.
- [ ] La ficha creada establece el flag `completada=true` de forma definitiva.