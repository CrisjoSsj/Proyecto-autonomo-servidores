from rest_framework.permissions import AllowAny
from api_rest.authentication import JWTAuthentication
from rest_framework import viewsets, status
from .. import models, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
import logging

logger = logging.getLogger(__name__)


class PagoView(viewsets.ModelViewSet):
    serializer_class = serializers.PagoSerializer
    queryset = models.Pago.objects.all()
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        # GET público (dashboard)
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        # Escritura requiere JWT válido
        return []

    def _require_jwt(self):
        payload = getattr(self.request, 'jwt_payload', None)
        if not payload or not payload.get('sub'):
            raise PermissionDenied("Autenticación requerida")
        return payload

    def perform_create(self, serializer):
        # Requiere JWT
        self._require_jwt()

        pago = serializer.save()

        # Sincronizar estado de reserva
        try:
            if getattr(pago, 'estado', None) == 'pagado':
                reserva = pago.reserva
                reserva.estado = 'confirmada'
                reserva.save()
        except Exception:
            logger.exception(
                'Error sincronizando estado de reserva tras creación de pago'
            )

    @action(detail=True, methods=['post'], url_path='mark_pagado')
    def mark_pagado(self, request, pk=None):
        payload = self._require_jwt()
        user_sub = payload.get('sub')
        role = payload.get('role')

        pago = get_object_or_404(models.Pago, pk=pk)
        reserva = pago.reserva

        # Permiso:
        # - admin puede siempre
        # - cliente dueño de la reserva
        if role != 'administrador':
            cliente = models.Cliente.objects.filter(user_id=user_sub).first()
            if not cliente or reserva.cliente_id != cliente.id:
                raise PermissionDenied(
                    "No tienes permiso para marcar este pago como pagado."
                )

        # Marcar como pagado
        pago.estado = 'pagado'
        if not pago.fecha_pago:
            from django.utils import timezone
            pago.fecha_pago = timezone.now()
        pago.save()

        # Actualizar reserva
        try:
            reserva.estado = 'confirmada'
            reserva.save()
        except Exception:
            logger.exception(
                'Error actualizando reserva tras marcar pago como pagado'
            )

        # Notificar WebSocket
        try:
            from ..signals import notify_websocket

            data = {
                'id': pago.id,
                'reserva_id': reserva.id,
                'monto': str(pago.monto),
                'metodo': pago.metodo_pago,
                'fecha': str(pago.fecha_pago),
                'estado': pago.estado,
                'cliente_id': reserva.cliente_id,
            }

            servicios = models.ReservaServicio.objects.filter(reserva=reserva)
            if servicios.exists():
                data['proveedor_id'] = servicios.first().servicio.proveedor_id

            notify_websocket('payment_updated', data)
        except Exception:
            logger.exception(
                'No se pudo notificar WebSocket tras marcar pago'
            )

        serializer = self.get_serializer(pago)
        return Response(serializer.data, status=status.HTTP_200_OK)
