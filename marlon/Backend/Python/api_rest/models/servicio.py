from django.db import models
from .proveedor import Proveedor
from .categoria import Categoria
from .ubicacion import Ubicacion
from decimal import Decimal

class Servicio(models.Model):
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE, related_name="servicios")
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name="servicios")
    nombre_servicio = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    duracion = models.DurationField(blank=True, null=True)
    rating_promedio = models.FloatField(default=0)
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    ubicaciones = models.ManyToManyField(Ubicacion, through='ServicioUbicacion', related_name="servicios")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre_servicio