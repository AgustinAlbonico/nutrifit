# Tasks: Fase 0 - Estabilización Técnica

## Phase 1: Foundation (Scripts & Source of Truth)

- [x] 1.1 Relevar `@Actions()` en `apps/backend/src/presentation/**` y listar acciones requeridas para el catálogo de seeds.
- [x] 1.2 Actualizar `package.json` (root) para agregar alias `db:migrate` y `db:seed` hacia el workspace backend.
- [x] 1.3 Actualizar `apps/backend/package.json` para usar `npx typeorm` en `migration:run` y `migration:revert`.
- [x] 1.4 Actualizar `migration.schema.ts` con imports relativos (en lugar de `src/...`) y entities completos (incluyendo `GimnasioOrmEntity`, `FotoProgresoOrmEntity`, `ObjetivoOrmEntity`). Actualizar scripts para usar `dist/` path.

## Phase 2: Core Implementation (Seeds Alignment)

- [x] 2.1 Extender `apps/backend/src/seed-simple.ts` con `INSERT IGNORE` para todas las acciones faltantes detectadas.
- [x] 2.2 Alinear nombres de acción en seeds (`profesionales.actualizar` en lugar de `profesionales.editar`) en `seed-simple.ts`.
- [x] 2.3 Mantener idempotencia en `seed-simple.ts` (no reemplazar existentes ni tocar IDs referenciados).
- [x] 2.4 Replicar el mismo catálogo y nombres en `apps/backend/src/seed.ts` si está en uso.
- [x] 2.5 Verificar que los grupos `PROFESIONAL`, `ADMIN` y scaffold `SOCIO` estén presentes en seeds.

## Phase 3: Integration (Wiring & Consistency)

- [x] 3.1 Confirmar que la ruta del datasource en scripts apunte a `apps/backend/src/infrastructure/config/typeorm/migration.schema.ts`.
- [x] 3.2 Revisar que `db:migrate` desde root ejecute `migration:run` del workspace sin rutas relativas rotas.

## Phase 4: Testing / Verification (Manual)

- [x] 4.1 Ejecutar `npm run db:migrate` desde root y verificar que aplica migraciones sin "command not found".
- [x] 4.2 Ejecutar `npm run db:seed` en DB limpia y validar acciones creadas en tabla `accion`.
- [x] 4.3 Re-ejecutar `npm run db:seed` y confirmar idempotencia (sin duplicados ni errores).
