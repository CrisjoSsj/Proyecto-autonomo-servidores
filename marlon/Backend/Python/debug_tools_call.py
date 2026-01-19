import django
django.setup()
from rest_framework.test import APIRequestFactory
from django.contrib.auth.models import User
from api_rest.views.tools import CrearReservaView, ProcesarPagoView
from api_rest import models

factory = APIRequestFactory()
user = User.objects.create_user(username='tester', password='pass')
cliente = models.Cliente.objects.create(user_id='11111111-1111-1111-1111-111111111111', telefono='4567890123')
reserva = models.Reserva.objects.create(cliente=cliente, fecha='2025-12-25', hora='10:00', estado='pendiente', total_estimado=100.00)

# Test CrearReservaView
request = factory.post('/api_rest/tools/crear-reserva/', {'cliente': cliente.id, 'fecha':'2025-12-26','hora':'11:00','estado':'pendiente','total_estimado':'200.00'}, format='multipart')
request.user = user
response = CrearReservaView.as_view()(request)
print('crear-reserva status', response.status_code)
try:
    print('data:', response.data)
except Exception:
    print('content:', response.content)

# Test ProcesarPagoView
request2 = factory.post('/api_rest/tools/procesar-pago/', {'reserva': reserva.id, 'monto':'100.00', 'metodo_pago':'tarjeta'}, format='multipart')
request2.user = user
response2 = ProcesarPagoView.as_view()(request2)
print('procesar-pago status', response2.status_code)
try:
    print('data:', response2.data)
except Exception:
    print('content:', response2.content)
