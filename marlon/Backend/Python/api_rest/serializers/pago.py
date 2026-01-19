from rest_framework import serializers
from .. import models
from .reserva import ReservaSerializer
from django.utils import timezone

class PagoSerializer(serializers.ModelSerializer):
    reserva = ReservaSerializer(read_only=True)
    reserva_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Reserva.objects.all(), source='reserva', write_only=True
    )

    class Meta:
        model = models.Pago
        fields = '__all__'

    def validate_reserva(self, value):
        # Verificar que la reserva exista (ya lo hace PrimaryKeyRelatedField)
        if value.estado == 'cancelada':
            raise serializers.ValidationError(
                "No se puede registrar un pago para una reserva cancelada."
            )

        return value

    def validate_monto(self, value):
        if value < 0:
            raise serializers.ValidationError("El monto no puede ser cero o negativo.")
        return value

    def validate_metodo_pago(self, value):
        metodos_validos = ["efectivo", "tarjeta", "transferencia"]
        if value not in metodos_validos:
            raise serializers.ValidationError(
                f"El método de pago debe ser uno de {metodos_validos}"
            )
        return value

    def validate_fecha_pago(self, value):
        if value is None:
            raise serializers.ValidationError("Debe especificar una fecha de pago.")

        today = timezone.now()
        # Comparar solo la parte de fecha si es offset-naive / aware
        if value > today:
            raise serializers.ValidationError("La fecha de pago no puede ser futura.")
        return value

    def validate(self, data):
        reserva = data.get('reserva')
        monto = data.get('monto')

        if reserva and monto is not None:
            # Calcular el total real basándose en los servicios asociados
            total_servicios = sum(
                rs.servicio.precio for rs in reserva.detalles.all()
            )
            # Usar el mayor entre total_estimado y total de servicios
            total_real = max(reserva.total_estimado, total_servicios)
            
            if total_real > 0 and monto > total_real:
                raise serializers.ValidationError(
                    f"El monto del pago ({monto}) no puede exceder el total de la reserva ({total_real})."
                )

            if models.Pago.objects.filter(reserva=reserva).exists():
                raise serializers.ValidationError(
                    "Ya existe un pago registrado para esta reserva."
                )

        return data
