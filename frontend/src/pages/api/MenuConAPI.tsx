import { useState, useEffect } from "react";
import Navbar from "../../components/user/Navbar";
import MenuCard from "../../components/user/MenuCard";
import PiePagina from "../../components/user/PiePagina";
import { apiService } from "../../services/ApiService";
import "../../css/user/Menu.css";

export default function MenuConAPI() {
  // Estados para los datos de la API
  const [platos, setPlatos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar platos y categorías desde tu API REST
        const [platosData, categoriasData] = await Promise.all([
          apiService.getPlatos(),
          apiService.getCategorias()
        ]);

        console.log('Platos desde API:', platosData);
        console.log('Categorías desde API:', categoriasData);

        setPlatos(platosData);
        setCategorias(categoriasData);
        
      } catch (err) {
        console.error('Error cargando datos del menú:', err);
        setError('Error cargando el menú. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Función para agrupar platos por categoría
  const agruparPlatosPorCategoria = () => {
    const grupos: any = {};
    
    categorias.forEach((categoria: any) => {
      grupos[categoria.id_categoria] = {
        ...categoria,
        platos: platos.filter((plato: any) => plato.id_categoria === categoria.id_categoria)
      };
    });
    
    return grupos;
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Cargando menú...</h2>
          <p>Obteniendo datos desde la API REST</p>
        </div>
        <PiePagina />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Error al cargar el menú</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
        <PiePagina />
      </div>
    );
  }

  const platosPorCategoria = agruparPlatosPorCategoria();

  return (
    <div>
      <Navbar />
      
      {/* Banner del menú */}
      <section className="banner-menu">
        <div className="contenedor-banner-menu">
          <h1 className="titulo-menu">Nuestro Menú - Datos en Tiempo Real</h1>
          <p className="subtitulo-menu">Conectado directamente con nuestra API REST</p>
          <p className="nota-menu">Mostrando {platos.length} platos en {categorias.length} categorías</p>
        </div>
      </section>

      <div className="contenedor-menu">
        {/* Renderizar categorías dinámicamente */}
        {Object.values(platosPorCategoria).map((categoria: any) => (
          <section key={categoria.id_categoria} className="seccion-categoria">
            <div className="cabecera-categoria">
              <h2 className="titulo-categoria">{categoria.nombre}</h2>
              <p className="descripcion-categoria">{categoria.descripcion}</p>
            </div>
            
            {categoria.platos.length > 0 ? (
              <div className="grilla-menu">
                {categoria.platos.map((plato: any) => (
                  <MenuCard 
                    key={plato.id_plato}
                    nombre={plato.nombre}
                    descripcion={plato.descripcion} 
                    precio={`$${plato.precio}`}
                  />
                ))}
              </div>
            ) : (
              <p style={{'color': '#666', 'textAlign': 'center', 'padding': '2rem'}}>
                No hay platos disponibles en esta categoría
              </p>
            )}
          </section>
        ))}
        
        {/* Si no hay datos */}
        {categorias.length === 0 && (
          <section className="seccion-sin-datos">
            <div style={{'textAlign': 'center', 'padding': '3rem'}}>
              <h2>No hay categorías disponibles</h2>
              <p>Asegúrate de que tu API REST esté funcionando y tenga datos.</p>
            </div>
          </section>
        )}
      </div>

      <PiePagina />
    </div>
  );
}