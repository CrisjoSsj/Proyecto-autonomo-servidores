"""
URLs para reportes y tareas programadas - Usados por n8n
=========================================================
Pilar 4: n8n - Event Bus

Estos endpoints son llamados por los workflows de n8n para:
- Generar reportes diarios
- Obtener reservas próximas
- Limpieza de datos
- Health checks
"""
from django.urls import path
from ..views import report_views

urlpatterns = [
    # ========================================
    # Reportes
    # ========================================
    
    # Reporte diario de estadísticas
    # GET /api_rest/reports/daily/?date=2026-01-01
    path('reports/daily/', report_views.daily_report, name='report-daily'),
    
    # Reporte de pagos pendientes
    # GET /api_rest/reports/pending-payments/?days=3
    path('reports/pending-payments/', report_views.pending_payments_report, name='report-pending-payments'),
    
    # ========================================
    # Reservas para recordatorios
    # ========================================
    
    # Obtener reservas próximas
    # GET /api_rest/reservas/upcoming/?hours=24
    path('reservas/upcoming/', report_views.upcoming_reservations, name='reservas-upcoming'),
    
    # ========================================
    # Mantenimiento
    # ========================================
    
    # Limpieza de datos antiguos
    # DELETE /api_rest/cleanup/old-data/?days=90&dry_run=false
    path('cleanup/old-data/', report_views.cleanup_old_data, name='cleanup-old-data'),
    
    # Health check del sistema
    # GET /api_rest/health/
    path('health/', report_views.system_health_check, name='system-health'),
]
