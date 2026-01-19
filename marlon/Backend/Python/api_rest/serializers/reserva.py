from rest_framework import serializers
from .. import models
from .cliente import ClienteSerializer
from datetime import date, datetime

class ReservaSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer(read_only=True)
    cliente_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Cliente.objects.all(), source='cliente', write_only=True
    )

    class Meta:
        model = models.Reserva
        fields = '__all__'

    def validate_cliente(self, value):
        if not value or not models.Cliente.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("El cliente no existe.")
        return value
    
    def validate_fecha(self, value):
        if value < date.today():
            raise serializers.ValidationError("No puede hacer reservas de fechas pasadas.")
        return value
    
    def validate_hora(self, value):
        fecha = self.initial_data.get('fecha')
        if fecha:
            fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
            if fecha_obj == date.today() and value <= datetime.now().time():
                raise serializers.ValidationError("La hora de la reserva debe ser futura.")
        
        return value
        
    def validate_estado(self, value):
        estados_valido = ['pendiente', 'confirmada', 'cancelada']
        if value not in estados_valido:
            raise serializers.ValidationError(f"El estado debe ser uno de {estados_valido}.")
        return value
    
    def validate_total_estimado(self, value):
        if value < 0:
            raise serializers.ValidationError("El total estimado debe ser un valor positivo.")
        return value
    
    def validate(self, data):
        cliente = data.get('cliente')
        fecha = data.get('fecha')
        hora = data.get('hora')

        if models.Reserva.objects.filter(cliente=cliente, fecha = fecha, hora=hora).exists():
            raise serializers.ValidationError("El cliente ya tiene una reserva en esta fecha y hora.")
        return data