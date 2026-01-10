import { useState, useEffect, useCallback } from "react";
import { apiService } from "../../services/ApiService";
import type { Mesa, MesaDisponible, FormChangeEvent, FormSubmitEvent } from "../../types";
import "../../css/user/Reservas.css";

interface ReservaConfirmada {
  id_reserva: number;
  nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  mesa_numero: number;
}

export default function ReservaFormConAPI() {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    id_cliente: 1,
    id_mesa: '' as number | string,
    fecha: '',
    hora_inicio: '',
    numero_personas: 2,
    ocasion_especial: '',
    comentarios: ''
  });
  
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesasDisponibles, setMesasDisponibles] = useState<MesaDisponible[]>([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);
  const [loadingMesas, setLoadingMesas] = useState(true);
  const [reservaConfirmada, setReservaConfirmada] = useState<ReservaConfirmada | null>(null);

  // Cargar mesas al montar el componente
  useEffect(() => {
    const cargarMesas = async () => {
      try {
        setLoadingMesas(true);
        const mesasData = await apiService.getMesas();
        setMesas(mesasData);
      } catch (error) {
        console.error('Error cargando mesas:', error);
        setMensaje({ tipo: 'error', texto: 'Error al cargar las mesas disponibles' });
      } finally {
        setLoadingMesas(false);
      }
    };

    cargarMesas();
  }, []);

  // Cargar disponibilidad cuando cambia fecha o número de personas
  const cargarDisponibilidad = useCallback(async (fecha: string, personas: number) => {
    if (!fecha) return;
    
    setVerificandoDisponibilidad(true);
    try {
      const disponibilidad = await apiService.getDisponibilidad(fecha, personas);
      setMesasDisponibles(disponibilidad.mesas_disponibles || []);
      
      // Seleccionar primera mesa disponible
      if (disponibilidad.mesas_disponibles?.length > 0) {
        const primeraMesa = disponibilidad.mesas_disponibles[0];
        setFormData(prev => ({ ...prev, id_mesa: primeraMesa.mesa_id }));
        setHorariosDisponibles(primeraMesa.horarios_disponibles || []);
      } else {
        setHorariosDisponibles([]);
        setMensaje({ 
          tipo: 'info', 
          texto: 'No hay mesas disponibles para esta fecha y número de personas. Intenta otra fecha.' 
        });
      }
    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
      // Fallback a mesas normales si el endpoint no está disponible
      const mesasCompatibles = mesas.filter(m => 
        m.capacidad >= personas && (m.estado === 'disponible' || m.estado === 'libre')
      );
      if (mesasCompatibles.length > 0) {
        const primeraMesa = mesasCompatibles[0];
        setFormData(prev => ({ ...prev, id_mesa: primeraMesa.id || primeraMesa.id_mesa || '' }));
      }
    } finally {
      setVerificandoDisponibilidad(false);
    }
  }, [mesas]);

  // Efecto para cargar disponibilidad cuando cambia fecha o personas
  useEffect(() => {
    if (formData.fecha && formData.numero_personas) {
      cargarDisponibilidad(formData.fecha, formData.numero_personas);
    }
  }, [formData.fecha, formData.numero_personas, cargarDisponibilidad]);

  // Actualizar horarios cuando cambia la mesa seleccionada
  useEffect(() => {
    if (formData.id_mesa && mesasDisponibles.length > 0) {
      const mesaSeleccionada = mesasDisponibles.find(
        m => m.mesa_id === Number(formData.id_mesa)
      );
      if (mesaSeleccionada) {
        setHorariosDisponibles(mesaSeleccionada.horarios_disponibles || []);
      }
    }
  }, [formData.id_mesa, mesasDisponibles]);

  const handleChange = (e: FormChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numero_personas' ? parseInt(value) : value
    }));
    
    // Limpiar mensaje cuando el usuario modifica el formulario
    if (mensaje?.tipo === 'error') {
      setMensaje(null);
    }
  };

  const handleSubmit = async (e: FormSubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);
    setReservaConfirmada(null);

    try {
      // Validaciones del lado del cliente
      const errores: string[] = [];
      
      if (!formData.nombre?.trim()) errores.push('nombre');
      if (!formData.telefono?.trim()) errores.push('teléfono');
      if (!formData.email?.trim()) errores.push('email');
      if (!formData.id_mesa) errores.push('mesa');
      if (!formData.fecha) errores.push('fecha');
      if (!formData.hora_inicio) errores.push('hora');

      if (errores.length > 0) {
        setMensaje({ 
          tipo: 'error', 
          texto: `Por favor completa los campos: ${errores.join(', ')}` 
        });
        setLoading(false);
        return;
      }

      // Validar fecha no sea en el pasado
      const fechaSeleccionada = new Date(formData.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaSeleccionada < hoy) {
        setMensaje({ tipo: 'error', texto: 'No puedes hacer reservas para fechas pasadas' });
        setLoading(false);
        return;
      }

      const idMesaNumero = typeof formData.id_mesa === 'string' 
        ? parseInt(formData.id_mesa, 10) 
        : formData.id_mesa;

      // Obtener número de mesa para mostrar en confirmación
      const mesaInfo = mesas.find(m => (m.id || m.id_mesa) === idMesaNumero);

      const reservaData = {
        id_cliente: formData.id_cliente || 1,
        id_mesa: idMesaNumero,
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio,
        // hora_fin se calcula automáticamente en el backend (2 horas)
        estado: 'pendiente',
        nombre: formData.nombre,
        telefono: formData.telefono,
        email: formData.email,
        numero_personas: formData.numero_personas,
        ocasion_especial: formData.ocasion_especial,
        comentarios: formData.comentarios
      };
      
      const resultado = await apiService.crearReserva(reservaData);
      
      // Mostrar confirmación con detalles
      setReservaConfirmada({
        id_reserva: resultado.id_reserva,
        nombre: resultado.nombre,
        fecha: resultado.fecha,
        hora_inicio: resultado.hora_inicio,
        hora_fin: resultado.hora_fin,
        mesa_numero: mesaInfo?.numero || idMesaNumero
      });
      
      setMensaje({ 
        tipo: 'exito', 
        texto: `¡Reserva #${resultado.id_reserva} creada exitosamente!` 
      });
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        id_cliente: 1,
        id_mesa: '',
        fecha: '',
        hora_inicio: '',
        numero_personas: 2,
        ocasion_especial: '',
        comentarios: ''
      });
      setMesasDisponibles([]);
      setHorariosDisponibles([]);

    } catch (error: unknown) {
      console.error('Error creando reserva:', error);
      
      // Manejar errores específicos del backend
      let mensajeError = 'Error al crear la reserva. Intenta de nuevo.';
      
      try {
        const errorBody = error instanceof Error ? error.message : String(error);
        if (errorBody.includes('Conflicto de horario') || errorBody.includes('409')) {
          mensajeError = 'Esta mesa ya está reservada en ese horario. Por favor selecciona otro horario.';
        } else if (errorBody.includes('Faltan campos')) {
          mensajeError = 'Por favor completa todos los campos requeridos.';
        } else if (errorBody.includes('Estado inválido')) {
          mensajeError = 'Error interno. Contacta al restaurante.';
        }
      } catch {
        // Usar mensaje por defecto
      }
      
      setMensaje({ tipo: 'error', texto: mensajeError });
    } finally {
      setLoading(false);
    }
  };

  // Si hay reserva confirmada, mostrar resumen
  if (reservaConfirmada) {
    return (
      <div className="reserva-confirmada">
        <div className="confirmacion-icono">
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-success)' }}>
            check_circle
          </span>
        </div>
        <h3 className="confirmacion-titulo">¡Reserva Confirmada!</h3>
        <div className="confirmacion-detalles">
          <p><strong>Número de reserva:</strong> #{reservaConfirmada.id_reserva}</p>
          <p><strong>Nombre:</strong> {reservaConfirmada.nombre}</p>
          <p><strong>Fecha:</strong> {new Date(reservaConfirmada.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Horario:</strong> {reservaConfirmada.hora_inicio} - {reservaConfirmada.hora_fin}</p>
          <p><strong>Mesa:</strong> #{reservaConfirmada.mesa_numero}</p>
        </div>
        <p className="confirmacion-nota">
          Te contactaremos para confirmar tu reserva. Recuerda llegar máximo 15 minutos después de tu hora.
        </p>
        <button 
          type="button" 
          className="boton-enviar-reserva"
          onClick={() => setReservaConfirmada(null)}
        >
          Hacer otra reserva
        </button>
      </div>
    );
  }

  return (
    <>
      {mensaje && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.tipo === 'exito' && <span className="material-symbols-outlined">check_circle</span>}
          {mensaje.tipo === 'error' && <span className="material-symbols-outlined">error</span>}
          {mensaje.tipo === 'info' && <span className="material-symbols-outlined">info</span>}
          <span>{mensaje.texto}</span>
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

        <div className="grupo-campo">
          <label className="etiqueta-campo" htmlFor="id_mesa">
            Mesa 
            {verificandoDisponibilidad && <span className="loading-inline"> (verificando...)</span>}
          </label>
          {loadingMesas ? (
            <div className="loading-mesas">Cargando mesas...</div>
          ) : mesasDisponibles.length > 0 ? (
            <select 
              id="id_mesa" 
              name="id_mesa"
              className="campo-seleccion"
              value={formData.id_mesa}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona una mesa</option>
              {mesasDisponibles.map((mesa) => (
                <option key={mesa.mesa_id} value={mesa.mesa_id}>
                  Mesa {mesa.numero} ({mesa.capacidad} personas) - {mesa.horarios_disponibles.length} horarios libres
                </option>
              ))}
            </select>
          ) : formData.fecha ? (
            <div className="no-disponibilidad">
              No hay mesas disponibles para {formData.numero_personas} personas en esta fecha
            </div>
          ) : (
            <select 
              id="id_mesa" 
              name="id_mesa"
              className="campo-seleccion"
              value={formData.id_mesa}
              onChange={handleChange}
              disabled
            >
              <option value="">Primero selecciona fecha y personas</option>
            </select>
          )}
        </div>

        <div className="grupo-campo">
          <label className="etiqueta-campo" htmlFor="hora_inicio">Hora de Reserva</label>
          {horariosDisponibles.length > 0 ? (
            <select 
              id="hora_inicio"
              name="hora_inicio"
              className="campo-seleccion"
              value={formData.hora_inicio}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un horario</option>
              {horariosDisponibles.map((hora) => (
                <option key={hora} value={hora}>
                  {hora} (reserva de 2 horas)
                </option>
              ))}
            </select>
          ) : (
            <input 
              type="time" 
              id="hora_inicio"
              name="hora_inicio"
              className="campo-entrada"
              value={formData.hora_inicio}
              onChange={handleChange}
              min="11:00"
              max="21:00"
              required
            />
          )}
          <small className="campo-ayuda">La reserva dura 2 horas</small>
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
          Te contactaremos para confirmar tu reserva
        </p>
      </form>
    </>
  );
}