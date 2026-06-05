# 23 — Ver progreso del socio

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-23
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `19-registrar-mediciones.md`, `archivos.md`, `notificaciones.md`

## Descripción
Permite al socio y al nutricionista (con permiso RB13) ver el progreso nutricional. Visualizaciones: gráficos de evolución de variables, comparativa de fotos antes/después, tabla detallada. Outliers marcados (no filtrados). Exportación PDF. El socio solo ve mediciones con `publicada_at IS NOT NULL` (RB48).

## Actores
- SOCIO (el propio)
- NUTRICIONISTA (socios vinculados, RB13)

## Precondiciones
- Autenticado.
- Para socio: existen mediciones publicadas (`publicada_at IS NOT NULL`).
- Para nutricionista: tuvo al menos un turno previo con el socio.

## Postcondiciones
- Vista de progreso mostrada.
- (Sin cambios en datos, es solo lectura + export PDF.)

## Camino principal
1. Actor accede a "Progreso".
2. Selecciona período: último mes, 3 meses, 6 meses, año, todo.
3. Sistema muestra:
   - **Gráficos de evolución** (selector de variable): peso, IMC, perímetros principales, % grasa, % músculo. Cada punto con tooltip de fecha.
   - **Comparativa de fotos**: slider o grid con primera vs última foto del período.
   - **Tabla detallada**: fecha, peso, altura, IMC, perímetros, composición, link a fotos.
4. Outliers marcados con punto/color distinto y leyenda "valor atípico, posible error de carga".
5. Botón "Exportar PDF" → genera reporte con todos los datos visibles.
6. (Opcional) Filtros por tipo de medición.

## Outliers

**Definición**: valor que se aleja >3 desvíos estándar de la media de la misma variable en el período seleccionado.

**Comportamiento**:
- Marca visual: punto de color distinto + tooltip explicativo.
- **NO se filtran automáticamente** (decisión de Q&A).
- El usuario puede filtrar visualmente con un toggle "Mostrar outliers".
- Si hay outliers, banner explicativo: "Algunos valores se alejan de la media. ¿Querés verlos?".

## Caminos alternativos
- **A1**: Sin mediciones publicadas (socio) o sin mediciones (nutricionista) → "Aún no hay mediciones registradas. Registrá tu primera medición para ver tu progreso".
- **A2**: Período sin datos → "No hay datos en este período. Probá otro rango.".
- **A3**: Sin permiso (nutricionista sin turno previo) → 403.
- **A4**: Sin fotos en el período → "Aún no hay fotos de progreso en este período".

## Casos borde
- **B1**: Valores extremos distorsionan gráfico → marcados, no filtrados.
- **B2**: Mediciones duplicadas del mismo día → warning, no se ocultan. Aparecen ambas en la tabla.
- **B3**: Datos corregidos después de mostrarse en reportes → el reporte refleja la última versión. Si exporta PDF antes y después de una corrección, son distintos.
- **B4**: Sin fotos (mediciones sin fotos de progreso) → la sección de comparativa muestra "Aún no hay fotos".
- **B5**: PDF de un socio con MUCHAS mediciones (50+) → puede ser un PDF largo, dividido en secciones.
- **B6**: Comparativa con 1 sola foto → mensaje "Necesitás al menos 2 fotos en el período para comparar".
- **B7**: Comparativa con muchas fotos (>10) → selector de cuáles fotos comparar (no solo primera vs última).

## Reglas de negocio aplicadas
- **RB13**: Permiso nutricionista.
- **RB48**: Filtro de publicadas para socio.

## Endpoints API

### `GET /api/socios/me/progreso`
- **Auth**: SOCIO
- **Query**:
  - `?periodo=mes|3m|6m|anio|todo` (default: 6m)
  - `?variables=peso,imc,cintura,cadera,...` (default: peso, imc)
  - `?mostrarOutliers=true|false` (default: true)
- **Response 200**:
  ```json
  {
    "periodo": { "desde": "2025-12-02", "hasta": "2026-06-02" },
    "mediciones": [
      {
        "id": "uuid",
        "fecha": "2026-01-15",
        "peso": 75.5,
        "alturaAlMomento": 1.70,
        "imc": 26.1,
        "cintura": 85,
        "cadera": 100,
        "pecho": 100,
        "brazo": 30,
        "muslo": 55,
        "grasaCorporal": 22.5,
        "masaMuscular": 35.2,
        "grasaVisceral": 8,
        "fotos": [
          { "id": "uuid", "tipo": "frente", "url": "..." }
        ],
        "esOutlier": false
      }
    ],
    "outliers": { "peso": [2], "cintura": [3] },
    "fotosCount": 8
  }
  ```
- **Errors**: 401, 500

### `GET /api/socios/:id/progreso`
- **Auth**: NUTRICIONISTA (con RB13)
- **Response 200**: igual estructura

### `GET /api/socios/me/progreso/export-pdf`
- **Auth**: SOCIO, NUTRICIONISTA
- **Query**: `?periodo=...&variables=...`
- **Response**: PDF binario (`Content-Type: application/pdf`)
- **Errors**: 500

## Modelo de datos

### Entidades consultadas
- `Medicion` (filtrada por `publicada_at IS NOT NULL` para socio).
- `FotoProgreso` (joineada con medición).
- `Socio` (datos del header del PDF).

## UI / UX

### Pantalla: Progreso
- Header: nombre del socio, período actual.
- Selector de período (mes, 3m, 6m, año, todo).
- **Sección 1: Gráficos de evolución**.
  - Selector de variable (peso, IMC, cintura, cadera, % grasa, etc.).
  - Eje X: fecha. Eje Y: valor de la variable.
  - Outliers marcados con color distinto.
  - Toggle "Mostrar outliers" (default: ON).
- **Sección 2: Comparativa de fotos**.
  - Si hay <2 fotos: mensaje.
  - Si hay 2-10 fotos: slider o grid con selector.
  - Si hay >10 fotos: selector de cuáles fotos comparar.
- **Sección 3: Tabla detallada**.
  - Paginada (50 items).
  - Filtros por variable, fecha, valor.
  - Link a fotos individuales.
- Botón flotante: "Exportar PDF".

### PDF generado
- Header: logo del gimnasio, datos del socio, período, fecha de generación.
- Sección 1: Resumen ejecutivo (KPIs: peso actual, IMC, % grasa, cambio desde primera medición).
- Sección 2: Gráficos (como imágenes PNG).
- Sección 3: Tabla de mediciones.
- Sección 4: Fotos (miniaturas o grid).
- Footer: "Generado por NutriFit — [fecha/hora]".

## Cálculo de outliers

```typescript
function detectarOutliers(valores: number[]): number[] {
  if (valores.length < 3) return [];  // muy pocos datos para calcular
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const varianza = valores.reduce((a, b) => a + Math.pow(b - media, 2), 0) / valores.length;
  const desv = Math.sqrt(varianza);
  const umbral = 3 * desv;
  return valores
    .map((v, i) => Math.abs(v - media) > umbral ? i : -1)
    .filter(i => i !== -1);
}
```

## Tests

### Unitarios
- `obtener-progreso-socio.use-case.ts`:
  - Filtra publicadas para socio
  - Calcula outliers correctamente
  - Retorna vacío si no hay mediciones
  - Soporta diferentes períodos
- `exportar-progreso-pdf.use-case.ts`:
  - Genera PDF
  - Con y sin fotos
  - Período específico
  - Variables específicas
- `detectar-outliers`:
  - Con suficientes datos
  - Con pocos datos (no aplica)
  - Sin variación (todos iguales, no outliers)

## Edge cases (resumidos)

| Caso | Comportamiento |
|---|---|
| Sin mediciones | Mensaje "Aún no hay mediciones" |
| Período sin datos | Mensaje "No hay datos en este período" |
| 1 foto en el período | Mensaje "Necesitás ≥2 fotos" |
| Outliers | Marcados, no filtrados |
| Mediciones duplicadas mismo día | Ambas en tabla, warning |
| Corrección de medición | Reporte refleja última versión |
| PDF largo | Dividido en secciones |
| Sin permiso | 403 |

## Notas
- El PDF se genera con `puppeteer` o `pdfkit` (decisión técnica).
- La comparativa de fotos: si hay N>2 fotos, se puede elegir cuáles comparar.
- La exportación PDF es **única opción de portabilidad** del socio (sin JSON, riesgo compliance aceptado).
- El toggle "Mostrar outliers" es UX, no es regla de negocio. El backend siempre los marca, el frontend decide si los muestra.
- Las mediciones sin `publicada_at` no se muestran al socio (RB48). Esto es importante: una medición reciente recién tomada NO aparece hasta que el nutricionista cierre la consulta.
