import { useState, useEffect } from "react";
import NavbarAdmin from "../../components/admin/NavbarAdmin";
import "../../css/admin/GestionMenu.css";

const API_BASE_URL = 'http://127.0.0.1:8000';

interface Plato {
  id_plato: number;
  nombre: string;
  descripcion: string;
  precio: number;
  estado: string;
  id_categoria: number;
  disponible: boolean;
}

interface CategoriaMenu {
  id_categoria: number;
  nombre: string;
}

interface PlatoConCategoria extends Plato {
  categoria?: CategoriaMenu;
}

export default function GestionMenu() {
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMenu[]>([]);
  const [platosConCategoria, setPlatosConCategoria] = useState<PlatoConCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryListModal, setShowCategoryListModal] = useState(false);
  const [editingPlato, setEditingPlato] = useState<Plato | null>(null);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaMenu | null>(null);

  // Estados para formularios
  const [platoForm, setPlatoForm] = useState({
    nombre: "",
    descripcion: "",
    precio: 0,
    estado: "disponible",
    id_categoria: 1,
    disponible: true
  });

  const [categoriaForm, setCategoriaForm] = useState({
    nombre: ""
  });

  // Cargar datos desde la API
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar platos y categorías en paralelo
      const [platosRes, categoriasRes] = await Promise.all([
        fetch(`${API_BASE_URL}/platos/`),
        fetch(`${API_BASE_URL}/categorias/`)
      ]);

      if (!platosRes.ok || !categoriasRes.ok) {
        throw new Error('Error al cargar datos');
      }

      const platosData = await platosRes.json();
      const categoriasData = await categoriasRes.json();

      setPlatos(platosData);
      setCategorias(categoriasData);
      
      // Combinar platos con sus categorías
      const platosConCat = platosData.map((plato: Plato) => ({
        ...plato,
        categoria: categoriasData.find((cat: CategoriaMenu) => cat.id_categoria === plato.id_categoria)
      }));
      
      setPlatosConCategoria(platosConCat);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar platos
  const platosFiltrados = platosConCategoria.filter(plato => {
    const cumpleCategoria = filtroCategoria === "todas" || plato.id_categoria.toString() === filtroCategoria;
    const cumpleEstado = filtroEstado === "todos" || plato.estado === filtroEstado;
    const cumpleBusqueda = plato.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          plato.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    
    return cumpleCategoria && cumpleEstado && cumpleBusqueda;
  });

  // Agrupar platos por categoría
  const platosPorCategoria = categorias.map(categoria => ({
    categoria,
    platos: platosFiltrados.filter(plato => plato.id_categoria === categoria.id_categoria)
  }));

  // Funciones CRUD para platos
  const crearPlato = async () => {
    try {
      const platoData = {
        id_plato: 0, // El backend generará el ID automáticamente
        ...platoForm
      };

      const response = await fetch(`${API_BASE_URL}/plato/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platoData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear plato');
      }

      const nuevoPlato = await response.json();
      console.log('Plato creado:', nuevoPlato);
      cargarDatos(); // Recargar para actualizar la vista
      cerrarModal();
      alert('Plato creado exitosamente');
    } catch (error) {
      console.error('Error creando plato:', error);
      alert(`Error al crear el plato: ${error}`);
    }
  };

  const actualizarPlato = async () => {
    if (!editingPlato) return;

    try {
      const platoActualizado = {
        id_plato: editingPlato.id_plato,
        ...platoForm
      };

      const response = await fetch(`${API_BASE_URL}/plato/${editingPlato.id_plato}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platoActualizado)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar plato');
      }

      const resultado = await response.json();
      console.log('Plato actualizado:', resultado);
      cargarDatos(); // Recargar datos
      cerrarModal();
      alert('Plato actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando plato:', error);
      alert(`Error al actualizar el plato: ${error}`);
    }
  };

  const eliminarPlato = async (id_plato: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este plato?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/plato/${id_plato}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar plato');
      }

      cargarDatos(); // Recargar datos
    } catch (error) {
      console.error('Error eliminando plato:', error);
      alert('Error al eliminar el plato');
    }
  };

  const toggleDisponibilidad = async (plato: Plato) => {
    try {
      const platoActualizado = {
        ...plato,
        disponible: !plato.disponible,
        estado: !plato.disponible ? "disponible" : "no_disponible"
      };

      const response = await fetch(`${API_BASE_URL}/plato/${plato.id_plato}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platoActualizado)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cambiar disponibilidad');
      }

      const resultado = await response.json();
      console.log('Disponibilidad actualizada:', resultado);
      cargarDatos(); // Recargar datos
      alert(`Plato ${platoActualizado.disponible ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error) {
      console.error('Error cambiando disponibilidad:', error);
      alert(`Error al cambiar la disponibilidad: ${error}`);
    }
  };

  // Funciones CRUD para categorías
  const crearCategoria = async () => {
    try {
      const categoriaData = {
        id_categoria: 0, // El backend generará el ID automáticamente
        ...categoriaForm
      };

      const response = await fetch(`${API_BASE_URL}/categoria/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoriaData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear categoría');
      }

      const resultado = await response.json();
      console.log('Categoría creada:', resultado);
      cargarDatos(); // Recargar datos
      cerrarCategoryModal();
      setShowCategoryListModal(true); // Volver a abrir la lista
      alert('Categoría creada exitosamente');
    } catch (error) {
      console.error('Error creando categoría:', error);
      alert(`Error al crear la categoría: ${error}`);
    }
  };

  const actualizarCategoria = async () => {
    if (!editingCategoria) return;

    try {
      const categoriaActualizada = {
        id_categoria: editingCategoria.id_categoria,
        ...categoriaForm
      };

      const response = await fetch(`${API_BASE_URL}/categoria/${editingCategoria.id_categoria}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoriaActualizada)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar categoría');
      }

      const resultado = await response.json();
      console.log('Categoría actualizada:', resultado);
      cargarDatos(); // Recargar datos
      cerrarCategoryModal();
      setShowCategoryListModal(true); // Volver a abrir la lista
      alert('Categoría actualizada exitosamente');
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      alert(`Error al actualizar la categoría: ${error}`);
    }
  };

  const eliminarCategoria = async (id_categoria: number) => {
    // Verificar si hay platos en esta categoría
    const platosEnCategoria = platos.filter(p => p.id_categoria === id_categoria);
    
    if (platosEnCategoria.length > 0) {
      alert(`No se puede eliminar la categoría porque tiene ${platosEnCategoria.length} platos asociados. Elimina o cambia la categoría de los platos primero.`);
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/categoria/${id_categoria}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar categoría');
      }

      cargarDatos(); // Recargar datos
      alert('Categoría eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      alert('Error al eliminar la categoría');
    }
  };

  // Funciones de modal
  const abrirModalCrear = () => {
    setEditingPlato(null);
    setPlatoForm({
      nombre: "",
      descripcion: "",
      precio: 0,
      estado: "disponible",
      id_categoria: 1,
      disponible: true
    });
    setShowModal(true);
  };

  const abrirModalEditar = (plato: Plato) => {
    setEditingPlato(plato);
    setPlatoForm({
      nombre: plato.nombre,
      descripcion: plato.descripcion,
      precio: plato.precio,
      estado: plato.estado,
      id_categoria: plato.id_categoria,
      disponible: plato.disponible
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingPlato(null);
  };

  const cerrarCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategoria(null);
    setCategoriaForm({ nombre: "" });
  };

  const cerrarCategoryListModal = () => {
    setShowCategoryListModal(false);
  };

  const abrirModalCrearCategoria = () => {
    setShowCategoryListModal(false); // Cerrar el modal de lista
    setEditingCategoria(null);
    setCategoriaForm({ nombre: "" });
    setShowCategoryModal(true);
  };

  const abrirModalEditarCategoria = (categoria: CategoriaMenu) => {
    setShowCategoryListModal(false); // Cerrar el modal de lista
    setEditingCategoria(categoria);
    setCategoriaForm({ nombre: categoria.nombre });
    setShowCategoryModal(true);
  };

  const abrirListaCategorias = () => {
    setShowCategoryListModal(true);
  };

  // Calcular estadísticas
  const totalPlatos = platos.length;
  const platosDisponibles = platos.filter(p => p.disponible).length;
  const platosAgotados = platos.filter(p => !p.disponible).length;

  if (loading) {
    return (
      <div className="gestion-menu-admin">
        <NavbarAdmin />
        <div className="loading-container">
          <p>Cargando menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-menu-admin">
      <NavbarAdmin />
      
      {/* Header de gestión del menú */}
      <section className="header-gestion-menu">
        <div className="contenedor-header-menu">
          <h1 className="titulo-gestion-menu">Gestión del Menú</h1>
          <p className="subtitulo-gestion-menu">Administra platos, precios y disponibilidad</p>
          <div className="acciones-menu-header">
            <button className="boton-agregar-plato" onClick={abrirModalCrear}>
              + Agregar Nuevo Plato
            </button>
            <button className="boton-agregar-plato" onClick={abrirListaCategorias}>
              Gestionar Categorías
            </button>
            <button className="boton-agregar-plato">📄 Exportar Menú</button>
          </div>
        </div>
      </section>

      {/* Estadísticas del menú */}
      <section className="seccion-estadisticas-menu">
        <div className="contenedor-estadisticas-menu">
          <div className="grilla-estadisticas-menu">
            <div className="tarjeta-estadistica-menu">
              <h3 className="titulo-estadistica-menu">Total de Platos</h3>
              <p className="numero-estadistica-menu">{totalPlatos}</p>
              <span className="detalle-estadistica-menu">{categorias.length} categorías</span>
            </div>
            <div className="tarjeta-estadistica-menu">
              <h3 className="titulo-estadistica-menu">Platos Disponibles</h3>
              <p className="numero-estadistica-menu">{platosDisponibles}</p>
              <span className="detalle-estadistica-menu">Activos en el menú</span>
            </div>
            <div className="tarjeta-estadistica-menu">
              <h3 className="titulo-estadistica-menu">No Disponibles</h3>
              <p className="numero-estadistica-menu">{platosAgotados}</p>
              <span className="detalle-estadistica-menu">Temporalmente inactivos</span>
            </div>
            <div className="tarjeta-estadistica-menu">
              <h3 className="titulo-estadistica-menu">Categorías</h3>
              <p className="numero-estadistica-menu">{categorias.length}</p>
              <span className="detalle-estadistica-menu">Tipos de platos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros y búsqueda */}
      <section className="seccion-filtros-menu">
        <div className="contenedor-filtros-menu">
          <div className="barra-filtros">
            <select 
              className="filtro-categoria"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria.id_categoria} value={categoria.id_categoria.toString()}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
            <select 
              className="filtro-estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="no_disponible">No disponible</option>
            </select>
            <input 
              type="text" 
              className="buscar-plato" 
              placeholder="Buscar plato..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Gestión por categorías */}
      <div className="contenedor-categorias-menu">
        {platosPorCategoria.map(({ categoria, platos: platosCat }) => (
          <section key={categoria.id_categoria} className="categoria-menu-admin">
            <div className="header-categoria-admin">
              <h2 className="titulo-categoria-admin">
                {categoria.nombre} ({platosCat.length} platos)
              </h2>
              <div className="acciones-categoria">
                <button className="boton-agregar-categoria" onClick={abrirModalCrear}>
                  + Agregar a {categoria.nombre}
                </button>
              </div>
            </div>
            
            <div className="lista-platos-admin">
              {platosCat.length === 0 ? (
                <p className="sin-platos">No hay platos en esta categoría</p>
              ) : (
                platosCat.map(plato => (
                  <div 
                    key={plato.id_plato} 
                    className={`tarjeta-plato-admin ${plato.disponible ? 'disponible' : 'no-disponible'}`}
                  >
                    <div className="imagen-plato-admin"></div>
                    <div className="info-plato-admin">
                      <h3 className="nombre-plato-admin">{plato.nombre}</h3>
                      <p className="descripcion-plato-admin">{plato.descripcion}</p>
                      <div className="detalles-plato">
                        <span className="precio-plato-admin">${plato.precio.toFixed(2)}</span>
                        <span className={`estado-plato ${plato.disponible ? 'disponible' : 'no-disponible'}`}>
                          {plato.disponible ? 'Disponible' : 'No disponible'}
                        </span>
                      </div>
                    </div>
                    <div className="estado-plato-admin">
                      <span className={`indicador-${plato.disponible ? 'disponible' : 'no-disponible'}`}>
                        {plato.disponible ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>
                    <div className="acciones-plato-admin">
                      <button 
                        className="boton-editar-plato"
                        onClick={() => abrirModalEditar(plato)}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className={`boton-toggle-disponibilidad ${plato.disponible ? 'desactivar' : 'activar'}`}
                        onClick={() => toggleDisponibilidad(plato)}
                      >
                        {plato.disponible ? '❌ Desactivar' : '✅ Activar'}
                      </button>
                      <button 
                        className="boton-eliminar-plato"
                        onClick={() => eliminarPlato(plato.id_plato)}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Modal para crear/editar plato */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingPlato ? 'Editar Plato' : 'Crear Nuevo Plato'}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              editingPlato ? actualizarPlato() : crearPlato();
            }}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={platoForm.nombre}
                  onChange={(e) => setPlatoForm({...platoForm, nombre: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={platoForm.descripcion}
                  onChange={(e) => setPlatoForm({...platoForm, descripcion: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio:</label>
                <input
                  type="number"
                  step="0.01"
                  value={platoForm.precio}
                  onChange={(e) => setPlatoForm({...platoForm, precio: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría:</label>
                <select
                  value={platoForm.id_categoria}
                  onChange={(e) => setPlatoForm({...platoForm, id_categoria: parseInt(e.target.value)})}
                >
                  {categorias.map(categoria => (
                    <option key={categoria.id_categoria} value={categoria.id_categoria}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Estado:</label>
                <select
                  value={platoForm.estado}
                  onChange={(e) => setPlatoForm({...platoForm, estado: e.target.value})}
                >
                  <option value="disponible">Disponible</option>
                  <option value="no_disponible">No disponible</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={cerrarModal}>Cancelar</button>
                <button type="submit">{editingPlato ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear/editar categoría */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingCategoria ? 'Editar Categoría' : 'Crear Nueva Categoría'}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              editingCategoria ? actualizarCategoria() : crearCategoria();
            }}>
              <div className="form-group">
                <label>Nombre de la categoría:</label>
                <input
                  type="text"
                  value={categoriaForm.nombre}
                  onChange={(e) => setCategoriaForm({...categoriaForm, nombre: e.target.value})}
                  required
                  placeholder="Ej: Bebidas, Ensaladas, etc."
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={cerrarCategoryModal}>Cancelar</button>
                <button type="submit">{editingCategoria ? 'Actualizar' : 'Crear'} Categoría</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para gestionar lista de categorías */}
      {showCategoryListModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-categorias">
            <h2>Gestionar Categorías</h2>
            <div className="header-modal-categorias">
              <button 
                className="boton-nueva-categoria"
                onClick={abrirModalCrearCategoria}
              >
                + Nueva Categoría
              </button>
            </div>
            
            <div className="lista-categorias-modal">
              {categorias.length === 0 ? (
                <p className="sin-categorias">No hay categorías disponibles</p>
              ) : (
                categorias.map(categoria => {
                  const platosEnCategoria = platos.filter(p => p.id_categoria === categoria.id_categoria).length;
                  return (
                    <div key={categoria.id_categoria} className="item-categoria-modal">
                      <div className="info-categoria-modal">
                        <h3>{categoria.nombre}</h3>
                        <span className="contador-platos">{platosEnCategoria} platos</span>
                      </div>
                      <div className="acciones-categoria-modal">
                        <button 
                          className="boton-editar-categoria"
                          onClick={() => abrirModalEditarCategoria(categoria)}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          className="boton-eliminar-categoria"
                          onClick={() => eliminarCategoria(categoria.id_categoria)}
                          disabled={platosEnCategoria > 0}
                          title={platosEnCategoria > 0 ? "No se puede eliminar una categoría con platos" : "Eliminar categoría"}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={cerrarCategoryListModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}