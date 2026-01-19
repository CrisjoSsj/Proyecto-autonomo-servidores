import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getCalificacionesByServicio,
  createCalificacion,
  updateCalificacion,
  deleteCalificacion,
} from "../../api/CalificacionApi";
import { getUsers } from "../../api/usersApi";
import type { Icalificacion } from "../../interfaces/califiacion";

export function Calificaciones() {
  const { servicio_id } = useParams<{ servicio_id: string }>();
  const [calificaciones, setCalificaciones] = useState<Icalificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevaCalificacion, setNuevaCalificacion] = useState({ puntuacion: 0 });
  const [clienteId, setClienteId] = useState<number | null>(null);
  const token = localStorage.getItem("token");

  // Obtener cliente logueado
  useEffect(() => {
    async function loadCliente() {
      if (!token) return;
      try {
        const res = await getUsers(token);
        const data = res.data;
        if ("telefono" in data && !("descripcion" in data)) {
          setClienteId(data.id);
        } else {
          setClienteId(null);
        }
      } catch (err) {
        console.error("Error cargando cliente:", err);
      }
    }
    loadCliente();
  }, [token]);

  // Cargar calificaciones
  useEffect(() => {
    async function loadCalificaciones() {
      if (!token || !servicio_id) return;
      try {
        const res = await getCalificacionesByServicio(Number(servicio_id), token);
        setCalificaciones(res.data);
      } catch (err) {
        console.error("Error cargando calificaciones:", err);
        setError("Error cargando calificaciones");
      } finally {
        setLoading(false);
      }
    }
    loadCalificaciones();
  }, [servicio_id, token]);

  if (loading) return <p style={{ textAlign: "center" }}>Cargando calificaciones...</p>;
  if (error) return <p style={{ color: "#f44336", textAlign: "center" }}>{error}</p>;

  const handleCreate = async () => {
    if (!nuevaCalificacion.puntuacion || !token || !clienteId || !servicio_id) {
      alert("Faltan datos para crear la calificación");
      return;
    }
    try {
      const body: Icalificacion = {
        cliente_id: clienteId,
        servicio_id: Number(servicio_id),
        puntuacion: nuevaCalificacion.puntuacion,
      };
      const res = await createCalificacion(body, token);
      setCalificaciones([...calificaciones, res.data]);
      setNuevaCalificacion({ puntuacion: 0 });
    } catch (err) {
      alert("Error creando calificación");
    }
  };

  const handleEdit = async (id: number, nuevaPuntuacion: number) => {
    if (!token) return;
    try {
      const res = await updateCalificacion(id, { puntuacion: nuevaPuntuacion }, token);
      setCalificaciones((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    } catch {
      alert("Error actualizando calificación");
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await deleteCalificacion(id, token);
      setCalificaciones((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Error eliminando calificación");
    }
  };

  const promedio =
    calificaciones.length > 0
      ? (
          calificaciones.reduce((acc, c) => acc + c.puntuacion, 0) /
          calificaciones.length
        ).toFixed(1)
      : "0.0";

  const Star = ({ filled, onClick }: { filled: boolean; onClick?: () => void }) => (
    <span
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        color: filled ? "#FFD700" : "#555",
        fontSize: "1.8rem",
      }}
    >
      ★
    </span>
  );

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "2rem auto",
        backgroundColor: "#2c2c2c",
        padding: "2rem",
        borderRadius: "10px",
        boxShadow: "0 0 15px rgba(0,0,0,0.5)",
        color: "#fff",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#00bcd4", marginBottom: "1rem" }}>
        ⭐ Calificaciones del Servicio
      </h2>
      <p style={{ textAlign: "center", fontSize: "1.1rem" }}>
        Promedio actual: <strong>{promedio}</strong> / 5
      </p>

      {/* Nueva calificación */}
      {clienteId ? (
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <p>Tu calificación:</p>
          <div style={{ marginBottom: "0.5rem" }}>
            {[1, 2, 3, 4, 5].map((num) => (
              <Star
                key={num}
                filled={num <= nuevaCalificacion.puntuacion}
                onClick={() => setNuevaCalificacion({ puntuacion: num })}
              />
            ))}
          </div>
          <button onClick={handleCreate}>Enviar Calificación</button>
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#888" }}>No se encontró el cliente logueado</p>
      )}

      {/* Lista de calificaciones */}
      {calificaciones.length === 0 && (
        <p style={{ textAlign: "center" }}>No hay calificaciones aún.</p>
      )}

      {calificaciones.map((c) => (
        <div key={c.id} className="card">
          <h4 style={{ marginBottom: "0.3rem", color: "#00bcd4" }}>
            {c.cliente.user.username}{" "}
            <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
              ({new Date(c.created_at || "").toLocaleDateString()})
            </span>
          </h4>
          <div style={{ marginBottom: "0.5rem" }}>
            {[1, 2, 3, 4, 5].map((num) => (
              <Star key={num} filled={num <= c.puntuacion} />
            ))}
          </div>

          {c.cliente.id === clienteId && (
            <div>
              <button
                style={{ marginRight: "0.5rem", background: "#00bcd4" }}
                onClick={() => {
                  const nueva = Number(prompt("Nueva puntuación (1-5):", c.puntuacion.toString()));
                  if (nueva >= 1 && nueva <= 5) handleEdit(c.id!, nueva);
                }}
              >
                Editar
              </button>
              <button
                style={{ background: "#f44336" }}
                onClick={() => handleDelete(c.id!)}
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
