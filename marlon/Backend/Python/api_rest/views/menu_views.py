from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from api_rest.models import Plato, Categoria
from api_rest.serializers.menu_serializers import (
    PlatoSerializer,
    PlatoListSerializer,
    CategoriaSerializer
)


class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para Categorías de menú
    Endpoints: 
    - GET /categorias/ - Listado de categorías
    - GET /categorias/{id}/ - Detalle de categoría
    """
    
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Ordena las categorías alfabéticamente"""
        return Categoria.objects.all().order_by('nombre')


class PlatoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para Platos
    Endpoints:
    - GET /platos/ - Listado de platos disponibles
    - GET /platos/{id}/ - Detalle del plato
    - GET /platos/por-categoria/{categoria_id}/ - Platos por categoría
    - GET /platos/buscar/?search=nombre - Búsqueda de platos
    """
    
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Retorna platos disponibles, con opción de filtrar"""
        queryset = Plato.objects.filter(
            disponible=True,
            estado='disponible'
        ).select_related('categoria')
        
        # Filtrar por categoría si se proporciona
        categoria_id = self.request.query_params.get('categoria_id')
        if categoria_id:
            queryset = queryset.filter(categoria_id=categoria_id)
        
        # Búsqueda por nombre o descripción
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(nombre__icontains=search)
        
        return queryset.order_by('categoria__nombre', 'nombre')
    
    def get_serializer_class(self):
        """Usa serializador simplificado para listados"""
        if self.action == 'list':
            return PlatoListSerializer
        return PlatoSerializer
    
    @action(detail=False, methods=['get'])
    def por_categoria(self, request, *args, **kwargs):
        """
        Endpoint: GET /platos/por-categoria/
        Retorna platos agrupados por categoría
        """
        platos = self.get_queryset()
        categorias = Categoria.objects.all()
        
        data = {}
        for categoria in categorias:
            platos_categoria = platos.filter(categoria=categoria)
            if platos_categoria.exists():
                data[categoria.nombre] = PlatoListSerializer(
                    platos_categoria,
                    many=True
                ).data
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def populares(self, request, *args, **kwargs):
        """
        Endpoint: GET /platos/populares/
        Retorna los platos más populares (con ofertas o destacados)
        """
        populares = self.get_queryset().filter(oferta=True)[:10]
        serializer = PlatoListSerializer(populares, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ofertas(self, request, *args, **kwargs):
        """
        Endpoint: GET /platos/ofertas/
        Retorna solo platos en oferta
        """
        ofertas = self.get_queryset().filter(oferta=True).order_by('-precio_oferta')
        serializer = PlatoListSerializer(ofertas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dietéticos(self, request, *args, **kwargs):
        """
        Endpoint: GET /platos/dietéticos/
        Retorna platos vegetarianos, veganos, sin gluten, etc.
        """
        tipo = request.query_params.get('tipo', 'vegetariano')
        
        filtros = {
            'vegetariano': {'vegetariano': True},
            'vegano': {'vegano': True},
            'sin_gluten': {'sin_gluten': True},
            'picante': {'picante': True},
        }
        
        filtro = filtros.get(tipo, {})
        platos = self.get_queryset().filter(**filtro)
        
        serializer = PlatoListSerializer(platos, many=True)
        return Response(serializer.data)
