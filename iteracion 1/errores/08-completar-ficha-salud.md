# 08 — Completar ficha de salud: Errores detectados

> **Fuente**: Spec inline provisto por el usuario (CU-08 + CU-09)
> **Fecha**: 12/06/2026
> **Herramienta**: Playwright MCP
> **Evidencia**: screenshots en `iteracion 1/errores/screenshots/08-*.png`

---

## 🔴 Errores funcionales


### 3. Console error: 404 en dashboard al cargar plan activo

- **Spec**: No menciona este error (es del dashboard, no de ficha-salud directamente).
- **Realidad**: Al cargar el dashboard del socio, se dispara `GET /planes-alimentacion/socio/8/activo` que responde 404. Esto ocurre con `socio1-central`.
- **Impacto**: Error silencioso en consola. No bloquea la UI pero indica que el endpoint de plan activo no está implementado o la ruta no coincide con la expectativa del frontend.

---

## 🟡 Problemas de UI/UX

### 1. Accesibilidad: Dialog sin título ARIA ni descripción

- **Spec**: No especifica requisitos de accesibilidad explícitos.
- **Realidad**: Los modales "Ver historial" y "Ver detalle" (consentimiento) disparan errores de consola:
  - `DialogContent requires a DialogTitle for the component to be accessible for screen reader users`
  - `Missing Description or aria-describedby={undefined} for {DialogContent}`
- **Impacto**: Incumplimiento de WCAG 2.2 (4.1.2 Name, Role, Value). Usuarios de screen reader no pueden identificar correctamente el contenido del diálogo.

### 2. UI no coincide exactamente con el spec de secciones

- **Spec**: 6 secciones con indicador de progreso: 1) Datos antropométricos, 2) Hábitos, 3) Salud, 4) Alimentación, 5) Antecedentes y objetivos, 6) Consentimiento.
- **Realidad**: El formulario tiene secciones diferentes: "Consentimiento", "Datos físicos básicos", "Alergias y patologías", "Medicación y suplementos", "Historial médico", "Hábitos alimentarios", "Hábitos de vida", "Contacto de emergencia". Son 8 secciones (no 6), sin indicador de progreso visible.
- **Impacto**: Diferencia de diseño respecto al spec. No hay indicador de progreso como describe el spec. Las secciones están organizadas de forma distinta.

### 3. API response body duplicada (GET ficha-salud)

- **Spec**: No menciona duplicación.
- **Realidad**: La API `GET /turnos/socio/ficha-salud` se llama 2 veces al cargar la página (misma URL, mismo resultado). Esto duplica tráfico innecesariamente.
- **Impacto**: Leve impacto en rendimiento. Posible bug de React Query o efecto de montaje doble en desarrollo (StrictMode).

---

## ✅ Funcionalidades que SÍ funcionan

- **Formulario completo visible**: Socio puede ver y editar todos los campos (altura, peso, actividad, objetivo, alergias, patologías, medicación, etc.)
- **Validación client-side de altura**: "La altura debe estar entre 1.00 y 2.50 m"
- **Validación client-side de peso**: "El peso debe estar entre 20 y 300 kg"
- **Validación client-side de objetivo**: "Indicá tu objetivo personal"
- **Botón deshabilitado con mensaje**: Cuando hay errores, el botón muestra "No se puede guardar todavía" y está disabled
- **Happy path de edición (CU-09)**: Al enviar datos válidos, muestra "Ficha actualizada correctamente." y banner "Última edición: [fecha]"
- **Consentimiento previo**: Checkbox disabled y checked con fecha de consentimiento; modal "Ver detalle" con info de privacidad
- **Historial de versiones**: Modal "Historial de versiones" con listado de versiones y detalle read-only
- **Navegación "Ir a agendar turno"**: Link funciona y lleva a la pantalla de agendar turno con lista de nutricionistas
- **GET ficha-salud**: Endpoint responde 200 con datos de la ficha
- **PUT ficha-salud (edición)**: Endpoint responde 200 y crea nueva versión (`versionActual` se incrementa)
- **Versionado funcional**: API devuelve `versionActual: 2` tras editar, y el historial muestra las versiones previas

---

## Resumen

| Tipo | Cantidad |
|------|----------|
| 🔴 Errores funcionales | 3 |
| 🟡 Problemas UI/UX | 3 |
| ✅ Funcionalidades OK | 16 |
