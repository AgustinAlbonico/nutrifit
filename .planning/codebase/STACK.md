# Nutrifit Supervisor - Technology Stack

**Generated:** 2026-02-21

---

## Backend Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Runtime** | Node.js | - |
| **Framework** | NestJS | 11.x |
| **Language** | TypeScript | 5.7.x |
| **ORM** | TypeORM | 0.3.25 |
| **Database** | MySQL | - |
| **Authentication** | Passport + JWT | passport-jwt 4.x |
| **Validation** | class-validator | 0.14.x |
| **API Docs** | Swagger | @nestjs/swagger 11.x |
| **Scheduling** | @nestjs/schedule | 6.x |
| **Object Storage** | MinIO | 8.x |
| **Security** | Helmet | 8.x |
| **Password Hashing** | bcrypt | 6.x |

### Backend Dev Dependencies

| Category | Technology |
|----------|------------|
| **Testing** | Jest 29.x |
| **E2E Testing** | Supertest |
| **Linting** | ESLint 9.x |
| **Formatting** | Prettier 3.x |

---

## Frontend Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | React | 19.x |
| **Build Tool** | Vite | 7.x |
| **Language** | TypeScript | 5.9.x |
| **Routing** | TanStack Router | 1.159.x |
| **Server State** | TanStack Query | 5.x |
| **State Management** | Zustand | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **Component Library** | Radix UI / shadcn | radix-ui 1.x |
| **Form Handling** | React Hook Form | 7.x |
| **Validation** | Zod | 4.x |
| **Date Handling** | date-fns | 4.x |
| **Charts** | Recharts | 3.x |
| **Icons** | Lucide React | 0.564.x |
| **Toast Notifications** | Sonner | 2.x |
| **Theme** | next-themes | 0.4.x |

### Frontend Dev Dependencies

| Category | Technology |
|----------|------------|
| **Testing** | Vitest 4.x |
| **Testing Library** | @testing-library/react |
| **Mocking** | MSW (Mock Service Worker) |
| **Linting** | ESLint 9.x |
| **Type Checking** | TypeScript strict mode |

---

## Database Schema (MySQL)

### Core Tables

| Table | Description |
|-------|-------------|
| `usuario` | User accounts (login credentials) |
| `persona` | Base person entity |
| `socio` | Gym members |
| `nutricionista` | Nutrition professionals |
| `asistente` | Reception staff |
| `turno` | Appointments |
| `agenda` | Professional schedules |
| `ficha_salud_socio` | Health records |
| `plan_alimentacion` | Meal plans |
| `dia_plan` | Daily meal schedule |
| `opcion_comida` | Meal options |
| `alimento` | Food database |
| `observacion_clinica` | Clinical notes |
| `formacion_academica` | Professional education |

### Enums

| Enum | Values |
|------|--------|
| `Rol` | ADMIN, NUTRICIONISTA, SOCIO, ASISTENTE |
| `EstadoTurno` | PENDIENTE, CONFIRMADO, CANCELADO, REALIZADO, AUSENTE, REPROGRAMADO |
| `DiaSemana` | LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO |
| `Genero` | MASCULINO, FEMENINO, OTRO |
| `TipoComida` | DESAYUNO, ALMUERZO, MERIENDA, CENA, COLACION |

---

## Project Structure Conventions

### Backend
- **Imports**: Absolute from `src/`
- **Naming**: Spanish for domain concepts
- **Testing**: `.spec.ts` files alongside source
- **Modules**: Feature-based (agenda, turnos, profesionales)

### Frontend
- **Imports**: `@/` alias for src
- **Naming**: ALL Spanish (components, functions, variables)
- **Testing**: `*.test.tsx` or `__tests__/` directory
- **Components**: `components/ui/` for base, `pages/` for routes

---

## Environment & Infrastructure

| Aspect | Details |
|--------|---------|
| **Timezone** | Argentina (UTC-3) |
| **Date Format** | ISO 8601 for API, localized for display |
| **API Format** | REST JSON |
| **Error Format** | `{ message: string, details?: any }` |

---

## Build & Deploy

### Backend
```bash
npm run build        # NestJS build
npm run start:prod   # Production server
npm test             # Run tests
```

### Frontend
```bash
npm run build        # TypeScript + Vite build
npm run typecheck    # Type check only
npm run lint         # ESLint
npm test             # Vitest
```
