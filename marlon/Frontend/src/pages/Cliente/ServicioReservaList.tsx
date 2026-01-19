import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReservaServiciosByReserva, deleteReservaServicio } from "../../api/reservaServicio";
import { updateReserva } from "../../api/reserva"; // 👈 Usa tu patch existente
import type { IreservaServicio } from "../../interfaces/reservaServicio";

export function ServicioReservaList() {
  const { reserva_id } = useParams<{ reserva_id: string }>();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [servicios, setServicios] = useState<IreservaServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Función para calcular y actualizar el monto total de la reserva
  const actualizarMonto = async (serviciosActuales: IreservaServicio[]) => {
    if (!reserva_id || !token) return;

    // Sumar precios (convertidos a número)
    const montoTotal = serviciosActuales.reduce((acc, s) => {
      const precio = parseFloat(String(s.servicio?.precio || "0"));
      return acc + (isNaN(precio) ? 0 : precio);
    }, 0);

    try {
      // PATCH solo del campo monto usando tu función updateReserva
      await updateReserva(Number(reserva_id), { total_estimado: montoTotal }, token);
      console.log(`💰 Monto actualizado: $${montoTotal.toFixed(2)}`);
    } catch (err) {
      console.error("Error al actualizar el monto:", err);
    }
  };

  // 🔹 Cargar servicios de la reserva
  useEffect(() => {
    if (!reserva_id || !token) return;

    async function loadServicios() {
      setLoading(true);
      try {
        const res = await getReservaServiciosByReserva(Number(reserva_id), token ?? "");
        console.log("Servicios cargados:", res.data);
        setServicios(res.data);

        // Actualizar monto automáticamente al cargar
        await actualizarMonto(res.data);
      } catch (err) {
        console.error("Error al cargar los servicios de la reserva:", err);
        setError("No se pudieron cargar los servicios de esta reserva");
      } finally {
        setLoading(false);
      }
    }

    loadServicios();
  }, [reserva_id, token]);

  // 🔹 Eliminar servicio y recalcular monto
  const handleDelete = async (id: number) => {
    if (!token) return;
    const confirmed = window.confirm("¿Seguro que deseas eliminar este servicio?");
    if (!confirmed) return;

    try {
      await deleteReservaServicio(id, token);
      const nuevosServicios = servicios.filter((s) => s.id !== id);
      setServicios(nuevosServicios);

      // Actualiza el monto después de eliminar
      await actualizarMonto(nuevosServicios);

      alert("Servicio eliminado correctamente ✅");
    } catch (err) {
      console.error("Error eliminando el servicio:", err);
      alert("No se pudo eliminar el servicio ❌");
    }
  };

  // 🔹 Navegar a editar servicio
  const handleEdit = (id: number) => {
    navigate(`/servicios/reserva-list/reservados/${reserva_id}/${id}`);
  };

  // 🔹 Ir a pago
  const irAPago = (id: number | string | undefined) => {
    navigate(`/servicios/reserva-list/reserva/pago/${id}`);
  };

  if (loading) return <p>Cargando servicios de la reserva...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (servicios.length === 0) return <p>No hay servicios asignados a esta reserva</p>;
  const hayConfirmadas = servicios.some(s => s.estado === 'confirmada');

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto" }}>
      <h2>Servicios de la Reserva</h2>
      {servicios.map((servicio) => (
        <div
          key={servicio.id}
          style={{
            border: "1px solid #ccc",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          <p><strong>Servicio:</strong> {servicio.servicio?.nombre_servicio}</p>
          <p><strong>Fecha del servicio:</strong> {servicio.fecha_servicio}</p>
          <p><strong>Hora:</strong> {servicio.hora_servicio}</p>
          <p><strong>Precio:</strong> ${servicio.servicio?.precio}</p>
          <p><strong>Estado del servicio:</strong> <span style={{ fontWeight: 700 }}>{(servicio.estado ?? 'pendiente').toUpperCase()}</span></p>

          <button onClick={() => handleEdit(servicio.id ?? 0)} style={{ marginRight: "1rem" }}>
            Editar
          </button>
          <button
            onClick={() => handleDelete(servicio.id ?? 0)}
            style={{ backgroundColor: "#f44336", color: "#fff" }}
          >
            Eliminar
          </button>
        </div>
      ))}

      <button
        onClick={() => irAPago(reserva_id)}
        style={{ backgroundColor: hayConfirmadas ? "#4CAF50" : "#9e9e9e", color: "#fff", marginTop: "1rem" }}
        disabled={!hayConfirmadas}
        title={!hayConfirmadas ? "No puedes pagar hasta que al menos un proveedor confirme su servicio" : "Pagar reserva"}
      >
        Pagar Reserva
      </button>
    </div>
  );
}
