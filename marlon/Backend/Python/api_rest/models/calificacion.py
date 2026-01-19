from django.db import models
from .cliente import Cliente
from .servicio import Servicio

class Calificacion(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="calificaciones")
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name="calificaciones")
    fecha = models.DateTimeField(auto_now_add=True)
    puntuacion = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['cliente', 'servicio'], name='unique_calificacion')
        ]

    def save(self, *args, **kwargs):
        if not 1 <= self.puntuacion <= 5:
            raise ValueError("La puntuación debe estar entre 1 y 5")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.servicio.nombre_servicio} - {self.puntuacion}/5"