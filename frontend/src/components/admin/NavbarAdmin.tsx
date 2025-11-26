import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { authService, User } from "../../services/AuthService";
import { wsService } from "../../services/WebSocketService";
import "../../css/admin/NavbarAdmin.css";

interface Notificacion {
  id: string;
  tipo: 'reserva_confirmada' | 'reserva_rechazada' | 'reserva_pendiente' | 'reserva_nueva' | 'reserva_actualizada' | 'reserva_cancelada' | 'fila_nueva_entrada' | 'fila_salida' | 'mesa_actualizada';
  mensaje: string;
  datos?: any;
  timestamp: string; // Cambiar a string para JSON
  leida: boolean;
}

const elementosNavegacionAdmin = [
  { nombre: "Dashboard", ruta: "/admin" },
  { nombre: "Mesas", ruta: "/admin/mesas" },
  { nombre: "Reservas", ruta: "/admin/reservas" },
  { nombre: "Menú", ruta: "/admin/menu" },
  { nombre: "Reportes", ruta: "/admin/reportes" },
];

// Utilidades para localStorage
const NOTIFICACIONES_STORAGE_KEY = 'notificaciones_admin';

const guardarNotificacionesEnStorage = (notifs: Notificacion[]) => {
  try {
    localStorage.setItem(NOTIFICACIONES_STORAGE_KEY, JSON.stringify(notifs));
  } catch (error) {
    console.error('Error al guardar notificaciones:', error);
  }
};

const cargarNotificacionesDelStorage = (): Notificacion[] => {
  try {
    const stored = localStorage.getItem(NOTIFICACIONES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
    return [];
  }
};

export default function NavbarAdmin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);

  // Cargar notificaciones del localStorage al montar
  useEffect(() => {
    const notificacionesGuardadas = cargarNotificacionesDelStorage();
    setNotificaciones(notificacionesGuardadas);
  }, []);

  // Guardar notificaciones en localStorage cuando cambien
  useEffect(() => {
    guardarNotificacionesEnStorage(notificaciones);
  }, [notificaciones]);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);

    // Conectar WebSocket y suscribirse a notificaciones
    wsService.connect();
    
    // Escuchar cambios de reservas
    const unsubscribeReservas = wsService.subscribe('reservas', (message) => {
      let notificacion: Notificacion | null = null;

      if (message.action === 'nueva_reserva') {
        notificacion = {
          id: `notif-${Date.now()}-${Math.random()}`,
          tipo: 'reserva_nueva',
          mensaje: `Nueva reserva: ${message.data?.reserva?.nombre || message.data?.reserva?.id_cliente || 'Cliente desconocido'} - ${message.data?.reserva?.hora_inicio || ''}`,
          datos: message.data?.reserva,
          timestamp: new Date().toISOString(),
          leida: false
        };
      } else if (message.action === 'reserva_actualizada') {
        notificacion = {
          id: `notif-${Date.now()}-${Math.random()}`,
          tipo: 'reserva_actualizada',
          mensaje: `Reserva actualizada: ${message.data?.reserva?.nombre || 'Reserva'} - Estado: ${message.data?.reserva?.estado || ''}`,
          datos: message.data?.reserva,
          timestamp: new Date().toISOString(),
          leida: false
        };
      } else if (message.action === 'reserva_cancelada') {
        notificacion = {
          id: `notif-${Date.now()}-${Math.random()}`,
          tipo: 'reserva_cancelada',
          mensaje: `Reserva cancelada: ID ${message.data?.id_reserva}`,
          datos: message.data,
          timestamp: new Date().toISOString(),
          leida: false
        };
      }

      if (notificacion) {
        setNotificaciones(prev => [notificacion, ...prev].slice(0, 20)); // Mantener últimas 20
      }
    });

    // Escuchar cambios de fila virtual
    const unsuscribeFilaVirtual = wsService.subscribe('fila_virtual', (message) => {
      let notificacion: Notificacion | null = null;

      if (message.action === 'nueva_entrada') {
        notificacion = {
          id: `notif-${Date.now()}-${Math.random()}`,
          tipo: 'fila_nueva_entrada',
          mensaje: `Nueva entrada en fila: ${message.data?.persona?.nombre || 'Cliente'} - ${message.data?.persona?.numeroPersonas || 0} personas`,
          datos: message.data?.persona,
          timestamp: new Date().toISOString(),
          leida: false
        };
      } else if (message.action === 'salida_fila') {
        notificacion = {
          id: `notif-${Date.now()}-${Math.random()}`,
          tipo: 'fila_salida',
          mensaje: `Salida de fila: ID ${message.data?.id}`,
          datos: message.data,
          timestamp: new Date().toISOString(),
          leida: false
        };
      }

      if (notificacion) {
        setNotificaciones(prev => [notificacion, ...prev].slice(0, 20)); // Mantener últimas 20
      }
    });

    return () => {
      unsubscribeReservas();
      unsuscribeFilaVirtual();
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  return (
    <nav className="barra-navegacion-admin">
      <div className="contenedor-navegacion-admin">
        {/* Logo y título del admin */}
        <div className="logo-admin">
          <Link to="/admin" className="enlace-logo-admin">
            <h2 className="titulo-admin">Chuwue Grill Admin</h2>
          </Link>
        </div>

        {/* Menú de navegación admin */}
        <div className="menu-navegacion-admin">
          {elementosNavegacionAdmin.map((elemento) => (
            <Link 
              key={elemento.ruta} 
              to={elemento.ruta} 
              className="enlace-navegacion-admin"
            >
              {elemento.nombre}
            </Link>
          ))}
        </div>

        {/* Información del admin y acciones */}
        <div className="seccion-admin-info">
          <div className="info-sesion">
            <span className="nombre-admin">{user?.name || 'Admin'}</span>
            <span className="rol-admin">{user?.email || 'Administrador'}</span>
          </div>
          <div className="botones-admin">
            {/* Botón de notificaciones con dropdown */}
            <div className="contenedor-notificaciones">
              <button 
                className="boton-notificaciones" 
                title="Notificaciones"
                onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
              >
                <span className="material-symbols-outlined">notifications</span>
                {notificaciones.length > 0 && (
                  <span className="contador-notificaciones">
                    {notificaciones.length > 9 ? '9+' : notificaciones.length}
                  </span>
                )}
              </button>

              {/* Dropdown de notificaciones */}
              {mostrarNotificaciones && (
                <div className="dropdown-notificaciones">
                  <div className="header-notificaciones">
                    <h3>Notificaciones</h3>
                    {notificaciones.length > 0 && (
                      <button 
                        className="boton-limpiar"
                        onClick={() => setNotificaciones([])}
                        title="Limpiar todas"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  
                  {notificaciones.length === 0 ? (
                    <div className="sin-notificaciones">
                      <p>No hay notificaciones</p>
                    </div>
                  ) : (
                    <div className="lista-notificaciones">
                      {notificaciones.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`item-notificacion ${notif.tipo} ${!notif.leida ? 'no-leida' : ''}`}
                          onClick={() => {
                            setNotificaciones(prev => 
                              prev.map(n => n.id === notif.id ? { ...n, leida: true } : n)
                            );
                          }}
                        >
                          <div className="icono-notif">
                            {(notif.tipo === 'reserva_confirmada' || notif.tipo === 'reserva_nueva') && (
                              <span className="material-symbols-outlined" style={{ color: '#4caf50' }}>
                                check_circle
                              </span>
                            )}
                            {notif.tipo === 'reserva_rechazada' && (
                              <span className="material-symbols-outlined" style={{ color: '#f44336' }}>
                                cancel
                              </span>
                            )}
                            {(notif.tipo === 'reserva_pendiente' || notif.tipo === 'reserva_actualizada') && (
                              <span className="material-symbols-outlined" style={{ color: '#ff9800' }}>
                                pending_actions
                              </span>
                            )}
                            {notif.tipo === 'reserva_cancelada' && (
                              <span className="material-symbols-outlined" style={{ color: '#f44336' }}>
                                cancel
                              </span>
                            )}
                            {notif.tipo === 'fila_nueva_entrada' && (
                              <span className="material-symbols-outlined" style={{ color: '#2196f3' }}>
                                person_add
                              </span>
                            )}
                            {notif.tipo === 'fila_salida' && (
                              <span className="material-symbols-outlined" style={{ color: '#9c27b0' }}>
                                person_remove
                              </span>
                            )}
                            {notif.tipo === 'mesa_actualizada' && (
                              <span className="material-symbols-outlined" style={{ color: '#673ab7' }}>
                                table_restaurant
                              </span>
                            )}
                          </div>
                          <div className="contenido-notif">
                            <p className="mensaje-notif">{notif.mensaje}</p>
                            <span className="timestamp-notif">
                              {new Date(notif.timestamp).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link to="/" className="boton-ver-sitio" title="Ver sitio">
              <span className="material-symbols-outlined">visibility</span>
              Ver Sitio
            </Link>
            <button 
              className="boton-logout" 
              title="Cerrar sesión"
              onClick={handleLogout}
            >
              <span className="material-symbols-outlined">logout</span>
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}