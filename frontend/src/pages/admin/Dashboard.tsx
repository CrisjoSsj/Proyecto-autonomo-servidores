import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "../../components/admin/NavbarAdmin";
import { fetchDashboardData, DashboardData } from "../../services/GraphQLService";
import { wsService } from "../../services/WebSocketService";
import { apiService } from "../../services/ApiService";
import type { 
  EstadisticasMesas, 
  EstadisticasReservas, 
  EstadisticasFila,
  Alerta,
  WebSocketMessage
} from "../../types";
import "../../css/admin/Dashboard.css";

// Utilidades para localStorage
const ALERTAS_STORAGE_KEY = 'alertas_dashboard';

const guardarAlertasEnStorage = (alertas: Alerta[]) => {
  try {
    localStorage.setItem(ALERTAS_STORAGE_KEY, JSON.stringify(alertas));
  } catch (error) {
    console.error('Error al guardar alertas:', error);
  }
};

const cargarAlertasDelStorage = (): Alerta[] => {
  try {
    const stored = localStorage.getItem(ALERTAS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error al cargar alertas:', error);
    return [];
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  
  // Nuevas estadísticas en tiempo real
  const [estadisticasMesas, setEstadisticasMesas] = useState<EstadisticasMesas | null>(null);
  const [estadisticasReservas, setEstadisticasReservas] = useState<EstadisticasReservas | null>(null);
  const [estadisticasFila, setEstadisticasFila] = useState<EstadisticasFila | null>(null);

  // Cargar alertas del localStorage al montar
  useEffect(() => {
    const alertasGuardadas = cargarAlertasDelStorage();
    setAlertas(alertasGuardadas);
  }, []);

  // Guardar alertas en localStorage cuando cambien
  useEffect(() => {
    guardarAlertasEnStorage(alertas);
  }, [alertas]);

  // Función para cargar estadísticas del backend
  const cargarEstadisticas = useCallback(async () => {
    try {
      const [mesas, reservas, fila] = await Promise.all([
        apiService.getEstadisticasMesas().catch(() => null),
        apiService.getEstadisticasReservas().catch(() => null),
        apiService.getEstadisticasFilaVirtual().catch(() => null)
      ]);
      
      if (mesas) setEstadisticasMesas(mesas);
      if (reservas) setEstadisticasReservas(reservas);
      if (fila) setEstadisticasFila(fila);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await fetchDashboardData();
        setDashboardData(data);
        setError(null);
        
        // Cargar estadísticas del backend Python
        await cargarEstadisticas();
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    
    // Actualizar estadísticas cada 30 segundos
    const intervalo = setInterval(cargarEstadisticas, 30000);

    // Conectar WebSocket para recibir alertas en tiempo real
    wsService.connect();

    // Escuchar nuevas reservas
    const unsubscribeReservas = wsService.subscribe('reservas', (message: WebSocketMessage) => {
      if (message.action === 'nueva_reserva') {
        const data = message.data as Record<string, unknown> | undefined;
        const reserva = data?.reserva as Record<string, unknown> | undefined;
        const alerta: Alerta = {
          id: `alerta-${Date.now()}-${Math.random()}`,
          tipo: 'reserva',
          titulo: `Nueva Reserva`,
          mensaje: `Reserva para ${reserva?.hora_inicio || ''} - ${reserva?.numero_personas || reserva?.numeroPersonas || 0} personas`,
          urgencia: 'informativa',
          timestamp: new Date().toISOString(),
          datos: reserva,
          resuelta: false
        };
        setAlertas(prev => [alerta, ...prev].slice(0, 10));
      }
    });

    // Escuchar nuevas entradas en fila virtual
    const unsubscribeFilaVirtual = wsService.subscribe('fila_virtual', (message: WebSocketMessage) => {
      if (message.action === 'nueva_entrada') {
        const data = message.data as Record<string, unknown> | undefined;
        const persona = data?.persona as Record<string, unknown> | undefined;
        const alerta: Alerta = {
          id: `alerta-${Date.now()}-${Math.random()}`,
          tipo: 'fila',
          titulo: `Nueva Entrada en Fila Virtual`,
          mensaje: `${persona?.nombre || 'Cliente'} - ${persona?.numeroPersonas || 0} personas en fila`,
          urgencia: 'importante',
          timestamp: new Date().toISOString(),
          datos: persona,
          resuelta: false
        };
        setAlertas(prev => [alerta, ...prev].slice(0, 10));
      }
    });

    return () => {
      unsubscribeReservas();
      unsubscribeFilaVirtual();
      clearInterval(intervalo);
    };
  }, [cargarEstadisticas]);

  // Handlers para acciones rápidas
  const handleIrAMesas = useCallback(() => {
    navigate("/admin/mesas");
  }, [navigate]);

  const handleVerReservas = useCallback(() => {
    navigate("/admin/reservas");
  }, [navigate]);

  const handleEditarMenu = useCallback(() => {
    navigate("/admin/menu");
  }, [navigate]);

  const handleVerReportes = useCallback(() => {
    navigate("/admin/reportes");
  }, [navigate]);

  // Handlers para alertas
  const handleResolverAlerta = useCallback((idAlerta: string) => {
    setAlertas(prev => 
      prev.map(alerta => 
        alerta.id === idAlerta ? { ...alerta, resuelta: true } : alerta
      )
    );
  }, []);

  if (loading) {
    return (
      <div className="dashboard-admin">
        <NavbarAdmin />
        <div className="loading-dashboard">Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-admin">
        <NavbarAdmin />
        <div className="error-dashboard">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-admin">
      <NavbarAdmin />
      
      {/* Header del dashboard */}
      <section className="header-dashboard">
        <div className="contenedor-header">
          <h1 className="titulo-dashboard">Panel de Administración</h1>
          <p className="subtitulo-dashboard">Gestiona tu restaurante Chuwue Grill</p>
          <div className="fecha-actual">
            <span className="fecha">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <span className="hora-actual">
              {new Date().toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      </section>

      {/* Estadísticas principales - Datos en tiempo real */}
      <section className="seccion-estadisticas">
        <div className="contenedor-estadisticas">
          <h2 className="titulo-seccion-admin">Estado Actual del Restaurante</h2>
          <div className="grilla-estadisticas">
            
            {/* Mesas */}
            <div className="tarjeta-estadistica ventas">
              <div className="icono-estadistica ventas-icon">
                <span className="material-symbols-outlined" style={{fontSize: '1.5rem', color: 'white'}}>table_restaurant</span>
              </div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">Mesas Disponibles</h3>
                <p className="valor-estadistica">
                  {estadisticasMesas?.disponibles || 0} / {estadisticasMesas?.total || 0}
                </p>
                <span className={`comparacion ${estadisticasMesas?.disponibles === 0 ? 'negativa' : 'positiva'}`}>
                  {estadisticasMesas?.ocupadas || 0} ocupadas • {estadisticasMesas?.reservadas || 0} reservadas
                </span>
              </div>
            </div>

            {/* Reservas del día */}
            <div className="tarjeta-estadistica ordenes">
              <div className="icono-estadistica ordenes-icon">
                <span className="material-symbols-outlined" style={{fontSize: '1.5rem', color: 'white'}}>event_note</span>
              </div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">Reservas Hoy</h3>
                <p className="valor-estadistica">{estadisticasReservas?.reservas_hoy || 0}</p>
                <span className="comparacion neutra">
                  {estadisticasReservas?.pendientes_hoy || 0} pendientes • {estadisticasReservas?.confirmadas_hoy || 0} confirmadas
                </span>
              </div>
            </div>

            {/* Fila Virtual */}
            <div className="tarjeta-estadistica clientes">
              <div className="icono-estadistica clientes-icon">
                <span className="material-symbols-outlined" style={{fontSize: '1.5rem', color: 'white'}}>groups</span>
              </div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">En Fila Virtual</h3>
                <p className="valor-estadistica">{estadisticasFila?.total_esperando || 0}</p>
                <span className={`comparacion ${(estadisticasFila?.total_esperando || 0) > 5 ? 'negativa' : 'neutra'}`}>
                  Espera máx: {estadisticasFila?.tiempo_espera_maximo || 0} min
                </span>
              </div>
            </div>

            {/* En curso */}
            <div className="tarjeta-estadistica info">
              <div className="icono-estadistica info-icon">
                <span className="material-symbols-outlined" style={{fontSize: '1.5rem', color: 'white'}}>restaurant</span>
              </div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">En Curso Ahora</h3>
                <p className="valor-estadistica">{estadisticasReservas?.en_curso || 0}</p>
                <span className="comparacion positiva">
                  {estadisticasReservas?.completadas_hoy || 0} completadas hoy
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mesas más Populares */}
      <section className="seccion-estado-actual">
        <div className="contenedor-estado-actual">
          <h2 className="titulo-seccion-admin">Mesas más Utilizadas</h2>
          <div className="grilla-estado-actual">
            {dashboardData?.mesasPopulares?.map((mesa) => (
              <div key={mesa.mesaId} className="tarjeta-estado">
                <h3 className="titulo-estado">Mesa #{mesa.mesaId}</h3>
                <div className="indicador-mesas">
                  <span className="numero-mesas">{mesa.usos}</span>
                  <span className="total-mesas">usos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Acciones rápidas */}
      <section className="seccion-acciones-rapidas">
        <div className="contenedor-acciones">
          <h2 className="titulo-seccion-admin">Acciones Rápidas</h2>
          <div className="grilla-acciones">
            
            <div className="tarjeta-accion">
              <div className="icono-accion mesas-icon">
                <span className="material-symbols-outlined" style={{fontSize: '2.5rem', color: 'white'}}>table_restaurant</span>
              </div>
              <h3 className="titulo-accion">Gestionar Mesas</h3>
              <p className="descripcion-accion">Ver estado y gestionar ocupación de mesas</p>
              <button className="boton-accion" onClick={handleIrAMesas}>Ir a Mesas</button>
            </div>

            <div className="tarjeta-accion">
              <div className="icono-accion reservas-icon">
                <span className="material-symbols-outlined" style={{fontSize: '2.5rem', color: 'white'}}>event_available</span>
              </div>
              <h3 className="titulo-accion">Ver Reservas</h3>
              <p className="descripcion-accion">Gestionar reservas de hoy y futuras</p>
              <button className="boton-accion" onClick={handleVerReservas}>Ver Reservas</button>
            </div>

            <div className="tarjeta-accion">
              <div className="icono-accion menu-icon">
                <span className="material-symbols-outlined" style={{fontSize: '2.5rem', color: 'white'}}>restaurant_menu</span>
              </div>
              <h3 className="titulo-accion">Editar Menú</h3>
              <p className="descripcion-accion">Actualizar platos, precios y disponibilidad</p>
              <button className="boton-accion" onClick={handleEditarMenu}>Editar Menú</button>
            </div>

            <div className="tarjeta-accion">
              <div className="icono-accion reportes-icon">
                <span className="material-symbols-outlined" style={{fontSize: '2.5rem', color: 'white'}}>bar_chart</span>
              </div>
              <h3 className="titulo-accion">Ver Reportes</h3>
              <p className="descripcion-accion">Análisis de ventas y estadísticas</p>
              <button className="boton-accion" onClick={handleVerReportes}>Ver Reportes</button>
            </div>
          </div>
        </div>
      </section>

      {/* Alertas y notificaciones */}
      <section className="seccion-alertas-admin">
        <div className="contenedor-alertas-admin">
          <h2 className="titulo-seccion-admin">Alertas y Notificaciones</h2>
          <div className="lista-alertas-admin">
            {alertas.filter(a => !a.resuelta).length === 0 ? (
              <div className="sin-alertas">
                <p>No hay alertas en este momento</p>
              </div>
            ) : (
              alertas.map((alerta) => {
                if (alerta.resuelta) return null;

                const urgenciaClass = alerta.urgencia;
                const iconoClass = alerta.urgencia === 'urgente' ? 'error' : 
                                  alerta.urgencia === 'importante' ? 'warning' : 'info';

                return (
                  <div key={alerta.id} className={`alerta-admin ${urgenciaClass}`}>
                    <div className={`icono-alerta-admin ${urgenciaClass}-icon`}>
                      <span className="material-symbols-outlined" style={{fontSize: '1.5rem', color: 'white'}}>
                        {iconoClass === 'error' && 'error'}
                        {iconoClass === 'warning' && 'warning'}
                        {iconoClass === 'info' && 'info'}
                      </span>
                    </div>
                    <div className="contenido-alerta-admin">
                      <h3 className="titulo-alerta-admin">{alerta.titulo}</h3>
                      <p className="mensaje-alerta-admin">{alerta.mensaje}</p>
                      <span className="tiempo-alerta">
                        Hace {Math.floor((Date.now() - new Date(alerta.timestamp).getTime()) / 1000 / 60)} minutos
                      </span>
                    </div>
                    <button 
                      className="boton-resolver-alerta" 
                      onClick={() => handleResolverAlerta(alerta.id)}
                    >
                      {alerta.tipo === 'reserva' && 'Ver Detalles'}
                      {alerta.tipo === 'fila' && 'Ver Fila'}
                      {alerta.tipo === 'mesa' && 'Ver Mesas'}
                      {alerta.tipo === 'inventario' && 'Ver Inventario'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}