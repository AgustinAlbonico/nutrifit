# QA ejecutado con Playwright MCP (UI)

Fecha de ejecucion: 2026-02-17
URL objetivo: `http://localhost:5173`
Backend consumido por frontend: `http://localhost:3000`

## Alcance validado en navegador

Se ejecuto QA real con Playwright MCP sobre los flujos disponibles en UI actual:

1. Login como ADMIN.
2. Navegacion a Gestion de Nutricionistas.
3. Alta de nutricionista nuevo (`PW717442 Playwright`).
4. Edicion del nutricionista (provincia cambiada a `Chaco`).
5. Baja del nutricionista.
6. Reactivacion del nutricionista.
7. Acceso a Permisos y Roles como ADMIN.
8. Logout y login como SOCIO.
9. Verificacion de que SOCIO no ve menu admin.
10. Verificacion de bloqueo de acceso a `/permisos` para SOCIO.

## Resultado automatizado (Playwright MCP)

Resultado devuelto por ejecucion en browser:

```json
{
  "adminEnNutricionistas": true,
  "cardCreadaVisible": true,
  "cardConProvinciaEditada": true,
  "socioLogueado": true,
  "socioNoVeMenuAdmin": true,
  "socioPermisosBloqueado": true
}
```

## Evidencia visual

- `qa-playwright-admin-nutricionistas.png`
- `qa-playwright-socio-permisos-bloqueado.png`

## Notas

- Este QA fue ejecutado estrictamente con Playwright MCP sobre navegador (sin runner local de `@playwright/test`).
- La UI actual no expone todos los flujos de CUD07-CUD21; esos CUD quedaron validados por API en el checklist integral ya generado en `docs/plans/2026-02-17-checklist-ejecucion-cud01-21.md`.
