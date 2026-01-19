"""
URLs para integración con partners externos
============================================
Pilar 4: n8n - Event Bus

Estos endpoints manejan comunicación bidireccional con partners:
- Recibir actualizaciones de partners
- Procesar reservas desde partners
- Sincronización de datos
"""
from django.urls import path
from ..views import partner_views

urlpatterns = [
    # ========================================
    # Actualizaciones de Partners
    # ========================================
    
    # Recibir actualizaciones de datos de partners
    # POST /api_rest/partner-updates/
    path('partner-updates/', partner_views.partner_updates, name='partner-updates'),
    
    # Estado de sincronización con partner
    # GET /api_rest/partner/sync-status/?partner_id=xxx
    path('partner/sync-status/', partner_views.partner_sync_status, name='partner-sync-status'),
    
    # ========================================
    # Reservas desde Partners
    # ========================================
    
    # Crear reserva desde partner
    # POST /api_rest/reservas/partner/
    path('reservas/partner/', partner_views.partner_reserva, name='partner-reserva'),
    
    # Cancelar reserva desde partner
    # POST /api_rest/reservas/partner/cancel/
    path('reservas/partner/cancel/', partner_views.partner_cancel_reserva, name='partner-cancel-reserva'),
]
