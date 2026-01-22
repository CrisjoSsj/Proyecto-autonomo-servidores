# 🚀 GUÍA RÁPIDA - PROBAR WEBHOOKS

## ✅ WEBHOOKS YA ESTÁN FUNCIONANDO

**Base URL**: `http://localhost:8002`

---

## 📋 OPCIÓN 1: Probar desde PowerShell (MÁS RÁPIDO)

### Test 1: Webhook Mock (Pago exitoso)
```powershell
Invoke-WebRequest -Uri "http://localhost:8002/webhooks/mock" -Method POST -Body '{"event":"charge.succeeded","payment_id":"pay_12345","amount":100}' -ContentType "application/json"
```

**Resultado esperado**: `Status: 200 OK`

### Test 2: Webhook Mock (Pago fallido)
```powershell
Invoke-WebRequest -Uri "http://localhost:8002/webhooks/mock" -Method POST -Body '{"event":"charge.failed","payment_id":"pay_67890","amount":50}' -ContentType "application/json"
```

---

## 📋 OPCIÓN 2: Probar desde Swagger UI (INTERFAZ GRÁFICA)

1. **Abre tu navegador**: http://localhost:8002/docs
2. **Busca la sección**: "Webhooks"
3. **Haz clic en**: `POST /webhooks/mock`
4. **Click en**: "Try it out"
5. **Pega este JSON**:
```json
{
  "event": "charge.succeeded",
  "payment_id": "pay_test_123",
  "amount": 9999,
  "currency": "usd",
  "customer_email": "test@chuwuegrill.com"
}
```
6. **Click en**: "Execute"
7. **Verás**: Response 200 con `{"received": true, ...}`

---

## 📋 OPCIÓN 3: Usar Postman (COLECCIÓN DE MARLON)

### Paso 1: Abrir Postman
- Si no lo tienes, descarga: https://www.postman.com/downloads/

### Paso 2: Importar Colección
1. Abre Postman
2. Click en "Import"
3. Selecciona: `Marlon_Webhooks_Postman.postman_collection.json`
4. Click en "Import"

### Paso 3: Configurar Variable de Entorno
1. En Postman, click en el ⚙️ (Settings) arriba a la derecha
2. Click en "Add" para crear un nuevo Environment
3. Agrega esta variable:
   - **Variable**: `base_url`
   - **Initial Value**: `localhost:8002`
   - **Current Value**: `localhost:8002`
4. Guarda y selecciona este environment

### Paso 4: Ajustar URLs de los Requests
La colección de Marlon usa rutas como:
- ❌ `/webhooks/payments/stripe/`
- ✅ Cambiar a: `/webhooks/stripe`

O usa directamente el endpoint Mock que funciona sin ajustes:
- ✅ `/webhooks/mock`

### Paso 5: Enviar Request
1. Expande "PAYMENT WEBHOOKS"
2. Selecciona cualquier webhook
3. Modifica la URL si es necesario
4. Click en "Send"
5. Deberías ver: **200 OK**

---

## 🎯 ENDPOINTS DISPONIBLES

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/webhooks/stripe` | POST | Webhook de Stripe (requiere firma) |
| `/webhooks/mock` | POST | Webhook de prueba (sin validación) |
| `/webhooks/mercadopago` | POST | Webhook de MercadoPago |
| `/webhooks/partners` | POST | Webhook de Partners B2B |

---

## ✅ CONFIRMACIÓN

Si ves **Status 200 OK** en cualquier prueba, significa que:
- ✅ El servicio de webhooks está corriendo
- ✅ Los endpoints están respondiendo
- ✅ Todo funciona correctamente

---

## 🔍 VERIFICAR LOGS

Para ver qué reciben los webhooks en tiempo real:

```powershell
docker logs -f chuwue-payments
```

Presiona `Ctrl+C` para salir.

---

## 🆘 TROUBLESHOOTING

**Problema**: "Connection refused"
- **Solución**: Verifica que Docker esté corriendo: `docker ps`

**Problema**: "404 Not Found"
- **Solución**: Verifica que estés usando el puerto 8002 y no 8000

**Problema**: Postman da error de URL
- **Solución**: Ajusta las URLs según la tabla de endpoints arriba

---

**✨ ¡Listo para entregar a Marlon!**
