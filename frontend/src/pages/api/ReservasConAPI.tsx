import { useState, useEffect } from "react";
import Navbar from "../../components/user/Navbar";
import PiePagina from "../../components/user/PiePagina";
import { apiService } from "../../services/ApiService";
import "../../css/user/Reservas.css";

export default function ReservasConAPI() {
  // Estados para los datos
  const [reservas, setReservas] = useState<any[]>([]);
  const [mesas, setMesas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviandoReserva, setEnviandoReserva] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    id_cliente: 1,
    id_mesa: 1,
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    estado: 'pendiente'
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        console.log('Cargando datos para reservas...');
        
        const [reservasData, mesasData, clientesData] = await Promise.all([
          apiService.getReservas(),
          apiService.getMesas(),
          apiService.getClientes()
        ]);

        console.log('Reservas:', reservasData);
        console.log('Mesas:', mesasData);
        console.log('Clientes:', clientesData);

        setReservas(reservasData);
        setMesas(mesasData);  
        setClientes(clientesData);
        
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error conectando con la API. ¿Está ejecutándose en http://localhost:8000?');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setEnviandoReserva(true);
    setMensaje(null);

    try {
      // Crear ID único para la reserva
      const nuevaReserva = {
        id_reserva: Date.now(), // ID temporal
        ...formData
      };

      console.log('Creando reserva:', nuevaReserva);
      
      const resultado = await apiService.crearReserva(nuevaReserva);
      console.log('Reserva creada:', resultado);
      
      setMensaje('¡Reserva creada exitosamente!');
      
      // Recargar reservas
      const reservasActualizadas = await apiService.getReservas();
      setReservas(reservasActualizadas);
      
      // Limpiar formulario
      setFormData({
        id_cliente: 1,
        id_mesa: 1,
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        estado: 'pendiente'
      });

    } catch (error) {
      console.error('Error creando reserva:', error);
      setMensaje('Error al crear la reserva. Intenta de nuevo.');
    } finally {
      setEnviandoReserva(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>Cargando sistema de reservas...</h2>
          <p>Conectando con API REST</p>
        </div>
        <PiePagina />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '3rem', textAlign: 'center', color: 'red' }}>
          <h2>Error de Conexión</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
        <PiePagina />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      
      {/* Banner de reservas */}
      <section className="banner-reservas">
        <div className="contenedor-banner-reservas">
          <h1 className="titulo-reservas">Sistema de Reservas - API REST</h1>
          <p className="subtitulo-reservas">Conectado en tiempo real con tu backend</p>
          <p className="descripcion-reservas">
            {reservas.length} reservas activas • {mesas.length} mesas disponibles • {clientes.length} clientes registrados
          </p>
        </div>
      </section>

      <div className="contenedor-reservas">
        {/* Formulario de reserva */}
        <section className="seccion-formulario-reserva">
          <div className="contenedor-formulario">
            <h2 className="titulo-formulario">Crear Nueva Reserva</h2>
            
            {mensaje && (
              <div className={`mensaje ${mensaje.includes('Error') ? 'error' : 'exito'}`}>
                {mensaje}
              </div>
            )}

            <form className="formulario-reserva" onSubmit={handleSubmit}>
              <div className="grupo-campo">
                <label className="etiqueta-campo" htmlFor="id_cliente">Cliente</label>
                <select 
                  id="id_cliente" 
                  name="id_cliente"
                  className="campo-seleccion"
                  value={formData.id_cliente}
                  onChange={handleChange}
                  required
                >
                  {clientes.map((cliente: any) => (
                    <option key={cliente.id_cliente} value={cliente.id_cliente}>
                      {cliente.nombre} - {cliente.telefono}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grupo-campo">
                <label className="etiqueta-campo" htmlFor="id_mesa">Mesa</label>
                <select 
                  id="id_mesa" 
                  name="id_mesa"
                  className="campo-seleccion"
                  value={formData.id_mesa}
                  onChange={handleChange}
                  required
                >
                  {mesas.map((mesa: any) => (
                    <option key={mesa.id_mesa} value={mesa.id_mesa}>
                      Mesa {mesa.numero} - {mesa.capacidad} personas ({mesa.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grupo-campo">
                <label className="etiqueta-campo" htmlFor="fecha">Fecha</label>
                <input 
                  type="date" 
                  id="fecha"
                  name="fecha"
                  className="campo-entrada" 
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="fila-campos">
                <div className="grupo-campo">
                  <label className="etiqueta-campo" htmlFor="hora_inicio">Hora Inicio</label>
                  <input 
                    type="time" 
                    id="hora_inicio"
                    name="hora_inicio"
                    className="campo-entrada"
                    value={formData.hora_inicio}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grupo-campo">
                  <label className="etiqueta-campo" htmlFor="hora_fin">Hora Fin</label>
                  <input 
                    type="time" 
                    id="hora_fin"
                    name="hora_fin"
                    className="campo-entrada"
                    value={formData.hora_fin}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="boton-enviar-reserva"
                disabled={enviandoReserva}
              >
                {enviandoReserva ? 'Creando Reserva...' : 'Confirmar Reserva'}
              </button>
            </form>
          </div>
        </section>

        {/* Lista de reservas existentes */}
        <section className="seccion-reservas-existentes">
          <div className="contenedor-reservas-existentes">
            <h2 className="titulo-reservas-existentes">Reservas Actuales desde API</h2>
            
            {reservas.length > 0 ? (
              <div className="lista-reservas">
                {reservas.map((reserva: any) => {
                  const cliente = clientes.find(c => c.id_cliente === reserva.id_cliente);
                  const mesa = mesas.find(m => m.id_mesa === reserva.id_mesa);
                  
                  return (
                    <div key={reserva.id_reserva} className="tarjeta-reserva">
                      <div className="info-reserva">
                        <h3 className="nombre-cliente">
                          {cliente ? cliente.nombre : `Cliente ${reserva.id_cliente}`}
                        </h3>
                        <p className="detalles-reserva">
                          <strong>Mesa:</strong> {mesa ? `${mesa.numero} (${mesa.capacidad} personas)` : reserva.id_mesa}
                        </p>
                        <p className="detalles-reserva">
                          <strong>Fecha:</strong> {reserva.fecha}
                        </p>
                        <p className="detalles-reserva">
                          <strong>Horario:</strong> {reserva.hora_inicio} - {reserva.hora_fin}
                        </p>
                        <span className={`estado-reserva ${reserva.estado}`}>
                          {reserva.estado.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h3>No hay reservas disponibles</h3>
                <p>Las reservas creadas aparecerán aquí.</p>
              </div>
            )}
          </div>
        </section>

        {/* Información sobre el sistema */}
        <section className="seccion-info-sistema">
          <div className="contenedor-info-sistema">
            <h2 className="titulo-info-sistema">Estado del Sistema</h2>
            <div className="grilla-info-sistema">
              <div className="tarjeta-info">
                <h3 className="numero-info">{reservas.length}</h3>
                <p className="label-info">Reservas Totales</p>
              </div>
              <div className="tarjeta-info">
                <h3 className="numero-info">{mesas.filter((m: any) => m.estado === 'disponible').length}</h3>
                <p className="label-info">Mesas Disponibles</p>
              </div>
              <div className="tarjeta-info">
                <h3 className="numero-info">{clientes.length}</h3>
                <p className="label-info">Clientes Registrados</p>
              </div>
              <div className="tarjeta-info">
                <h3 className="numero-info">✅</h3>
                <p className="label-info">API Conectada</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <PiePagina />
    </div>
  );
}