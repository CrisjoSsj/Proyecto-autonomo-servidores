/**
 * AdminPartners - Gestión de Partners B2B
 * Registro y monitoreo de webhooks
 */
import { useState, useEffect } from 'react';
import { FaHandshake, FaPlus, FaSync, FaCheckCircle, FaTimesCircle, FaPaperPlane } from 'react-icons/fa';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import '../../css/AdminPanel.css';

interface Partner {
  partner_id: string;
  partner_name: string;
  webhook_url: string;
  subscribed_events: string[];
  is_active: boolean;
  webhook_success_count: number;
  webhook_failure_count: number;
  last_webhook_at: string | null;
  created_at: string;
}

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newPartner, setNewPartner] = useState({
    partner_name: '',
    webhook_url: '',
    events: ['reservation.confirmed', 'payment.success'],
    contact_email: ''
  });
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const API_URL = 'http://localhost:8002';

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/partners/`);
      if (response.ok) {
        const data = await response.json();
        setPartners(data);
      }
    } catch (error) {
      console.error('Error cargando partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const registerPartner = async () => {
    try {
      const response = await fetch(`${API_URL}/partners/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner)
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedSecret(data.shared_secret);
        loadPartners();
      }
    } catch (error) {
      console.error('Error registrando partner:', error);
    }
  };

  const sendTestWebhook = async (partnerId: string) => {
    try {
      await fetch(`${API_URL}/partners/${partnerId}/send-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'test.ping',
          data: { message: 'Test desde Chuwue Grill', timestamp: new Date().toISOString() }
        })
      });
      alert('Webhook de prueba enviado');
      loadPartners();
    } catch (error) {
      console.error('Error enviando webhook:', error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleString('es-EC');
  };

  return (
    <div className="admin-layout">
      <NavbarAdmin />
      <main className="admin-content">
        <div className="admin-header">
          <div className="admin-header-title">
            <FaHandshake className="admin-header-icon" />
            <div>
              <h1>Partners B2B</h1>
              <p>Gestión de webhooks bidireccionales</p>
            </div>
          </div>
          <div className="admin-header-actions">
            <button className="admin-btn-secondary" onClick={loadPartners}>
              <FaSync className={loading ? 'spinning' : ''} />
            </button>
            <button className="admin-btn-primary" onClick={() => setShowModal(true)}>
              <FaPlus /> Nuevo Partner
            </button>
          </div>
        </div>

        {/* Nota sobre integración pendiente */}
        <div className="admin-info-banner">
          <strong>📌 Integración Pendiente:</strong> Los webhooks bidireccionales 
          están listos para conectar con otro grupo. Registra tu partner y comparte 
          el secret para comenzar la integración.
        </div>

        {/* Lista de partners */}
        <div className="admin-cards-grid">
          {partners.length === 0 ? (
            <div className="admin-empty-state full-width">
              <FaHandshake size={48} />
              <p>No hay partners registrados</p>
              <button className="admin-btn-primary" onClick={() => setShowModal(true)}>
                Registrar Partner
              </button>
            </div>
          ) : (
            partners.map(partner => (
              <div key={partner.partner_id} className="admin-partner-card">
                <div className="admin-partner-header">
                  <h3>{partner.partner_name}</h3>
                  <span className={`admin-status-dot ${partner.is_active ? 'active' : 'inactive'}`}>
                    {partner.is_active ? <FaCheckCircle /> : <FaTimesCircle />}
                  </span>
                </div>
                
                <div className="admin-partner-details">
                  <p><strong>ID:</strong> <code>{partner.partner_id}</code></p>
                  <p><strong>Webhook:</strong> {partner.webhook_url}</p>
                  <p><strong>Eventos:</strong></p>
                  <div className="admin-events-list">
                    {partner.subscribed_events.map(event => (
                      <span key={event} className="admin-event-badge">{event}</span>
                    ))}
                  </div>
                </div>

                <div className="admin-partner-stats">
                  <div className="admin-stat-mini success">
                    <span>{partner.webhook_success_count}</span>
                    <label>Exitosos</label>
                  </div>
                  <div className="admin-stat-mini error">
                    <span>{partner.webhook_failure_count}</span>
                    <label>Fallidos</label>
                  </div>
                </div>

                <p className="admin-partner-last">
                  Último webhook: {formatDate(partner.last_webhook_at)}
                </p>

                <button 
                  className="admin-btn-secondary full-width"
                  onClick={() => sendTestWebhook(partner.partner_id)}
                >
                  <FaPaperPlane /> Enviar Test
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modal de registro */}
        {showModal && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <h2>Registrar Nuevo Partner</h2>
              
              {createdSecret ? (
                <div className="admin-secret-display">
                  <p>✅ Partner registrado exitosamente</p>
                  <p><strong>Guarda este secret (solo se muestra una vez):</strong></p>
                  <code className="admin-secret-code">{createdSecret}</code>
                  <button 
                    className="admin-btn-primary"
                    onClick={() => {
                      setShowModal(false);
                      setCreatedSecret(null);
                      setNewPartner({
                        partner_name: '',
                        webhook_url: '',
                        events: ['reservation.confirmed', 'payment.success'],
                        contact_email: ''
                      });
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); registerPartner(); }}>
                  <div className="admin-form-group">
                    <label>Nombre del Partner</label>
                    <input
                      type="text"
                      value={newPartner.partner_name}
                      onChange={e => setNewPartner({...newPartner, partner_name: e.target.value})}
                      placeholder="Ej: Grupo-Tours"
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>URL del Webhook</label>
                    <input
                      type="url"
                      value={newPartner.webhook_url}
                      onChange={e => setNewPartner({...newPartner, webhook_url: e.target.value})}
                      placeholder="https://partner.com/webhooks/chuwue"
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Email de Contacto</label>
                    <input
                      type="email"
                      value={newPartner.contact_email}
                      onChange={e => setNewPartner({...newPartner, contact_email: e.target.value})}
                      placeholder="dev@partner.com"
                    />
                  </div>
                  <div className="admin-modal-actions">
                    <button type="button" className="admin-btn-secondary" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="admin-btn-primary">
                      Registrar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
