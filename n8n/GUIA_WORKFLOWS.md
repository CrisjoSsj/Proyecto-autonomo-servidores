# 🚀 Cómo Crear el Workflow en n8n

## Opción 1: Importar el workflow JSON (Recomendado)

1. Abre n8n en **http://localhost:5678**
2. Inicia sesión con:
   - Email: `admin@chuwue.com`
   - Contraseña: `admin123`
3. Haz clic en **"+ New"** en la parte superior
4. Selecciona **"Import from file"**
5. Selecciona el archivo: `webhook-payment-processor.json`
6. Espera a que se importe y luego haz clic en **"Active"** para activar el workflow

---

## Opción 2: Crear Manualmente

### Paso 1: Crear un Webhook para Stripe

1. En n8n, haz clic en **"+ Add first step"**
2. Busca y selecciona **"Webhook"**
3. Configura:
   - **Method:** POST
   - **Path:** `webhooks/payments/stripe`
4. Copia la URL completa (ej: `http://localhost:5678/webhook/...`)

### Paso 2: Agregar Nodos Adicionales

4. Haz clic en el **"+"** para agregar otro nodo
5. Repite el Paso 1 para crear webhooks:
   - `webhooks/payments/payu/`
   - `webhooks/payments/mercadopago/`
   - `webhooks/partner/`
   - `webhooks/telegram/`
   - `webhooks/email/`
   - `webhooks/whatsapp/`

### Paso 3: Agregar HTTP Request para Callback

6. Crea un nodo **"HTTP Request"** para enviar los datos procesados al callback de Django:
   - **Method:** POST
   - **URL:** `http://localhost:8004/webhooks/callback/`
   - **Body:**
     ```json
     {
       "callback_type": "payment.processed",
       "original_event": "{{ $json }}",
       "result": {
         "status": "processed",
         "timestamp": "{{ $now.toISO() }}"
       }
     }
     ```

### Paso 4: Activar el Workflow

7. Haz clic en el botón **"Active"** en la parte superior derecha
8. El workflow ahora recibirá webhooks

---

## 📡 URLs de los Webhooks en n8n

Una vez creados, los webhooks estarán disponibles en:

- **Stripe:** `http://localhost:5678/webhook/webhooks/payments/stripe`
- **PayU:** `http://localhost:5678/webhook/webhooks/payments/payu`
- **MercadoPago:** `http://localhost:5678/webhook/webhooks/payments/mercadopago`
- **Partner:** `http://localhost:5678/webhook/webhooks/partner`
- **Telegram:** `http://localhost:5678/webhook/webhooks/telegram`
- **Email:** `http://localhost:5678/webhook/webhooks/email`
- **WhatsApp:** `http://localhost:5678/webhook/webhooks/whatsapp`

---

## ✅ Pruebas

Una vez el workflow esté activo, puedes probar con Postman o PowerShell:

```powershell
$body = @{
    "type" = "charge.succeeded"
    "data" = @{
        "amount" = 9999
        "currency" = "usd"
        "status" = "succeeded"
    }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5678/webhook/webhooks/payments/stripe" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

---

## 🔗 Conexión con Django

Los webhooks de n8n se conectarán automáticamente con:
- `http://localhost:8004/webhooks/health/` - Health check
- `http://localhost:8004/webhooks/callback/` - Callback después de procesar

