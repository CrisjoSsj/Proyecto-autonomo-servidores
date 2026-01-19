"""
Tests para los endpoints de webhooks del Event Bus (Pilar 4)
"""
import json
import hashlib
import hmac
from django.test import TestCase, Client
from django.urls import reverse
from unittest.mock import patch, MagicMock


class WebhookPaymentTests(TestCase):
    """Tests para webhooks de pagos"""
    
    def setUp(self):
        self.client = Client()
    
    def test_stripe_webhook_valid_payload(self):
        """Test webhook de Stripe con payload válido"""
        payload = {
            'type': 'payment_intent.succeeded',
            'id': 'evt_test123',
            'data': {
                'object': {
                    'amount': 5000,
                    'currency': 'usd',
                    'status': 'succeeded',
                    'payment_method_types': ['card'],
                    'metadata': {
                        'reserva_id': '123',
                        'cliente_id': '456'
                    }
                }
            }
        }
        
        with patch('api_rest.services.event_bus.event_bus.emit_payment_received') as mock_emit:
            mock_emit.return_value = True
            
            response = self.client.post(
                '/webhooks/payments/stripe/',
                data=json.dumps(payload),
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data['status'], 'received')
    
    def test_payu_webhook_valid_payload(self):
        """Test webhook de PayU con payload válido"""
        payload = {
            'transaction_id': 'payu_test123',
            'value': '50000',
            'currency': 'COP',
            'state_pol': '4',  # Aprobado
            'reference_sale': '123-test',
            'payment_method_name': 'PSE'
        }
        
        with patch('api_rest.services.event_bus.event_bus.emit_payment_received') as mock_emit:
            mock_emit.return_value = True
            
            response = self.client.post(
                '/webhooks/payments/payu/',
                data=json.dumps(payload),
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, 200)
    
    def test_mercadopago_webhook_valid(self):
        """Test webhook de MercadoPago"""
        payload = {
            'type': 'payment',
            'action': 'payment.created',
            'api_version': 'v1',
            'data': {
                'id': 'mp_test123'
            }
        }
        
        with patch('api_rest.services.event_bus.event_bus.emit_payment_received') as mock_emit:
            mock_emit.return_value = True
            
            response = self.client.post(
                '/webhooks/payments/mercadopago/',
                data=json.dumps(payload),
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, 200)
    
    def test_generic_payment_webhook(self):
        """Test webhook genérico de pago"""
        payload = {
            'id': 'generic_123',
            'amount': 100,
            'currency': 'COP',
            'status': 'completed'
        }
        
        with patch('api_rest.services.event_bus.event_bus.emit_payment_received') as mock_emit:
            mock_emit.return_value = True
            
            response = self.client.post(
                '/webhooks/payments/',
                data=json.dumps(payload),
                content_type='application/json',
                HTTP_X_PAYMENT_GATEWAY='test-gateway'
            )
            
            self.assertEqual(response.status_code, 200)


class WebhookPartnerTests(TestCase):
    """Tests para webhooks de partners"""
    
    def setUp(self):
        self.client = Client()
        self.secret = 'test-secret'
    
    def _sign_payload(self, payload):
        """Genera firma HMAC para el payload"""
        payload_str = json.dumps(payload, sort_keys=True)
        signature = hmac.new(
            self.secret.encode('utf-8'),
            payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return f"sha256={signature}"
    
    def test_partner_webhook_no_signature(self):
        """Test que rechaza webhook sin firma"""
        payload = {'event_type': 'partner.sync_request', 'data': {}}
        
        response = self.client.post(
            '/webhooks/partner/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
        self.assertIn('error', response.json())
    
    @patch('api_rest.services.event_bus.event_bus.verify_partner_signature')
    @patch('api_rest.services.event_bus.event_bus._send_to_n8n')
    def test_partner_webhook_valid_signature(self, mock_send, mock_verify):
        """Test webhook de partner con firma válida"""
        mock_verify.return_value = True
        mock_send.return_value = True
        
        payload = {
            'event_type': 'partner.sync_request',
            'data': {'partner_id': '123'}
        }
        
        response = self.client.post(
            '/webhooks/partner/',
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_X_PARTNER_SIGNATURE='sha256=valid',
            HTTP_X_PARTNER_ID='partner123'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'ack')


class WebhookTelegramTests(TestCase):
    """Tests para webhook de Telegram"""
    
    def setUp(self):
        self.client = Client()
    
    def test_telegram_message_webhook(self):
        """Test mensaje de Telegram"""
        payload = {
            'message': {
                'message_id': 123,
                'chat': {'id': 456, 'type': 'private'},
                'from': {
                    'id': 789,
                    'username': 'testuser',
                    'first_name': 'Test'
                },
                'text': 'Hola, necesito ayuda'
            }
        }
        
        with patch('api_rest.services.event_bus.event_bus.emit_mcp_message') as mock_emit:
            mock_emit.return_value = True
            
            response = self.client.post(
                '/webhooks/telegram/',
                data=json.dumps(payload),
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data['ok'])
            mock_emit.assert_called_once()
    
    def test_telegram_photo_attachment(self):
        """Test mensaje de Telegram con foto"""
        payload = {
            'message': {
                'message_id': 123,
                'chat': {'id': 456, 'type': 'private'},
                'from': {'id': 789, 'username': 'testuser'},
                'photo': [
                    {'file_id': 'small', 'file_size': 100},
                    {'file_id': 'large', 'file_size': 500}
                ]
            }
        }
        
        with patch('api_rest.services.event_bus.event_bus.emit_mcp_message') as mock_emit:
            mock_emit.return_value = True
            
            response = self.client.post(
                '/webhooks/telegram/',
                data=json.dumps(payload),
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, 200)
            
            # Verificar que se incluye el adjunto
            call_args = mock_emit.call_args
            self.assertEqual(len(call_args.kwargs['attachments']), 1)
            self.assertEqual(call_args.kwargs['attachments'][0]['type'], 'photo')


class WebhookEmailTests(TestCase):
    """Tests para webhook de email"""
    
    def setUp(self):
        self.client = Client()
    
    def test_email_webhook_json(self):
        """Test email webhook con JSON"""
        payload = {
            'from': 'sender@example.com',
            'subject': 'Test Subject',
            'text': 'Test body content',
            'attachments': []
        }
        
        with patch('api_rest.services.event_bus.event_bus.emit_mcp_message') as mock_emit:
            mock_emit.return_value = True
            
            response = self.client.post(
                '/webhooks/email/',
                data=json.dumps(payload),
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data['received'])


class WebhookHealthTests(TestCase):
    """Tests para health check"""
    
    def setUp(self):
        self.client = Client()
    
    def test_health_endpoint(self):
        """Test endpoint de salud"""
        response = self.client.get('/webhooks/health/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['service'], 'findyourwork-django')
        self.assertIn('endpoints', data)


class WebhookTasksTests(TestCase):
    """Tests para tareas programadas"""
    
    def setUp(self):
        self.client = Client()
    
    def test_list_available_tasks(self):
        """Test listar tareas disponibles"""
        response = self.client.get('/webhooks/tasks/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('tasks', data)
        self.assertTrue(len(data['tasks']) > 0)
        
        # Verificar estructura de una tarea
        task = data['tasks'][0]
        self.assertIn('name', task)
        self.assertIn('description', task)
        self.assertIn('schedule', task)


class EventBusServiceTests(TestCase):
    """Tests para el servicio Event Bus"""
    
    def test_sign_payload(self):
        """Test firma de payload"""
        from api_rest.services.event_bus import EventBusService
        
        service = EventBusService()
        service.partner_secret = 'test-secret'
        
        payload = {'test': 'data'}
        signature = service._sign_payload(payload, 'test-secret')
        
        self.assertIsInstance(signature, str)
        self.assertEqual(len(signature), 64)  # SHA256 = 64 hex chars
    
    def test_verify_partner_signature(self):
        """Test verificación de firma de partner"""
        from api_rest.services.event_bus import EventBusService
        
        service = EventBusService()
        service.partner_secret = 'test-secret'
        
        payload = {'test': 'data'}
        signature = service._sign_payload(payload, 'test-secret')
        full_signature = f"sha256={signature}"
        
        result = service.verify_partner_signature(payload, full_signature)
        self.assertTrue(result)
    
    @patch('requests.post')
    def test_send_to_n8n_success(self, mock_post):
        """Test envío exitoso a n8n"""
        from api_rest.services.event_bus import EventBusService
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        service = EventBusService()
        service.n8n_base_url = 'http://localhost:5678'
        service.enabled = True
        
        result = service._send_to_n8n('test-webhook', {'data': 'test'})
        
        self.assertTrue(result)
        mock_post.assert_called_once()
    
    @patch('requests.post')
    def test_send_to_n8n_disabled(self, mock_post):
        """Test que no envía cuando está deshabilitado"""
        from api_rest.services.event_bus import EventBusService
        
        service = EventBusService()
        service.enabled = False
        
        result = service._send_to_n8n('test-webhook', {'data': 'test'})
        
        self.assertTrue(result)  # Retorna True pero no envía
        mock_post.assert_not_called()
    
    @patch('requests.post')
    def test_emit_payment_received(self, mock_post):
        """Test emitir evento de pago recibido"""
        from api_rest.services.event_bus import EventBusService
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        service = EventBusService()
        service.enabled = True
        
        payment_data = {
            'id': 123,
            'transaction_id': 'test_tx',
            'amount': 50000,
            'currency': 'COP',
            'status': 'completed',
            'reserva_id': 456
        }
        
        result = service.emit_payment_received(payment_data)
        
        self.assertTrue(result)
        
        # Verificar que se llamó con la ruta correcta
        call_args = mock_post.call_args
        self.assertIn('payment-handler', call_args[0][0])
    
    @patch('requests.post')
    def test_emit_mcp_message(self, mock_post):
        """Test emitir mensaje MCP"""
        from api_rest.services.event_bus import EventBusService
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        service = EventBusService()
        service.enabled = True
        
        result = service.emit_mcp_message(
            channel='telegram',
            message='Hola',
            sender_id='123',
            attachments=[],
            metadata={'username': 'test'}
        )
        
        self.assertTrue(result)
        
        call_args = mock_post.call_args
        self.assertIn('mcp-input', call_args[0][0])
