import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { graphQLRequest } from "../../api/graphql";
import { QUERY_CATEGORIAS } from "../../api/graphqlQueries";
import "../../App.css";

type Categoria = {
  id: number;
  nombre: string;
  descripcion?: string | null;
};

export function CategoriasCliente() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCategorias() {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No hay token disponible");
        setLoading(false);
        return;
      }
      try {
        const data = await graphQLRequest<{ categorias: any[] }>({
          query: QUERY_CATEGORIAS,
          variables: { pagination: { limit: 100, offset: 0 } },
          token,
        });
        const mapped: Categoria[] = (data.categorias || []).map((c) => ({
          id: c.id,
          nombre: c.nombre,
          descripcion: c.descripcion ?? null,
        }));
        setCategorias(mapped);
      } catch (err) {
        console.error("Error al cargar categorías:", err);
        setError("No se pudieron cargar las categorías desde GraphQL");
      } finally {
        setLoading(false);
      }
    }
    loadCategorias();
  }, []);

  if (loading) return <p style={{ textAlign: "center" }}>Cargando categorías...</p>;
  if (error) return <p style={{ color: "#f44336", textAlign: "center" }}>{error}</p>;

  return (
    <div className="homepage-container">
      <h1>Categorías</h1>
      <div className="category-list">
        {categorias.map((cat) => (
          <div key={cat.id} className="category-card" onClick={() => navigate(`/todos-servicios?categoria=${cat.id}`)}>
            <div style={{ fontWeight: 600 }}>{cat.nombre}</div>
            {cat.descripcion && <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>{cat.descripcion}</div>}
          </div>
        ))}
        {categorias.length === 0 && (
          <p style={{ textAlign: "center" }}>No hay categorías disponibles.</p>
        )}
      </div>
    </div>
  );
}


