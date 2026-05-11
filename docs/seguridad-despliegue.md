# Seguridad de Despliegue

## Objetivo

Esta guía fija el baseline mínimo para desplegar NutriFit Supervisor sin exponer credenciales ni tráfico clínico en claro.

## 1. HTTPS obligatorio

- El frontend y la API DEBEN publicarse detrás de HTTPS en `staging` y `production`.
- Si existe entrada por HTTP, el proxy o load balancer DEBE redirigir a HTTPS.
- No publiques Swagger ni endpoints internos por internet sin autenticación o restricción de red.

## 2. Secretos fuera del repositorio

Estas variables NO deben versionarse en `.env` compartidos ni en código:

- Base de datos: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Storage: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_USE_SSL`, `MINIO_BUCKET_NAME`
- IA: `GROQ_API_KEY`, `GROQ_BASE_URL`, `GROQ_MODEL`
- Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Enlaces externos, CORS y jobs: `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `AUSENCIA_UMBRAL_MINUTOS`

Recomendación:

- Desarrollo local: `.env.local` fuera de commits.
- Staging/producción: secret manager del proveedor o variables inyectadas por CI/CD.

## 3. CORS y tokens

Estado actual del backend:

- `apps/backend/src/main.ts` toma los orígenes permitidos desde `CORS_ALLOWED_ORIGINS` o `FRONTEND_URL`.
- La autenticación actual usa `Authorization: Bearer <token>`; no depende de cookies de sesión.

Lineamiento operativo:

- En producción, configurá `CORS_ALLOWED_ORIGINS` con una lista separada por comas si hay más de un dominio válido.
- Si no definís `CORS_ALLOWED_ORIGINS`, el backend usa `FRONTEND_URL` como fallback.
- Si agregás cookies en el futuro, activá `secure`, `httpOnly` y revisá `sameSite` según el dominio final.
- No mezcles tokens de prueba y de producción en el mismo `JWT_SECRET`.

## 4. MinIO y almacenamiento

- Activá `MINIO_USE_SSL=true` cuando MinIO salga de la red local.
- Restringí bucket y credenciales por ambiente.
- No uses claves default como `minioadmin` fuera de desarrollo.

## 5. Recordatorios y links externos

- `FRONTEND_URL` debe apuntar al dominio HTTPS real del frontend.
- Los recordatorios no deben generar links vacíos ni dominios hardcodeados.
- No incluyas datos clínicos sensibles en correos, asuntos ni metadata visible al usuario.

## 6. Checklist previo a producción

- [ ] HTTPS activo en frontend y backend
- [ ] Secretos cargados desde entorno seguro
- [ ] `CORS_ALLOWED_ORIGINS` o `FRONTEND_URL` configurados con dominios reales
- [ ] `JWT_SECRET` exclusivo por ambiente
- [ ] MinIO/SMTP con credenciales no default
- [ ] `FRONTEND_URL` apuntando al dominio final
