import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

type Role = 'cliente' | 'proveedor' | 'admin';

interface DashboardMetrics {
  activeConnections: number;
  totalConnections: number;
  eventsEmitted: number;
  roomsCreated: number;
}

interface DashboardSummary {
  metrics: DashboardMetrics;
  clients: { total: number; byRole: Record<Role, number> };
  rooms: { total: number; totalClients: number };
  system: { uptime: number; nodeVersion: string };
}

interface ClientItem {
  userId: string;
  role: Role;
  socketId: string;
  connectedAt: string;
  lastActivity: string;
}

interface RoomItem {
  name: string;
  clients: number;
}

interface EventItem {
  type: string;
  payload: any;
  timestamp: string;
}

const CANDIDATE_BASE_URLS = [
  'http://localhost:4000',
  'http://127.0.0.1:4000',
];

function createApi(baseURL: string) {
  return axios.create({ baseURL, timeout: 4000, withCredentials: true });
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseUrlUsed, setBaseUrlUsed] = useState<string | null>(null);

  const fetchAll = useMemo(() => async () => {
    setError(null);
    try {
      let api: ReturnType<typeof createApi> | null = null;
      let lastErr: any = null;
      for (const baseURL of CANDIDATE_BASE_URLS) {
        try {
          const candidate = createApi(baseURL);
          // Probe endpoint ligero
          await candidate.get('/dashboard');
          api = candidate;
          setBaseUrlUsed(baseURL);
          break;
        } catch (e) {
          lastErr = e;
          continue;
        }
      }

      if (!api) {
        throw lastErr || new Error('No se pudo conectar a ninguna URL base');
      }

      const results = await Promise.allSettled([
        api.get('/dashboard'),
        api.get('/dashboard/clients'),
        api.get('/dashboard/rooms'),
        api.get('/dashboard/events'),
        api.get('/dashboard/api-status'),
      ]);

      const getData = (idx: number) => results[idx].status === 'fulfilled' ? (results[idx] as PromiseFulfilledResult<any>).value.data : null;

      const summaryData = getData(0);
      const clientsData = getData(1);
      const roomsData = getData(2);
      const eventsData = getData(3);
      const apiStatusData = getData(4);

      if (summaryData) setSummary(summaryData);
      if (clientsData) setClients(clientsData?.clients || clientsData || []);
      if (roomsData) setRooms(roomsData?.rooms || roomsData || []);
      if (eventsData) setEvents(eventsData?.events || eventsData || []);
      if (apiStatusData) setApiStatus(apiStatusData);

      const rejected = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
      if (rejected.length > 0) {
        // Mostrar solo un resumen del primer error para no ensuciar la UI
        const reason: any = rejected[0].reason;
        const msg = reason?.response?.status
          ? `Algunos datos no cargaron (HTTP ${reason.response.status})`
          : 'Algunos datos no cargaron (bloqueados por navegador o red)';
        // No bloquear la vista por esto, solo mostrar aviso en consola
        console.warn('Dashboard parcial:', rejected);
        setError(prev => prev || msg);
      }
    } catch (e: any) {
      const msg = e?.response?.status
        ? `HTTP ${e.response.status} ${e.response.statusText}`
        : (e?.message || 'Error cargando dashboard');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => clearInterval(id);
  }, [fetchAll]);

  if (loading) return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h2>Dashboard en tiempo real</h2>
      <p>Cargando dashboard...</p>
      <p>Tip: prueba abrir <a href="http://localhost:4000/dashboard.html" target="_blank" rel="noreferrer" style={{ color: '#8ab4f8' }}>dashboard del servidor</a> para verificar conexión.</p>
      <p>Si tarda demasiado, el servidor en 4000 podría no estar encendido.</p>
    </div>
  );
  if (error) return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h2>Dashboard en tiempo real</h2>
      <p style={{ color: '#ff6b6b' }}>Error: {error}</p>
      <p>
        Tip: abre <a href="http://localhost:4000/dashboard.html" target="_blank" rel="noreferrer" style={{ color: '#8ab4f8' }}>dashboard del servidor</a> y confirma que el servidor en 4000 esté activo.
      </p>
      <button onClick={() => { setLoading(true); fetchAll(); }} style={{ marginTop: '0.5rem' }}>Reintentar</button>
    </div>
  );

  return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h2>Dashboard en tiempo real</h2>
      <p>Base usada: {baseUrlUsed || 'detectando...'}</p>
      <p>Ver servidor: <a href={`${(baseUrlUsed ?? 'http://localhost:4000')}/dashboard.html`} target="_blank" rel="noreferrer" style={{ color: '#8ab4f8' }}>dashboard.html</a></p>

      {summary && (
        <section style={{ marginBottom: '1rem' }}>
          <h3>Resumen</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            <div>
              <strong>Conexiones activas:</strong>
              <div>{summary.metrics.activeConnections}</div>
            </div>
            <div>
              <strong>Total conexiones:</strong>
              <div>{summary.metrics.totalConnections}</div>
            </div>
            <div>
              <strong>Eventos emitidos:</strong>
              <div>{summary.metrics.eventsEmitted}</div>
            </div>
            <div>
              <strong>Salas creadas:</strong>
              <div>{summary.metrics.roomsCreated}</div>
            </div>
          </div>
        </section>
      )}

      <section style={{ marginBottom: '1rem' }}>
        <h3>Clientes conectados ({clients.length})</h3>
        {clients.length === 0 ? (
          <p>Sin clientes conectados.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>User ID</th>
                <th style={{ textAlign: 'left' }}>Rol</th>
                <th style={{ textAlign: 'left' }}>Socket</th>
                <th style={{ textAlign: 'left' }}>Conectado</th>
                <th style={{ textAlign: 'left' }}>Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.socketId}>
                  <td>{c.userId}</td>
                  <td>{c.role}</td>
                  <td>{c.socketId}</td>
                  <td>{new Date(c.connectedAt).toLocaleString()}</td>
                  <td>{new Date(c.lastActivity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h3>Salas activas ({rooms.length})</h3>
        {rooms.length === 0 ? (
          <p>Sin salas.</p>
        ) : (
          <ul>
            {rooms.map((r) => (
              <li key={r.name}>{r.name} — {r.clients} clientes</li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h3>Eventos recientes</h3>
        {events.length === 0 ? (
          <p>Sin eventos.</p>
        ) : (
          <ul>
            {events.slice(0, 20).map((e, idx) => (
              <li key={idx}>
                <strong>{e.type}</strong> — {new Date(e.timestamp).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Estado de la API Django</h3>
        <pre style={{ background: '#f7f7f7', padding: '0.5rem', overflow: 'auto' }}>
{JSON.stringify(apiStatus, null, 2)}
        </pre>
      </section>
    </div>
  );
}