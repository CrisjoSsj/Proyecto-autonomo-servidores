from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from .. import models
from api_rest.models import ToolActionLog
from django.contrib.auth.models import User
import os


class ToolsIdempotencyTests(APITestCase):
    def setUp(self):
        # Use force_authenticate to simulate an authenticated user
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)

        self.cliente = models.Cliente.objects.create(user_id="33333333-3333-3333-3333-333333333333", telefono="5555555555")
        self.servicio = models.Servicio.objects.create(
            nombre_servicio="Test Service", descripcion="Desc", precio=100.00,
            proveedor=models.Proveedor.objects.create(user_id="12345678-1234-5678-9012-123456789012", telefono="123"),
            categoria=models.Categoria.objects.create(nombre="Cat")
        )

    def test_crear_reserva_proposal_and_confirm_and_idempotency(self):
        data = {
            'cliente': self.cliente.id,
            'fecha': '2025-12-26',
            'hora': '12:00',
            'estado': 'pendiente',
            'total_estimado': 200.00
        }
        headers = {'Idempotency-Key': 'abc-123'}

        # Proposal: confirm=false (default)
        response = self.client.post('/api_rest/tools/crear-reserva/', data, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('proposal', response.data)

        # Proposal log exists
        log = ToolActionLog.objects.filter(action='crear_reserva', idempotency_key='abc-123').order_by('-created_at').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.status, 'proposal')
        self.assertEqual(log.response_payload, response.data['proposal'])

        # Confirm using query param
        confirm_resp = self.client.post('/api_rest/tools/crear-reserva/?confirm=true', data, **headers)
        self.assertEqual(confirm_resp.status_code, status.HTTP_201_CREATED)

        # Confirmed log exists
        confirmed = ToolActionLog.objects.filter(action='crear_reserva', idempotency_key='abc-123', status='confirmed').order_by('-created_at').first()
        self.assertIsNotNone(confirmed)

        # Second confirm with same idempotency key returns existing result without creating duplicate side-effect
        second = self.client.post('/api_rest/tools/crear-reserva/?confirm=true', data, **headers)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(second.data, confirmed.response_payload)

    def test_procesar_pago_proposal_confirm_idempotency(self):
        # Create a reserva to pay
        reserva = models.Reserva.objects.create(cliente=self.cliente, fecha='2025-12-27', hora='09:00', estado='pendiente', total_estimado=100.00)

        data = {
            'reserva': reserva.id,
            'monto': 100.00,
            'metodo_pago': 'tarjeta'
        }
        headers = {'Idempotency-Key': 'pay-123'}

        # Proposal
        response = self.client.post('/api_rest/tools/procesar-pago/', data, **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('proposal', response.data)

        # Confirm
        confirm_resp = self.client.post('/api_rest/tools/procesar-pago/?confirm=true', data, **headers)
        self.assertEqual(confirm_resp.status_code, status.HTTP_201_CREATED)

        # Repeat confirm returns stored result
        second = self.client.post('/api_rest/tools/procesar-pago/?confirm=true', data, **headers)
        self.assertEqual(second.status_code, status.HTTP_200_OK)

    def test_registrar_cliente_idempotency(self):
        data = {
            'user_id': '44444444-4444-4444-4444-444444444444',
            'telefono': '9999999999'
        }
        headers = {'Idempotency-Key': 'client-123'}

        resp = self.client.post('/api_rest/tools/registrar-cliente/', data, **headers)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        # Second call with same idempotency key returns same payload
        resp2 = self.client.post('/api_rest/tools/registrar-cliente/', data, **headers)
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        # Confirm that a tool log exists
        log = ToolActionLog.objects.filter(action='registrar_cliente', idempotency_key='client-123').order_by('-created_at').first()
        self.assertIsNotNone(log)
