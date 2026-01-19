from rest_framework import viewsets
from api_rest.authentication import JWTAuthentication
from .. import serializers, models
from ..permissions import DashboardReadOnly

class CategoriaView(viewsets.ModelViewSet):
    serializer_class = serializers.CategoriaSerializer
    queryset = models.Categoria.objects.all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [DashboardReadOnly]