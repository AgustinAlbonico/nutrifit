# 02-03 SUMMARY - Goals Backend (Objetivos)

## Resultado

Plan 02-03 ejecutado con commits atomicos para cada tarea del alcance backend de objetivos:

- DTOs para crear/actualizar/listar objetivos.
- Repositorio TypeORM de objetivos con consultas por estado y metrica.
- Use cases para crear, actualizar, marcar estado y listar objetivos de un socio.
- Soporte ORM para `Objetivo` integrado en entidades/exportes/config TypeORM.

## Archivos creados/modificados

- `src/application/objetivos/dtos/objetivo.dto.ts`
- `src/application/objetivos/use-cases/crear-objetivo.use-case.ts`
- `src/application/objetivos/use-cases/actualizar-objetivo.use-case.ts`
- `src/application/objetivos/use-cases/marcar-objetivo-completado.use-case.ts`
- `src/application/objetivos/use-cases/obtener-objetivos-activos.use-case.ts`
- `src/infrastructure/persistence/typeorm/repositories/objetivo.repository.ts`
- `src/infrastructure/persistence/typeorm/entities/objetivo.entity.ts`
- `src/infrastructure/persistence/typeorm/entities/index.ts`
- `src/infrastructure/config/typeorm/typeorm.config.ts`

## Comportamiento implementado

1. Crear objetivo:
   - crea en estado `ACTIVO`
   - setea `fechaInicio` en fecha actual
   - inicializa `valorActual = valorInicial`
   - calcula y retorna `progreso` en rango 0-100

2. Actualizar objetivo:
   - actualiza `valorActual`
   - actualiza `updatedAt`
   - auto-marca `COMPLETADO` cuando `valorActual === valorObjetivo`
   - retorna DTO con progreso recalculado

3. Marcar estado manual:
   - permite transicionar a `COMPLETADO` o `ABANDONADO`
   - valida que el estado actual sea `ACTIVO`

4. Listar objetivos por socio:
   - devuelve `activos`
   - devuelve `completados` (incluye cerrados: completados + abandonados)

## Verificacion

- `lsp_diagnostics`: sin errores en todos los archivos modificados de objetivos.
- `npm run build` (backend): OK.

## Commits realizados (backend)

- `cb2b339` Add Objetivo base entity and ORM mapping
- `63ab46d` Add DTOs for objetivos use cases
- `fca2525` Add TypeORM repository for objetivos
- `8e9a37c` Add CrearObjetivo use case
- `aa7f3a4` Add ActualizarObjetivo use case
- `9baa27a` Add use case to complete or abandon objetivos
- `c4cabcd` Add use case to list objetivos by socio
