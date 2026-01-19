from django.contrib import admin
from .models import (
    Categoria, Cliente, Proveedor, Servicio, Reserva, ReservaServicio,
    Pago, Calificacion, Comentario, Ubicacion, ServicioUbicacion, FotoServicio,
)
from .models.partner import Partner, WebhookSubscription, WebhookDelivery, WebhookEventLog
from .models.payment_transaction import PaymentTransaction


# ============================================================================
# ADMIN PARA MODELOS EXISTENTES
# ============================================================================

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'descripcion']
    search_fields = ['nombre']


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_id', 'telefono', 'ubicacion', 'created_at']
    search_fields = ['user_id', 'telefono']
    list_filter = ['created_at']


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_id', 'telefono', 'descripcion']
    search_fields = ['user_id', 'telefono']
    list_filter = ['created_at']


@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre_servicio', 'proveedor', 'categoria', 'precio', 'created_at']
    search_fields = ['nombre_servicio', 'proveedor__nombre']
    list_filter = ['categoria', 'created_at']


@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = ['id', 'cliente', 'fecha', 'hora', 'estado', 'total_estimado', 'created_at']
    search_fields = ['cliente__nombre']
    list_filter = ['estado', 'fecha', 'created_at']


@admin.register(ReservaServicio)
class ReservaServicioAdmin(admin.ModelAdmin):
    list_display = ['id', 'reserva', 'servicio']
    search_fields = ['reserva__id', 'servicio__nombre_servicio']


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ['id', 'reserva', 'monto', 'metodo_pago', 'estado', 'fecha_pago']
    search_fields = ['reserva__id', 'referencia']
    list_filter = ['estado', 'metodo_pago', 'fecha_pago']


@admin.register(Calificacion)
class CalificacionAdmin(admin.ModelAdmin):
    list_display = ['id', 'servicio', 'cliente', 'puntuacion', 'created_at']
    list_filter = ['puntuacion', 'created_at']


@admin.register(Comentario)
class ComentarioAdmin(admin.ModelAdmin):
    list_display = ['id', 'servicio', 'cliente', 'titulo', 'created_at']
    search_fields = ['titulo', 'texto']


# ============================================================================
# PILAR 2: ADMIN PARA WEBHOOKS B2B
# ============================================================================

@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'code', 'contact_email', 'status', 'created_at']
    search_fields = ['name', 'code', 'contact_email']
    list_filter = ['status', 'created_at']
    readonly_fields = ['api_key', 'webhook_secret', 'created_at', 'updated_at', 'last_webhook_at']
    
    fieldsets = (
        ('Información del Partner', {
            'fields': ('name', 'code', 'contact_email', 'description', 'status')
        }),
        ('Configuración de Webhook', {
            'fields': ('webhook_url', 'webhook_secret')
        }),
        ('Credenciales (Solo lectura)', {
            'fields': ('api_key',),
            'classes': ('collapse',)
        }),
        ('Estadísticas', {
            'fields': ('last_webhook_at',),
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(WebhookSubscription)
class WebhookSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'partner', 'event_type', 'is_active', 'created_at']
    search_fields = ['partner__name', 'event_type']
    list_filter = ['event_type', 'is_active', 'created_at']


@admin.register(WebhookDelivery)
class WebhookDeliveryAdmin(admin.ModelAdmin):
    list_display = ['id', 'partner', 'event_type', 'status', 'response_code', 'attempts', 'created_at']
    search_fields = ['partner__name', 'event_type']
    list_filter = ['status', 'event_type', 'created_at']
    readonly_fields = ['payload', 'response_body', 'created_at', 'delivered_at']


@admin.register(WebhookEventLog)
class WebhookEventLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'event_type', 'direction', 'processed', 'signature_valid', 'created_at']
    search_fields = ['event_type']
    list_filter = ['event_type', 'processed', 'direction', 'created_at']
    readonly_fields = ['payload', 'headers', 'created_at', 'processed_at']


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'reserva', 'provider', 'status', 'amount', 'currency', 'created_at']
    search_fields = ['reference_id', 'reserva__id']
    list_filter = ['provider', 'status', 'created_at']
    readonly_fields = ['reference_id', 'created_at', 'updated_at', 'completed_at']
