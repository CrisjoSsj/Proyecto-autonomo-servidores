from django.db import models

class Ubicacion(models.Model):
    direccion = models.CharField(max_length=255)
    ciudad = models.CharField(max_length=100)
    provincia = models.CharField(max_length=100)
    pais = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.direccion}, {self.ciudad}, {self.provincia}, {self.pais}"