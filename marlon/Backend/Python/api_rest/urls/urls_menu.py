from django.urls import path, include
from rest_framework import routers
from api_rest.views.menu_views import PlatoViewSet, CategoriaViewSet

# Router para menu endpoints
menu_router = routers.DefaultRouter()
menu_router.register(r'platos', PlatoViewSet, 'platos')
menu_router.register(r'categorias', CategoriaViewSet, 'categorias')

urlpatterns = [
    path('', include(menu_router.urls)),
]
