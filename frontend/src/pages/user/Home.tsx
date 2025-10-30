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
      <section className="banner-principal">
        <div className="banner-contenido">
          <h1 className="titulo-restaurante">
            {data.restaurante?.nombre || "Chuwue Grill"}
          </h1>
          <p className="descripcion-restaurante">Las mejores alitas y parrilladas de la ciudad</p>
          <p className="eslogan-restaurante">¡Sabor auténtico que te enamorará!</p>
          
          {/* Estadísticas rápidas */}
          <div className="stats-banner">
            <div className="stat-item">
              <span className="stat-number">{data.platos.length}</span>
              <span className="stat-label">Platos Disponibles</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{estadisticasMesas.disponibles}</span>
              <span className="stat-label">Mesas Libres</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{calcularTiempoEspera()}</span>
              <span className="stat-label">Min. Espera</span>
            </div>
          </div>
        </div>
      </section>

      {/* Información importante del día */}
      <section className="seccion-informacion-importante">
        <div className="contenedor-informacion">
          <h2 className="titulo-informacion">Información en Tiempo Real</h2>
          
          <div className="grilla-informacion">
            {/* Estado actual */}
            <div className={`tarjeta-info estado-restaurante ${estaAbierto() ? 'abierto' : 'cerrado'}`}>
              <div className={`icono-estado ${estaAbierto() ? 'abierto' : 'cerrado'}`}></div>
              <h3 className="titulo-tarjeta">
                {estaAbierto() ? 'Estamos Abiertos' : 'Cerrado'}
              </h3>
              <p className="detalle-info">Hoy: 11:00 AM - 10:00 PM</p>
              <p className="disponibilidad">
                {estadisticasMesas.disponibles > 0 
                  ? `${estadisticasMesas.disponibles} mesas disponibles` 
                  : 'Sin mesas disponibles'}
              </p>
            </div>

            {/* Promoción del día */}
            <div className="tarjeta-info promocion-dia">
              <div className="icono-promocion"></div>
              <h3 className="titulo-tarjeta">Promoción del Día</h3>
              <p className="detalle-info">
                {data.platos.some(p => p.nombre.toLowerCase().includes('bbq')) 
                  ? '2x1 en Alitas BBQ' 
                  : 'Descuentos especiales'}
              </p>
              <p className="condicion-promo">Válido hasta las 6:00 PM</p>
            </div>

            {/* Tiempo de espera actual */}
            <div className="tarjeta-info tiempo-espera">
              <div className="icono-tiempo"></div>
              <h3 className="titulo-tarjeta">Tiempo de Espera</h3>
              <p className="detalle-info">Aprox. {calcularTiempoEspera()} minutos</p>
              <p className="nota-tiempo">Para mesa de 2-4 personas</p>
            </div>

            {/* Reservas para hoy */}
            <div className="tarjeta-info reservas-hoy">
              <div className="icono-reservas"></div>
              <h3 className="titulo-tarjeta">Reservas Disponibles</h3>
              <p className="detalle-info">
                {obtenerHorariosLibresHoy().length > 0 
                  ? 'Horarios libres hoy' 
                  : 'Sin horarios disponibles'}
              </p>
              <p className="horarios-libres">
                {obtenerHorariosLibresHoy().slice(0, 3).join(', ')}
              </p>
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
              <div className="icono-servicio menu"></div>
              <h3 className="titulo-servicio">Ver Menú</h3>
              <p className="descripcion-servicio">Explora nuestros deliciosos platos organizados por categorías</p>
            </Link>

            <Link to="/reservas" className="tarjeta-servicio">
              <div className="icono-servicio reservas"></div>
              <h3 className="titulo-servicio">Hacer Reserva</h3>
              <p className="descripcion-servicio">Reserva tu mesa con anticipación para fechas especiales</p>
            </Link>

            <Link to="/filavirtual" className="tarjeta-servicio">
              <div className="icono-servicio fila"></div>
              <h3 className="titulo-servicio">Fila Virtual</h3>
              <p className="descripcion-servicio">Consulta disponibilidad de mesas y únete a la cola de espera</p>
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
                  <div className={`imagen-plato ${plato.nombre.toLowerCase().replace(/\s+/g, '-')}`}></div>
                  <h3 className="nombre-plato-popular">{plato.nombre}</h3>
                  <p className="descripcion-popular">{plato.descripcion}</p>
                  <span className="precio-popular">${plato.precio.toFixed(2)}</span>
                  {plato.destacado && <span className="badge-destacado">★ Destacado</span>}
                </div>
              ))
            ) : (
              // Fallback si no hay platos populares
              <>
                <div className="tarjeta-plato-popular">
                  <div className="imagen-plato alitas-bbq"></div>
                  <h3 className="nombre-plato-popular">Especialidad del Chef</h3>
                  <p className="descripcion-popular">Nuestros platos más solicitados</p>
                  <span className="precio-popular">Variados</span>
                </div>
                <div className="tarjeta-plato-popular">
                  <div className="imagen-plato hamburguesa"></div>
                  <h3 className="nombre-plato-popular">Platos Principales</h3>
                  <p className="descripcion-popular">Las mejores opciones para disfrutar</p>
                  <span className="precio-popular">Desde $8.99</span>
                </div>
                <div className="tarjeta-plato-popular">
                  <div className="imagen-plato parrillada"></div>
                  <h3 className="nombre-plato-popular">Para Compartir</h3>
                  <p className="descripcion-popular">Perfectos para grupos y familias</p>
                  <span className="precio-popular">Desde $20.00</span>
                </div>
              </>
            )}
          </div>
          
          {/* Resumen estadístico */}
          <div className="resumen-menu">
            <div className="stat-menu">
              <span className="numero-stat">{data.platos.length}</span>
              <span className="label-stat">Platos Disponibles</span>
            </div>
            <div className="stat-menu">
              <span className="numero-stat">{new Set(data.platos.map(p => p.categoria_id)).size}</span>
              <span className="label-stat">Categorías</span>
            </div>
            <div className="stat-menu">
              <span className="numero-stat">
                ${Math.min(...data.platos.map(p => p.precio)).toFixed(0)}
              </span>
              <span className="label-stat">Desde</span>
            </div>
          </div>
        </div>
      </section>

      {/* Alertas e información adicional */}
      <section className="seccion-alertas">
        <div className="contenedor-alertas">
          {/* Alerta de ocupación */}
          {estadisticasMesas.disponibles === 0 && (
            <div className="alerta importante">
              <div className="icono-alerta"></div>
              <div className="contenido-alerta">
                <h3 className="titulo-alerta">¡Restaurante Lleno!</h3>
                <p className="mensaje-alerta">
                  Todas nuestras mesas están ocupadas. Te recomendamos hacer una reserva 
                  o unirte a nuestra fila virtual para ser notificado cuando haya una mesa disponible.
                </p>
              </div>
            </div>
          )}
          
          {/* Alerta de pocas mesas */}
          {estadisticasMesas.disponibles > 0 && estadisticasMesas.disponibles <= 2 && (
            <div className="alerta importante">
              <div className="icono-alerta"></div>
              <div className="contenido-alerta">
                <h3 className="titulo-alerta">¡Pocas Mesas Disponibles!</h3>
                <p className="mensaje-alerta">
                  Solo quedan {estadisticasMesas.disponibles} mesa(s) disponible(s). 
                  Te recomendamos hacer tu reserva pronto o unirte a la fila virtual.
                </p>
              </div>
            </div>
          )}
          
          {/* Información sobre fila virtual */}
          <div className="alerta informativa">
            <div className="icono-alerta"></div>
            <div className="contenido-alerta">
              <h3 className="titulo-alerta">Nuevo servicio</h3>
              <p className="mensaje-alerta">
                Ahora puedes unirte a nuestra fila virtual y recibir notificaciones 
                cuando tu mesa esté lista. ¡Evita las esperas!
              </p>
            </div>
          </div>
          
          {/* Información de contacto del restaurante */}
          {data.restaurante && (
            <div className="alerta informativa">
              <div className="icono-alerta"></div>
              <div className="contenido-alerta">
                <h3 className="titulo-alerta">Información de Contacto</h3>
                <p className="mensaje-alerta">
                  📍 {data.restaurante.direccion} | 📞 {data.restaurante.telefono}
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
