# Contexto ampliado en consulta profesional: Errores detectados

> **Fuente**: `apps/frontend/src/pages/ConsultaProfesionalPage.tsx`
> **Fecha**: 2026-06-18
> **Herramienta**: Playwright MCP
> **Evidencia**: `contexto-consulta-desktop.png`, `contexto-consulta-mobile.png`, requests `246`, `251`, `252`

---

## 🔴 Errores funcionales

Sin errores funcionales detectados en esta verificación.

---

## 🟡 Problemas de UI/UX

Sin problemas de UI/UX detectados en esta verificación.

---

## ✅ Funcionalidades que SÍ funcionan

- El paso `Contexto` sigue siendo la etapa inicial de la consulta y carga sin romper la navegación principal.
- El bloque `Resumen clínico inicial` muestra identidad del paciente, objetivo, actividad y métricas de referencia.
- `Banderas clínicas` presenta alergias, patologías, restricciones y medicación con mejor jerarquía visual.
- `Última consulta registrada` muestra el estado previo cuando existe historial y muestra `Primera consulta` cuando no hay antecedentes.
- `Hábitos y antecedentes` expone la información ampliada dentro de expandibles sin saturar la pantalla principal.
- La vista se mantiene usable en desktop y mobile.
- Los requests críticos devolvieron `200 OK`: `GET /turnos/177`, `GET /turnos/profesional/5/pacientes/273/historial-mediciones`, `GET /turnos/profesional/5/pacientes/273/historial-consultas`.

---
