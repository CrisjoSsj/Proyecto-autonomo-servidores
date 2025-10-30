import { useState, useEffect } from "react";
import NavbarAdmin from "../../components/admin/NavbarAdmin";
import { wsService } from "../../services/WebSocketService";
import "../../css/admin/GestionMesas.css";

interface Mesa {
  id: number;
  numero: number;
  capacidad: number;
  estado: 'libre' | 'ocupada' | 'reservada' | 'limpieza';
  ubicacion: string;
  tiempo_ocupada?: number;
  cliente?: string;
}

export default function GestionMesas() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Conectar al WebSocket
    wsService.connect();

    // Cargar mesas iniciales
    cargarMesas();

    // Suscribirse a actualizaciones de mesas en tiempo real
    const unsubscribe = wsService.subscribe('mesas', (message: any) => {
      console.log('Actualización de mesa recibida:', message);
      cargarMesas(); // Recargar mesas cuando hay cambios
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const cargarMesas = async () => {
    try {
      const response = await fetch('http://localhost:8000/mesas/');
      const data = await response.json();
      setMesas(data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar mesas:', error);
      setLoading(false);
    }
  };

  const cambiarEstadoMesa = async (mesaId: number, nuevoEstado: string) => {
    try {
      // Actualizar en la API
      await fetch(`http://localhost:8000/mesas/${mesaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      // Notificar via WebSocket
      wsService.updateMesaStatus(mesaId, nuevoEstado as any);
      
      // Recargar mesas
      cargarMesas();
    } catch (error) {
      console.error('Error al cambiar estado de mesa:', error);
    }
  };

  const getEstadoTexto = (estado: string) => {
    const estados: any = {
      'libre': 'Disponible',
      'ocupada': 'Ocupada',
      'reservada': 'Reservada',
      'limpieza': 'En limpieza'
    };
    return estados[estado] || estado;
  };

  const mesasPor2 = mesas.filter(m => m.capacidad === 2);
  const mesasPor4 = mesas.filter(m => m.capacidad === 4);
  const mesasPor6Plus = mesas.filter(m => m.capacidad >= 6);

  const mesasDisponibles = mesas.filter(m => m.estado === 'libre').length;
  const mesasOcupadas = mesas.filter(m => m.estado === 'ocupada').length;
  const mesasReservadas = mesas.filter(m => m.estado === 'reservada').length;

  if (loading) {
    return (
      <div className="gestion-mesas-admin">
        <NavbarAdmin />
        <div className="loading-mesas">Cargando mesas...</div>
      </div>
    );
  }

  return (
    <div className="gestion-mesas-admin">
      <NavbarAdmin />
      
      {/* Header de gestión de mesas */}
      <section className="header-gestion-mesas">
        <div className="contenedor-header-mesas">
          <h1 className="titulo-gestion-mesas">Gestión de Mesas</h1>
          <p className="subtitulo-gestion-mesas">Control en tiempo real del estado de todas las mesas</p>
          <p className="tech-badge">🔌 WebSocket - Actualizaciones en Tiempo Real</p>
          <div className="info-actualizacion">
            <span className="ultima-actualizacion">🟢 Conectado - Actualizaciones automáticas</span>
            <button className="boton-actualizar" onClick={cargarMesas}>🔄 Actualizar</button>
          </div>
        </div>
      </section>

      {/* Resumen general */}
      <section className="seccion-resumen-mesas">
        <div className="contenedor-resumen-mesas">
          <div className="grilla-resumen-mesas">
            <div className="tarjeta-resumen disponibles">
              <h3 className="titulo-resumen">Mesas Disponibles</h3>
              <p className="numero-resumen">{mesasDisponibles}</p>
              <span className="detalle-resumen">{mesas.length > 0 ? Math.round((mesasDisponibles / mesas.length) * 100) : 0}% del total</span>
            </div>
            <div className="tarjeta-resumen ocupadas">
              <h3 className="titulo-resumen">Mesas Ocupadas</h3>
              <p className="numero-resumen">{mesasOcupadas}</p>
              <span className="detalle-resumen">{mesas.length > 0 ? Math.round((mesasOcupadas / mesas.length) * 100) : 0}% del total</span>
            </div>
            <div className="tarjeta-resumen reservadas">
              <h3 className="titulo-resumen">Reservadas Hoy</h3>
              <p className="numero-resumen">{mesasReservadas}</p>
              <span className="detalle-resumen">Próximas horas</span>
            </div>
            <div className="tarjeta-resumen tiempo-promedio">
              <h3 className="titulo-resumen">Total Mesas</h3>
              <p className="numero-resumen">{mesas.length}</p>
              <span className="detalle-resumen">En el restaurante</span>
            </div>
          </div>
        </div>
      </section>

      {/* Estado detallado de mesas */}
      <section className="seccion-estado-mesas">
        <div className="contenedor-estado-mesas">
          <h2 className="titulo-seccion-mesas">Estado Detallado de Mesas</h2>
          
          {/* Mesas para 2 personas */}
          {mesasPor2.length > 0 && (
            <div className="grupo-mesas-admin">
              <h3 className="titulo-grupo-mesas">Mesas para 2 Personas</h3>
              <div className="grilla-mesas-admin">
                {mesasPor2.map(mesa => (
                  <div key={mesa.id} className={`tarjeta-mesa-admin ${mesa.estado}`}>
                    <div className="header-mesa-admin">
                      <span className="numero-mesa-admin">Mesa {mesa.numero}</span>
                      <span className="capacidad-mesa-admin">{mesa.capacidad} personas</span>
                    </div>
                    <div className="estado-mesa-admin">
                      <span className={`indicador-estado ${mesa.estado}`}>
                        {getEstadoTexto(mesa.estado)}
                      </span>
                    </div>
                    <div className="info-mesa-admin">
                      <p className="ubicacion-mesa">Ubicación: {mesa.ubicacion}</p>
                      {mesa.cliente && <p className="cliente-actual">Cliente: {mesa.cliente}</p>}
                      {mesa.tiempo_ocupada && <p className="tiempo-ocupada">Tiempo: {mesa.tiempo_ocupada} min</p>}
                    </div>
                    <div className="acciones-mesa-admin">
                      {mesa.estado === 'libre' && (
                        <>
                          <button className="boton-asignar" onClick={() => cambiarEstadoMesa(mesa.id, 'ocupada')}>
                            Asignar Cliente
                          </button>
                          <button className="boton-reservar" onClick={() => cambiarEstadoMesa(mesa.id, 'reservada')}>
                            Reservar
                          </button>
                        </>
                      )}
                      {mesa.estado === 'ocupada' && (
                        <>
                          <button className="boton-liberar" onClick={() => cambiarEstadoMesa(mesa.id, 'limpieza')}>
                            Liberar Mesa
                          </button>
                        </>
                      )}
                      {mesa.estado === 'limpieza' && (
                        <button className="boton-disponible" onClick={() => cambiarEstadoMesa(mesa.id, 'libre')}>
                          Marcar Disponible
                        </button>
                      )}
                      {mesa.estado === 'reservada' && (
                        <button className="boton-cancelar" onClick={() => cambiarEstadoMesa(mesa.id, 'libre')}>
                          Cancelar Reserva
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mesas para 4 personas */}
          {mesasPor4.length > 0 && (
            <div className="grupo-mesas-admin">
              <h3 className="titulo-grupo-mesas">Mesas para 4 Personas</h3>
              <div className="grilla-mesas-admin">
                {mesasPor4.map(mesa => (
                  <div key={mesa.id} className={`tarjeta-mesa-admin ${mesa.estado}`}>
                    <div className="header-mesa-admin">
                      <span className="numero-mesa-admin">Mesa {mesa.numero}</span>
                      <span className="capacidad-mesa-admin">{mesa.capacidad} personas</span>
                    </div>
                    <div className="estado-mesa-admin">
                      <span className={`indicador-estado ${mesa.estado}`}>
                        {getEstadoTexto(mesa.estado)}
                      </span>
                    </div>
                    <div className="info-mesa-admin">
                      <p className="ubicacion-mesa">Ubicación: {mesa.ubicacion}</p>
                      {mesa.cliente && <p className="cliente-actual">Cliente: {mesa.cliente}</p>}
                      {mesa.tiempo_ocupada && <p className="tiempo-ocupada">Tiempo: {mesa.tiempo_ocupada} min</p>}
                    </div>
                    <div className="acciones-mesa-admin">
                      {mesa.estado === 'libre' && (
                        <>
                          <button className="boton-asignar" onClick={() => cambiarEstadoMesa(mesa.id, 'ocupada')}>
                            Asignar Cliente
                          </button>
                          <button className="boton-reservar" onClick={() => cambiarEstadoMesa(mesa.id, 'reservada')}>
                            Reservar
                          </button>
                        </>
                      )}
                      {mesa.estado === 'ocupada' && (
                        <>
                          <button className="boton-liberar" onClick={() => cambiarEstadoMesa(mesa.id, 'limpieza')}>
                            Liberar Mesa
                          </button>
                        </>
                      )}
                      {mesa.estado === 'limpieza' && (
                        <button className="boton-disponible" onClick={() => cambiarEstadoMesa(mesa.id, 'libre')}>
                          Marcar Disponible
                        </button>
                      )}
                      {mesa.estado === 'reservada' && (
                        <button className="boton-cancelar" onClick={() => cambiarEstadoMesa(mesa.id, 'libre')}>
                          Cancelar Reserva
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mesas para 6+ personas */}
          {mesasPor6Plus.length > 0 && (
            <div className="grupo-mesas-admin">
              <h3 className="titulo-grupo-mesas">Mesas para 6+ Personas</h3>
              <div className="grilla-mesas-admin">
                {mesasPor6Plus.map(mesa => (
                  <div key={mesa.id} className={`tarjeta-mesa-admin ${mesa.estado}`}>
                    <div className="header-mesa-admin">
                      <span className="numero-mesa-admin">Mesa {mesa.numero}</span>
                      <span className="capacidad-mesa-admin">{mesa.capacidad} personas</span>
                    </div>
                    <div className="estado-mesa-admin">
                      <span className={`indicador-estado ${mesa.estado}`}>
                        {getEstadoTexto(mesa.estado)}
                      </span>
                    </div>
                    <div className="info-mesa-admin">
                      <p className="ubicacion-mesa">Ubicación: {mesa.ubicacion}</p>
                      {mesa.cliente && <p className="cliente-actual">Cliente: {mesa.cliente}</p>}
                      {mesa.tiempo_ocupada && <p className="tiempo-ocupada">Tiempo: {mesa.tiempo_ocupada} min</p>}
                    </div>
                    <div className="acciones-mesa-admin">
                      {mesa.estado === 'libre' && (
                        <>
                          <button className="boton-asignar" onClick={() => cambiarEstadoMesa(mesa.id, 'ocupada')}>
                            Asignar Cliente
                          </button>
                          <button className="boton-reservar" onClick={() => cambiarEstadoMesa(mesa.id, 'reservada')}>
                            Reservar
                          </button>
                        </>
                      )}
                      {mesa.estado === 'ocupada' && (
                        <>
                          <button className="boton-liberar" onClick={() => cambiarEstadoMesa(mesa.id, 'limpieza')}>
                            Liberar Mesa
                          </button>
                        </>
                      )}
                      {mesa.estado === 'limpieza' && (
                        <button className="boton-disponible" onClick={() => cambiarEstadoMesa(mesa.id, 'libre')}>
                          Marcar Disponible
                        </button>
                      )}
                      {mesa.estado === 'reservada' && (
                        <button className="boton-cancelar" onClick={() => cambiarEstadoMesa(mesa.id, 'libre')}>
                          Cancelar Reserva
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}