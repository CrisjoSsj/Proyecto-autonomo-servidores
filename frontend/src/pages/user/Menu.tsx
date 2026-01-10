import { useState, useEffect } from "react";
import Navbar from "../../components/user/Navbar";
import MenuCard from "../../components/user/MenuCard";
import PiePagina from "../../components/user/PiePagina";
import "../../css/user/Menu.css";

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

interface PlatoFormateado {
  nombre: string;
  descripcion: string;
  precio: string;
}

export default function Menu() {
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<string>('');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!loading && categorias.length > 0) {
      const primerCategoria = generarIdSeccion(categorias[0].nombre);
      setCategoriaActiva(primerCategoria);
      configurarIntersectionObserver();
    }
  }, [loading, categorias]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [platosRes, categoriasRes] = await Promise.all([
        fetch(`${API_BASE_URL}/platos/`),
        fetch(`${API_BASE_URL}/categorias/`)
      ]);

      if (!platosRes.ok || !categoriasRes.ok) {
        throw new Error('Error al cargar datos del menú');
      }

      const platosData = await platosRes.json();
      const categoriasData = await categoriasRes.json();

      const platosDisponibles = platosData.filter((plato: Plato) => 
        plato.disponible && plato.estado === 'disponible'
      );
      
      setPlatos(platosDisponibles);
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Error cargando menú:', error);
      setError('Error al cargar el menú. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const configurarIntersectionObserver = () => {
    const secciones = document.querySelectorAll('.menu-category-section');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (id) setCategoriaActiva(id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
      }
    );

    secciones.forEach((seccion) => observer.observe(seccion));

    return () => {
      secciones.forEach((seccion) => observer.unobserve(seccion));
    };
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const convertirPlatosParaMenuCard = (platosCategoria: Plato[]): PlatoFormateado[] => {
    return platosCategoria.map(plato => ({
      nombre: plato.nombre,
      descripcion: plato.descripcion,
      precio: `$${plato.precio.toFixed(2)}`
    }));
  };

  const obtenerPlatosPorCategoria = (idCategoria: number): PlatoFormateado[] => {
    const platosCategoria = platos.filter(plato => plato.id_categoria === idCategoria);
    return convertirPlatosParaMenuCard(platosCategoria);
  };

  const generarIdSeccion = (nombreCategoria: string): string => {
    return nombreCategoria.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9-]/g, '');
  };

  const obtenerIconoCategoria = (nombreCategoria: string): string => {
    const iconos: { [key: string]: string } = {
      'entradas': 'tapas',
      'platos principales': 'restaurant',
      'postres': 'cake',
      'bebidas': 'local_bar',
      'ensaladas': 'eco',
      'sopas': 'soup_kitchen',
      'mariscos': 'set_meal',
      'carnes': 'lunch_dining',
      'pastas': 'ramen_dining',
      'pizzas': 'local_pizza'
    };
    return iconos[nombreCategoria.toLowerCase()] || 'restaurant';
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <main className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Cargando nuestro menú...</p>
        </main>
        <PiePagina />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <main className="error-container">
          <span className="material-symbols-outlined error-icon">error</span>
          <h2 className="error-title">Error al cargar el menú</h2>
          <p className="error-message">{error}</p>
          <button onClick={cargarDatos} className="btn-retry">
            Reintentar
          </button>
        </main>
        <PiePagina />
      </div>
    );
  }

  const categoriasConPlatos = categorias.filter(categoria => 
    platos.some(plato => plato.id_categoria === categoria.id_categoria)
  );

  return (
    <div className="page-wrapper">
      <Navbar />
      
      {/* Hero del Menú */}
      <section className="menu-hero">
        <div className="menu-hero-overlay"></div>
        <div className="menu-hero-content">
          <p className="menu-hero-tagline">Nuestra Carta</p>
          <h1 className="menu-hero-title">El Menú</h1>
          <div className="menu-hero-stats">
            <div className="menu-stat">
              <span className="menu-stat-number">{platos.length}</span>
              <span className="menu-stat-label">Platos</span>
            </div>
            <div className="menu-stat-divider"></div>
            <div className="menu-stat">
              <span className="menu-stat-number">{categoriasConPlatos.length}</span>
              <span className="menu-stat-label">Categorías</span>
            </div>
            <div className="menu-stat-divider"></div>
            <div className="menu-stat">
              <span className="menu-stat-number">100%</span>
              <span className="menu-stat-label">Fresco</span>
            </div>
          </div>
        </div>
      </section>

      {/* Navegación de Categorías */}
      {categoriasConPlatos.length > 0 && (
        <nav className="menu-nav">
          <div className="menu-nav-container">
            {categoriasConPlatos.map(categoria => {
              const idSeccion = generarIdSeccion(categoria.nombre);
              const cantidadPlatos = platos.filter(p => p.id_categoria === categoria.id_categoria).length;
              
              return (
                <button
                  key={categoria.id_categoria}
                  onClick={() => scrollToSection(idSeccion)}
                  className={`menu-nav-item ${categoriaActiva === idSeccion ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined menu-nav-icon">
                    {obtenerIconoCategoria(categoria.nombre)}
                  </span>
                  <span className="menu-nav-text">{categoria.nombre}</span>
                  <span className="menu-nav-count">{cantidadPlatos}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Contenido del Menú */}
      <main className="menu-content">
        <div className="menu-container">
          {categoriasConPlatos.length === 0 ? (
            <div className="menu-empty">
              <span className="material-symbols-outlined">restaurant_menu</span>
              <h2>Menú en actualización</h2>
              <p>Estamos preparando nuevos platos. Vuelve pronto.</p>
            </div>
          ) : (
            categoriasConPlatos.map((categoria) => {
              const idSeccion = generarIdSeccion(categoria.nombre);
              const platosCategoria = obtenerPlatosPorCategoria(categoria.id_categoria);
              const icono = obtenerIconoCategoria(categoria.nombre);

              return (
                <section 
                  key={categoria.id_categoria}
                  id={idSeccion} 
                  className="menu-category-section"
                >
                  <header className="menu-category-header">
                    <div className="menu-category-icon">
                      <span className="material-symbols-outlined">{icono}</span>
                    </div>
                    <div className="menu-category-info">
                      <h2 className="menu-category-title">{categoria.nombre}</h2>
                      <p className="menu-category-count">{platosCategoria.length} opciones disponibles</p>
                    </div>
                  </header>
                  
                  <div className="menu-items-grid">
                    {platosCategoria.map((plato, platoIndex) => (
                      <MenuCard key={platoIndex} {...plato} />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>

      {/* CTA Section */}
      {categoriasConPlatos.length > 0 && (
        <section className="menu-cta">
          <div className="menu-cta-content">
            <h2 className="menu-cta-title">¿Listo para ordenar?</h2>
            <p className="menu-cta-text">Reserva tu mesa y disfruta de nuestros platos</p>
            <a href="/reservas" className="btn-primary">
              Reservar Mesa
            </a>
          </div>
        </section>
      )}

      <PiePagina />
    </div>
  );
}
