import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { graphQLRequest } from "../api/graphql";
import {
  QUERY_METRICAS_GENERALES,
  QUERY_SERVICIOS_MAS_POPULARES,
  QUERY_PROVEEDORES_MEJOR_CALIFICADOS,
  QUERY_CLIENTES_MAS_ACTIVOS,
  QUERY_REPORTE_VENTAS,
  QUERY_REPORTE_SATISFACCION,
  QUERY_REPORTE_PROVEEDORES,
  QUERY_REPORTE_CLIENTES,
} from "../api/graphqlQueries";
import { AuthContext } from "../context/AuthContext";
import { 
  generateDashboardPDF, 
  generateServiciosPopularesPDF, 
  generateTopProveedoresPDF, 
  generateClientesActivosPDF,
  generateReporteVentasPDF,
  generateReporteSatisfaccionPDF,
  generateReporteProveedoresPDF,
  generateReporteClientesPDF
} from "../utils/pdfReportGenerator";
import "../App.css";

interface MetricasGenerales {
  totalUsuarios: number;
  totalClientes: number;
  totalProveedores: number;
  totalServicios: number;
  totalReservas: number;
  ingresosTotales: string;
  promedioSatisfaccion: string;
}

interface ServicioPopular {
  servicio: {
    id: number;
    nombreServicio: string;
    precio: string;
    ratingPromedio: number;
  };
  cantidadVendida: number;
  ingresosGenerados: string;
}

interface ProveedorTop {
  proveedor: {
    id: number;
    user: {
      username: string;
      firstName: string;
      lastName: string;
    };
  };
  totalServicios: number;
  ingresosTotales: string;
  promedioCalificacion: number;
}

interface ClienteActivo {
  cliente: {
    id: number;
    user: {
      username: string;
      firstName: string;
      lastName: string;
    };
  };
  totalReservas: number;
  gastoTotal: string;
}

interface ReporteVentas {
  periodo: string;
  totalVentas: string;
  cantidadReservas: number;
  promedioPorReserva: string;
  serviciosMasVendidos: ServicioVendido[];
}

interface ServicioVendido {
  servicio: {
    id: number;
    nombreServicio: string;
    descripcion: string;
    precio: string;
  };
  cantidadVendida: number;
  ingresosGenerados: string;
}

interface ReporteSatisfaccion {
  servicio: {
    id: number;
    nombreServicio: string;
    descripcion: string;
  };
  promedioCalificacion: number;
  totalCalificaciones: number;
  distribucionCalificaciones: DistribucionCalificacion[];
}

interface DistribucionCalificacion {
  puntuacion: number;
  cantidad: number;
  porcentaje: number;
}

interface ReporteProveedor {
  proveedor: {
    id: number;
    user: {
      username: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    telefono: string;
    descripcion: string;
  };
  totalServicios: number;
  ingresosTotales: string;
  promedioCalificacion: number;
  serviciosActivos: number;
}

interface ReporteCliente {
  cliente: {
    id: number;
    user: {
      username: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    telefono: string;
  };
  totalReservas: number;
  gastoTotal: string;
  promedioPorReserva: string;
  ultimaReserva: string;
}

export function AdminDashboard() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<MetricasGenerales | null>(null);
  const [serviciosPopulares, setServiciosPopulares] = useState<ServicioPopular[]>([]);
  const [proveedoresTop, setProveedoresTop] = useState<ProveedorTop[]>([]);
  const [clientesActivos, setClientesActivos] = useState<ClienteActivo[]>([]);
  const [reporteVentas, setReporteVentas] = useState<ReporteVentas | null>(null);
  const [reporteSatisfaccion, setReporteSatisfaccion] = useState<ReporteSatisfaccion[]>([]);
  const [reporteProveedores, setReporteProveedores] = useState<ReporteProveedor[]>([]);
  const [reporteClientes, setReporteClientes] = useState<ReporteCliente[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | "servicios" | "proveedores" | "clientes" | "ventas" | "satisfaccion" | "reporteProveedores" | "reporteClientes">("general");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const metricasRes = await graphQLRequest<{ metricasGenerales: MetricasGenerales }>({
        query: QUERY_METRICAS_GENERALES,
        variables: {},
        token,
      });
      console.log("Métricas recibidas:", metricasRes.metricasGenerales);
      setMetricas(metricasRes.metricasGenerales);

      const serviciosRes = await graphQLRequest<{ serviciosMasPopulares: ServicioPopular[] }>({
        query: QUERY_SERVICIOS_MAS_POPULARES,
        variables: { limit: 5 },
        token,
      });
      console.log("Servicios populares recibidos:", serviciosRes.serviciosMasPopulares);
      setServiciosPopulares(serviciosRes.serviciosMasPopulares);

      const proveedoresRes = await graphQLRequest<{ proveedoresMejorCalificados: ProveedorTop[] }>({
        query: QUERY_PROVEEDORES_MEJOR_CALIFICADOS,
        variables: { limit: 5 },
        token,
      });
      console.log("Proveedores mejor calificados:", proveedoresRes.proveedoresMejorCalificados);
      setProveedoresTop(proveedoresRes.proveedoresMejorCalificados);

      const clientesRes = await graphQLRequest<{ clientesMasActivos: ClienteActivo[] }>({
        query: QUERY_CLIENTES_MAS_ACTIVOS,
        variables: { limit: 5 },
        token,
      });
      console.log("Clientes más activos:", clientesRes.clientesMasActivos);
      setClientesActivos(clientesRes.clientesMasActivos);

      // Cargar reporte de ventas
      const ventasRes = await graphQLRequest<{ reporteVentas: ReporteVentas }>({
        query: QUERY_REPORTE_VENTAS,
        variables: {},
        token,
      });
      setReporteVentas(ventasRes.reporteVentas);

      // Cargar reporte de satisfacción
      const satisfaccionRes = await graphQLRequest<{ reporteSatisfaccion: ReporteSatisfaccion[] }>({
        query: QUERY_REPORTE_SATISFACCION,
        variables: {},
        token,
      });
      console.log("Reporte satisfacción recibido:", satisfaccionRes.reporteSatisfaccion);
      setReporteSatisfaccion(satisfaccionRes.reporteSatisfaccion);

      // Cargar reporte de proveedores
      const reporteProvRes = await graphQLRequest<{ reporteProveedores: ReporteProveedor[] }>({
        query: QUERY_REPORTE_PROVEEDORES,
        variables: {},
        token,
      });
      setReporteProveedores(reporteProvRes.reporteProveedores);

      // Cargar reporte de clientes
      const reporteCliRes = await graphQLRequest<{ reporteClientes: ReporteCliente[] }>({
        query: QUERY_REPORTE_CLIENTES,
        variables: {},
        token,
      });
      setReporteClientes(reporteCliRes.reporteClientes);
    } catch (error) {
      console.error("Error cargando datos del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(123, 92, 255, 0.2)',
            borderTopColor: '#7b5cff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '2rem', color: '#f5f5f7' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            background: 'linear-gradient(135deg, #7b5cff 0%, #00bcd4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            Panel de Administrador
          </h1>
          <p style={{ color: '#9c9c9f', fontSize: '1.1rem' }}>Métricas y estadísticas del sistema</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => navigate('/ai-chat')}
            style={{
              background: 'linear-gradient(135deg, #7b5cff 0%, #9c7cff 100%)',
              color: 'white',
              border: 'none',
              padding: '0.85rem 1.75rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(123, 92, 255, 0.4)',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(123, 92, 255, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(123, 92, 255, 0.4)';
            }}
          >
            🤖 AI Chat
          </button>
          <button
            onClick={() => navigate('/negocio/dashboard')}
          style={{
            background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
            color: 'white',
            border: 'none',
            padding: '0.85rem 1.75rem',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(76, 175, 80, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
          }}
        >
          🏢 Dashboard de Negocio
        </button>
        </div>
      </div>

      {metricas && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem', 
          marginBottom: '3rem' 
        }}>
          <div className="metric-card">
            <div style={{ fontSize: '2.5rem' }}>👥</div>
            <div>
              <h3 style={{ fontSize: '2rem', margin: 0, color: '#7b5cff' }}>{metricas.totalUsuarios}</h3>
              <p style={{ margin: '0.3rem 0 0 0', color: '#9c9c9f', fontSize: '0.9rem' }}>Usuarios Totales</p>
            </div>
          </div>

          <div className="metric-card">
            <div style={{ fontSize: '2.5rem' }}>🛒</div>
            <div>
              <h3 style={{ fontSize: '2rem', margin: 0, color: '#7b5cff' }}>{metricas.totalClientes}</h3>
              <p style={{ margin: '0.3rem 0 0 0', color: '#9c9c9f', fontSize: '0.9rem' }}>Clientes</p>
            </div>
          </div>

          <div className="metric-card">
            <div style={{ fontSize: '2.5rem' }}>🏢</div>
            <div>
              <h3 style={{ fontSize: '2rem', margin: 0, color: '#7b5cff' }}>{metricas.totalProveedores}</h3>
              <p style={{ margin: '0.3rem 0 0 0', color: '#9c9c9f', fontSize: '0.9rem' }}>Proveedores</p>
            </div>
          </div>

          <div className="metric-card">
            <div style={{ fontSize: '2.5rem' }}>💼</div>
            <div>
              <h3 style={{ fontSize: '2rem', margin: 0, color: '#7b5cff' }}>{metricas.totalServicios}</h3>
              <p style={{ margin: '0.3rem 0 0 0', color: '#9c9c9f', fontSize: '0.9rem' }}>Servicios</p>
            </div>
          </div>

          <div className="metric-card">
            <div style={{ fontSize: '2.5rem' }}>📅</div>
            <div>
              <h3 style={{ fontSize: '2rem', margin: 0, color: '#7b5cff' }}>{metricas.totalReservas}</h3>
              <p style={{ margin: '0.3rem 0 0 0', color: '#9c9c9f', fontSize: '0.9rem' }}>Reservas</p>
            </div>
          </div>

          <div className="metric-card" style={{
            background: 'linear-gradient(135deg, rgba(123, 92, 255, 0.1) 0%, rgba(0, 188, 212, 0.1) 100%)',
            border: '1px solid rgba(123, 92, 255, 0.3)'
          }}>
            <div style={{ fontSize: '2.5rem' }}>💰</div>
            <div>
              <h3 style={{ fontSize: '2rem', margin: 0, color: '#7b5cff' }}>${metricas.ingresosTotales}</h3>
              <p style={{ margin: '0.3rem 0 0 0', color: '#9c9c9f', fontSize: '0.9rem' }}>Ingresos Totales</p>
            </div>
          </div>

          <div className="metric-card" style={{
            background: 'linear-gradient(135deg, rgba(123, 92, 255, 0.1) 0%, rgba(0, 188, 212, 0.1) 100%)',
            border: '1px solid rgba(123, 92, 255, 0.3)'
          }}>
            <div style={{ fontSize: '2.5rem' }}>⭐</div>
            <div>
              <h3 style={{ fontSize: '2rem', margin: 0, color: '#7b5cff' }}>{parseFloat(metricas.promedioSatisfaccion).toFixed(1)}</h3>
              <p style={{ margin: '0.3rem 0 0 0', color: '#9c9c9f', fontSize: '0.9rem' }}>Satisfacción Promedio</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem', 
        borderBottom: '2px solid #2a2a2f',
        overflowX: 'auto'
      }}>
        <button 
          className={`tab ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === "general" ? '#7b5cff' : '#9c9c9f',
            padding: '1rem 1.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            borderBottom: activeTab === "general" ? '3px solid #7b5cff' : '3px solid transparent',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap'
          }}
        >
          Vista General
        </button>
        <button 
          className={`tab ${activeTab === "servicios" ? "active" : ""}`}
          onClick={() => setActiveTab("servicios")}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === "servicios" ? '#7b5cff' : '#9c9c9f',
            padding: '1rem 1.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            borderBottom: activeTab === "servicios" ? '3px solid #7b5cff' : '3px solid transparent',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap'
          }}
        >
          Servicios Populares
        </button>
        <button 
          className={`tab ${activeTab === "proveedores" ? "active" : ""}`}
          onClick={() => setActiveTab("proveedores")}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === "proveedores" ? '#7b5cff' : '#9c9c9f',
            padding: '1rem 1.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            borderBottom: activeTab === "proveedores" ? '3px solid #7b5cff' : '3px solid transparent',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap'
          }}
        >
          Top Proveedores
        </button>
        <button 
          className={`tab ${activeTab === "clientes" ? "active" : ""}`}
          onClick={() => setActiveTab("clientes")}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === "clientes" ? '#7b5cff' : '#9c9c9f',
            padding: '1rem 1.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            borderBottom: activeTab === "clientes" ? '3px solid #7b5cff' : '3px solid transparent',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap'
          }}
        >
          Clientes Activos
        </button>
        <button 
          className={`tab ${activeTab === "ventas" ? "active" : ""}`}
          onClick={() => setActiveTab("ventas")}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === "ventas" ? '#7b5cff' : '#9c9c9f',
            padding: '1rem 1.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            borderBottom: activeTab === "ventas" ? '3px solid #7b5cff' : '3px solid transparent',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap'
          }}
        >
          Reporte Ventas
        </button>
        <button 
          className={`tab ${activeTab === "satisfaccion" ? "active" : ""}`}
          onClick={() => setActiveTab("satisfaccion")}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === "satisfaccion" ? '#7b5cff' : '#9c9c9f',
            padding: '1rem 1.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            borderBottom: activeTab === "satisfaccion" ? '3px solid #7b5cff' : '3px solid transparent',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap'
          }}
        >
          Satisfacción
        </button>
        <button 
          className={`tab ${activeTab === "reporteProveedores" ? "active" : ""}`}
          onClick={() => setActiveTab("reporteProveedores")}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === "reporteProveedores" ? '#7b5cff' : '#9c9c9f',
            padding: '1rem 1.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            borderBottom: activeTab === "reporteProveedores" ? '3px solid #7b5cff' : '3px solid transparent',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap'
          }}
        >
          Reporte Proveedores
        </button>
        <button 
          className={`tab ${activeTab === "reporteClientes" ? "active" : ""}`}
          onClick={() => setActiveTab("reporteClientes")}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === "reporteClientes" ? '#7b5cff' : '#9c9c9f',
            padding: '1rem 1.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            borderBottom: activeTab === "reporteClientes" ? '3px solid #7b5cff' : '3px solid transparent',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap'
          }}
        >
          Reporte Clientes
        </button>
      </div>

      <div style={{ minHeight: '400px' }}>
        {activeTab === "general" && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#f5f5f7', fontSize: '1.8rem' }}>Resumen del Sistema</h2>
              <button
                onClick={async () => {
                  if (metricas && serviciosPopulares && proveedoresTop && clientesActivos) {
                    await generateDashboardPDF({
                      totalServicios: metricas.totalServicios,
                      totalReservas: metricas.totalReservas,
                      ingresosTotales: metricas.ingresosTotales,
                      serviciosPopulares: serviciosPopulares,
                      topProveedores: proveedoresTop,
                      clientesActivos: clientesActivos
                    });
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #7b5cff 0%, #9b7fff 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(123, 92, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(123, 92, 255, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(123, 92, 255, 0.3)';
                }}
              >
                📄 Generar Reporte PDF
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div style={{ 
                background: 'rgba(30, 30, 35, 0.8)', 
                borderRadius: '12px', 
                padding: '1.5rem', 
                border: '1px solid #2a2a2f' 
              }}>
                <h4 style={{ marginTop: 0, color: '#f5f5f7' }}>Estado del Sistema</h4>
                <p style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontWeight: '600',
                  background: 'rgba(76, 175, 80, 0.2)',
                  color: '#4caf50',
                  margin: '0.5rem 0'
                }}>
                  ✓ Operativo
                </p>
              </div>
              <div style={{ 
                background: 'rgba(30, 30, 35, 0.8)', 
                borderRadius: '12px', 
                padding: '1.5rem', 
                border: '1px solid #2a2a2f' 
              }}>
                <h4 style={{ marginTop: 0, color: '#f5f5f7' }}>Tasa de Conversión</h4>
                <p style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: '#7b5cff',
                  margin: '0.5rem 0'
                }}>
                  {metricas && metricas.totalUsuarios > 0
                    ? ((metricas.totalReservas / metricas.totalUsuarios) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "servicios" && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#f5f5f7', fontSize: '1.8rem' }}>Servicios Más Populares</h2>
              <button
                onClick={() => generateServiciosPopularesPDF(serviciosPopulares)}
                style={{
                  background: 'linear-gradient(135deg, #7b5cff 0%, #9b7fff 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(123, 92, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(123, 92, 255, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(123, 92, 255, 0.3)';
                }}
              >
                📄 Generar Reporte PDF
              </button>
            </div>
            <div style={{
              overflowX: 'auto',
              background: 'rgba(30, 30, 35, 0.8)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #2a2a2f'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '1rem', color: '#9c9c9f', fontWeight: '600', borderBottom: '2px solid #2a2a2f' }}>Servicio</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: '#9c9c9f', fontWeight: '600', borderBottom: '2px solid #2a2a2f' }}>Rating</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: '#9c9c9f', fontWeight: '600', borderBottom: '2px solid #2a2a2f' }}>Precio</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: '#9c9c9f', fontWeight: '600', borderBottom: '2px solid #2a2a2f' }}>Ventas</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: '#9c9c9f', fontWeight: '600', borderBottom: '2px solid #2a2a2f' }}>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {serviciosPopulares.map((item, idx) => (
                    <tr key={item.servicio.id} style={{ transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #2a2a2f', color: '#f5f5f7' }}>
                        <span style={{
                          display: 'inline-block',
                          background: '#7b5cff',
                          color: 'white',
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          textAlign: 'center',
                          lineHeight: '30px',
                          fontWeight: 'bold',
                          marginRight: '0.5rem'
                        }}>{idx + 1}</span>
                        {item.servicio.nombreServicio}
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #2a2a2f', color: '#ffd700', fontWeight: '600' }}>
                        ⭐ {item.servicio.ratingPromedio.toFixed(1)}
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #2a2a2f', color: '#f5f5f7' }}>${item.servicio.precio}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #2a2a2f', color: '#f5f5f7' }}>{item.cantidadVendida}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #2a2a2f', color: '#4caf50', fontWeight: '600' }}>${item.ingresosGenerados}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "proveedores" && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#f5f5f7', fontSize: '1.8rem' }}>Proveedores Mejor Calificados</h2>
              <button
                onClick={() => generateTopProveedoresPDF(proveedoresTop)}
                style={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                }}
              >
                📄 Generar Reporte PDF
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {proveedoresTop.map((item, idx) => (
                <div key={item.proveedor.id} style={{
                  background: 'rgba(30, 30, 35, 0.8)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid #2a2a2f',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #2a2a2f'
                  }}>
                    <div style={{
                      background: '#7b5cff',
                      color: 'white',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      textAlign: 'center',
                      lineHeight: '40px',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}>{idx + 1}</div>
                    <div>
                      <h3 style={{ margin: 0, color: '#f5f5f7', fontSize: '1.2rem' }}>
                        {item.proveedor.user.firstName} {item.proveedor.user.lastName}
                      </h3>
                      <p style={{ color: '#9c9c9f', margin: '0.3rem 0 0 0', fontSize: '0.9rem' }}>
                        @{item.proveedor.user.username}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'block', color: '#9c9c9f', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Servicios</span>
                      <span style={{ display: 'block', color: '#f5f5f7', fontSize: '1.3rem', fontWeight: '600' }}>{item.totalServicios}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'block', color: '#9c9c9f', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Rating</span>
                      <span style={{ display: 'block', color: '#ffd700', fontSize: '1.3rem', fontWeight: '600' }}>⭐ {item.promedioCalificacion.toFixed(1)}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'block', color: '#9c9c9f', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Ingresos</span>
                      <span style={{ display: 'block', color: '#4caf50', fontSize: '1.3rem', fontWeight: '600' }}>${item.ingresosTotales}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "clientes" && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#f5f5f7', fontSize: '1.8rem' }}>Clientes Más Activos</h2>
              <button
                onClick={() => generateClientesActivosPDF(clientesActivos)}
                style={{
                  background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(33, 150, 243, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
                }}
              >
                📄 Generar Reporte PDF
              </button>
            </div>
            <div style={{
              overflowX: 'auto',
              background: 'rgba(30, 30, 35, 0.8)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #2a2a2f'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '1rem', color: '#9c9c9f', fontWeight: '600', borderBottom: '2px solid #2a2a2f' }}>Ranking</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: '#9c9c9f', fontWeight: '600', borderBottom: '2px solid #2a2a2f' }}>Cliente</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: '#9c9c9f', fontWeight: '600', borderBottom: '2px solid #2a2a2f' }}>Usuario</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: '#9c9c9f', fontWeight: '600', borderBottom: '2px solid #2a2a2f' }}>Reservas</th>
                    <th style={{ textAlign: 'left', padding: '1rem', color: '#9c9c9f', fontWeight: '600', borderBottom: '2px solid #2a2a2f' }}>Gasto Total</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesActivos.map((item, idx) => (
                    <tr key={item.cliente.id}>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #2a2a2f', color: '#f5f5f7' }}>
                        <div style={{
                          display: 'inline-block',
                          background: '#7b5cff',
                          color: 'white',
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          textAlign: 'center',
                          lineHeight: '30px',
                          fontWeight: 'bold'
                        }}>{idx + 1}</div>
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #2a2a2f', color: '#f5f5f7' }}>
                        {item.cliente.user.firstName} {item.cliente.user.lastName}
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #2a2a2f', color: '#f5f5f7' }}>
                        @{item.cliente.user.username}
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #2a2a2f', color: '#f5f5f7' }}>
                        {item.totalReservas}
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #2a2a2f', color: '#4caf50', fontWeight: '600' }}>
                        ${item.gastoTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ventas' && reporteVentas && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#7b5cff', fontSize: '1.75rem' }}>📊 Reporte de Ventas</h2>
              <button
                onClick={() => generateReporteVentasPDF(reporteVentas)}
                style={{
                  background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 152, 0, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.3)';
                }}
              >
                📄 Generar Reporte PDF
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #1a1a1f 0%, #2a2a3f 100%)',
                padding: '1.5rem',
                borderRadius: '16px',
                border: '1px solid #7b5cff',
                boxShadow: '0 8px 32px rgba(123, 92, 255, 0.15)'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#b0b0b0', marginBottom: '0.5rem' }}>Período</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>{reporteVentas.periodo}</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #1a1a1f 0%, #2a2a3f 100%)',
                padding: '1.5rem',
                borderRadius: '16px',
                border: '1px solid #4caf50',
                boxShadow: '0 8px 32px rgba(76, 175, 80, 0.15)'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#b0b0b0', marginBottom: '0.5rem' }}>Total Ventas</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4caf50' }}>${reporteVentas.totalVentas}</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #1a1a1f 0%, #2a2a3f 100%)',
                padding: '1.5rem',
                borderRadius: '16px',
                border: '1px solid #00bcd4',
                boxShadow: '0 8px 32px rgba(0, 188, 212, 0.15)'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#b0b0b0', marginBottom: '0.5rem' }}>Cantidad Reservas</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00bcd4' }}>{reporteVentas.cantidadReservas}</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #1a1a1f 0%, #2a2a3f 100%)',
                padding: '1.5rem',
                borderRadius: '16px',
                border: '1px solid #ff9800',
                boxShadow: '0 8px 32px rgba(255, 152, 0, 0.15)'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#b0b0b0', marginBottom: '0.5rem' }}>Promedio por Reserva</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ff9800' }}>${reporteVentas.promedioPorReserva}</div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #1a1a1f 0%, #2a2a3f 100%)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid #3a3a4f',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ color: '#7b5cff', marginBottom: '1.5rem', fontSize: '1.3rem' }}>🏆 Servicios Más Vendidos</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #7b5cff', color: '#b0b0b0', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Servicio</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Cantidad</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Total Vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteVentas.serviciosMasVendidos.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #2a2a2f' }}>
                      <td style={{ padding: '1rem', color: '#fff', fontWeight: '500' }}>
                        {item.servicio.nombreServicio}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#00bcd4', fontWeight: '600' }}>
                        {item.cantidadVendida}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#4caf50', fontWeight: '600' }}>
                        ${item.ingresosGenerados}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'satisfaccion' && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#7b5cff', fontSize: '1.75rem' }}>⭐ Reporte de Satisfacción</h2>
              {reporteSatisfaccion.length > 0 && (
                <button
                  onClick={() => generateReporteSatisfaccionPDF(reporteSatisfaccion)}
                  style={{
                    background: 'linear-gradient(135deg, #ffc107 0%, #ffca28 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 193, 7, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.3)';
                  }}
                >
                  📄 Generar Reporte PDF
                </button>
              )}
            </div>
            
            {reporteSatisfaccion.length === 0 && (
              <div style={{
                background: 'rgba(30, 30, 35, 0.8)',
                borderRadius: '12px',
                padding: '3rem',
                textAlign: 'center',
                border: '1px solid #2a2a2f'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                <h3 style={{ color: '#f5f5f7', marginBottom: '0.5rem' }}>No hay datos de satisfacción disponibles</h3>
                <p style={{ color: '#9c9c9f' }}>
                  No se encontraron calificaciones en el sistema. Los reportes se mostrarán cuando haya calificaciones registradas.
                </p>
              </div>
            )}
            
            {reporteSatisfaccion.length > 0 && (
            
            <div style={{ display: 'grid', gap: '2rem' }}>
              {reporteSatisfaccion.map((reporte, idx) => (
                <div key={idx} style={{
                  background: 'linear-gradient(135deg, #1a1a1f 0%, #2a2a3f 100%)',
                  padding: '2rem',
                  borderRadius: '16px',
                  border: '1px solid #3a3a4f',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                      <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '0.5rem' }}>{reporte.servicio.nombreServicio}</h3>
                      <div style={{ color: '#b0b0b0', fontSize: '0.9rem' }}>{reporte.totalCalificaciones} calificaciones</div>
                    </div>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: reporte.promedioCalificacion >= 4 ? '#4caf50' : reporte.promedioCalificacion >= 3 ? '#ff9800' : '#f44336'
                    }}>
                      {reporte.promedioCalificacion} ⭐
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ color: '#7b5cff', fontSize: '1rem', marginBottom: '1rem' }}>Distribución de Calificaciones</h4>
                    {reporte.distribucionCalificaciones.map((dist, i) => (
                      <div key={i} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem', color: '#b0b0b0' }}>
                          <span>{dist.puntuacion} estrellas</span>
                          <span>{dist.cantidad} ({dist.porcentaje}%)</span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: '#2a2a2f',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${dist.porcentaje}%`,
                            height: '100%',
                            background: dist.puntuacion === 5 ? '#4caf50' : dist.puntuacion === 4 ? '#8bc34a' : dist.puntuacion === 3 ? '#ff9800' : dist.puntuacion === 2 ? '#ff5722' : '#f44336',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {activeTab === 'reporteProveedores' && reporteProveedores.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#7b5cff', fontSize: '1.75rem' }}>👥 Reporte de Proveedores</h2>
              <button
                onClick={() => generateReporteProveedoresPDF(reporteProveedores)}
                style={{
                  background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(156, 39, 176, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.3)';
                }}
              >
                📄 Generar Reporte PDF
              </button>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #1a1a1f 0%, #2a2a3f 100%)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid #3a3a4f',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #7b5cff', color: '#b0b0b0', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Proveedor</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Total Servicios</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Activos</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Rating</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteProveedores.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #2a2a2f' }}>
                      <td style={{ padding: '1rem', color: '#fff', fontWeight: '500' }}>
                        {item.proveedor.user.firstName} {item.proveedor.user.lastName}
                      </td>
                      <td style={{ padding: '1rem', color: '#b0b0b0' }}>
                        {item.proveedor.user.email}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#00bcd4', fontWeight: '600' }}>
                        {item.totalServicios}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#4caf50', fontWeight: '600' }}>
                        {item.serviciosActivos}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                        <span style={{ 
                          color: item.promedioCalificacion >= 4 ? '#4caf50' : item.promedioCalificacion >= 3 ? '#ff9800' : '#f44336' 
                        }}>
                          {item.promedioCalificacion.toFixed(1)} ⭐
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#4caf50', fontWeight: '600' }}>
                        ${item.ingresosTotales}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reporteClientes' && reporteClientes.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#7b5cff', fontSize: '1.75rem' }}>🛍️ Reporte de Clientes</h2>
              <button
                onClick={() => generateReporteClientesPDF(reporteClientes)}
                style={{
                  background: 'linear-gradient(135deg, #009688 0%, #26a69a 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(0, 150, 136, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 150, 136, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 150, 136, 0.3)';
                }}
              >
                📄 Generar Reporte PDF
              </button>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #1a1a1f 0%, #2a2a3f 100%)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid #3a3a4f',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #7b5cff', color: '#b0b0b0', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Cliente</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Total Reservas</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Gasto Total</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Promedio</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Última Reserva</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteClientes.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #2a2a2f' }}>
                      <td style={{ padding: '1rem', color: '#fff', fontWeight: '500' }}>
                        {item.cliente.user.firstName} {item.cliente.user.lastName}
                      </td>
                      <td style={{ padding: '1rem', color: '#b0b0b0' }}>
                        {item.cliente.user.email}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#00bcd4', fontWeight: '600' }}>
                        {item.totalReservas}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#4caf50', fontWeight: '600' }}>
                        ${item.gastoTotal}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#ff9800', fontWeight: '600' }}>
                        ${item.promedioPorReserva}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#b0b0b0' }}>
                        {item.ultimaReserva ? new Date(item.ultimaReserva).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
