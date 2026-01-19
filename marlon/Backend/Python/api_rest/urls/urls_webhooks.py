"""
URLs para webhooks externos - Event Bus (n8n)
==============================================
Pilar 4: Centralización de eventos externos

Endpoints disponibles:
- /webhooks/payments/ - Webhooks de pasarelas de pago
- /webhooks/partner/  - Webhooks del grupo partner
- /webhooks/telegram/ - Mensajes de Telegram
- /webhooks/email/    - Emails entrantes
- /webhooks/whatsapp/ - Mensajes de WhatsApp
- /webhooks/tasks/    - Tareas programadas
- /webhooks/health/   - Health check
"""
from django.urls import path
from ..views import webhook_views

urlpatterns = [
    # ========================================
    # WORKFLOW 1: Payment Handler
    # ========================================
    path('payments/stripe/', webhook_views.payment_webhook_stripe, name='webhook-payment-stripe'),
    path('payments/payu/', webhook_views.payment_webhook_payu, name='webhook-payment-payu'),
    path('payments/mercadopago/', webhook_views.payment_webhook_mercadopago, name='webhook-payment-mercadopago'),
    path('payments/', webhook_views.payment_webhook_generic, name='webhook-payment-generic'),
    
    # Simulador de pagos para testing
    path('payments/simulate/', webhook_views.simulate_payment_webhook, name='webhook-payment-simulate'),
    path('payments/test/', webhook_views.payment_test_page, name='webhook-payment-test'),
    
    # ========================================
    # WORKFLOW 2: Partner Handler
    # ========================================
    path('partner/', webhook_views.partner_webhook, name='webhook-partner'),
    
    # ========================================
    # WORKFLOW 3: MCP Input Handler
    # ========================================
    path('telegram/', webhook_views.telegram_webhook, name='webhook-telegram'),
    path('email/', webhook_views.email_webhook, name='webhook-email'),
    path('whatsapp/', webhook_views.whatsapp_webhook, name='webhook-whatsapp'),
    path('whatsapp/verify/', webhook_views.whatsapp_verify, name='webhook-whatsapp-verify'),
    
    # ========================================
    # WORKFLOW 4: Scheduled Tasks
    # ========================================
    path('tasks/trigger/', webhook_views.trigger_scheduled_task, name='webhook-task-trigger'),
    path('tasks/', webhook_views.list_available_tasks, name='webhook-tasks-list'),
    
    # ========================================
    # Health Check & Callbacks
    # ========================================
    path('health/', webhook_views.n8n_health, name='webhook-health'),
    path('callback/', webhook_views.n8n_callback, name='webhook-n8n-callback'),
]
