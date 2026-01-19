import React, { useEffect, useState } from 'react';
import { DashboardApiService } from '../api/dashboardApi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import '../styles/BusinessDashboard.css';
import { getSocket, authenticateSocket } from '../websocket/socket';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend, ArcElement);

interface KPI {
  ingresos_totales: number;
  ingresos_promedio_reserva: number;
  reservas_confirmadas: number;
  reservas_pendientes: number;
  reservas_canceladas: number;
  reservas_totales: number;
  tasa_conversion: number;
  tasa_cancelacion: number;
  satisfaccion_promedio: number;
  calificaciones_totales: number;
  servicios_totales: number;
  clientes_totales: number;
  proveedores_totales: number;
}

interface ReservasDesglosadas {
  confirmadas_por_proveedor: number;
  pagadas_por_cliente: number;
  pendientes_confirmacion: number;
  pendientes_pago: number;
  total_reservas: number;
}

interface TopServicio {
  id: number;
  nombre: string;
  reservas: number;
  rating: number;
  precio: number;
}

interface ReservaFluj {
  mes: string;
  total: number;
  confirmadas: number;
  pendientes: number;
  canceladas: number;
}

interface Actividad {
  tipo: string;
  subtipo: string;
  descripcion: string;
  fecha: string;
  icono: string;
  monto?: number;
}

interface ProyeccionIngresos {
  ingresos_pagados_mes: number;
  ingresos_confirmados_mes: number;
  ingresos_pendientes_mes: number;
  proyeccion_pagado_mes: number;
  proyeccion_confirmado_mes: number;
  promedio_diario_pagado: number;
  promedio_diario_confirmado: number;
  dias_procesados: number;
  dias_totales_mes: number;
  dias_restantes: number;
  porcentaje_mes: number;
}

const BusinessDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [reservasDesglosadas, setReservasDesglosadas] = useState<ReservasDesglosadas | null>(null);
  const [proyeccionIngresos, setProyeccionIngresos] = useState<ProyeccionIngresos | null>(null);
  const [topServicios, setTopServicios] = useState<TopServicio[]>([]);
  const [reservasFluj, setReservasFluj] = useState<ReservaFluj[]>([]);
  const [actividad, setActividad] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kpisData, serviciosData, reservasData, actividadData, desglosadosData, proyeccionData] = await Promise.all([
        DashboardApiService.getBusinessKPIs(),
        DashboardApiService.getServiciosAnalisis(),
        DashboardApiService.getReservasFluj(),
        DashboardApiService.getActividadTiempoReal(),
        DashboardApiService.getReservasDesglosadas(),
        DashboardApiService.getProyeccionIngresos(),
      ]);

      setKpis(kpisData);
      setTopServicios(serviciosData.top_servicios || []);
      setReservasFluj(reservasData || []);
      setActividad(actividadData || []);
      setReservasDesglosadas(desglosadosData || null);
      setProyeccionIngresos(proyeccionData || null);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching business data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);

    // Conectar al WebSocket para recibir eventos en tiempo real
    const setupWebSocket = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || 'admin';
        
        if (token) {
          await authenticateSocket({
            token,
            userId,
            role: 'admin',
          });
          
          const socket = getSocket();
          
          // Escuchar eventos de negocio y refrescar datos
          socket.on('negocio:evento', () => {
            console.log('📢 Evento de negocio recibido, actualizando dashboard...');
            fetchData();
          });

          // Escuchar eventos específicos
          socket.on('reserva:nueva', () => fetchData());
          socket.on('reserva:cambio', () => fetchData());
          socket.on('payment_created', () => fetchData());
          socket.on('pago:confirmado', () => fetchData());
          socket.on('servicio:nuevo', () => fetchData());
          socket.on('calificacion:nueva', () => fetchData());
          
          return () => {
            socket.off('negocio:evento');
            socket.off('reserva:nueva');
            socket.off('reserva:cambio');
            socket.off('payment_created');
            socket.off('pago:confirmado');
            socket.off('servicio:nuevo');
            socket.off('calificacion:nueva');
          };
        }
      } catch (error) {
        console.log('WebSocket deshabilitado para dashboard (modo solo HTTP)');
      }
    };

    setupWebSocket();

    return () => clearInterval(interval);
  }, []);

  if (loading && !kpis) {
    return <div className="loading">Cargando datos del negocio...</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="business-dashboard">
      <header className="dashboard-header">
        <h1>📊 Dashboard de Negocio - FindYourWork</h1>
        <div className="update-info">
          Actualizado: {lastUpdate.toLocaleTimeString('es-CO')}
          <button onClick={fetchData} className="refresh-btn">🔄</button>
        </div>
      </header>

      {/* SECCIÓN 1: KPIs CRÍTICOS */}
      <section className="kpi-section">
        <h2>💰 KPIs Financieros y de Reservas</h2>
        <div className="kpi-grid">
          {/* Ingresos Totales */}
          <div className="kpi-card highlight-gold">
            <div className="kpi-icon">💵</div>
            <div className="kpi-content">
              <div className="kpi-label">Ingresos Totales</div>
              <div className="kpi-value">{formatCurrency(kpis?.ingresos_totales || 0)}</div>
              <div className="kpi-sublabel">Reservas confirmadas</div>
            </div>
          </div>

          {/* Ingresos Promedio */}
          <div className="kpi-card highlight-blue">
            <div className="kpi-icon">📈</div>
            <div className="kpi-content">
              <div className="kpi-label">Ingreso Promedio/Reserva</div>
              <div className="kpi-value">{formatCurrency(parseFloat(kpis?.ingresos_promedio_reserva as any) || 0)}</div>
              <div className="kpi-sublabel">Por reserva completada</div>
            </div>
          </div>

          {/* Reservas Confirmadas */}
          <div className="kpi-card highlight-green">
            <div className="kpi-icon">✅</div>
            <div className="kpi-content">
              <div className="kpi-label">Reservas Confirmadas</div>
              <div className="kpi-value">{kpis?.reservas_confirmadas || 0}</div>
              <div className="kpi-sublabel">De {kpis?.reservas_totales || 0} total</div>
            </div>
          </div>

          {/* Reservas Pendientes */}
          <div className="kpi-card highlight-orange">
            <div className="kpi-icon">⏳</div>
            <div className="kpi-content">
              <div className="kpi-label">Reservas Pendientes</div>
              <div className="kpi-value">{kpis?.reservas_pendientes || 0}</div>
              <div className="kpi-sublabel">Requieren confirmación</div>
            </div>
          </div>

          {/* Tasa de Conversión */}
          <div className="kpi-card highlight-purple">
            <div className="kpi-icon">🎯</div>
            <div className="kpi-content">
              <div className="kpi-label">Tasa de Conversión</div>
              <div className="kpi-value">{formatPercent(kpis?.tasa_conversion || 0)}</div>
              <div className="kpi-sublabel">Pendiente → Confirmada</div>
            </div>
          </div>

          {/* Tasa de Cancelación */}
          <div className="kpi-card highlight-red">
            <div className="kpi-icon">❌</div>
            <div className="kpi-content">
              <div className="kpi-label">Tasa de Cancelación</div>
              <div className="kpi-value">{formatPercent(kpis?.tasa_cancelacion || 0)}</div>
              <div className="kpi-sublabel">De todas las reservas</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: RESERVAS DESGLOSADAS */}
      <section className="reservas-desglosadas-section">
        <h2>📋 Desglose de Reservas</h2>
        <div className="kpi-grid">
          {/* Reservas Confirmadas por Proveedor */}
          <div className="kpi-card highlight-blue">
            <div className="kpi-icon">✅</div>
            <div className="kpi-content">
              <div className="kpi-label">Confirmadas por Proveedor</div>
              <div className="kpi-value">{reservasDesglosadas?.confirmadas_por_proveedor || 0}</div>
              <div className="kpi-sublabel">Aceptadas, sin pagar</div>
            </div>
          </div>

          {/* Reservas Pagadas por Cliente */}
          <div className="kpi-card highlight-green">
            <div className="kpi-icon">💳</div>
            <div className="kpi-content">
              <div className="kpi-label">Pagadas por Cliente</div>
              <div className="kpi-value">{reservasDesglosadas?.pagadas_por_cliente || 0}</div>
              <div className="kpi-sublabel">Completadas</div>
            </div>
          </div>

          {/* Reservas Pendientes de Confirmación */}
          <div className="kpi-card highlight-orange">
            <div className="kpi-icon">⏳</div>
            <div className="kpi-content">
              <div className="kpi-label">Pendientes Confirmación</div>
              <div className="kpi-value">{reservasDesglosadas?.pendientes_confirmacion || 0}</div>
              <div className="kpi-sublabel">Aceptar o rechazar</div>
            </div>
          </div>

          {/* Reservas Pendientes de Pago */}
          <div className="kpi-card highlight-purple">
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <div className="kpi-label">Pendientes Pago</div>
              <div className="kpi-value">{reservasDesglosadas?.pendientes_pago || 0}</div>
              <div className="kpi-sublabel">A la espera de cobro</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: SATISFACCIÓN Y PLATAFORMA */}
      <section className="satisfaction-section">
        <h2>⭐ Satisfacción del Cliente y Plataforma</h2>
        <div className="kpi-grid">
          {/* Satisfacción Promedio */}
          <div className="kpi-card highlight-star">
            <div className="kpi-icon">⭐</div>
            <div className="kpi-content">
              <div className="kpi-label">Satisfacción Promedio</div>
              <div className="kpi-value">{kpis?.satisfaccion_promedio || 0}/5</div>
              <div className="kpi-sublabel">{kpis?.calificaciones_totales || 0} calificaciones</div>
            </div>
          </div>

          {/* Servicios Totales */}
          <div className="kpi-card highlight-cyan">
            <div className="kpi-icon">🔧</div>
            <div className="kpi-content">
              <div className="kpi-label">Servicios Disponibles</div>
              <div className="kpi-value">{kpis?.servicios_totales || 0}</div>
              <div className="kpi-sublabel">En la plataforma</div>
            </div>
          </div>

          {/* Clientes Registrados */}
          <div className="kpi-card highlight-pink">
            <div className="kpi-icon">👥</div>
            <div className="kpi-content">
              <div className="kpi-label">Clientes Registrados</div>
              <div className="kpi-value">{kpis?.clientes_totales || 0}</div>
              <div className="kpi-sublabel">Usuarios activos</div>
            </div>
          </div>

          {/* Proveedores */}
          <div className="kpi-card highlight-teal">
            <div className="kpi-icon">🏢</div>
            <div className="kpi-content">
              <div className="kpi-label">Proveedores Activos</div>
              <div className="kpi-value">{kpis?.proveedores_totales || 0}</div>
              <div className="kpi-sublabel">Ofreciendo servicios</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: TOP SERVICIOS */}
      <section className="top-services-section">
        <h2>🔥 Servicios Más Solicitados</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Rating</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              {topServicios.map((servicio, idx) => (
                <tr key={idx} className="data-row">
                  <td className="service-name">{servicio.nombre}</td>
                  <td className="rating">
                    <span className="stars">
                      {servicio.rating > 0 ? `${servicio.rating.toFixed(1)} ⭐` : 'Sin rating'}
                    </span>
                  </td>
                  <td className="price">{formatCurrency(servicio.precio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECCIÓN 5: FLUJO DE RESERVAS */}
      <section className="reservas-flujo-section">
        <h2>📊 Tendencia de Reservas por Mes</h2>
        <div className="flujo-container">
          <table className="flujo-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Total</th>
                <th>Confirmadas</th>
                <th>Pendientes</th>
                <th>Canceladas</th>
              </tr>
            </thead>
            <tbody>
              {reservasFluj.map((mes, idx) => (
                <tr key={idx} className="flujo-row">
                  <td className="mes">{mes.mes}</td>
                  <td className="total">
                    <span className="badge badge-total">{mes.total}</span>
                  </td>
                  <td className="confirmadas">
                    <span className="badge badge-confirm">{mes.confirmadas}</span>
                  </td>
                  <td className="pendientes">
                    <span className="badge badge-pending">{mes.pendientes}</span>
                  </td>
                  <td className="canceladas">
                    <span className="badge badge-cancel">{mes.canceladas}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECCIÓN 7: PROYECCIÓN DE INGRESOS */}
      <section className="proyeccion-ingresos-section">
        <h2>💹 Proyección de Ingresos Mensuales</h2>
        <div className="proyeccion-container">
          <div className="proyeccion-main">
            <div className="proyeccion-cards">
              {/* Ingresos Pagados del Mes */}
              <div className="proyeccion-card pagado">
                <div className="proyeccion-icon">💰</div>
                <div className="proyeccion-label">Ingresos Pagados</div>
                <div className="proyeccion-value">{formatCurrency(proyeccionIngresos?.ingresos_pagados_mes || 0)}</div>
                <div className="proyeccion-sublabel">Confirmados y pagados</div>
              </div>

              {/* Proyección Pagado */}
              <div className="proyeccion-card proyectado-pagado">
                <div className="proyeccion-icon">📊</div>
                <div className="proyeccion-label">Proyección (Pagado)</div>
                <div className="proyeccion-value">{formatCurrency(proyeccionIngresos?.proyeccion_pagado_mes || 0)}</div>
                <div className="proyeccion-sublabel">Estimado para fin de mes</div>
              </div>

              {/* Ingresos Confirmados */}
              <div className="proyeccion-card confirmado">
                <div className="proyeccion-icon">✅</div>
                <div className="proyeccion-label">Ingresos Confirmados</div>
                <div className="proyeccion-value">{formatCurrency(proyeccionIngresos?.ingresos_confirmados_mes || 0)}</div>
                <div className="proyeccion-sublabel">Confirmadas (pagadas o no)</div>
              </div>

              {/* Proyección Confirmado */}
              <div className="proyeccion-card proyectado-confirmado">
                <div className="proyeccion-icon">🎯</div>
                <div className="proyeccion-label">Proyección (Confirmado)</div>
                <div className="proyeccion-value">{formatCurrency(proyeccionIngresos?.proyeccion_confirmado_mes || 0)}</div>
                <div className="proyeccion-sublabel">Todas las confirmadas</div>
              </div>

              {/* Ingresos Pendientes */}
              <div className="proyeccion-card pendiente">
                <div className="proyeccion-icon">⏳</div>
                <div className="proyeccion-label">Ingresos Pendientes</div>
                <div className="proyeccion-value">{formatCurrency(proyeccionIngresos?.ingresos_pendientes_mes || 0)}</div>
                <div className="proyeccion-sublabel">A la espera de cobro</div>
              </div>

              {/* Promedio Diario */}
              <div className="proyeccion-card promedio">
                <div className="proyeccion-icon">📈</div>
                <div className="proyeccion-label">Promedio Diario (Pagado)</div>
                <div className="proyeccion-value">{formatCurrency(proyeccionIngresos?.promedio_diario_pagado || 0)}</div>
                <div className="proyeccion-sublabel">Por día completado</div>
              </div>
            </div>

            {/* Barra de progreso del mes */}
            <div className="mes-progress">
              <div className="progress-header">
                <span className="progress-label">Progreso del Mes</span>
                <span className="progress-percentage">{proyeccionIngresos?.porcentaje_mes || 0}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${proyeccionIngresos?.porcentaje_mes || 0}%` }}
                />
              </div>
              <div className="progress-info">
                <span className="dias-procesados">
                  {proyeccionIngresos?.dias_procesados || 0} de {proyeccionIngresos?.dias_totales_mes || 0} días
                </span>
                <span className="dias-restantes">
                  {proyeccionIngresos?.dias_restantes || 0} días restantes
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 8: ESTADO DE RESERVAS - GRÁFICO DONUT */}
      <section className="reservas-status-section">
        <h2>📊 Estado de Reservas</h2>
        <div className="charts-container">
          <div className="chart-wrapper large">
            {kpis && (kpis.reservas_confirmadas + kpis.reservas_pendientes + kpis.reservas_canceladas > 0) ? (
              <Doughnut
                data={{
                  labels: ['Confirmadas', 'Pendientes', 'Canceladas'],
                  datasets: [
                    {
                      data: [
                        kpis.reservas_confirmadas,
                        kpis.reservas_pendientes,
                        kpis.reservas_canceladas,
                      ],
                      backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                      ],
                      borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(251, 146, 60, 1)',
                        'rgba(239, 68, 68, 1)',
                      ],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'bottom',
                      labels: { color: '#fff', font: { size: 12 }, padding: 20 },
                    },
                  },
                }}
              />
            ) : (
              <div className="no-data">Sin datos de reservas</div>
            )}
          </div>
        </div>
      </section>
      <section className="actividad-real-section">
        <h2>🔔 Actividad en Tiempo Real</h2>
        <div className="actividad-container">
          <div className="actividad-feed">
            {actividad.length > 0 ? (
              actividad.map((evento, idx) => (
                <div key={idx} className="actividad-item">
                  <div className="actividad-icono">{evento.icono}</div>
                  <div className="actividad-content">
                    <div className="actividad-descripcion">{evento.descripcion}</div>
                    <div className="actividad-fecha">
                      {new Date(evento.fecha).toLocaleString('es-CO')}
                    </div>
                  </div>
                  {evento.monto && (
                    <div className="actividad-monto">{formatCurrency(evento.monto)}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-actividad">Sin actividad registrada</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BusinessDashboard;
