import { getUsers } from "../../api/usersApi";
import { updateReserva } from "../../api/reserva"; // función PUT
import { getReservaServiciosByReserva } from "../../api/reservaServicio";
import type { Ireserva } from "../../interfaces/reserva";
import { useEffect, useState } from "react";
import "../../App.css";
import { useNavigate } from "react-router-dom";
import { getSocket, authenticateSocket } from "../../websocket/socket";
import { graphQLRequest } from "../../api/graphql";
import { QUERY_RESERVAS } from "../../api/graphqlQueries";

export function ReservasCliente() {
  const [reservas, setReservas] = useState<Ireserva[]>([]);
  const [servicios, setServicios] = useState<Record<number, any[]>>({});
  const [expandedReserva, setExpandedReserva] = useState<number | null>(null);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 🔹 Cargar reservas (manteniendo GraphQL)
  const loadReservasData = async (token: string, clienteId: number) => {
    try {
      const variables = { filter: { clienteId: Number(clienteId) }, pagination: { limit: 50, offset: 0 } };
      console.log("[ReservasCliente] Enviando query GraphQL con variables:", JSON.stringify(variables));
      const data = await graphQLRequest<{ reservas: any[] }>({
        query: QUERY_RESERVAS,
        variables,
        token,
      });

      const mapped: Ireserva[] = (data.reservas || []).map((r) => ({
        id: r.id,
        cliente: {} as any,
        fecha: r.fecha,
        hora: r.hora,
        estado: r.estado,
        total_estimado: Number(r.totalEstimado ?? 0),
        detalles: [],
      }));

      setReservas(mapped);

      // 🔹 Cargar servicios para cada reserva
      const serviciosMap: Record<number, any[]> = {};
      for (const reserva of mapped) {
        try {
          const serviciosRes = await getReservaServiciosByReserva(reserva.id!, token);
          serviciosMap[reserva.id!] = serviciosRes.data || [];
        } catch (err) {
          console.error(`Error cargando servicios de reserva ${reserva.id}:`, err);
          serviciosMap[reserva.id!] = [];
        }
      }
      setServicios(serviciosMap);
    } catch (err) {
      console.error("Error al cargar las reservas:", err);
      setError("No se pudieron cargar las reservas");
    }
  };

  // 🔹 Cargar cliente y reservas al inicio
  useEffect(() => {
    async function loadReservas() {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay token guardado");
        setLoading(false);
        return;
      }

      try {
        const perfilRes = await getUsers(token);
        const cliId = Number(perfilRes.data.id);
        console.log("[ReservasCliente] Perfil obtenido:", perfilRes.data);
        console.log("[ReservasCliente] clienteId a usar:", cliId);
        setClienteId(cliId);

        await loadReservasData(token, cliId);
      } catch (err) {
        console.error("Error al cargar cliente:", err);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    }
    loadReservas();
  }, []);

  // 🔹 WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    if (!clienteId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = getSocket();
    let isConnected = false;

    const setupWebSocket = async () => {
      try {
        await authenticateSocket({
          token,
          userId: clienteId.toString(),
          role: "cliente",
        });

        socket.emit("join_room", { roomName: `cliente_${clienteId}` });

        const reload = () => loadReservasData(token, clienteId);
        socket.on("reservation_updated", reload);
        socket.on("reservation_created", reload);
        socket.on("reservation_deleted", reload);
        socket.on("payment_updated", reload);

        isConnected = true;
      } catch (error) {
        console.error("Error conectando WebSocket:", error);
      }
    };

    setupWebSocket();

    return () => {
      if (isConnected) {
        socket.off("reservation_updated");
        socket.off("reservation_created");
        socket.off("reservation_deleted");
        socket.off("payment_updated");
      }
    };
  }, [clienteId]);

  if (loading)
    return <p style={{ textAlign: "center" }}>Cargando reservas...</p>;
  if (error)
    return <p style={{ color: "#f44336", textAlign: "center" }}>{error}</p>;

  // 🔹 Actualizar estado de reserva
  const actualizarEstado = async (id: number, nuevoEstado: "confirmada" | "cancelada") => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await updateReserva(id, { estado: nuevoEstado }, token);
      setReservas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, estado: nuevoEstado } : r))
      );
    } catch (err) {
      console.error(`Error actualizando reserva ${id}:`, err);
      alert("No se pudo actualizar la reserva");
    }
  };

  return (
    <div className="homepage-container">
      <h2 style={{ marginBottom: "1rem" }}>Mis Reservas</h2>

      {reservas.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666", padding: "2rem" }}>
          No se ha creado ninguna reserva aún
        </p>
      ) : (
        <div className="card-container">
          {reservas.map((reserva) => (
            <div key={reserva.id} className="card">
              <h3>Reserva #{reserva.id}</h3>
              <p><strong>Fecha:</strong> {reserva.fecha}</p>
              <p><strong>Hora:</strong> {reserva.hora}</p>
              <p>
                <strong>Pago:</strong>{" "}
                <span
                  style={{
                    color:
                      reserva.estado === "pendiente"
                        ? "#ff9800"
                        : reserva.estado === "confirmada"
                        ? "#4caf50"
                        : "#f44336",
                    fontWeight: "bold",
                  }}
                >
                  {(reserva.estado ?? "pendiente").toUpperCase()}
                </span>
              </p>

              {/* Botones cuando la reserva está pendiente */}
              {reserva.estado === "pendiente" && (
                <>
                  <button
                    onClick={() =>
                      setExpandedReserva(
                        expandedReserva === reserva.id ? null : reserva.id || null
                      )
                    }
                  >
                    {expandedReserva === reserva.id
                      ? "Ocultar servicios"
                      : "Ver servicios"}
                  </button>
                  <button
                    style={{ 
                      marginLeft: "0.5rem", 
                      backgroundColor: "#4caf50",
                      color: "#fff",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                    onClick={() => navigate(`/pago/${reserva.id}`)}
                  >
                    💳 Pagar ${reserva.total_estimado}
                  </button>
                  <button
                    style={{ marginLeft: "0.5rem", backgroundColor: "#f44336" }}
                    onClick={() => actualizarEstado(reserva.id ?? 0, "cancelada")}
                  >
                    Cancelar
                  </button>
                </>
              )}

              {/* 🔹 Lista de servicios expandible */}
              {expandedReserva === reserva.id && (
                <div
                  style={{
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid #ccc",
                  }}
                >
                  <h4>Servicios Reservados:</h4>
                  {servicios[reserva.id!]?.length === 0 ? (
                    <p style={{ color: "#666" }}>Sin servicios aún</p>
                  ) : (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {servicios[reserva.id!]?.map((servicio: any) => (
                        <li
                          key={servicio.id}
                          style={{
                            marginBottom: "0.5rem",
                            padding: "0.5rem",
                            backgroundColor: "#f5f5f5",
                            borderRadius: "4px",
                          }}
                        >
                          <strong>{servicio.servicio?.nombre_servicio}</strong>
                          <br />
                          Fecha: {servicio.fecha_servicio} | Hora: {servicio.hora_servicio}
                          <br />
                          Estado:{" "}
                          <span
                            style={{
                              color:
                                servicio.estado === "pendiente"
                                  ? "#ff9800"
                                  : servicio.estado === "confirmada"
                                  ? "#4caf50"
                                  : "#f44336",
                              fontWeight: "bold",
                            }}
                          >
                            {(servicio.estado ?? "pendiente").toUpperCase()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/servicios/reserva/form")}
        style={{ marginTop: "1rem" }}
      >
        Agregar reservas
      </button>
    </div>
  );
}
