import { useState, useEffect } from 'react';
import { apiService } from '../../services/ApiService';
import Navbar from '../../components/user/Navbar';
import PiePagina from '../../components/user/PiePagina';
import type { PaymentResponse, CreatePaymentRequest } from '../../types';
import '../../css/user/Pagos.css';

export default function Pagos() {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentResponse | null>(null);
  const [autoLoadSimulation, setAutoLoadSimulation] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<CreatePaymentRequest>({
    amount: 0,
    currency: 'USD',
    description: '',
    metadata: {},
    user_id: 1, // En producción vendría del contexto de autenticación
  });

  useEffect(() => {
    console.log('🔄 [Pagos] - Inicializando página de pagos...');
    loadPayments();
    
    // Simular pagos automáticos cada 5 segundos si está habilitado
    let interval: ReturnType<typeof setInterval> | null = null;
    if (autoLoadSimulation) {
      console.log('⚙️ [Pagos] - Modo simulación automática ACTIVADO');
      interval = setInterval(() => {
        simulateRandomPayment();
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoLoadSimulation]);

  const loadPayments = async () => {
    try {
      console.log('📥 [Pagos] - Cargando lista de pagos desde el servidor...');
      setLoading(true);
      setError(null);
      const data = await apiService.listPayments(0, 50);
      console.log(`✅ [Pagos] - Se cargaron ${data.length} pagos exitosamente:`, data);
      setPayments(data);
    } catch (err) {
      console.error('❌ [Pagos] - Error cargando pagos:', err);
      setError('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  // Simular un pago aleatorio
  const simulateRandomPayment = async () => {
    const amounts = [25.99, 50.00, 75.50, 100.00, 150.00, 200.00];
    const descriptions = [
      'Pago por reserva mesa #1',
      'Pago por reserva mesa #5',
      'Pago por comida para llevar',
      'Pago por catering',
      'Pago por evento privado',
      'Pago por cena especial'
    ];
    
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    const simulatedPayment: CreatePaymentRequest = {
      amount: randomAmount,
      currency: 'USD',
      description: `[SIMULADO] ${randomDescription}`,
      metadata: {
        simulated: true,
        timestamp: new Date().toISOString()
      },
      user_id: Math.floor(Math.random() * 5) + 1,
    };
    
    console.log('🎲 [Pagos] - Creando pago simulado:', simulatedPayment);
    
    try {
      const newPayment = await apiService.createPayment(simulatedPayment);
      console.log('💾 [Pagos] - Pago simulado creado exitosamente:', newPayment);
      await loadPayments();
    } catch (err) {
      console.error('❌ [Pagos] - Error en pago simulado:', err);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    if (!formData.description.trim()) {
      alert('La descripción es requerida');
      return;
    }

    console.log('💳 [Pagos] - Usuario creando pago manualmente:', formData);

    try {
      setLoading(true);
      const newPayment = await apiService.createPayment(formData);
      console.log('✅ [Pagos] - Pago creado exitosamente:', newPayment);
      
      // Actualizar la lista
      await loadPayments();
      
      // Resetear formulario
      setFormData({
        amount: 0,
        currency: 'USD',
        description: '',
        metadata: {},
        user_id: 1,
      });
      
      setShowCreateForm(false);
      
      // Si hay URL de redirección, mostrarla
      if (newPayment.redirect_url) {
        console.log('🔗 [Pagos] - URL de redirección disponible:', newPayment.redirect_url);
        if (confirm(`Pago creado. ¿Deseas ir a la página de pago?\n${newPayment.redirect_url}`)) {
          window.open(newPayment.redirect_url, '_blank');
        }
      } else {
        alert(`Pago creado exitosamente. ID: ${newPayment.payment_id}\nEstado: ${newPayment.status}`);
      }
    } catch (err) {
      console.error('❌ [Pagos] - Error creando pago:', err);
      alert('Error al crear el pago: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayment = async (paymentId: string) => {
    try {
      console.log('🔍 [Pagos] - Obteniendo detalles del pago:', paymentId);
      const payment = await apiService.getPayment(paymentId);
      console.log('📋 [Pagos] - Detalles del pago obtenidos:', payment);
      setSelectedPayment(payment);
    } catch (err) {
      console.error('❌ [Pagos] - Error obteniendo pago:', err);
      alert('Error al obtener los detalles del pago');
    }
  };

  const handleRefundPayment = async (paymentId: string) => {
    if (!confirm('¿Estás seguro de que deseas reembolsar este pago?')) {
      return;
    }

    try {
      console.log('💸 [Pagos] - Reembolsando pago:', paymentId);
      setLoading(true);
      setError(null);
      
      const result = await apiService.refundPayment(paymentId);
      console.log('✅ [Pagos] - Resultado del reembolso:', result);
      console.log('✅ [Pagos] - Success:', result.success, 'Status:', result.status);
      
      if (result.success) {
        console.log('🎉 [Pagos] - Reembolso exitoso');
        alert('Pago reembolsado exitosamente');
        await loadPayments();
        setSelectedPayment(null);
      } else {
        const errorMsg = result.message || 'No se pudo procesar el reembolso';
        console.error('⚠️ [Pagos] - Reembolso sin éxito:', errorMsg);
        setError(`Error al reembolsar: ${errorMsg}`);
        alert('Error al reembolsar el pago: ' + errorMsg);
      }
    } catch (err) {
      const errorMsg = (err as Error).message || 'Error desconocido';
      console.error('❌ [Pagos] - Error reembolsando pago:', errorMsg);
      console.error('❌ [Pagos] - Error completo:', err);
      setError(`Error al reembolsar: ${errorMsg}`);
      alert('Error al reembolsar el pago: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      case 'processing':
        return 'status-processing';
      case 'failed':
        return 'status-failed';
      case 'refunded':
        return 'status-refunded';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="pagos-page">
      <Navbar />
      
      <div className="pagos-container">
        <div className="pagos-header">
          <h1>Gestión de Pagos</h1>
          <div className="header-actions">
            <button 
              className={`btn-simulation ${autoLoadSimulation ? 'active' : ''}`}
              onClick={() => {
                console.log(`🎬 [Pagos] - Modo simulación: ${!autoLoadSimulation ? 'ACTIVADO' : 'DESACTIVADO'}`);
                setAutoLoadSimulation(!autoLoadSimulation);
              }}
              title="Simula pagos automáticos cada 5 segundos"
            >
              {autoLoadSimulation ? '⏹ Detener' : '▶ Simular'}
            </button>
            <button 
              className="btn-create-payment"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? 'Cancelar' : '+ Nuevo'}
            </button>
          </div>
        </div>

        {/* Formulario de creación */}
        {showCreateForm && (
          <div className="payment-form-card">
            <h2>Crear Nuevo Pago</h2>
            <form onSubmit={handleCreatePayment}>
              <div className="form-group">
                <label htmlFor="amount">Monto *</label>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="currency">Moneda</label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="MXN">MXN - Peso Mexicano</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Descripción *</label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Pago por reserva de mesa #12"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Procesando...' : 'Crear Pago'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de pagos */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading && !showCreateForm && (
          <div className="loading-message">
            Cargando pagos...
          </div>
        )}

        {!loading && !error && payments.length === 0 && (
          <div className="empty-message">
            No hay pagos registrados. Crea tu primer pago.
          </div>
        )}

        {!loading && !error && payments.length > 0 && (
          <div className="payments-grid">
            {payments.map((payment) => (
              <div key={payment.payment_id} className="payment-card">
                <div className="payment-card-header">
                  <span className="payment-id">#{payment.payment_id}</span>
                  <span className={`payment-status ${getStatusBadgeClass(payment.status)}`}>
                    {payment.status}
                  </span>
                </div>
                
                <div className="payment-card-body">
                  <div className="payment-amount">
                    {formatCurrency(payment.amount, payment.currency)}
                  </div>
                  
                  <div className="payment-info">
                    <div className="info-row">
                      <span className="info-label">Proveedor:</span>
                      <span className="info-value">{payment.provider}</span>
                    </div>
                    
                    {payment.provider_payment_id && (
                      <div className="info-row">
                        <span className="info-label">ID Proveedor:</span>
                        <span className="info-value">{payment.provider_payment_id}</span>
                      </div>
                    )}
                    
                    <div className="info-row">
                      <span className="info-label">Fecha:</span>
                      <span className="info-value">{formatDate(payment.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="payment-card-actions">
                  <button 
                    className="btn-view"
                    onClick={() => handleViewPayment(payment.payment_id)}
                  >
                    Ver Detalles
                  </button>
                  
                  {payment.status === 'completed' && (
                    <button 
                      className="btn-refund"
                      onClick={() => handleRefundPayment(payment.payment_id)}
                    >
                      Reembolsar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de detalles */}
        {selectedPayment && (
          <div className="modal-overlay" onClick={() => setSelectedPayment(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Detalles del Pago</h2>
                <button 
                  className="modal-close"
                  onClick={() => setSelectedPayment(null)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="detail-row">
                  <strong>ID del Pago:</strong>
                  <span>{selectedPayment.payment_id}</span>
                </div>
                
                <div className="detail-row">
                  <strong>Monto:</strong>
                  <span>{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</span>
                </div>
                
                <div className="detail-row">
                  <strong>Estado:</strong>
                  <span className={`payment-status ${getStatusBadgeClass(selectedPayment.status)}`}>
                    {selectedPayment.status}
                  </span>
                </div>
                
                <div className="detail-row">
                  <strong>Proveedor:</strong>
                  <span>{selectedPayment.provider}</span>
                </div>
                
                {selectedPayment.provider_payment_id && (
                  <div className="detail-row">
                    <strong>ID Proveedor:</strong>
                    <span>{selectedPayment.provider_payment_id}</span>
                  </div>
                )}
                
                <div className="detail-row">
                  <strong>Fecha de Creación:</strong>
                  <span>{formatDate(selectedPayment.created_at)}</span>
                </div>
                
                {selectedPayment.message && (
                  <div className="detail-row">
                    <strong>Mensaje:</strong>
                    <span>{selectedPayment.message}</span>
                  </div>
                )}
                
                {selectedPayment.redirect_url && (
                  <div className="detail-row">
                    <strong>URL de Pago:</strong>
                    <a 
                      href={selectedPayment.redirect_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="payment-link"
                    >
                      Ir a la página de pago
                    </a>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                {selectedPayment.status === 'completed' && (
                  <button 
                    className="btn-refund"
                    onClick={() => handleRefundPayment(selectedPayment.payment_id)}
                  >
                    Reembolsar Pago
                  </button>
                )}
                <button 
                  className="btn-close"
                  onClick={() => setSelectedPayment(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <PiePagina />
    </div>
  );
}
