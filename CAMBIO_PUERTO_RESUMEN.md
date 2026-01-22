# ✅ Cambio de Puerto Completado: 8000 → 8004

## 📋 Resumen Ejecutivo

El proyecto **Marlon Django** ha sido reconfigurado para usar el puerto **8004** en lugar de **8000**, que estaba siendo utilizado por otro componente del proyecto principal.

---

## 📊 Cambios Realizados

### 1. **Frontend (React)**
- ✅ `frontend/src/pages/user/Menu.tsx`
  - Cambio: `API_BASE_URL = 'http://127.0.0.1:8000'` → `8004`
  - Impacto: Las llamadas a `/platos/` y `/categorias/` ahora usan el puerto correcto

### 2. **Workflows de n8n**
- ✅ `n8n/workflows/webhook-payment-processor.json`
  - Callback URL: `http://localhost:8000/webhooks/callback/` → `8004`
  
- ✅ `n8n/workflows/findyourwork-webhook-processor.json`
  - Callback URL: `http://localhost:8000/webhooks/callback/` → `8004`

### 3. **Scripts de Configuración**
- ✅ `setup_n8n_workflows.py`
  - URLs de callback actualizadas a puerto 8004
  
- ✅ `Marlon_Webhooks_Postman.postman_collection.json`
  - Variable de entorno `{{base_url}}` ahora es `localhost:8004`

### 4. **Documentación**
- ✅ `CAMBIO_PUERTO_MARLON.md` - Guía completa del cambio
- ✅ `SOLUCION_MENU_404.md` - Actualizado con referencias a puerto 8004
- ✅ `n8n/GUIA_WORKFLOWS.md` - URLs actualizadas
- ✅ `VERIFICACION_COMPLETA.txt` - Flujos actualizados

### 5. **Scripts de Inicio**
- ✅ `marlon/Backend/Python/INICIAR_DJANGO_8004.bat` (Windows CMD)
- ✅ `marlon/Backend/Python/INICIAR_DJANGO_8004.ps1` (PowerShell)

---

## 🚀 Cómo Usar

### Opción 1: PowerShell (Recomendado)
```powershell
cd marlon/Backend/Python
.\INICIAR_DJANGO_8004.ps1
```

### Opción 2: Windows CMD
```cmd
cd marlon\Backend\Python
INICIAR_DJANGO_8004.bat
```

### Opción 3: Manualmente
```bash
cd marlon/Backend/Python
.\venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py runserver 0.0.0.0:8004
```

---

## 📡 Endpoints Disponibles

### Menú (Frontend)
- `GET http://localhost:8004/platos/` - Listado de platos
- `GET http://localhost:8004/categorias/` - Listado de categorías

### Webhooks
- `POST http://localhost:8004/webhooks/payments/stripe/` - Stripe
- `POST http://localhost:8004/webhooks/payments/payu/` - PayU
- `POST http://localhost:8004/webhooks/payments/mercadopago/` - MercadoPago
- `POST http://localhost:8004/webhooks/partner/` - Partner events
- `POST http://localhost:8004/webhooks/telegram/` - Telegram
- `POST http://localhost:8004/webhooks/email/` - Email
- `POST http://localhost:8004/webhooks/whatsapp/` - WhatsApp
- `GET http://localhost:8004/webhooks/health/` - Health check
- `POST http://localhost:8004/webhooks/callback/` - n8n callbacks

### Admin
- `http://localhost:8004/admin/` - Panel de administración Django

---

## ✔️ Validación

Para verificar que todo funciona correctamente:

```powershell
# Prueba 1: Platos
Invoke-WebRequest http://localhost:8004/platos/ | ConvertTo-Json

# Prueba 2: Categorías
Invoke-WebRequest http://localhost:8004/categorias/ | ConvertTo-Json

# Prueba 3: Health check
Invoke-WebRequest http://localhost:8004/webhooks/health/
```

---

## 📝 Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/pages/user/Menu.tsx` | API_BASE_URL: 8000 → 8004 |
| `n8n/workflows/webhook-payment-processor.json` | Callback URL actualizada |
| `n8n/workflows/findyourwork-webhook-processor.json` | Callback URL actualizada |
| `setup_n8n_workflows.py` | URLs de callback actualizadas |
| `Marlon_Webhooks_Postman.postman_collection.json` | Base URL variable actualizada |
| `n8n/GUIA_WORKFLOWS.md` | Documentación actualizada |
| `SOLUCION_MENU_404.md` | Documentación actualizada |
| `VERIFICACION_COMPLETA.txt` | Documentación actualizada |

---

## 🔍 Estado de Puertos

```
Puerto 8000 - ✅ DISPONIBLE (liberado)
Puerto 8001 - OCUPADO
Puerto 8002 - OCUPADO
Puerto 8003 - OCUPADO
Puerto 8004 - ✅ ASIGNADO A MARLON DJANGO
Puerto 5173 - Frontend Vite
Puerto 5678 - n8n
```

---

## 📖 Documentación de Referencia

- Ver: `CAMBIO_PUERTO_MARLON.md`
- Ver: `SOLUCION_MENU_404.md`
- Ver: `n8n/GUIA_WORKFLOWS.md`

---

**Estado: ✅ COMPLETADO**  
**Fecha: 2026-01-22**  
**Proyecto: Chuwue Grill FindYourWork**
