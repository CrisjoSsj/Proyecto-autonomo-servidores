from api_rest.authentication import JWTAuthentication
from rest_framework import viewsets
from rest_framework.response import Response
from django.utils.dateparse import parse_date
from .. import models, serializers
from ..permissions import DashboardReadOnly


class ReservaView(viewsets.ModelViewSet):
    serializer_class = serializers.ReservaSerializer
    queryset = models.Reserva.objects.all()

    authentication_classes = [JWTAuthentication]
    permission_classes = [DashboardReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        qp = self.request.query_params

        payload = getattr(self.request, 'jwt_payload', None)
        role = payload.get('role') if payload else None
        user_sub = payload.get('sub') if payload else None

        # 🔐 FILTRO AUTOMÁTICO POR ROL
        if payload:
            if role == 'cliente':
                cliente = models.Cliente.objects.filter(user_id=user_sub).first()
                if cliente:
                    queryset = queryset.filter(cliente_id=cliente.id)
                else:
                    queryset = queryset.none()

            elif role == 'proveedor':
                proveedor = models.Proveedor.objects.filter(user_id=user_sub).first()
                if proveedor:
                    queryset = queryset.filter(
                        detalles__servicio__proveedor_id=proveedor.id
                    ).distinct()

        # 🔎 FILTROS OPCIONALES (solo refinan lo permitido)
        
        # Filtro explícito por cliente_id (desde GraphQL o Frontend)
        # Soporta tanto ID numérico como UUID de auth-service
        cliente_id_param = qp.get("cliente_id")
        if cliente_id_param:
            # Verificar si es un UUID (auth-service user_id) o un ID numérico
            try:
                # Si es un número, filtrar directamente por cliente_id
                cliente_id_int = int(cliente_id_param)
                queryset = queryset.filter(cliente_id=cliente_id_int)
            except ValueError:
                # Es un UUID, buscar el cliente por user_id
                cliente = models.Cliente.objects.filter(user_id=cliente_id_param).first()
                if cliente:
                    queryset = queryset.filter(cliente_id=cliente.id)
                else:
                    queryset = queryset.none()
        
        estado = qp.get("estado")
        if estado:
            queryset = queryset.filter(estado=estado)

        fecha_desde = qp.get("fechaDesde")
        if fecha_desde:
            queryset = queryset.filter(fecha__gte=parse_date(fecha_desde))

        fecha_hasta = qp.get("fechaHasta")
        if fecha_hasta:
            queryset = queryset.filter(fecha__lte=parse_date(fecha_hasta))

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        limit = request.query_params.get("limit")
        offset = request.query_params.get("offset")

        if offset:
            queryset = queryset[int(offset):]
        if limit:
            queryset = queryset[:int(limit)]

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
