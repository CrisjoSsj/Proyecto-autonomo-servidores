import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "../../components/admin/NavbarAdmin";
import { fetchDashboardData } from "../../services/GraphQLService";
import { wsService } from "../../services/WebSocketService";
import "../../css/admin/Dashboard.css";

interface Alerta {
  id: string;
  tipo: 'reserva' | 'fila' | 'mesa' | 'inventario';
  titulo: string;
  mensaje: string;
  urgencia: 'urgente' | 'importante' | 'informativa';
  timestamp: string; // Cambiar a string para JSON
  datos?: any;
  resuelta: boolean;
}

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
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  // Cargar alertas del localStorage al montar
  useEffect(() => {
    const alertasGuardadas = cargarAlertasDelStorage();
    setAlertas(alertasGuardadas);
  }, []);

  // Guardar alertas en localStorage cuando cambien
  useEffect(() => {
    guardarAlertasEnStorage(alertas);
  }, [alertas]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await fetchDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Conectar WebSocket para recibir alertas en tiempo real
    wsService.connect();

    // Escuchar nuevas reservas
    const unsubscribeReservas = wsService.subscribe('reservas', (message) => {
      if (message.action === 'nueva_reserva') {
        const reserva = message.data?.reserva;
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
    const unsubscribeFilaVirtual = wsService.subscribe('fila_virtual', (message) => {
      if (message.action === 'nueva_entrada') {
        const persona = message.data?.persona;
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
    };
  }, []);

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
            <span className="fecha">Hoy: Domingo, 22 de Septiembre 2025</span>
            <span className="hora-actual">2:45 PM</span>
          </div>
        </div>
      </section>

      {/* Estadísticas principales - Datos de GraphQL */}
      <section className="seccion-estadisticas">
        <div className="contenedor-estadisticas">
          <h2 className="titulo-seccion-admin">Estadísticas de Hoy</h2>
          <div className="grilla-estadisticas">
            
            <div className="tarjeta-estadistica ventas">
              <div className="icono-estadistica ventas-icon">
                <span className="material-symbols-outlined" style={{fontSize: '1.5rem', color: 'white'}}>event_note</span>
              </div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">Total de Reservas</h3>
                <p className="valor-estadistica">{dashboardData?.totalReservas || 0}</p>
                <span className="comparacion positiva">Datos en tiempo real</span>
              </div>
            </div>

            <div className="tarjeta-estadistica ordenes">
              <div className="icono-estadistica ordenes-icon">
                <span className="material-symbols-outlined" style={{fontSize: '1.5rem', color: 'white'}}>table_restaurant</span>
              </div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">Mesas Populares</h3>
                <p className="valor-estadistica">{dashboardData?.mesasPopulares?.length || 0}</p>
                <span className="comparacion positiva">En análisis</span>
              </div>
            </div>

            <div className="tarjeta-estadistica clientes">
              <div className="icono-estadistica clientes-icon">
                <span className="material-symbols-outlined" style={{fontSize: '1.5rem', color: 'white'}}>people</span>
              </div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">Platos Más Pedidos</h3>
                <p className="valor-estadistica">{dashboardData?.platosPopulares?.length || 0}</p>
                <span className="comparacion neutra">Top platos</span>
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
            {dashboardData?.mesasPopulares?.map((mesa: any) => (
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