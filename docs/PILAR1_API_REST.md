# Pilar 1: API REST Core

Este documento describe el Pilar 1 del sistema: la API REST principal utilizada por Chuwue Grill para gestión de usuarios, restaurantes, reservas y menú.

---

## Objetivos del Pilar 1

- Exponer endpoints REST estables para operaciones de negocio.
- Asegurar interoperabilidad con frontend y servicios internos.
- Proveer diagnósticos rápidos y versionado simple.

---

## Arquitectura y Entradas

- Servicio: backend/apirest_python (FastAPI)
- CORS habilitado para el frontend local (localhost:5173)
- Routers: `user`, `Restaurante`, `Reserva`, `Menu`, `Plato`, `Mesa`, `FilaVirtual`, `Cliente`, `CategoriaMenu`, `auth`.

---

## Diagnósticos y Versionado

Se incorporan encabezados estándar en todas las respuestas del servicio:

- `X-API-Version: v1`
- `X-Pilar1: enabled`

Endpoints de diagnóstico:

- `GET /integracion/pilar1/status` → devuelve el estado del Pilar 1.

Ejemplo de respuesta:

```json
{
  "pilar": 1,
  "status": "ok",
  "api_rest": true,
  "version": "v1"
}
```

---

## Buenas Prácticas

- Mantener compatibilidad hacia atrás al evolucionar rutas.
- Documentar cambios relevantes en este archivo.
- Evitar romper contratos HTTP (códigos, esquemas y headers).

---

## Próximos pasos sugeridos

- Añadir rate limiting básico para protección.
- Homologar errores con un formato estándar.
- Publicar especificación OpenAPI con tags de módulos.
