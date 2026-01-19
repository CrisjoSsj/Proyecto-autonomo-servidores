import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../../api/usersApi";
import { deleteServicio } from "../../api/servicio";
import type { Iservicio } from "../../interfaces/servicio";
import { graphQLRequest } from "../../api/graphql";
import { QUERY_SERVICIOS } from "../../api/graphqlQueries";
import { Trash2, Edit3, Image, MapPin, Plus } from "lucide-react";


export function ServiciosProveedor() {
  const [servicios, setServicios] = useState<Iservicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadServicios() {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay token guardado");
        setLoading(false);
        return;
      }

      try {
        const perfilRes = await getUsers(token);
        if (perfilRes.data.rol !== "proveedor") {
          setError("El usuario no tiene rol de proveedor");
          setLoading(false);
          return;
        }

        // Usar soloMios: true para filtrar por el proveedor autenticado
        // El backend usa el JWT para identificar al proveedor
        const data = await graphQLRequest<{ servicios: any[] }>({
          query: QUERY_SERVICIOS,
          variables: { filter: { soloMios: true }, pagination: { limit: 50, offset: 0 } },
          token,
        });

        const mapped: Iservicio[] = (data.servicios || []).map((s) => ({
          id: s.id,
          categoria: { id: s.categoria?.id, nombre: s.categoria?.nombre },
          nombre_servicio: s.nombreServicio,
          descripcion: s.descripcion ?? null,
          duracion: s.duracion ?? null,
          rating_promedio: s.ratingPromedio ?? 0,
          precio: Number(s.precio ?? 0),
        }));
        setServicios(mapped);
      } catch (err) {
        console.error("Error al cargar los servicios: ", err);
        setError("No se pudieron cargar los servicios");
      } finally {
        setLoading(false);
      }
    }

    loadServicios();
  }, []);

  const handleDelete = async (servicioId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No hay token guardado");
      return;
    }
    try {
      await deleteServicio(servicioId, token);
      setServicios(servicios.filter((s) => s.id !== servicioId));
      alert("Servicio eliminado correctamente");
    } catch (err) {
      console.error("Error al eliminar el servicio: ", err);
      alert("No se pudo eliminar el servicio");
    }
  };

  if (loading)
    return <p style={{ textAlign: "center" }}>Cargando servicios...</p>;
  if (error)
    return <p style={{ color: "#f44336", textAlign: "center" }}>{error}</p>;

  if (servicios.length === 0)
    return (
      <div className="empty-container">
        <p>No tienes servicios registrados</p>
        <button className="add-btn" onClick={() => navigate("/crear-nuevo-servicio")}>
          <Plus size={18} style={{ marginRight: 6 }} /> Agregar servicios
        </button>
      </div>
    );

  return (
    <div className="servicios-container">
      <h2 className="servicios-title">Mis Servicios</h2>
      <div className="servicios-grid">
        {servicios.map((servicio) => (
          <div key={servicio.id} className="servicio-card">
            <h3 className="servicio-title">{servicio.nombre_servicio}</h3>
            <p className="servicio-desc">{servicio.descripcion}</p>
            <p className="servicio-detail"><strong>Duración:</strong> {servicio.duracion}</p>
            <p className="servicio-detail"><strong>Rating:</strong> ⭐ {servicio.rating_promedio}</p>

            <div className="button-group">
              <button onClick={() => navigate(`/crear-nuevo-servicio/agregar-fotos/${servicio.id}`)} className="btn blue">
                <Image size={16} /> Fotos
              </button>
              <button onClick={() => navigate(`/crear-nuevo-servicio/ubicaciones/${servicio.id}`)} className="btn green">
                <MapPin size={16} /> Ubicaciones
              </button>
              <button onClick={() => navigate(`/crear-nuevo-servicio/${servicio.id}`)} className="btn yellow">
                <Edit3 size={16} /> Editar
              </button>
              <button onClick={() => handleDelete(servicio.id)} className="btn red">
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="add-container">
        <button className="add-btn" onClick={() => navigate("/crear-nuevo-servicio")}>
          <Plus size={18} style={{ marginRight: 6 }} /> Agregar nuevo servicio
        </button>
      </div>
    </div>
  );
}
