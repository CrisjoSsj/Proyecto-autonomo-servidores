"""
URLs para Webhooks B2B - Pilar 2
=================================
Pilar 2: Webhooks e Interoperabilidad B2B

Endpoints disponibles:

PARTNERS:
- POST   /partners/register              - Registrar nuevo partner
- GET    /partners/                       - Listar partners
- GET    /partners/{code}/                - Detalle de partner
- PUT    /partners/{code}/                - Actualizar partner
- DELETE /partners/{code}/                - Eliminar partner
- GET    /partners/{code}/subscriptions   - Ver suscripciones
- POST   /partners/{code}/subscriptions   - Agregar suscripciones
- GET    /partners/events                 - Eventos disponibles

WEBHOOKS B2B:
- POST   /webhooks/b2b/receive            - Recibir webhook de partner
- GET    /webhooks/b2b/deliveries         - Historial de entregas
- GET    /webhooks/b2b/logs               - Logs de eventos
- POST   /webhooks/b2b/retry              - Reintentar fallidos
"""
from django.urls import path
from ..views import b2b_views

urlpatterns = [
    # ========================================
    # REGISTRO Y GESTIÓN DE PARTNERS
    # ========================================
    
    # Registrar nuevo partner B2B
    # POST /api/v1/partners/register
    path('partners/register', b2b_views.PartnerRegisterView.as_view(), name='partner-register'),
    
    # Listar todos los partners
    # GET /api/v1/partners/
    path('partners/', b2b_views.PartnerListView.as_view(), name='partner-list'),
    
    # Eventos disponibles para suscripción
    # GET /api/v1/partners/events
    path('partners/events', b2b_views.available_events, name='partner-events'),
    
    # Detalle, actualización y eliminación de partner
    # GET/PUT/DELETE /api/v1/partners/{code}/
    path('partners/<str:code>/', b2b_views.PartnerDetailView.as_view(), name='partner-detail'),
    
    # Gestión de suscripciones de un partner
    # GET/POST /api/v1/partners/{code}/subscriptions
    path('partners/<str:code>/subscriptions', b2b_views.PartnerSubscriptionsView.as_view(), name='partner-subscriptions'),
    
    # ========================================
    # WEBHOOKS B2B - RECEPCIÓN Y ENVÍO
    # ========================================
    
    # Recibir webhooks de partners externos
    # POST /api/v1/webhooks/b2b/receive
    path('webhooks/b2b/receive', b2b_views.B2BWebhookReceiveView.as_view(), name='webhook-b2b-receive'),
    
    # Historial de entregas de webhooks
    # GET /api/v1/webhooks/b2b/deliveries?partner=xxx&status=xxx
    path('webhooks/b2b/deliveries', b2b_views.WebhookDeliveriesView.as_view(), name='webhook-b2b-deliveries'),
    
    # Logs de eventos webhook
    # GET /api/v1/webhooks/b2b/logs?direction=incoming&partner=xxx
    path('webhooks/b2b/logs', b2b_views.WebhookEventLogsView.as_view(), name='webhook-b2b-logs'),
    
    # Reintentar entregas fallidas
    # POST /api/v1/webhooks/b2b/retry
    path('webhooks/b2b/retry', b2b_views.RetryFailedDeliveriesView.as_view(), name='webhook-b2b-retry'),
]
