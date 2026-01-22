#!/usr/bin/env python3
"""
Script para agregar datos de prueba (platos y categorías) a la base de datos
Úsalo después de que las migraciones se hayan aplicado correctamente
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mi_proyecto.settings')
django.setup()

from api_rest.models import Categoria, Plato


def create_categories():
    """Crea las categorías iniciales del menú"""
    categories = [
        {'nombre': 'Almuerzos', 'descripcion': 'Platos principales del almuerzo'},
        {'nombre': 'Cenas', 'descripcion': 'Platos principales de la cena'},
        {'nombre': 'Bebidas', 'descripcion': 'Bebidas frías y calientes'},
        {'nombre': 'Postres', 'descripcion': 'Postres y dulces'},
        {'nombre': 'Entrantes', 'descripcion': 'Platos de entrada'},
        {'nombre': 'Vegetarianos', 'descripcion': 'Opciones vegetarianas'},
    ]
    
    created = []
    for cat_data in categories:
        cat, created_flag = Categoria.objects.get_or_create(
            nombre=cat_data['nombre'],
            defaults={'descripcion': cat_data['descripcion']}
        )
        if created_flag:
            created.append(cat.nombre)
            print(f"✅ Categoría creada: {cat.nombre}")
        else:
            print(f"ℹ️  Categoría ya existe: {cat.nombre}")
    
    return created


def create_dishes():
    """Crea los platos iniciales"""
    almuerzo_cat = Categoria.objects.get(nombre='Almuerzos')
    cena_cat = Categoria.objects.get(nombre='Cenas')
    entrada_cat = Categoria.objects.get(nombre='Entrantes')
    vegetariana_cat = Categoria.objects.get(nombre='Vegetarianos')
    postre_cat = Categoria.objects.get(nombre='Postres')
    
    dishes = [
        # Almuerzos
        {
            'nombre': 'Pechuga de pollo a la mantequilla',
            'descripcion': 'Pechuga jugosa con salsa de mantequilla y hierbas',
            'precio': 15.99,
            'categoria': almuerzo_cat,
            'tiempo_preparacion': 25,
            'calorias': 450,
            'vegetariano': False,
            'imagen_url': 'https://via.placeholder.com/300x200?text=Pechuga'
        },
        {
            'nombre': 'Filete de res con papa al horno',
            'descripcion': 'Filete jugoso acompañado de papa al horno y vegetales',
            'precio': 19.99,
            'categoria': almuerzo_cat,
            'tiempo_preparacion': 30,
            'calorias': 650,
            'vegetariano': False,
            'imagen_url': 'https://via.placeholder.com/300x200?text=Filete'
        },
        {
            'nombre': 'Salmón a la mantequilla',
            'descripcion': 'Salmón fresco con limón y vegetales frescos',
            'precio': 22.99,
            'categoria': almuerzo_cat,
            'tiempo_preparacion': 20,
            'calorias': 550,
            'vegetariano': False,
            'imagen_url': 'https://via.placeholder.com/300x200?text=Salmon'
        },
        
        # Entrantes
        {
            'nombre': 'Tabla de quesos y embutidos',
            'descripcion': 'Selección de quesos artesanales y embutidos importados',
            'precio': 12.99,
            'categoria': entrada_cat,
            'tiempo_preparacion': 5,
            'calorias': 350,
            'vegetariano': False,
            'imagen_url': 'https://via.placeholder.com/300x200?text=Quesos'
        },
        {
            'nombre': 'Camarones al ajillo',
            'descripcion': 'Camarones frescos salteados con ajo y limón',
            'precio': 14.99,
            'categoria': entrada_cat,
            'tiempo_preparacion': 15,
            'calorias': 280,
            'vegetariano': False,
            'imagen_url': 'https://via.placeholder.com/300x200?text=Camarones'
        },
        
        # Vegetarianos
        {
            'nombre': 'Ensalada César vegetariana',
            'descripcion': 'Lechuga romana con aderezo César casero y crutones',
            'precio': 8.99,
            'categoria': vegetariana_cat,
            'tiempo_preparacion': 10,
            'calorias': 280,
            'vegetariano': True,
            'vegano': False,
            'imagen_url': 'https://via.placeholder.com/300x200?text=Ensalada'
        },
        {
            'nombre': 'Hamburguesa de champiñones',
            'descripcion': 'Hamburguesa con champiñones frescos y queso suizo',
            'precio': 11.99,
            'categoria': vegetariana_cat,
            'tiempo_preparacion': 20,
            'calorias': 420,
            'vegetariano': True,
            'vegano': False,
            'imagen_url': 'https://via.placeholder.com/300x200?text=Hamburguesa'
        },
        {
            'nombre': 'Tarta de espinacas',
            'descripcion': 'Hojaldre crujiente relleno de espinacas y queso fresco',
            'precio': 10.99,
            'categoria': vegetariana_cat,
            'tiempo_preparacion': 30,
            'calorias': 380,
            'vegetariano': True,
            'sin_gluten': False,
            'imagen_url': 'https://via.placeholder.com/300x200?text=Tarta'
        },
        
        # Postres
        {
            'nombre': 'Chocolate derretido',
            'descripcion': 'Chocolate belga de fundición lenta con helado vainilla',
            'precio': 7.99,
            'categoria': postre_cat,
            'tiempo_preparacion': 5,
            'calorias': 420,
            'vegetariano': True,
            'imagen_url': 'https://via.placeholder.com/300x200?text=Chocolate'
        },
        {
            'nombre': 'Tiramisú casero',
            'descripcion': 'Tiramisu con mascarpone y café expresso',
            'precio': 6.99,
            'categoria': postre_cat,
            'tiempo_preparacion': 0,
            'calorias': 350,
            'vegetariano': True,
            'imagen_url': 'https://via.placeholder.com/300x200?text=Tiramisu'
        },
        {
            'nombre': 'Cheesecake de fresas',
            'descripcion': 'Cheesecake cremoso con cobertura de fresas frescas',
            'precio': 7.99,
            'categoria': postre_cat,
            'tiempo_preparacion': 0,
            'calorias': 380,
            'vegetariano': True,
            'imagen_url': 'https://via.placeholder.com/300x200?text=Cheesecake'
        },
    ]
    
    created_count = 0
    for dish_data in dishes:
        plato, created_flag = Plato.objects.get_or_create(
            nombre=dish_data['nombre'],
            defaults=dish_data
        )
        if created_flag:
            created_count += 1
            print(f"✅ Plato creado: {plato.nombre}")
        else:
            print(f"ℹ️  Plato ya existe: {plato.nombre}")
    
    return created_count


if __name__ == '__main__':
    print("=" * 50)
    print("Creando datos iniciales del menú")
    print("=" * 50)
    
    print("\n📂 Creando categorías...")
    categories = create_categories()
    
    print(f"\n🍽️  Creando platos ({len(categories)} categorías disponibles)...")
    dishes_count = create_dishes()
    
    print("\n" + "=" * 50)
    print(f"✅ Proceso completado!")
    print(f"   - Nuevas categorías creadas")
    print(f"   - {dishes_count} nuevos platos creados")
    print("=" * 50)
