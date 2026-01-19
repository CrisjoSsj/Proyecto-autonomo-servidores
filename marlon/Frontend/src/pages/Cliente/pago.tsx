import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Ireserva } from "../../interfaces/reserva";
import { useForm } from "react-hook-form";
import type { Ipago } from "../../interfaces/pago";
import { getReserva } from "../../api/reserva";
import { createPago, markPagoAsPagado } from "../../api/pago";

export default function Pago() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reserva, setReserva] = useState<Ireserva | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagoId, setPagoId] = useState<number | null>(null);
  const [simulandoPago, setSimulandoPago] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Partial<Ipago>>();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      setError("El usuario no está autenticado");
      setLoading(false);
      return;
    }
    setToken(savedToken);

    async function loadReserva() {
      if (!id) return;
      try {
        const res = await getReserva(Number(id), savedToken);
        setReserva(res.data);
      } catch (err) {
        console.error("Error cargando reserva:", err);
        setError("No se pudo cargar la reserva");
      } finally {
        setLoading(false);
      }
    }

    loadReserva();
  }, [id]);

  const onSubmit = async (data: Partial<Ipago>) => {
    if (!token || !reserva) return;

    const pagoData = {
      reserva_id: reserva.id ?? 0,
      monto: reserva.total_estimado,
      estado: "pendiente" as const,
      metodo_pago: data.metodo_pago,
      referencia: data.referencia || "",
      fecha_pago: new Date().toISOString(),
    };

    try {
      const res = await createPago(pagoData, token);
      const nuevoPageoId = res.data.id;
      setPagoId(nuevoPageoId);
      
      // Automáticamente marcar el pago como pagado
      try {
        await markPagoAsPagado(nuevoPageoId, token);
        alert("Pago procesado exitosamente ✅");
        setTimeout(() => navigate("/servicios/reserva-list/"), 1500);
      } catch (err: any) {
        console.error("Error procesando pago:", err.response?.data || err);
        alert("Pago registrado pero hubo un error al procesarlo. Intenta de nuevo.");
      }
    } catch (err: any) {
      console.error("Error registrando pago:", err.response?.data || err);
      alert("Error al registrar el pago. Revisa los datos.");
    }
  };

  const handleSimularPago = async () => {
    if (!token || !pagoId) return;
    
    setSimulandoPago(true);
    try {
      await markPagoAsPagado(pagoId, token);
      alert("Pago simulado como pagado ✅ La reserva debe estar confirmada ahora.");
      setTimeout(() => navigate("/servicios/reserva-list/"), 1500);
    } catch (err: any) {
      console.error("Error simulando pago:", err.response?.data || err);
      alert("Error al simular el pago.");
    } finally {
      setSimulandoPago(false);
    }
  };

  if (loading)
    return <p style={{ textAlign: "center" }}>Cargando reserva...</p>;
  if (error)
    return <p style={{ color: "#f44336", textAlign: "center" }}>{error}</p>;
  if (!reserva) return null;

  return (
    <div className="homepage-container">
      <h2>Pagar Reserva #{reserva.id}</h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ maxWidth: "400px", margin: "2rem auto" }}
      >
        <div>
          <label>Monto a pagar:</label>
          <input type="number" value={reserva.total_estimado} disabled />
        </div>

        <div>
          <label>Método de pago:</label>
          <select
            {...register("metodo_pago", { required: "Selecciona un método de pago" })}
          >
            <option value="">Seleccione</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>
          {errors.metodo_pago && <span>{errors.metodo_pago.message}</span>}
        </div>

        <div>
          <label>Referencia (opcional):</label>
          <input
            type="text"
            {...register("referencia")}
            placeholder="Número de referencia"
          />
        </div>

        <button type="submit">Registrar Pago</button>
      </form>

      {pagoId && (
        <div style={{ maxWidth: "400px", margin: "2rem auto", textAlign: "center" }}>
          <p style={{ fontWeight: 600 }}>✅ Pago registrado (pendiente)</p>
          <button
            onClick={handleSimularPago}
            disabled={simulandoPago}
            style={{
              backgroundColor: "#2196F3",
              color: "#fff",
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "4px",
              cursor: simulandoPago ? "not-allowed" : "pointer",
              opacity: simulandoPago ? 0.6 : 1,
            }}
          >
            {simulandoPago ? "Simulando..." : "Simular Pago (Testing)"}
          </button>
          <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "1rem" }}>
            🧪 En producción, aquí se integraría una pasarela de pago real.
          </p>
        </div>
      )}
    </div>
  );
}
