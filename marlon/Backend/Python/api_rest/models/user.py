"""
Modelo User - Proxy para el modelo de usuario de Django
========================================================
Pilar 2: Webhooks e Interoperabilidad B2B

Este modelo es un proxy del modelo User de Django que permite
extender funcionalidad si es necesario en el futuro.
"""
from django.contrib.auth.models import User as DjangoUser


# Re-exportar el modelo User de Django
# Esto permite importar User desde api_rest.models
User = DjangoUser
