# Spec: Accesos Rápidos de Turnos y Banner de Consulta Activa

## Contexto
Los nutricionistas necesitan iniciar consultas rápidamente desde el dashboard sin tener que ir a "Mi Agenda" y necesitan poder volver a una consulta en curso si navegan a otra pantalla por error.

## Alcance
- Modificación de `TurnosDelDiaCard` en el `DashboardNutricionista` para agregar botones de acción rápida.
- Implementación de un `BannerConsultaActiva` global que persiste mientras haya un turno en estado `EN_CURSO`.
- Modificación del backend (opcional/si aplica) o uso de endpoints existentes para consultar el estado de la consulta activa.

## 1. Tarjeta "Turnos de Hoy" Accionable
Actualmente, `TurnosDelDiaCard` es de solo lectura. 
Se agregarán botones contextuales según el estado del turno (reutilizando la lógica de `TurnosProfesional.tsx`):
- **Estado `PRESENTE`**: Botón "Iniciar Consulta" (ícono Play). Navega a `/profesional/consulta/:id`.
- **Estado `EN_CURSO`**: Botón "Continuar" (ícono Play). Navega a `/profesional/consulta/:id`.
- **Estado `REALIZADO`**: Botón "Ver" (ícono Eye). Navega a `/profesional/consulta/:id`.

**Implementación técnica:**
- Extraeremos la navegación de `TurnosProfesional.tsx` hacia el componente de la tarjeta.
- No se incluirán acciones destructivas (revertir, marcar ausente manual) en el dashboard para mantenerlo limpio; esas quedan en la agenda completa.

## 2. Banner Global "Consulta Activa"
Un componente flotante o fijo en la parte superior de la aplicación (debajo del header o fixed top) exclusivo para nutricionistas.

**Comportamiento de datos:**
- Usará un React Query `['consulta-activa']` que llame a un endpoint (o filtre de los turnos de hoy) para encontrar si hay algún turno `EN_CURSO`.
- Si `consulta-activa` existe, el banner se renderiza.
- Si no hay consulta activa, retorna `null`.

**Diseño Visual:**
- **Tipo:** Barra de ancho completo (full-width) o un float bottom-right / top-center. (Adoptaremos un full-width banner fijo en el layout general).
- **Color:** Background prominente (ej. `bg-violet-600 text-white`).
- **Contenido:**
  - Ícono (ej. Radio, Play, Activity).
  - Texto: "Consulta en curso: [Nombre del Paciente]"
  - Botón: "Volver a la consulta" -> Navega a `/profesional/consulta/:id`.

**Implementación técnica:**
- Crear componente `BannerConsultaActiva.tsx`.
- Inyectarlo en `AppLayout` (el layout principal) para que se muestre en cualquier ruta.
- La query verificará los turnos del día del profesional y buscará `t.estadoTurno === 'EN_CURSO'`. Esto evita crear un endpoint nuevo en el backend, re-utilizando `/turnos/profesional/:id/hoy`.
- `staleTime` bajo (o invalidación explícita) para que el banner desaparezca ni bien termine la consulta.

## Riesgos y Casos Borde
- **Parpadeo (Flicker):** Si la consulta demora en cargar, el banner podría aparecer tarde. React Query manejará el estado de carga (`isLoading`). El banner solo debe renderizarse cuando `data` está definido y hay un turno en curso.
- **Navegación dentro de la consulta:** Si el nutricionista *ya está* en `/profesional/consulta/:id`, el banner sería redundante y ocuparía espacio.
  - **Resolución:** El banner leerá la ruta actual con `useLocation()`. Si `location.pathname.includes('/profesional/consulta/')`, el banner **no** se mostrará.

## Plan de Pruebas
1. Iniciar sesión como nutricionista. Ver un turno `PRESENTE` en el Dashboard. Click en "Iniciar consulta".
2. Redirige a la consulta. Salir navegando al Dashboard de nuevo.
3. El banner debe aparecer en el Dashboard diciendo "Consulta en curso: [Socio]".
4. En el Dashboard, el turno debe decir "Continuar" en vez de "Iniciar".
5. Click en "Volver a la consulta" en el banner. Debe llevar a la ruta de consulta y el banner debe desaparecer.
6. Finalizar la consulta. Volver al Dashboard. El banner no debe existir y el turno debe decir "Ver".
