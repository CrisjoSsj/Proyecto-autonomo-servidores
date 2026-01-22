from django.urls import path
from . import views

app_name = 'webhooks'

urlpatterns = [
    # Payment webhooks
    path('payments/stripe/', views.stripe_webhook, name='stripe'),
    path('payments/mercadopago/', views.mercadopago_webhook, name='mercadopago'),
    path('payments/payu/', views.payu_webhook, name='payu'),
    
    # Integration webhooks
    path('partner/', views.partner_webhook, name='partner'),
    path('telegram/', views.telegram_webhook, name='telegram'),
    path('custom/', views.custom_webhook, name='custom'),
    
    # Utility endpoints
    path('health/', views.webhook_health, name='health'),
    path('events/', views.webhook_events_list, name='events'),
]
