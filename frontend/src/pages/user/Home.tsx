import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/user/Navbar";
import PiePagina from "../../components/user/PiePagina";
import "../../css/user/Home.css";

// Interfaces
interface Restaurante {
  id_restaurante: number;
  nombre: string;
  direccion: string;
  telefono: string;
}

interface Mesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
}

interface Plato {
  id_plato: number;
  nombre: string;
  descripcion: string;
  precio: number;
  disponible: boolean;
  categoria_id: number;
  imagen?: string;
  destacado?: boolean;
}

interface Reserva {
  id_reserva: number;
  id_cliente: number;
  id_mesa: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
}

interface HomeData {
  restaurante: Restaurante | null;
  mesas: Mesa[];
  platos: Plato[];
  reservas: Reserva[];
}

interface EstadisticasMesas {
  disponibles: number;
  ocupadas: number;
  reservadas: number;
  total: number;
}

export default function Home() {
  const [data, setData] = useState<HomeData>({
    restaurante: null,
    mesas: [],
    platos: [],
    reservas: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadisticasMesas, setEstadisticasMesas] = useState<EstadisticasMesas>({
    disponibles: 0,
    ocupadas: 0,
    reservadas: 0,
    total: 0
  });

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [restaurantesRes, mesasRes, platosRes, reservasRes] = await Promise.all([
        fetch('http://localhost:8000/restaurantes'),
        fetch('http://localhost:8000/mesas/'),
        fetch('http://localhost:8000/platos/'),
        fetch('http://localhost:8000/reservas/')
      ]);

      if (!restaurantesRes.ok || !mesasRes.ok || !platosRes.ok || !reservasRes.ok) {
        throw new Error('Error al cargar datos del servidor');
      }

      const [restaurantes, mesas, platos, reservas] = await Promise.all([
        restaurantesRes.json(),
        mesasRes.json(),
        platosRes.json(),
        reservasRes.json()
      ]);

      const estadisticas = mesas.reduce((acc: EstadisticasMesas, mesa: Mesa) => {
        acc.total++;
        switch (mesa.estado.toLowerCase()) {
          case 'disponible':
            acc.disponibles++;
            break;
          case 'ocupada':
            acc.ocupadas++;
            break;
          case 'reservada':
            acc.reservadas++;
            break;
        }
        return acc;
      }, { disponibles: 0, ocupadas: 0, reservadas: 0, total: 0 });

      setEstadisticasMesas(estadisticas);
      setData({
        restaurante: restaurantes[0] || null,
        mesas,
        platos: platos.filter((p: Plato) => p.disponible),
        reservas: reservas.filter((r: Reserva) => r.estado === 'confirmada')
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const obtenerPlatosPopulares = () => {
    return data.platos
      .filter(p => p.destacado || p.nombre.toLowerCase().includes('bbq') || p.nombre.toLowerCase().includes('hamburguesa'))
      .slice(0, 3);
  };

  const estaAbierto = () => {
    const ahora = new Date();
    const hora = ahora.getHours();
    return hora >= 11 && hora < 22;
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <main className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Preparando tu experiencia...</p>
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
          <h2 className="error-title">Error al cargar</h2>
          <p className="error-message">{error}</p>
          <button onClick={fetchHomeData} className="btn-retry">
            Reintentar
          </button>
        </main>
        <PiePagina />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-tagline">Steakhouse Premium</p>
          <h1 className="hero-title">
            <span className="title-line">Chuwue</span>
            <span className="title-accent">Grill</span>
          </h1>
          <p className="hero-subtitle">
            Las mejores alitas y parrilladas de la ciudad
          </p>
          <div className="hero-cta">
            <Link to="/reservas" className="btn-primary">
              Reservar Mesa
            </Link>
            <Link to="/menu" className="btn-secondary">
              Ver Menú
            </Link>
          </div>
        </div>
        <div className="hero-scroll-indicator">
          <span className="material-symbols-outlined">keyboard_arrow_down</span>
        </div>
      </section>

      {/* Estadísticas Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <span className={`stat-status ${estaAbierto() ? 'open' : 'closed'}`}>
              {estaAbierto() ? 'Abierto Ahora' : 'Cerrado'}
            </span>
            <span className="stat-detail">11:00 AM - 10:00 PM</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-number">{estadisticasMesas.disponibles}</span>
            <span className="stat-label">Mesas Disponibles</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-number">{data.platos.length}+</span>
            <span className="stat-label">Platos en el Menú</span>
          </div>
          <div className="stat-divider hide-mobile"></div>
          <div className="stat-card hide-mobile">
            <span className="stat-number">100%</span>
            <span className="stat-label">Ingredientes Frescos</span>
          </div>
        </div>
      </section>

      {/* Servicios Section */}
      <section className="services-section">
        <div className="section-container">
          <div className="section-header">
            <p className="section-tagline">Nuestros Servicios</p>
            <h2 className="section-title">¿Qué deseas hacer?</h2>
            <div className="section-divider"></div>
          </div>

          <div className="services-grid">
            <Link to="/menu" className="service-card">
              <div className="service-icon">
                <span className="material-symbols-outlined">restaurant_menu</span>
              </div>
              <h3 className="service-title">Explorar el Menú</h3>
              <p className="service-description">
                Descubre nuestra selección de platos premium, desde entradas hasta postres.
              </p>
              <span className="service-arrow">
                <span className="material-symbols-outlined">arrow_forward</span>
              </span>
            </Link>

            <Link to="/reservas" className="service-card featured">
              <div className="service-badge">Recomendado</div>
              <div className="service-icon">
                <span className="material-symbols-outlined">book_online</span>
              </div>
              <h3 className="service-title">Hacer una Reserva</h3>
              <p className="service-description">
                Asegura tu mesa con anticipación para una experiencia sin esperas.
              </p>
              <span className="service-arrow">
                <span className="material-symbols-outlined">arrow_forward</span>
              </span>
            </Link>

            <Link to="/filavirtual" className="service-card">
              <div className="service-icon">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <h3 className="service-title">Fila Virtual</h3>
              <p className="service-description">
                Únete a la cola desde donde estés y te avisaremos cuando esté lista tu mesa.
              </p>
              <span className="service-arrow">
                <span className="material-symbols-outlined">arrow_forward</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Platos Populares Section */}
      <section className="dishes-section">
        <div className="section-container">
          <div className="section-header">
            <p className="section-tagline">Del Chef</p>
            <h2 className="section-title">Los Más Pedidos</h2>
            <div className="section-divider"></div>
          </div>

          <div className="dishes-grid">
            {obtenerPlatosPopulares().length > 0 ? (
              obtenerPlatosPopulares().map((plato, index) => (
                <div key={plato.id_plato} className="dish-card" style={{ animationDelay: `${index * 100}ms` }}>
                  <div 
                    className="dish-image" 
                    style={{ 
                      backgroundImage: `url(${plato.imagen || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'})` 
                    }}
                  >
                    {plato.destacado && (
                      <span className="dish-badge">
                        <span className="material-symbols-outlined">star</span>
                        Destacado
                      </span>
                    )}
                  </div>
                  <div className="dish-content">
                    <h3 className="dish-name">{plato.nombre}</h3>
                    <p className="dish-description">{plato.descripcion}</p>
                    <div className="dish-footer">
                      <span className="dish-price">${plato.precio.toFixed(2)}</span>
                      <Link to="/menu" className="dish-link">
                        Ver Menú
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-dishes">
                <p>Nuestros platos destacados se actualizan diariamente.</p>
                <Link to="/menu" className="btn-secondary">Ver Menú Completo</Link>
              </div>
            )}
          </div>

          <div className="dishes-cta">
            <Link to="/menu" className="btn-outline">
              Ver Menú Completo
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Promoción / CTA Section */}
      <section className="promo-section">
        <div className="promo-overlay"></div>
        <div className="promo-content">
          <p className="promo-tagline">Promoción del Día</p>
          <h2 className="promo-title">2x1 en Alitas BBQ</h2>
          <p className="promo-description">
            Válido todos los días hasta las 6:00 PM. No te lo pierdas.
          </p>
          <Link to="/reservas" className="btn-primary">
            Reservar Ahora
          </Link>
        </div>
      </section>

      {/* Alertas Section */}
      {(estadisticasMesas.disponibles === 0 || estadisticasMesas.disponibles <= 3) && (
        <section className="alerts-section">
          <div className="section-container">
            {estadisticasMesas.disponibles === 0 && (
              <div className="alert-card urgent">
                <span className="material-symbols-outlined alert-icon">priority_high</span>
                <div className="alert-content">
                  <h3 className="alert-title">Restaurante Lleno</h3>
                  <p className="alert-message">
                    Todas nuestras mesas están ocupadas. Te recomendamos unirte a la fila virtual.
                  </p>
                </div>
                <Link to="/filavirtual" className="alert-action">
                  Unirse a la Fila
                </Link>
              </div>
            )}
            
            {estadisticasMesas.disponibles > 0 && estadisticasMesas.disponibles <= 3 && (
              <div className="alert-card warning">
                <span className="material-symbols-outlined alert-icon">schedule</span>
                <div className="alert-content">
                  <h3 className="alert-title">Pocas Mesas Disponibles</h3>
                  <p className="alert-message">
                    Solo quedan {estadisticasMesas.disponibles} mesa(s). ¡Reserva pronto!
                  </p>
                </div>
                <Link to="/reservas" className="alert-action">
                  Reservar
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Info Section */}
      <section className="info-section">
        <div className="section-container">
          <div className="info-grid">
            <div className="info-card">
              <span className="material-symbols-outlined info-icon">location_on</span>
              <h3 className="info-title">Ubicación</h3>
              <p className="info-text">
                {data.restaurante?.direccion || 'Av. Principal 123, Montevideo'}
              </p>
            </div>
            <div className="info-card">
              <span className="material-symbols-outlined info-icon">phone</span>
              <h3 className="info-title">Reservaciones</h3>
              <p className="info-text">
                {data.restaurante?.telefono || '099-123-4567'}
              </p>
            </div>
            <div className="info-card">
              <span className="material-symbols-outlined info-icon">schedule</span>
              <h3 className="info-title">Horarios</h3>
              <p className="info-text">
                Lun-Sáb: 11AM-10PM<br />
                Dom: 12PM-9PM
              </p>
            </div>
          </div>
        </div>
      </section>

      <PiePagina />
    </div>
  );
}
