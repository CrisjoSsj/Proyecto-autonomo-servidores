from django.db import models
from .cliente import Cliente

class Reserva(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('cancelada', 'Cancelada'),
    ]
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="reservas")
    fecha = models.DateField()
    hora = models.TimeField()
    estado = models.CharField(max_length=50, choices=ESTADOS)
    total_estimado = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Reserva {self.id} - {self.cliente}"