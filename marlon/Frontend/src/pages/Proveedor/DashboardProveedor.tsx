import { useEffect, useMemo, useState, useCallback } from 'react';
import { getUsers } from '../../api/usersApi';
import { getServicioByProveedor } from '../../api/servicio';
// import { getAllReservas } from '../../api/reserva';
import { getReservaServiciosByProveedor, updateReservaServicio } from '../../api/reservaServicio';
import { getSocket, authenticateSocket } from '../../websocket/socket';

type Rol = 'cliente' | 'proveedor' | 'admin' | null;

interface Servicio {
  id: number;
  nombre_servicio: string;
  descripcion: string;
  duracion?: string;
  rating_promedio?: number;
}

interface Reserva {
  id: number;
  fecha: string;
  hora: string;
  total_estimado: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'rechazada';
  servicio: number; // servicio_id
  cliente: number; // cliente_id
  reserva_servicio_id?: number;
}

export default function DashboardProveedor() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rol, setRol] = useState<Rol>(null);
  const [proveedorId, setProveedorId] = useState<number | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);

  const token = useMemo(() => localStorage.getItem('token') || '', []);

  // Función para cargar datos (mejor manejo de errores para depuración)
  const loadData = useCallback(async () => {
    try {
      if (!token) {
        setError('No hay token. Inicia sesión.');
        setLoading(false);
        return;
      }

      // Obtener perfil (auth-service o Django según el token)
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
      if (data.rol !== 'proveedor') {
        setError('Este panel es solo para proveedores.');
        setLoading(false);
        return;
      }

      setProveedorId(data.id);

      // Cargar servicios y reservas en paralelo con manejo de errores individual
      let servRes: any, rsByProveedor: any;
      try {
        [servRes, rsByProveedor] = await Promise.all([
          getServicioByProveedor(data.id, token),
          getReservaServiciosByProveedor(data.id, token),
        ]);
      } catch (err: any) {
        console.error('Error cargando servicios o reservas:', err);
        const status = err?.response?.status;
        const dataErr = err?.response?.data;
        setError(`Error cargando datos: ${status ?? ''} ${typeof dataErr === 'object' ? JSON.stringify(dataErr) : dataErr ?? err.message}`);
        setLoading(false);
        return;
      }

      const svc: Servicio[] = servRes.data || [];
      setServicios(svc);

      // Mapear los ReservaServicio a un formato de reserva simplificado para mostrar
      const rsList = (rsByProveedor.data || []).map((rs: any) => ({
        id: rs.reserva?.id ?? rs.id,
        reserva_servicio_id: rs.id,
        fecha: rs.reserva?.fecha ?? rs.fecha_servicio,
        hora: rs.reserva?.hora ?? rs.hora_servicio,
        total_estimado: rs.reserva?.total_estimado ?? 0,
        estado: rs.estado,
        servicio: rs.servicio?.id ?? rs.servicio_id,
        reserva_obj: rs.reserva,
      }));

      setReservas(rsList);
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

  const handleChangeEstado = async (reservaServicioId: number, nuevoEstado: string) => {
    if (!token) return;
  try {
  await updateReservaServicio(reservaServicioId, { estado: nuevoEstado } as any, token);
      // refrescar datos
      await loadData();
    } catch (err: any) {
      console.error('Error cambiando estado:', err);
      alert(`No se pudo cambiar el estado: ${err?.response?.status ?? ''} ${typeof err?.response?.data === 'object' ? JSON.stringify(err.response.data) : err?.response?.data ?? err.message}`);
    }
  };

  // Conexión WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    if (!token || !proveedorId || rol !== 'proveedor') return;

    const socket = getSocket();
    let isConnected = false;

    const setupWebSocket = async () => {
      try {
        // Autenticar socket
        await authenticateSocket({
          token,
          userId: proveedorId.toString(),
          role: 'proveedor',
        });

        // Unirse a la sala del proveedor
        socket.emit('join_room', { roomName: `proveedor_${proveedorId}` });

        // Escuchar eventos de reservas
        socket.on('reservation_created', (data: any) => {
          console.log('Nueva reserva creada:', data);
          if (data.data?.proveedorId === proveedorId || data.data?.proveedor_id === proveedorId) {
            loadData();
          }
        });

        socket.on('payment_created', (data: any) => {
          console.log('Pago creado:', data);
          if (data.data?.proveedorId === proveedorId || data.data?.proveedor_id === proveedorId) {
            loadData();
          }
        });

        socket.on('comment_created', (data: any) => {
          console.log('Comentario creado:', data);
          if (data.data?.proveedorId === proveedorId || data.data?.proveedor_id === proveedorId) {
            loadData();
          }
        });

        // Escuchar eventos generales de la sala del proveedor
        socket.on('event', (eventData: any) => {
          console.log('Evento recibido:', eventData);
          if (eventData.type === 'reservation_created' || 
              eventData.type === 'payment_created' || 
              eventData.type === 'comment_created') {
            if (eventData.data?.proveedorId === proveedorId || 
                eventData.data?.proveedor_id === proveedorId) {
              loadData();
            }
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
        socket.off('reservation_created');
        socket.off('payment_created');
        socket.off('comment_created');
        socket.off('event');
      }
    };
  }, [token, proveedorId, rol, loadData]);

  const totalPendientes = reservas.filter(r => r.estado === 'pendiente').length;
  const totalConfirmadas = reservas.filter(r => r.estado === 'confirmada').length;
  const ingresoEstimado = reservas
    .filter(r => r.estado !== 'cancelada')
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

  if (loading) return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h2 style={h2Style}>Dashboard Proveedor</h2>
      <p style={subtitle}>Cargando...</p>
    </div>
  );
  if (error) return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h2 style={h2Style}>Dashboard Proveedor</h2>
      <p style={{ color: '#f44336' }}>{error}</p>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => { setLoading(true); setError(null); loadData(); }}>🔁 Reintentar</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h2 style={h2Style}>Dashboard Proveedor</h2>
      <p style={subtitle}>Resumen de tu negocio</p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={card}>
          <div style={{ color: '#a7a7a7', fontSize: 12 }}>Servicios publicados</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{servicios.length}</div>
        </div>
        <div style={card}>
          <div style={{ color: '#a7a7a7', fontSize: 12 }}>Reservas pendientes</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totalPendientes}</div>
        </div>
        <div style={card}>
          <div style={{ color: '#a7a7a7', fontSize: 12 }}>Reservas confirmadas</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totalConfirmadas}</div>
        </div>
        <div style={card}>
          <div style={{ color: '#a7a7a7', fontSize: 12 }}>Ingreso estimado</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>${ingresoEstimado}</div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Mis Servicios</h3>
          {servicios.length === 0 ? (
            <p style={{ color: '#a7a7a7' }}>No tienes servicios registrados.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {servicios.map(s => (
                <li key={s.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #2c2c2c' }}>
                  <div style={{ fontWeight: 600 }}>{s.nombre_servicio}</div>
                  <div style={{ color: '#a7a7a7', fontSize: 13 }}>{s.descripcion}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Reservas recientes</h3>
          {reservas.length === 0 ? (
            <p style={{ color: '#a7a7a7' }}>No tienes reservas aún.</p>
          ) : (
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
                {reservas.slice(0, 12).map(r => (
                  <tr key={r.reserva_servicio_id ?? r.id} style={{ borderBottom: '1px solid #2c2c2c' }}>
                    <td style={{ padding: '0.35rem 0' }}>#{r.id}</td>
                    <td style={{ padding: '0.35rem 0' }}>{r.fecha}</td>
                    <td style={{ padding: '0.35rem 0' }}>{r.hora}</td>
                    <td style={{ padding: '0.35rem 0' }}>${r.total_estimado}</td>
                    <td style={{ padding: '0.35rem 0' }}>{statusPill(r.estado)}</td>
                    <td style={{ padding: '0.35rem 0' }}>
                      {r.estado === 'pendiente' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleChangeEstado(r.reserva_servicio_id ?? r.id, 'confirmada')}>Aceptar</button>
                          <button onClick={() => handleChangeEstado(r.reserva_servicio_id ?? r.id, 'rechazada')}>Rechazar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
