from .. import serializers, models
from rest_framework import viewsets

class UbicacionView(viewsets.ModelViewSet):
    serializer_class = serializers.UbicacionSerializer
    queryset = models.Ubicacion.objects.all()