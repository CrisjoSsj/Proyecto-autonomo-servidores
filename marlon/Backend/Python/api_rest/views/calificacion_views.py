from api_rest.authentication import JWTAuthentication
from rest_framework import viewsets
from .. import models, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from ..permissions import DashboardReadOnly



class CalificacionView(viewsets.ModelViewSet):
    serializer_class = serializers.CalificacionSerializer
    queryset = models.Calificacion.objects.all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [DashboardReadOnly]


    def perform_create(self, serializer):
        payload = self.request.jwt_payload
        user_sub = payload.get('sub')

        if not user_sub:
            raise ValueError("Token inválido: sub no encontrado")
        
        cliente = models.Cliente.objects.filter(user_id=user_sub).first()
        if not cliente:
            raise ValueError("Cliente no encontrado para este usuario")
        
        serializer.save(cliente=cliente)

    # Endpoint extra opcional para obtener calificaciones por servicio
    @action(detail=False, methods=['get'], url_path='servicio/(?P<servicio_id>[^/.]+)')
    def por_servicio(self, request, servicio_id=None):
        calificaciones = self.queryset.filter(servicio_id=servicio_id)
        serializer = self.get_serializer(calificaciones, many=True)
        return Response(serializer.data)