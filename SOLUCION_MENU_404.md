# 🔧 Solución: Frontend obtiene 404 en /platos/ y /categorias/

## El Problema

```
Menu.tsx:55  GET http://127.0.0.1:8004/platos/ 404 (Not Found)
Menu.tsx:56  GET http://127.0.0.1:8004/categorias/ 404 (Not Found)
```

El frontend React intenta acceder a endpoints que no estaban registrados en Django.

## La Solución

Hemos agregado los endpoints `/platos/` y `/categorias/` al backend Django.

### 1. Nuevos Componentes Añadidos

#### Modelo `Plato` 
Archivo: `api_rest/models/plato.py`
- Almacena información de platos del restaurante
- Incluye: nombre, descripción, precio, categoría, disponibilidad, etc.
- Soporta ofertas, características dietéticas (vegetariano, vegano, sin gluten)

#### Serializadores
Archivo: `api_rest/serializers/menu_serializers.py`
- `PlatoSerializer` - Detalle completo de platos
- `PlatoListSerializer` - Vista simplificada para listados
- `CategoriaSerializer` - Datos de categorías

#### ViewSets
Archivo: `api_rest/views/menu_views.py`
- `PlatoViewSet` - Gestiona platos
- `CategoriaViewSet` - Gestiona categorías
- Incluye búsqueda, filtrado y endpoints especiales (ofertas, dietéticos, etc.)

#### URLs
Archivo: `api_rest/urls/urls_menu.py`
- Registra rutas en el router

### 2. Endpoints Disponibles

#### Platos
```
GET  /platos/                      # Listado de todos los platos disponibles
GET  /platos/{id}/                 # Detalle de un plato
GET  /platos/por-categoria/        # Platos agrupados por categoría
GET  /platos/populares/            # Platos en oferta
GET  /platos/ofertas/              # Solo platos en oferta
GET  /platos/dietéticos/?tipo=...  # Vegetarianos, veganos, sin gluten, etc.
GET  /platos/?search=...           # Búsqueda por nombre
GET  /platos/?categoria_id=N       # Filtrar por categoría
```

#### Categorías
```
GET  /categorias/                  # Listado de todas las categorías
GET  /categorias/{id}/             # Detalle de una categoría
```

### 3. Estructura de Respuesta

#### GET /platos/
```json
[
  {
    "id_plato": 1,
    "id_categoria": 2,
    "nombre": "Pechuga de pollo",
    "descripcion": "Pechuga jugosa con salsa de mantequilla",
    "precio": "15.99",
    "precio_oferta": null,
    "oferta": false,
    "precio_final": 15.99,
    "estado": "disponible",
    "disponible": true,
    "imagen_url": "https://...",
    "tiempo_preparacion": 25,
    "vegetariano": false,
    "vegano": false,
    "sin_gluten": false,
    "picante": false,
    "nivel_picante": 0
  }
]
```

#### GET /categorias/
```json
[
  {
    "id": 1,
    "nombre": "Almuerzos",
    "descripcion": "Platos principales del almuerzo",
    "created_at": "2026-01-22T10:00:00Z",
    "updated_at": "2026-01-22T10:00:00Z"
  }
]
```

### 4. Cómo Usar (Paso a Paso)

#### 1. **Aplicar migraciones**
```bash
cd marlon/Backend/Python
.\venv\Scripts\Activate.ps1

# Si hay conflictos de migraciones:
python manage.py makemigrations --merge --noinput

# Aplicar todas las migraciones
python manage.py migrate
```

#### 2. **Poblar datos iniciales**
```bash
python populate_menu.py
```

Esto creará:
- 6 categorías (Almuerzos, Cenas, Bebidas, Postres, Entrantes, Vegetarianos)
- 10 platos de ejemplo en diferentes categorías

#### 3. **Iniciar Django**
```bash
python manage.py runserver
```

#### 4. **Verificar desde el navegador**
```
http://localhost:8004/platos/
http://localhost:8004/categorias/
```

### 5. **Solucionar Problemas**

#### Error: "table already exists"
```bash
# Eliminar la base de datos y recrearla
Remove-Item db.sqlite3 -Force
python manage.py migrate
```

#### Error: "NonExistent migration"
```bash
# Limpiar migraciones conflictivas
python manage.py makemigrations --merge --noinput
python manage.py migrate
```

#### Django aún retorna 404
1. Verificar que el router está registrado en `urls_menu.py`
2. Confirmar que `urls_menu.py` está incluido en `urls.py` principal
3. Reiniciar Django
4. Verificar en `/api/v1/platos/` (alternativa con prefijo API)

### 6. **Agregar Más Platos**

Opción 1: Editar `populate_menu.py` y correr nuevamente
```bash
python populate_menu.py
```

Opción 2: Via Django Admin
```bash
# Crear superusuario
python manage.py createsuperuser

# Acceder a http://localhost:8004/admin
# Agregar platos desde la interfaz
```

Opción 3: Manualmente via API (si está habilitado POST)
```bash
POST /platos/
{
  "nombre": "Mi Plato",
  "descripcion": "Descripción",
  "precio": 12.99,
  "categoria_id": 1,
  ...
}
```

### 7. **Notas de Desarrollo**

- Los platos se filtran automáticamente para mostrar solo `disponible=True` y `estado='disponible'`
- El Frontend recibe `id_plato` como identificador principal
- Las categorías se cargan desde la tabla de Categoría existente
- Soporta paginación automática via DRF (parámetros `?page=`, `?limit=`)
- Todos los endpoints permiten acceso público (`AllowAny`) sin autenticación

### 8. **URL Registrada en URLs Principales**

En `mi_proyecto/urls.py`:
```python
path('', include('api_rest.urls.urls_menu')),
```

Esto hace que `/platos/` y `/categorias/` estén disponibles en la raíz.

---

✅ **Con estos cambios, el frontend debería poder cargar platos y categorías correctamente.**
