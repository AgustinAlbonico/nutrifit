# Frontend Architecture Patterns - NutriFit Supervisor

## 1. SIDEBAR LAYOUT & ROLE-BASED NAVIGATION

### Pattern Implementation
- **File**: `src/components/layout/Sidebar.tsx`
- **Architecture**: Static sidebar with 72px fixed width, flex column layout
- **Key CSS**: `bg-card/50 backdrop-blur-xl transition-all duration-300`

### Role-Based Navigation Rules
```tsx
// Pattern: Filter links array by role
const filterLinks = (items: typeof links) =>
  items.filter((link) => link.roles.includes(rol || ''));

// Link configuration with roles array
const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'NUTRICIONISTA', 'SOCIO'] },
  { to: '/profesionales', label: 'Profesionales', icon: Users, roles: ['ADMIN'] },
];
```

### Active Link Styling Pattern
- **File**: `src/components/layout/Sidebar.tsx` (lines 98-101)
- Uses TanStack Router `activeProps` for state-based styling
- **Primary links**: `bg-primary text-primary-foreground shadow-md shadow-primary/20`
- **Secondary links**: `bg-secondary text-secondary-foreground`
- Reusable for any navigation component using TanStack Router

### Visual Hierarchy
- Header section: Logo + brand name (height: 80px)
- Main nav: Multiple filtered link groups with section labels
- Bottom nav: Settings and system options
- User footer: Status indicator with logout button
- Separators: `opacity-50` for visual breathing room

### Glass Effect Pattern
- **Implementation**: `backdrop-blur-xl` on sidebar background
- **Transparency**: `bg-card/50` (50% opacity background with blur)
- **Duration**: 300ms transitions for smooth state changes
- **Reusable**: Apply to any layered UI element needing depth effect

---

## 2. MODAL (DIALOG) UX & OVERLAY BEHAVIOR

### Modal Close-on-Overlay Pattern
- **File**: `src/components/ui/dialog.tsx`
- **Base Library**: Radix UI `DialogPrimitive`
- **Close Behavior**: Overlay click closes modal by default (Radix built-in)

### Overlay Styling
```tsx
// DialogOverlay component (lines 32-46)
className="data-[state=open]:animate-in data-[state=closed]:animate-out 
  data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
  fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
```

### Backdrop Blur Details
- **Blur Amount**: `backdrop-blur-sm` (4px blur for dialog)
- **Overlay Opacity**: `bg-black/50` (50% black with 50% transparency)
- **Animation**: Radix state-based animations (data-[state=open/closed])
- **Z-index**: `z-50` for modal stacking context
- **Duration**: 200ms default (inherited from Tailwind)

### Modal Content Pattern
```tsx
// DialogContent wrapper (lines 48-80)
// Features:
// - Max width: max-w-[calc(100%-2rem)] for responsive padding
// - Centered: fixed top-[50%] left-[50%] with translate transforms
// - Animation: zoom-in-95/zoom-out-95 with fade
// - Close button: Optional, top-right corner with accessibility
```

### DialogContent Props Extension
- **Custom prop**: `showCloseButton?: boolean` (default: true)
- **Accessibility**: `sr-only` span for close button label
- **Focus management**: `ring-offset-background focus:ring-ring` pattern
- **Mobile responsive**: `max-w-lg` for desktop, full width minus 2rem on mobile

### Dialog Component Composition
```tsx
<DialogContent showCloseButton={true}>
  <DialogHeader>
    <DialogTitle>Title</DialogTitle>
    <DialogDescription>Description</DialogDescription>
  </DialogHeader>
  <DialogFooter showCloseButton={false}>
    <Button>Action</Button>
  </DialogFooter>
</DialogContent>
```

### Usage Example in Pages
- **File**: `src/pages/Profesionales.tsx` (lines 242, 351)
- Modal max-width: `max-w-4xl p-0` for full-width content with custom padding
- Pattern: Dialog open/close state managed by page component
- Animation timing: Inherited from Radix + Tailwind data-state animations

---

## 3. ERROR HANDLING PATTERNS

### API Error Handling
- **File**: `src/lib/api.ts`
- **Function**: `apiRequest<T>(path, options): Promise<T>`

### Readable Error Messages (User-Facing)
```tsx
// Map HTTP status codes to Spanish messages
401: 'Tu sesión venció. Volvé a iniciar sesión.'
403: 'No tenés permisos para realizar esta acción.'
404: 'No se encontró el recurso solicitado.'
400: Extract first detail OR message field
5xx: 'Ocurrió un error del servidor. Intentá nuevamente en unos minutos.'
```

### Error Handling in Components
- **File**: `src/pages/Profesionales.tsx` (lines 70-76)
- **Pattern**: Try/catch with type narrowing
```tsx
try {
  const response = await apiRequest<ApiResponse<Profesional[]>>('/profesional', { token });
  setProfesionales(response.data);
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'No se pudieron cargar los profesionales';
  toast.error(errorMessage);  // Sonner toast for error display
}
```

### Auth Context Error Handling
- **File**: `src/contexts/AuthContext.tsx` (lines 49-54)
- **JSON Parse Safety**: Try/catch with localStorage cleanup
```tsx
try {
  return JSON.parse(raw) as AuthState;
} catch {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  return null;
}
```

### Session Expiry Handling
- **Automatic redirect on 401**: API layer redirects to `/login` on auth failure
- **Token cleanup**: localStorage cleared automatically
- **Window check**: `typeof window !== 'undefined'` for SSR safety

### Toast Notifications
- **Library**: Sonner
- **Usage**: `toast.error(message)`, `toast.success(message)`
- **Integration**: Replaces alert/console errors with user-friendly messages

---

## 4. COMPONENT COMPOSITION PATTERNS

### Base UI Components (shadcn-like)
- **Location**: `src/components/ui/`
- **Pattern**: Polymorphic components using Radix + Tailwind
- **Data Attributes**: `data-slot="component-name"` for semantic testing/styling

### Button Component
- **File**: `src/components/ui/button.tsx`
- **Variants**: default, destructive, outline, secondary, ghost, link
- **Sizes**: default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg
- **CVA Pattern**: Uses `class-variance-authority` for variant system
- **Polymorphic**: `asChild` prop for rendering as different element types

### Card Component
- **File**: `src/components/ui/card.tsx`
- **Structure**: Card > CardHeader > CardTitle/Description, CardContent, CardFooter
- **Layout**: Grid with container queries for responsive header
- **Data attributes**: `data-slot` for each sub-component

### Table Component
- **File**: `src/components/ui/table.tsx`
- **Wrapper**: Overflow container for responsive scrolling
- **States**: `data-[state=selected]:bg-muted` for row selection
- **Hover**: `hover:bg-muted/50` on all rows

### Dialog Components
- **Compound pattern**: Dialog > DialogTrigger, DialogContent, DialogHeader, DialogFooter
- **Portals**: DialogPortal manages z-index and mounting
- **Accessibility**: DialogTitle, DialogDescription for screen readers

---

## 5. DESIGN TOKENS & THEMING

### Token Hierarchy (CSS Custom Properties)
- **File**: `src/index.css`
- **Layer 1 - Primitives**: Color values (oklch format)
- **Layer 2 - Semantic**: background, foreground, primary, secondary, muted, accent
- **Layer 3 - Component**: Sidebar tokens, shadow tokens, animation tokens

### Color System
- **Format**: OKLch (perceptually uniform color space)
- **Light mode**: Bright backgrounds, dark text
- **Dark mode**: Dark backgrounds, light text
- **Destructive**: Status red (oklch(0.577 0.245 27.325) light, oklch(0.704 0.191 22.216) dark)

### Shadow System
- **Levels**: sm, md, lg, xl, 2xl
- **Dark mode shadows**: Increased opacity (0.3-0.7 vs 0.05-0.25)
- **CSS variables**: `--shadow-*` for reuse across components

### Animation Tokens
- **Durations**: instant (0ms), fast (100ms), default (150ms), medium (200ms), slow (300ms), slower (500ms)
- **Easings**: linear, in, out, in-out, spring, elastic
- **Transitions**: default, colors, transform, shadow, modal

### Accessibility
- **Prefers-reduced-motion**: All animations disabled when enabled
- **Focus rings**: `focus-visible:ring-ring/50` pattern
- **ARIA labels**: `sr-only` for hidden descriptive text

### Sidebar-Specific Tokens
- **Separate namespace**: `--sidebar-*` variants for light/dark
- **Primary color override**: Chart colors in dark mode for visibility
- **Border transparency**: Light mode solid, dark mode transparent

### Utility Classes
- **Glassmorphism**: `.glass` class (backdrop-blur-12px + semi-transparent background)
- **Motion design**: `.hover-lift`, `.hover-scale`, `.pulse-subtle`
- **Gradients**: `.gradient-progress`, `.gradient-chart`

---

## 6. STATE MANAGEMENT PATTERNS

### Auth Context Pattern
- **File**: `src/contexts/AuthContext.tsx`
- **Provider pattern**: AuthProvider wraps app, useAuth hook consumes
- **Local storage sync**: useEffect syncs auth state to localStorage
- **Permission checking**: Set-based lookup for O(1) permission checks

### Form State Management
- **File**: `src/pages/Profesionales.tsx` (lines 33-65)
- **Pattern**: Separate state objects for create vs edit forms
- **Default values**: Objects with all required fields initialized
- **Reset on close**: Repopulate form fields after successful submission

### Dialog State Management
- **Open/close**: Simple boolean `useState`
- **Prefill on edit**: Set form state when dialog opens for edit mode
- **Reset on close**: Clear form or set default values

---

## 7. RESPONSIVE DESIGN PATTERNS

### Tailwind Breakpoints Used
- **Mobile first**: Base styles for mobile, then screen prefixes
- **Container queries**: `@container/card-header` for component-level responsiveness
- **Responsive max-width**: `max-w-[calc(100%-2rem)]` for padding on small screens

### Dialog Responsiveness
- **Desktop**: `max-w-lg` (32rem)
- **Mobile**: Full width minus 32px (`calc(100% - 2rem)`)
- **Padding**: Content-aware padding in modal

### Sidebar Responsiveness
- **Fixed width**: 288px (72 * 4) - not responsive
- **Scrolling**: `flex-1` and `overflow-y-auto` for tall content
- **Note**: Consider adding mobile drawer pattern for smaller screens

---

## Reusable Rules for DESIGN_SYSTEM.md

1. **Dialog overlays always use `bg-black/50 backdrop-blur-sm`** for consistent depth
2. **State-based animations use `data-[state=open/closed]` Radix pattern**
3. **Error messages must be localized and status-code-specific** (use `obtenerMensajeLegible` pattern)
4. **Role-based filtering via `array.filter(item => item.roles.includes(rol))` for UI**
5. **All async operations use try/catch with `err instanceof Error` type guard**
6. **Navigation links use TanStack Router `activeProps` for state-driven styling**
7. **Permissions checked at component level using Context + Set-based lookup**
8. **Component exports use compound pattern**: Container > Header/Content/Footer
9. **Data attributes (`data-slot`) used for semantic testing across all components**
10. **Sidebar glass effect: `bg-card/50 backdrop-blur-xl transition-all duration-300`**
