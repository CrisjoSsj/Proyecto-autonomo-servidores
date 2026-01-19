from rest_framework import serializers
from .. import models

class UbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Ubicacion
        fields = '__all__'

    def validate(self, data):
        campos = ["direccion", "ciudad", "provincia", "pais"]
        for campo in campos:
            if not data.get(campo) or not (data[campo]).strip():
                raise serializers.ValidationError({campo: "Este campo no puede estar vacío"})
        return data