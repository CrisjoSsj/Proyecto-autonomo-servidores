from rest_framework import permissions


class IsAuthenticatedOrDashboard(permissions.BasePermission):
    """
    Permite acceso autenticado vía JWT
    O acceso anónimo desde el dashboard (X-Dashboard: true)
    """

    def has_permission(self, request, view):
        # Si es dashboard, permitir acceso
        if request.META.get('HTTP_X_DASHBOARD') == 'true':
            return True
        
        # Si es autenticado normalmente, permitir acceso
        payload= getattr(request, 'jwt_payload', None)
        if payload and payload.get('sub'):
            return True
        
        # Rechazar acceso no autenticado
        return False


class DashboardReadOnly(permissions.BasePermission):
    """
    Permite lectura (GET) sin autenticación.
    Permite escritura solo con JWT válido o Token de servicio.
    """

    def has_permission(self, request, view):
        # GET requests sin autenticación (acceso anónimo para lectura)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Usuarios autenticados vía JWT pueden hacer cualquier cosa
        payload = getattr(request, 'jwt_payload', None)
        if payload and payload.get('sub'):
            return True
        
        # Usuarios autenticados vía TokenAuthentication (service tokens) pueden hacer cualquier cosa
        if request.user and request.user.is_authenticated:
            return True
        
        return False


class AllowCreateOrAuthenticated(permissions.BasePermission):
    """
    Permite crear (POST) sin autenticación para registro público.
    Permite lectura (GET) sin autenticación.
    Requiere JWT para PUT/PATCH/DELETE.
    """

    def has_permission(self, request, view):
        # GET y POST permitidos sin autenticación
        if request.method in permissions.SAFE_METHODS or request.method == 'POST':
            return True
        
        # Para PUT/PATCH/DELETE, requiere JWT
        payload = getattr(request, 'jwt_payload', None)
        if payload and payload.get('sub'):
            return True
        
        return False
