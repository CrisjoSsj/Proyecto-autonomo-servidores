from rest_framework import serializers
from .. import models
from .servicio import ServicioSerializer
from urllib.parse import urlparse
import os


class FotoServicioSerializer(serializers.ModelSerializer):
    servicio = ServicioSerializer(read_only=True)
    servicio_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Servicio.objects.all(), source='servicio', write_only=True
    )

    class Meta:
        model = models.FotoServicio
        fields = '__all__'

        def validate_servicio(self, value):
            if not value or not models.Servicio.objects.filter(id=value.id).exists():
                raise serializers.ValidationError("El servicio especificado no existe.")
            return value
        
        def validate_url_foto(self, value):
            if not value or not value.strip():
                raise serializers.ValidationError("La URL de la foto no puede estar vacía.")
            parsed_url = urlparse(value)
            if not parsed_url.scheme in ['http', 'https']:
                if not any(value.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                    raise serializers.ValidationError("La URL debe apuntar a una imagen válida (.jpg, .jpeg, .png, .gif).")
                else:
                    if not os.path.splitext(value)[1].lower() in ['.jpg', '.jpeg', '.png', '.gif']:
                        raise serializers.ValidationError("El archivo local debe ser una imagen válida (.jpg, .jpeg, .png, .gif).")
                    if value.startswith('/') or '..' in value:
                        raise serializers.ValidationError("La ruta local no puede ser absoluta ni salir de la carpeta de medios.")
                    
                    return value
                
        def validate(self, data):
            servicio = data.get('servicio')
            url_foto = data.get('url_foto')

            if models.FotoServicio.objects.filter(servicio=servicio, url_foto=url_foto).exists():
                raise serializers.ValidationError("Esta foto ya esta asociada al servicio.")
            
            max_fotos = 5
            total_fotos = models.FotoServicio.objects.filter(servicio=servicio).count()
            if total_fotos >= max_fotos:
                raise serializers.ValidationError(f"No se pueden agregar más de {max_fotos} fotos a un servicio.")
            
            return data