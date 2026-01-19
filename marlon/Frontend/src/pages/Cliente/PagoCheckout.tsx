import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Ireserva } from "../../interfaces/reserva";
import { getReserva } from "../../api/reserva";
import { createPago } from "../../api/pago";
import { getReservaServiciosByReserva } from "../../api/reservaServicio";
import "../../styles/PagoCheckout.css";

type PaymentMethod = "tarjeta" | "efectivo" | "transferencia";
type PaymentStep = "resumen" | "metodo" | "datos" | "procesando" | "resultado";

interface CardData {
  numero: string;
  nombre: string;
  expiracion: string;
  cvv: string;
}

export default function PagoCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reserva, setReserva] = useState<Ireserva | null>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del flujo de pago
  const [step, setStep] = useState<PaymentStep>("resumen");
  const [metodo, setMetodo] = useState<PaymentMethod | null>(null);
  const [cardData, setCardData] = useState<CardData>({
    numero: "",
    nombre: "",
    expiracion: "",
    cvv: "",
  });
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [pagoId, setPagoId] = useState<number | null>(null);
  const [webhookResponse, setWebhookResponse] = useState<any>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      setError("Debes iniciar sesión para realizar el pago");
      setLoading(false);
      return;
    }
    setToken(savedToken);

    async function loadData() {
      if (!id || !savedToken) return;
      try {
        const [reservaRes, serviciosRes] = await Promise.all([
          getReserva(Number(id), savedToken),
          getReservaServiciosByReserva(Number(id), savedToken),
        ]);
        setReserva(reservaRes.data);
        setServicios(serviciosRes.data || []);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("No se pudo cargar la reserva");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSelectMetodo = (m: PaymentMethod) => {
    setMetodo(m);
    if (m === "tarjeta") {
      setStep("datos");
    } else {
      // Para efectivo/transferencia, ir directo a procesar
      setStep("procesando");
      procesarPago(m);
    }
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardData.numero || !cardData.nombre || !cardData.expiracion || !cardData.cvv) {
      alert("Por favor completa todos los campos de la tarjeta");
      return;
    }
    setStep("procesando");
    procesarPago("tarjeta");
  };

  const procesarPago = async (metodoPago: PaymentMethod) => {
    if (!token || !reserva) return;

    try {
      // 1. Crear el pago en Django
      const pagoData = {
        reserva_id: reserva.id ?? 0,
        monto: reserva.total_estimado,
        estado: "pendiente" as const,
        metodo_pago: metodoPago,
        referencia: metodoPago === "tarjeta" 
          ? `CARD-${cardData.numero.slice(-4)}-${Date.now()}`
          : `${metodoPago.toUpperCase()}-${Date.now()}`,
        fecha_pago: new Date().toISOString(),
      };

      const pagoRes = await createPago(pagoData, token);
      const nuevoPagoId = pagoRes.data.id;
      setPagoId(nuevoPagoId);

      // 2. Simular delay de procesamiento (como una pasarela real)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Simular webhook de pasarela de pago hacia n8n
      // En producción, esto lo haría la pasarela real
      const webhookPayload = {
        type: "payment_intent.succeeded",
        provider: "stripe_simulator",
        data: {
          object: {
            id: `pi_simulated_${nuevoPagoId}`,
            amount: reserva.total_estimado * 100, // en centavos
            currency: "usd",
            status: "succeeded",
            metadata: {
              reserva_id: reserva.id,
              pago_id: nuevoPagoId,
              metodo: metodoPago,
            },
          },
        },
        timestamp: new Date().toISOString(),
      };

      // 4. Enviar webhook simulado al backend (que lo reenviará a n8n)
      try {
        const webhookRes = await fetch("http://127.0.0.1:8000/webhooks/payments/simulate/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(webhookPayload),
        });
        
        const webhookData = await webhookRes.json();
        setWebhookResponse(webhookData);
        console.log("📧 Webhook simulado enviado a n8n:", webhookData);
      } catch (webhookErr) {
        console.warn("⚠️ No se pudo enviar webhook (n8n puede no estar activo):", webhookErr);
        // Continuar de todas formas
      }

      // 5. Marcar pago como exitoso
      setPagoExitoso(true);
      setStep("resultado");

    } catch (err: any) {
      console.error("Error procesando pago:", err);
      setPagoExitoso(false);
      setStep("resultado");
    }
  };

  if (loading) {
    return (
      <div className="checkout-container">
        <div className="checkout-loading">
          <div className="spinner"></div>
          <p>Cargando información de la reserva...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout-container">
        <div className="checkout-error">
          <span className="error-icon">❌</span>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Volver</button>
        </div>
      </div>
    );
  }

  if (!reserva) return null;

  return (
    <div className="checkout-container">
      {/* Header con pasos */}
      <div className="checkout-header">
        <h1>💳 Checkout</h1>
        <div className="checkout-steps">
          <div className={`step ${step === "resumen" ? "active" : "completed"}`}>
            <span className="step-number">1</span>
            <span className="step-label">Resumen</span>
          </div>
          <div className={`step ${step === "metodo" ? "active" : ["datos", "procesando", "resultado"].includes(step) ? "completed" : ""}`}>
            <span className="step-number">2</span>
            <span className="step-label">Método</span>
          </div>
          <div className={`step ${step === "datos" ? "active" : ["procesando", "resultado"].includes(step) ? "completed" : ""}`}>
            <span className="step-number">3</span>
            <span className="step-label">Pago</span>
          </div>
          <div className={`step ${step === "resultado" ? "active" : ""}`}>
            <span className="step-number">4</span>
            <span className="step-label">Confirmación</span>
          </div>
        </div>
      </div>

      <div className="checkout-content">
        {/* PASO 1: Resumen */}
        {step === "resumen" && (
          <div className="checkout-section">
            <h2>📋 Resumen de tu Reserva</h2>
            
            <div className="reserva-card">
              <div className="reserva-header">
                <span className="reserva-id">Reserva #{reserva.id}</span>
                <span className={`reserva-estado ${reserva.estado}`}>
                  {reserva.estado?.toUpperCase()}
                </span>
              </div>
              
              <div className="reserva-info">
                <p><strong>📅 Fecha:</strong> {reserva.fecha}</p>
                <p><strong>🕐 Hora:</strong> {reserva.hora}</p>
              </div>

              <div className="servicios-list">
                <h3>Servicios incluidos:</h3>
                {servicios.length === 0 ? (
                  <p className="no-servicios">No hay servicios asociados</p>
                ) : (
                  servicios.map((s: any) => (
                    <div key={s.id} className="servicio-item">
                      <span className="servicio-nombre">{s.servicio?.nombre_servicio || "Servicio"}</span>
                      <span className="servicio-precio">
                        ${s.servicio?.precio || 0}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="total-section">
                <span className="total-label">Total a pagar:</span>
                <span className="total-amount">${reserva.total_estimado}</span>
              </div>
            </div>

            <button className="btn-primary btn-large" onClick={() => setStep("metodo")}>
              Continuar al pago →
            </button>
          </div>
        )}

        {/* PASO 2: Selección de método */}
        {step === "metodo" && (
          <div className="checkout-section">
            <h2>💰 Selecciona tu método de pago</h2>
            
            <div className="metodos-grid">
              <div 
                className={`metodo-card ${metodo === "tarjeta" ? "selected" : ""}`}
                onClick={() => handleSelectMetodo("tarjeta")}
              >
                <span className="metodo-icon">💳</span>
                <span className="metodo-nombre">Tarjeta de Crédito/Débito</span>
                <span className="metodo-desc">Visa, Mastercard, American Express</span>
              </div>

              <div 
                className={`metodo-card ${metodo === "transferencia" ? "selected" : ""}`}
                onClick={() => handleSelectMetodo("transferencia")}
              >
                <span className="metodo-icon">🏦</span>
                <span className="metodo-nombre">Transferencia Bancaria</span>
                <span className="metodo-desc">Pago directo desde tu banco</span>
              </div>

              <div 
                className={`metodo-card ${metodo === "efectivo" ? "selected" : ""}`}
                onClick={() => handleSelectMetodo("efectivo")}
              >
                <span className="metodo-icon">💵</span>
                <span className="metodo-nombre">Efectivo</span>
                <span className="metodo-desc">Pagar al momento del servicio</span>
              </div>
            </div>

            <button className="btn-secondary" onClick={() => setStep("resumen")}>
              ← Volver
            </button>
          </div>
        )}

        {/* PASO 3: Datos de tarjeta */}
        {step === "datos" && metodo === "tarjeta" && (
          <div className="checkout-section">
            <h2>💳 Ingresa los datos de tu tarjeta</h2>
            
            <div className="card-form-container">
              <div className="card-preview">
                <div className="card-preview-inner">
                  <div className="card-chip"></div>
                  <div className="card-number">
                    {cardData.numero || "•••• •••• •••• ••••"}
                  </div>
                  <div className="card-details">
                    <div className="card-name">{cardData.nombre || "NOMBRE DEL TITULAR"}</div>
                    <div className="card-expiry">{cardData.expiracion || "MM/AA"}</div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCardSubmit} className="card-form">
                <div className="form-group">
                  <label>Número de tarjeta</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={cardData.numero}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 16);
                      const formatted = value.replace(/(\d{4})/g, "$1 ").trim();
                      setCardData({ ...cardData, numero: formatted });
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Nombre del titular</label>
                  <input
                    type="text"
                    placeholder="JOHN DOE"
                    value={cardData.nombre}
                    onChange={(e) => setCardData({ ...cardData, nombre: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha de expiración</label>
                    <input
                      type="text"
                      placeholder="MM/AA"
                      maxLength={5}
                      value={cardData.expiracion}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + "/" + value.slice(2);
                        }
                        setCardData({ ...cardData, expiracion: value });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength={4}
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setStep("metodo")}>
                    ← Volver
                  </button>
                  <button type="submit" className="btn-primary">
                    Pagar ${reserva.total_estimado}
                  </button>
                </div>
              </form>
            </div>

            <p className="security-note">
              🔒 Tus datos están protegidos con encriptación SSL
            </p>
          </div>
        )}

        {/* PASO 4: Procesando */}
        {step === "procesando" && (
          <div className="checkout-section checkout-processing">
            <div className="processing-animation">
              <div className="spinner large"></div>
              <h2>Procesando tu pago...</h2>
              <p>Por favor no cierres esta ventana</p>
              
              <div className="processing-steps">
                <div className="processing-step active">
                  ✓ Validando información
                </div>
                <div className="processing-step active">
                  ✓ Conectando con la pasarela de pago
                </div>
                <div className="processing-step pending">
                  ⟳ Procesando transacción
                </div>
                <div className="processing-step pending">
                  ○ Enviando notificaciones
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 5: Resultado */}
        {step === "resultado" && (
          <div className="checkout-section">
            {pagoExitoso ? (
              <div className="resultado-exitoso">
                <div className="success-icon">✅</div>
                <h2>¡Pago Exitoso!</h2>
                <p>Tu reserva ha sido confirmada</p>
                
                <div className="confirmacion-detalles">
                  <div className="detalle">
                    <span className="label">N° de Transacción:</span>
                    <span className="value">TXN-{pagoId}-{Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="detalle">
                    <span className="label">Monto pagado:</span>
                    <span className="value">${reserva.total_estimado}</span>
                  </div>
                  <div className="detalle">
                    <span className="label">Método:</span>
                    <span className="value">{metodo?.toUpperCase()}</span>
                  </div>
                </div>

                {webhookResponse && (
                  <div className="n8n-info">
                    <h4>🔔 Notificación enviada a n8n Event Bus</h4>
                    <p>El sistema ha notificado automáticamente:</p>
                    <ul>
                      <li>✉️ Email de confirmación (si configurado)</li>
                      <li>📱 Notificación WebSocket</li>
                      <li>🤝 Webhook a partners (si aplica)</li>
                    </ul>
                    <details>
                      <summary>Ver respuesta del webhook</summary>
                      <pre>{JSON.stringify(webhookResponse, null, 2)}</pre>
                    </details>
                  </div>
                )}

                <div className="resultado-actions">
                  <button className="btn-primary" onClick={() => navigate("/servicios/reserva-list/")}>
                    Ver mis reservas
                  </button>
                  <button className="btn-secondary" onClick={() => navigate("/todos-servicios")}>
                    Seguir explorando
                  </button>
                </div>
              </div>
            ) : (
              <div className="resultado-fallido">
                <div className="error-icon">❌</div>
                <h2>Error en el pago</h2>
                <p>No se pudo procesar tu pago. Por favor intenta nuevamente.</p>
                
                <div className="resultado-actions">
                  <button className="btn-primary" onClick={() => setStep("metodo")}>
                    Intentar de nuevo
                  </button>
                  <button className="btn-secondary" onClick={() => navigate(-1)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
