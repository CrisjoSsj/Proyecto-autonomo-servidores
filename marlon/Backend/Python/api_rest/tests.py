from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from . import models
from django.core.files.uploadedfile import SimpleUploadedFile


class DocumentModelTest(TestCase):
    def test_create_document(self):
        cliente = models.Cliente.objects.create(user_id="00000000-0000-0000-0000-000000000000", telefono="123")
        f = SimpleUploadedFile("test.txt", b"hello world")
        doc = models.Document.objects.create(owner=cliente, title="T", file=f, mime="text/plain", size=11)
        self.assertEqual(doc.owner, cliente)
        self.assertEqual(doc.title, "T")
        self.assertTrue(doc.file.name.endswith("test.txt"))


class ToolsAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        self.cliente = models.Cliente.objects.create(user_id="11111111-1111-1111-1111-111111111111", telefono="456")
        self.servicio = models.Servicio.objects.create(
            nombre_servicio="Test Service", descripcion="Desc", precio=100.00,
            proveedor=models.Proveedor.objects.create(user_id="12345678-1234-5678-9012-123456789012", telefono="123"),
            categoria=models.Categoria.objects.create(nombre="Cat")
        )
        self.reserva = models.Reserva.objects.create(
            cliente=self.cliente, fecha="2025-12-25", hora="10:00", estado="pendiente", total_estimado=100.00
        )

    def test_buscar_productos(self):
        response = self.client.get('/api_rest/tools/buscar-productos/?q=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

    def test_ver_reserva(self):
        response = self.client.get(f'/api_rest/tools/ver-reserva/{self.reserva.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.reserva.id)

    def test_obtener_cliente(self):
        response = self.client.get('/api_rest/tools/obtener-cliente/?user_id=11111111-1111-1111-1111-111111111111')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_id'], '11111111-1111-1111-1111-111111111111')

    def test_crear_reserva(self):
        data = {
            'cliente': self.cliente.id,
            'fecha': '2025-12-26',
            'hora': '11:00',
            'estado': 'pendiente',
            'total_estimado': 200.00
        }
        response = self.client.post('/api_rest/tools/crear-reserva/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_registrar_cliente(self):
        data = {
            'user_id': '22222222-2222-2222-2222-222222222222',
            'telefono': '7890123456'
        }
        response = self.client.post('/api_rest/tools/registrar-cliente/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_procesar_pago(self):
        data = {
            'reserva': self.reserva.id,
            'monto': 100.00,
            'metodo_pago': 'tarjeta'
        }
        response = self.client.post('/api_rest/tools/procesar-pago/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

