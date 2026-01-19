import { useEffect, useMemo, useState, useCallback } from 'react';
import { getUsers } from '../../api/usersApi';
import { getReservasByCliente } from '../../api/reserva';
import { getReservaServiciosByReserva } from '../../api/reservaServicio';
import { getAllServicios } from '../../api/servicio';
import { useNavigate } from 'react-router-dom';
import { getSocket, authenticateSocket } from '../../websocket/socket';

type Rol = 'cliente' | 'proveedor' | 'admin' | null;

interface Servicio {
  id: number;
  nombre_servicio: string;
  descripcion: string;
  duracion?: string;
  rating_promedio?: number;
  proveedor?: number;
}

interface ReservaServicio {
  id: number;
  servicio: Servicio;
  estado: 'pendiente' | 'confirmada' | 'rechazada';
  fecha_servicio: string;
  hora_servicio: string;
}

interface Reserva {
  id: number;
  fecha: string;
  hora: string;
  total_estimado: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  cliente: number;
}

export default function DashboardCliente() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rol, setRol] = useState<Rol>(null);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [reservaServicios, setReservaServicios] = useState<Record<number, ReservaServicio[]>>({});
  const [serviciosUnicos, setServiciosUnicos] = useState<Servicio[]>([]);
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem('token') || '', []);

  // Función para cargar datos (con mejor manejo de errores)
  const loadData = useCallback(async () => {
    try {
      if (!token) {
        setError('No hay token. Inicia sesión.');
        setLoading(false);
        return;
      }

      // Obtener perfil
      let perfil;
      try {
        perfil = await getUsers(token);
      } catch (err: any) {
        console.error('Error obteniendo perfil:', err);
        const status = err?.response?.status;
        const data = err?.response?.data;
        setError(`Error obteniendo perfil: ${status ?? ''} ${typeof data === 'object' ? JSON.stringify(data) : data ?? err.message}`);
        setLoading(false);
        return;
      }

      const data = perfil.data as { id: number; rol: Rol };
      setRol(data.rol);
      if (data.rol !== 'cliente') {
        setError('Este panel es solo para clientes.');
        setLoading(false);
        return;
      }

      setClienteId(data.id);

      // Cargar reservas del cliente
      let reservasRes;
      try {
        reservasRes = await getReservasByCliente(data.id, token);
      } catch (err: any) {
        console.error('Error cargando reservas:', err);
        const status = err?.response?.status;
        const dataErr = err?.response?.data;
        setError(`Error cargando reservas: ${status ?? ''} ${typeof dataErr === 'object' ? JSON.stringify(dataErr) : dataErr ?? err.message}`);
        setLoading(false);
        return;
      }

      const reservasData: Reserva[] = reservasRes.data || [];
      setReservas(reservasData);

      // Cargar servicios para cada reserva
      const serviciosMap: Record<number, ReservaServicio[]> = {};
      const serviciosSet = new Set<number>();
      
      for (const reserva of reservasData) {
        try {
          const serviciosRes = await getReservaServiciosByReserva(reserva.id, token);
          serviciosMap[reserva.id] = serviciosRes.data || [];
          
          // Recolectar IDs únicos de servicios
          (serviciosRes.data || []).forEach((rs: ReservaServicio) => {
            if (rs.servicio?.id) serviciosSet.add(rs.servicio.id);
          });
        } catch (err) {
          console.warn(`Error cargando servicios de reserva ${reserva.id}:`, err);
          serviciosMap[reserva.id] = [];
        }
      }
      
      setReservaServicios(serviciosMap);

      // Cargar información de servicios únicos
      if (serviciosSet.size > 0) {
        try {
          const serviciosRes = await getAllServicios(token);
          const todosServicios: Servicio[] = serviciosRes.data || [];
          const serviciosFiltrados = todosServicios.filter(s => serviciosSet.has(s.id));
          setServiciosUnicos(serviciosFiltrados);
        } catch (e) {
          console.warn('No se pudieron cargar los servicios:', e);
        }
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Error cargando dashboard');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Conexión WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    if (!token || !clienteId || rol !== 'cliente') return;

    const socket = getSocket();
    let isConnected = false;

    const setupWebSocket = async () => {
      try {
        // Autenticar socket
        await authenticateSocket({
          token,
          userId: clienteId.toString(),
          role: 'cliente',
        });

        // Unirse a la sala del cliente
        socket.emit('join_room', { roomName: `cliente_${clienteId}` });

        // Escuchar eventos de reservas
        socket.on('reservation_accepted', (data: any) => {
          console.log('Reserva aceptada:', data);
          // Recargar datos para reflejar cambios
          loadData();
        });

        socket.on('reservation_created', (data: any) => {
          console.log('Nueva reserva creada:', data);
          if (data.data?.cliente === clienteId || data.data?.cliente_id === clienteId) {
            loadData();
          }
        });

        socket.on('payment_created', (data: any) => {
          console.log('Pago creado:', data);
          if (data.data?.cliente_id === clienteId) {
            loadData();
          }
        });

        // Escuchar eventos generales de la sala del cliente
        socket.on('event', (eventData: any) => {
          console.log('Evento recibido:', eventData);
          if (eventData.type === 'reservation_accepted' || eventData.type === 'reservation_updated') {
            loadData();
          }
        });

        isConnected = true;
      } catch (error) {
        console.error('Error conectando WebSocket:', error);
      }
    };

    setupWebSocket();

    return () => {
      if (isConnected) {
        socket.off('reservation_accepted');
        socket.off('reservation_created');
        socket.off('payment_created');
        socket.off('event');
      }
    };
  }, [token, clienteId, rol, loadData]);

  const totalPendientes = reservas.filter(r => r.estado === 'pendiente').length;
  const totalConfirmadas = reservas.filter(r => r.estado === 'confirmada').length;
  const totalCanceladas = reservas.filter(r => r.estado === 'cancelada').length;
  const totalGastado = reservas
    .filter(r => r.estado === 'confirmada')
    .reduce((acc, r) => acc + (Number(r.total_estimado) || 0), 0);
  const totalPendientePago = reservas
    .filter(r => r.estado === 'pendiente')
    .reduce((acc, r) => acc + (Number(r.total_estimado) || 0), 0);

  const pill = (text: string, color: string) => (
    <span style={{
      display: 'inline-block',
      padding: '0.15rem 0.5rem',
      borderRadius: '999px',
      background: color,
      color: '#fff',
      fontSize: '0.75rem',
      fontWeight: 600,
    }}>{text}</span>
  );

  const statusPill = (estado: Reserva['estado']) => {
    if (estado === 'pendiente') return pill('Pendiente', '#ff9800');
    if (estado === 'confirmada') return pill('Confirmada', '#4caf50');
    return pill('Cancelada', '#f44336');
  };

  const card: React.CSSProperties = {
    background: '#1f1f1f',
    border: '1px solid #2c2c2c',
    borderRadius: 12,
    padding: '1rem',
  };

  const h2Style: React.CSSProperties = { margin: 0, marginBottom: '0.25rem' };
  const subtitle: React.CSSProperties = { color: '#a7a7a7', marginBottom: '1rem' };

  const buttonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: 'none',
    background: '#4caf50',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
    marginTop: '0.5rem',
  };

  if (loading) return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h2 style={h2Style}>Dashboard Cliente</h2>
      <p style={subtitle}>Cargando...</p>
    </div>
  );
  if (error) return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h2 style={h2Style}>Dashboard Cliente</h2>
      <p style={{ color: '#f44336' }}>{error}</p>
      <div style={{ marginTop: 12 }}>
        <button style={buttonStyle} onClick={() => { setLoading(true); setError(null); loadData(); }}>🔁 Reintentar</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h2 style={h2Style}>Dashboard Cliente</h2>
      <p style={subtitle}>Resumen de tus reservas y servicios</p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={card}>
          <div style={{ color: '#a7a7a7', fontSize: 12 }}>Reservas pendientes</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totalPendientes}</div>
        </div>
        <div style={card}>
          <div style={{ color: '#a7a7a7', fontSize: 12 }}>Reservas confirmadas</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totalConfirmadas}</div>
        </div>
        <div style={card}>
          <div style={{ color: '#a7a7a7', fontSize: 12 }}>Total gastado</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>${totalGastado.toFixed(2)}</div>
        </div>
        <div style={card}>
          <div style={{ color: '#a7a7a7', fontSize: 12 }}>Pendiente de pago</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>${totalPendientePago.toFixed(2)}</div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Mis Reservas Recientes</h3>
          {reservas.length === 0 ? (
            <div>
              <p style={{ color: '#a7a7a7' }}>No tienes reservas aún.</p>
              <button 
                style={buttonStyle}
                onClick={() => navigate('/servicios/reserva/form')}
              >
                Crear nueva reserva
              </button>
            </div>
          ) : (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ color: '#a7a7a7', borderBottom: '1px solid #2c2c2c' }}>
                    <th style={{ textAlign: 'left', padding: '0.25rem 0' }}>Reserva</th>
                    <th style={{ textAlign: 'left', padding: '0.25rem 0' }}>Fecha</th>
                    <th style={{ textAlign: 'left', padding: '0.25rem 0' }}>Hora</th>
                    <th style={{ textAlign: 'left', padding: '0.25rem 0' }}>Total</th>
                    <th style={{ textAlign: 'left', padding: '0.25rem 0' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas
                    .sort((a, b) => new Date(b.fecha + 'T' + b.hora).getTime() - new Date(a.fecha + 'T' + a.hora).getTime())
                    .slice(0, 8)
                    .map(r => (
                    <tr 
                      key={r.id} 
                      style={{ borderBottom: '1px solid #2c2c2c', cursor: 'pointer' }}
                      onClick={() => navigate(`/servicios/reserva-list/reservados/${r.id}`)}
                    >
                      <td style={{ padding: '0.35rem 0' }}>#{r.id}</td>
                      <td style={{ padding: '0.35rem 0' }}>{r.fecha}</td>
                      <td style={{ padding: '0.35rem 0' }}>{r.hora}</td>
                      <td style={{ padding: '0.35rem 0' }}>${r.total_estimado}</td>
                      <td style={{ padding: '0.35rem 0' }}>{statusPill(r.estado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                style={buttonStyle}
                onClick={() => navigate('/servicios/reserva-list')}
              >
                Ver todas las reservas
              </button>
            </div>
          )}
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Estadísticas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ color: '#a7a7a7', fontSize: 14, marginBottom: '0.25rem' }}>Total de reservas</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{reservas.length}</div>
            </div>
            <div>
              <div style={{ color: '#a7a7a7', fontSize: 14, marginBottom: '0.25rem' }}>Reservas canceladas</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#f44336' }}>{totalCanceladas}</div>
            </div>
            <div>
              <div style={{ color: '#a7a7a7', fontSize: 14, marginBottom: '0.25rem' }}>Servicios reservados</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{serviciosUnicos.length}</div>
            </div>
            <div>
              <div style={{ color: '#a7a7a7', fontSize: 14, marginBottom: '0.25rem' }}>Promedio por reserva</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                ${reservas.length > 0 
                  ? (reservas.reduce((acc, r) => acc + (Number(r.total_estimado) || 0), 0) / reservas.length).toFixed(2)
                  : '0.00'
                }
              </div>
            </div>
          </div>
          <button 
            style={{...buttonStyle, background: '#2196f3', width: '100%'}}
            onClick={() => navigate('/todos-servicios')}
          >
            Explorar servicios
          </button>
        </div>
      </section>

      {serviciosUnicos.length > 0 && (
        <section style={card}>
          <h3 style={{ marginTop: 0 }}>Servicios Reservados</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
            {serviciosUnicos.slice(0, 6).map((servicio: Servicio) => (
              <div 
                key={servicio.id}
                style={{
                  padding: '0.75rem',
                  background: '#2c2c2c',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/todos-servicios/${servicio.id}`)}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {servicio.nombre_servicio}
                </div>
                <div style={{ color: '#a7a7a7', fontSize: 13 }}>
                  {servicio.descripcion?.substring(0, 80)}...
                </div>
                {servicio.rating_promedio && (
                  <div style={{ marginTop: '0.5rem', color: '#ffc107' }}>
                    ⭐ {servicio.rating_promedio.toFixed(1)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

