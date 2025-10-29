import { useState } from "react";
import { apiService } from "../../services/ApiService";
import "../../css/user/Reservas.css";

export default function ReservaFormConAPI() {
  const [formData, setFormData] = useState({
    id_cliente: 1, // Por ahora hardcodeado, después lo obtienes del usuario logueado
    id_mesa: 1,    // Lo seleccionará el usuario de una lista
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    numero_personas: 2,
    ocasion_especial: '',
    comentarios: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

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
      // Crear reserva usando tu API REST
      const reservaData = {
        id_reserva: Date.now(), // ID temporal, tu API debería generarlo automáticamente
        id_cliente: formData.id_cliente,
        id_mesa: formData.id_mesa,
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        estado: 'pendiente'
      };

      console.log('Enviando reserva:', reservaData);
      
      const resultado = await apiService.crearReserva(reservaData);
      
      console.log('Reserva creada:', resultado);
      setMensaje('¡Reserva creada exitosamente!');
      
      // Limpiar formulario
      setFormData({
        id_cliente: 1,
        id_mesa: 1,
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        numero_personas: 2,
        ocasion_especial: '',
        comentarios: ''
      });

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
          <select 
            id="id_mesa" 
            name="id_mesa"
            className="campo-seleccion"
            value={formData.id_mesa}
            onChange={handleChange}
          >
            <option value="1">Mesa 1 (2 personas)</option>
            <option value="2">Mesa 2 (4 personas)</option>
            <option value="3">Mesa 3 (6 personas)</option>
            <option value="4">Mesa 4 (8 personas)</option>
          </select>
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