from django.db import models


class ToolActionLog(models.Model):
    """Log and audit record for tool actions invoked by Orchestrator or users.

    Stores idempotency key to avoid duplicate side-effects and to provide an audit trail.
    """

    ACTION_CHOICES = [
        ('crear_reserva', 'Crear Reserva'),
        ('registrar_cliente', 'Registrar Cliente'),
        ('procesar_pago', 'Procesar Pago'),
        ('buscar_productos', 'Buscar Productos'),
        ('ver_reserva', 'Ver Reserva'),
        ('obtener_cliente', 'Obtener Cliente'),
    ]

    action = models.CharField(max_length=100)
    actor = models.CharField(max_length=200, blank=True, null=True, help_text="JWT sub or service key identifier")
    idempotency_key = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    request_payload = models.JSONField(blank=True, null=True)
    response_payload = models.JSONField(blank=True, null=True)
    status = models.CharField(max_length=50, default='proposal')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['action', 'idempotency_key']),
        ]

    def __str__(self):
        return f"{self.action} - {self.id} - {self.status}"
