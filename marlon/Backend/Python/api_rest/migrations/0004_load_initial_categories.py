# Generated migration to load initial categories
from django.db import migrations


def load_initial_categories(apps, schema_editor):
    Categoria = apps.get_model('api_rest', 'Categoria')
    
    categories = [
        {'nombre': 'Servicios de limpieza', 'descripcion': 'Servicios profesionales de limpieza para hogares y oficinas'},
        {'nombre': 'Reparaciones del hogar', 'descripcion': 'Servicios de reparación y mantenimiento del hogar'},
        {'nombre': 'Clases particulares', 'descripcion': 'Clases personalizadas de diferentes materias'},
        {'nombre': 'Servicios de belleza', 'descripcion': 'Servicios de estética y cuidado personal'},
        {'nombre': 'Mudanzas', 'descripcion': 'Servicios de transporte y mudanza'},
    ]
    
    for cat_data in categories:
        Categoria.objects.get_or_create(nombre=cat_data['nombre'], defaults=cat_data)


def reverse_initial_categories(apps, schema_editor):
    Categoria = apps.get_model('api_rest', 'Categoria')
    Categoria.objects.filter(nombre__in=[
        'Servicios de limpieza',
        'Reparaciones del hogar',
        'Clases particulares',
        'Servicios de belleza',
        'Mudanzas',
    ]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api_rest', '0003_toolactionlog_unique_idempotency'),
    ]

    operations = [
        migrations.RunPython(load_initial_categories, reverse_initial_categories),
    ]
