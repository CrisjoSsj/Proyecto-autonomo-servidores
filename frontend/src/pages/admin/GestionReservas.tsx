import { useCallback, useState, useEffect } from "react";
import { apiService } from "../../services/ApiService";
import NavbarAdmin from "../../components/admin/NavbarAdmin";
import TarjetaReservaAdmin from "../../components/admin/TarjetaReservaAdmin";
import "../../css/admin/GestionReservas.css";

interface Reserva {
  id_reserva?: number;
  id?: number;
  id_cliente?: number;
  id_mesa: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  numero_personas?: number;
  ocasion_especial?: string;
  comentarios?: string;
  nombre?: string;
  telefono?: string;
  email?: string;
}

export default function GestionReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mesas, setMesas] = useState<any[]>([]);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [reservaEnEdicion, setReservaEnEdicion] = useState<Reserva | null>(null);
  const [formEdicion, setFormEdicion] = useState({
    numero_personas: 2,
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    id_mesa: 0,
    estado: 'pendiente'
  });

  // Función para cargar reservas
  const cargarReservas = useCallback(async () => {
    try {
      setLoading(true);
      const reservasData = await apiService.getReservas();
      console.log('Reservas cargadas:', reservasData);
      console.log('Tipo de datos:', typeof reservasData);
      console.log('Es array?:', Array.isArray(reservasData));
      if (reservasData && reservasData.length > 0) {
        console.log('Primera reserva:', JSON.stringify(reservasData[0], null, 2));
      }
      setReservas(reservasData || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando reservas:', err);
      setError('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para cargar mesas
  const cargarMesas = useCallback(async () => {
    try {
      const mesasData = await apiService.getMesas();
      setMesas(mesasData || []);
    } catch (err) {
      console.error('Error cargando mesas:', err);
    }
  }, []);

  // Función para cargar reservas sin mostrar loading
  const cargarReservasSilenciosamente = useCallback(async () => {
    try {
      const reservasData = await apiService.getReservas();
      setReservas(reservasData || []);
      setError(null);
    } catch (err) {
      console.error('Error cargando reservas:', err);
      // No mostrar error en silent mode
    }
  }, []);

  // Cargar reservas al montar y configurar refresco automático
  useEffect(() => {
    cargarReservas();
    
    // Cargar mesas en background (sin bloquear)
    const timeoutMesas = setTimeout(() => {
      cargarMesas();
    }, 500);
    
    // Recargar reservas cada 10 segundos (sin loading indicator)
    const intervalo = setInterval(() => {
      cargarReservasSilenciosamente();
    }, 10000);

    // Intervalo para actualizar automáticamente reservas que han llegado su hora
    const intervaloAutoActualizar = setInterval(async () => {
      try {
        const ahora = new Date();
        const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
        const fechaHoy = ahora.toISOString().split('T')[0];

        // Obtener reservas actuales para verificar cuáles cambiar
        const reservasActuales = await apiService.getReservas();
        
        // Buscar reservas que deben cambiarse a "activa" (han llegado su hora)
        const reservasParaActualizar = (reservasActuales || []).filter((r: any) => 
          r.estado === 'confirmada' && 
          r.fecha === fechaHoy &&
          r.hora_inicio <= horaActual
        );

        // Actualizar cada una
        for (const reserva of reservasParaActualizar) {
          if ((reserva.id || reserva.id_reserva) && reserva.hora_fin > horaActual) {
            // Solo marcar como activa si aún no ha pasado la hora de fin
            const reservaActualizada = { ...reserva, estado: 'activa' };
            await apiService.actualizarReserva(reservaActualizada);
          }
        }
      } catch (error) {
        console.error('Error actualizando automáticamente reservas:', error);
      }
    }, 60000); // Cada minuto

    return () => {
      clearTimeout(timeoutMesas);
      clearInterval(intervalo);
      clearInterval(intervaloAutoActualizar);
    };
  }, [cargarReservas, cargarReservasSilenciosamente]);

  // Handlers para botones de acciones
  const handleNuevaReserva = useCallback(() => {
    // Abrir modal o formulario para nueva reserva
    alert("Abrir formulario de nueva reserva");
  }, []);

  const handleActualizarReservas = useCallback(() => {
    cargarReservas();
  }, [cargarReservas]);

  const handleEditarReserva = useCallback((reservaId: number) => {
    const reserva = reservas.find(r => (r.id || r.id_reserva) === reservaId);
    if (!reserva) {
      alert('Reserva no encontrada');
      return;
    }
    
    setReservaEnEdicion(reserva);
    setFormEdicion({
      numero_personas: reserva.numero_personas || 2,
      fecha: reserva.fecha,
      hora_inicio: reserva.hora_inicio,
      hora_fin: reserva.hora_fin,
      id_mesa: reserva.id_mesa,
      estado: reserva.estado || 'pendiente'
    });
    setMostrarModalEditar(true);
  }, [reservas]);

  const handleChangeFormEdicion = (e: any) => {
    const { name, value } = e.target;
    setFormEdicion(prev => ({
      ...prev,
      [name]: name === 'numero_personas' || name === 'id_mesa' ? parseInt(value) : value
    }));
  };

  const handleGuardarEdicion = async () => {
    try {
      if (!reservaEnEdicion) return;

      // Validar que haya una mesa seleccionada
      if (!formEdicion.id_mesa || formEdicion.id_mesa === 0) {
        alert('Por favor selecciona una mesa');
        return;
      }

      // Validar que la fecha no sea en el pasado
      const fechaSeleccionada = new Date(formEdicion.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaSeleccionada < hoy) {
        alert('No puedes cambiar a una fecha en el pasado');
        return;
      }

      // Crear la reserva actualizada
      const reservaActualizada = {
        ...reservaEnEdicion,
        ...formEdicion
      };

      // Hacer PUT al backend
      await apiService.actualizarReserva(reservaActualizada);

      alert('Reserva actualizada exitosamente');
      setMostrarModalEditar(false);
      setReservaEnEdicion(null);
      cargarReservas(); // Recargar la lista
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar los cambios');
    }
  };

  const handleDeshacerConfirmacion = async () => {
    try {
      if (!reservaEnEdicion) return;

      const confirmDeshacer = window.confirm('¿Desea deshacer la confirmación y volver a pendiente?');
      if (!confirmDeshacer) return;

      // Cambiar estado a pendiente
      const reservaActualizada = {
        ...reservaEnEdicion,
        estado: 'pendiente'
      };

      await apiService.actualizarReserva(reservaActualizada);

      alert('Confirmación deshecha. La reserva volvió a estado pendiente');
      setMostrarModalEditar(false);
      setReservaEnEdicion(null);
      cargarReservas();
    } catch (error) {
      console.error('Error deshaciendo confirmación:', error);
      alert('Error al deshacer la confirmación');
    }
  };

  const handleConfirmarReserva = useCallback(async (reservaId: number) => {
    try {
      // Buscar la reserva en la lista
      const reserva = reservas.find(r => (r.id || r.id_reserva) === reservaId);
      if (!reserva) {
        alert('Reserva no encontrada');
        return;
      }

      // Actualizar estado a confirmada
      const reservaActualizada = { ...reserva, estado: 'confirmada' };
      
      // Hacer PUT al backend
      await apiService.actualizarReserva(reservaActualizada);

      alert('Reserva confirmada exitosamente');
      cargarReservas(); // Recargar la lista
    } catch (error) {
      console.error('Error confirmando reserva:', error);
      alert('Error al confirmar la reserva');
    }
  }, [reservas, cargarReservas]);

  const handleRechazarReserva = useCallback(async (reservaId: number) => {
    try {
      const confirmRechazar = window.confirm('¿Está seguro de que desea rechazar esta reserva?');
      if (!confirmRechazar) return;

      // Buscar la reserva en la lista
      const reserva = reservas.find(r => (r.id || r.id_reserva) === reservaId);
      if (!reserva) {
        alert('Reserva no encontrada');
        return;
      }

      // Actualizar estado a rechazada
      const reservaActualizada = { ...reserva, estado: 'rechazada' };
      
      // Hacer PUT al backend
      await apiService.actualizarReserva(reservaActualizada);

      alert('Reserva rechazada');
      cargarReservas(); // Recargar la lista
    } catch (error) {
      console.error('Error rechazando reserva:', error);
      alert('Error al rechazar la reserva');
    }
  }, [reservas, cargarReservas]);

  return (
    <div className="gestion-reservas-admin">
      <NavbarAdmin />
      
      {/* Header de gestión de reservas */}
      <section className="header-gestion-reservas">
        <div className="contenedor-header-reservas">
          <h1 className="titulo-gestion-reservas">Gestión de Reservas</h1>
          <p className="subtitulo-gestion-reservas">Administra todas las reservas del restaurante</p>
          <div className="filtros-fecha">
            <select className="selector-fecha">
              <option value="hoy">Hoy - 22 Sept 2025</option>
              <option value="manana">Mañana - 23 Sept 2025</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
            </select>
            <button className="boton-nueva-reserva" onClick={handleNuevaReserva}>+ Nueva Reserva</button>
            <button className="boton-actualizar-reservas" onClick={handleActualizarReservas} style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🔄 Actualizar</button>
          </div>
        </div>
      </section>

      {/* Resumen de reservas */}
      <section className="seccion-resumen-reservas">
        <div className="contenedor-resumen-reservas">
          <div className="grilla-resumen-reservas">
            <div className="tarjeta-resumen-reservas confirmadas">
              <h3 className="titulo-resumen-reservas">Confirmadas Hoy</h3>
              <p className="numero-resumen-reservas">12</p>
              <span className="detalle-resumen-reservas">8 pendientes por llegar</span>
            </div>
            <div className="tarjeta-resumen-reservas pendientes">
              <h3 className="titulo-resumen-reservas">Pendientes</h3>
              <p className="numero-resumen-reservas">3</p>
              <span className="detalle-resumen-reservas">Sin confirmar</span>
            </div>
            <div className="tarjeta-resumen-reservas completadas">
              <h3 className="titulo-resumen-reservas">Completadas</h3>
              <p className="numero-resumen-reservas">4</p>
              <span className="detalle-resumen-reservas">Ya atendidas</span>
            </div>
            <div className="tarjeta-resumen-reservas canceladas">
              <h3 className="titulo-resumen-reservas">Canceladas</h3>
              <p className="numero-resumen-reservas">1</p>
              <span className="detalle-resumen-reservas">Hoy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de reservas del día */}
      <section className="seccion-reservas-dia">
        <div className="contenedor-reservas-dia">
          <h2 className="titulo-seccion-reservas">Reservas - Sistema en Tiempo Real</h2>
          
          {loading && <p>Cargando reservas...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          {!loading && reservas.length === 0 && (
            <p>No hay reservas disponibles</p>
          )}
          
          <div className="lista-reservas-admin">
            {!loading && reservas.map((reserva) => (
              <TarjetaReservaAdmin
                key={reserva.id || reserva.id_reserva}
                reserva={reserva}
                onConfirmar={handleConfirmarReserva}
                onRechazar={handleRechazarReserva}
                onEditar={handleEditarReserva}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Modal de Edición */}
      {mostrarModalEditar && reservaEnEdicion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2>Editar Reserva #{reservaEnEdicion.id_reserva}</h2>
            
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Mesa:
              </label>
              <select 
                name="id_mesa"
                value={formEdicion.id_mesa}
                onChange={handleChangeFormEdicion}
                style={{ width: '100%', padding: '8px', marginBottom: '15px' }}
              >
                <option value={0}>Selecciona una mesa</option>
                {mesas.map((mesa: any) => (
                  <option key={mesa.id || mesa.id_mesa} value={mesa.id || mesa.id_mesa}>
                    Mesa {mesa.numero} ({mesa.capacidad} personas) - {mesa.estado}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Número de Personas:
              </label>
              <select 
                name="numero_personas"
                value={formEdicion.numero_personas}
                onChange={handleChangeFormEdicion}
                style={{ width: '100%', padding: '8px', marginBottom: '15px' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'persona' : 'personas'}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Fecha:
              </label>
              <input 
                type="date"
                name="fecha"
                value={formEdicion.fecha}
                onChange={handleChangeFormEdicion}
                style={{ width: '100%', padding: '8px', marginBottom: '15px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Hora Inicio:
                </label>
                <input 
                  type="time"
                  name="hora_inicio"
                  value={formEdicion.hora_inicio}
                  onChange={handleChangeFormEdicion}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Hora Fin:
                </label>
                <input 
                  type="time"
                  name="hora_fin"
                  value={formEdicion.hora_fin}
                  onChange={handleChangeFormEdicion}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
            </div>

            {reservaEnEdicion.estado === 'confirmada' && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Esta reserva está confirmada</p>
                <button 
                  onClick={handleDeshacerConfirmacion}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ↩️ Deshacer Confirmación
                </button>
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                onClick={handleGuardarEdicion}
                style={{
                  padding: '12px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                💾 Guardar
              </button>
              <button 
                onClick={() => {
                  setMostrarModalEditar(false);
                  setReservaEnEdicion(null);
                }}
                style={{
                  padding: '12px',
                  backgroundColor: '#757575',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}