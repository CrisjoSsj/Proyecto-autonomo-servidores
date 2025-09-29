import "../../css/user/Reservas.css";

export default function ReservaForm() {
  return (
    <form className="formulario-reserva">
      <div className="grupo-campo">
        <label className="etiqueta-campo" htmlFor="nombre">Nombre Completo</label>
        <input 
          type="text" 
          id="nombre"
          className="campo-entrada" 
          placeholder="Ingresa tu nombre completo" 
        />
      </div>

      <div className="grupo-campo">
        <label className="etiqueta-campo" htmlFor="telefono">Teléfono</label>
        <input 
          type="tel" 
          id="telefono"
          className="campo-entrada" 
          placeholder="099-123-4567" 
        />
      </div>

      <div className="grupo-campo">
        <label className="etiqueta-campo" htmlFor="email">Email</label>
        <input 
          type="email" 
          id="email"
          className="campo-entrada" 
          placeholder="tu@email.com" 
        />
      </div>

      <div className="fila-campos">
        <div className="grupo-campo">
          <label className="etiqueta-campo" htmlFor="fecha">Fecha</label>
          <input 
            type="date" 
            id="fecha"
            className="campo-entrada" 
          />
        </div>

        <div className="grupo-campo">
          <label className="etiqueta-campo" htmlFor="hora">Hora</label>
          <select id="hora" className="campo-seleccion">
            <option value="">Selecciona una hora</option>
            <option value="11:00">11:00 AM</option>
            <option value="11:30">11:30 AM</option>
            <option value="12:00">12:00 PM</option>
            <option value="12:30">12:30 PM</option>
            <option value="13:00">1:00 PM</option>
            <option value="13:30">1:30 PM</option>
            <option value="14:00">2:00 PM</option>
            <option value="14:30">2:30 PM</option>
            <option value="15:00">3:00 PM</option>
            <option value="15:30">3:30 PM</option>
            <option value="18:00">6:00 PM</option>
            <option value="18:30">6:30 PM</option>
            <option value="19:00">7:00 PM</option>
            <option value="19:30">7:30 PM</option>
            <option value="20:00">8:00 PM</option>
            <option value="20:30">8:30 PM</option>
            <option value="21:00">9:00 PM</option>
          </select>
        </div>
      </div>

      <div className="grupo-campo">
        <label className="etiqueta-campo" htmlFor="personas">Número de Personas</label>
        <select id="personas" className="campo-seleccion">
          <option value="1">1 persona</option>
          <option value="2">2 personas</option>
          <option value="3">3 personas</option>
          <option value="4">4 personas</option>
          <option value="5">5 personas</option>
          <option value="6">6 personas</option>
          <option value="7">7 personas</option>
          <option value="8">8 personas</option>
          <option value="9">9+ personas (contactar directamente)</option>
        </select>
      </div>

      <div className="grupo-campo">
        <label className="etiqueta-campo" htmlFor="ocasion">Ocasión Especial (Opcional)</label>
        <select id="ocasion" className="campo-seleccion">
          <option value="">Ninguna ocasión especial</option>
          <option value="cumpleanos">Cumpleaños</option>
          <option value="aniversario">Aniversario</option>
          <option value="cita">Cita romántica</option>
          <option value="negocios">Cena de negocios</option>
          <option value="celebracion">Celebración</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div className="grupo-campo">
        <label className="etiqueta-campo" htmlFor="comentarios">Comentarios Adicionales</label>
        <textarea 
          id="comentarios"
          className="campo-textarea" 
          placeholder="Alguna preferencia especial, alergias alimentarias, etc."
          rows={3}
        ></textarea>
      </div>

      <button type="submit" className="boton-enviar-reserva">
        Confirmar Reserva
      </button>

      <p className="nota-confirmacion">
        * Recibirás una confirmación por teléfono en los próximos 30 minutos
      </p>
    </form>
  );
}
