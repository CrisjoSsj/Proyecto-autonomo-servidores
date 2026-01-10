import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/user/Navbar";
import PiePagina from "../../components/user/PiePagina";
import { MesasMap } from "../../components/user/MesasMap";
import { wsService } from "../../services/WebSocketService";
import { apiService } from "../../services/ApiService";
import type { Mesa, PersonaFila, Reserva } from "../../types";
import "../../css/user/FilaVirtual.css";

export default function FilaVirtual() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cola, setCola] = useState<PersonaFila[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    numeroPersonas: 2
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const cargarMesas = useCallback(async () => {
    try {
      const data = await apiService.getMesas();
      
      try {
        const reservas: Reserva[] = await apiService.getReservas();
        const hoy = new Date();
        const mesaConReserva = new Set<number>();
        
        reservas.forEach((res) => {
          if (res.estado === 'confirmada' && res.fecha === hoy.toISOString().split('T')[0]) {
            mesaConReserva.add(res.id_mesa);
          }
        });
        
        const mesasActualizadas: Mesa[] = (data || []).map((mesa) => ({
          ...mesa,
          estado: mesaConReserva.has(mesa.numero) ? 'reservada' as const : mesa.estado
        }));
        
        setMesas(mesasActualizadas);
      } catch {
        setMesas(data || []);
      }
    } catch (error) {
      console.error('Error al cargar mesas:', error);
    }
  }, []);

  const cargarCola = useCallback(async () => {
    try {
      const data = await apiService.getFilaVirtual();
      setCola(data || []);
    } catch (error) {
      console.error('Error al cargar cola:', error);
    }
  }, []);

  useEffect(() => {
    wsService.connect();
    cargarMesas();
    cargarCola();

    const unsubscribeMesas = wsService.subscribe('mesas', () => {
      cargarMesas();
    });

    const unsubscribeFila = wsService.subscribe('fila_virtual', () => {
      cargarCola();
    });

    return () => {
      unsubscribeMesas();
      unsubscribeFila();
    };
  }, [cargarMesas, cargarCola]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numeroPersonas' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMensaje(null);
    
    try {
      const payload = {
        cliente_id: Math.floor(Math.random() * 1000),
        ...formData,
        hora_llegada: new Date().toISOString(),
        estado: 'esperando'
      };

      const data = await apiService.unirseFilaVirtual(payload);

      if (data) {
        setMensaje({ tipo: 'exito', texto: '¡Te has unido a la cola virtual! Te notificaremos cuando sea tu turno.' });
        setFormData({ nombre: '', telefono: '', numeroPersonas: 2 });
        cargarCola();
      }
    } catch (error) {
      console.error('Error al unirse a la cola:', error);
      setMensaje({ tipo: 'error', texto: 'Error al unirse a la cola. Por favor intenta de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const mesasDisponibles = mesas.filter(m => m.estado.toLowerCase() === 'disponible').length;
  const mesasOcupadas = mesas.filter(m => m.estado.toLowerCase() === 'ocupada').length;

  return (
    <div className="page-wrapper">
      <Navbar />
      
      {/* Hero Section */}
      <section className="fila-hero">
        <div className="fila-hero-overlay"></div>
        <div className="fila-hero-content">
          <p className="fila-hero-tagline">En Tiempo Real</p>
          <h1 className="fila-hero-title">Fila Virtual</h1>
          <p className="fila-hero-subtitle">
            Consulta la disponibilidad y únete a la cola de espera desde cualquier lugar
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="fila-stats">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-indicator live"></span>
            <span className="stat-text">Conectado en tiempo real</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">{mesasDisponibles}</span>
            <span className="stat-label">Mesas Disponibles</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">{mesasOcupadas}</span>
            <span className="stat-label">Mesas Ocupadas</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">{cola.length}</span>
            <span className="stat-label">En Cola</span>
          </div>
        </div>
      </section>

      {/* Mapa de Mesas */}
      <section className="fila-mesas">
        <div className="section-container">
          <div className="section-header">
            <p className="section-tagline">Vista en Vivo</p>
            <h2 className="section-title">Estado del Restaurante</h2>
            <div className="section-divider"></div>
          </div>
          
          <MesasMap mesas={mesas} />
        </div>
      </section>

      {/* Cola de Espera */}
      <section className="fila-cola">
        <div className="section-container">
          <div className="cola-layout">
            {/* Formulario */}
            <div className="cola-form-wrapper">
              <div className="cola-form-card">
                <header className="cola-form-header">
                  <h2 className="cola-form-title">Únete a la Cola</h2>
                  <p className="cola-form-subtitle">Te notificaremos cuando sea tu turno</p>
                </header>

                {mensaje && (
                  <div className={`mensaje ${mensaje.tipo}`}>
                    {mensaje.texto}
                  </div>
                )}

                <form className="cola-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <input 
                      type="text" 
                      name="nombre"
                      className="form-input" 
                      placeholder="Ingresa tu nombre" 
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input 
                      type="tel" 
                      name="telefono"
                      className="form-input" 
                      placeholder="099-123-4567"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Número de Personas</label>
                    <select 
                      name="numeroPersonas"
                      className="form-select"
                      value={formData.numeroPersonas}
                      onChange={handleInputChange}
                    >
                      <option value="2">2 personas</option>
                      <option value="3">3 personas</option>
                      <option value="4">4 personas</option>
                      <option value="5">5 personas</option>
                      <option value="6">6 personas</option>
                      <option value="8">8+ personas</option>
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Procesando...' : 'Unirse a la Cola'}
                  </button>
                </form>

                {cola.length > 0 && (
                  <p className="cola-estimate">
                    Si te unes ahora, serías el <strong>#{cola.length + 1}</strong> con un tiempo estimado de <strong>{(cola.length + 1) * 15} min</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Lista de Cola */}
            <div className="cola-list-wrapper">
              <div className="cola-list-card">
                <header className="cola-list-header">
                  <h3 className="cola-list-title">Cola Actual</h3>
                  <span className="cola-count">{cola.length} en espera</span>
                </header>

                <div className="cola-list">
                  {cola.length > 0 ? (
                    cola.map((persona, index) => (
                      <div key={persona.id ?? `cola-${index}`} className="cola-item">
                        <span className="cola-position">#{index + 1}</span>
                        <div className="cola-info">
                          <span className="cola-name">{persona.nombre}</span>
                          <span className="cola-details">{persona.numeroPersonas} personas • ~{(index + 1) * 15} min</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="cola-empty">
                      <span className="material-symbols-outlined">groups</span>
                      <p>No hay personas en cola</p>
                      <span>¡Sé el primero en unirte!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Card */}
              <div className="cola-info-card">
                <h4 className="cola-info-title">
                  <span className="material-symbols-outlined">notifications</span>
                  Cómo Funciona
                </h4>
                <ul className="cola-info-list">
                  <li>
                    <span className="material-symbols-outlined">sms</span>
                    SMS cuando falten 10 min
                  </li>
                  <li>
                    <span className="material-symbols-outlined">check_circle</span>
                    Notificación cuando tu mesa esté lista
                  </li>
                  <li>
                    <span className="material-symbols-outlined">timer</span>
                    15 min para confirmar tu llegada
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tiempos Estimados */}
      <section className="fila-tiempos">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Tiempos Promedio de Espera</h2>
            <div className="section-divider"></div>
          </div>

          <div className="tiempos-grid">
            <div className="tiempo-card">
              <span className="tiempo-icon">
                <span className="material-symbols-outlined">group</span>
              </span>
              <span className="tiempo-tipo">Mesa para 2</span>
              <span className="tiempo-valor">15-25 min</span>
              <span className="tiempo-estado available">
                {mesas.filter(m => m.capacidad <= 2 && m.estado === 'disponible').length > 0 ? 'Disponible' : 'En espera'}
              </span>
            </div>
            <div className="tiempo-card">
              <span className="tiempo-icon">
                <span className="material-symbols-outlined">groups</span>
              </span>
              <span className="tiempo-tipo">Mesa para 4</span>
              <span className="tiempo-valor">25-40 min</span>
              <span className="tiempo-estado waiting">
                {mesas.filter(m => m.capacidad === 4 && m.estado === 'disponible').length > 0 ? 'Disponible' : 'En espera'}
              </span>
            </div>
            <div className="tiempo-card">
              <span className="tiempo-icon">
                <span className="material-symbols-outlined">diversity_3</span>
              </span>
              <span className="tiempo-tipo">Mesa para 6+</span>
              <span className="tiempo-valor">45-60 min</span>
              <span className="tiempo-estado waiting">
                {mesas.filter(m => m.capacidad >= 6 && m.estado === 'disponible').length > 0 ? 'Disponible' : 'En espera'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <PiePagina />
    </div>
  );
}
