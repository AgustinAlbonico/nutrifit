# 02-01 Summary - Backend Entities & Database Schema

## Objetivo
Implementar la base de datos y entidades para fotos de progreso y objetivos de socios.

## Entregables completados
- Entidad de dominio `FotoProgresoEntity` con `TipoFoto` en `src/domain/entities/FotoProgreso/foto-progreso.entity.ts`.
- Entidad de dominio `ObjetivoEntity` con `TipoMetrica`, `EstadoObjetivo` y metodo `calcularProgreso()` en `src/domain/entities/Objetivo/objetivo.entity.ts`.
- Entidad TypeORM `FotoProgresoOrmEntity` en `src/infrastructure/persistence/typeorm/entities/foto-progreso.entity.ts`.
- Entidad TypeORM `ObjetivoOrmEntity` en `src/infrastructure/persistence/typeorm/entities/objetivo.entity.ts`.
- Migracion `AddFotoProgresoAndObjetivo20260223000000` en `src/infrastructure/persistence/typeorm/migrations/20260223000000-AddFotoProgresoAndObjetivo.ts`.

## Cambios de esquema
- Nueva tabla `foto_progreso` con columnas:
  - `id_foto`, `id_socio`, `tipo_foto`, `fecha`, `object_key`, `notas`, `created_at`
- Nueva tabla `objetivo` con columnas:
  - `id_objetivo`, `id_socio`, `tipo_metrica`, `valor_inicial`, `valor_objetivo`, `valor_actual`, `estado`, `fecha_inicio`, `fecha_objetivo`, `created_at`, `updated_at`
- Claves foraneas:
  - `FK_FOTO_PROGRESO_SOCIO` (`foto_progreso.id_socio` -> `persona.id_persona`)
  - `FK_OBJETIVO_SOCIO` (`objetivo.id_socio` -> `persona.id_persona`)

## Commits atomicos realizados
1. `3f71b9b` - Add FotoProgreso domain entity
2. `23adb24` - Add Objetivo domain entity with progress calculation
3. `242f786` - Add FotoProgreso TypeORM entity
4. `5dac982` - Add Objetivo TypeORM entity
5. `020486e` - Add migration for foto_progreso and objetivo tables

## Verificacion
- LSP diagnostics: sin errores en los archivos modificados.
- Build backend: `npm run build` OK.
