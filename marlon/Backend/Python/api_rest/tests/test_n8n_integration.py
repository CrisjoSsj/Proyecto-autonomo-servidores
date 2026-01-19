"""
Tests para endpoints usados por n8n workflows
==============================================
Pilar 4: n8n - Event Bus

Tests de integración para verificar que los endpoints
llamados por n8n funcionan correctamente.
"""
import json
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.test import TestCase, Client
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from ..models import (
    Reserva,
    Servicio,
    Cliente,
    Pago,
    Proveedor,
    Categoria,
    Ubicacion,
    ReservaServicio,
)


class ReportEndpointsTests(TestCase):
    """Tests para endpoints de reportes llamados por n8n Scheduled Tasks"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crear datos de prueba
        self.ubicacion = Ubicacion.objects.create(
            direccion='Test Address',
            ciudad='Test City',
            provincia='Test Province',
            pais='Test Country'
        )
        
        self.categoria = Categoria.objects.create(
            nombre='Test Category',
            descripcion='Test Description'
        )
        
        self.cliente = Cliente.objects.create(
            user_id='550e8400-e29b-41d4-a716-446655440000',
            telefono='123456789',
            ubicacion=self.ubicacion
        )
        
        self.proveedor = Proveedor.objects.create(
            user_id='550e8400-e29b-41d4-a716-446655440001',
            telefono='987654321'
        )
        
        self.servicio = Servicio.objects.create(
            proveedor=self.proveedor,
            categoria=self.categoria,
            nombre_servicio='Test Service',
            descripcion='Test Description',
            precio=Decimal('100.00')
        )
        
        # Crear reserva de prueba
        self.reserva = Reserva.objects.create(
            cliente=self.cliente,
            fecha=timezone.now().date(),
            hora=timezone.now().time(),
            estado='confirmada',
            total_estimado=Decimal('100.00')
        )
        
        ReservaServicio.objects.create(
            reserva=self.reserva,
            servicio=self.servicio,
            fecha_servicio=timezone.now().date(),
            hora_servicio=timezone.now().time(),
            estado='pendiente'
        )
    
    def test_daily_report_endpoint(self):
        """Test endpoint de reporte diario"""
        response = self.client.get('/api_rest/reports/daily/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Verificar estructura del reporte
        self.assertIn('fecha_reporte', data)
        self.assertIn('generado_en', data)
        self.assertIn('reservas', data)
        self.assertIn('pagos', data)
        self.assertIn('usuarios', data)
        self.assertIn('servicios', data)
        
        # Verificar campos de reservas
        self.assertIn('nuevas', data['reservas'])
        self.assertIn('confirmadas', data['reservas'])
        self.assertIn('canceladas', data['reservas'])
        
        # Verificar campos de pagos
        self.assertIn('exitosos', data['pagos'])
        self.assertIn('rechazados', data['pagos'])
        self.assertIn('ingresos_totales', data['pagos'])
    
    def test_daily_report_with_date_param(self):
        """Test reporte diario con fecha específica"""
        yesterday = (timezone.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        response = self.client.get(f'/api_rest/reports/daily/?date={yesterday}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['fecha_reporte'], yesterday)
    
    def test_daily_report_invalid_date(self):
        """Test reporte diario con fecha inválida"""
        response = self.client.get('/api_rest/reports/daily/?date=invalid')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())
    
    def test_upcoming_reservations_endpoint(self):
        """Test endpoint de reservas próximas"""
        # Crear reserva futura
        future_date = timezone.now().date() + timedelta(days=1)
        reserva_futura = Reserva.objects.create(
            cliente=self.cliente,
            fecha=future_date,
            hora=timezone.now().time(),
            estado='confirmada',
            total_estimado=Decimal('150.00')
        )
        
        ReservaServicio.objects.create(
            reserva=reserva_futura,
            servicio=self.servicio,
            fecha_servicio=future_date,
            hora_servicio=timezone.now().time(),
            estado='pendiente'
        )
        
        response = self.client.get('/api_rest/reservas/upcoming/?hours=48')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.json(), list)
    
    def test_cleanup_old_data_dry_run(self):
        """Test limpieza de datos en modo dry run"""
        # Crear reserva cancelada antigua
        old_reserva = Reserva.objects.create(
            cliente=self.cliente,
            fecha=timezone.now().date() - timedelta(days=100),
            hora=timezone.now().time(),
            estado='cancelada',
            total_estimado=Decimal('50.00')
        )
        old_reserva.updated_at = timezone.now() - timedelta(days=100)
        old_reserva.save(update_fields=['updated_at'])
        
        response = self.client.delete('/api_rest/cleanup/old-data/?days=90&dry_run=true')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'dry_run')
        self.assertTrue(data['dry_run'])
        
        # Verificar que no se eliminó
        self.assertTrue(Reserva.objects.filter(id=old_reserva.id).exists())
    
    def test_system_health_check(self):
        """Test endpoint de health check"""
        response = self.client.get('/api_rest/health/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertIn('status', data)
        self.assertIn('components', data)
        self.assertIn('stats', data)
        self.assertIn('database', data['components'])
    
    def test_pending_payments_report(self):
        """Test endpoint de pagos pendientes"""
        # Crear pago pendiente antiguo
        pago = Pago.objects.create(
            reserva=self.reserva,
            metodo_pago='tarjeta',
            monto=Decimal('100.00'),
            estado='pendiente'
        )
        
        response = self.client.get('/api_rest/reports/pending-payments/?days=0')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertIn('count', data)
        self.assertIn('payments', data)


class PartnerEndpointsTests(TestCase):
    """Tests para endpoints de integración con partners"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crear datos de prueba
        self.ubicacion = Ubicacion.objects.create(
            direccion='Test Address Partner',
            ciudad='Test City',
            provincia='Test Province',
            pais='Test Country'
        )
        
        self.categoria = Categoria.objects.create(
            nombre='Test Category',
            descripcion='Test Description'
        )
        
        self.cliente = Cliente.objects.create(
            user_id='550e8400-e29b-41d4-a716-446655440002',
            telefono='123456789'
        )
        
        self.proveedor = Proveedor.objects.create(
            user_id='550e8400-e29b-41d4-a716-446655440003',
            telefono='987654321'
        )
        
        self.servicio = Servicio.objects.create(
            proveedor=self.proveedor,
            categoria=self.categoria,
            nombre_servicio='Test Service',
            descripcion='Test Description',
            precio=Decimal('100.00')
        )
    
    def test_partner_updates_endpoint(self):
        """Test endpoint de actualizaciones de partner"""
        response = self.client.post(
            '/api_rest/partner-updates/',
            {
                'event_type': 'partner.data_update',
                'partner_id': 'test_partner',
                'data': {'test': 'data'}
            },
            format='json',
            HTTP_X_PARTNER_ID='test_partner'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.json())
    
    def test_partner_service_update(self):
        """Test actualización de servicio desde partner"""
        response = self.client.post(
            '/api_rest/partner-updates/',
            {
                'event_type': 'partner.service_update',
                'partner_id': 'test_partner',
                'data': {
                    'external_service_id': 'ext_123',
                    'name': 'Updated Service'
                }
            },
            format='json',
            HTTP_X_PARTNER_ID='test_partner'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['event_type'], 'partner.service_update')
    
    def test_partner_price_update(self):
        """Test actualización de precio desde partner"""
        response = self.client.post(
            '/api_rest/partner-updates/',
            {
                'event_type': 'partner.price_update',
                'partner_id': 'test_partner',
                'data': {
                    'service_id': self.servicio.id,
                    'new_price': 150.00
                }
            },
            format='json',
            HTTP_X_PARTNER_ID='test_partner'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que el precio se actualizó
        self.servicio.refresh_from_db()
        self.assertEqual(self.servicio.precio, Decimal('150.00'))
    
    @patch('api_rest.services.event_bus.event_bus.emit')
    def test_partner_create_reserva(self, mock_emit):
        """Test creación de reserva desde partner"""
        response = self.client.post(
            '/api_rest/reservas/partner/',
            {
                'partner_id': 'test_partner',
                'external_booking_id': 'ext_booking_123',
                'service_id': self.servicio.id,
                'client_data': {
                    'user_id': '550e8400-e29b-41d4-a716-446655440099',
                    'telefono': '555123456'
                },
                'fecha': '2026-01-15',
                'hora': '10:00:00'
            },
            format='json',
            HTTP_X_PARTNER_ID='test_partner'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        
        self.assertEqual(data['status'], 'created')
        self.assertIn('reserva_id', data)
        self.assertEqual(data['external_booking_id'], 'ext_booking_123')
        
        # Verificar que se emitió evento al Event Bus
        mock_emit.assert_called_once()
    
    def test_partner_create_reserva_missing_data(self):
        """Test error al crear reserva con datos incompletos"""
        response = self.client.post(
            '/api_rest/reservas/partner/',
            {
                'partner_id': 'test_partner',
                # Faltan campos requeridos
            },
            format='json',
            HTTP_X_PARTNER_ID='test_partner'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())
    
    def test_partner_create_reserva_service_not_found(self):
        """Test error cuando servicio no existe"""
        response = self.client.post(
            '/api_rest/reservas/partner/',
            {
                'partner_id': 'test_partner',
                'external_booking_id': 'ext_123',
                'service_id': 99999,  # No existe
                'client_data': {
                    'user_id': '550e8400-e29b-41d4-a716-446655440088',
                    'telefono': '555000000'
                },
                'fecha': '2026-01-15',
                'hora': '10:00:00'
            },
            format='json',
            HTTP_X_PARTNER_ID='test_partner'
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    @patch('api_rest.services.event_bus.event_bus.emit')
    def test_partner_cancel_reserva(self, mock_emit):
        """Test cancelación de reserva desde partner"""
        # Crear reserva
        reserva = Reserva.objects.create(
            cliente=self.cliente,
            fecha=timezone.now().date(),
            hora=timezone.now().time(),
            estado='confirmada',
            total_estimado=Decimal('100.00')
        )
        
        response = self.client.post(
            '/api_rest/reservas/partner/cancel/',
            {
                'partner_id': 'test_partner',
                'reserva_id': reserva.id,
                'reason': 'Test cancellation'
            },
            format='json',
            HTTP_X_PARTNER_ID='test_partner'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['status'], 'cancelled')
        self.assertEqual(data['previous_status'], 'confirmada')
        
        # Verificar que la reserva se canceló
        reserva.refresh_from_db()
        self.assertEqual(reserva.estado, 'cancelada')
        
        # Verificar que se emitió evento
        mock_emit.assert_called_once()
    
    def test_partner_cancel_reserva_not_found(self):
        """Test error al cancelar reserva que no existe"""
        response = self.client.post(
            '/api_rest/reservas/partner/cancel/',
            {
                'partner_id': 'test_partner',
                'reserva_id': 99999,
                'reason': 'Test'
            },
            format='json',
            HTTP_X_PARTNER_ID='test_partner'
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_partner_sync_status(self):
        """Test endpoint de estado de sincronización"""
        response = self.client.get('/api_rest/partner/sync-status/?partner_id=test_partner')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['partner_id'], 'test_partner')
        self.assertEqual(data['status'], 'connected')
        self.assertIn('stats', data)
    
    def test_partner_sync_status_missing_id(self):
        """Test error al consultar sync status sin partner_id"""
        response = self.client.get('/api_rest/partner/sync-status/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class N8NWorkflowIntegrationTests(TestCase):
    """Tests de integración completos simulando flujos de n8n"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Setup básico
        self.ubicacion = Ubicacion.objects.create(
            direccion='Test Address',
            ciudad='Test City',
            provincia='Test Province',
            pais='Test Country'
        )
        
        self.categoria = Categoria.objects.create(
            nombre='Test Category',
            descripcion='Test Description'
        )
        
        self.cliente = Cliente.objects.create(
            user_id='550e8400-e29b-41d4-a716-446655440010',
            telefono='123456789'
        )
        
        self.proveedor = Proveedor.objects.create(
            user_id='550e8400-e29b-41d4-a716-446655440011',
            telefono='987654321'
        )
        
        self.servicio = Servicio.objects.create(
            proveedor=self.proveedor,
            categoria=self.categoria,
            nombre_servicio='Integration Test Service',
            precio=Decimal('200.00')
        )
    
    @patch('api_rest.services.event_bus.event_bus.emit')
    def test_complete_partner_booking_flow(self, mock_emit):
        """
        Test flujo completo de reserva desde partner:
        1. Partner crea reserva
        2. Sistema confirma
        3. Se emite evento a n8n
        """
        # 1. Partner crea reserva
        create_response = self.client.post(
            '/api_rest/reservas/partner/',
            {
                'partner_id': 'integration_partner',
                'external_booking_id': 'int_flow_123',
                'service_id': self.servicio.id,
                'client_data': {
                    'user_id': '550e8400-e29b-41d4-a716-446655440099',
                    'telefono': '555999888'
                },
                'fecha': '2026-01-20',
                'hora': '14:00:00'
            },
            format='json',
            HTTP_X_PARTNER_ID='integration_partner'
        )
        
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        reserva_id = create_response.json()['reserva_id']
        
        # Verificar que se creó la reserva
        reserva = Reserva.objects.get(id=reserva_id)
        self.assertEqual(reserva.estado, 'pendiente')
        
        # 2. Verificar que se emitió evento
        mock_emit.assert_called()
        
        # 3. Verificar que aparece en reporte de upcoming
        response = self.client.get('/api_rest/reservas/upcoming/?hours=720')  # 30 días
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_scheduled_tasks_flow(self):
        """
        Test flujo de tareas programadas:
        1. Health check
        2. Reporte diario
        3. Cleanup (dry run)
        """
        # 1. Health check
        health_response = self.client.get('/api_rest/health/')
        self.assertEqual(health_response.status_code, status.HTTP_200_OK)
        self.assertIn(health_response.json()['status'], ['healthy', 'degraded'])
        
        # 2. Reporte diario
        report_response = self.client.get('/api_rest/reports/daily/')
        self.assertEqual(report_response.status_code, status.HTTP_200_OK)
        
        # 3. Cleanup dry run
        cleanup_response = self.client.delete('/api_rest/cleanup/old-data/?dry_run=true')
        self.assertEqual(cleanup_response.status_code, status.HTTP_200_OK)
        self.assertEqual(cleanup_response.json()['status'], 'dry_run')
