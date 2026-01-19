from api_rest.authentication import JWTAuthentication
from rest_framework import viewsets
from .. import models, serializers
import logging
from rest_framework.exceptions import PermissionDenied
from ..permissions import DashboardReadOnly

logger = logging.getLogger(__name__)


class ReservaServicioView(viewsets.ModelViewSet):
    serializer_class = serializers.ReservaServicioSerializer
    queryset = models.ReservaServicio.objects.all()

    authentication_classes = [JWTAuthentication]
    permission_classes = [DashboardReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        reserva_id = self.request.query_params.get("reserva_id")
        proveedor_id = self.request.query_params.get("proveedor_id")

        if reserva_id:
            queryset = queryset.filter(reserva_id=reserva_id)

        if proveedor_id:
            # Soporta tanto ID numérico como UUID de auth-service
            try:
                proveedor_id_int = int(proveedor_id)
                queryset = queryset.filter(servicio__proveedor_id=proveedor_id_int)
            except ValueError:
                # Es un UUID, buscar el proveedor por user_id
                proveedor = models.Proveedor.objects.filter(user_id=proveedor_id).first()
                if proveedor:
                    queryset = queryset.filter(servicio__proveedor_id=proveedor.id)
                else:
                    queryset = queryset.none()

        return queryset

    def perform_update(self, serializer):
        payload = getattr(self.request, 'jwt_payload', None)
        nuevo_estado = serializer.validated_data.get('estado')

        # Solo validamos permisos si se quiere cambiar el estado
        if nuevo_estado is not None:
            if not payload or not payload.get('sub'):
                raise PermissionDenied(
                    "Autenticación requerida para cambiar el estado."
                )

            user_sub = payload.get('sub')
            role = payload.get('role')

            # Admin puede siempre
            if role != 'administrador':
                proveedor = models.Proveedor.objects.filter(
                    user_id=user_sub
                ).first()

                if not proveedor:
                    raise PermissionDenied(
                        "Solo un proveedor puede cambiar el estado del servicio."
                    )

                instancia = serializer.instance
                servicio = instancia.servicio if instancia else None

                if not servicio or servicio.proveedor_id != proveedor.id:
                    raise PermissionDenied(
                        "No tienes permiso para cambiar el estado de este servicio."
                    )

        updated = serializer.save()

        # Sincronizar estado de la Reserva padre
        try:
            reserva = updated.reserva
            hijos = reserva.detalles.all()

            if hijos.exists():
                estados = {h.estado for h in hijos}

                if estados and all(s == 'confirmada' for s in estados):
                    reserva.estado = 'confirmada'
                    reserva.save()
                elif estados and all(s == 'rechazada' for s in estados):
                    reserva.estado = 'cancelada'
                    reserva.save()
        except Exception:
            logger.exception(
                'Error actualizando estado de la Reserva tras cambiar ReservaServicio'
            )
