import { useState, useEffect } from "react";
import Navbar from "../../components/user/Navbar";
import PiePagina from "../../components/user/PiePagina";
import "../../css/user/Home.css";
import { Link } from "react-router-dom";

// Interfaces para tipado
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

      // Obtener datos en paralelo
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

      // Calcular estadísticas de mesas
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
        restaurante: restaurantes[0] || null, // Tomar el primer restaurante
        mesas,
        platos: platos.filter((p: Plato) => p.disponible), // Solo platos disponibles
        reservas: reservas.filter((r: Reserva) => r.estado === 'confirmada') // Solo reservas confirmadas
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const obtenerHorariosLibresHoy = () => {
    const hoy = new Date().toISOString().split('T')[0];
    const reservasHoy = data.reservas.filter(r => r.fecha === hoy);
    
    const horariosCompletos = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
    const horariosOcupados = reservasHoy.map(r => r.hora_inicio);
    
    return horariosCompletos.filter(h => !horariosOcupados.includes(h));
  };

  const obtenerPlatosPopulares = () => {
    return data.platos
      .filter(p => p.destacado || p.nombre.toLowerCase().includes('bbq') || p.nombre.toLowerCase().includes('hamburguesa'))
      .slice(0, 3);
  };

  const calcularTiempoEspera = () => {
    const mesasOcupadas = estadisticasMesas.ocupadas;
    const tiempoBase = 15;
    return Math.max(tiempoBase, tiempoBase + (mesasOcupadas * 5));
  };

  const estaAbierto = () => {
    const ahora = new Date();
    const hora = ahora.getHours();
    return hora >= 11 && hora < 22; // Abierto de 11 AM a 10 PM
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-home">
          <div className="spinner"></div>
          <p>Cargando información del restaurante...</p>
        </div>
        <PiePagina />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="error-home">
          <h2>Error al cargar datos</h2>
          <p>{error}</p>
          <button onClick={fetchHomeData} className="boton-reintentar">
            Reintentar
          </button>
        </div>
        <PiePagina />
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      {/* Banner principal del restaurante */}
      <section className="banner-menu">
        <div className="contenedor-banner-menu">
          <h1 className="titulo-menu">
            {data.restaurante?.nombre || "Chuwue Grill"}
          </h1>
          <p className="subtitulo-menu">
            Las mejores alitas y parrilladas de la ciudad
          </p>

          <p className="nota-menu">Ven a disfrutar de sabor auténtico • Atención desde 11 AM a 10 PM</p>
        </div>
      </section>

      {/* Información importante del día */}
      <section className="seccion-informacion-importante">
        <div className="contenedor-informacion">
          <h2 className="titulo-informacion">Información en Tiempo Real</h2>
          
          <div className="grilla-informacion">
            {/* Estado actual */}
            <div className={`tarjeta-info ${estaAbierto() ? 'abierto' : 'cerrado'}`}>
              <span className="material-symbols-outlined icono-tarjeta">
                {estaAbierto() ? 'storefront' : 'door_front'}
              </span>
              <h3 className="titulo-tarjeta">
                {estaAbierto() ? 'Estamos Abiertos' : 'Cerrado'}
              </h3>
              <p>Hoy: 11:00 AM - 10:00 PM</p>
              <p className="detalle-info">
                {estadisticasMesas.disponibles > 0 
                  ? `${estadisticasMesas.disponibles} mesas libres` 
                  : 'Sin mesas libres'}
              </p>
            </div>

            {/* Promoción del día */}
            <div className="tarjeta-info">
              <span className="material-symbols-outlined icono-tarjeta">sell</span>
              <h3 className="titulo-tarjeta">Promoción del Día</h3>
              <p className="detalle-info">
                {data.platos.some(p => p.nombre.toLowerCase().includes('bbq')) 
                  ? '2x1 en Alitas BBQ' 
                  : 'Descuentos especiales'}
              </p>
              <p>Válido hasta las 6:00 PM</p>
            </div>

            {/* Tiempo de espera actual */}
            <div className="tarjeta-info">
              <span className="material-symbols-outlined icono-tarjeta">timer</span>
              <h3 className="titulo-tarjeta">Tiempo de Espera</h3>
              <p className="detalle-info">Aprox. {calcularTiempoEspera()} min</p>
              <p>Para mesa de 2-4 personas</p>
            </div>

            {/* Reservas para hoy */}
            <div className="tarjeta-info">
              <span className="material-symbols-outlined icono-tarjeta">event_available</span>
              <h3 className="titulo-tarjeta">Reservas para Hoy</h3>
              <p className="detalle-info">
                {obtenerHorariosLibresHoy().length > 0 
                  ? 'Horarios disponibles' 
                  : 'Sin horarios libres'}
              </p>
              <p>{obtenerHorariosLibresHoy().slice(0, 3).join(', ')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Acceso rápido a servicios */}
      <section className="seccion-acceso-rapido">
        <div className="contenedor-acceso">
          <h2 className="titulo-acceso">¿Qué deseas hacer?</h2>
          <div className="grilla-servicios">
            
            <Link to="/menu" className="tarjeta-servicio">
              <span className="material-symbols-outlined icono-servicio">restaurant_menu</span>
              <h3 className="titulo-servicio">Ver Menú</h3>
              <p className="descripcion-servicio">Explora nuestros deliciosos platos organizados por categorías.</p>
            </Link>

            <Link to="/reservas" className="tarjeta-servicio">
              <span className="material-symbols-outlined icono-servicio">book_online</span>
              <h3 className="titulo-servicio">Hacer una Reserva</h3>
              <p className="descripcion-servicio">Asegura tu mesa con anticipación para una experiencia sin esperas.</p>
            </Link>

            <Link to="/filavirtual" className="tarjeta-servicio">
              <span className="material-symbols-outlined icono-servicio">groups</span>
              <h3 className="titulo-servicio">Unirse a la Fila Virtual</h3>
              <p className="descripcion-servicio">Consulta la disponibilidad y únete a la cola de espera desde donde estés.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Platos más populares */}
      <section className="seccion-platos-populares">
        <div className="contenedor-populares">
          <h2 className="titulo-populares">Los Más Pedidos</h2>
          <div className="grilla-populares">
            {obtenerPlatosPopulares().length > 0 ? (
              obtenerPlatosPopulares().map((plato) => (
                <div key={plato.id_plato} className="tarjeta-plato-popular">
                  <div className="imagen-plato" style={{ backgroundImage: `url(${plato.imagen || '/src/assets/placeholder-plato.jpg'})` }}></div>
                  <div className="contenido-plato">
                    <h3 className="nombre-plato-popular">{plato.nombre}</h3>
                    <p className="descripcion-popular">{plato.descripcion}</p>
                    <span className="precio-popular">${plato.precio.toFixed(2)}</span>
                  </div>
                  {plato.destacado && <span className="badge-destacado">
                    <span className="material-symbols-outlined">star</span> Destacado
                  </span>}
                </div>
              ))
            ) : (
              // Fallback si no hay platos populares
              <p>No se encontraron platos populares en este momento.</p>
            )}
          </div>
        </div>
      </section>

      {/* Alertas e información adicional */}
      <section className="seccion-alertas">
        <div className="contenedor-alertas">
          {/* Alerta de ocupación */}
          {estadisticasMesas.disponibles === 0 && (
            <div className="alerta importante">
              <span className="material-symbols-outlined icono-alerta">error</span>
              <div className="contenido-alerta">
                <h3 className="titulo-alerta">¡Restaurante Lleno!</h3>
                <p className="mensaje-alerta">
                  Todas nuestras mesas están ocupadas. Te recomendamos unirte a nuestra fila virtual.
                </p>
              </div>
            </div>
          )}
          
          {/* Alerta de pocas mesas */}
          {estadisticasMesas.disponibles > 0 && estadisticasMesas.disponibles <= 3 && (
            <div className="alerta importante">
              <span className="material-symbols-outlined icono-alerta">warning</span>
              <div className="contenido-alerta">
                <h3 className="titulo-alerta">¡Pocas Mesas Disponibles!</h3>
                <p className="mensaje-alerta">
                  Solo quedan {estadisticasMesas.disponibles} mesa(s). ¡Reserva pronto!
                </p>
              </div>
            </div>
          )}
          
          {/* Información sobre fila virtual */}
          <div className="alerta informativa">
            <span className="material-symbols-outlined icono-alerta">info</span>
            <div className="contenido-alerta">
              <h3 className="titulo-alerta">Nuevo Servicio: Fila Virtual</h3>
              <p className="mensaje-alerta">
                Evita las esperas. Únete a nuestra fila virtual y te notificaremos cuando tu mesa esté lista.
              </p>
            </div>
          </div>
          
          {/* Información de contacto del restaurante */}
          {data.restaurante && (
            <div className="alerta informativa">
              <span className="material-symbols-outlined icono-alerta">location_on</span>
              <div className="contenido-alerta">
                <h3 className="titulo-alerta">Encuéntranos</h3>
                <p className="mensaje-alerta">
                  {data.restaurante.direccion} | Llámanos al {data.restaurante.telefono}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <PiePagina />
    </div>
  );
}
