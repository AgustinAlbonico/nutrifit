# Sistema de Diseño Nutrifit Supervisor

**Versión**: 1.0.0
**Última actualización**: 2026-02-14
**Estado**: Activo
**Dirección de diseño**: Clinical Performance (Confianza Profesional + Energía Vital)

---

## Tabla de Contenidos

1. [Resumen](#resumen)
2. [Dirección de Diseño](#dirección-de-diseño)
3. [Tokens de Diseño](#tokens-de-diseño)
   - [Jerarquía de Tokens](#jerarquía-de-tokens)
   - [Colores](#colores)
   - [Tipografía](#tipografía)
   - [Espaciado](#espaciado)
   - [Radio de Bordes](#radio-de-bordes)
   - [Sombras y Elevación Visual](#sombras-y-elevación-visual)
   - [Efectos Especiales](#efectos-especiales)
   - [Animaciones y Motion Design](#animaciones-y-motion-design)
   - [Capas Z-Index](#capas-z-index)
   - [Puntos de Ruptura](#puntos-de-ruptura)
4. [Patrones de Diseño](#patrones-de-diseño)
5. [Componentes Primitivos](#componentes-primitivos)
6. [Guías de Uso](#guías-de-uso)
7. [Guía de Implementación](#guía-de-implementación)
8. [Patrones Implementados (Feb 2026)](#patrones-implementados-feb-2026)
9. [Mantenimiento](#mantenimiento)
10. [Recursos](#recursos)

---

## Resumen

### Contexto del Proyecto

**Nutrifit Supervisor** es una plataforma B2B de supervisión de nutrición y gestión de dietas para profesionales de la salud que monitorean y gestionan planes nutricionales de pacientes.

### Stack Tecnológico

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Estilos**: Tailwind CSS 4 + shadcn/ui (estilo New York)
- **Gestión de Estado**: Zustand + TanStack Query
- **Formularios**: React Hook Form + Zod
- **Iconos**: Lucide React

### Filosofía de Diseño

1. **Confianza Profesional**: Interfaz limpia y confiable para profesionales de la salud
2. **Claridad Primero**: Jerarquía de información priorizando la legibilidad
3. **Eficiencia**: Flujos de trabajo rápidos para clínicos ocupados
4. **Accesibilidad**: WCAG 2.1 AA compliant
5. **Responsivo**: Funciona perfectamente desde tablets hasta monitores grandes

### Soporte de Temas

- Modo claro (predeterminado)
- Modo oscuro (preferencia del sistema)
- Modo de alto contraste (futuro)

---

## Dirección de Diseño

### Clinical Performance: Confianza Profesional + Energía Vital

**Dirección seleccionada**: Opción 1 - Clinical Performance

Esta dirección equilibria la seriedad clínica con la energía vital del fitness:

#### Principios Clave

- **Lively & Active**: El diseño se siente vivo y activo, no estéril ni decorativo
- **Confianza Profesional**: Usa gris neutro + tipografía Sora para transmitir confianza clínica
- **Energía Vital**: Colores de acento sutiles y micro-animaciones para dinamismo
- **Minimalista**: Efectos decorativos controlados (glassmorphism solo en fondos decorativos)
- **Gráficos de Datos**: Gradientes SOLO para visualización de datos (barras de progreso, gráficos) con etiquetas de texto

#### Restricciones de Diseño

- **Sin glassmorphism en datos**: Las tarjetas con información crítica deben tener fondo sólido
- **Gradientes controlados**: Solo para visualización de datos con etiquetas de texto claras
- **Animaciones sutiles**: Duraciones de 100-500ms, sin animaciones fuertes
- **Soporte prefers-reduced-motion**: Respeta las preferencias de accesibilidad del sistema
- **WCAG 2.1 AA**: Contraste mínimo de 4.5:1 para texto normal, 3:1 para texto grande

#### Roles de Usuario

1. **Socio**: Dueños del gimnasio/negocio - necesita métricas de negocio y KPIs
2. **Profesional**: Nutricionistas/coaches - necesita herramientas de gestión de pacientes y planes
3. **Asistente**: Personal de soporte - necesita vista simplificada y flujos de trabajo guiados

---

## Tokens de Diseño

### Jerarquía de Tokens

```
Capa 1: Tokens Primitivos (Valores Crudos)
  ├─ Colores primitivos (valores oklch)
  ├─ Espacio primitivos (valores px)
  ├─ Tipografía primitiva (tamaños, pesos)
  ├─ Radio primitivos (valores px)
  └─ Sombras primitivas (valores box-shadow)

Capa 2: Tokens Semánticos (Significado)
  ├─ Tokens de superficie (fondos, tarjetas)
  ├─ Tokens de contenido (texto, iconos)
  ├─ Tokens interactivos (botones, enlaces)
  ├─ Tokens de retroalimentación (éxito, advertencia, error)
  └─ Tokens de estado (colores de gráfico, etiquetas)

Capa 3: Tokens de Componente (Uso Específico)
  ├─ Tokens de botón (padding, radio)
  ├─ Tokens de entrada (borde, estados de foco)
  ├─ Tokens de tarjeta (padding, sombra)
  └─ etc.
```

### Colores

#### Tokens de Color Primitivos (Colores Base)

Usando espacio de color oklch para uniformidad perceptual.

**Colores en Modo Claro**:
```css
:root {
  /* Escala de grises - Neutra y profesional */
  --gray-50: oklch(0.985 0 0);    /* #fafafa */
  --gray-100: oklch(0.97 0 0);    /* #f5f5f5 */
  --gray-200: oklch(0.922 0 0);   /* #e5e5e5 */
  --gray-300: oklch(0.87 0 0);    /* #d4d4d4 */
  --gray-400: oklch(0.708 0 0);   /* #a3a3a3 */
  --gray-500: oklch(0.556 0 0);   /* #737373 */
  --gray-600: oklch(0.394 0 0);   /* #525252 */
  --gray-700: oklch(0.274 0 0);   /* #404040 */
  --gray-800: oklch(0.205 0 0);   /* #262626 */
  --gray-900: oklch(0.145 0 0);   /* #171717 */

  /* Marca - Salud/Nutrición (verdes frescos) */
  --green-500: oklch(0.546 0.245 142.49);  /* Verdes frescos para nutrición */
  --green-600: oklch(0.464 0.23 142.5);

  /* Colores de Retroalimentación */
  --red-500: oklch(0.577 0.245 27.325);   /* Destructivo/alerta */
  --red-600: oklch(0.506 0.227 27.225);
  --amber-500: oklch(0.769 0.188 70.08);   /* Advertencia */
  --amber-600: oklch(0.682 0.197 70.68);
  --emerald-500: oklch(0.646 0.222 41.116); /* Éxito */
  --emerald-600: oklch(0.576 0.237 42.08);
}
```

#### Tokens de Color Semánticos

**Modo Claro**:
```css
:root {
  /* Tokens de Superficie */
  --background: oklch(1 0 0);        /* Fondo principal de la app */
  --card: oklch(1 0 0);              /* Fondo de tarjeta */
  --popover: oklch(1 0 0);           /* Fondo de popover/dropdown */
  --sidebar: oklch(0.985 0 0);       /* Fondo de barra lateral */

  /* Tokens de Contenido */
  --foreground: oklch(0.145 0 0);    /* Texto principal */
  --card-foreground: oklch(0.145 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --muted-foreground: oklch(0.556 0 0); /* Texto secundario */

  /* Tokens Interactivos */
  --primary: oklch(0.205 0 0);       /* Acción principal (gris oscuro) */
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);      /* Acción secundaria */
  --secondary-foreground: oklch(0.205 0 0);
  --accent: oklch(0.97 0 0);         /* Énfasis/destaque */
  --accent-foreground: oklch(0.205 0 0);

  /* Tokens de Retroalimentación */
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);

  /* Tokens de Borde */
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);          /* Anillo de foco */

  /* Específicos de Barra Lateral */
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);

  /* Colores de Gráfico - Visualización de Datos */
  --chart-1: oklch(0.646 0.222 41.116);   /* Serie de datos primaria */
  --chart-2: oklch(0.6 0.118 184.704);   /* Serie de datos secundaria */
  --chart-3: oklch(0.398 0.07 227.392);   /* Serie de datos terciaria */
  --chart-4: oklch(0.828 0.189 84.429);   /* Serie de datos cuaternaria */
  --chart-5: oklch(0.769 0.188 70.08);    /* Serie de datos quinaria */

  /* Colores Semánticos Adicionales */
  --muted: oklch(0.97 0 0);           /* Estados deshabilitados */
}
```

**Modo Oscuro**:
```css
.dark {
  /* Surface Tokens */
  --background: oklch(0.145 0 0);
  --card: oklch(0.205 0 0);
  --popover: oklch(0.205 0 0);
  --sidebar: oklch(0.205 0 0);

  /* Content Tokens */
  --foreground: oklch(0.985 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --muted-foreground: oklch(0.708 0 0);

  /* Interactive Tokens */
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);

  /* Feedback Tokens */
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);

  /* Border Tokens */
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);

  /* Sidebar Specific */
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);

  /* Chart Colors - Dark Mode Adjusted */
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);

  /* Additional Semantic Colors */
  --muted: oklch(0.269 0 0);
}
```

#### Color Usage Guidelines

| Token | Usage Context | Example |
|-------|--------------|---------|
| `--primary` | Primary CTAs, main actions | "Guardar cambios", "Crear plan" |
| `--secondary` | Secondary actions | "Cancelar", "Volver" |
| `--accent` | Emphasis, highlights | Active tab, selected item |
| `--destructive` | Destructive actions | "Eliminar paciente", "Cancelar cita" |
| `--muted-foreground` | Secondary text | Labels, helper text, timestamps |
| `--chart-1` to `--chart-5` | Data visualization | Macro distribution charts, calorie tracking |

### Tipografía

#### Familia de Fuente

```css
:root {
  --font-sans: 'Sora', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

**Font**: Sora (primary) → Segoe UI (fallback) → System fonts

#### Escala de Tipografía

| Token | Valor | Clase CSS | Uso |
|-------|-------|-----------|-----|
| `--text-xs` | 0.75rem (12px) | `text-xs` | Leyendas, metadatos, marcas de tiempo |
| `--text-sm` | 0.875rem (14px) | `text-sm` | Texto de ayuda, etiquetas, contenido secundario |
| `--text-base` |1rem (16px) | `text-base` | Texto de cuerpo predeterminado, contenido de párrafos |
| `--text-lg` |1.125rem (18px) | `text-lg` | Texto de cuerpo enfatizado, subtítulos |
| `--text-xl` |1.25rem (20px) | `text-xl` | Encabezados pequeños, títulos de tarjeta |
| `--text-2xl` |1.5rem (24px) | `text-2xl` | Encabezados de sección, títulos de página |
| `--text-3xl` |1.875rem (30px) | `text-3xl` | Encabezados principales |
| `--text-4xl` |2.25rem (36px) | `text-4xl` | Títulos heroicos, encabezados de marketing |
| `--text-5xl` |3rem (48px) | `text-5xl` | Encabezados de visualización |

#### Pesos de Fuente

| Token | Valor | Clase CSS | Uso |
|-------|-------|-----------|-----|
| `--font-regular` | 400 | `font-normal` | Texto de cuerpo, párrafos |
| `--font-medium` | 500 | `font-medium` | Texto enfatizado, etiquetas |
| `--font-semibold` | 600 | `font-semibold` | Encabezados, etiquetas de UI |
| `--font-bold` | 700 | `font-bold` | Énfasis fuerte, títulos de página |

#### Alturas de Línea

| Token | Valor | Uso |
|-------|-------|-----|
| `--leading-none` | 1 | Encabezados ajustados, texto de visualización |
| `--leading-tight` | 1.25 | Encabezados con espacio limitado |
| `--leading-snug` | 1.375 | La mayoría de encabezados |
| `--leading-normal` | 1.5 | Texto de cuerpo, párrafos |
| `--leading-relaxed` | 1.625 | Contenido más largo, descripciones |

#### Espaciado de Letras

| Token | Valor | Uso |
|-------|-------|-----|
| `--tracking-tighter` | -0.05em | Encabezados ajustados |
| `--tracking-tight` | -0.025em | Encabezados grandes |
| `--tracking-normal` | 0em | Texto predeterminado |
| `--tracking-wide` | 0.025em | Etiquetas en mayúsculas, texto pequeño |
| `--tracking-wider` | 0.05em | Encabezados en mayúsculas |

#### Componentes de Tipografía

```css
:root {
  /* Encabezados */
  --h1: var(--text-3xl) var(--font-semibold) var(--leading-tight) var(--tracking-tight);
  --h2: var(--text-2xl) var(--font-semibold) var(--leading-snug) var(--tracking-tight);
  --h3: var(--text-xl) var(--font-semibold) var(--leading-snug) var(--tracking-normal);
  --h4: var(--text-lg) var(--font-semibold) var(--leading-snug) var(--tracking-normal);

  /* Texto de Cuerpo */
  --body: var(--text-base) var(--font-regular) var(--leading-normal) var(--tracking-normal);
  --body-small: var(--text-sm) var(--font-regular) var(--leading-normal) var(--tracking-normal);

  /* Etiquetas */
  --label: var(--text-sm) var(--font-medium) var(--leading-none) var(--tracking-normal);
  --label-large: var(--text-base) var(--font-medium) var(--leading-none) var(--tracking-normal);
}
```

#### Guías de Uso de Tipografía

| Contexto | Token | Ejemplo |
|----------|-------|---------|
| Título de Página | `--h1` | "Panel de Pacientes" |
| Encabezado de Sección | `--h2` | "Historial Nutricional" |
| Título de Tarjeta | `--h3` | "Juan Pérez - Plan Actual" |
| Subtítulo | `--h4` | "Objetivos Semanales" |
| Párrafo de Cuerpo | `--body` | Descripciones, instrucciones |
| Texto Secundario | `--body-small` | Texto de ayuda, notas al pie |
| Etiqueta de Formulario | `--label` | "Nombre del paciente" |
| Texto de Botón | `--text-sm` `font-medium` | "Guardar cambios" |
| Marca de Tiempo/Metadatos | `--text-xs` | "Última actualización: hace 2h" |

### Espaciado

#### Escala de Espaciado (Base 4px)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--space-0` | 0px | `gap-0`, `p-0` | No spacing |
| `--space-px` | 1px | `gap-px` | Hairline separation |
| `--space-1` | 4px | `gap-1`, `p-1` | Tight spacing (icons, tags) |
| `--space-2` | 8px | `gap-2`, `p-2` | Small spacing (button groups) |
| `--space-3` | 12px | `gap-3`, `p-3` | Medium-small spacing |
| `--space-4` | 16px | `gap-4`, `p-4` | Default spacing (cards, sections) |
| `--space-5` | 20px | `gap-5`, `p-5` | Medium spacing |
| `--space-6` | 24px | `gap-6`, `p-6` | Large spacing (content sections) |
| `--space-8` | 32px | `gap-8`, `p-8` | Extra large spacing (page padding) |
| `--space-10` | 40px | `gap-10`, `p-10` | Major sections |
| `--space-12` | 48px | `gap-12`, `p-12` | Page margins |
| `--space-16` | 64px | `gap-16`, `p-16` | Large containers |
| `--space-20` | 80px | `gap-20`, `p-20` | Hero sections |
| `--space-24` | 96px | `gap-24`, `p-24` | Maximum spacing |

#### Spacing Patterns

| Pattern | Tokens | Usage |
|---------|--------|-------|
| **Element to Element** | `--space-2` to `--space-4` | Related items (button groups, form fields) |
| **Section to Section** | `--space-6` to `--space-8` | Distinct content blocks |
| **Group to Group** | `--space-10` to `--space-12` | Major content groups |
| **Page Margin** | `--space-4` to `--space-6` | Mobile/tablet |
| **Page Margin** | `--space-8` to `--space-12` | Desktop |

### Radio de Bordes

#### Escala de Radio

```css
:root {
  --radius: 0.625rem;  /* Base: 10px */
  --radius-sm: calc(var(--radius) - 4px);   /* 6px */
  --radius-md: calc(var(--radius) - 2px);   /* 8px */
  --radius-lg: var(--radius);               /* 10px */
  --radius-xl: calc(var(--radius) + 4px);   /* 14px */
  --radius-2xl: calc(var(--radius) + 8px);  /* 18px */
  --radius-3xl: calc(var(--radius) + 12px); /* 22px */
  --radius-4xl: calc(var(--radius) + 16px); /* 26px */
}
```

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--radius-sm` | 6px | `rounded-sm` | Small elements (tags, badges) |
| `--radius-md` | 8px | `rounded-md` | Inputs, buttons (small) |
| `--radius-lg` | 10px | `rounded-lg` | Buttons (default), cards (small) |
| `--radius-xl` | 14px | `rounded-xl` | Cards (default), modals |
| `--radius-2xl` | 18px | `rounded-2xl` | Large cards, hero sections |
| `--radius-3xl` | 22px | `rounded-3xl` | Pills, avatar containers |
| `--radius-4xl` | 26px | `rounded-4xl` | Hero elements, featured cards |

#### Radius Usage Guidelines

| Component | Radius |
|-----------|--------|
| Button (sm) | `--radius-md` |
| Button (md/lg) | `--radius-lg` |
| Input | `--radius-md` |
| Card | `--radius-xl` or `--radius-2xl` |
| Modal | `--radius-2xl` |
| Badge/Tag | `--radius-sm` or `--radius-md` |
| Avatar | `--radius-3xl` (pill) or `--radius-lg` (rounded) |
| Alert/Toast | `--radius-lg` |

### Sombras y Elevación Visual

#### Niveles de Sombra

```css
:root {
  /* Level 1: Subtle elevation */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);

  /* Level 2: Default elevation */
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);

  /* Level 3: Medium elevation (cards, dropdowns) */
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

  /* Level 4: High elevation (modals) */
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Level 5: Maximum elevation (tooltips, popovers) */
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

  /* Level 6: Floating elements (drawers, mega menus) */
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

  /* Colored shadow for emphasis */
  --shadow-primary: 0 4px 14px 0 rgb(14 165 233 / 0.39);
  --shadow-destructive: 0 4px 14px 0 rgb(239 68 68 / 0.39);
}
```

| Token | Elevation | Usage |
|-------|-----------|-------|
| `--shadow-sm` | Level 1 | Disabled buttons, subtle borders |
| `--shadow` | Level 2 | Default cards, panels |
| `--shadow-md` | Level 3 | Dropdowns, hover states, active cards |
| `--shadow-lg` | Level 4 | Modals, sheets, emphasized cards |
| `--shadow-xl` | Level 5 | Tooltips, popovers, tooltips |
| `--shadow-2xl` | Level 6 | Drawers, mega menus, overlays |
| `--shadow-primary` | Colored | Primary action buttons (optional) |
| `--shadow-destructive` | Colored | Destructive action buttons (optional) |

#### Dark Mode Shadows

```css
.dark {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.7);
}
```

### Efectos Especiales

#### Glassmorphism Controlado

**Uso restringido**: Solo en fondos decorativos, NUNCA en tarjetas con información crítica.

```css
/* Glassmorphism suave para fondos decorativos */
.glass {
  background: oklch(1 0 0 / 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid oklch(1 0 0 / 0.1);
}

.dark .glass {
  background: oklch(0.145 0 0 / 0.8);
  border: 1px solid oklch(1 0 0 / 0.1);
}
```

**Casos de uso válidos**:
- Hero backgrounds
- Encabezados de página
- Filtros de navegación

**Casos de uso PROHIBIDOS**:
- Tarjetas con datos de pacientes
- Formularios de entrada
- Tablas de datos
- Gráficos de métricas

#### Gradientes para Datos

**Solo para visualización de datos** con etiquetas de texto obligatorias.

```css
/* Gradiente de barra de progreso con etiqueta */
.progress-bar {
  background: linear-gradient(90deg, var(--chart-1), var(--chart-2));
  color: white; /* Etiqueta de texto siempre visible */
}

/* Gradiente de gráfico con etiquetas de texto */
.chart-gradient {
  background: linear-gradient(180deg, var(--chart-1), transparent);
  color: var(--foreground); /* Etiquetas de texto siempre legibles */
}
```

**Casos de uso válidos**:
- Barras de progreso con etiqueta de porcentaje
- Gráficos de área con etiquetas de ejes
- Indicadores de métricas con valores de texto

**Requisito**: Siempre incluir etiquetas de texto con contraste suficiente (WCAG AA).

### Capas Z-Index

```css
:root {
  /* Base layer */
  --z-base: 0;

  /* Dropdown, popover, tooltip */
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;

  /* Toasts and notifications */
  --z-toast: 80;
  --z-notification: 90;

  /* Maximum layer (shouldn't be exceeded) */
  --z-max: 9999;
}
```

| Layer | Value | Usage |
|-------|-------|-------|
| `--z-base` | 0 | Default content, cards |
| `--z-dropdown` | 10 | Select dropdowns, menu items |
| `--z-sticky` | 20 | Sticky headers, table headers |
| `--z-fixed` | 30 | Fixed sidebars, action bars |
| `--z-modal-backdrop` | 40 | Modal overlay backdrop |
| `--z-modal` | 50 | Modal content |
| `--z-popover` | 60 | Popovers, date pickers |
| `--z-tooltip` | 70 | Tooltips |
| `--z-toast` | 80 | Toast notifications |
| `--z-notification` | 90 | Critical notifications |

### Animaciones y Motion Design

#### Duraciones de Animación

```css
:root {
  /* Instant */
  --duration-instant: 0ms;

  /* Fast - Feedback states */
  --duration-fast: 100ms;

  /* Default - Most interactions */
  --duration-default: 150ms;

  /* Medium - Animations */
  --duration-medium: 200ms;

  /* Slow - Page transitions */
  --duration-slow: 300ms;

  /* Very slow - Complex animations */
  --duration-slower: 500ms;
}
```

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | 0ms | No transition (instant) |
| `--duration-fast` | 100ms | Hover states, focus states |
| `--duration-default` | 150ms | Default button transitions |
| `--duration-medium` | 200ms | Modal open/close, dropdowns |
| `--duration-slow` | 300ms | Page transitions, slide-ins |
| `--duration-slower` | 500ms | Complex animations |

#### Funciones de Easing

```css
:root {
  /* Lineal */
  --ease-linear: linear;

  /* Ease */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Eases Personalizados */
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);  /* Rebote suave */
  --ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Elástico */
}
```

| Token | Uso |
|-------|-----|
| `--ease-linear` | Animaciones continuas (cargadores) |
| `--ease-in` | Dropdown de menú (entrada) |
| `--ease-out` | Cierre de modal, deslizamiento de salida |
| `--ease-in-out` | La mayoría de transiciones (predeterminado) |
| `--ease-spring` | Interacciones lúdicas (opcional) |
| `--ease-elastic` | Animaciones de retroalimentación (opcional) |

#### Patrones de Transición

```css
:root {
  /* Transición predeterminada */
  --transition-default: all var(--duration-default) var(--ease-in-out);

  /* Solo colores */
  --transition-colors: color var(--duration-fast) var(--ease-in-out);

  /* Solo transform */
  --transition-transform: transform var(--duration-default) var(--ease-in-out);

  /* Solo sombras */
  --transition-shadow: box-shadow var(--duration-default) var(--ease-in-out);

  /* Transición de modal */
  --transition-modal: all var(--duration-medium) var(--ease-in-out);
}
```

#### Soporte prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Patrones de Micro-animación

```css
/* Micro-animación de hover sutil */
.hover-lift {
  transition: transform var(--duration-fast) var(--ease-out);
}

.hover-lift:hover {
  transform: translateY(-2px);
}

/* Micro-animación de escala sutil */
.hover-scale {
  transition: transform var(--duration-fast) var(--ease-out);
}

.hover-scale:hover {
  transform: scale(1.02);
}

/* Micro-animación de pulso sutil */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.pulse-subtle {
  animation: pulse-subtle var(--duration-slow) var(--ease-in-out) infinite;
}
```

### Puntos de Ruptura

#### Puntos de Ruptura Responsivos

```css
:root {
  /* Default transition */
  --transition-default: all var(--duration-default) var(--ease-in-out);

  /* Colors only */
  --transition-colors: color var(--duration-fast) var(--ease-in-out);

  /* Transform only */
  --transition-transform: transform var(--duration-default) var(--ease-in-out);

  /* Shadows only */
  --transition-shadow: box-shadow var(--duration-default) var(--ease-in-out);

  /* Modal transition */
  --transition-modal: all var(--duration-medium) var(--ease-in-out);
}
```

### Puntos de Ruptura

#### Puntos de Ruptura Responsivos

| Token | Valor | Clase CSS | Dispositivo |
|-------|-------|-----------|-------------|
| `--breakpoint-xs` | 0px | `xs:` | Extra pequeño (móvil) |
| `--breakpoint-sm` | 640px | `sm:` | Teléfonos pequeños |
| `--breakpoint-md` | 768px | `md:` | Tablets |
| `--breakpoint-lg` | 1024px | `lg:` | Portátiles |
| `--breakpoint-xl` | 1280px | `xl:` | Escritorio |
| `--breakpoint-2xl` | 1536px | `2xl:` | Escritorio grande |

#### Estrategia Responsiva

- **Mobile First**: Estilos predeterminados para móvil (`xs`), mejorar para pantallas más grandes
- **Flujo de Contenido**: Apilar en móvil, grid/tabla en escritorio
- **Objetivos Táctiles**: Mínimo 44px en móvil

---

## Componentes Primitivos

### Catálogo de Componentes

| Componente | Variante(s) | Tamaño(s) | Estado |
|------------|-------------|-----------|--------|
| **Botón** | default, destructive, outline, secondary, ghost, link | sm, md, lg, icon | ✅ Requerido |
| **Entrada** | default, file | sm, md, lg | ✅ Requerido |
| **Tarjeta** | default | - | ✅ Requerido |
| **Diálogo** | default | - | ✅ Requerido |
| **Select** | default | sm, md, lg | ✅ Requerido |
| **Date Picker** | default (popover + calendario) | md | ✅ Requerido |
| **Checkbox** | default | sm, md | ✅ Requerido |
| **Radio** | default | sm, md | ✅ Requerido |
| **Switch** | default | sm, md | ✅ Requerido |
| **Insignia** | default, secondary, destructive, outline | sm, md | ✅ Requerido |
| **Avatar** | default | sm, md, lg, xl | ✅ Requerido |
| **Tooltip** | default | - | ✅ Requerido |
| **Tabla** | default | - | ✅ Requerido |
| **Form** | default | - | ✅ Required |
| **Tabs** | default | sm, md, lg | ✅ Required |
| **Accordion** | default | sm, md | ✅ Required |
| **Dropdown Menu** | default | - | ✅ Required |
| **Separator** | horizontal, vertical | - | ✅ Required |
| **ScrollArea** | default | - | ✅ Required |
| **Skeleton** | default | - | ✅ Required |
| **Alert** | default, destructive | - | ✅ Required |
| **Toast** | default, destructive | - | ✅ Required |

---

### Date Picker

**Propósito**: Selección de fecha consistente en todo el producto con experiencia moderna y accesible.

#### Estándar obligatorio

- Usar siempre `DatePicker` desde `src/components/ui/date-picker.tsx`.
- El calendario interno debe ser `Calendar` (`react-day-picker`) dentro de `Popover`.
- Locale por defecto: español (`es`).
- El popover debe cerrarse al seleccionar fecha.

#### Reglas de uso

| Regla | Requerimiento |
|-------|---------------|
| Fuente única | No crear date pickers ad-hoc por pantalla |
| Sin input nativo | Prohibido usar `<input type="date">` en UI nueva o existente |
| Estados mínimos | Soportar `placeholder`, `date`, `setDate` |
| Restricciones | Usar `minDate` cuando el flujo lo requiera |

#### Anti-patrones

- `<Input type="date" ... />`
- `<input type="date" ... />`
- Wrappers alternativos de calendario fuera de `DatePicker`

---

### Button

**Purpose**: Primary interactive element for actions.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Primary action color | Main CTAs: "Guardar", "Crear" |
| `destructive` | Red/danger color | Destructive: "Eliminar", "Cancelar" |
| `outline` | Transparent with border | Secondary: "Volver", "Cerrar" |
| `secondary` | Muted background | Tertiary: "Exportar", "Descargar" |
| `ghost` | Transparent background | Low-emphasis: "Más opciones" |
| `link` | Text-only, underlined | Navigation links |

#### Sizes

| Size | Height | Padding | Font Size | Usage |
|------|--------|---------|-----------|-------|
| `sm` | 36px | 12px horizontal | `text-sm` | Compact layouts, tables |
| `md` | 40px | 16px horizontal | `text-sm` | Default (most cases) |
| `lg` | 44px | 32px horizontal | `text-base` | Hero sections, important actions |
| `icon` | 40px | 8px (square) | `text-sm` | Icon-only buttons |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **default** | Base styles | `role="button"` (if not `<button>`) |
| **hover** | Background darken (`opacity-90`), shadow increase | Visual feedback only |
| **focus** | Ring (`ring-2 ring-ring ring-offset-2`) | Keyboard navigation, `tabindex="0"` |
| **active** | Scale down (`scale-95`), shadow decrease | Pressed state |
| **disabled** | `opacity-50`, `pointer-events-none` | `disabled` attribute, `aria-disabled="true"` |
| **loading** | Spinner overlay, `pointer-events-none` | `aria-busy="true"`, `aria-label="Loading"` |

#### Accessibility Requirements

```tsx
<button
  type="button"
  disabled={disabled}
  aria-disabled={disabled}
  aria-busy={loading}
>
  {loading ? (
    <>
      <Spinner className="mr-2" />
      <span className="sr-only">Loading</span>
    </>
  ) : children}
</button>
```

#### Implementation Template

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}
```

---

### Input

**Purpose**: Text input for forms and data entry.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Standard text input | Most form fields |
| `file` | File upload input | File attachments |

#### Sizes

| Size | Height | Padding | Font Size | Usage |
|------|--------|---------|-----------|-------|
| `sm` | 32px | 8px vertical, 12px horizontal | `text-sm` | Compact forms |
| `md` | 40px | 10px vertical, 16px horizontal | `text-sm` | Default |
| `lg` | 48px | 12px vertical, 20px horizontal | `text-base` | Large inputs (search) |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **default** | Border `border-input`, bg `bg-background` | `type="text/email/tel/etc"` |
| **hover** | Border darkens | Visual feedback |
| **focus** | Ring (`ring-2 ring-ring`), border `border-ring` | `aria-label` or `<label>` linked |
| **disabled** | `opacity-50`, `cursor-not-allowed` | `disabled` attribute |
| **error** | Border `border-destructive`, text `text-destructive` | `aria-invalid="true"`, `aria-describedby` |

#### Accessibility Requirements

```tsx
<input
  type="text"
  id={id}
  aria-invalid={error ? "true" : "false"}
  aria-describedby={error ? `${id}-error` : undefined}
  disabled={disabled}
/>

{error && (
  <span id={`${id}-error`} className="text-sm text-destructive">
    {error}
  </span>
)}
```

---

### Card

**Purpose**: Container for grouping related content.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Standard card with border and shadow | Content containers, information panels |

#### Sizes

No explicit sizes. Use padding classes (`p-4`, `p-6`, etc.).

#### States

| State | Styling | Usage |
|-------|---------|-------|
| **default** | Border `border-border`, shadow `--shadow`, bg `bg-card` | Resting state |
| **hover** | Shadow increase (`--shadow-md`), border slightly darker | Interactive cards |
| **active/selected** | Border `border-ring`, ring (`ring-1 ring-ring`) | Selected state |

#### Structure

```
┌─────────────────────────────────┐
│ Card Header (optional)          │
│ - Title (h3 or h4)             │
│ - Description (optional)       │
├─────────────────────────────────┤
│ Card Content (required)        │
│ - Main content area            │
├─────────────────────────────────┤
│ Card Footer (optional)         │
│ - Actions, metadata            │
└─────────────────────────────────┘
```

---

### Dialog (Modal)

**Purpose**: Modal overlay for focused interactions.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Centered modal with backdrop | Form dialogs, confirmations |

#### Sizes

| Size | Width | Usage |
|------|-------|-------|
| `sm` | `max-w-md` | Simple dialogs |
| `md` | `max-w-lg` | Default |
| `lg` | `max-w-2xl` | Complex forms |
| `xl` | `max-w-4xl` | Data tables, detailed views |
| `full` | `w-full h-full` | Full-screen modals |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **closed** | Hidden | N/A |
| **opening** | Backdrop fade-in (`opacity-0 → opacity-100`), modal scale-in (`scale-95 → scale-100`) | Transition |
| **open** | Visible, backdrop blur | `role="dialog"`, `aria-modal="true"` |
| **closing** | Reverse of opening | Transition |

#### Accessibility Requirements

```tsx
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
  >
    <Dialog.Title id="dialog-title">Title</Dialog.Title>
    <Dialog.Description id="dialog-description">Description</Dialog.Description>
    {/* Content */}
    <Dialog.Close aria-label="Close dialog">
      <X />
    </Dialog.Close>
  </Dialog.Content>
</Dialog.Root>
```

---

### Select

**Purpose**: Dropdown selection from a list.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Standard select dropdown | Form selections |

#### Sizes

| Size | Height | Font Size | Usage |
|------|--------|-----------|-------|
| `sm` | 32px | `text-sm` | Compact forms |
| `md` | 40px | `text-sm` | Default |
| `lg` | 48px | `text-base` | Prominent selections |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **closed** | Same as input | `aria-haspopup="listbox"` |
| **open** | Dropdown visible, border `border-ring` | `aria-expanded="true"` |
| **focus** | Ring (`ring-2 ring-ring`) | Keyboard navigation |
| **disabled** | `opacity-50`, `cursor-not-allowed` | `disabled` attribute |
| **error** | Border `border-destructive` | `aria-invalid="true"` |

---

### Checkbox

**Purpose**: Binary selection (on/off).

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Standard checkbox | Form selections, filters |

#### Sizes

| Size | Box Size | Usage |
|------|----------|-------|
| `sm` | 16px | Compact forms |
| `md` | 18px | Default |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **unchecked** | Empty box, border `border-input` | `aria-checked="false"` |
| **checked** | Filled with checkmark, bg `bg-primary` | `aria-checked="true"` |
| **indeterminate** | Dash icon, bg `bg-primary` | `aria-checked="mixed"` |
| **focus** | Ring (`ring-2 ring-ring`) | Keyboard navigation |
| **disabled** | `opacity-50`, `cursor-not-allowed` | `disabled` attribute |

---

### Radio

**Purpose**: Single selection from multiple options.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Standard radio button | Exclusive selections |

#### Sizes

| Size | Box Size | Usage |
|------|----------|-------|
| `sm` | 16px | Compact forms |
| `md` | 18px | Default |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **unchecked** | Empty circle, border `border-input` | `aria-checked="false"` |
| **checked** | Filled circle, border `border-primary` | `aria-checked="true"` |
| **focus** | Ring (`ring-2 ring-ring`) | Keyboard navigation |
| **disabled** | `opacity-50`, `cursor-not-allowed` | `disabled` attribute |

---

### Switch

**Purpose**: Toggle binary state (on/off) with animation.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Standard toggle switch | Settings, preferences |

#### Sizes

| Size | Width/Height | Usage |
|------|--------------|-------|
| `sm` | 36px / 20px | Compact settings |
| `md` | 44px / 24px | Default |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **off** | Gray bg, thumb left | `aria-checked="false"` |
| **on** | Primary bg, thumb right | `aria-checked="true"` |
| **focus** | Ring (`ring-2 ring-ring`) | Keyboard navigation |
| **disabled** | `opacity-50`, `cursor-not-allowed` | `disabled` attribute |

---

### Badge

**Purpose**: Label/tag for status or category.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Primary color | Status indicators |
| `secondary` | Secondary color | Tags, categories |
| `destructive` | Destructive color | Error states |
| `outline` | Transparent with border | Inactive states |

#### Sizes

| Size | Padding | Font Size | Usage |
|------|---------|-----------|-------|
| `sm` | 2px 8px | `text-xs` | Compact tags |
| `md` | 4px 10px | `text-sm` | Default |

---

### Avatar

**Purpose**: User profile image or initials.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Standard avatar | User profiles |

#### Sizes

| Size | Width/Height | Font Size | Usage |
|------|--------------|-----------|-------|
| `sm` | 24px | `text-xs` | Compact lists |
| `md` | 32px | `text-sm` | Tables, cards |
| `lg` | 40px | `text-base` | Headers, profiles |
| `xl` | 56px | `text-lg` | Hero sections |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **image** | Rounded, cropped image | `alt` text |
| **initials** | Filled bg, initials centered | `aria-label` |
| **fallback** | Icon placeholder | `aria-label` |

---

### Tooltip

**Purpose**: Contextual help text on hover/focus.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Standard tooltip | Help text, context |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **hidden** | `opacity-0`, `pointer-events-none` | N/A |
| **visible** | `opacity-100`, z-index `--z-tooltip` | `role="tooltip"` |

---

### Table

**Purpose**: Structured data display.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Standard table | Data grids |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **default** | Alternating row bg (`bg-background/50`) | `role="table"` |
| **hover row** | Row highlight on hover | Visual feedback |
| **selected row** | Active bg (`bg-accent`) | `aria-selected="true"` |
| **sortable** | Sort icon in header | `aria-sort` |

---

### Tabs

**Purpose**: Tabbed content navigation.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Standard tabs | Content organization |

#### Sizes

| Size | Padding | Font Size | Usage |
|------|---------|-----------|-------|
| `sm` | 8px 12px | `text-sm` | Compact tabs |
| `md` | 10px 16px | `text-sm` | Default |
| `lg` | 12px 20px | `text-base` | Large tabs |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **inactive** | Transparent bg, text `muted-foreground` | `aria-selected="false"` |
| **active** | Active indicator (border-bottom), text `foreground` | `aria-selected="true"` |
| **disabled** | `opacity-50`, `cursor-not-allowed` | `disabled` attribute |

---

### Accordion

**Purpose**: Expandable/collapsible content sections.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Standard accordion | FAQ, settings sections |

#### Sizes

| Size | Padding | Usage |
|------|---------|-------|
| `sm` | 12px | Compact content |
| `md` | 16px | Default |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **collapsed** | Chevron down, content hidden | `aria-expanded="false"` |
| **expanded** | Chevron up, content visible | `aria-expanded="true"` |
| **disabled** | `opacity-50`, `cursor-not-allowed` | `disabled` attribute |

---

### Dropdown Menu

**Purpose**: Context menu with actions.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Standard dropdown | Actions menu |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **closed** | Hidden | `aria-haspopup="true"`, `aria-expanded="false"` |
| **open** | Visible, z-index `--z-dropdown` | `aria-expanded="true"` |
| **item hover** | Bg `accent`, text `accent-foreground` | Visual feedback |

---

### Alert

**Purpose**: Notification/alert message.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Neutral color | Information |
| `destructive` | Destructive color | Errors, warnings |

#### Structure

```
┌─────────────────────────────────────┐
│ [Icon] Title (h4 or h5)           │
│ Description text (optional)        │
└─────────────────────────────────────┘
```

---

### Toast

**Purpose**: Non-intrusive notification.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Neutral color | Success/info toasts |
| `destructive` | Destructive color | Error toasts |

#### States

| State | Styling | Accessibility |
|-------|---------|---------------|
| **entering** | Slide from bottom, fade in | Transition |
| **visible** | Bottom-right fixed, z-index `--z-toast` | `role="status"`, `aria-live="polite"` |
| **exiting** | Slide to bottom, fade out | Transition |

---

## Layout Patterns

### Grid System

#### Container Width

| Breakpoint | Max Width | Padding |
|------------|-----------|---------|
| `xs` | 100% | 16px (mobile) |
| `sm` | 100% | 16px |
| `md` | 768px | 24px |
| `lg` | 1024px | 32px |
| `xl` | 1280px | 48px |
| `2xl` | 1536px | 64px |

#### Grid Columns

Standard 12-column grid:

| Columns | Gap | Usage |
|---------|-----|-------|
| 2 cols | `gap-4` | Simple 2-column layouts |
| 3 cols | `gap-4` | Card grids |
| 4 cols | `gap-4` | Feature grids |
| 6 cols | `gap-4` | Form fields |
| 12 cols | `gap-4` | Complex layouts |

#### Grid Patterns

```tsx
{/* 2-Column Layout (Card Grid) */}
<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
  <Card>...</Card>
  <Card>...</Card>
</div>

{/* 3-Column Layout (Feature Grid) */}
<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>

{/* 4-Column Layout (Responsive) */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>...</Card>
</div>
```

### Container Patterns

#### Page Container

```tsx
<main className="container mx-auto px-4 py-8">
  {/* Page content */}
</main>
```

#### Section Container

```tsx
<section className="py-6">
  <div className="container mx-auto px-4">
    {/* Section content */}
  </div>
</section>
```

### Spacing Patterns

#### Vertical Stacking

```tsx
{/* Section to Section */}
<div className="space-y-6">
  <section>...</section>
  <section>...</section>
</div>

{/* Element to Element */}
<div className="space-y-4">
  <Card>...</Card>
  <Card>...</Card>
</div>
```

#### Horizontal Spacing

```tsx
{/* Button Group */}
<div className="flex items-center gap-2">
  <Button>Cancel</Button>
  <Button variant="default">Save</Button>
</div>
```

### Responsive Patterns

#### Mobile-First Approach

```tsx
{/* Mobile: stacked, Desktop: side-by-side */}
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">...</div>
  <div className="flex-1">...</div>
</div>

{/* Mobile: 1 column, Tablet: 2, Desktop: 3 */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>...</Card>
</div>
```

#### Hide/Show Elements

```tsx
{/* Hide on mobile, show on desktop */}
<div className="hidden md:block">
  {/* Desktop-only content */}
</div>

{/* Show on mobile only */}
<div className="block md:hidden">
  {/* Mobile-only content */}
</div>
```

---

## Usage Guidelines

### Component Selection

| Use Case | Component | Variant |
|----------|-----------|---------|
| Primary action in form | Button | `default` |
| Secondary action | Button | `outline` or `ghost` |
| Destructive action | Button | `destructive` |
| Navigation links | Button | `link` |
| Text input | Input | `default` |
| File upload | Input | `file` |
| Dropdown selection | Select | `default` |
| Binary toggle | Switch | `default` |
| Multiple choice | Checkbox | `default` |
| Single choice | Radio | `default` |
| Content grouping | Card | `default` |
| Modal dialog | Dialog | `default` |
| Alert message | Alert | `default` or `destructive` |
| Notification | Toast | `default` or `destructive` |

### Composition Rules

#### Card + Header + Content + Footer

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Form + Inputs + Buttons

```tsx
<Form>
  <div className="space-y-4">
    <FormField>
      <Label>Field Label</Label>
      <Input />
      <FormDescription>Helper text</FormDescription>
      <FormMessage>Error message</FormMessage>
    </FormField>

    <Button type="submit">Submit</Button>
  </div>
</Form>
```

#### Table + Pagination

```tsx
<div className="space-y-4">
  <Table>
    <TableHeader>...</TableHeader>
    <TableBody>...</TableBody>
  </Table>

  <Pagination>
    <PaginationContent>...</PaginationContent>
  </Pagination>
</div>
```

### Nutrifit-Specific Patterns

#### Patient Profile Card

```tsx
<Card>
  <CardHeader className="flex-row items-center gap-4">
    <Avatar src={patient.avatar} />
    <div>
      <CardTitle>{patient.name}</CardTitle>
      <CardDescription>Patient ID: {patient.id}</CardDescription>
    </div>
  </CardHeader>
  <CardContent>
    {/* Patient stats, current plan */}
  </CardContent>
</Card>
```

#### Nutrition Chart Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Macro Distribution</CardTitle>
    <CardDescription>Weekly average</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Chart using --chart-1 to --chart-5 */}
    <Chart data={macroData} colors={["--chart-1", "--chart-2", "--chart-3"]} />
  </CardContent>
</Card>
```

#### Data Table with Actions

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Patient</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {patients.map((patient) => (
      <TableRow key={patient.id}>
        <TableCell>{patient.name}</TableCell>
        <TableCell>
          <Badge variant={patient.status === "active" ? "default" : "secondary"}>
            {patient.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="icon">
            <MoreVertical />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Form with Validation

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Patient Name</FormLabel>
          <FormControl>
            <Input placeholder="John Doe" {...field} />
          </FormControl>
          <FormDescription>Enter the patient's full name</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />

    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? <Spinner className="mr-2" /> : null}
      Save Patient
    </Button>
  </form>
</Form>
```

### Accessibility Best Practices

1. **Keyboard Navigation**
   - All interactive elements must be keyboard accessible
   - Use `tabindex="0"` for custom elements
   - Ensure logical tab order

2. **Screen Reader Support**
   - Use semantic HTML (`<button>`, `<input>`, `<label>`)
   - Provide `aria-label` for icon-only buttons
   - Link labels to inputs with `htmlFor` or `aria-describedby`

3. **Color Contrast**
   - Minimum 4.5:1 for normal text (WCAG AA)
   - Minimum 3:1 for large text (18px+)
   - Don't rely on color alone (use icons, text labels)

4. **Focus States**
   - Visible focus ring (`ring-2 ring-ring`)
   - Don't remove outline unless replaced with custom focus style

5. **Error States**
   - Use `aria-invalid="true"` for invalid inputs
   - Provide `aria-describedby` linking to error message
   - Display error messages inline

### Performance Considerations

1. **Component Reusability**
   - Create reusable components from common patterns
   - Use variant systems (CVA) for consistent APIs

2. **Bundle Size**
   - Lazy load heavy components (charts, tables)
   - Use dynamic imports for modals

3. **Rendering Performance**
   - Memoize expensive computations
   - Use `React.memo` for large lists

4. **CSS Performance**
   - Prefer utility classes over inline styles
   - Use CSS custom properties for theming

---

## Implementation Guide

### Setup Steps

1. **Install shadcn/ui Components**

```bash
# Install CLI (if not already)
npm install -D shadcn

# Initialize shadcn/ui (if not already)
npx shadcn@latest init

# Add required components
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio
npx shadcn@latest add switch
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add tooltip
npx shadcn@latest add table
npx shadcn@latest add form
npx shadcn@latest add tabs
npx shadcn@latest add accordion
npx shadcn@latest add dropdown-menu
npx shadcn@latest add separator
npx shadcn@latest add scroll-area
npx shadcn@latest add skeleton
npx shadcn@latest add alert
npx shadcn@latest add toast
```

2. **Configure Tailwind CSS 4**

Update `src/index.css` with the design tokens defined in this spec.

3. **Create Utility Functions**

```ts
// src/lib/utils.ts (already exists with shadcn)
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

4. **Create Component Files**

All components should be in `src/components/ui/` directory.

### Component Implementation Checklist

For each component, ensure:

- [ ] Uses `cn()` utility for class merging
- [ ] Implements all required variants
- [ ] Implements all required states
- [ ] Includes accessibility attributes
- [ ] Uses design tokens (no hardcoded values)
- [ ] Supports dark mode
- [ ] Includes TypeScript types
- [ ] Has prop documentation

### Example: Button Implementation

```tsx
// src/components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### Testing Components

1. **Unit Tests**: Test component rendering and state changes
2. **Accessibility Tests**: Use axe-core or React Testing Library
3. **Visual Tests**: Use Storybook or similar for visual regression

---

## Patrones Implementados (Feb 2026)

Esta sección documenta estándares ya implementados en código para reutilizarlos en todo el sistema.

### 1) Arquitectura base de navegación y layout

- **App shell obligatorio**: Sidebar persistente + contenido principal por rutas.
- **Implementación de referencia**:
  - `src/components/layout/MainLayout.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/router.tsx`
  - `src/App.tsx`
- **Regla de reutilización**:
  - toda pantalla autenticada debe renderizar dentro de `MainLayout`.
  - no crear páginas full-screen aisladas fuera del shell salvo login/recuperación.

### 2) Sidebar profesional y navegación por rol

- **Sidebar estructurada en bloques**:
  - encabezado de marca
  - navegación principal
  - sección de sistema
  - footer de usuario activo + acción de logout
- **Visibilidad por rol** (role-based navigation disclosure):
  - cada item define `roles: []` y se filtra por `rol` actual.
  - evitar mostrar opciones sin permiso para reducir ruido cognitivo.
- **Regla de reutilización**:
  - cualquier módulo nuevo debe registrarse en Sidebar con `roles` explícitos.
  - no hardcodear navegación en páginas individuales.

### 3) Dashboard por permisos

- **Principio**: cada usuario autenticado entra a un dashboard acorde a su rol/permisos.
- **Estado actual**:
  - `Dashboard` muestra rol y permisos efectivos.
  - la navegación disponible se adapta a esos permisos/rol.
- **Regla de reutilización**:
  - priorizar tarjetas de resumen orientadas a tareas por rol.
  - evitar dashboards genéricos con información no accionable.

### 4) Estándar de modales (creación/edición)

- **Implementación de referencia**:
  - `src/components/ui/dialog.tsx`
  - `src/pages/Profesionales.tsx`
- **Comportamiento obligatorio**:
  - overlay oscuro + blur (`backdrop-blur-sm`)
  - cierre por click fuera del modal (overlay)
  - cierre por `Esc`
  - botón de cierre visible
  - `DialogTitle` + `DialogDescription` siempre presentes
- **Estructura recomendada de modal de formulario**:
  - header fijo con título/descripción
  - body scrolleable (`max-h + overflow-y-auto`)
  - footer fijo con acciones primarias/secundarias
  - formularios largos divididos en secciones semánticas

### 5) Formularios en modal: UX y consistencia

- **Reglas aplicadas**:
  - labels visibles (no depender solo de placeholder)
  - campos agrupados por dominio (personal/contacto/profesional)
  - acciones al pie (`Cancelar` + `Guardar/Crear`)
  - `autoComplete` controlado para evitar autofill confuso en credenciales
- **Regla de reutilización**:
  - altas/ediciones del sistema deben usar modal siguiendo esta estructura base.

### 6) Manejo de errores legibles para usuario

- **Problema resuelto**: evitar mostrar JSON crudo en toast.
- **Implementación de referencia**:
  - `src/lib/api.ts`
  - `src/contexts/AuthContext.tsx`
- **Reglas**:
  - mapear por status HTTP a mensajes humanos:
    - `401`: "Tu sesión venció. Volvé a iniciar sesión."
    - `403`: "No tenés permisos para realizar esta acción."
    - `404`: "No se encontró el recurso solicitado."
    - `5xx`: "Ocurrió un error del servidor. Intentá nuevamente."
  - en `401` limpiar sesión local y redirigir a `/login`.
  - no exponer estructura técnica de errores en UI final.

### 7) Contrato frontend/backend para errores

- **Backend** debe responder errores HTTP con status correcto (no convertir `401/403` en `500`).
- **Frontend** interpreta status + payload y transforma a mensaje UX.
- **Referencia backend**:
  - `nutrifit-supervisor-backend/src/infrastructure/common/filter/exception.filter.ts`

### 8) Checklist de adopción para nuevos módulos

Antes de publicar una nueva pantalla:

- [ ] Está integrada al router dentro de `MainLayout`.
- [ ] Tiene entrada en Sidebar con roles explícitos.
- [ ] Las altas/ediciones usan `Dialog` con overlay blur y cierre por fondo.
- [ ] Los formularios usan labels + secciones + footer de acciones.
- [ ] Los errores mostrados al usuario son legibles (sin JSON técnico).
- [ ] El flujo de sesión vencida (`401`) redirige correctamente a login.

### 9) Referencias de criterio (accesibilidad/enterprise UX)

Se tomaron como criterio general de diseño y documentación:

- WAI APG – Modal Dialog Pattern (estructura y accesibilidad)
- USWDS – Modal accessibility tests (validaciones WCAG para modales)
- Guías de dashboard enterprise (jerarquía de información y navegación contextual por rol)

### 10) Detalles técnicos validados en implementación

- **Sidebar y navegación**:
  - `src/components/layout/Sidebar.tsx` usa filtros por rol para ocultar enlaces no aplicables.
  - estado activo de enlaces con `activeProps` para mantener feedback visual consistente.
- **Permisos y contexto de sesión**:
  - `src/contexts/AuthContext.tsx` resuelve permisos con estructura tipo `Set` para búsquedas O(1).
- **Modales**:
  - overlay estándar `bg-black/50 backdrop-blur-sm`.
  - componentes de UI con `data-slot` para facilitar testing y composición consistente.
- **Diferenciación visual de blur**:
  - modal: `backdrop-blur-sm` (interacción focal).
  - sidebar: `backdrop-blur-xl` (atmósfera persistente del shell).

---

## Mantenimiento

### Versionado

- Major version (`1.x.x` → `2.x.x`): Breaking changes to tokens or components
- Minor version (`1.1.x` → `1.2.x`): New components or variants
- Patch version (`1.1.1` → `1.1.2`): Bug fixes, documentation updates

### Registro de cambios

Mantener un archivo `CHANGELOG.md` documentando todos los cambios del sistema de diseño.

### Deprecación de tokens

Cuando se depreca un token:
1. Marcarlo como `@deprecated` con instrucciones de migración.
2. Mantenerlo al menos por 2 versiones mayores.
3. Actualizar la documentación.

### Deprecación de componentes

Cuando se depreca un componente:
1. Marcarlo como `@deprecated` con componente de reemplazo.
2. Mantenerlo al menos por 1 versión mayor.
3. Actualizar todos los usos.

---

## Recursos

### Documentación

- [Tailwind CSS 4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)

### Accesibilidad

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project](https://www.a11yproject.com/)
- [React A11y Guide](https://reactjs.org/docs/accessibility.html)

### Herramientas

- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Tokens Studio](https://tokens.studio/)
- [Coolors](https://coolors.co/) - Color palette generation

---

**Fin de la especificación del sistema de diseño**

Para preguntas o contribuciones, contactar al equipo de frontend.


---

## Estilo Nutrifit Modern UI (Feb 2026)

Esta seccion documenta el estilo visual moderno implementado en Agenda.tsx y que debe aplicarse a todo el sistema.

### Principios de Diseno

1. **Uso completo del ancho**: `max-w-7xl mx-auto` para pantallas grandes
2. **Gradientes calidos**: Paleta orange-500 a rose-500 como acentos principales
3. **Jerarquia visual clara**: Headers prominentes, cards con elevacion sutil
4. **Micro-interacciones**: Hover effects, transiciones suaves
5. **Iconografia consistente**: Lucide icons con colores contextuales

### Estructura de Pagina Estandar

```tsx
<div className="space-y-8 max-w-7xl mx-auto pb-10">
  {/* Header moderno con gradiente */}
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
    <div className="relative z-10">
      <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
        <Icon className="h-8 w-8 text-orange-500" />
        Titulo de Pagina
      </h1>
      <p className="mt-2 text-muted-foreground max-w-2xl text-base">
        Descripcion clara de la pagina.
      </p>
    </div>
    {/* Formas decorativas difuminadas */}
    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
    <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
  </div>
  {/* Contenido principal */}
</div>
```

### Componentes Clave

#### 1. Tabs Estilo Pills

```tsx
<TabsList className="inline-flex h-auto w-full items-center justify-start gap-2 rounded-full bg-muted/50 p-1.5 lg:w-fit">
  <TabsTrigger value="tab1" className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-black/5">
    <div className="flex items-center gap-2"><Icon className="h-4 w-4" />Label</div>
  </TabsTrigger>
</TabsList>
```

#### 2. Cards con Borde Gradiente

```tsx
<Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
  <div className="h-2 w-full bg-gradient-to-r from-orange-400 to-rose-400" />
  <CardHeader><CardTitle className="text-xl">Titulo</CardTitle></CardHeader>
  <CardContent>{/* Contenido */}</CardContent>
</Card>
```

#### 3. Botones con Gradiente

```tsx
<Button className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all">
  <Icon className="mr-2 h-4 w-4" />Guardar
</Button>
```

#### 4. Badges por Estado

| Estado | Colores |
|--------|--------|
| Libre/Exito | emerald-100/700 |
| Bloqueado/Peligro | rose-100/700 |
| Pendiente/Advertencia | amber-100/700 |
| Confirmado/Info | blue-100/700 |

#### 5. Loading States

```tsx
<Loader2 className="h-8 w-8 animate-spin text-orange-500" />
```

#### 6. Empty States

```tsx
<div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed bg-muted/10">
  <Icon className="h-12 w-12 mb-4 opacity-20" />
  <p className="font-medium">No hay elementos</p>
</div>
```

### Reglas de Aplicacion

1. **TODO en espanol**: Labels, textos, mensajes, variables
2. **Usar `max-w-7xl mx-auto`** para aprovechar todo el ancho
3. **Header con gradiente** en todas las paginas principales
4. **Tabs estilo pills** para navegacion interna cuando aplique
5. **Badges sin border** (`border-0`) para look mas limpio
6. **Iconos consistentes** de Lucide con colores contextuales
