from rest_framework import routers
from .. import views
from ..views.menu_views import PlatoViewSet, CategoriaViewSet

router = routers.DefaultRouter()

router.register(r'ubicacion', views.UbicacionView, 'ubicacion')
router.register(r'cliente', views.ClienteView, 'cliente')
router.register(r'proveedor', views.ProveedorView, 'proveedor')
router.register(r'categoria', views.CategoriaView, 'categoria')
router.register(r'servicio', views.ServicioViewSet, 'servicio')
router.register(r'servicioUbicacion', views.ServicioUbicacionView, 'servicio-Ubicacion')
router.register(r'fotoServicio', views.FotoServicioView, 'foto-servicio')
router.register(r'reserva', views.ReservaView, 'reserva')
router.register(r'reservaServicio', views.ReservaServicioView, 'reserva-servicio')
router.register(r'pago', views.PagoView, 'pago')
router.register(r'comentario', views.ComentarioView, 'comentario')
router.register(r'calificacion', views.CalificacionView, 'calificacion')
router.register(r'document', views.DocumentView, 'document')

# Menu endpoints para Chuwue Grill
router.register(r'platos', PlatoViewSet, 'platos')
router.register(r'categorias-menu', CategoriaViewSet, 'categorias-menu')
