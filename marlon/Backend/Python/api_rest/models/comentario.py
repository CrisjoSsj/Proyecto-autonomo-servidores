from django.db import models
from .cliente import Cliente
from .servicio import Servicio

class Comentario(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="comentarios")
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name="comentarios")
    titulo = models.CharField(max_length=200)
    texto = models.TextField()
    respuesta = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.titulo} - {self.cliente.user.username}"