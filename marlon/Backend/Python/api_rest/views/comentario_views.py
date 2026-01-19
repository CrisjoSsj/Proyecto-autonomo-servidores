from api_rest.authentication import JWTAuthentication
from rest_framework import viewsets
from .. import models, serializers
from api_rest.permissions import IsAuthenticatedOrDashboard


class ComentarioView(viewsets.ModelViewSet):
    serializer_class = serializers.ComentarioSerializer
    queryset = models.Comentario.objects.all()

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedOrDashboard]

    def get_queryset(self):
        queryset = super().get_queryset()
        servicio_id = self.request.query_params.get("servicio_id")
        if servicio_id:
            queryset = queryset.filter(servicio_id=servicio_id)
        return queryset

    def perform_create(self, serializer):
        payload = self.request.jwt_payload
        user_sub = payload.get('sub')

        if not user_sub:
            raise ValueError("Token inválido: sub no encontrado")

        cliente = models.Cliente.objects.filter(user_id=user_sub).first()
        if not cliente:
            raise ValueError("Solo los clientes pueden crear comentarios")

        serializer.save(cliente=cliente)
