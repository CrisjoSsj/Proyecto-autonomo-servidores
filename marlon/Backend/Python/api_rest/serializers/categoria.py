from rest_framework import serializers
from .. import models

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Categoria
        fields = '__all__'
    
    def validate_nombre(self, value):
        if not value:
            raise serializers.ValidationError("Este campo es obligatorio")
        if value.isdigit():
            raise serializers.ValidationError("No se permiten números")
        return value