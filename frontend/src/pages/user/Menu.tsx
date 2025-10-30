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

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!loading && categorias.length > 0) {
      // Configurar navegación y scroll después de que los datos estén cargados
      configurarNavegacion();
    }
  }, [loading, categorias]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar platos y categorías en paralelo
      const [platosRes, categoriasRes] = await Promise.all([
        fetch(`${API_BASE_URL}/platos/`),
        fetch(`${API_BASE_URL}/categorias/`)
      ]);

      if (!platosRes.ok || !categoriasRes.ok) {
        throw new Error('Error al cargar datos del menú');
      }

      const platosData = await platosRes.json();
      const categoriasData = await categoriasRes.json();

      // Filtrar solo platos disponibles para el menú público
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

  const configurarNavegacion = () => {
    const navegacionCategorias = document.querySelector('.navegacion-categorias');
    const enlaces = document.querySelectorAll('.enlace-categoria');
    const secciones = document.querySelectorAll('.seccion-categoria');
    const navbar = document.querySelector('.navbar');

    // Función para obtener la altura dinámica del navbar
    const getNavbarHeight = () => {
      return navbar ? navbar.getBoundingClientRect().height : 60;
    };

    // Función para manejar el scroll
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const navbarHeight = getNavbarHeight();
      
      // Agregar clase 'scrolled' cuando se hace scroll
      if (scrollTop > 100) {
        navegacionCategorias?.classList.add('scrolled');
      } else {
        navegacionCategorias?.classList.remove('scrolled');
      }

      // Detectar qué sección está visible
      let currentSection = '';
      secciones.forEach((seccion) => {
        const rect = seccion.getBoundingClientRect();
        const offset = navbarHeight + 80;
        
        if (rect.top <= offset && rect.bottom >= offset) {
          currentSection = seccion.getAttribute('id') || '';
        }
      });

      // Actualizar enlaces activos
      enlaces.forEach((enlace) => {
        enlace.classList.remove('activo');
        const href = enlace.getAttribute('href');
        if (href === `#${currentSection}`) {
          enlace.classList.add('activo');
        }
      });
    };

    // Smooth scroll para los enlaces
    enlaces.forEach((enlace) => {
      enlace.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = enlace.getAttribute('href')?.substring(1);
        const targetElement = document.getElementById(targetId || '');
        
        if (targetElement) {
          const navbarHeight = getNavbarHeight();
          const navegacionHeight = navegacionCategorias ? navegacionCategorias.getBoundingClientRect().height : 60;
          const offsetTop = targetElement.offsetTop - navbarHeight - navegacionHeight - 10;
          
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });

    // Agregar event listener para scroll
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Llamar una vez para inicializar

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  };

  // Convertir platos a formato esperado por MenuCard
  const convertirPlatosParaMenuCard = (platosCategoria: Plato[]): PlatoFormateado[] => {
    return platosCategoria.map(plato => ({
      nombre: plato.nombre,
      descripcion: plato.descripcion,
      precio: `$${plato.precio.toFixed(2)}`
    }));
  };

  // Obtener platos por categoría
  const obtenerPlatosPorCategoria = (idCategoria: number): PlatoFormateado[] => {
    const platosCategoria = platos.filter(plato => plato.id_categoria === idCategoria);
    return convertirPlatosParaMenuCard(platosCategoria);
  };

  // Función para generar ID de sección desde nombre de categoría
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

  // Función para obtener emoji por categoría
  const obtenerEmojiCategoria = (nombreCategoria: string): string => {
    const emojis: { [key: string]: string } = {
      'entradas': '🥗',
      'platos principales': '🍖',
      'postres': '🍰',
      'bebidas': '🥤',
      'ensaladas': '🥬',
      'sopas': '🍲',
      'mariscos': '🦐',
      'carnes': '🥩',
      'pastas': '🍝',
      'pizzas': '🍕'
    };
    return emojis[nombreCategoria.toLowerCase()] || '🍽️';
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-menu">
          <div className="spinner"></div>
          <p>Cargando nuestro delicioso menú...</p>
        </div>
        <PiePagina />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="error-menu">
          <h2>😔 Oops! Algo salió mal</h2>
          <p>{error}</p>
          <button onClick={cargarDatos} className="boton-reintentar">
            Intentar de nuevo
          </button>
        </div>
        <PiePagina />
      </div>
    );
  }

  // Filtrar categorías que tienen platos disponibles
  const categoriasConPlatos = categorias.filter(categoria => 
    platos.some(plato => plato.id_categoria === categoria.id_categoria)
  );

  return (
    <div>
      <Navbar />
      
      {/* Banner del menú */}
      <section className="banner-menu">
        <div className="contenedor-banner-menu">
          <h1 className="titulo-menu">Nuestro Menú Completo</h1>
          <p className="subtitulo-menu">
            Descubre todos nuestros sabores organizados por categorías
          </p>
          <div className="stats-menu-banner">
            <div className="stat-item">
              <span className="stat-number">{platos.length}</span>
              <span className="stat-label">Platos Disponibles</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{categoriasConPlatos.length}</span>
              <span className="stat-label">Categorías</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Fresco</span>
            </div>
          </div>
          <p className="nota-menu">Todos los precios incluyen IVA • Aceptamos efectivo y tarjetas</p>
        </div>
      </section>

      {/* Navegación por categorías */}
      {categoriasConPlatos.length > 0 && (
        <section className="navegacion-categorias">
          <div className="contenedor-categorias">
            {categoriasConPlatos.map(categoria => {
              const idSeccion = generarIdSeccion(categoria.nombre);
              const cantidadPlatos = platos.filter(p => p.id_categoria === categoria.id_categoria).length;
              
              return (
                <a 
                  key={categoria.id_categoria}
                  href={`#${idSeccion}`} 
                  className="enlace-categoria"
                >
                  {obtenerEmojiCategoria(categoria.nombre)} {categoria.nombre}
                  <span className="contador-platos">({cantidadPlatos})</span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <div className="contenedor-menu">
        {categoriasConPlatos.length === 0 ? (
          <section className="sin-menu-disponible">
            <h2>😔 Menú temporalmente no disponible</h2>
            <p>Estamos actualizando nuestro menú. Por favor, vuelve pronto.</p>
            <button onClick={() => window.location.href = '/reservas'} className="boton-reservar">
              Hacer una Reserva
            </button>
          </section>
        ) : (
          categoriasConPlatos.map((categoria, index) => {
            const idSeccion = generarIdSeccion(categoria.nombre);
            const platosCategoria = obtenerPlatosPorCategoria(categoria.id_categoria);
            const emoji = obtenerEmojiCategoria(categoria.nombre);
            
            // Destacar la primera categoría o la de "Platos principales"
            const esDestacada = index === 0 || categoria.nombre.toLowerCase().includes('principal');

            return (
              <section 
                key={categoria.id_categoria}
                id={idSeccion} 
                className={`seccion-categoria ${esDestacada ? 'destacada' : ''}`}
              >
                <div className="cabecera-categoria">
                  <h2 className="titulo-categoria">
                    {emoji} {categoria.nombre}
                    {esDestacada && <span className="badge-destacada">⭐ Destacada</span>}
                  </h2>
                  <p className="descripcion-categoria">
                    {categoria.nombre === 'Entradas' && 'Perfectas para comenzar o acompañar tu comida'}
                    {categoria.nombre === 'Platos principales' && 'Nuestras especialidades principales'}
                    {categoria.nombre === 'Postres' && 'El final perfecto para tu comida'}
                    {!['Entradas', 'Platos principales', 'Postres'].includes(categoria.nombre) && 
                     `Deliciosos ${categoria.nombre.toLowerCase()} preparados con ingredientes frescos`}
                  </p>
                  <div className="info-categoria">
                    <span className="contador-platos-categoria">
                      {platosCategoria.length} platos disponibles
                    </span>
                  </div>
                </div>
                <div className="grilla-menu">
                  {platosCategoria.map((plato, platoIndex) => (
                    <MenuCard key={platoIndex} {...plato} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Llamada a la acción */}
      {categoriasConPlatos.length > 0 && (
        <section className="cta-menu">
          <div className="contenedor-cta">
            <h2>¿Listo para ordenar?</h2>
            <p>Reserva tu mesa y disfruta de nuestros deliciosos platos</p>
            <button 
              className="boton-reservar-cta" 
              onClick={() => window.location.href = '/reservas'}
            >
              Hacer Reserva Ahora
            </button>
          </div>
        </section>
      )}

      <PiePagina />
    </div>
  );
}
