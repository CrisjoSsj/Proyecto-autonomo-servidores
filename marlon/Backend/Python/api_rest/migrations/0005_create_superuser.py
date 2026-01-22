# Generated migration to create initial superuser
from django.db import migrations


def create_superuser(apps, schema_editor):
    # Disabled - causing constraint issues
    pass


def reverse_superuser(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api_rest', '0004_load_initial_categories'),
    ]

    operations = [
        migrations.RunPython(create_superuser, reverse_superuser),
    ]
