from rest_framework import serializers
from django.utils import timezone
from datetime import time
from .. import models
from .reserva import ReservaSerializer
from .servicio import ServicioSerializer



class ReservaServicioSerializer(serializers.ModelSerializer):
    reserva = ReservaSerializer(read_only=True)
    reserva_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Reserva.objects.all(), source='reserva', write_only=True
    )

    servicio = ServicioSerializer(read_only=True)
    servicio_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Servicio.objects.all(), source='servicio', write_only=True
    )

    class Meta:
        model = models.ReservaServicio
        fields = '__all__'
        

        def validate_reserva(self, value):
            if not value or not models.Reserva.objects.filter(id=value.id).exists():
                raise serializers.ValidationError("La reserva especificada no existe.")
            return value

        def validate_servicio(self, value):
            if not value or not models.Servicio.objects.filter(id=value.id).exists():
                raise serializers.ValidationError("El servicio especificado no existe.")
            if not value.disponible:
                raise serializers.ValidationError("El servicio no está disponible actualmente.")
            return value
        
        
    def validate_fecha_servicio(self, value):
        """No permitir fechas pasadas"""
        today = timezone.localdate()
        if value < today:
            raise serializers.ValidationError("La fecha no puede ser pasada.")
        return value

    def validate_hora_servicio(self, value):
        """Validar hora según la fecha"""
        fecha = self.initial_data.get("fecha_servicio")
        if not fecha:
            return value  # no validamos si no hay fecha
        fecha = timezone.datetime.strptime(fecha, "%Y-%m-%d").date()
        now = timezone.localtime()

        if fecha == now.date():
            if value <= now.time():
                raise serializers.ValidationError("La hora no puede ser pasada para hoy.")
        elif fecha == now.date() + timezone.timedelta(days=1):
            # mañana permitido solo de 08:00 a 16:00
            if not (time(8, 0) <= value <= time(16, 0)):
                raise serializers.ValidationError("Para mañana la hora debe estar entre 08:00 y 16:00.")
        # para días posteriores no hay restricción
        return value
        