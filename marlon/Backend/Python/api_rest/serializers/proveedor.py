from rest_framework import serializers
from .. import models
from django.db import transaction
from .ubicacion import UbicacionSerializer


class ProveedorSerializer(serializers.ModelSerializer):
    ubicacion = UbicacionSerializer(required=False, allow_null=True)

    class Meta:
        model = models.Proveedor
        fields = ['id', 'user_id', 'telefono', 'descripcion', 'ubicacion']
        read_only_fields = ['id']

    def validate_telefono(self, value):
        if not value:
            raise serializers.ValidationError("El número de teléfono es obligatorio.")
        if len(value) != 10:
            raise serializers.ValidationError("El número de teléfono debe tener 10 dígitos.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        ubicacion_data = validated_data.pop('ubicacion', None)
        ubicacion = None

        if ubicacion_data:
            ubicacion_serializer = UbicacionSerializer(data=ubicacion_data)
            ubicacion_serializer.is_valid(raise_exception=True)
            ubicacion = ubicacion_serializer.save()

        proveedor = models.Proveedor.objects.create(
            ubicacion=ubicacion,
            **validated_data
        )
        return proveedor

    @transaction.atomic
    def update(self, instance, validated_data):
        ubicacion_data = validated_data.pop('ubicacion', None)

        if ubicacion_data:
            if instance.ubicacion:
                ubicacion_serializer = UbicacionSerializer(
                    instance.ubicacion,
                    data=ubicacion_data
                )
                ubicacion_serializer.is_valid(raise_exception=True)
                ubicacion_serializer.save()
            else:
                ubicacion_serializer = UbicacionSerializer(data=ubicacion_data)
                ubicacion_serializer.is_valid(raise_exception=True)
                instance.ubicacion = ubicacion_serializer.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
