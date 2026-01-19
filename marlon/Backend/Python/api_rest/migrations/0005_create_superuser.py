# Generated migration to create initial superuser
from django.db import migrations


def create_superuser(apps, schema_editor):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@findyourwork.com',
            password='Admin123!'
        )


def reverse_superuser(apps, schema_editor):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    User.objects.filter(username='admin').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api_rest', '0004_load_initial_categories'),
    ]

    operations = [
        migrations.RunPython(create_superuser, reverse_superuser),
    ]
