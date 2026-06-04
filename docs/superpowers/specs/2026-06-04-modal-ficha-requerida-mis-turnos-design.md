# Modal bloqueante de ficha requerida para Mis Turnos

**Fecha:** 2026-06-04
**Estado:** Diseño aprobado (con ajuste de alcance: no hay página Mis Turnos
dedicada, los turnos del socio se muestran en `ProximoTurnoCard` y
`Turnos.tsx`).
**RBs relacionados:** RB14 (bloqueo de flujo de turnos sin ficha completa).

## Contexto

Hoy un socio sin ficha de salud cargada puede ver sus turnos sin ningún
aviso en las dos vistas que consumen `GET /turnos/socio/mis-turnos`:

1. `ProximoTurnoCard` en el dashboard del socio.
2. La página `Turnos.tsx` (ruta `/turnos`) cuando el socio la visita.

La pantalla carga vacía o con turnos agendados previamente y el socio queda
confundido. El único punto de bloqueo actual es `AgendarTurno.tsx` (banner
ámbar con `FileWarning` + botón "Cargar ficha de salud" que navega a
`/turnos/ficha-salud`).

**Nota de discovery**: en el router no existe una ruta dedicada
`/turnos/mis-turnos`. La página `MisTurnos.tsx` no existe en el frontend.
Los turnos del socio se muestran en `ProximoTurnoCard` y `Turnos.tsx`. Por
eso el alcance se concentra en esos dos puntos.

El backend ya hace su parte para reservar (`PUT /turnos/socio/ficha-salud` y
`ReservarTurnoSocioUseCase` validan que la ficha esté completa). Falta el lado
frontend para que el socio entienda que primero debe completar la ficha.

## Objetivo

Mostrar un **modal bloqueante** cuando un socio sin ficha intenta acceder a
cualquier vista que liste turnos del socio. El modal redirige al socio a
`/turnos/ficha-salud`.

## Alcance

### Dentro de alcance

- Componente nuevo `ModalFichaRequeridaSocio`.
- Hook compartido `useEstadoFichaRequerida`.
- Aplicación del modal en:
  1. `apps/frontend/src/components/dashboard/ProximoTurnoCard.tsx`
  2. `apps/frontend/src/pages/Turnos.tsx`
- Tests unitarios del componente con vitest + MSW.

### Fuera de alcance

- **Backend**: no se toca. El endpoint `GET /turnos/socio/ficha-salud` ya
  devuelve `null` cuando no hay ficha, y `ReservarTurnoSocioUseCase` ya
  valida la ficha completa.
- **`AgendarTurno.tsx`**: sigue con su banner ámbar actual, no se reemplaza
  por un modal.
- **Ruta `/turnos/ficha-salud`**: sin cambios.
- **Otros roles** (NUTRICIONISTA, RECEPCIONISTA, ADMIN): sin cambios. La
  página Mis Turnos ya está restringida a SOCIO; el resto de vistas no aplica
  este modal.

## Diseño

### Componente `ModalFichaRequeridaSocio`

- Ruta: `apps/frontend/src/components/ficha-salud/ModalFichaRequeridaSocio.tsx`.
- Tipo: modal bloqueante sin X, sin Esc, sin click fuera (overlay no cierra).
- Props:
  - `abierto: boolean` — controlado por el padre.
  - `cargando?: boolean` — opcional, mientras se hace el GET inicial.
- Contenido:
  - Título: "Necesitamos tu ficha de salud".
  - Body: "No tenés la ficha de salud cargada. Es obligatoria para poder ver
    y gestionar tus turnos."
  - CTA único: "Ir a cargar mi ficha" → `Link` a `/turnos/ficha-salud`.

### Hook `useEstadoFichaRequerida`

- Ruta: `apps/frontend/src/hooks/useEstadoFichaRequerida.ts`.
- Encapsula `useQuery` con `queryKey: ['ficha-salud', 'estado']`.
- Llama a `apiRequest<{ data: FichaSaludSocio | null }>(
  '/turnos/socio/ficha-salud', { token })`.
- Devuelve:
  - `cargando: boolean` — mientras `isLoading` es true.
  - `fichaCargada: boolean | null` — `true` si hay ficha, `false` si
    `data === null`, `null` mientras carga o si hay error.
  - `error: Error | null`.
- El padre decide qué hacer según `fichaCargada`.

### Puntos de uso

| Archivo | Cambio |
| --- | --- |
| `apps/frontend/src/components/dashboard/ProximoTurnoCard.tsx` | Reemplaza el `apiRequest` directo a `/turnos/socio/mis-turnos` por un flujo que primero verifica ficha con `useEstadoFichaRequerida`. Si `fichaCargada === false` muestra `<ModalFichaRequeridaSocio abierto />`. Si `true`, llama al endpoint de turnos. |
| `apps/frontend/src/pages/Turnos.tsx` | Mismo patrón: verifica ficha antes de listar turnos. |
| `apps/frontend/src/pages/AgendarTurno.tsx` | **Sin cambios**. Sigue con banner ámbar. |

### Comportamiento del modal

1. El socio navega a una vista que lista sus turnos (Dashboard o `/turnos`)
   sin ficha cargada.
2. El componente renderiza spinner mientras `cargando === true`.
3. Cuando el GET termina con `data === null`, el modal se abre
   (`abierto={true}`).
4. El modal no se puede cerrar: sin X, sin Esc, sin click en overlay.
5. El socio clickea el CTA "Ir a cargar mi ficha".
6. Se navega a `/turnos/ficha-salud`.
7. Al volver, el `useQuery` re-fetchea por `staleTime` expirado o por el
   `queryKey` invalidado al hacer `PUT /turnos/socio/ficha-salud` exitoso
   (la página de ficha ya invalida `['ficha-salud', 'historial']`; se agrega
   invalidación de `['ficha-salud', 'estado']` también).
8. Si la ficha ahora está completa, el modal no se muestra y la vista lista
   los turnos con normalidad.

### Detalle de invalidación de query

En `FichaSaludSocio.tsx`, al hacer `PUT` exitoso, además de invalidar
`['ficha-salud', 'historial']`, invalidar también `['ficha-salud', 'estado']`
para que el modal en Mis Turnos desaparezca al volver.

## Testing

### Unit (vitest + MSW)

Archivo: `apps/frontend/src/components/ficha-salud/ModalFichaRequeridaSocio.test.tsx`.

- Test 1: renderiza con `abierto={true}` y muestra título, body y CTA.
- Test 2: el CTA es un `Link` a `/turnos/ficha-salud`.
- Test 3: con `abierto={false}` no renderiza el modal.
- Test 4 (opcional): intentar cerrar con Esc no cambia el DOM.

### Manual

1. Login como socio sin ficha.
2. Entrar al dashboard (que muestra `ProximoTurnoCard`).
3. Verificar que aparece el modal bloqueante.
4. Click en "Ir a cargar mi ficha".
5. Llenar y guardar la ficha.
6. Volver al dashboard.
7. Verificar que el modal ya no aparece y la card muestra el próximo turno
   (si tiene).
8. Repetir para `/turnos` (página general).

### E2E (opcional, no obligatorio para esta iteración)

`e2e/ficha-salud/mis-turnos-bloqueo.spec.ts`:
- socio sin ficha entra a Mis Turnos → modal → CTA → ficha → volver.
- socio con ficha entra a Mis Turnos → ve sus turnos directamente.

## Archivos afectados

### Nuevos

- `apps/frontend/src/components/ficha-salud/ModalFichaRequeridaSocio.tsx`
- `apps/frontend/src/components/ficha-salud/ModalFichaRequeridaSocio.test.tsx`
- `apps/frontend/src/hooks/useEstadoFichaRequerida.ts`

### Modificados

- `apps/frontend/src/components/dashboard/ProximoTurnoCard.tsx`
- `apps/frontend/src/pages/Turnos.tsx`
- `apps/frontend/src/pages/FichaSaludSocio.tsx` (agregar invalidación
  de `['ficha-salud', 'estado']` al hacer PUT exitoso)

### Sin cambios

- `apps/frontend/src/pages/AgendarTurno.tsx` — banner ámbar existente.
- Backend completo.
- Otras rutas, validaciones y reglas de RB.

## Riesgos

- Si el endpoint `/turnos/socio/ficha-salud` cambia su contrato (ej. deja de
  devolver `null` para socio sin ficha), el hook se rompe. Mitigación:
  tests unitarios del hook.
- Si el socio manipula la URL y entra a Mis Turnos con `fichaCargada === null`
  (estado intermedio), podría ver la lista vacía. Mitigación: durante
  `cargando === true` no se renderiza la lista ni el modal — solo un spinner.
  Cuando termina, o se muestra el modal o la lista.

## Criterio de aceptación

- Socio sin ficha no puede ver la lista de turnos en el Dashboard ni en
  `/turnos`; siempre ve el modal bloqueante con CTA a la ficha.
- Socio con ficha ve sus turnos sin modal.
- Tras completar la ficha y volver al Dashboard o a `/turnos`, el modal
  desaparece sin recargar la página manualmente.
- Tests unitarios pasan.
- `npm run typecheck` y `npm run lint` pasan.
