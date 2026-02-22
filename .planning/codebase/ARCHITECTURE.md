# Nutrifit Supervisor - Architecture Map

**Generated:** 2026-02-21

## System Overview

Nutrifit Supervisor is a **nutrition and fitness management platform** for gyms/fitness centers. It connects members (socios) with nutritionists (nutricionistas) for appointment scheduling, health tracking, and meal planning.

---

## Architecture Pattern

**Monorepo** with two applications:

```
Nutrifit Supervisor - Software/
├── nutrifit-supervisor-backend/   # NestJS API (Clean Architecture)
├── nutrifit-supervisor-frontend/  # React SPA
└── docs/                          # Documentation
```

---

## Backend Architecture (Clean Architecture)

```
nutrifit-supervisor-backend/src/
├── domain/                    # Core business rules
│   └── entities/              # Domain entities + repository interfaces
│       ├── Alimento/          # Food/nutrition data
│       ├── Agenda/            # Professional schedules
│       ├── FichaSalud/        # Health records
│       ├── ObservacionClinica/# Clinical notes
│       ├── OpcionComida/      # Meal options
│       ├── Persona/           # Person types (Socio, Nutricionista, Asistente)
│       ├── PlanAlimentacion/  # Meal plans
│       ├── Turno/             # Appointments
│       └── Usuario/           # Users + auth
│
├── application/               # Use cases + DTOs
│   ├── agenda/                # Schedule management
│   ├── auth/                  # Authentication
│   ├── planes-alimentacion/   # Meal plans
│   ├── profesionales/         # Nutritionist management
│   ├── socios/                # Member management
│   └── turnos/                # Appointment workflows
│
├── infrastructure/            # External concerns
│   ├── config/                # Configuration (TypeORM, env)
│   ├── persistence/           # Database (TypeORM entities)
│   ├── schedulers/            # Scheduled tasks
│   └── services/              # External services (JWT, MinIO)
│
└── presentation/              # HTTP layer
    └── http/controllers/      # NestJS controllers
```

### Key Architecture Decisions

1. **Clean Architecture**: Business logic isolated from infrastructure
2. **Repository Pattern**: Domain defines interfaces, infrastructure implements
3. **Use Case Pattern**: Single responsibility per use case
4. **DTOs**: Input/output boundaries for application layer

---

## Frontend Architecture

```
nutrifit-supervisor-frontend/src/
├── components/
│   ├── layout/                # Sidebar, header, navigation
│   └── ui/                    # shadcn/ui base components
│
├── contexts/                  # React Context (AuthContext)
├── lib/                       # Utilities (api, query-client, utils)
├── types/                     # TypeScript definitions
├── schemas/                   # Zod validation schemas
├── mocks/                     # MSW handlers (testing)
│
└── pages/                     # Route pages (21 pages)
    ├── Dashboard.tsx
    ├── Login.tsx
    ├── Socios.tsx
    ├── Nutricionistas.tsx
    ├── Turnos.tsx / TurnosProfesional.tsx
    ├── Agenda.tsx
    ├── AgendarTurno.tsx
    ├── ConsultaProfesionalPage.tsx
    ├── PlanEditorPage.tsx
    ├── ProgresoSocioPage.tsx / ProgresoPacientePage.tsx
    ├── FichaSaludSocio.tsx
    └── ...
```

### Key Frontend Patterns

1. **Hook-first components**: Custom hooks for data fetching
2. **Context for global state**: AuthContext for authentication
3. **TanStack Query**: Server state management
4. **TanStack Router**: Client-side routing
5. **shadcn/ui**: Component library (Radix + Tailwind)
6. **Spanish naming**: All code in Spanish

---

## Data Flow

```
┌──────────────┐     HTTP API      ┌──────────────┐
│   Frontend   │ ◄───────────────► │   Backend    │
│   (React)    │     JSON/REST     │   (NestJS)   │
└──────────────┘                   └──────┬───────┐
                                          │
                                   ┌──────▼──────┐
                                   │   MySQL     │
                                   │  Database   │
                                   └─────────────┘
```

---

## User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `ADMIN` | System administrator | Full access |
| `NUTRICIONISTA` | Nutritionist professional | Patient management, appointments |
| `SOCIO` | Gym member | Personal data, appointments, meal plans |
| `ASISTENTE` | Reception staff | Check-in, appointment management |

---

## Key Business Workflows

### 1. Appointment (Turno) Flow
```
SOCIO books → PENDIENTE → SOCIO confirms → CONFIRMADO → 
NUTRICIONISTA attends → REALIZADO/AUSENTE
```

### 2. Consultation Flow
```
NUTRICIONISTA starts consultation → Records measurements → 
Adds clinical observations → Creates/updates meal plan → Finalizes
```

### 3. Meal Plan Flow
```
NUTRICIONISTA creates plan → Adds daily meals → 
Assigns food options → SOCIO views plan
```

---

## Authentication & Authorization

- **Method**: JWT (JSON Web Tokens)
- **Library**: passport-jwt
- **Token Storage**: localStorage (frontend)
- **Permission System**: Role + Action-based permissions

---

## External Integrations

- **MinIO**: Object storage (file uploads)
- **Argentina timezone**: All dates in UTC-3

---

## See Also

- `STACK.md` - Technology stack details
- `ENTITIES.md` - Domain entity catalog
- `FEATURES.md` - Implemented features
