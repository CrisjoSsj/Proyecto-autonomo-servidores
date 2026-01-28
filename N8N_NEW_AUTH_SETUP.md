# 🔄 N8N - Reinicio con Nueva Autenticación (27/01/2026)

## ✅ Estado Actual

**N8N ha sido reiniciado desde cero** con datos completamente limpios.

- **Contenedor**: `chuwue-n8n`
- **Puerto**: `5678`
- **URL**: http://localhost:5678
- **Estado**: ✅ Corriendo

## 🔐 Nuevas Credenciales de Autenticación

El contenedor n8n fue iniciado con las siguientes credenciales del `docker-compose.yml`:

```yaml
environment:
  - N8N_BASIC_AUTH_ACTIVE=true
  - N8N_BASIC_AUTH_USER=admin@chuwue.com
  - N8N_BASIC_AUTH_PASSWORD=admin123
```

### Primera vez que accedes:

1. **URL**: http://localhost:5678
2. **Usuario**: `admin@chuwue.com`
3. **Contraseña**: `admin123`

> ⚠️ **IMPORTANTE**: Estas son las credenciales por defecto. Se te pedirá crear una nueva contraseña al primer acceso.

## 📋 Cambios en Archivos Postman

Se han actualizado los siguientes archivos de prueba:

### ✅ `Marlon_Webhooks_Postman.postman_collection.json`
- **Cambio**: `base_url` actualizada de `localhost:8004` → `localhost:8000`
- **Razón**: La API REST (core_api) está en puerto 8000, no 8004
- **Descripción actualizada**: Ahora especifica los puertos de cada microservicio

## 🔧 Arquitectura de Puertos (Actualizada)

```
┌─────────────────────────────────────────────┐
│       MICROSERVICIOS - Puertos Actuales      │
├─────────────────────────────────────────────┤
│ 🌐 Nginx (API Gateway)          →    80     │
│ 🔐 Auth Service                 →    8001   │
│ 💳 Payment Service              →    8002   │
│ 🤖 AI Orchestrator              →    8003   │
│ 📡 API REST (Core)              →    8000   │
│ 🔄 n8n (Event Bus)              →    5678   │
│ 💬 WebSocket (Ruby)             →    3001   │
│ 📱 Evolution API (WhatsApp)      →    8080   │
└─────────────────────────────────────────────┘
```

## 🚀 Próximos Pasos

1. **Accede a n8n**:
   - Ve a: http://localhost:5678
   - Ingresa las credenciales por defecto
   - Crea una nueva contraseña personal

2. **Usa las colecciones Postman actualizadas**:
   - `Chuwue_Grill_Pilares_Completo.postman_collection.json` (Rutas correctas ✅)
   - `Chuwue_Grill_Webhooks_Completos.postman_collection.json` (Rutas correctas ✅)
   - `Marlon_Webhooks_Postman.postman_collection.json` (ACTUALIZADO ✅)

3. **Restaura tus workflows**:
   - Los workflows guardados en `./n8n/workflows/` se cargarán automáticamente
   - Verifica que todas las conexiones estén activas

## 📝 Notas Importantes

- **N8N está en desarrollo**: La base de datos y datos de usuario se limpian completamente
- **Workflows persistentes**: Los archivos en `./n8n/workflows/` se preservan
- **Variables de entorno**: Revisa `n8n/.env` si necesitas cambiar credenciales

## 🔍 Verificación

Para verificar que n8n está corriendo correctamente:

```bash
# Ver logs de n8n
docker logs chuwue-n8n

# Verificar status del contenedor
docker ps | grep n8n
```

---

**Última actualización**: 27 de Enero de 2026
**Estado**: ✅ Completado
