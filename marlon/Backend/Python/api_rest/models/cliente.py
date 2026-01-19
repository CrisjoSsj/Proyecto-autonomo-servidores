from django.db import models
from .ubicacion import Ubicacion
import uuid

class Cliente(models.Model):
    user_id = models.UUIDField(unique=True, help_text="UUID del usuario asociado al cliente",)
    telefono = models.CharField(max_length=50)
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.SET_NULL, null=True, blank=True, related_name="clientes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user_id}"