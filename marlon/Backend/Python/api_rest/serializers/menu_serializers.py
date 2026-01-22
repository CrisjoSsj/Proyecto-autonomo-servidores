from rest_framework import serializers
from api_rest.models import Plato, Categoria


class CategoriaSerializer(serializers.ModelSerializer):
    """Serializador para Categorías"""
    
    class Meta:
        model = Categoria
        fields = [
            'id',
            'nombre',
            'descripcion',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'id']


class PlatoSerializer(serializers.ModelSerializer):
    """Serializador para Platos con categoría anidada"""
    
    categoria = CategoriaSerializer(read_only=True)
    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        source='categoria',
        write_only=True,
        required=False
    )
    precio_final = serializers.SerializerMethodField()
    id_categoria = serializers.SerializerMethodField()
    
    class Meta:
        model = Plato
        fields = [
            'id_plato',
            'id_categoria',
            'nombre',
            'descripcion',
            'precio',
            'precio_oferta',
            'oferta',
            'precio_final',
            'categoria',
            'categoria_id',
            'estado',
            'disponible',
            'imagen_url',
            'tiempo_preparacion',
            'calorias',
            'alergenos',
            'vegetariano',
            'vegano',
            'sin_gluten',
            'picante',
            'nivel_picante',
            'ingredientes',
            'stock',
            'fecha_creacion',
            'fecha_actualizacion',
            'creado_por'
        ]
        read_only_fields = ['id_plato', 'fecha_creacion', 'fecha_actualizacion']
    
    def get_precio_final(self, obj):
        """Retorna el precio considerando ofertas"""
        return float(obj.get_precio_final())
    
    def get_id_categoria(self, obj):
        """Retorna el ID de la categoría para compatibilidad con frontend"""
        return obj.categoria.id if obj.categoria else None


class PlatoListSerializer(serializers.ModelSerializer):
    """Serializador simplificado para listados"""
    
    id_categoria = serializers.SerializerMethodField()
    precio_final = serializers.SerializerMethodField()
    
    class Meta:
        model = Plato
        fields = [
            'id_plato',
            'id_categoria',
            'nombre',
            'descripcion',
            'precio',
            'precio_oferta',
            'oferta',
            'precio_final',
            'estado',
            'disponible',
            'imagen_url',
            'vegetariano',
            'vegano',
            'sin_gluten',
            'picante',
            'nivel_picante'
        ]
    
    def get_id_categoria(self, obj):
        return obj.categoria.id if obj.categoria else None
    
    def get_precio_final(self, obj):
        return float(obj.get_precio_final())
