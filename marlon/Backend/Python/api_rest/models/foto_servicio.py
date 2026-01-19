from django.db import models
from .servicio import Servicio


class FotoServicio(models.Model):
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name="fotos")
    url_foto = models.URLField(max_length=300)
    descripcion = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Foto de {self.servicio.nombre_servicio}"