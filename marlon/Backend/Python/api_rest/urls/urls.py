from django.urls import re_path, include, path
from .. import views
from .api_router import router
from ..views.tools import BuscarProductosView, VerReservaView, ObtenerClienteView, CrearReservaView, RegistrarClienteView, ProcesarPagoView, ResumenVentasView

urlpatterns = [
    # Rutas más específicas primero
    path('profile/update/', views.ProfileUpdateView.as_view(), name='profile-update'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('api/v1/', include(router.urls)),
    
    # Pilar 2: Webhooks e Interoperabilidad B2B
    path('api/v1/', include('api_rest.urls.webhook_urls')),
    
    # Tools for MCP
    path('tools/buscar-productos/', BuscarProductosView.as_view(), name='buscar-productos'),
    path('tools/ver-reserva/<int:reserva_id>/', VerReservaView.as_view(), name='ver-reserva'),
    path('tools/obtener-cliente/', ObtenerClienteView.as_view(), name='obtener-cliente'),
    path('tools/crear-reserva/', CrearReservaView.as_view(), name='crear-reserva'),
    path('tools/registrar-cliente/', RegistrarClienteView.as_view(), name='registrar-cliente'),
    path('tools/procesar-pago/', ProcesarPagoView.as_view(), name='procesar-pago'),
    path('tools/resumen-ventas/', ResumenVentasView.as_view(), name='resumen-ventas'),
]
