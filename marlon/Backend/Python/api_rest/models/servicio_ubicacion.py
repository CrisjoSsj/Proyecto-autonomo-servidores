from django.db import models
from .servicio import Servicio
from .ubicacion import Ubicacion

class ServicioUbicacion(models.Model):
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name="servicio_ubicaciones")
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.CASCADE, related_name="servicio_ubicaciones")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('servicio', 'ubicacion')