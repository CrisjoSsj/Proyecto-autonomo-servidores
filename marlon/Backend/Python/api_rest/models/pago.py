from django.db import models
from .reserva import Reserva

class Pago(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('rechazado', 'Rechazado'),
    ]
    METODOS = [
        ('efectivo', 'Efectivo'),
        ('tarjeta', 'Tarjeta'),
        ('transferencia', 'Transferencia'),
    ]
    reserva = models.ForeignKey(Reserva, on_delete=models.CASCADE, related_name="pagos")
    metodo_pago = models.CharField(max_length=50, choices=METODOS)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=50, choices=ESTADOS)
    referencia = models.CharField(max_length=100, blank=True, null=True)
    fecha_pago = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Pago {self.id} - {self.estado}"