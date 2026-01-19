import { useNavigate, useParams } from "react-router-dom";
import type { Iubicacion } from "../../interfaces/ubicacion";
import { createUbicacion, deleteUbicacion, updateUbicacion } from "../../api/ubicacion";
import { useEffect, useState } from "react";
import { getServicioUbicacionByServicio, createServicioUbicacion, deleteServicioUbicacion } from "../../api/ServicioUbicacion";
import type { IservicioUbicacion } from "../../interfaces/servicioUbicacion";

export function Ubicaciones() {
  const { servicio_id } = useParams<{ servicio_id: string }>();
  const [nuevaUbicacion, setNuevaUbicacion] = useState<Partial<Iubicacion>>({});
  const [servicioUbicaciones, setServicioUbicaciones] = useState<IservicioUbicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // 🔹 Cargar ubicaciones del servicio
  useEffect(() => {
    async function loadUbicaciones() {
      if (!token) return;
      if (!servicio_id) {
        console.error("No se recibió servicio_id en params");
        return;
      }

      try {
        const res = await getServicioUbicacionByServicio(Number(servicio_id), token);
        console.log("Ubicaciones del servicio cargadas:", res.data);
        setServicioUbicaciones(res.data);
      } catch (err) {
        console.error("Error al cargar ubicaciones:", err);
        setError("No se pudieron cargar las ubicaciones");
      } finally {
        setLoading(false);
      }
    }
    loadUbicaciones();
  }, [token, servicio_id]);

  if (loading) return <p>Cargando ubicaciones...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  // 🔹 Controlar inputs para nueva ubicación
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNuevaUbicacion((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Crear ubicación
  const handleCreate = async () => {
    if (
      !nuevaUbicacion.direccion ||
      !nuevaUbicacion.ciudad ||
      !nuevaUbicacion.provincia ||
      !nuevaUbicacion.pais ||
      !token
    ) {
      alert("Por favor complete todos los campos");
      return;
    }

    try {
      const body: Iubicacion = {
        direccion: nuevaUbicacion.direccion,
        ciudad: nuevaUbicacion.ciudad,
        provincia: nuevaUbicacion.provincia,
        pais: nuevaUbicacion.pais,
      };

      const res = await createUbicacion(body, token);
      console.log("Ubicación creada:", res.data);

      // Crear relación ServicioUbicacion
      const serviUbi: IservicioUbicacion = {
        servicio_id: Number(servicio_id),
        ubicacion_id: res.data.id!,
      };
      const resServiUbi = await createServicioUbicacion(serviUbi, token);
      console.log("ServicioUbicacion creada:", resServiUbi.data);

      // Actualizar la lista
      setServicioUbicaciones((prev) => [...prev, resServiUbi.data]);
      setNuevaUbicacion({});
      alert("Ubicación agregada correctamente");
    } catch (err) {
      console.error("Error creando la ubicación:", err);
      alert("No se pudo crear la ubicación");
    }
  };

  // 🔹 Editar ubicación
  const handleEdit = async (ubicacionId: number) => {
    if (!token) return;

    const direccion = prompt("Nueva dirección:");
    const ciudad = prompt("Nueva ciudad:");
    const provincia = prompt("Nueva provincia:");
    const pais = prompt("Nuevo país:");

    if (!direccion || !ciudad || !provincia || !pais) {
      alert("Debe completar todos los campos");
      return;
    }

    const updatedData: Partial<Iubicacion> = { direccion, ciudad, provincia, pais };

    try {
      const res = await updateUbicacion(ubicacionId, updatedData, token);
      console.log("Ubicación actualizada:", res.data);

      // Actualizar la lista localmente
      setServicioUbicaciones((prev) =>
        prev.map((su) =>
          su.ubicacion.id === ubicacionId ? { ...su, ubicacion: res.data } : su
        )
      );
      alert("Ubicación actualizada correctamente");
    } catch (err) {
      console.error("Error editando la ubicación:", err);
      alert("No se pudo editar la ubicación");
    }
  };

  // 🔹 Eliminar ubicación y relación
  const handleDelete = async (ubicacionId: number) => {
    if (!token) return;

    try {
      const relacion = servicioUbicaciones.find((su) => su.ubicacion.id === ubicacionId);

      if (relacion) {
        await deleteServicioUbicacion(relacion.id!, token);
        console.log(`ServicioUbicacion con id ${relacion.id} eliminada`);
      }

      await deleteUbicacion(ubicacionId, token);
      console.log(`Ubicación con id ${ubicacionId} eliminada`);

      setServicioUbicaciones((prev) =>
        prev.filter((su) => su.ubicacion.id !== ubicacionId)
      );

      alert("Ubicación eliminada correctamente");
    } catch (err) {
      console.error("Error eliminando la ubicación:", err);
      alert("No se pudo eliminar la ubicación");
    }
  };

  // 🔹 Render
  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Ubicaciones del Servicio</h2>

      {/* Crear nueva ubicación */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          name="direccion"
          placeholder="Dirección"
          value={nuevaUbicacion.direccion || ""}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
        <input
          type="text"
          name="ciudad"
          placeholder="Ciudad"
          value={nuevaUbicacion.ciudad || ""}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
        <input
          type="text"
          name="provincia"
          placeholder="Provincia"
          value={nuevaUbicacion.provincia || ""}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
        <input
          type="text"
          name="pais"
          placeholder="País"
          value={nuevaUbicacion.pais || ""}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
        <button onClick={handleCreate}>Agregar Ubicación</button>
        <button onClick={() => navigate("/mis-servicios")}>terminar</button>
      </div>

      {/* Listado de ubicaciones */}
      {servicioUbicaciones.length === 0 ? (
        <p>No hay ubicaciones registradas.</p>
      ) : (
        servicioUbicaciones.map((su) => (
          <div
            key={su.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <h4>📍 {su.ubicacion.direccion}</h4>
            <p>
              <strong>Ciudad:</strong> {su.ubicacion.ciudad} <br />
              <strong>Provincia:</strong> {su.ubicacion.provincia} <br />
              <strong>País:</strong> {su.ubicacion.pais}
            </p>

            <button
              onClick={() => handleEdit(su.ubicacion.id!)}
              style={{ marginRight: "0.5rem" }}
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(su.ubicacion.id!)}
              style={{ backgroundColor: "#f44336", color: "white" }}
            >
              Eliminar
            </button>
          </div>
        ))
      )}
    </div>
  );
}
