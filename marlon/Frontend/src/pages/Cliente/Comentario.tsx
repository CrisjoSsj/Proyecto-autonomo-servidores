import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getComentariosByServicio,
  createComentario,
  updateComentario,
  deleteComentario,
} from "../../api/comentarioApi";
import { getUsers } from "../../api/usersApi";
import type { Icomentario } from "../../interfaces/comentario";


export function ComentariosServicio() {
  const { servicio_id } = useParams<{ servicio_id: string }>();
  const [comentarios, setComentarios] = useState<Icomentario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevoComentario, setNuevoComentario] = useState({ titulo: "", texto: "" });
  const [clienteId, setClienteId] = useState<number | null>(null);
  const token = localStorage.getItem("token");

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

  useEffect(() => {
    async function loadComentarios() {
      if (!token || !servicio_id) return;
      try {
        const res = await getComentariosByServicio(Number(servicio_id), token);
        setComentarios(res.data);
      } catch (err) {
        console.error("Error al cargar comentarios:", err);
        setError("No se pudieron cargar los comentarios");
      } finally {
        setLoading(false);
      }
    }
    loadComentarios();
  }, [servicio_id, token]);

  if (loading) return <p className="loading">Cargando comentarios...</p>;
  if (error) return <p className="error">{error}</p>;

  const handleCreate = async () => {
    if (!nuevoComentario.titulo || !nuevoComentario.texto || !token || !servicio_id || !clienteId) {
      alert("No se pudo crear el comentario. Revisa los datos.");
      return;
    }

    try {
      const body: Icomentario = {
        cliente_id: clienteId,
        servicio_id: Number(servicio_id),
        titulo: nuevoComentario.titulo,
        texto: nuevoComentario.texto,
      };
      const res = await createComentario(body, token);
      setComentarios((prev) => [...prev, res.data]);
      setNuevoComentario({ titulo: "", texto: "" });
    } catch {
      alert("No se pudo crear el comentario");
    }
  };

  const handleEdit = async (id: number, texto: string) => {
    if (!token) return;
    try {
      const res = await updateComentario(id, { texto }, token);
      setComentarios((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    } catch {
      alert("No se pudo editar el comentario");
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await deleteComentario(id, token);
      setComentarios((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("No se pudo eliminar el comentario");
    }
  };

  return (
    <div className="comentarios-container">
      <h2 className="titulo">💬 Comentarios del Servicio</h2>

      {clienteId ? (
        <div className="nuevo-comentario">
          <input
            type="text"
            placeholder="Título"
            value={nuevoComentario.titulo}
            onChange={(e) =>
              setNuevoComentario((prev) => ({ ...prev, titulo: e.target.value }))
            }
          />
          <textarea
            placeholder="Escribe tu comentario..."
            value={nuevoComentario.texto}
            onChange={(e) =>
              setNuevoComentario((prev) => ({ ...prev, texto: e.target.value }))
            }
          />
          <button className="btn blue" onClick={handleCreate}>
            Agregar Comentario
          </button>
        </div>
      ) : (
        <p className="warning">⚠️ No se encontró el cliente logueado</p>
      )}

      {comentarios.length === 0 ? (
        <p className="empty">No hay comentarios aún.</p>
      ) : (
        comentarios.map((c) => (
          <div key={c.id} className="comentario-card">
            <h4>
              {c.titulo}{" "}
              <small className="autor">— {c.cliente.user.username}</small>
            </h4>
            <p>{c.texto}</p>
            {c.respuesta && (
              <p className="respuesta">
                <strong>Respuesta del proveedor:</strong> {c.respuesta}
              </p>
            )}
            <p className="fecha">
              {new Date(c.fecha || c.created_at).toLocaleString()}
            </p>

            {c.cliente.id === clienteId && (
              <div className="acciones">
                <button
                  className="btn yellow"
                  onClick={() => {
                    const nuevoTexto = prompt("Editar comentario:", c.texto);
                    if (nuevoTexto) handleEdit(c.id!, nuevoTexto);
                  }}
                >
                  Editar
                </button>
                <button
                  className="btn red"
                  onClick={() => handleDelete(c.id!)}
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
