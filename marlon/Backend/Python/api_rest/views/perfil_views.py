from rest_framework import status, permissions
from rest_framework.response import Response
from api_rest.authentication import JWTAuthentication
from rest_framework.generics import GenericAPIView
from drf_spectacular.utils import extend_schema
from api_rest.models import Cliente, Proveedor, Ubicacion
from api_rest.serializers import ClienteSerializer, ProveedorSerializer


class JWTRequired(permissions.BasePermission):
    """Permite acceso si hay un JWT válido (jwt_payload presente)."""
    def has_permission(self, request, view):
        return hasattr(request, 'jwt_payload') and request.jwt_payload.get('sub')


@extend_schema(responses={200: dict})
class ProfileView(GenericAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [JWTRequired]

    def get(self, request):
        payload = request.jwt_payload

        perfil_data = {
            "id": payload.get("sub"),      # 👈 ID REAL del usuario
            "email": payload.get("email"),
            "rol": payload.get("role"),
        }

        return Response(perfil_data, status=status.HTTP_200_OK)


@extend_schema(responses={200: dict})
class ProfileUpdateView(GenericAPIView):
    """
    Endpoint para actualizar perfil de cliente/proveedor usando el user_id del JWT.
    Si no existe el registro en Django, lo crea automáticamente.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [JWTRequired]

    def patch(self, request):
        payload = request.jwt_payload
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if not user_id:
            return Response({"error": "No se encontró user_id en el token"}, status=status.HTTP_400_BAD_REQUEST)
        
        data = request.data
        
        # Procesar ubicación si viene en el payload
        ubicacion_data = data.pop('ubicacion', None)
        ubicacion_instance = None
        
        if ubicacion_data and isinstance(ubicacion_data, dict):
            # Solo crear/actualizar si hay datos reales
            if any(ubicacion_data.get(k) for k in ['direccion', 'ciudad', 'provincia', 'pais']):
                ubicacion_instance, _ = Ubicacion.objects.get_or_create(
                    direccion=ubicacion_data.get('direccion', ''),
                    ciudad=ubicacion_data.get('ciudad', ''),
                    provincia=ubicacion_data.get('provincia', ''),
                    pais=ubicacion_data.get('pais', 'Ecuador'),
                )
        
        # Remover campos de usuario que no pertenecen al modelo Cliente/Proveedor
        data.pop('user', None)
        data.pop('username', None)
        data.pop('email', None)
        data.pop('first_name', None)
        data.pop('last_name', None)
        
        try:
            if role == 'cliente':
                cliente, created = Cliente.objects.get_or_create(
                    user_id=user_id,
                    defaults={'telefono': data.get('telefono', '0000000000')}
                )
                
                # Actualizar campos
                if 'telefono' in data:
                    telefono = data['telefono']
                    # Validar longitud
                    if len(telefono) != 10:
                        telefono = telefono.ljust(10, '0')[:10]
                    cliente.telefono = telefono
                
                if ubicacion_instance:
                    cliente.ubicacion = ubicacion_instance
                
                cliente.save()
                
                serializer = ClienteSerializer(cliente)
                return Response({
                    "message": "Perfil actualizado correctamente",
                    "created": created,
                    "data": serializer.data
                }, status=status.HTTP_200_OK)
            
            elif role == 'proveedor':
                proveedor, created = Proveedor.objects.get_or_create(
                    user_id=user_id,
                    defaults={
                        'telefono': data.get('telefono', '0000000000'),
                        'descripcion': data.get('descripcion', ''),
                    }
                )
                
                # Actualizar campos
                if 'telefono' in data:
                    telefono = data['telefono']
                    if len(telefono) != 10:
                        telefono = telefono.ljust(10, '0')[:10]
                    proveedor.telefono = telefono
                
                if 'descripcion' in data:
                    proveedor.descripcion = data['descripcion']
                
                if ubicacion_instance:
                    proveedor.ubicacion = ubicacion_instance
                
                proveedor.save()
                
                serializer = ProveedorSerializer(proveedor)
                return Response({
                    "message": "Perfil actualizado correctamente",
                    "created": created,
                    "data": serializer.data
                }, status=status.HTTP_200_OK)
            
            else:
                return Response({"error": f"Rol no soportado: {role}"}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
