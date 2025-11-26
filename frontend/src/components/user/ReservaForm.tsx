import { useState, useEffect } from "react";
import { apiService } from "../../services/ApiService";
import "../../css/user/Reservas.css";

// Interfaces
interface Mesa {
  id?: number;
  id_mesa?: number;
  numero: number;
  capacidad: number;
  estado: string;
}

export default function ReservaFormConAPI() {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    id_cliente: 1, // Por ahora hardcodeado, después lo obtienes del usuario logueado
    id_mesa: '' as number | string,    // Lo seleccionará el usuario de una lista
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    numero_personas: 2,
    ocasion_especial: '',
    comentarios: ''
  });
  
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [loadingMesas, setLoadingMesas] = useState(true);

  // Cargar mesas al montar el componente
  useEffect(() => {
    const cargarMesas = async () => {
      try {
        setLoadingMesas(true);
        const mesasData = await apiService.getMesas();
        console.log('Mesas cargadas:', mesasData);
        setMesas(mesasData);
        
        // Seleccionar la primera mesa disponible por defecto
        const mesaDisponible = mesasData.find((mesa: any) => mesa.estado === 'disponible' || mesa.estado === 'libre');
        if (mesaDisponible) {
          setFormData(prev => ({ ...prev, id_mesa: mesaDisponible.id || mesaDisponible.id_mesa }));
        }
      } catch (error) {
        console.error('Error cargando mesas:', error);
        setMensaje('Error al cargar las mesas disponibles');
      } finally {
        setLoadingMesas(false);
      }
    };

    cargarMesas();
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
    setLoading(true);
    setMensaje('');

    try {
      // Validar campos requeridos
      if (!formData.nombre || formData.nombre.trim() === '') {
        setMensaje('Error: El nombre es requerido');
        setLoading(false);
        return;
      }

      if (!formData.telefono || formData.telefono.trim() === '') {
        setMensaje('Error: El teléfono es requerido');
        setLoading(false);
        return;
      }

      if (!formData.email || formData.email.trim() === '') {
        setMensaje('Error: El email es requerido');
        setLoading(false);
        return;
      }

      // Validar que haya una mesa seleccionada
      if (!formData.id_mesa || formData.id_mesa === '') {
        setMensaje('Error: Debes seleccionar una mesa disponible');
        setLoading(false);
        return;
      }

      // Validar que la fecha no sea en el pasado
      const fechaSeleccionada = new Date(formData.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaSeleccionada < hoy) {
        setMensaje('Error: No puedes hacer reservas para fechas pasadas');
        setLoading(false);
        return;
      }

      // Validar que la hora inicio no esté vacía
      if (!formData.hora_inicio || formData.hora_inicio.trim() === '') {
        setMensaje('Error: Debes especificar la hora de inicio');
        setLoading(false);
        return;
      }

      // Validar que la hora fin no esté vacía
      if (!formData.hora_fin || formData.hora_fin.trim() === '') {
        setMensaje('Error: Debes especificar la hora de fin');
        setLoading(false);
        return;
      }

      // Crear reserva usando tu API REST
      const idMesaNumero = typeof formData.id_mesa === 'string' 
        ? parseInt(formData.id_mesa, 10) 
        : formData.id_mesa;

      if (isNaN(idMesaNumero) || idMesaNumero <= 0) {
        setMensaje('Error: ID de mesa inválido');
        setLoading(false);
        return;
      }

      const reservaData = {
        // No enviamos id_reserva: lo genera el servidor
        id_cliente: formData.id_cliente || 1,
        id_mesa: idMesaNumero,
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        estado: 'pendiente',
        nombre: formData.nombre,
        telefono: formData.telefono,
        email: formData.email,
        numero_personas: formData.numero_personas,
        ocasion_especial: formData.ocasion_especial,
        comentarios: formData.comentarios
      };

      console.log('Enviando reserva:', reservaData);
      
      const resultado = await apiService.crearReserva(reservaData);
      
      console.log('Reserva creada:', resultado);
      setMensaje('¡Reserva creada exitosamente! Tu reserva está pendiente de confirmación.');
      
      // Limpiar formulario
      const primeraMesaDisponible = mesas.find((mesa: any) => mesa.estado === 'disponible' || mesa.estado === 'libre');
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        id_cliente: 1,
        id_mesa: primeraMesaDisponible?.id || primeraMesaDisponible?.id_mesa || '',
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        numero_personas: 2,
        ocasion_especial: '',
        comentarios: ''
      });

      // Recargar mesas para actualizar disponibilidad
      const mesasActualizadas = await apiService.getMesas();
      setMesas(mesasActualizadas);

    } catch (error) {
      console.error('Error creando reserva:', error);
      setMensaje('Error al crear la reserva. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contenedor-formulario">
      <h2 className="titulo-formulario">Hacer Reserva - Conectado a API REST</h2>
      
      {mensaje && (
        <div className={`mensaje ${mensaje.includes('Error') ? 'error' : 'exito'}`}>
          {mensaje}
        </div>
      )}

      <form className="formulario-reserva" onSubmit={handleSubmit}>
        <div className="grupo-campo">
          <label className="etiqueta-campo" htmlFor="nombre">Nombre Completo *</label>
          <input 
            type="text" 
            id="nombre"
            name="nombre"
            className="campo-entrada" 
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Tu nombre completo"
            required
          />
        </div>

        <div className="fila-campos">
          <div className="grupo-campo">
            <label className="etiqueta-campo" htmlFor="telefono">Teléfono *</label>
            <input 
              type="tel" 
              id="telefono"
              name="telefono"
              className="campo-entrada"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="099-123-4567"
              required
            />
          </div>

          <div className="grupo-campo">
            <label className="etiqueta-campo" htmlFor="email">Email *</label>
            <input 
              type="email" 
              id="email"
              name="email"
              className="campo-entrada"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
            />
          </div>
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

        <div className="grupo-campo">
          <label className="etiqueta-campo" htmlFor="id_mesa">Mesa</label>
          {loadingMesas ? (
            <div className="loading-mesas">Cargando mesas...</div>
          ) : (
            <select 
              id="id_mesa" 
              name="id_mesa"
              className="campo-seleccion"
              value={formData.id_mesa}
              onChange={handleChange}
              required
            >
              {mesas
                .filter((mesa: any) => mesa.estado === 'disponible' || mesa.estado === 'libre')
                .map((mesa: any) => {
                  const mesaId = mesa.id || mesa.id_mesa;
                  return (
                    <option key={mesaId} value={mesaId}>
                      Mesa {mesa.numero} ({mesa.capacidad} personas) - {mesa.estado === 'libre' ? 'Disponible' : mesa.estado}
                    </option>
                  );
                })
              }
              {mesas.filter((mesa: any) => mesa.estado === 'disponible' || mesa.estado === 'libre').length === 0 && (
                <option value="">No hay mesas disponibles</option>
              )}
            </select>
          )}
        </div>

        <div className="grupo-campo">
          <label className="etiqueta-campo" htmlFor="numero_personas">Número de Personas</label>
          <select 
            id="numero_personas" 
            name="numero_personas"
            className="campo-seleccion"
            value={formData.numero_personas}
            onChange={handleChange}
          >
            <option value="1">1 persona</option>
            <option value="2">2 personas</option>
            <option value="3">3 personas</option>
            <option value="4">4 personas</option>
            <option value="5">5 personas</option>
            <option value="6">6 personas</option>
            <option value="7">7 personas</option>
            <option value="8">8 personas</option>
          </select>
        </div>

        <div className="grupo-campo">
          <label className="etiqueta-campo" htmlFor="ocasion_especial">Ocasión Especial (Opcional)</label>
          <select 
            id="ocasion_especial" 
            name="ocasion_especial"
            className="campo-seleccion"
            value={formData.ocasion_especial}
            onChange={handleChange}
          >
            <option value="">Ninguna ocasión especial</option>
            <option value="cumpleanos">Cumpleaños</option>
            <option value="aniversario">Aniversario</option>
            <option value="cita">Cita romántica</option>
            <option value="negocios">Cena de negocios</option>
            <option value="celebracion">Celebración</option>
          </select>
        </div>

        <div className="grupo-campo">
          <label className="etiqueta-campo" htmlFor="comentarios">Comentarios Adicionales</label>
          <textarea 
            id="comentarios"
            name="comentarios"
            className="campo-textarea" 
            placeholder="Alguna preferencia especial, alergias alimentarias, etc."
            rows={3}
            value={formData.comentarios}
            onChange={handleChange}
          />
        </div>

        <button 
          type="submit" 
          className="boton-enviar-reserva"
          disabled={loading}
        >
          {loading ? 'Creando Reserva...' : 'Confirmar Reserva'}
        </button>

        <p className="nota-confirmacion">
          * La reserva será procesada directamente por nuestra API REST
        </p>
      </form>
    </div>
  );
}