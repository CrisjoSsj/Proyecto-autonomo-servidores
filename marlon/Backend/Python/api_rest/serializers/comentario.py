from rest_framework import serializers
from .. import models
from .cliente import ClienteSerializer
from .servicio import ServicioSerializer
from datetime import date

class ComentarioSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer(read_only=True)
    cliente_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Cliente.objects.all(), source='cliente', write_only=True
    )

    servicio = ServicioSerializer(read_only=True)
    servicio_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Servicio.objects.all(), source='servicio', write_only=True
    )

    class Meta:
        model = models.Comentario
        fields = '__all__'

    def validate_cliente(self, value):
        if not value or models.Cliente.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("El cliente no existe.")
        return value
    
    def validate_servicio(self, value):
        if not value or models.Servicio.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("El servicio no existe.")
        return value
    
    def validate_calificacion(self, value):
        if value > 5 or value < 1:
            raise serializers.ValidationError("La calificación debe ser entre 1 y 5")
        return value
    
    def validate_texto(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("El comentario no puede estar vacio.")
        return value
    
    def validate_fecha(self, value):
        if value > date.today():
            raise serializers.ValidationError("La fecha del comentario no puede ser futura.")
        return value