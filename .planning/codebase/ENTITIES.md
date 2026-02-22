# Nutrifit Supervisor - Domain Entities

**Generated:** 2026-02-21

---

## Entity Catalog

### Person Entities

#### `Persona` (Base)
```typescript
{
  idPersona: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: Date;
  genero: Genero;
  telefono: string;
  email: string;
  direccion: string;
}
```

#### `Socio` (extends Persona)
Member who uses gym services and books appointments.
```typescript
{
  // Inherits Persona
  fichaSalud: FichaSaludSocio;
  turnos: Turno[];
  planesAlimentacion: PlanAlimentacion[];
}
```

#### `Nutricionista` (extends Persona)
Professional who provides nutrition consultations.
```typescript
{
  // Inherits Persona
  matricula: string;
  especialidad: string;
  formacionAcademica: FormacionAcademica[];
  agenda: Agenda[];
  turnos: Turno[];
  activo: boolean;
}
```

#### `Asistente` (extends Persona)
Reception staff who manages check-in.
```typescript
{
  // Inherits Persona
}
```

---

### Authentication Entities

#### `Usuario`
User account for authentication.
```typescript
{
  idUsuario: number;
  email: string;
  password: string; // Hashed
  rol: Rol;
  persona: Persona;
  activo: boolean;
}
```

#### `AuthenticatedUser`
Session user with permissions.
```typescript
{
  idUsuario: number;
  email: string;
  rol: Rol;
  permisos: string[];
}
```

---

### Appointment Entities

#### `Turno`
Appointment between Socio and Nutricionista.
```typescript
{
  idTurno: number;
  fechaTurno: Date;
  horaTurno: string; // HH:mm
  estadoTurno: EstadoTurno;
  socio: Socio;
  nutricionista: Nutricionista;
  observacionClinica: ObservacionClinica | null;
}
```

#### `EstadoTurno` (Enum)
```
PENDIENTE → CONFIRMADO → REALIZADO
    ↓           ↓
CANCELADO   AUSENTE
    ↓
REPROGRAMADO
```

---

### Schedule Entities

#### `Agenda`
Professional's weekly schedule.
```typescript
{
  idAgenda: number;
  nutricionista: Nutricionista;
  dia: DiaSemana;
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  duracionTurno: number; // Minutes
}
```

#### `DiaSemana` (Enum)
```
LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO
```

---

### Health Entities

#### `FichaSaludSocio`
Health record for a member.
```typescript
{
  idFichaSalud: number;
  socio: Socio;
  altura: number;
  peso: number;
  objetivo: string;
  nivelActividadFisica: NivelActividadFisica;
  frecuenciaComidas: FrecuenciaComidas;
  consumeAlcohol: ConsumoAlcohol;
  fuma: boolean;
  alergias: Alergia[];
  patologias: Patologia[];
  medicamentos: string;
  antecedentesFamiliares: string;
}
```

#### `ObservacionClinica`
Clinical notes from a consultation.
```typescript
{
  idObservacion: number;
  turno: Turno;
  notas: string;
  mediciones: Medicion[];
}
```

---

### Meal Plan Entities

#### `PlanAlimentacion`
Meal plan assigned to a Socio.
```typescript
{
  idPlan: number;
  socio: Socio;
  nutricionista: Nutricionista;
  nombre: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date | null;
  activo: boolean;
  dias: DiaPlan[];
}
```

#### `DiaPlan`
Daily meal schedule.
```typescript
{
  idDiaPlan: number;
  plan: PlanAlimentacion;
  dia: DiaSemana;
  opciones: OpcionComida[];
}
```

#### `OpcionComida`
A meal option (breakfast, lunch, etc.).
```typescript
{
  idOpcion: number;
  tipoComida: TipoComida;
  descripcion: string;
  alimentos: Alimento[];
}
```

#### `TipoComida` (Enum)
```
DESAYUNO, ALMUERZO, MERIENDA, CENA, COLACION
```

---

### Food Entities

#### `Alimento`
Food item with nutritional info.
```typescript
{
  idAlimento: number;
  nombre: string;
  grupoAlimenticio: GrupoAlimenticio;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  unidadMedida: UnidadMedida;
}
```

#### `GrupoAlimenticio`
Food group category.
```typescript
{
  idGrupo: number;
  nombre: string;
  alimentos: Alimento[];
}
```

---

## Entity Relationships

```
Usuario ──1:1──► Persona
                    │
                    ├── 1:1 ──► Socio ──1:N──► Turno
                    │                        │
                    │                        ├── N:1 ──► Nutricionista
                    │                        │
                    │                        └── 1:1 ──► ObservacionClinica
                    │
                    ├── 1:1 ──► Nutricionista ──1:N──► Agenda
                    │                              │
                    │                              └── 1:N ──► Turno
                    │
                    └── 1:1 ──► Asistente

Socio ──1:1──► FichaSaludSocio ──N:N──► Alergia
                                └── N:N ──► Patologia

Socio ──1:N──► PlanAlimentacion ──1:N──► DiaPlan ──1:N──► OpcionComida
                                                           │
                                                           └── N:N ──► Alimento
```

---

## Repository Interfaces

Defined in `domain/entities/*/`:

| Repository | Purpose |
|------------|---------|
| `UsuarioRepository` | User authentication |
| `SocioRepository` | Member management |
| `NutricionistaRepository` | Professional management |
| `TurnoRepository` | Appointment operations |
| `AgendaRepository` | Schedule management |
| `AlimentoRepository` | Food database |
