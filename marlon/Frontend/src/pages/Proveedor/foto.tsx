import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { Ifoto } from "../../interfaces/foto";
import { createFotoServicio, getFotosByServicio, deleteFotoServicio } from "../../api/foto";

export function Fotos() {
  const { servicio_id } = useParams<{ servicio_id: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [fotos, setFotos] = useState<Ifoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<Ifoto>();

  // 🔹 Cargar fotos del servicio
  useEffect(() => {
    async function loadFotos() {
      if (!token || !servicio_id) return;

      try {
        const res = await getFotosByServicio(Number(servicio_id), token);
        setFotos(res.data);
      } catch (err) {
        console.error("Error cargando fotos:", err);
        setError("No se pudieron cargar las fotos");
      } finally {
        setLoading(false);
      }
    }

    loadFotos();
  }, [token, servicio_id]);

  // 🔹 Agregar foto
  const onSubmit = handleSubmit(async (data) => {
    if (!token || !servicio_id) return;

    const body: Ifoto = {
      servicio_id: Number(servicio_id),
      url_foto: data.url_foto,
      descripcion: data.descripcion || "",
    };

    try {
      const res = await createFotoServicio(body, token);
      setFotos((prev) => [...prev, res.data]);
      reset();
      alert("✅ Foto agregada correctamente");
    } catch (err) {
      console.error("Error agregando foto:", err);
      alert("❌ No se pudo agregar la foto");
    }
  });

  // 🔹 Eliminar foto
  const handleDelete = async (fotoId: number) => {
    if (!token) return;

    const confirmed = window.confirm("¿Está seguro de eliminar esta foto?");
    if (!confirmed) return;

    try {
      await deleteFotoServicio(fotoId, token);
      setFotos((prev) => prev.filter((f) => f.id !== fotoId));
      alert("Foto eliminada correctamente");
    } catch (err) {
      console.error("Error eliminando foto:", err);
      alert("❌ No se pudo eliminar la foto");
    }
  };

  if (loading) return <p>Cargando fotos...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Fotos del Servicio</h2>

      {/* Formulario para agregar foto */}
      <form onSubmit={onSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="url"
          placeholder="URL de la foto"
          {...register("url_foto", { required: true })}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />
        {errors.url_foto && <span>La URL de la foto es obligatoria</span>}

        <textarea
          placeholder="Descripción (opcional)"
          {...register("descripcion")}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />

        <button type="submit">Agregar Foto</button>
      </form>

      {/* Listado de fotos */}
      {fotos.length === 0 ? (
        <p>No hay fotos registradas.</p>
      ) : (
        fotos.map((foto) => (
          <div
            key={foto.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <img
              src={foto.url_foto}
              alt={foto.descripcion || "Foto del servicio"}
              style={{ width: "100%", borderRadius: "4px", marginBottom: "0.5rem" }}
            />
            {foto.descripcion && <p>{foto.descripcion}</p>}

            <button
              onClick={() => handleDelete(foto.id!)}
              style={{ backgroundColor: "#f44336", color: "white" }}
            >
              Eliminar
            </button>
          </div>
        ))
      )}

      <button
        style={{ marginTop: "1rem" }}
        onClick={() => navigate("/mis-servicios")}
      >
        Terminar
      </button>
    </div>
  );
}
