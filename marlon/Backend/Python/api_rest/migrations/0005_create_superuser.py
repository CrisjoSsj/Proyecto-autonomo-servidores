# Generated migration to create initial superuser
from django.db import migrations
from django.contrib.auth.hashers import make_password
from django.utils import timezone


def create_superuser(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    
    if not User.objects.filter(username='admin').exists():
        User.objects.create(
            username='admin',
            email='admin@findyourwork.com',
            password=make_password('Admin123!'),
            is_staff=True,
            is_superuser=True,
            is_active=True,
            date_joined=timezone.now()
        )


def reverse_superuser(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    User.objects.filter(username='admin').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api_rest', '0004_load_initial_categories'),
    ]

    operations = [
        migrations.RunPython(create_superuser, reverse_superuser),
    ]
