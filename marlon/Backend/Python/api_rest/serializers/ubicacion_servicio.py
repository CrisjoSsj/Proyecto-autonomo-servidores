from rest_framework import serializers
from .. import models
from .ubicacion import UbicacionSerializer
from .servicio import ServicioSerializer

class ServicioUbicacionSerializer(serializers.ModelSerializer):
    ubicacion = UbicacionSerializer(read_only=True)
    ubicacion_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Ubicacion.objects.all(), source='ubicacion', write_only=True
    )

    servicio = ServicioSerializer(read_only=True)
    servicio_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Servicio.objects.all(), source='servicio', write_only=True
    )

    class Meta:
        model = models.ServicioUbicacion
        fields = '__all__'

    def validation(self, data):
        servicio = data.get('servicio')
        ubicacion = data.get('ubicacion')

        if not servicio or not models.Servicio.objects.filter(id=servicio.id).exists():
            raise serializers.ValidationError({"servicio": "Debe especificar un servicio."})
        if not ubicacion or not models.Ubicacion.objects.filter(id=ubicacion.id).exists():
            raise serializers.ValidationError({"ubicacion": "Debe especificar una ubicación."})
        
        if models.Servicio.objects.filter(servicio=servicio, ubicacion=ubicacion).exists():
            raise serializers.ValidationError("Este servicio ya está asociado a la ubicación indicada")

        if ubicacion.proveedores.filter(id=servicio.proveedor.id).exists() is False:
            raise serializers.ValidationError("La ubicación seleccionada no pertenece al proveedor del servicio.")
        return data