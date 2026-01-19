from rest_framework import serializers
from .. import models
from .proveedor import ProveedorSerializer
from .categoria import CategoriaSerializer
from .ubicacion import UbicacionSerializer

class ServicioSerializer(serializers.ModelSerializer):
    proveedor = ProveedorSerializer(read_only=True)
    proveedor_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Proveedor.objects.all(),
        source='proveedor',
        write_only=True,
        required=False
    )

    categoria = CategoriaSerializer(read_only=True)
    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Categoria.objects.all(),
        source='categoria',
        write_only=True
    )

    ubicaciones = UbicacionSerializer(many=True, read_only=True)

    class Meta:
        model = models.Servicio
        fields = '__all__'
        read_only_fields = ['proveedor']

    def validate_nombre_servicio(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("El nombre del servicio no puede estar vacío.")
        if len(value) < 5:
            raise serializers.ValidationError("El nombre del servicio debe tener más de 5 caracteres.")
        return value

    def validate_rating_promedio(self, value):
        if value is not None and (value < 0 or value > 5):
            raise serializers.ValidationError("El rating promedio debe estar entre 0 y 5.")
        return value

    def validate_precio(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("El precio no puede ser negativo.")
        return value

    def validate(self, data):
        proveedor = data.get('proveedor') or getattr(self.instance, 'proveedor', None)
        categoria = data.get('categoria') or getattr(self.instance, 'categoria', None)
        nombre = data.get('nombre_servicio') or getattr(self.instance, 'nombre_servicio', None)

        # Nota: En creación, el proveedor se asigna en perform_create usando el JWT
        # Solo validar proveedor si es una actualización (self.instance existe)
        if self.instance and not proveedor:
            raise serializers.ValidationError({"proveedor": "Debe especificar un proveedor."})

        # Nota: La validación de rol se hace en la vista (perform_create) usando el JWT
        # El modelo Proveedor ya no tiene relación FK a User de Django

        if not categoria:
            raise serializers.ValidationError({"categoria": "Debe especificar una categoría."})
        if not models.Categoria.objects.filter(id=categoria.id).exists():
            raise serializers.ValidationError({"categoria": "La categoría especificada no existe."})

        # ✅ Validación de duplicados excluyendo el mismo servicio
        # Solo validar si tenemos ambos valores (en creación, proveedor viene de perform_create)
        if nombre and proveedor:
            qs = models.Servicio.objects.filter(proveedor=proveedor, nombre_servicio__iexact=nombre)
            if self.instance:
                qs = qs.exclude(id=self.instance.id)
            if qs.exists():
                raise serializers.ValidationError({"nombre_servicio": "Ya existe un servicio con ese nombre para el mismo proveedor."})

        descripcion = data.get('descripcion') or getattr(self.instance, 'descripcion', None)
        if descripcion and len(descripcion.strip()) < 10:
            raise serializers.ValidationError({"descripcion": "La descripción debe tener mínimo 10 caracteres."})

        return data
