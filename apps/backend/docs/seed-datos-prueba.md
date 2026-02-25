# Guía de Datos de Prueba - NutriFit Supervisor

Este documento describe los datos de prueba creados por el seed completo para facilitar el testing del sistema.

## 🚀 Ejecución

```bash
cd nutrifit-supervisor-backend
npm run seed:completo
```

---

## 🔑 Credenciales de Acceso

**Contraseña única para todos los usuarios:** `123456`

### Administradores
| Email | Nombre | Rol |
|-------|--------|-----|
| `admin@nutrifit.com` | Agustin Suarez | ADMIN |
| `admin2@nutrifit.com` | Paula Roldan | ADMIN |

### Nutricionistas
| Email | Nombre | Matrícula | Agenda |
|-------|--------|-----------|--------|
| `nutri@nutrifit.com` | Lucia Bianchi | MN-1201 | Lun/Mié/Vie |
| `nutri2@nutrifit.com` | Martin Lopez | MN-1202 | Mar/Jue/Sáb |
| `nutri3@nutrifit.com` | Carla Mendez | MN-1203 | Lun-Mar-Mié-Jue (tarde) |

### Socios
| Email | Nombre | Ficha Salud | Mediciones |
|-------|--------|-------------|------------|
| `socio@nutrifit.com` | Juan Perez | ✅ Completa | 8 registros |
| `socio2@nutrifit.com` | Maria Gomez | ✅ Completa | 8 registros |
| `socio3@nutrifit.com` | Diego Ramirez | ✅ Completa | 8 registros |
| `socio4@nutrifit.com` | Ana Fernandez | ✅ Completa | 8 registros |
| `socio5@nutrifit.com` | Carlos Rodriguez | ✅ Completa | 8 registros |

---

## 📊 Datos por Módulo

### 1. Patologías (15 registros)
- Hipotiroidismo, Hipertiroidismo
- Diabetes Tipo 1, Diabetes Tipo 2
- Hipertensión arterial
- Celiaquía
- Síndrome de ovario poliquístico
- Anemia
- Gastritis, Reflujo gastroesofágico
- Hipercolesterolemia
- Obesidad
- Insuficiencia renal
- Enfermedad de Crohn, Colitis ulcerosa

### 2. Alergias (12 registros)
- Lactosa, Gluten
- Maní, Mariscos, Huevo, Soja
- Frutos secos, Pescado
- Apio, Mostaza, Sésamo
- Sulfitos

### 3. Fichas de Salud Completas

Cada socio tiene una ficha de salud con:
- ✅ Altura y peso de referencia
- ✅ Objetivo personal
- ✅ Nivel de actividad física
- ✅ Medicación actual
- ✅ Suplementos
- ✅ Cirugías previas
- ✅ Antecedentes familiares
- ✅ Frecuencia de comidas
- ✅ Consumo de agua diario
- ✅ Restricciones alimentarias
- ✅ Consumo de alcohol
- ✅ Tabaco
- ✅ Horas de sueño
- ✅ Contacto de emergencia
- ✅ Patologías asociadas
- ✅ Alergias

| Socio | Patologías | Alergias | Objetivo |
|-------|------------|----------|----------|
| Juan Perez | Hipotiroidismo | Lactosa | Perder peso |
| Maria Gomez | - | - | Ganar masa muscular |
| Diego Ramirez | Diabetes T2, Hipertensión, Obesidad | - | Reducir peso por salud |
| Ana Fernandez | Anemia | Maní, Mariscos | Mejorar hábitos |
| Carlos Rodriguez | Hipercolesterolemia, Gastritis | Gluten | Bajar colesterol |

### 4. Agendas de Nutricionistas

#### Lucia Bianchi (nutri@nutrifit.com)
| Día | Horario | Duración |
|-----|---------|----------|
| Lunes | 09:00 - 13:00 | 30 min |
| Lunes | 16:00 - 20:00 | 30 min |
| Miércoles | 09:00 - 13:00 | 30 min |
| Miércoles | 16:00 - 20:00 | 30 min |
| Viernes | 09:00 - 14:00 | 30 min |

#### Martin Lopez (nutri2@nutrifit.com)
| Día | Horario | Duración |
|-----|---------|----------|
| Martes | 08:00 - 12:00 | 30 min |
| Martes | 15:00 - 19:00 | 30 min |
| Jueves | 08:00 - 12:00 | 30 min |
| Jueves | 15:00 - 19:00 | 30 min |
| Sábado | 09:00 - 12:00 | 30 min |

#### Carla Mendez (nutri3@nutrifit.com)
| Día | Horario | Duración |
|-----|---------|----------|
| Lunes a Jueves | 14:00 - 18:00 | 30 min |

### 5. Turnos de Ejemplo

#### Históricos (ya procesados)
| Fecha | Socio | Nutricionista | Estado |
|-------|-------|---------------|--------|
| 2025-12-01 | Juan Perez | Lucia | REALIZADO |
| 2025-12-03 | Maria Gomez | Martin | REALIZADO |
| 2025-12-05 | Carlos Rodriguez | Lucia | REALIZADO |
| 2026-01-15 | Diego Ramirez | Lucia | AUSENTE |
| 2026-02-10 | Ana Fernandez | Carla | REALIZADO |
| 2026-02-12 | Maria Gomez | Lucia | CANCELADO |

#### Del día (20/02/2026)
| Hora | Socio | Nutricionista | Estado |
|------|-------|---------------|--------|
| 09:00 | Juan Perez | Lucia | PENDIENTE |
| 10:00 | Diego Ramirez | Lucia | CONFIRMADO |
| 11:30 | Ana Fernandez | Martin | CONFIRMADO |
| 16:00 | Carlos Rodriguez | Lucia | PENDIENTE |
| 17:30 | Maria Gomez | Martin | CONFIRMADO |

#### Futuros
- 21/02: 3 turnos
- 24/02: 2 turnos
- 25/02: 1 turno
- 26/02: 2 turnos

### 6. Mediciones de Progreso (40 registros totales)

Cada socio tiene **8 mediciones** distribuidas entre Diciembre 2025 y Febrero 2026.

#### Juan Perez - Evolución de Pérdida de Peso ✅
| Fecha | Peso | IMC | % Grasa | Tendencia |
|-------|------|-----|---------|-----------|
| 01/12 | 88.0 kg | 28.41 | 26% | Inicio |
| 08/12 | 87.2 kg | 28.15 | 25% | ⬇️ |
| 15/12 | 86.5 kg | 27.92 | 24% | ⬇️ |
| 22/12 | 85.8 kg | 27.69 | 23.5% | ⬇️ |
| 05/01 | 85.0 kg | 27.44 | 23% | ⬇️ |
| 12/01 | 84.2 kg | 27.18 | 22% | ⬇️ |
| 26/01 | 83.0 kg | 26.79 | 21% | ⬇️ |
| 16/02 | 82.5 kg | 26.63 | 20% | ⬇️ |

**Resultado:** -5.5 kg, IMC bajó de Sobrepeso a casi Normal

#### Maria Gomez - Ganancia Muscular 💪
| Fecha | Peso | IMC | % Grasa | Masa Magra |
|-------|------|-----|---------|------------|
| 03/12 | 56.0 kg | 21.34 | 20% | 44.8 kg |
| 10/12 | 56.5 kg | 21.53 | 19.5% | 45.5 kg |
| ... | ... | ... | ... | ... |
| 18/02 | 58.5 kg | 22.29 | 16.5% | 48.9 kg |

**Resultado:** +2.5 kg, pero bajó grasa corporal de 20% a 16.5%

#### Diego Ramirez - Caso Difícil (Obesidad) 📉
| Fecha | Peso | IMC | % Grasa | Presión |
|-------|------|-----|---------|---------|
| 02/12 | 112.0 kg | 34.57 | 35% | 145/95 |
| ... | ... | ... | ... | ... |
| 17/02 | 105.5 kg | 32.56 | 28.5% | 128/82 |

**Resultado:** -6.5 kg en 2.5 meses, mejoró presión arterial significativamente

#### Ana Fernandez - Estable con Mejora de Hábitos 🌱
Peso estable ~52 kg, mejoró niveles de hierro, normalizó anemia.

#### Carlos Rodriguez - Mejora Cardiovascular ❤️
| Fecha | Peso | IMC | Notas |
|-------|------|-----|-------|
| 05/12 | 97.0 kg | 32.79 | Colesterol alto |
| 20/02 | 89.5 kg | 30.25 | Colesterol normalizado |

**Resultado:** -7.5 kg, colesterol normalizado

### 7. Planes de Alimentación

#### Juan Perez - Plan de Pérdida de Peso
- **Nutricionista:** Lucia Bianchi
- **Objetivo:** Pérdida de peso gradual con mejoría metabólica
- **Estructura:** 7 días con 4-5 comidas cada uno
- **Ejemplo día Lunes:**
  - Desayuno: Huevo revuelto + tostadas integrales + fruta
  - Almuerzo: Pechuga de pollo + arroz integral + ensalada
  - Merienda: Yogur descremado + frutos secos
  - Cena: Pescado al horno + vegetales + quinoa

#### Maria Gomez - Plan de Ganancia Muscular
- **Nutricionista:** Martin Lopez
- **Objetivo:** Ganancia de masa muscular con entrenamiento
- **Estructura:** 5-6 comidas diarias con batidos de proteínas
- **Ejemplo día Lunes:**
  - Desayuno alto en proteínas (4 claras + 2 huevos + avena)
  - Colación pre-entreno: Batido de proteínas
  - Almuerzo: 200g pechuga + arroz + vegetales
  - Merienda post-entreno: Batido + creatina
  - Cena: Salmón + papa dulce + espárragos

---

## 🧪 Escenarios de Testing

### Escenario 1: Ver Progreso del Socio
1. Login como `socio@nutrifit.com`
2. Navegar a `/mi-progreso`
3. Verificar:
   - ✅ 8 mediciones en historial
   - ✅ Gráfico de evolución de peso (línea descendente)
   - ✅ Tarjetas de resumen con tendencias
   - ✅ IMC categoría cambió de "Sobrepeso" a casi "Normal"
   - ✅ Export CSV funciona

### Escenario 2: Consulta Profesional
1. Login como `nutri@nutrifit.com`
2. Navegar a `/turnos-profesional`
3. Seleccionar turno de Diego Ramirez (10:00)
4. Verificar:
   - ✅ Ficha de salud completa con patologías
   - ✅ Formulario de mediciones con secciones colapsables
   - ✅ Botón "Ver progreso" funciona
   - ✅ Progreso del paciente muestra 8 mediciones

### Escenario 3: Gestión de Turnos
1. Verificar turnos en diferentes estados:
   - PENDIENTE: 9:00 y 16:00
   - CONFIRMADO: 10:00, 11:30, 17:30
   - AUSENTE: turno histórico
   - CANCELADO: turno histórico
   - REALIZADO: turnos con mediciones

### Escenario 4: Plan de Alimentación
1. Login como `socio@nutrifit.com`
2. Navegar a `/mi-plan`
3. Verificar plan de 7 días con todas las comidas

### Escenario 5: Recepción
1. Login como admin
2. Navegar a `/recepcion/turnos`
3. Verificar lista de turnos del día
4. Probar check-in de paciente

---

## 📈 Métricas del Progreso

Para probar el módulo de progreso con datos significativos:

| Socio | Mediciones | Período | Δ Peso | Δ IMC |
|-------|------------|---------|--------|-------|
| Juan | 8 | 3 meses | -5.5 kg | -1.78 |
| Maria | 8 | 3 meses | +2.5 kg | +0.95 |
| Diego | 8 | 3 meses | -6.5 kg | -2.01 |
| Ana | 8 | 3 meses | +1.0 kg | +0.37 |
| Carlos | 8 | 3 meses | -7.5 kg | -2.54 |

---

## ⚠️ Notas Importantes

1. **MinIO:** Las imágenes de perfil se generan automáticamente como SVG con las iniciales del usuario
2. **Fechas:** Los turnos futuros están configurados para Febrero 2026
3. **Mediciones:** Cada medición tiene un turno asociado (algunos se crean automáticamente)
4. **Planes de alimentación:** Solo se incluyen los alimentos como texto, no se vinculan a la tabla de alimentos

---

## 🔄 Resetear Base de Datos

Para limpiar y volver a ejecutar el seed:

```bash
# Opción 1: Solo re-ejecutar (usa INSERT IGNORE/WHERE NOT EXISTS)
npm run seed:completo

# Opción 2: Limpiar tablas específicas primero
# (conectar a MySQL y truncar tablas, luego ejecutar seed)
```

---

## 📝 Estructura del Seed

```
seed-completo.ts
├── DATOS DE SEMILLA
│   ├── PATOLOGIAS (15)
│   ├── ALERGIAS (12)
│   ├── ACCIONES_PROFESIONAL (9)
│   ├── ACCIONES_ADMIN (6)
│   ├── ADMINS (2)
│   ├── NUTRICIONISTAS (3)
│   ├── SOCIOS (5)
│   ├── FICHAS_SALUD (5)
│   ├── MEDICIONES_POR_SOCIO (40 total)
│   ├── AGENDA_POR_NUTRICIONISTA (14 slots)
│   ├── TURNOS (19)
│   └── PLANES_ALIMENTACION (2)
└── LÓGICA DE INSERCIÓN
    ├── 1. Permisos y grupos
    ├── 2. Patologías y alergias
    ├── 3. Personas y usuarios
    ├── 4. Fichas de salud
    ├── 5. Agendas
    ├── 6. Turnos
    ├── 7. Mediciones
    └── 8. Planes de alimentación
```
