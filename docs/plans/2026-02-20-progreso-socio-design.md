# Diseño: Módulo de Progreso y Evolución del Socio

**Fecha:** 2026-02-20  
**Estado:** Validado  
**Autor:** Diseño colaborativo con brainstorming

---

## 1. Resumen Ejecutivo

Implementación de un módulo completo de seguimiento de progreso para que socios y nutricionistas visualicen la evolución del paciente sesión a sesión mediante gráficos detallados, indicadores de tendencia y tablas de historial.

### Actores
- **Socio**: Ve su propio progreso en `/mi-progreso`
- **Nutricionista**: Ve progreso de pacientes durante consultas y desde lista de pacientes

---

## 2. Arquitectura Backend

### 2.1 Extensión de la entidad `Medicion`

**Ubicación:** `src/domain/entities/Medicion/medicion.entity.ts`

```typescript
export class Medicion {
  idMedicion: number;
  
  // Obligatorios (existen actualmente)
  peso: number;                    // kg
  altura: number;                  // cm
  imc: number;                     // calculado automáticamente
  
  // Perímetros (opcionales - algunos existen, otros nuevos)
  perimetroCintura: number | null; // cm (existe)
  perimetroCadera: number | null;  // cm (existe)
  perimetroBrazo: number | null;   // cm - NUEVO
  perimetroMuslo: number | null;   // cm - NUEVO
  perimetroPecho: number | null;   // cm - NUEVO
  
  // Pliegues cutáneos (opcionales) - NUEVOS
  pliegueTriceps: number | null;      // mm
  pliegueAbdominal: number | null;    // mm
  pliegueMuslo: number | null;        // mm
  
  // Composición corporal (opcionales) - NUEVOS
  porcentajeGrasa: number | null;     // %
  masaMagra: number | null;           // kg (calculado si hay % grasa)
  
  // Signos vitales (opcionales) - NUEVOS
  frecuenciaCardiaca: number | null;  // lpm
  tensionSistolica: number | null;    // mmHg
  tensionDiastolica: number | null;   // mmHg
  
  // Notas - NUEVO
  notasMedicion: string | null;
  
  // Relación (existente)
  idTurno: number;
  turno: Turno;
  createdAt: Date;
}
```

### 2.2 Nuevos Endpoints

#### GET `/turnos/historial-mediciones/:socioId`

Retorna historial completo de mediciones del socio.

```typescript
// Response
{
  success: true,
  data: {
    socioId: number,
    nombreSocio: string,
    objetivoPeso: number | null,
    altura: number,
    mediciones: [
      {
        idMedicion: number,
        fecha: Date,
        peso: number,
        imc: number,
        perimetroCintura: number | null,
        perimetroCadera: number | null,
        perimetroBrazo: number | null,
        perimetroMuslo: number | null,
        perimetroPecho: number | null,
        pliegueTriceps: number | null,
        pliegueAbdominal: number | null,
        pliegueMuslo: number | null,
        porcentajeGrasa: number | null,
        masaMagra: number | null,
        frecuenciaCardiaca: number | null,
        tensionSistolica: number | null,
        tensionDiastolica: number | null,
        notasMedicion: string | null,
        profesional: {
          id: number,
          nombre: string,
          apellido: string
        }
      }
    ]
  }
}
```

#### GET `/turnos/progreso/:socioId/resumen`

Retorna cálculos de progreso para las tarjetas de resumen.

```typescript
// Response
{
  success: true,
  data: {
    peso: {
      inicial: number,
      actual: number,
      diferencia: number,
      objetivo: number | null,
      porcentajeObjetivo: number | null,
      tendencia: 'subiendo' | 'bajando' | 'estable'
    },
    imc: {
      inicial: number,
      actual: number,
      diferencia: number,
      categoriaActual: 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad'
    },
    perimetros: {
      cintura: { inicial, actual, diferencia, tendencia },
      cadera: { inicial, actual, diferencia, tendencia },
      brazo: { inicial, actual, diferencia, tendencia } | null,
      muslo: { inicial, actual, diferencia, tendencia } | null
    },
    relacionCinturaCadera: {
      inicial: number | null,
      actual: number | null,
      riesgoCardiovascular: 'bajo' | 'moderado' | 'alto'
    },
    rangoSaludable: {
      pesoMinimo: number,
      pesoMaximo: number
    }
  }
}
```

#### POST `/turnos/:id/mediciones` (actualizado)

```typescript
// Body
{
  peso: number,                      // obligatorio
  altura?: number,                   // opcional (solo si cambió)
  perimetroCintura?: number,
  perimetroCadera?: number,
  perimetroBrazo?: number,           // NUEVO
  perimetroMuslo?: number,           // NUEVO
  perimetroPecho?: number,           // NUEVO
  pliegueTriceps?: number,           // NUEVO
  pliegueAbdominal?: number,         // NUEVO
  pliegueMuslo?: number,             // NUEVO
  porcentajeGrasa?: number,          // NUEVO
  frecuenciaCardiaca?: number,       // NUEVO
  tensionSistolica?: number,         // NUEVO
  tensionDiastolica?: number,        // NUEVO
  notasMedicion?: string             // NUEVO
}
```

### 2.3 Archivos Backend a crear/modificar

| Archivo | Acción |
|---------|--------|
| `src/domain/entities/Medicion/medicion.entity.ts` | Crear dominio |
| `src/infrastructure/persistence/typeorm/entities/medicion.entity.ts` | Extender |
| `src/application/turnos/use-cases/guardar-mediciones.use-case.ts` | Modificar |
| `src/application/turnos/dtos/guardar-mediciones.dto.ts` | Extender |
| `src/application/turnos/use-cases/get-historial-mediciones.use-case.ts` | **Crear** |
| `src/application/turnos/use-cases/get-resumen-progreso.use-case.ts` | **Crear** |
| `src/presentation/http/controllers/turnos.controller.ts` | Agregar endpoints |
| `src/infrastructure/persistence/typeorm/migrations/XXX-ExtendMedicion.ts` | **Crear** |

---

## 3. Arquitectura Frontend

### 3.1 Dependencia nueva

```bash
npm install recharts
```

### 3.2 Estructura de archivos

```
/src/pages/
├── ProgresoSocioPage.tsx          → Vista del SOCIO (/mi-progreso)
└── ProgresoPacientePage.tsx       → Vista del PROFESIONAL (/profesional/paciente/:socioId/progreso)

/src/components/progreso/
├── types.ts                       → Tipos compartidos
├── useProgresoData.ts             → Hook con TanStack Query
├── GraficoEvolucionPeso.tsx       → Línea temporal peso + objetivo
├── GraficoEvolucionIMC.tsx        → Línea temporal IMC + rangos
├── GraficoPerimetros.tsx          → Comparativa perímetros
├── GraficoComposicionCorporal.tsx → % grasa + masa magra
├── GraficoSignosVitales.tsx       → FC + tensión arterial
├── TarjetasResumenProgreso.tsx    → Cards con diferencias
├── TablaHistorialMediciones.tsx   → Tabla completa
├── IndicadorTendencia.tsx         → Flecha arriba/abajo/estable
└── RangoSaludableBadge.tsx        → Badge indicando rango
```

### 3.3 Rutas nuevas

```typescript
// En router.tsx

// Para el SOCIO
const miProgresoRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/mi-progreso',
  component: ProgresoSocioPage,
});

// Para el PROFESIONAL
const progresoPacienteRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/profesional/paciente/$socioId/progreso',
  component: ProgresoPacientePage,
});
```

### 3.4 Optimizaciones de rendimiento

Según las reglas de Vercel React Best Practices:

| Regla | Aplicación |
|-------|------------|
| `bundle-dynamic-imports` | Gráficos con `React.lazy()` - recharts es ~200KB |
| `client-swr-dedup` | TanStack Query para deduplicar requests |
| `rerender-memo` | Gráficos memoizados con `React.memo()` |
| `bundle-barrel-imports` | Importar directo de recharts, NO desde barrel |

**Ejemplo de lazy loading:**

```tsx
const GraficoEvolucionPeso = React.lazy(() => 
  import('@/components/progreso/GraficoEvolucionPeso')
    .then(m => ({ default: m.GraficoEvolucionPeso }))
);

// En render:
<Suspense fallback={<Skeleton className="h-64" />}>
  <GraficoEvolucionPeso datos={datosPeso} />
</Suspense>
```

**Ejemplo de import desde recharts:**

```tsx
// ❌ Incorrecto - carga todo recharts
import { LineChart, XAxis, YAxis } from 'recharts';

// ✅ Correcto - importa solo lo necesario
import LineChart from 'recharts/es6/charts/LineChart';
import XAxis from 'recharts/es6/components/XAxis';
import YAxis from 'recharts/es6/components/YAxis';
```

### 3.5 Archivos Frontend a crear/modificar

| Archivo | Acción |
|---------|--------|
| `package.json` | Agregar recharts |
| `src/router.tsx` | Agregar 2 rutas |
| `src/pages/ProgresoSocioPage.tsx` | **Crear** |
| `src/pages/ProgresoPacientePage.tsx` | **Crear** |
| `src/pages/ConsultaProfesionalPage.tsx` | Modificar (sección mediciones) |
| `src/components/progreso/types.ts` | **Crear** |
| `src/components/progreso/useProgresoData.ts` | **Crear** |
| `src/components/progreso/GraficoEvolucionPeso.tsx` | **Crear** |
| `src/components/progreso/GraficoEvolucionIMC.tsx` | **Crear** |
| `src/components/progreso/GraficoPerimetros.tsx` | **Crear** |
| `src/components/progreso/GraficoComposicionCorporal.tsx` | **Crear** |
| `src/components/progreso/GraficoSignosVitales.tsx` | **Crear** |
| `src/components/progreso/TarjetasResumenProgreso.tsx` | **Crear** |
| `src/components/progreso/TablaHistorialMediciones.tsx` | **Crear** |
| `src/components/progreso/IndicadorTendencia.tsx` | **Crear** |
| `src/components/progreso/RangoSaludableBadge.tsx` | **Crear** |

---

## 4. Diseño del Dashboard

### 4.1 Secciones principales

1. **Tarjetas de Resumen** (arriba)
   - Peso: diferencia, tendencia, % hacia objetivo
   - IMC: valor actual, categoría
   - Cintura: diferencia, tendencia
   - Objetivo: % completado

2. **Gráfico Principal de Evolución** (centro)
   - Eje X: Fechas de consultas
   - Eje Y izquierdo: Peso (kg)
   - Eje Y derecho: IMC
   - Línea de objetivo
   - Zona sombreada de rango saludable
   - Tooltip interactivo
   - Zoom/Pan

3. **Gráficos de Perímetros** (grid 2x2)
   - Cintura
   - Cadera
   - Relación cintura/cadera con riesgo cardiovascular
   - Comparativa de todos los perímetros

4. **Tabla de Historial Completo**
   - Todas las mediciones ordenadas por fecha
   - Ordenable por columna
   - Filtrable por rango de fechas
   - Exportable a CSV/PDF

### 4.2 Indicadores

| Indicador | Cálculo |
|-----------|---------|
| Tendencia | Comparar últimas 3 mediciones con regresión lineal simple |
| Categoría IMC | <18.5 bajo peso, 18.5-24.9 normal, 25-29.9 sobrepeso, ≥30 obesidad |
| Riesgo cardiovascular | Índice cintura/cadera: <0.85 bajo, 0.85-0.9 moderado, >0.9 alto (mujeres) |
| Rango saludable | IMC 18.5-24.9 → calcular peso min/max según altura |

---

## 5. Integración en la Consulta

### 5.1 Modificación de ConsultaProfesionalPage

Secciones colapsables para ingreso de mediciones:

1. **Datos básicos** (siempre visible)
   - Peso (obligatorio)
   - Altura (pre-cargada)
   - IMC (calculado)

2. **Perímetros** (colapsable)
   - Cintura, Cadera, Brazo, Muslo, Pecho

3. **Pliegues cutáneos** (colapsable)
   - Tríceps, Abdominal, Muslo

4. **Composición corporal** (colapsable)
   - % Grasa corporal
   - Masa magra (auto-calculada)

5. **Signos vitales** (colapsable)
   - Frecuencia cardíaca
   - Tensión arterial (sistólica/diastólica)

6. **Notas de medición** (textarea)

### 5.2 Accesos al progreso

- Botón "Ver progreso del paciente" en consulta activa
- Ícono de gráfico en lista de pacientes
- Desde historial de consultas

---

## 6. Vista del Socio

El socio ve el mismo dashboard pero:
- Sin capacidad de editar datos
- Con mensaje motivacional según tendencia
- Opción de exportar su progreso en PDF

---

## 7. Consideraciones de Seguridad

- Nutricionista solo ve progreso de SUS pacientes asignados
- Socio solo ve SU propio progreso
- Validar permisos en cada endpoint

---

## 8. Estimación de Esfuerzo

| Componente | Archivos | Complejidad |
|------------|----------|-------------|
| Backend | 8 | Media-Alta |
| Frontend | 16 | Alta |
| Testing | ~10 | Media |
| **Total** | ~34 archivos | ~3-4 días |

---

## 9. Próximos Pasos

1. Crear migración para extender tabla `medicion`
2. Implementar use-cases de backend
3. Instalar recharts y crear componentes base
4. Implementar páginas de progreso
5. Modificar ConsultaProfesionalPage
6. Testing E2E
