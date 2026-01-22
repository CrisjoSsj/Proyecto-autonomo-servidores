from django.db import models
from .categoria import Categoria
from django.utils import timezone


class Plato(models.Model):
    """Modelo para platos del restaurante"""
    
    ESTADO_CHOICES = [
        ('disponible', 'Disponible'),
        ('no_disponible', 'No Disponible'),
        ('descontinuado', 'Descontinuado'),
    ]
    
    id_plato = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=200, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.ForeignKey(
        Categoria, 
        on_delete=models.CASCADE, 
        related_name='platos',
        blank=True, 
        null=True
    )
    estado = models.CharField(
        max_length=20, 
        choices=ESTADO_CHOICES, 
        default='disponible'
    )
    disponible = models.BooleanField(default=True)
    imagen_url = models.URLField(blank=True, null=True)
    tiempo_preparacion = models.IntegerField(
        help_text="Tiempo en minutos",
        default=15
    )
    calorias = models.IntegerField(blank=True, null=True)
    alergenos = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Ingredientes alergénicos separados por comas"
    )
    vegetariano = models.BooleanField(default=False)
    vegano = models.BooleanField(default=False)
    sin_gluten = models.BooleanField(default=False)
    picante = models.BooleanField(default=False)
    nivel_picante = models.IntegerField(
        choices=[(i, f"Nivel {i}") for i in range(0, 6)],
        default=0
    )
    ingredientes = models.TextField(
        blank=True,
        null=True,
        help_text="Ingredientes separados por comas"
    )
    stock = models.IntegerField(default=999)
    oferta = models.BooleanField(default=False)
    precio_oferta = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    creado_por = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        db_table = 'platos'
        ordering = ['nombre']
        verbose_name = 'Plato'
        verbose_name_plural = 'Platos'
        
    def __str__(self):
        return self.nombre
    
    def get_precio_final(self):
        """Retorna el precio considerando oferta"""
        if self.oferta and self.precio_oferta:
            return self.precio_oferta
        return self.precio
