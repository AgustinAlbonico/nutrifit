# 01 — Registrar nutricionista: Errores detectados

> **Fuente**: `01-iteracion-base-nutricional.md §CU-01` — Pantalla `/nutricionistas`
> **Fecha de verificación**: 11/06/2026
> **Herramienta**: Playwright MCP

---

## 🔴 Errores funcionales

### 1. Falta campo obligatorio: duración de turno

- **Spec**: `duracionTurnoMin > 0` es obligatorio.
- **Realidad**: No existe el campo en el formulario ni se envía en el payload.
- **Datos enviados**: `{"nombre","apellido","dni","fechaNacimiento","telefono","genero","direccion","ciudad","provincia","email","matricula","aniosExperiencia","tarifaSesion","contrasena","presentacion"}`
- **Impacto**: No se puede configurar la duración por defecto de los turnos del nutricionista (ej: 30 min vs 45 min).

### 3. Contraseña manual en vez de generación automática

- **Spec**: RB32 — Sistema genera contraseña provisional: 12 chars, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo. Hasheada con bcrypt cost 12 o argon2id. `debe_cambiar_password = true`.
- **Realidad**: El formulario pide al usuario ingresar la contraseña manualmente con validación de requisitos.
- **Impacto**: El usuario debe inventar una contraseña en vez de recibirla automáticamente por email. No se fuerza el cambio en primer login desde la UI.

### 5. Falta campo diploma

- **Spec**: Diploma es opcional pero debe estar presente como campo de archivo en el formulario (B4: "Si diploma es obligatorio y falla, rollback transaccional").
- **Realidad**: No hay campo para subir diploma.
- La idea del diploma es que se pueda subir en formato archivo(pdf o foto) y que luego este lo pueda visualizar un socio al entrar al perfil del nutricionista

---

## 🟡 Problemas de UI/UX

### 6. Botón "Baja" no visible en el listado

- **Spec**: En la tabla de nutricionistas, los botones de acción incluyen "Ver", "Editar" y "Baja" (eliminar).
- **Realidad**: Solo se muestran "Ver" y "Editar". No hay botón "Baja" (ni siquiera condicional basado en permisos `Can`).
- **Posible causa**: El componente `<Can accion={ACCIONES.NUTRICIONISTAS_ELIMINAR}>` podría no estar evaluando correctamente o el backend no expone el permiso.

### 7. Sidebar sin link a Nutricionistas

- **Spec**: RECEPCIONISTA debería tener acceso visible a "Nutricionistas" en el sidebar.
- **Realidad**: En el sidebar solo aparecen: Dashboard, Turnos del día, Notificaciones, Configuración. No hay link a Nutricionistas ni a Profesionales.
- **Workaround**: La URL `/nutricionistas` funciona escribiéndola directamente.

### 8. Secciones no colapsables

- **Spec**: "Secciones colapsables: Datos personales, Datos profesionales, Datos opcionales, Gimnasios."
- **Realidad**: Todas las secciones aparecen siempre expandidas en el modal. No hay comportamiento colapsable.

---

## ✅ Funcionalidades que SÍ funcionan

- Login como RECEPCIONISTA y ADMIN.
- Ruta `/nutricionistas` accesible con datos precargados.
- Botón "Nuevo nutricionista" abre modal con formulario.
- Validación inline en frontend (campos requeridos, formato email, DNI 8 dígitos).
- DatePicker funcional para fecha de nacimiento.
- Requisitos de contraseña visibles con checkmarks.
- **Creación exitosa**: POST a `/profesional` → 201 Created.
- Modal se cierra automáticamente al crear con éxito.
- Listado se actualiza: "Resultados: 14" (antes 13).
- **Email duplicado**: POST → 409 Conflict, alerta visible "El email ya está registrado."
- Los datos del nutricionista creado aparecen correctamente en el listado.

---

## 🔵 Verificación 16/06/2026 — Playwright MCP

> **Estado**: 6/6 errores corregidos • 0 errores funcionales activos • 0 problemas UI/UX activos
> **Evidencia**: `ss-modal-nuevo-nutricionista.png`, `ss-contrasena-auto-generada.png`

### 🔴 Errores funcionales verificados

#### 1. Duración de turno — ✅ CORREGIDO

- **Spec**: `duracionTurnoMin > 0` obligatorio
- **Realidad**: Campo presente como `crear-duracion` con valor default 30. Payload enviado incluye `"duracionTurnoMin":30`.
- **Verificación**: Input ID `crear-duracion` visible, `spinbutton "Duración del turno (minutos) *"` con valor 30.

#### 3. Contraseña automática — ✅ CORREGIDO

- **Spec**: Sistema genera contraseña provisional de 12 chars
- **Realidad**: No hay campo de contraseña en el formulario. El backend genera `contrasenaProvisional: "AvkzSt*Q7!7$"` y la UI muestra un modal **"Contraseña provisional generada"** con la contraseña, botón "Copiar" y mensaje "El nutricionista deberá cambiarla en su primer inicio de sesión".
- **Verificación**: Request body no incluye `contrasena`. Response incluye `contrasenaProvisional`. Modal visible con código y copia.

#### 5. Diploma — ✅ CORREGIDO

- **Spec**: Diploma opcional como campo de archivo
- **Realidad**: Campo presente: `button "Diploma / Matrícula profesional (PDF o imagen, opcional)"` con input file `crear-diploma`. Texto ayuda: "El documento se mostrará al socio desde el perfil del profesional."
- **Verificación**: Elemento visible en sección Datos profesionales.

### 🟡 Problemas UI/UX verificados

#### 6. Botón "Baja" — ✅ CORREGIDO

- **Spec**: Tabla debe incluir botón Baja
- **Realidad**: Cada fila tiene `button "Ver"`, `button "Editar"`, `button "Baja"`. Visible tanto para ADMIN como RECEPCIONISTA.
- **Verificación**: 9 filas visibles con los 3 botones (Ver, Editar, Baja).

#### 7. Sidebar Nutricionistas — ✅ CORREGIDO

- **Spec**: RECEPCIONISTA debe ver link a Nutricionistas
- **Realidad**: Logueado como `recepcion-central@nutrifit.com` el sidebar muestra: Dashboard, **Nutricionistas**, Turnos del día, Notificaciones, Configuración.
- **Verificación**: Link `ref=e38` con URL `/nutricionistas` visible en sidebar.

#### 8. Secciones colapsables — ✅ CORREGIDO

- **Spec**: Secciones deben ser colapsables
- **Realidad**: Las secciones del modal son botones `<button>` con estado `[expanded]`: "Datos personales", "Contacto y ubicación", "Datos profesionales". Al hacer clic se contraen/expanden.
- **Verificación**: Atributo `expanded` presente en los 3 botones de sección.

### 💡 Observaciones adicionales

- El email del nutricionista creado vuelve vacío en la respuesta (`"email":""`), aunque se envió correctamente en el request. Posible bug de serialización.
- La contraseña provisional no incluye explícitamente `debe_cambiar_password: true` en la respuesta de creación, aunque el modal UI dice "deberá cambiarla en su primer inicio de sesión".
- POST `/profesional` responde 201 Created correctamente.
- GET `/profesional` se refresca automáticamente mostrando "Resultados: 20" (antes 19).

---
