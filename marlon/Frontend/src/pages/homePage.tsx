import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../api/usersApi";
import { getCategorias } from "../api/categoria";

export function HomePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [rol, setRol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        if (token) {
          const res = await getUsers(token);
          setRol(res.data.rol);
        }

        const catRes = await getCategorias();
        setCategorias(catRes.categorias);   // ✅ Importante
      } catch (err) {
        console.error("Error cargando datos:", err);
        console.log("Categorias recibidas:", categorias);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);


  if (loading) return <p>Cargando...</p>;

  const handleMisTrabajos = () => {
    if (rol === "proveedor") {
      navigate("/mis-servicios");
    } else if (rol === "cliente") {
      navigate("/servicios/reserva-list/");
    } else {
      alert("Rol desconocido o no autorizado");
    }
  };

  const abrirCategoria = (catId: number) => {
    navigate(`/todos-servicios?categoria=${catId}`);
  };

  return (
    <div className="homepage-container">
      <section className="banner">
        <h1>FindYourWork</h1>
        <p>Encuentra y contrata los mejores servicios profesionales cerca de ti.</p>

        <div className="banner-buttons">
          {token ? (
            <>
              <button onClick={() => navigate("/todos-servicios")}>
                Ver trabajos
              </button>

              {rol === "administrador" ? (
                <button onClick={() => navigate("/admin-dashboard")}>
                  Panel de administrador
                </button>
              ) : (
                <button onClick={handleMisTrabajos}>
                  {rol === "proveedor" ? "Mis trabajos" : "Mis reservas"}
                </button>
              )}

              <button onClick={() => navigate("/categorias")}>
                Categorías
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/login")}>Iniciar sesión</button>
              <button onClick={() => navigate("/singup")}>Registrarse</button>
            </>
          )}
        </div>
      </section>

      {/* CATEGORÍAS DESDE BASE DE DATOS */}
      <section className="categories">
        <h2>Categorías populares</h2>

        <div className="category-list">
          {categorias.length === 0 ? (
            <p>No hay categorías registradas.</p>
          ) : (
            categorias.map(cat => (
              <div
                key={cat.id}
                className="category-card"
                onClick={() => abrirCategoria(cat.id)}
                style={{ cursor: "pointer" }}
              >
                {cat.nombre}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
