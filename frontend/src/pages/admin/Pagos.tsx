/**
 * AdminPagos - Panel de gestión de pagos
 * Ver transacciones y estados de pagos
 */
import { useState, useEffect } from 'react';
import { FaCreditCard, FaSync, FaCheckCircle, FaTimesCircle, FaClock, FaUndo } from 'react-icons/fa';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import '../../css/AdminPanel.css';

interface Payment {
  payment_id: string;
  status: string;
  amount: number;
  currency: string;
  provider: string;
  provider_payment_id: string | null;
  created_at: string;
}

export default function AdminPagos() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const API_URL = 'http://localhost:8002';

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/payments/`;
      if (statusFilter) {
        url += `?status_filter=${statusFilter}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error cargando pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="status-icon success" />;
      case 'failed':
        return <FaTimesCircle className="status-icon error" />;
      case 'pending':
        return <FaClock className="status-icon warning" />;
      case 'refunded':
        return <FaUndo className="status-icon info" />;
      default:
        return <FaClock className="status-icon" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      processing: 'Procesando',
      completed: 'Completado',
      failed: 'Fallido',
      refunded: 'Reembolsado',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-EC');
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const totalAmount = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="admin-layout">
      <NavbarAdmin />
      <main className="admin-content">
        <div className="admin-header">
          <div className="admin-header-title">
            <FaCreditCard className="admin-header-icon" />
            <div>
              <h1>Gestión de Pagos</h1>
              <p>Transacciones y estados de pagos</p>
            </div>
          </div>
          <button className="admin-btn-primary" onClick={loadPayments}>
            <FaSync className={loading ? 'spinning' : ''} /> Actualizar
          </button>
        </div>

        {/* Estadísticas */}
        <div className="admin-stats-row">
          <div className="admin-stat-card">
            <h4>Total Transacciones</h4>
            <span className="admin-stat-value">{payments.length}</span>
          </div>
          <div className="admin-stat-card success">
            <h4>Completados</h4>
            <span className="admin-stat-value">
              {payments.filter(p => p.status === 'completed').length}
            </span>
          </div>
          <div className="admin-stat-card warning">
            <h4>Pendientes</h4>
            <span className="admin-stat-value">
              {payments.filter(p => p.status === 'pending').length}
            </span>
          </div>
          <div className="admin-stat-card info">
            <h4>Ingresos Totales</h4>
            <span className="admin-stat-value">
              {formatAmount(totalAmount, 'USD')}
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="admin-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-select"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="completed">Completado</option>
            <option value="failed">Fallido</option>
            <option value="refunded">Reembolsado</option>
          </select>
        </div>

        {/* Tabla de pagos */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID Pago</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Proveedor</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-empty-table">
                    No hay pagos registrados
                  </td>
                </tr>
              ) : (
                payments.map(payment => (
                  <tr key={payment.payment_id}>
                    <td>
                      <code>{payment.payment_id}</code>
                    </td>
                    <td className="admin-amount">
                      {formatAmount(payment.amount, payment.currency)}
                    </td>
                    <td>
                      <span className={`admin-status-badge ${payment.status}`}>
                        {getStatusIcon(payment.status)}
                        {getStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td>
                      <span className="admin-provider-badge">
                        {payment.provider}
                      </span>
                    </td>
                    <td>{formatDate(payment.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
