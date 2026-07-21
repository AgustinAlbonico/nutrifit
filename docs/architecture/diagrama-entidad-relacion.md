# Diagrama Entidad-Relación — NutriFit Supervisor

```mermaid
erDiagram
    %% ==================== TENANT ====================
    gimnasio {
        int id PK
        varchar nombre "NOT NULL"
        varchar direccion
        varchar telefono
        varchar email_contacto UK
        varchar logo_url
        varchar color_primario
        varchar color_secundario
        int plazo_maximo_cancelacion_hs "default 24"
        int plazo_minimo_reserva_hs "default 1"
        int plazo_maximo_reprogramacion_hs "default 12"
        int max_ausencias_consecutivas "default 3"
        int max_turnos_futuros "default 5"
        boolean activo "default true"
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    %% ==================== PERSONAS (TABLE_PER_CLASS / JOINED) ====================
    persona {
        int id PK
        int id_gimnasio FK "NOT NULL"
        varchar tipo_persona "socio | nutricionista | recepcionista"
        varchar nombre
        varchar apellido
        varchar dni UK
        varchar telefono
        date fecha_nacimiento
        varchar genero
        varchar direccion
        varchar foto_url
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    socio {
        int id PK, FK
        int talla_calzado "nullable"
        varchar objetivo "nullable"
    }

    nutricionista {
        int id PK, FK
        varchar matricula_profesional
        text biografia
        varchar foto_url
    }

    recepcionista {
        int id PK, FK
    }

    usuario {
        int id PK
        int id_persona FK "nullable, UK"
        varchar email UK
        varchar password_hash
        varchar rol "enum: ADMIN | SUPERADMIN | NUTRICIONISTA | RECEPCIONISTA | SOCIO"
        boolean activo
        datetime ultimo_acceso
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    %% ==================== RBAC ====================
    grupo_permiso {
        int id PK
        varchar clave UK "ej: turnos.gestion"
        varchar nombre
        text descripcion
        boolean es_grupo_sistema
        datetime created_at
        datetime updated_at
    }

    accion {
        int id PK
        varchar codigo UK "ej: turnos:crear"
        varchar nombre
        text descripcion
        varchar contexto "gimnasio | sistema"
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    grupo_permiso_accion {
        int id_grupo_permiso PK, FK
        int id_accion PK, FK
    }

    grupo_permiso_hijo {
        int id_grupo_padre PK, FK
        int id_grupo_hijo PK, FK
    }

    usuario_grupo_permiso {
        int id PK
        int id_usuario FK
        int id_gimnasio FK "nullable"
        int id_grupo_permiso FK
    }

    usuario_accion {
        int id_usuario PK, FK
        int id_accion PK, FK
        int id_gimnasio FK "nullable"
    }

    %% ==================== AGENDA ====================
    agenda {
        int id PK
        int id_nutricionista FK "NOT NULL"
        varchar dia_semana "NOT NULL, enum lun-dom"
        time hora_inicio
        time hora_fin
        int duracion_turno_minutos
        boolean activo "default true"
        datetime created_at
        datetime updated_at
        datetime fecha_baja
        UK "id_nutricionista, dia_semana, hora_inicio, hora_fin"
    }

    excepcion_disponibilidad {
        int id PK
        int id_agenda FK
        date fecha_desde
        date fecha_hasta
        time hora_inicio "nullable"
        time hora_fin "nullable"
        varchar motivo "feriado | licencia | personal | otro"
        boolean disponible "default false"
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    %% ==================== TURNOS ====================
    turno {
        int id PK
        int id_socio FK "NOT NULL"
        int id_nutricionista FK "NOT NULL"
        int id_gimnasio FK "NOT NULL"
        datetime fecha_hora_inicio
        datetime fecha_hora_fin
        varchar estado "CONFIRMADO | PRESENTE | EN_CURSO | REALIZADO | CANCELADO | AUSENTE | NO_ASISTIO"
        boolean confirmado_por_socio
        datetime fecha_check_in
        datetime fecha_consulta_inicio
        datetime fecha_consulta_fin
        datetime fecha_marcar_ausente
        datetime fecha_cierre_automatico
        text motivo_cancelacion
        text notas
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    observacion_clinica {
        int id PK
        int id_turno FK "UK, NOT NULL"
        decimal peso
        decimal altura
        decimal imc
        text comentario
        boolean es_publica "default false"
        int version "NOT NULL"
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    medicion {
        int id PK
        int id_turno FK
        decimal peso "obligatorio"
        decimal altura "obligatorio"
        decimal imc "obligatorio"
        decimal perimetro_cintura
        decimal perimetro_cadera
        decimal perimetro_brazo
        decimal perimetro_muslo
        decimal perimetro_pecho
        decimal pliegue_tricipital
        decimal pliegue_bicipital
        decimal pliegue_subescapular
        decimal masa_grasa_porcentaje
        decimal masa_muscular_porcentaje
        int presion_sistolica
        int presion_diastolica
        int frecuencia_cardiaca
        text notas_medicion
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    adjunto_clinico {
        int id PK
        int id_turno FK "NOT NULL"
        int id_usuario_subio FK "NOT NULL"
        varchar nombre_original
        varchar mime_type
        int size_bytes
        varchar object_key
        boolean es_post_cierre "default false"
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    %% ==================== FICHA SALUD ====================
    ficha_salud {
        int id PK
        int id_socio FK "UK, NOT NULL"
        int version_actual_id FK "nullable"
        int id_gimnasio FK
        text motivo_consulta
        text antecedentes_medicos
        text cirugias_previas
        text condiciones_medicas
        text medicacion_actual
        varchar fumador
        varchar actividad_fisica_previa
        text alergias_conocidas
        varchar contacto_emergencia_nombre
        varchar contacto_emergencia_telefono
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    ficha_salud_version {
        int id PK
        int id_ficha FK
        int version
        json snapshot
        int id_creador FK "usuario"
        datetime created_at
    }

    patologia {
        int id PK
        varchar nombre UK
        varchar descripcion
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    alergia {
        int id PK
        varchar nombre UK
        varchar descripcion
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    ficha_salud_patologia {
        int id_ficha PK, FK
        int id_patologia PK, FK
    }

    ficha_salud_alergia {
        int id_ficha PK, FK
        int id_alergia PK, FK
    }

    %% ==================== PLAN ALIMENTACION ====================
    plan_alimentacion {
        int id PK
        int id_socio FK
        int id_nutricionista FK
        varchar nombre
        varchar estado "BORRADOR | ACTIVO | FINALIZADO"
        int calorias_diarias
        varchar objetivo "perdida_peso | mantenimiento | aumento_muscular | rendimiento | salud_general"
        text observaciones
        boolean generado_por_ia
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    dia_plan {
        int id PK
        int id_plan FK
        varchar dia_semana
        int orden
        text notas
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    opcion_comida {
        int id PK
        int id_dia_plan FK
        varchar nombre
        varchar tipo_comida "desayuno | almuerzo | merienda | cena | colacion_1 | colacion_2"
        int orden
        text preparacion
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    item_comida {
        int id PK
        int id_opcion_comida FK
        int id_alimento FK
        varchar alimento_nombre "denormalizado"
        decimal cantidad
        varchar unidad_medida
        decimal porcion_estimada
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    %% ==================== ALIMENTOS ====================
    alimento {
        int id PK
        varchar nombre UK
        varchar categoria
        int calorias
        int proteinas
        int carbohidratos
        int grasas
        int fibra
        int sodio
        int azucar
        int grasas_saturadas
        int colesterol
        int vitamina_a
        int vitamina_c
        int vitamina_d
        int vitamina_e
        int vitamina_k
        int vitamina_b6
        int vitamina_b12
        int calcio
        int hierro
        int magnesio
        int zinc
        int potasio
        boolean activo
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    grupo_alimenticio {
        int id PK
        varchar nombre UK
        text descripcion
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    alimento_grupo_alimenticio {
        int id_alimento PK, FK
        int id_grupo_alimenticio PK, FK
    }

    %% ==================== GENERACION IA ====================
    generacion_plan_ia {
        int id PK
        int id_plan FK "nullable"
        int id_socio FK
        int id_nutricionista FK
        varchar estado "PENDIENTE | GENERANDO | COMPLETADO | ERROR | CANCELADO"
        json solicitud
        json respuesta
        json metadatos
        int progreso "default 0"
        text error_mensaje
        int intentos "default 0"
        boolean usa_memoria
        datetime created_at
        datetime updated_at
    }

    %% ==================== FOTOS PROGRESO ====================
    foto_progreso {
        int id PK
        int id_socio FK
        int id_turno FK "nullable"
        varchar tipo_foto "FRENTE | PERFIL | ESPALDA"
        varchar object_key
        date fecha_toma
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    %% ==================== OBJETIVOS ====================
    objetivo {
        int id PK
        int id_socio FK
        varchar tipo_metrica "peso | imc | cintura | cadera | brazo | muslo | pecho | grasa_corporal | masa_muscular | personalizado"
        decimal valor_inicial
        decimal valor_objetivo
        decimal valor_actual
        varchar estado "ACTIVO | COMPLETADO | ABANDONADO"
        text notas
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    %% ==================== NOTIFICACIONES ====================
    notificacion {
        int id PK
        int id_usuario FK "destinatario"
        varchar tipo "INFO | WARNING | ERROR | RECORDATORIO | LOGRO | PLAN_REVISAR | PLAN_DISPONIBLE | PLAN_VALIDACION_WARNING"
        varchar canal "in_app | email"
        varchar titulo
        text cuerpo
        json metadata
        varchar estado "PENDIENTE | NO_LEIDA | LEIDA | ENVIADA | ERROR_ENVIO"
        datetime leida_en
        datetime created_at
        datetime updated_at
        datetime fecha_baja
    }

    %% ==================== RELACIONES ====================

    %% TENANT
    gimnasio ||--o{ persona : "tiene"
    gimnasio ||--o{ usuario_grupo_permiso : "scope"
    gimnasio ||--o{ usuario_accion : "scope"
    gimnasio ||--o{ ficha_salud : "scope"
    gimnasio ||--o{ turno : "scope"

    %% PERSONAS
    persona ||--o| socio : "es"
    persona ||--o| nutricionista : "es"
    persona ||--o| recepcionista : "es"
    persona ||--o| usuario : "tiene"
    socio ||--o{ turno : "reserva"
    socio ||--o{ ficha_salud : "completa"
    socio ||--o{ plan_alimentacion : "sigue"
    socio ||--o{ generacion_plan_ia : "solicita"
    socio ||--o{ foto_progreso : "registra"
    socio ||--o{ objetivo : "persigue"

    %% USUARIO
    usuario ||--o{ notificacion : "recibe"
    usuario ||--o{ usuario_grupo_permiso : "pertenece a"
    usuario ||--o{ usuario_accion : "tiene permiso directo"
    usuario ||--o{ adjunto_clinico : "sube"
    usuario ||--o{ ficha_salud_version : "crea"

    %% NUTRICIONISTA
    nutricionista ||--o{ agenda : "define"
    nutricionista ||--o{ turno : "atiende"
    nutricionista ||--o{ plan_alimentacion : "crea"
    nutricionista ||--o{ generacion_plan_ia : "genera"

    %% AGENDA
    agenda ||--o{ excepcion_disponibilidad : "tiene excepciones"

    %% TURNOS
    turno ||--o| observacion_clinica : "tiene"
    turno ||--o{ medicion : "contiene"
    turno ||--o{ adjunto_clinico : "adjunta"
    turno ||--o{ foto_progreso : "vinculada"

    %% FICHA SALUD
    ficha_salud ||--o{ ficha_salud_version : "versiona"
    ficha_salud ||--o{ ficha_salud_patologia : "asocia patologias"
    ficha_salud ||--o{ ficha_salud_alergia : "asocia alergias"
    patologia ||--o{ ficha_salud_patologia : ""
    alergia ||--o{ ficha_salud_alergia : ""

    %% PLAN ALIMENTACION
    plan_alimentacion ||--o{ dia_plan : "compone"
    dia_plan ||--o{ opcion_comida : "ofrece"
    opcion_comida ||--o{ item_comida : "detalla"
    item_comida }o--|| alimento : "usa"
    plan_alimentacion ||--o{ generacion_plan_ia : "generado por"

    %% ALIMENTOS
    alimento ||--o{ alimento_grupo_alimenticio : "clasificado en"
    grupo_alimenticio ||--o{ alimento_grupo_alimenticio : "agrupa"

    %% RBAC
    grupo_permiso ||--o{ grupo_permiso_accion : "contiene"
    accion ||--o{ grupo_permiso_accion : "asignada a"
    grupo_permiso ||--o{ grupo_permiso_hijo : "padre"
    grupo_permiso ||--o{ grupo_permiso_hijo : "hijo"

    %% NOTAS DE MODELADO
    %%
    %% 1. Herencia persona → socio/nutricionista/recepcionista:
    %%    PK de socio, nutricionista y recepcionista = misma PK que persona.
    %%    tipo_persona en persona es el discriminador.
    %%
    %% 2. Soft-delete: la mayoría de tablas heredan de AuditableOrmEntity
    %%    que aporta fecha_baja (DeleteDateColumn de TypeORM).
    %%    Excepciones sin soft-delete: ficha_salud_version,
    %%    usuario_grupo_permiso, generacion_plan_ia, grupo_permiso.
    %%
    %% 3. UK compuesta en agenda: (id_nutricionista, dia_semana, hora_inicio, hora_fin)
    %%
    %% 4. ficha_salud.version_actual_id apunta a la version vigente.
    %%    Las versiones son inmutables (snapshot JSON del estado anterior).
    %%
    %% 5. Las columnas nutricionales de alimento usan transformers
    %%    DECIMAL(10,2) → number.
    %%
    %% 6. notificacion.tipo y notificacion.estado son enums separados.
    %%    tipo = asunto, estado = estado de entrega/lectura.
    %%
    %% 7. adjunto_clinico.es_post_cierre indica si se subió después de cerrar el turno.
    %%
    %% 8. NOTA: gimnasio.id_gimnasio en persona + ficha_salud NO es redundancia
    %%    deliberada para tenant isolation sin joins cruzados.
```