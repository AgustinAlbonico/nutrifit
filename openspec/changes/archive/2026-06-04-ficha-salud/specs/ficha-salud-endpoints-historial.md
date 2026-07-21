# Spec: Endpoints de Historial de Versiones

**Spec ID**: ficha-salud-endpoints-historial
**Change**: ficha-salud
**RBs aplicados**: RB50
**Related docs**: CU-08 §Endpoints API, CU-09 §Endpoints API

## Requisito (Requirement)
El sistema debe exponer endpoints para que tanto el socio como el nutricionista puedan consultar el historial de versiones inmutables de una ficha de salud.

## Contexto / Estado actual
Actualmente, los controladores sólo exponen GET y UPSERT sobre la ficha en curso. Faltan las rutas para listar versiones y leer una versión puntual.

## Escenarios (Given / When / Then)

### Escenario: Socio lista su historial
- **Dado** un socio autenticado que posee versiones previas.
- **Cuando** hace un request GET a `/api/socios/me/ficha-salud/historial` (o sub-ruta de `turnos`).
- **Entonces** recibe 200 OK con un array de versiones reducidas: `[{ version, createdAt }]`.

### Escenario: Socio consulta versión puntual
- **Dado** un socio autenticado.
- **Cuando** solicita GET `/api/socios/me/ficha-salud/version/:n`.
- **Entonces** retorna el objeto deserializado de `datos_json` correspondiente a esa versión.

### Escenario: Ficha inexistente
- **Dado** un socio sin ficha completada.
- **Cuando** hace GET a sus historiales.
- **Entonces** recibe 404 Not Found (con mensaje "No se encontraron fichas de salud").

## Endpoints
- **GET** `/api/socios/me/ficha-salud/historial` (Auth: SOCIO) -> Response: array simple de versiones.
- **GET** `/api/socios/me/ficha-salud/version/:n` (Auth: SOCIO) -> Response: Objeto completo.
- *(Nota: se implementarán dentro del controller correspondiente al módulo actual de turnos que sirve a socio/profesional, manteniendo consistencia de paths).*

## Acceptance criteria
- [ ] Los endpoints operan bajo la autorización correspondiente del SOCIO.
- [ ] La API devuelve el historial correctamente mapeado (omitiendo payloads masivos en el resumen).