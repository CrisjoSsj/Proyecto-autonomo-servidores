# 🔧 Cambio de Puerto: Marlon Django a Puerto 8004

## Análisis de Puertos Actuales

```
Puerto 8000 - OCUPADO (por otro componente del proyecto)
Puerto 8001 - OCUPADO 
Puerto 8002 - OCUPADO
Puerto 8003 - OCUPADO
Puerto 8004 - ✅ DISPONIBLE
```

## Cambios Realizados

### 1. Endpoints actualizados

**Anteriormente:**
- Frontend: `http://127.0.0.1:8000/platos/`
- Webhooks: `http://localhost:8000/webhooks/payments/stripe/`
- Callback n8n: `http://localhost:8000/webhooks/callback/`

**Ahora:**
- Frontend: `http://127.0.0.1:8004/platos/`
- Webhooks: `http://localhost:8004/webhooks/payments/stripe/`
- Callback n8n: `http://localhost:8004/webhooks/callback/`

### 2. Archivos modificados

1. `marlon/Backend/Python/frontend/src/pages/user/Menu.tsx`
   - Cambiado `API_BASE_URL` de `8000` a `8004`

2. `marlon/Backend/Python/mi_proyecto/urls.py`
   - Actualizado comentario de configuración

3. `n8n/workflows/webhook-payment-processor.json`
   - Callback URL: `http://localhost:8004/webhooks/callback/`

4. `n8n/workflows/findyourwork-webhook-processor.json`
   - Callback URL: `http://localhost:8004/webhooks/callback/`

5. `setup_n8n_workflows.py`
   - URLs de callback actualizadas a puerto 8004

6. `Marlon_Webhooks_Postman.postman_collection.json`
   - Variable de entorno: `localhost:8004`

## Cómo Ejecutar

### Iniciar Django en Puerto 8004

```bash
cd marlon/Backend/Python
.\venv\Scripts\Activate.ps1
python manage.py runserver 8004
```

O si usas manage.py directo:

```bash
python manage.py runserver 0.0.0.0:8004
```

### Verificar que funciona

```bash
# En PowerShell
Invoke-WebRequest http://localhost:8004/platos/ | ConvertTo-Json
Invoke-WebRequest http://localhost:8004/categorias/ | ConvertTo-Json

# O en navegador
http://localhost:8004/platos/
http://localhost:8004/categorias/
http://localhost:8004/admin/
```

## Archivos para Actualizar Manualmente

Si en algún otro lugar necesitas cambiar referencias a puerto 8000:

1. **Frontend Menu.tsx**
   ```typescript
   const API_BASE_URL = 'http://127.0.0.1:8004';
   ```

2. **Archivos de Configuración**
   - `.env` files
   - `docker-compose.yml` (si lo usas)
   - Postman collections

3. **Scripts de Testing**
   - Cualquier script que haga requests a webhooks

## Resolución de Conflictos

Si aún experimentas conflictos de puerto:

```bash
# Ver qué proceso está en el puerto
netstat -ano | findstr :8004

# Matar el proceso (si es necesario)
taskkill /PID <PID> /F
```

## Resumen

✅ Puerto 8000 liberado para otros componentes
✅ Marlon ahora usa puerto 8004
✅ Todos los webhooks apuntan al nuevo puerto
✅ Frontend React configurado para el nuevo puerto
✅ n8n workflows actualizados con URLs correctas
