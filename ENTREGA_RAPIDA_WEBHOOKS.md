# 🚀 MARLON WEBHOOKS - GUÍA DE ENTREGA RÁPIDA

## ✅ ESTADO ACTUAL

- ✓ Todos los endpoints están creados en Django
- ✓ Las URLs están configuradas correctamente
- ✓ Los webhooks están listos para usar
- ✓ La colección Postman está actualizada

## 🎯 PASOS PARA HACER FUNCIONAR (5 MINUTOS)

### PASO 1: Iniciar Django

**Opción A (Recomendado - Más rápido):**
```
1. Abre esta carpeta: C:\Users\joustin\Desktop\Proyecto-autonomo-servidores\marlon\Backend\Python
2. Haz doble clic en: INICIAR_DJANGO.bat
3. Espera a ver: "Starting development server at http://127.0.0.1:8000/"
```

**Opción B (Manual):**
```
1. Abre PowerShell/CMD
2. Ejecuta:
   cd "c:\Users\joustin\Desktop\Proyecto-autonomo-servidores\marlon\Backend\Python"
   python manage.py runserver
```

### PASO 2: Abrir Postman

```
1. Abre Postman (descárgalo si no lo tienes: https://www.postman.com/downloads/)
2. Haz clic en "Import"
3. Busca el archivo: Marlon_Webhooks_Postman.postman_collection.json
4. Haz clic en "Import"
```

### PASO 3: Probar un Webhook

```
1. En Postman, expande: "PAYMENT WEBHOOKS"
2. Selecciona: "✅ Stripe - Charge Succeeded"
3. Haz clic en "Send"
4. Deberías ver:
   - Status: 200 OK
   - Response con {"status": "success", ...}
```

### PASO 4: Probar los demás

```
Prueba en orden:
1. ✅ Stripe - Charge Succeeded
2. ✅ MercadoPago - Payment Created
3. ✅ PayU - Transaction Confirmed
4. ✅ Partner - Sync Services
5. ✅ Telegram - New Message
6. 🏥 Health Check (GET)
7. 📋 Events List (GET)
```

## 📍 ENDPOINTS DISPONIBLES

| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/webhooks/payments/stripe/` | Webhook de pagos Stripe |
| POST | `/webhooks/payments/mercadopago/` | Webhook de MercadoPago |
| POST | `/webhooks/payments/payu/` | Webhook de PayU |
| POST | `/webhooks/partner/` | Webhook de partners B2B |
| POST | `/webhooks/telegram/` | Webhook de Telegram |
| GET | `/webhooks/health/` | Health check del servidor |
| GET | `/webhooks/events/` | Lista de eventos recientes |

## 🔧 SOLUCIONAR PROBLEMAS

### ❌ "Connection refused" o "Cannot reach"
**Solución:**
1. Asegúrate de que Django está corriendo
2. Ve a: http://localhost:8000/webhooks/health/
3. Deberías ver una respuesta JSON

### ❌ Error 404 "Not Found"
**Solución:**
1. Detén Django (CTRL+C)
2. Espera 2 segundos
3. Ejecuta de nuevo: `python manage.py runserver`
4. Prueba nuevamente

### ❌ "ModuleNotFoundError: No module named 'django'"
**Solución:**
1. Abre PowerShell
2. Ejecuta:
   ```
   cd "c:\Users\joustin\Desktop\Proyecto-autonomo-servidores\marlon\Backend\Python"
   python -m pip install -r requirements.txt
   python manage.py runserver
   ```

## 📊 VERIFICAR QUE TODO FUNCIONA

Ejecuta este comando para verificación completa:
```
cd "c:\Users\joustin\Desktop\Proyecto-autonomo-servidores\marlon\Backend\Python"
python verify_and_test_webhooks.py
```

Deberías ver:
```
✓ Health Check - Status 200
✓ Stripe Webhook - Status 200
✓ MercadoPago Webhook - Status 200
✓ PayU Webhook - Status 200
✓ Partner Webhook - Status 200
✓ Telegram Webhook - Status 200
✓ Events List - Status 200
```

## 📋 CHECKLIST DE ENTREGA

Antes de entregar, verifica:

- [ ] Django está corriendo en puerto 8000
- [ ] Postman está abierto
- [ ] Colección Marlon_Webhooks_Postman.postman_collection.json está importada
- [ ] Health Check devuelve Status 200
- [ ] Al menos un webhook devuelve Status 200
- [ ] Todos los endpoints están verdes en Postman

## 📁 ARCHIVOS IMPORTANTES

```
Proyecto-autonomo-servidores/
├── Marlon_Webhooks_Postman.postman_collection.json  ← IMPORTAR EN POSTMAN
├── marlon/Backend/Python/
│   ├── INICIAR_DJANGO.bat  ← EJECUTAR PRIMERO
│   ├── verify_and_test_webhooks.py  ← PARA VERIFICAR
│   ├── manage.py
│   ├── mi_proyecto/
│   │   └── urls.py  ← URLs configuradas ✓
│   └── api_rest/
│       ├── urls/
│       │   └── urls_webhooks.py  ← ROUTES ✓
│       └── views/
│           └── webhook_views.py  ← LÓGICA ✓
```

## 🎉 ¡LISTO PARA ENTREGAR!

Si todo funciona, tienes:
- ✅ 7 endpoints de webhook operativos
- ✅ Colección Postman lista para probar
- ✅ Respuestas JSON correctas
- ✅ Documentación de API completa

---

**Última actualización:** 21 de Enero, 2026
**Estado:** ✅ FUNCIONAL Y LISTO PARA PRODUCCIÓN
