import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getServicioById } from "../../api/servicio";
import { getFotosByServicio } from "../../api/foto";
import type { Iservicio } from "../../interfaces/servicio";
import type { Ifoto } from "../../interfaces/foto";

export function ServicioDetalles() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [servicio, setServicio] = useState<Iservicio | null>(null);
  const [fotos, setFotos] = useState<Ifoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function loadData() {
      if (!token || !id) return;

      try {
        const [servicioRes, fotosRes] = await Promise.all([
          getServicioById(Number(id), token),
          getFotosByServicio(Number(id), token),
        ]);
        setServicio(servicioRes.data);
        setFotos(fotosRes.data);
      } catch (err) {
        console.error("Error cargando servicio:", err);
        setError("No se pudieron cargar los datos del servicio");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, token]);

  if (loading) return <p className="loading">Cargando detalles...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!servicio) return <p className="empty">No se encontró el servicio.</p>;

  return (
    <div className="servicio-detalles-container">
      <h2 className="titulo">{servicio.nombre_servicio}</h2>

      <div className="info-card">
        <p><strong>Descripción:</strong> {servicio.descripcion}</p>
        <p><strong>Duración:</strong> {servicio.duracion || "No especificada"}</p>
        <p><strong>Categoría:</strong> {servicio.categoria?.nombre || "Sin categoría"}</p>
        <p><strong>Rating promedio:</strong> ⭐ {servicio.rating_promedio.toFixed(1)}</p>
        <p><strong>Precio:</strong> ${servicio.precio}</p>
      </div>

      <h3 className="subtitulo">📸 Fotos del servicio</h3>
      <div className="fotos-grid">
        {fotos.length > 0 ? (
          fotos.map((foto) => (
            <div key={foto.id} className="foto-card">
              <img src={foto.url_foto} alt="Foto del servicio" />
              {foto.descripcion && <p>{foto.descripcion}</p>}
            </div>
          ))
        ) : (
          <p className="empty">No hay fotos disponibles.</p>
        )}
      </div>

      <div className="botones-container">
        <button className="btn blue" onClick={() => navigate(`/todos-servicios/${id}/comentarios`)}>
          Ver Comentarios
        </button>
        <button className="btn yellow" onClick={() => navigate(`/todos-servicios/${id}/calificaciones`)}>
          Ver Calificaciones
        </button>
        <button className="btn green" onClick={() => navigate(`/todos-servicios/${id}/reservaServicio`)}>
          Agregar a la reserva
        </button>
      </div>
    </div>
  );
}
