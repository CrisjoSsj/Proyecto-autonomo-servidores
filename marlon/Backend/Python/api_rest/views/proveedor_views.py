from rest_framework import viewsets
from api_rest.authentication import JWTAuthentication
from rest_framework.authentication import TokenAuthentication
from .. import serializers, models
from ..permissions import DashboardReadOnly

class ProveedorView(viewsets.ModelViewSet):
    serializer_class = serializers.ProveedorSerializer
    queryset = models.Proveedor.objects.all()
    authentication_classes = [JWTAuthentication, TokenAuthentication]
    permission_classes = [DashboardReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Permitir filtrar por user_id UUID (usado por auth-service)
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset