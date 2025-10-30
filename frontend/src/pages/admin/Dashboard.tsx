import { useEffect, useState } from "react";
import NavbarAdmin from "../../components/admin/NavbarAdmin";
import { fetchDashboardData } from "../../services/GraphQLService";
import "../../css/admin/Dashboard.css";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            marginBottom: '20px',
            padding: '15px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold'
          }}>
            <span style={{ fontSize: '24px' }}>📊</span>
            <span>DATOS EN TIEMPO REAL VIA GRAPHQL</span>
            <span style={{ 
              marginLeft: 'auto',
              padding: '5px 15px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '20px',
              fontSize: '12px'
            }}>
              � Conectado a http://localhost:3000/api/graphql
            </span>
          </div>
          <div className="grilla-estadisticas">
            
            <div className="tarjeta-estadistica ventas">
              <div className="icono-estadistica ventas-icon"></div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">Total de Reservas</h3>
                <p className="valor-estadistica">{dashboardData?.totalReservas || 0}</p>
                <span className="comparacion positiva">Datos en tiempo real</span>
              </div>
            </div>

            <div className="tarjeta-estadistica ordenes">
              <div className="icono-estadistica ordenes-icon"></div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">Mesas Populares</h3>
                <p className="valor-estadistica">{dashboardData?.mesasPopulares?.length || 0}</p>
                <span className="comparacion positiva">En análisis</span>
              </div>
            </div>

            <div className="tarjeta-estadistica clientes">
              <div className="icono-estadistica clientes-icon"></div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">Platos Más Pedidos</h3>
                <p className="valor-estadistica">{dashboardData?.platosPopulares?.length || 0}</p>
                <span className="comparacion neutra">Top platos</span>
              </div>
            </div>

            <div className="tarjeta-estadistica tiempo-promedio">
              <div className="icono-estadistica tiempo-icon"></div>
              <div className="contenido-estadistica">
                <h3 className="titulo-estadistica">Reservas este Mes</h3>
                <p className="valor-estadistica">
                  {dashboardData?.reservasPorMes?.reduce((acc: number, item: any) => acc + item.total, 0) || 0}
                </p>
                <span className="comparacion positiva">Tendencia mensual</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gráfico de Reservas por Mes */}
      <section className="seccion-estadisticas">
        <div className="contenedor-estadisticas">
          <h2 className="titulo-seccion-admin">Reservas por Mes</h2>
          <div className="chart-container">
            {dashboardData?.reservasPorMes?.map((item: any) => (
              <div key={item.mes} className="bar-chart-item">
                <div 
                  className="bar" 
                  style={{ 
                    height: `${(item.total / Math.max(...(dashboardData.reservasPorMes?.map((x: any) => x.total) || [1]))) * 200}px`,
                    background: '#4299e1'
                  }}
                />
                <span className="mes-label">{item.mes}</span>
                <span className="valor-label">{item.total}</span>
              </div>
            ))}
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

      {/* Platos más Pedidos */}
      <section className="seccion-estado-actual">
        <div className="contenedor-estado-actual">
          <h2 className="titulo-seccion-admin">Platos más Pedidos</h2>
          <div className="lista-platos-populares">
            {dashboardData?.platosPopulares?.map((plato: any) => (
              <div key={plato.platoId} className="item-plato-popular">
                <span className="nombre-plato">{plato.nombre}</span>
                <span className="pedidos-plato">{plato.pedidos} pedidos</span>
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
              <div className="icono-accion mesas-icon"></div>
              <h3 className="titulo-accion">Gestionar Mesas</h3>
              <p className="descripcion-accion">Ver estado y gestionar ocupación de mesas</p>
              <button className="boton-accion">Ir a Mesas</button>
            </div>

            <div className="tarjeta-accion">
              <div className="icono-accion reservas-icon"></div>
              <h3 className="titulo-accion">Ver Reservas</h3>
              <p className="descripcion-accion">Gestionar reservas de hoy y futuras</p>
              <button className="boton-accion">Ver Reservas</button>
            </div>

            <div className="tarjeta-accion">
              <div className="icono-accion menu-icon"></div>
              <h3 className="titulo-accion">Editar Menú</h3>
              <p className="descripcion-accion">Actualizar platos, precios y disponibilidad</p>
              <button className="boton-accion">Editar Menú</button>
            </div>

            <div className="tarjeta-accion">
              <div className="icono-accion reportes-icon"></div>
              <h3 className="titulo-accion">Ver Reportes</h3>
              <p className="descripcion-accion">Análisis de ventas y estadísticas</p>
              <button className="boton-accion">Ver Reportes</button>
            </div>
          </div>
        </div>
      </section>

      {/* Alertas y notificaciones */}
      <section className="seccion-alertas-admin">
        <div className="contenedor-alertas-admin">
          <h2 className="titulo-seccion-admin">Alertas y Notificaciones</h2>
          <div className="lista-alertas-admin">
            
            <div className="alerta-admin urgente">
              <div className="icono-alerta-admin urgente-icon"></div>
              <div className="contenido-alerta-admin">
                <h3 className="titulo-alerta-admin">Mesa 4 - Tiempo excedido</h3>
                <p className="mensaje-alerta-admin">
                  La mesa 4 lleva 2h 15min ocupada. Considerar consultar con el cliente.
                </p>
                <span className="tiempo-alerta">Hace 15 minutos</span>
              </div>
              <button className="boton-resolver-alerta">Resolver</button>
            </div>

            <div className="alerta-admin importante">
              <div className="icono-alerta-admin importante-icon"></div>
              <div className="contenido-alerta-admin">
                <h3 className="titulo-alerta-admin">Inventario Bajo</h3>
                <p className="mensaje-alerta-admin">
                  Alitas BBQ - Quedan solo 15 porciones. Considerar reabastecer.
                </p>
                <span className="tiempo-alerta">Hace 30 minutos</span>
              </div>
              <button className="boton-resolver-alerta">Ver Inventario</button>
            </div>

            <div className="alerta-admin informativa">
              <div className="icono-alerta-admin info-icon"></div>
              <div className="contenido-alerta-admin">
                <h3 className="titulo-alerta-admin">Nueva Reserva</h3>
                <p className="mensaje-alerta-admin">
                  Reserva para 6 personas confirmada para las 8:00 PM - Mesa 9.
                </p>
                <span className="tiempo-alerta">Hace 5 minutos</span>
              </div>
              <button className="boton-resolver-alerta">Ver Detalles</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}