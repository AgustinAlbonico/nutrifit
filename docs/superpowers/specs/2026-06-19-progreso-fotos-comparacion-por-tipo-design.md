# Diseno - Comparacion de Fotos por Tipo en Mi Progreso

Fecha: 2026-06-19

## Objetivo

Reorganizar la experiencia de fotos en `mi-progreso` para que la comparacion visual sea mas intuitiva y menos molesta que el comparador global actual.

Ademas, preparar el sistema para cargar fotos libres de ejemplo para `martin-evolucion@nutrifit.com` en los tipos `Frente`, `Perfil`, `Espalda` y `Otro`.

## Problema actual

- La comparacion antes/despues vive en un bloque global separado de la galeria.
- Obliga a pensar primero en el comparador y despues en el tipo de foto.
- Tiene demasiada friccion: selector de tipo, selector de antes, selector de despues, y luego el slider.
- No aprovecha que el usuario naturalmente piensa por angulo corporal: frente, perfil, espalda, otro.

## Solucion propuesta

Cada tipo de foto tendra su propio bloque autonomo dentro de la pestana `Fotos`.

Cada bloque mostrara:

- encabezado con nombre del tipo y cantidad de fotos
- comparador visual arriba, dentro del mismo contexto del tipo
- estado inicial automatico:
  - `Antes` = primera foto cronologica de ese tipo
  - `Despues` = ultima foto cronologica de ese tipo
- tira de miniaturas abajo, solo de ese tipo, ordenadas por fecha
- accion contextual sobre cada miniatura para usarla como `Antes` o `Despues`
- CTA de carga/reemplazo que ya quedo implementada por angulo

## UX detallada

### Estructura por bloque

Por cada tipo (`Frente`, `Perfil`, `Espalda`, `Otro`):

1. Cabecera del bloque
   - titulo del tipo
   - cantidad de fotos disponibles
   - descripcion corta del angulo

2. Comparador principal
   - si hay 2 o mas fotos del tipo: mostrar slider antes/despues
   - si hay 1 sola: mostrar la foto y mensaje indicando que falta una segunda para comparar
   - si no hay ninguna: mantener el placeholder actual

3. Resumen de seleccion
   - chip o badge `Antes: <fecha/sesion>`
   - chip o badge `Despues: <fecha/sesion>`

4. Tira de miniaturas
   - orden cronologico ascendente
   - cada miniatura muestra fecha
   - miniatura seleccionada para `Antes` y `Despues` queda marcada visualmente

5. Acciones de seleccion
   - cada miniatura tiene acciones rapidas:
     - `Usar como antes`
     - `Usar como despues`

## Por que miniaturas y no dropdowns

Se eligio miniaturas porque:

- es mas visual y directa para comparacion corporal
- reduce carga cognitiva
- evita leer fechas en listas largas
- escala mejor cuando Martin tenga multiples sesiones por tipo
- funciona mejor para un dominio donde el contenido principal son imagenes, no texto

Los dropdowns quedan descartados salvo fallback tecnico si aparece una limitacion importante de performance o responsive.

## Comportamiento por defecto

- Al entrar a `Fotos`, cada bloque calcula automaticamente su par inicial.
- Si el usuario cambia `Antes` o `Despues`, esa seleccion se mantiene mientras permanezca en la pagina.
- Si se sube una nueva foto del tipo:
  - el bloque se refresca
  - si el usuario no toco nada manualmente, `Despues` pasa a ser la nueva ultima
  - si ya habia override manual, se conserva hasta que el usuario cambie de nuevo

## Alcance tecnico

### Frontend

Componentes a tocar:

- `apps/frontend/src/components/progreso/ComparacionFotos.tsx`
- posiblemente `apps/frontend/src/components/progreso/GaleriaFotos.tsx`
- posiblemente extraer un nuevo componente tipo `ComparadorFotosPorTipo.tsx` para evitar mezclar galeria y comparador en un solo archivo
- tests nuevos para el flujo de seleccion de miniaturas

### Backend / datos

No requiere cambios de contrato API para la comparacion.

Para el seed de Martin si hay trabajo aparte:

- obtener imagenes libres para `Frente`, `Perfil`, `Espalda`, `Otro`
- descargarlas o incorporarlas a un flujo repetible
- subirlas o sembrarlas asociadas a `martin-evolucion@nutrifit.com`
- vincular primeras fotos a la primera sesion y ultimas a sesiones posteriores para que el comparador tenga valor real

## Fotos libres para Martin

Se usaran imagenes libres para reutilizacion. Antes de implementarlo hay que definir fuente concreta y formato de incorporacion:

- opcion A: descargar assets libres y versionarlos en el repo
- opcion B: seedarlas desde URLs externas

Recomendacion: descargar assets y versionarlos localmente para que el seed no dependa de internet ni de terceros en runtime.

## Riesgos

- demasiada densidad visual si cada bloque muestra comparador + tira + CTA + galeria extensa
- mobile puede requerir simplificar layout o apilar controles
- si un tipo tiene muchas fotos, la tira de miniaturas necesita scroll horizontal claro

## Testing

- test unitario/component para defaults `primera vs ultima`
- test para cambio manual de `Antes`
- test para cambio manual de `Despues`
- test para estado con 0, 1 y 2+ fotos por tipo
- validacion visual en `mi-progreso` con Playwright
- validacion responsive minima

## Excluido de este cambio

- cambiar la taxonomia de tipos de foto
- reemplazar `Frente/Perfil/Espalda/Otro` por otras categorias
- rediseñar todo el uploader
- automatizar busqueda web de imagenes dentro del runtime del seed
