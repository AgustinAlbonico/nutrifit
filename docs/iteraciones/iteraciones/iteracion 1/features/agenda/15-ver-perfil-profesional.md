# 15 — Ver perfil profesional del nutricionista

> **Source of truth**: `01-iteracion-base-nutricional.md` (integración de CU-10)
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `10-ver-nutricionistas-disponibles.md`, `11-reservar-turno.md`, `archivos.md`

## Descripción
Pantalla de detalle de un nutricionista vista por un socio. Muestra el perfil profesional completo (decisión de Q&A: mostrar todo para generar confianza: foto, formación, certificaciones, tarifa, presentación, años de experiencia). Incluye el calendario de slots disponibles y el botón "Reservar turno".

Este feature se separó de `10-ver-nutricionistas-disponibles.md` para tener un spec dedicado al detalle del perfil.

## Actores
- SOCIO

## Precondiciones
- Socio autenticado.
- Pertenece a un gimnasio.
- El nutricionista está activo en el gimnasio del socio.

## Postcondiciones
- Vista de detalle del nutricionista mostrada.
- (Sin cambios en datos, es solo lectura.)

## Camino principal
1. Socio accede desde el listado de nutricionistas (`10-ver-nutricionistas-disponibles.md`).
2. Sistema muestra el detalle completo del nutricionista:
   - **Header**: foto grande (200×200), nombre completo, matrícula profesional.
   - **Datos básicos**: género, años de experiencia.
   - **Presentación**: texto libre.
   - **Formación**: lista de formaciones (texto).
   - **Certificaciones**: lista de certificaciones (texto).
   - **Tarifa por sesión**: monto (si está configurado).
   - **Duración de turno**: minutos (visible porque afecta los slots).
3. **Calendario de slots disponibles** para los próximos 60 días.
4. Botón prominente "Reservar turno".
5. Click en "Reservar turno" → abre modal de selección de slot → `11-reservar-turno.md`.

## Datos visibles

**Decisión de Q&A**: el socio ve **toda** la información profesional del nutricionista.

| Campo | Visible al socio | Notas |
|---|---|---|
| Foto | ✅ | Si no tiene, placeholder |
| Nombre, apellido | ✅ | — |
| Matrícula | ✅ | — |
| Presentación | ✅ | — |
| Formación | ✅ | — |
| Certificaciones | ✅ | — |
| Tarifa sesión | ✅ | — |
| Años experiencia | ✅ | — |
| Género | ✅ | Si lo completó |
| Duración de turno | ✅ | Necesario para entender los slots |
| Email | ❌ | Privado |
| Teléfono personal | ❌ | No hay en el modelo |
| Datos administrativos | ❌ | Privado |
| Disponibilidad cruda (rangos) | ❌ | Solo slots calculados |

## Caminos alternativos
- **A1**: Nutricionista inactivo → 404 "El nutricionista ya no está disponible".
- **A2**: Socio sin ficha completa → puede ver el detalle, pero el botón "Reservar" redirige a completar ficha (RB14).
- **A3**: Nutricionista sin slots próximos → calendario muestra "Sin horarios disponibles" + mensaje de sugerencia.

## Casos borde
- **B1**: Nutricionista sin foto → placeholder genérico.
- **B2**: Nutricionista sin formación/certificaciones → secciones se muestran vacías con texto "No especificado".
- **B3**: Tarifa 0 (gratis) → no se muestra la tarifa (interpretación: 0 = no configurado).
- **B4**: Cambio de datos del nutricionista mientras el socio navega → al refrescar ve la nueva versión.
- **B5**: Nutricionista desactivado durante la navegación → la próxima request falla con 404.

## Reglas de negocio aplicadas
- **RB07**: Slots hasta 60 días.
- **RB14**: Ficha completa para reservar.
- **RB17**: Nutricionista activo.
- **RB25**: Multi-tenant.

## Endpoints API

### `GET /api/nutricionistas/:id/perfil-publico`
- **Auth**: SOCIO autenticado
- **Response 200**:
  ```json
  {
    "id": "uuid",
    "nombre": "Juan",
    "apellido": "Pérez",
    "matricula": "MN-12345",
    "fotoUrl": "https://...",
    "presentacion": "...",
    "formacion": "Lic. en Nutrición (UBA). Maestría en Nutrición Deportiva.",
    "certificaciones": "ISAK Nivel 2, Cert. en Nutrición Vegetariana",
    "tarifaSesion": 5000,
    "aniosExperiencia": 10,
    "genero": "M",
    "duracionTurnoMin": 30
  }
  ```
- **Errors**: 404, 500

### `GET /api/nutricionistas/:id/slots` (ya documentado en `10-ver-nutricionistas-disponibles.md`)
- Reusado para el calendario del detalle.

## Modelo de datos

### Entidades consultadas
- `Nutricionista`
- `NutricionistaGimnasio` (validación multi-tenant)
- `Archivo` (foto de perfil, si existe)
- `DisponibilidadSemanal`
- `ExcepcionDisponibilidad`
- `Turno` (para excluir slots ocupados)

## UI / UX

### Layout
- **Header**:
  - Foto (200×200, circular).
  - Nombre completo (h1).
  - Matrícula profesional (badge).
  - Botón "Reservar turno" (sticky, top right).
- **Datos básicos** (sección 1):
  - Grid 2 columnas: Género, Años de experiencia.
- **Presentación** (sección 2):
  - Texto libre.
- **Formación y certificaciones** (sección 3):
  - Tarjetas o lista.
- **Tarifa** (sección 4):
  - Si está configurada: "$X por sesión".
  - Si no: "A convenir".
- **Disponibilidad** (sección 5):
  - Calendario con slots disponibles (ver `10`).
  - Navegación por semanas/meses.
  - Click en slot → modal de confirmación → reserva.

### Mobile
- Layout vertical, todas las secciones en acordeón colapsable.
- Botón "Reservar turno" sticky abajo.

## Edge cases

- **B6**: Tarifa negativa → no se muestra (interpretación: mal configurada).
- **B7**: Tarifa con decimales → se muestra redondeada a 2 decimales.
- **B8**: Nutricionista con `wizard_completado=false` → no aparece en el catálogo, no se puede acceder al detalle.
- **B9**: Foto no procesada aún (upload en staging) → placeholder.

## Tests

### Unitarios
- `obtener-perfil-publico-nutricionista.use-case.ts`:
  - Retorna datos profesionales
  - Solo del gimnasio del socio
  - Nutricionista activo
  - Foto o null
  - Tarifa: 0 = null, > 0 = visible
- `obtener-slots-nutricionista.use-case.ts` (ya en `10`):
  - Slots calculados correctamente
  - Excluye slots ocupados, excepciones
  - Filtra por ≥2h, ≤60 días

### Integración
- Flujo end-to-end: socio ve detalle → click slot → reserva turno → turno creado.

## Notas
- Este feature es la **vista de detalle** del catálogo. La información es pública para socios del mismo gimnasio.
- El calendario de slots es el mismo componente que en `10-ver-nutricionistas-disponibles.md`, pero con foco en UN nutricionista.
- Decisión de UX: el botón "Reservar turno" es prominente. La información profesional (formación, certificaciones, tarifa) refuerza la confianza.
- Ver `10-ver-nutricionistas-disponibles.md` para la lista de nutricionistas; este spec es solo el detalle.
