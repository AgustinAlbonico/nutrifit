# Reportes Auditoria Specification

## Purpose

La capacidad `reportes-auditoria` define la consulta administrativa de logs de auditoria. `GET /admin/auditoria` MUST devolver registros filtrables, paginados y tenant-aware para ADMIN y SUPERADMIN con gimnasio impersonado.

## Requirements

### Requirement: Listado paginado y ordenado

El sistema MUST exponer `GET /admin/auditoria` con `page`, `pageSize`, orden por `fecha DESC` por defecto y orden configurable. Si no se informan parametros, SHALL usar `page=1` y `pageSize=50`.

#### Scenario: Listado paginado sin filtros

- GIVEN existen mas de 50 logs de auditoria visibles para el solicitante
- WHEN se consulta `/admin/auditoria` sin filtros
- THEN la respuesta MUST devolver pagina 1 con 50 resultados
- AND los registros MUST estar ordenados del mas reciente al mas antiguo

#### Scenario: Orden configurable

- GIVEN existen logs visibles con fechas diferentes
- WHEN se solicita un orden soportado distinto al default
- THEN el sistema MUST aplicar ese orden a los resultados paginados

### Requirement: Filtros de busqueda

El sistema MUST soportar filtros por `modulo`, `accion`, `usuarioId`, `gimnasioId`, `fechaDesde`, `fechaHasta`, `entidad` y `entidadId`. Los filtros SHALL combinarse con semantica AND.

#### Scenario: Filtro por modulo

- GIVEN existen logs de `turnos` y `auth`
- WHEN se consulta con `modulo=turnos`
- THEN la respuesta MUST incluir solo logs del modulo `turnos`
- AND logs de `auth` MUST quedar excluidos
- WHEN se consulta con `modulo=auth`
- THEN la respuesta MUST incluir solo eventos auth visibles

#### Scenario: Filtro por rango de fechas

- GIVEN existen logs antes, durante y despues del rango solicitado
- WHEN se consulta con `fechaDesde=X` y `fechaHasta=Y`
- THEN la respuesta MUST incluir solo eventos entre X e Y

#### Scenario: Filtro por usuario

- GIVEN existen logs de varios usuarios
- WHEN se consulta con `usuarioId=U`
- THEN la respuesta MUST incluir solo eventos asociados al usuario U

### Requirement: Alcance y autorizacion tenant-aware

El sistema MUST autorizar solo ADMIN y SUPERADMIN. ADMIN SHALL consultar unicamente su gimnasio. SUPERADMIN SHALL consultar solo cuando exista gimnasio seleccionado via impersonacion y los resultados MUST limitarse a ese gimnasio.

#### Scenario: Admin de gimnasio A no ve logs de B

- GIVEN existen logs de los gimnasios A y B
- WHEN un ADMIN del gimnasio A consulta auditoria
- THEN la respuesta MUST incluir solo logs con `gimnasioId` A
- AND logs de B MUST NOT ser visibles

#### Scenario: Superadmin con impersonacion

- GIVEN un SUPERADMIN impersona el gimnasio X
- WHEN consulta auditoria
- THEN la respuesta MUST incluir solo logs del gimnasio X

#### Scenario: Rol no autorizado o superadmin sin gimnasio

- GIVEN un usuario sin rol permitido o un SUPERADMIN sin gimnasio impersonado
- WHEN consulta auditoria
- THEN el sistema MUST rechazar la solicitud con error de autorizacion

### Requirement: Shape de respuesta y diff visible

El sistema MUST responder cada registro con `id`, `fecha`, `usuarioId`, `modulo`, `accion`, `entidad`, `entidadId`, `descripcion`, `valoresAntes` y `valoresDespues`. Para UPDATE, los valores SHALL exponerse parseados para consumo del reporte.

#### Scenario: Diff visible en UPDATE

- GIVEN un log UPDATE contiene `valoresAntes` y `valoresDespues`
- WHEN el reporte devuelve ese registro
- THEN la respuesta MUST incluir ambos valores parseados
- AND el cliente MUST poder identificar campos cambiados, valor anterior y valor nuevo

### Requirement: Exportacion filtrada

El sistema MUST permitir exportar CSV y JSON con los mismos filtros, orden y alcance tenant-aware aplicados al listado.

#### Scenario: Exportacion CSV/JSON con filtros aplicados

- GIVEN una consulta usa filtros por modulo y rango de fechas
- WHEN se solicita exportacion CSV o JSON
- THEN el archivo descargable MUST contener solo registros que cumplen esos filtros
- AND el formato MUST preservar los campos definidos para el reporte
