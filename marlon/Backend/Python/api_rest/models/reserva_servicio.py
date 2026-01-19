from django.db import models
from .reserva import Reserva
from .servicio import Servicio
from django.utils import timezone


class ReservaServicio(models.Model):
    reserva = models.ForeignKey(Reserva, on_delete=models.CASCADE, related_name="detalles")
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name="detalles_reserva")
    fecha_servicio = models.DateField(default=timezone.now)
    hora_servicio = models.TimeField(default=timezone.now)
    # Estado individual por servicio (permite que cada proveedor acepte/rechace su parte)
    ESTADOS_RS = [
        ('pendiente', 'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('rechazada', 'Rechazada'),
    ]
    estado = models.CharField(max_length=50, choices=ESTADOS_RS, default='pendiente')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        # Mostrar una representación simple: Reserva-ID y servicio
        return f"Reserva#{self.reserva.id} - {self.servicio.nombre_servicio} ({self.estado})"