from api_rest.authentication import JWTAuthentication
from api_rest.permissions import IsAuthenticatedOrDashboard
from rest_framework import viewsets
from .. import serializers, models


class ServicioUbicacionView(viewsets.ModelViewSet):
    serializer_class = serializers.ServicioUbicacionSerializer
    queryset = models.ServicioUbicacion.objects.all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedOrDashboard]

    def get_queryset(self):
        queryset = super().get_queryset()

        servicio_id = self.request.query_params.get("servicio_id")

        if servicio_id:
            queryset = queryset.filter(servicio_id=servicio_id)
            
        return queryset