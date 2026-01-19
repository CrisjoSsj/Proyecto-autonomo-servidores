from api_rest.authentication import JWTAuthentication
from rest_framework import viewsets
from .. import serializers, models
from ..permissions import DashboardReadOnly
from rest_framework.exceptions import PermissionDenied
import logging

logger = logging.getLogger(__name__)


class ServicioViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.ServicioSerializer
    queryset = models.Servicio.objects.all()

    authentication_classes = [JWTAuthentication]
    permission_classes = [DashboardReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        qp = self.request.query_params

        payload = getattr(self.request, 'jwt_payload', None)
        role = payload.get('role') if payload else None
        user_sub = payload.get('sub') if payload else None

        # 🔐 solo_mios → solo servicios del proveedor autenticado
        solo_mios = qp.get("solo_mios")
        if solo_mios == "true":
            if not payload or role != "proveedor":
                return queryset.none()

            proveedor = models.Proveedor.objects.filter(user_id=user_sub).first()
            if proveedor:
                queryset = queryset.filter(proveedor_id=proveedor.id)
            else:
                queryset = queryset.none()

        # Filtro por proveedor explícito (dashboard / público)
        # Soporta tanto ID numérico como UUID de auth-service
        proveedor_id_param = qp.get("proveedor_id")
        if proveedor_id_param:
            try:
                # Si es un número, filtrar directamente
                proveedor_id_int = int(proveedor_id_param)
                queryset = queryset.filter(proveedor_id=proveedor_id_int)
            except ValueError:
                # Es un UUID, buscar el proveedor por user_id
                proveedor = models.Proveedor.objects.filter(user_id=proveedor_id_param).first()
                if proveedor:
                    queryset = queryset.filter(proveedor_id=proveedor.id)
                else:
                    queryset = queryset.none()

        # Filtro por categoría
        categoria_id = qp.get("categoria_id")
        if categoria_id:
            queryset = queryset.filter(categoria_id=categoria_id)

        return queryset

    def perform_create(self, serializer):
        payload = getattr(self.request, 'jwt_payload', None)

        if not payload or payload.get("role") != "proveedor":
            raise PermissionDenied("Solo un proveedor puede crear servicios.")

        user_sub = payload.get("sub")

        proveedor = models.Proveedor.objects.filter(
            user_id=user_sub
        ).first()

        if not proveedor:
            # Autocrear proveedor en Django si no existe, para sincronizar con auth-service
            # Esto permite que un usuario con rol 'proveedor' en Auth Service pueda crear su primer servicio
            from django.db import transaction, IntegrityError
            try:
                with transaction.atomic():
                    proveedor, created = models.Proveedor.objects.get_or_create(user_id=user_sub, defaults={'telefono': ''})
            except IntegrityError as e:
                # Manejar race conditions o errores en la inserción: intentar recuperar el proveedor existente
                logger.exception("Error auto-creating Proveedor (IntegrityError): %s", e)
                proveedor = models.Proveedor.objects.filter(user_id=user_sub).first()
                from rest_framework.exceptions import APIException
                if not proveedor:
                    raise APIException("Error creando proveedor en el servidor")

        try:
            serializer.save(proveedor=proveedor)
        except Exception as e:
            logger.exception("Error saving Servicio: %s", e)
            from rest_framework.exceptions import APIException
            raise APIException("Error guardando servicio")
